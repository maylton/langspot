"""Keep the teacher's lessons in the desktop calendar.

The app writes a standard iCalendar file and points the desktop at it:

- every shell: ``$XDG_DATA_HOME/calendars/langspot/aulas.ics`` (a vdir-style collection, the
  folder khal/vdirsyncer use and the Caelestia dashboard reads);
- GNOME: an Evolution Data Server source (local backend, custom file, reloaded on change), so the
  GNOME Shell clock, GNOME Calendar and Evolution show the lessons;
- KDE: an Akonadi iCal resource watching the file, so the Plasma clock (PIM events plugin),
  Merkuro and KOrganizer show the lessons.

Everything is read-only for the desktop: lessons are edited in LangSpot.
"""
from __future__ import annotations

import os
import shutil
from datetime import datetime, timedelta, timezone
from pathlib import Path

from langspot_linux import model

CALENDAR_NAME = 'LangSpot — Aulas'
EDS_SOURCE_NAME = 'langspot-aulas.source'
AKONADI_AGENT = 'akonadi_ical_resource'
COLOR = '#2563eb'
PAST_DAYS = 60


def _xdg(variable: str, fallback: str) -> Path:
    value = os.environ.get(variable)
    return Path(value) if value else Path.home() / fallback


def ics_path() -> Path:
    return _xdg('XDG_DATA_HOME', '.local/share') / 'calendars' / 'langspot' / 'aulas.ics'


def eds_source_path() -> Path:
    return _xdg('XDG_CONFIG_HOME', '.config') / 'evolution' / 'sources' / EDS_SOURCE_NAME


# ---------------------------------------------------------------------- iCalendar
def _escape(text: str) -> str:
    return text.replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\r\n', '\n').replace('\n', '\\n')


def _fold(line: str) -> list[str]:
    """RFC 5545 folding: at most 75 octets per line, continuation lines start with a space."""
    out, current, size = [], '', 0
    for char in line:
        length = len(char.encode('utf-8'))
        if size + length > (75 if not out else 74):
            out.append(current)
            current, size = '', 0
        current += char
        size += length
    out.append(current)
    return [out[0]] + [' ' + part for part in out[1:]]


def _stamp(moment: datetime) -> str:
    return moment.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')


def lesson_event(lesson: model.Lesson, now: datetime) -> list[str]:
    description = [f'Aluno: {lesson.student_name}', f'Situação: {lesson.status_label}']
    if lesson.online_url:
        description.append(f'Sala online: {lesson.online_url}')
    if lesson.homework.strip() and lesson.status == 'completed':
        description.append(f'Tarefa de casa: {lesson.homework.strip()}')
    lines = ['BEGIN:VEVENT', f'UID:lesson-{lesson.id}@langspot.app', f'DTSTAMP:{_stamp(now)}',
             f'DTSTART:{_stamp(lesson.starts_at)}', f'DTEND:{_stamp(lesson.ends_at)}',
             f'SUMMARY:{_escape(f"Aula: {lesson.student_name} · {lesson.topic}")}',
             f'DESCRIPTION:{_escape(chr(10).join(description))}', 'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'CATEGORIES:LangSpot']
    if lesson.online_url:
        lines += [f'LOCATION:{_escape(lesson.online_url)}', f'URL:{lesson.online_url}']
    lines.append('END:VEVENT')
    return lines


def build_ics(lessons: list[model.Lesson], now: datetime | None = None) -> str:
    """Scheduled and completed lessons from the last PAST_DAYS days on (cancelled ones leave the calendar)."""
    now = now or datetime.now(timezone.utc)
    since = now - timedelta(days=PAST_DAYS)
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LangSpot//Teacher Linux//PT-BR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
             f'X-WR-CALNAME:{_escape(CALENDAR_NAME)}', f'X-APPLE-CALENDAR-COLOR:{COLOR}']
    for lesson in sorted(lessons, key=lambda item: (item.starts_at, item.id)):
        if lesson.status != 'cancelled' and lesson.starts_at >= since:
            lines += lesson_event(lesson, now)
    lines.append('END:VCALENDAR')
    return ''.join(part + '\r\n' for line in lines for part in _fold(line))


def _without_stamps(text: str) -> str:
    return '\n'.join(line for line in text.splitlines() if not line.startswith('DTSTAMP:'))


def write_ics(lessons: list[model.Lesson], path: Path | None = None) -> bool:
    """Atomically (re)write the calendar file; returns False when nothing changed."""
    path = path or ics_path()
    content = build_ics(lessons)
    try:
        if _without_stamps(path.read_text(encoding='utf-8')) == _without_stamps(content):
            return False
    except OSError:
        pass
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f'.{path.name}.tmp')
    temporary.write_text(content, encoding='utf-8', newline='')
    os.replace(temporary, path)
    return True


# ---------------------------------------------------------------------- GNOME (Evolution Data Server)
def eds_source(path: Path) -> str:
    return '\n'.join([
        '[Data Source]', f'DisplayName={CALENDAR_NAME}', 'Enabled=true', 'Parent=local-stub', '',
        '[Calendar]', 'BackendName=local', f'Color={COLOR}', 'Selected=true', '',
        '[Local Backend]', f'CustomFile={path}', 'Writable=false', '',
        '[Refresh]', 'Enabled=true', 'IntervalMinutes=5', '',
        '[Offline]', 'StaySynchronized=true', '',
    ])


def install_eds(path: Path | None = None) -> None:
    source = eds_source_path()
    source.parent.mkdir(parents=True, exist_ok=True)
    content = eds_source(path or ics_path())
    try:
        if source.read_text(encoding='utf-8') == content:
            return
    except OSError:
        pass
    source.write_text(content, encoding='utf-8')


def remove_eds() -> None:
    eds_source_path().unlink(missing_ok=True)


# ---------------------------------------------------------------------- desktop detection and D-Bus
def _session_bus():
    from gi.repository import Gio
    return Gio.bus_get_sync(Gio.BusType.SESSION, None)


def _call(bus, name: str, path: str, interface: str, method: str, args=None, reply: str | None = None):
    from gi.repository import Gio, GLib
    result = bus.call_sync(name, path, interface, method, args, GLib.VariantType.new(reply) if reply else None,
                           Gio.DBusCallFlags.NONE, 10000, None)
    return result.unpack() if result is not None else None


def _bus_names(bus) -> tuple[set[str], set[str]]:
    owned = _call(bus, 'org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus', 'ListNames', None, '(as)')[0]
    activatable = _call(bus, 'org.freedesktop.DBus', '/org/freedesktop/DBus', 'org.freedesktop.DBus', 'ListActivatableNames', None, '(as)')[0]
    return set(owned), set(activatable)


def has_eds(names: tuple[set[str], set[str]]) -> bool:
    owned, activatable = names
    return any(name.startswith('org.gnome.evolution.dataserver.Sources') for name in owned | activatable)


def has_akonadi(names: tuple[set[str], set[str]]) -> bool:
    return 'org.freedesktop.Akonadi.Control' in names[0]


def has_caelestia() -> bool:
    return bool(shutil.which('caelestia')) or (_xdg('XDG_CONFIG_HOME', '.config') / 'quickshell' / 'caelestia').exists()


def install_akonadi(existing: str | None, path: Path | None = None) -> str:
    """Create (or reuse) an Akonadi iCal resource watching the file; returns the instance id."""
    import time

    from gi.repository import GLib
    bus = _session_bus()
    manager = ('org.freedesktop.Akonadi.Control', '/AgentManager', 'org.freedesktop.Akonadi.AgentManager')
    instances = _call(bus, *manager, 'agentInstances', None, '(as)')[0]
    if existing and existing in instances:
        return existing
    instance = _call(bus, *manager, 'createAgentInstance', GLib.Variant('(s)', (AKONADI_AGENT,)), '(s)')[0]
    service = f'org.freedesktop.Akonadi.Resource.{instance}'
    for _ in range(50):
        if service in _bus_names(bus)[0]:
            break
        time.sleep(0.2)
    settings = (service, '/Settings', 'org.kde.Akonadi.ICal.Settings')
    _call(bus, *settings, 'setPath', GLib.Variant('(s)', (str(path or ics_path()),)))
    _call(bus, *settings, 'setDisplayName', GLib.Variant('(s)', (CALENDAR_NAME,)))
    _call(bus, *settings, 'setReadOnly', GLib.Variant('(b)', (True,)))
    _call(bus, *settings, 'setMonitorFile', GLib.Variant('(b)', (True,)))
    _call(bus, *settings, 'save')
    _call(bus, service, '/', 'org.freedesktop.Akonadi.Resource', 'setName', GLib.Variant('(s)', (CALENDAR_NAME,)))
    _call(bus, service, '/', 'org.freedesktop.Akonadi.Agent.Control', 'reconfigure')
    _call(bus, *manager, 'agentInstanceSynchronize', GLib.Variant('(s)', (instance,)))
    return instance


def remove_akonadi(instance: str) -> None:
    from gi.repository import GLib
    bus = _session_bus()
    _call(bus, 'org.freedesktop.Akonadi.Control', '/AgentManager', 'org.freedesktop.Akonadi.AgentManager', 'removeAgentInstance',
          GLib.Variant('(s)', (instance,)))


def enable(lessons: list[model.Lesson], akonadi_instance: str | None) -> tuple[list[str], str | None]:
    """Write the file and connect every desktop found. Returns (connected desktops, Akonadi instance)."""
    write_ics(lessons)
    connected: list[str] = []
    try:
        names = _bus_names(_session_bus())
    except Exception:
        names = (set(), set())
    if has_eds(names):
        install_eds()
        connected.append('GNOME')
    if has_akonadi(names):
        try:
            akonadi_instance = install_akonadi(akonadi_instance)
            connected.append('KDE')
        except Exception:
            pass
    if has_caelestia():
        connected.append('Caelestia')
    return connected, akonadi_instance


def disable(akonadi_instance: str | None) -> None:
    remove_eds()
    if akonadi_instance:
        try:
            remove_akonadi(akonadi_instance)
        except Exception:
            pass
    path = ics_path()
    path.unlink(missing_ok=True)
    try:
        path.parent.rmdir()
    except OSError:
        pass

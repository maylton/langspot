from __future__ import annotations

import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

from langspot_linux import calendar_sync, model

NOW = datetime(2026, 11, 12, 15, 0, tzinfo=timezone.utc)


def lesson(lesson_id: str, hours: float, status: str = 'scheduled', topic: str = 'Conditionals', url: str = '') -> model.Lesson:
    return model.Lesson(id=lesson_id, student_id='st', student_name='Ana Souza', starts_at=NOW + timedelta(hours=hours), duration=60,
                        topic=topic, online_url=url, status=status)


def unfold(text: str) -> list[str]:
    lines: list[str] = []
    for line in text.split('\r\n'):
        if line.startswith(' '):
            lines[-1] += line[1:]
        elif line:
            lines.append(line)
    return lines


class IcsTest(unittest.TestCase):
    def test_events_and_fields(self) -> None:
        text = calendar_sync.build_ics([lesson('l2', 26, url='https://meet.example.com/a'), lesson('l1', 2), lesson('l3', 5, status='cancelled')], NOW)
        lines = unfold(text)
        self.assertEqual(lines[0], 'BEGIN:VCALENDAR')
        self.assertEqual(lines[-1], 'END:VCALENDAR')
        uids = [line for line in lines if line.startswith('UID:')]
        self.assertEqual(uids, ['UID:lesson-l1@langspot.app', 'UID:lesson-l2@langspot.app'])  # sorted, cancelled left out
        self.assertIn('DTSTART:20261112T170000Z', lines)
        self.assertIn('DTEND:20261112T180000Z', lines)
        self.assertIn('LOCATION:https://meet.example.com/a', lines)
        self.assertIn('SUMMARY:Aula: Ana Souza · Conditionals', lines)

    def test_old_lessons_leave_the_calendar(self) -> None:
        text = calendar_sync.build_ics([lesson('old', -24 * (calendar_sync.PAST_DAYS + 1), status='completed'), lesson('recent', -48, status='completed')], NOW)
        self.assertNotIn('lesson-old@', text)
        self.assertIn('lesson-recent@', text)

    def test_escaping_and_folding(self) -> None:
        topic = 'Phrasal verbs; plans, goals \\ habits ' + 'é' * 80
        text = calendar_sync.build_ics([lesson('l1', 1, topic=topic)], NOW)
        for line in text.split('\r\n'):
            self.assertLessEqual(len(line.encode('utf-8')), 75)
        summary = next(line for line in unfold(text) if line.startswith('SUMMARY:'))
        self.assertEqual(summary, 'SUMMARY:Aula: Ana Souza · Phrasal verbs\\; plans\\, goals \\\\ habits ' + 'é' * 80)
        description = next(line for line in unfold(text) if line.startswith('DESCRIPTION:'))
        self.assertIn('\\n', description)
        self.assertNotIn('\n', description)


class FilesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.dir = tempfile.TemporaryDirectory()
        patcher = mock.patch.dict(os.environ, {'XDG_DATA_HOME': f'{self.dir.name}/data', 'XDG_CONFIG_HOME': f'{self.dir.name}/config'})
        patcher.start()
        self.addCleanup(patcher.stop)
        self.addCleanup(self.dir.cleanup)

    def test_write_only_when_lessons_change(self) -> None:
        path = calendar_sync.ics_path()
        self.assertEqual(path, Path(self.dir.name) / 'data/calendars/langspot/aulas.ics')
        self.assertTrue(calendar_sync.write_ics([lesson('l1', 2)]))
        self.assertFalse(calendar_sync.write_ics([lesson('l1', 2)]))  # only DTSTAMP would differ
        self.assertTrue(calendar_sync.write_ics([lesson('l1', 3)]))
        self.assertFalse(any(path.parent.glob('.*.tmp')))

    def test_gnome_source_points_at_the_file(self) -> None:
        calendar_sync.install_eds()
        source = calendar_sync.eds_source_path().read_text()
        self.assertIn('BackendName=local', source)
        self.assertIn(f'CustomFile={calendar_sync.ics_path()}', source)
        self.assertIn('[Refresh]\nEnabled=true', source)

    def test_enable_and_disable(self) -> None:
        with mock.patch.object(calendar_sync, '_bus_names', return_value=({'org.freedesktop.DBus'}, {'org.gnome.evolution.dataserver.Sources5'})), \
                mock.patch.object(calendar_sync, '_session_bus', return_value=None), \
                mock.patch.object(calendar_sync, 'has_caelestia', return_value=True):
            connected, instance = calendar_sync.enable([lesson('l1', 2)], None)
        self.assertEqual(connected, ['GNOME', 'Caelestia'])
        self.assertIsNone(instance)
        self.assertTrue(calendar_sync.ics_path().exists())
        self.assertTrue(calendar_sync.eds_source_path().exists())
        calendar_sync.disable(None)
        self.assertFalse(calendar_sync.ics_path().exists())
        self.assertFalse(calendar_sync.ics_path().parent.exists())
        self.assertFalse(calendar_sync.eds_source_path().exists())

    def test_kde_is_connected_through_akonadi(self) -> None:
        with mock.patch.object(calendar_sync, '_bus_names', return_value=({'org.freedesktop.Akonadi.Control'}, set())), \
                mock.patch.object(calendar_sync, '_session_bus', return_value=None), \
                mock.patch.object(calendar_sync, 'has_caelestia', return_value=False), \
                mock.patch.object(calendar_sync, 'install_akonadi', return_value='akonadi_ical_resource_2') as install:
            connected, instance = calendar_sync.enable([], 'akonadi_ical_resource_2')
        install.assert_called_once_with('akonadi_ical_resource_2')
        self.assertEqual((connected, instance), (['KDE'], 'akonadi_ical_resource_2'))


if __name__ == '__main__':
    unittest.main()

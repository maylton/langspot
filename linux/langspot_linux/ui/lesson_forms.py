"""Lesson form pieces shared by the agenda and the student profile."""
from __future__ import annotations

from datetime import datetime
from typing import Callable

from gi.repository import Adw, Gtk

from langspot_linux import model
from langspot_linux.ui.common import date_row, form_dialog, text_view
from langspot_linux.worker import run_async


def time_rows(starts: datetime | None) -> tuple[Adw.SpinRow, Adw.SpinRow]:
    hour = Adw.SpinRow.new_with_range(0, 23, 1)
    hour.set_title('Hora')
    hour.set_value(starts.hour if starts else 19)
    minute = Adw.SpinRow.new_with_range(0, 55, 5)
    minute.set_title('Minutos')
    minute.set_value((starts.minute // 5) * 5 if starts else 0)
    return hour, minute


def duration_row(current: int) -> Adw.ComboRow:
    options = model.DURATIONS if current in model.DURATIONS else sorted({*model.DURATIONS, current})
    row = Adw.ComboRow(title='Duração', model=Gtk.StringList.new([f'{value} minutos' for value in options]))
    row.set_selected(options.index(current))
    row.options = options  # type: ignore[attr-defined]
    return row


def lesson_defaults(window) -> tuple[int, str]:
    """(duration, online link) from Configurações, as the website's lesson defaults."""
    prefs = window.app.prefs
    duration = prefs.get('defaultDuration', 60)
    return (duration if isinstance(duration, int) and duration > 0 else 60), prefs.get('defaultOnlineUrl', '') or ''


def record_lesson(window, lesson: model.Lesson, student: dict, on_done: Callable[[], None]) -> None:
    """Complete a scheduled lesson, edit a record, or (lesson.id == '') register a new lesson for the student.

    Same as the web app: saves the lesson record (lessonRecordToDb) and the student's skills.
    """
    client = window.client
    creating = not lesson.id
    completing = lesson.status == 'scheduled' and not creating
    title = 'Registrar aula' if creating else 'Concluir aula' if completing else 'Editar registro'
    dialog, page, save = form_dialog(window, f'{title} · {lesson.student_name}',
                                     'Registrar aula' if creating else 'Concluir e registrar' if completing else 'Salvar registro', width=560)
    group = Adw.PreferencesGroup()
    when, when_value = date_row('Data', lesson.starts_at.date())
    hour, minute = time_rows(lesson.starts_at)
    duration = duration_row(lesson.duration)
    topic = Adw.EntryRow(title='Tema da aula', text=lesson.topic)
    link = Adw.EntryRow(title='Link da sala online', text=lesson.online_url)
    attendance_values = list(model.ATTENDANCE_LABELS)
    attendance = Adw.ComboRow(title='Presença', model=Gtk.StringList.new(list(model.ATTENDANCE_LABELS.values())))
    attendance.set_selected(attendance_values.index(lesson.attendance) if lesson.attendance in attendance_values else 0)
    for row in (when, hour, minute, duration, topic, link, attendance):
        group.add(row)
    page.add(group)

    texts = {}
    for key, heading, current in (('notes', 'Resumo da aula', lesson.notes), ('strengths', 'Pontos fortes', lesson.strengths),
                                  ('improvements', 'Pontos a melhorar', lesson.improvements), ('homework', 'Tarefa de casa', lesson.homework)):
        text_group = Adw.PreferencesGroup(title=heading)
        frame, value = text_view(current if current.strip() else model.RECORD_TEMPLATES[key], 140)
        text_group.add(frame)
        page.add(text_group)
        texts[key] = value

    skills_group = Adw.PreferencesGroup(title='Habilidades nesta aula', description='Atualiza também o perfil do aluno (0 a 100).')
    base = {**{skill: 50 for skill in model.SKILLS}, **{key: float(value) for key, value in (student.get('skills') or {}).items() if key in model.SKILLS},
            **{key: float(value) for key, value in (lesson.skill_scores or {}).items() if key in model.SKILLS}}
    scales = {}
    for skill in model.SKILLS:
        row = Adw.ActionRow(title=skill)
        scale = Gtk.Scale.new_with_range(Gtk.Orientation.HORIZONTAL, 0, 100, 1)
        scale.set_value(base[skill])
        scale.set_size_request(220, -1)
        scale.set_draw_value(True)
        scale.set_digits(0)
        scale.set_value_pos(Gtk.PositionType.RIGHT)
        row.add_suffix(scale)
        scales[skill] = scale
        skills_group.add(row)
    page.add(skills_group)

    def submit(*_):
        if not topic.get_text().strip():
            dialog.show_error('Escreva o tema da aula.')
            return
        chosen = when_value()
        starts = datetime(chosen.year, chosen.month, chosen.day, int(hour.get_value()), int(minute.get_value())).astimezone()
        skills = {skill: round(scale.get_value()) for skill, scale in scales.items()}
        values = model.lesson_record_values(starts, duration.options[duration.get_selected()], topic.get_text().strip(), link.get_text().strip(),
                                            attendance_values[attendance.get_selected()], {key: value() for key, value in texts.items()}, skills)
        save.set_sensitive(False)
        teacher = window.profile['id']

        def work():
            if creating:
                client.insert('lessons', {'teacher_id': teacher, 'student_id': lesson.student_id, **values})
            else:
                client.update('lessons', values, id=f'eq.{lesson.id}')
            client.update('student_records', {'skills': skills}, student_id=f'eq.{lesson.student_id}', teacher_id=f'eq.{teacher}')

        def done(_r) -> None:
            dialog.close()
            window.toast('Aula registrada.' if creating else 'Aula concluída e registrada.' if completing else 'Registro atualizado.')
            on_done()

        def failed(error: Exception) -> None:
            save.set_sensitive(True)
            dialog.show_error(str(error))
        run_async(work, done, failed)
    save.connect('clicked', submit)
    dialog.present(window)

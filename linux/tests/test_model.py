import unittest
from datetime import date, datetime, timedelta, timezone

from langspot_linux import model

NOW = datetime(2026, 11, 12, 15, 0, tzinfo=timezone.utc)


def ago(seconds):
    return (NOW - timedelta(seconds=seconds)).isoformat()


class DatesTest(unittest.TestCase):
    def test_parse_postgres_timestamps(self):
        self.assertEqual(model.parse_time('2026-11-11 19:50:34.69602+00').minute, 50)
        self.assertEqual(model.parse_time('2026-11-11T19:50:34Z').tzinfo, timezone.utc)
        self.assertIsNone(model.parse_time('not a date'))

    def test_relative_time(self):
        self.assertEqual(model.relative_time(ago(10), NOW), 'agora')
        self.assertEqual(model.relative_time(ago(300), NOW), 'há 5 min')
        self.assertEqual(model.relative_time(ago(3900), NOW), 'há 1 h 5 min')
        self.assertEqual(model.relative_time(ago(2 * 86400), NOW), 'há 2 dias')
        self.assertEqual(model.relative_time(None, NOW), '—')

    def test_day_labels(self):
        today = date(2026, 11, 12)
        self.assertEqual(model.day_label(today, today), 'Hoje')
        self.assertEqual(model.day_label(date(2026, 11, 13), today), 'Amanhã')
        self.assertEqual(model.day_label(date(2026, 11, 16), today), 'Segunda, 16 nov')

    def test_clock(self):
        self.assertEqual(model.clock(419), '06:59')
        self.assertEqual(model.clock(3725), '1:02:05')
        self.assertEqual(model.clock(None), 'sem limite')


class LessonsTest(unittest.TestCase):
    def test_rows_become_sorted_lessons_grouped_by_day(self):
        rows = [
            {'id': '2', 'student_id': 's', 'starts_at': '2026-11-13T18:00:00+00:00', 'duration_minutes': 60, 'topic': 'Conditionals', 'status': 'scheduled'},
            {'id': '1', 'student_id': 's', 'starts_at': '2026-11-12T18:00:00+00:00', 'duration_minutes': 45, 'topic': None, 'status': 'completed'},
        ]
        lessons = model.lessons_from_rows(rows, {'s': 'Mateus'})
        self.assertEqual([lesson.id for lesson in lessons], ['1', '2'])
        self.assertEqual(lessons[0].topic, 'Aula')
        self.assertEqual(lessons[0].status_label, 'Concluída')
        self.assertEqual(lessons[0].ends_at - lessons[0].starts_at, timedelta(minutes=45))
        self.assertEqual(len(model.group_by_day(lessons)), 2)

    def test_initials(self):
        self.assertEqual(model.initials('Mateus Targino Luna'), 'ML')
        self.assertEqual(model.initials('Lucas'), 'L')
        self.assertEqual(model.initials(''), '?')


class GradingTest(unittest.TestCase):
    criteria = [{'key': 'task_achievement', 'maxScore': 11}, {'key': 'range', 'maxScore': 11}]

    def test_rubric_score_matches_the_web_app(self):
        self.assertAlmostEqual(model.rubric_score(self.criteria, {'task_achievement': 5, 'range': 4}, 1), 9 / 22, places=4)

    def test_missing_level_is_an_error(self):
        with self.assertRaisesRegex(ValueError, 'Repertório'):
            model.rubric_score(self.criteria, {'task_achievement': 5}, 1)

    def test_labels_and_counts(self):
        self.assertEqual(model.criterion_label({'key': 'accuracy_of_meaning'}), 'Precisão do significado')
        self.assertEqual(model.word_count("I think it's better, não?"), 5)
        self.assertEqual(model.student_section_title('PART 1 — Reading · Target B1 · R-B1-002'), 'Parte 1 — Reading')
        self.assertEqual(model.teacher_section_detail('PART 1 — Reading · Target B1 · R-B1-002'), 'Target B1 · R-B1-002')
        events = [{'type': 'recording_discarded', 'metadata': {'questionId': 'q'}}, {'type': 'tab_blur', 'metadata': {}}]
        self.assertEqual(model.discarded_recordings(events, 'q'), 1)


class LiveTest(unittest.TestCase):
    def status(self, **attempt):
        return {
            'attempt': {'status': 'in_progress', 'viewingQuestionId': 'r2', **attempt},
            'assessment': {'sectionPacing': True},
            'sections': [
                {'id': 'reading', 'title': 'PART 1 — Reading · Target B1', 'position': 1, 'startedAt': ago(1800), 'expiresAt': (NOW + timedelta(seconds=300)).isoformat()},
                {'id': 'lu', 'title': 'PART 2 — Language Use · Target B1', 'position': 2},
                {'id': 'si', 'title': 'PART 5 — Spoken Interaction', 'position': 3},
                {'id': 'prior', 'title': 'PART 0 — Warm-up', 'position': 0, 'startedAt': ago(3500), 'completedAt': ago(3000)},
            ],
            'questions': [
                {'id': 'w1', 'sectionId': 'prior', 'answered': True},
                {'id': 'r1', 'sectionId': 'reading', 'answered': True}, {'id': 'r2', 'sectionId': 'reading'}, {'id': 'r3', 'sectionId': 'reading'},
                {'id': 'l1', 'sectionId': 'lu'}, {'id': 'l2', 'sectionId': 'lu'},
                {'id': 's1', 'sectionId': 'si', 'live': True},
            ],
        }

    def test_presence(self):
        self.assertEqual(model.presence_of(ago(30), ago(30), NOW), 'online')
        self.assertEqual(model.presence_of(None, ago(120), NOW), 'recent')
        self.assertEqual(model.presence_of(ago(900), ago(600), NOW), 'away')

    def test_stages_follow_the_student(self):
        stages = model.build_stages(self.status(), NOW)
        self.assertEqual([(stage.section['id'], stage.number, stage.state) for stage in stages],
                         [('prior', 1, 'done'), ('reading', 2, 'current'), ('lu', 3, 'pending'), ('si', None, 'teacher')])
        self.assertEqual(stages[1].seconds_left, 300)
        self.assertEqual(stages[1].student_title, 'Parte 1 — Reading')
        missing = model.missing_summary(stages)
        self.assertEqual([(stage.section['id'], count) for stage, count in missing], [('reading', 2), ('lu', 2)])

    def test_submitted_attempt_is_done(self):
        stages = model.build_stages(self.status(status='grading', viewingQuestionId=None), NOW)
        self.assertTrue(all(stage.state in ('done', 'teacher') for stage in stages))

    def test_event_detail(self):
        self.assertEqual(model.event_detail({'type': 'tab_focus', 'metadata': {'durationMs': 12400}}), 'fora por 12 s')
        self.assertEqual(model.event_detail({'type': 'paste_detected', 'metadata': {'pasteLength': 80}}), '80 caracteres')


class StudentsTest(unittest.TestCase):
    def test_skills_and_progress(self) -> None:
        self.assertEqual(model.normalize_skills({'Speaking': 120, 'Writing': 'x'})['Speaking'], 100.0)
        self.assertEqual(model.normalize_skills(None)['Grammar'], 50.0)
        self.assertEqual(model.progress_of({'Speaking': 64, 'Writing': 36}), 50)
        self.assertEqual(model.skill_average([{'Speaking': 60}, {'Speaking': 81}], 'Speaking'), 70)
        self.assertEqual(model.skill_average([], 'Speaking'), 0)

    def test_streak(self) -> None:
        today = date(2026, 11, 12)
        self.assertEqual(model.calculate_streak([], today), (0, 0))
        self.assertEqual(model.calculate_streak(['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-12'], today), (3, 3))
        self.assertEqual(model.calculate_streak(['2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-11'], today), (1, 4))
        self.assertEqual(model.calculate_streak(['2026-11-01', '2026-11-02'], today), (0, 2))
        self.assertEqual(model.achievements(7), 2)


if __name__ == '__main__':
    unittest.main()


class MoneyTasksReportsTest(unittest.TestCase):
    def test_money_and_dates(self):
        self.assertEqual(model.money(12345.5), 'R$ 12.345,50')
        self.assertEqual(model.money(80), 'R$ 80,00')
        self.assertEqual(model.short_date('2026-11-05'), '05/11/2026')

    def test_payments(self):
        today = date(2026, 11, 12)
        rows = [{'amount': 200, 'status': 'paid', 'due_date': '2026-11-05'}, {'amount': 150, 'status': 'pending', 'due_date': '2026-11-10'},
                {'amount': 100, 'status': 'pending', 'due_date': '2026-11-20'}]
        self.assertEqual([model.payment_status(row, today) for row in rows], ['paid', 'overdue', 'pending'])
        self.assertEqual(model.payment_totals(rows, today), {'paid': 200.0, 'open': 250.0, 'overdue': 150.0, 'count': 3})

    def test_uploads(self):
        self.assertEqual(model.upload_kind('Aula 3.PDF', 1000), ('application/pdf', 'PDF'))
        self.assertEqual(model.upload_kind('slides.pptx', 1000)[1], 'Apresentação')
        with self.assertRaisesRegex(ValueError, 'PDF, DOCX'):
            model.upload_kind('notes.txt', 10)
        with self.assertRaisesRegex(ValueError, '10 MB'):
            model.upload_kind('big.pdf', 11 * 1024 * 1024)
        self.assertEqual(model.safe_filename('Ação 1 — revisão.pdf'), 'Acao-1---revisao.pdf')

    def test_period_stats_match_the_web_formulas(self):
        def lesson(status, attendance='', duration=60, day=10):
            return model.Lesson(id=status + attendance, student_id='s', student_name='Ana', starts_at=datetime(2026, 11, day, 18, tzinfo=timezone.utc),
                                duration=duration, topic='t', online_url='', status=status, attendance=attendance)
        lessons = [lesson('completed', 'presente'), lesson('completed', 'ausente', 45), lesson('completed', 'presente', 30), lesson('cancelled'), lesson('scheduled')]
        tasks = [{'status': 'reviewed', 'grade': 80, 'created_at': '2026-11-01', 'due_date': '2026-11-08'},
                 {'status': 'submitted', 'grade': None, 'created_at': '2026-11-02', 'due_date': '2026-11-15'},
                 {'status': 'pending', 'created_at': '2026-11-03', 'due_date': '2026-11-20'}]
        stats = model.period_stats(lessons, tasks)
        self.assertEqual((stats.lessons, stats.completed, stats.cancelled, stats.scheduled), (5, 3, 1, 1))
        self.assertEqual((stats.completion_rate, stats.attendance_rate, stats.task_rate, stats.average_grade), (60, 67, 67, 80))
        self.assertEqual(model.study_time(stats.study_minutes), '2h 15min')
        self.assertEqual(len(model.tasks_in_period(tasks, date(2026, 11, 10), date(2026, 11, 30))), 2)
        self.assertEqual(len(model.lessons_in_period(lessons, date(2026, 11, 10), date(2026, 11, 10))), 5)

    def test_report_text_and_month(self):
        stats = model.period_stats([], [])
        text = model.report_text('Ana Souza', 'B1', 'Viagens', {'Speaking': 70, 'Writing': 40}, date(2026, 11, 1), date(2026, 11, 30), stats, ['Boa aula'])
        self.assertIn('Habilidade destaque: Speaking (70%)', text)
        self.assertIn('Ponto de atenção: Writing (40%)', text)
        self.assertIn('Período: 01/11/2026 a 30/11/2026', text)
        self.assertEqual(model.month_range(date(2026, 2, 14)), (date(2026, 2, 1), date(2026, 2, 28)))


class CalendarTest(unittest.TestCase):
    def test_week_and_month_grids(self):
        day = date(2026, 11, 12)  # Thursday
        self.assertEqual(model.week_start(day), date(2026, 11, 9))
        self.assertEqual(model.week_days(day)[-1], date(2026, 11, 15))
        grid = model.month_grid(day)
        self.assertEqual((len(grid), grid[0], grid[-1]), (42, date(2026, 10, 26), date(2026, 12, 6)))
        self.assertEqual(model.period_label('week', day), '9–15 de novembro de 2026')
        self.assertEqual(model.period_label('week', date(2026, 12, 30)), '28 dez – 3 jan 2027')
        self.assertEqual(model.period_label('month', day), 'Novembro de 2026')
        self.assertEqual(model.shift_period('month', date(2026, 12, 20), 1), date(2027, 1, 1))
        self.assertEqual(model.shift_period('month', date(2026, 1, 20), -1), date(2025, 12, 1))
        self.assertEqual(model.shift_period('week', day, -1), date(2026, 11, 5))

    def test_google_calendar_and_record(self):
        lesson = model.Lesson(id='l', student_id='s', student_name='Ana Souza', starts_at=datetime(2026, 11, 12, 21, 0, tzinfo=timezone.utc),
                              duration=60, topic='Conditionals', online_url='https://meet.example.com/x', status='scheduled')
        url = model.google_calendar_url(lesson)
        self.assertIn('dates=20261112T210000Z%2F20261112T220000Z', url)
        self.assertIn('text=Conditionals+%C2%B7+Ana+Souza', url)
        values = model.lesson_record_values(lesson.starts_at, 45, 'Conditionals', '', 'presente', {'notes': 'ok'}, {'Speaking': 70.0})
        self.assertEqual((values['status'], values['online_url'], values['attendance'], values['skill_scores']), ('completed', None, 'presente', {'Speaking': 70}))

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


if __name__ == '__main__':
    unittest.main()

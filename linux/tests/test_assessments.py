from __future__ import annotations

import unittest
from datetime import date

from langspot_linux import assessments as a


def question(snapshot: dict) -> dict:
    return {'id': 'q', 'questionBankId': None, 'weight': 1, 'required': True, 'snapshot': snapshot}


MC = {'type': 'multiple_choice', 'prompt': 'Pick one', 'options': ['a', 'b'], 'answer': 'a'}


class DraftTest(unittest.TestCase):
    def test_empty_and_placement(self) -> None:
        draft = a.empty_draft()
        self.assertEqual((draft['framework'], draft['showResults'], draft['sections']), ('none', 'after_teacher_review', []))
        placement = a.cefr_placement_draft(False)
        self.assertEqual(len(placement['sections']), 12)
        self.assertNotIn('listening', {section['skill'] for section in placement['sections']})
        self.assertEqual(len(a.cefr_placement_draft(True)['sections']), 18)
        a.set_framework(draft, 'cefr')
        self.assertEqual(draft['reportModelVersion'], 'cefr-profile-v1')
        a.set_mode(draft, 'adaptive')
        self.assertEqual((draft['navigationMode'], draft['showResults']), ('linear', 'after_teacher_review'))

    def test_merge_loaded(self) -> None:
        base = {**a.empty_draft(), 'sections': [{'id': 's1', 'title': 'R'}, {'id': 's2', 'title': 'W'}]}
        merged = a.merge_loaded_draft(base, {'framework': 'cefr', 'formVersion': 'F', 'sections': [{'cefrLevel': 'B1'}]},
                                      {'sectionPacing': 'sections', 'sections': [{'timeLimitMinutes': 20}]})
        self.assertEqual((merged['framework'], merged['sectionPacing']), ('cefr', 'sections'))
        self.assertEqual((merged['sections'][0]['cefrLevel'], merged['sections'][0]['timeLimitMinutes'], merged['sections'][1]['timeLimitMinutes']), ('B1', 20, None))
        plain = a.merge_loaded_draft(base, None, None)
        self.assertEqual((plain['framework'], plain['sectionPacing']), ('none', 'none'))
        self.assertEqual(a.pacing_payload(merged), {'sectionPacing': 'sections', 'sections': [{'timeLimitMinutes': 20}, {'timeLimitMinutes': None}]})

    def test_validation(self) -> None:
        draft = a.empty_draft()
        messages = [message for _severity, message in a.validate_draft(draft)]
        self.assertIn('Informe o título da avaliação.', messages)
        self.assertIn('Adicione pelo menos uma seção.', messages)
        section = {**a.new_section(), 'questions': [question(MC)]}
        draft.update(title='Unit 4', sections=[section])
        self.assertEqual(a.validate_draft(draft), [('warning', 'Avaliações muito curtas podem produzir resultados pouco representativos.')])
        section['drawCount'] = 2
        self.assertIn(('error', 'O pool da seção 1 deve selecionar entre 1 e 1 questões.'), a.validate_draft(draft))
        section['drawCount'] = None
        section['questions'].append(question({'type': 'writing', 'prompt': 'Write', 'options': [], 'answer': ''}))
        self.assertIn(('error', 'Questão 2: configure a rubrica de correção.'), a.validate_draft(draft))
        section['skill'] = 'spoken_interaction'
        section['questions'] = [question({'type': 'speaking', 'prompt': 'Talk', 'options': [], 'answer': '', 'rubric': a.SPEAKING_RUBRIC})] * 3
        self.assertEqual([issue for issue in a.validate_draft(draft) if issue[0] == 'error'], [])
        self.assertTrue(any('considere aplicá-la ao vivo' in message for _s, message in a.validate_draft(draft)))
        self.assertFalse(a.validate_draft(draft, listening_enabled=True)[0][0] == 'error')

    def test_question_validation(self) -> None:
        self.assertEqual(a.validate_question(MC), [])
        self.assertIn('The correct answer must match one of the options.', a.validate_question({**MC, 'answer': 'z'}))
        self.assertIn('Question options must be unique.', a.validate_question({**MC, 'options': ['a', 'A ']}))
        order = {'type': 'ordering', 'prompt': 'x', 'options': ['b', 'a'], 'answer': 'a\u001fb'}
        self.assertEqual(a.validate_question(order), [])
        self.assertTrue(a.validate_question({**order, 'answer': 'a'}))
        self.assertTrue(a.validate_question({'type': 'matching', 'prompt': 'x', 'options': ['a', 'b'], 'answer': 'a => 1'}))

    def test_manual_and_bank_snapshots(self) -> None:
        snapshot = a.manual_snapshot('ordering', ' Order ', options_text='am\nI\nready', answer_text='I\nam\nready', default_skill='use_of_english')
        self.assertEqual((snapshot['answer'], snapshot['skill'], snapshot['options']), ('I\u001fam\u001fready', 'language_use', ['am', 'I', 'ready']))
        self.assertEqual(a.validate_question(snapshot), [])
        speaking = a.manual_snapshot('speaking', 'Talk about it', default_skill='speaking')
        self.assertEqual((speaking['skill'], speaking['recordingSeconds'], len(speaking['rubric'])), ('spoken_production', 120, 7))
        self.assertEqual(speaking['rubric'][-1]['key'], 'pronunciation_phonological_control')
        self.assertEqual(a.WRITING_RUBRIC[3]['key'], 'organisation_cohesion')
        self.assertEqual(a.manual_snapshot('true_false', 'x', answer_text='True')['options'], ['True', 'False'])
        with self.assertRaises(ValueError):
            a.manual_snapshot('mediation', 'Explain', source_material=' ')
        row = {'id': 'b1', 'external_id': 'RD-B1-01', 'question_type': 'multiple_choice', 'prompt': 'Why?', 'options': ['a', 'b'], 'answer': 'a',
               'level': 'B1', 'difficulty': None, 'skill': 'reading', 'quality_status': 'approved_for_pilot', 'source_origin': 'cefr_pilot',
               'question_bank_tasklets': {'external_id': 'RD-B1-T1', 'input_text': 'A text.', 'source_credit': 'CC BY'}}
        bank = a.bank_snapshot(row)
        self.assertEqual((bank['id'], bank['bankId'], bank['difficulty'], bank['sourceMaterial'], bank['taskletId'], bank['isPilot']),
                         ('RD-B1-01', 'b1', 5, 'A text.', 'RD-B1-T1', True))
        self.assertNotIn('transcript', bank)
        added = a.draft_question(bank, 'b1')
        self.assertEqual(added['questionBankId'], 'b1')
        self.assertNotEqual(added['snapshot']['id'], bank['id'])
        section = {'skill': 'language_use'}
        self.assertTrue(a.bank_matches({'skill': 'grammar', 'prompt': 'x'}, section, 'cefr', listening_enabled=False))
        self.assertFalse(a.bank_matches({'skill': 'reading', 'prompt': 'x'}, section, 'cefr', listening_enabled=False))
        self.assertFalse(a.bank_matches({'type': 'listening', 'prompt': 'x'}, section, 'none', listening_enabled=False))
        self.assertTrue(a.bank_matches({'skill': 'reading', 'prompt': 'Inference'}, section, 'none', listening_enabled=True, search='infer'))

    def test_live_flag(self) -> None:
        snapshot = {'type': 'speaking'}
        a.toggle_live(snapshot)
        self.assertTrue(a.is_live(snapshot) and a.can_administer_live(snapshot))
        a.toggle_live(snapshot)
        self.assertEqual(snapshot['administration'], 'student')
        self.assertEqual(a.live_rubric_score(a.WRITING_RUBRIC, {criterion['key']: 5 for criterion in a.WRITING_RUBRIC}, 11), 5.0)
        self.assertIsNone(a.live_rubric_score(a.WRITING_RUBRIC, {}, 11))


class WarningsTest(unittest.TestCase):
    def test_seeds_and_deletion(self) -> None:
        self.assertEqual(a.student_form_seed('Mateus Conceição', date(2026, 11, 13), 'ab12'), 'mateus-conceicao-2026-11-13-AB12')
        self.assertTrue(a.new_form_seed(date(2026, 11, 13)).startswith('forma-2026-11-13-'))
        self.assertEqual(a.deletion_warnings({'assignments': 2, 'inProgressStudents': 0, 'submittedStudents': 0}), ['A atribuição para 2 alunos também será removida.'])
        self.assertEqual(a.deletion_warnings({'assignments': 1, 'inProgressStudents': 1, 'submittedStudents': 1}),
                         ['As provas enviadas por 1 aluno e os resultados delas serão apagados.', '1 aluno está fazendo esta prova agora e perderá as respostas.'])

    def test_exposure(self) -> None:
        exposure = {'fixed': [{'skill': 'reading', 'itemKey': 'R1', 'taskletKey': 'T1', 'taskletTitle': 'Lost', 'seenAt': '2026-10-01T12:00:00Z', 'assessmentTitle': 'LC B1'},
                              {'skill': 'reading', 'itemKey': 'R2', 'taskletKey': 'T1', 'taskletTitle': 'Lost', 'seenAt': '2026-10-01T12:00:00Z', 'assessmentTitle': 'LC B1'},
                              {'skill': 'writing', 'itemKey': 'W1', 'taskletKey': None, 'seenAt': '2026-10-01T12:00:00Z', 'assessmentTitle': 'LC B1'}],
                    'pools': [{'sectionTitle': 'LU', 'drawCount': 5, 'unseen': 3}, {'sectionTitle': 'LU2', 'drawCount': 5, 'unseen': 9}]}
        summary = a.summarize_exposure(exposure)
        self.assertEqual((len(summary['texts']), len(summary['tasks']), summary['freshPools'], summary['clean']), (1, 1, 1, False))
        lines = a.exposure_lines(exposure)
        self.assertTrue(lines[0].startswith('Texto “Lost” (T1)'))
        self.assertIn('LU: só 3 questão(ões) nova(s) para sortear 5; o restante será repetido.', lines)
        self.assertTrue(a.summarize_exposure({'fixed': [], 'pools': []})['clean'])
        items, texts = a.seen_index([{'itemKey': 'R1', 'taskletKey': 'T1', 'seenAt': '2026-01-01', 'assessmentTitle': 'A'},
                                     {'itemKey': 'R2', 'taskletKey': 'T1', 'seenAt': '2026-02-01', 'assessmentTitle': 'B'}])
        self.assertEqual((sorted(items), texts['T1']['assessmentTitle']), (['R1', 'R2'], 'B'))


class ReportTest(unittest.TestCase):
    def test_labels(self) -> None:
        self.assertEqual(a.format_profile_item('writing.task_achievement'), 'Writing · cumprimento da tarefa')
        self.assertEqual(a.placement_label('A2+ approaching B1'), 'A2+, perto do B1')
        self.assertEqual(a.placement_label('B1 consolidation'), 'B1 (consolidar)')
        profile = {'developmentPriorities': ['reading.inference', 'reading.detail', 'writing'],
                   'skills': {'reading': {'dimensions': {'inference': {'evidence': '3/4 objective'}, 'detail': {'evidence': '1/4 objective'}}}}}
        self.assertEqual(a.meaningful_priorities(profile), ['reading.detail', 'writing'])

    def test_student_report(self) -> None:
        sections = [{'skill': 'reading', 'score': 8, 'maxScore': 10}, {'skill': 'use_of_english', 'score': 2, 'maxScore': 10},
                    {'skill': 'writing', 'score': 5, 'maxScore': 11}]
        report = a.build_student_report(sections, 50, None, {'score': 40, 'skills': {'reading': 70}})
        lines = {line['key']: line for line in report['skills']}
        self.assertEqual((lines['reading']['percentage'], lines['reading']['delta'], lines['language_use']['percentage']), (80.0, 10.0, 20.0))
        self.assertEqual((report['strengths'], report['priorities'], report['scoreDelta']), (['Reading'], ['Language Use', 'Writing'], 10))
        profile = {'skills': {'writing': {'level': 'B1'}}, 'strengths': ['reading.detail'], 'developmentPriorities': []}
        with_profile = a.build_student_report(sections, 50, profile, None)
        writing = next(line for line in with_profile['skills'] if line['key'] == 'writing')
        self.assertEqual((writing['rubric'], writing['level'], with_profile['strengths']), (True, 'B1', ['Reading · detalhes']))

    def test_timing_and_recordings(self) -> None:
        self.assertEqual(a.question_timing({'timeSpentMs': 45000, 'type': 'multiple_choice'}), '45s na questão')
        self.assertEqual(a.question_timing({'timeSpentMs': 120000, 'type': 'writing', 'answer': 'one two three four'}), '2 min · 4 palavras · ≈2 palavras/min')
        old = {'attempt': {'startedAt': '2026-11-10T10:00:00Z'}, 'integrity': {'events': []}}
        self.assertIsNone(a.discarded_info(old, 'q'))
        new = {'attempt': {'startedAt': '2026-11-12T10:00:00Z'}, 'integrity': {'events': [
            {'type': 'recording_discarded', 'metadata': {'questionId': 'q', 'pausedCount': 2}}]}}
        self.assertEqual(a.discarded_info(new, 'q'), (1, 2))
        self.assertEqual(a.clock(125), '02:05')
        self.assertTrue(a.audio_path('t', 'as', 'q', 'Track 1.MP3').endswith('.mp3'))


class AssignmentsTest(unittest.TestCase):
    def test_states_filters_and_order(self) -> None:
        from datetime import datetime, timezone
        now = datetime(2026, 11, 13, 12, tzinfo=timezone.utc)
        row = lambda **values: {'id': 'a', 'assessment_id': 'as', 'student_id': 's', 'available_from': None, 'due_at': None, 'attempt_limit': 1,
                                'status': 'assigned', 'created_at': '2026-11-10T00:00:00Z', **values}
        self.assertEqual(a.assignment_state(row(), now), 'waiting')
        self.assertEqual(a.assignment_state(row(status='available', available_from='2026-11-14T08:00:00Z'), now), 'scheduled')
        self.assertEqual(a.assignment_state(row(due_at='2026-11-12T23:00:00Z'), now), 'overdue')
        self.assertEqual([a.assignment_state(row(status=status), now) for status in ('started', 'grading', 'submitted', 'completed', 'expired')],
                         ['in_progress', 'to_review', 'to_review', 'completed', 'expired'])
        self.assertTrue(a.matches_assignment_filter('overdue', 'open') and a.matches_assignment_filter('expired', 'done'))
        self.assertFalse(a.matches_assignment_filter('in_progress', 'open'))
        rows = [row(id='done', status='completed'), row(id='later', due_at='2026-11-30T00:00:00Z'), row(id='soon', due_at='2026-11-15T00:00:00Z'),
                row(id='late', due_at='2026-11-01T00:00:00Z'), row(id='nodate')]
        self.assertEqual([item['id'] for item in a.sort_assignments(rows, now)], ['late', 'soon', 'later', 'nodate', 'done'])
        self.assertEqual(a.assignment_counts([row(assessment_id='x'), row(assessment_id='x', status='completed')]), {'x': (2, 1)})
        self.assertIn('2 tentativas', a.assignment_details(row(attempt_limit=2), now))
        self.assertIn('sem prazo', a.assignment_details(row(), now))


if __name__ == '__main__':
    unittest.main()

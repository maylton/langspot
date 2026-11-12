"""Local fake of the Supabase endpoints the app uses, with fictional data.

Used by the client tests and to run the app without a real account:
    python3 -m tests.fake_supabase 54321
    LANGSPOT_SUPABASE_URL=http://127.0.0.1:54321 LANGSPOT_SUPABASE_ANON_KEY=demo python3 -m langspot_linux
Login: professor@exemplo.com / demo123
"""
from __future__ import annotations

import io
import json
import math
import struct
import sys
import threading
import urllib.parse
import wave
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

TEACHER = 'teacher-0001'
NOW = datetime.now(timezone.utc)


def iso(delta_minutes: float = 0) -> str:
    return (NOW + timedelta(minutes=delta_minutes)).isoformat()


def tone_wav(seconds: float = 2.0) -> bytes:
    buffer = io.BytesIO()
    with wave.open(buffer, 'wb') as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(16000)
        out.writeframes(b''.join(struct.pack('<h', int(4000 * math.sin(2 * math.pi * 440 * i / 16000))) for i in range(int(16000 * seconds))))
    return buffer.getvalue()


WRITING_RUBRIC = [{'key': key, 'label': key, 'maxScore': 11, 'scale': 'cefr'} for key in
                  ['task_achievement', 'range', 'accuracy', 'organisation_cohesion', 'register_pragmatic_appropriacy']]
SPEAKING_RUBRIC = [{'key': key, 'label': key, 'maxScore': 11, 'scale': 'cefr'} for key in
                   ['range', 'grammatical_accuracy', 'lexical_control', 'fluency', 'interaction', 'coherence', 'pronunciation_phonological_control']]


class State:
    def __init__(self) -> None:
        self.access_tokens = {'access-1'}
        self.refresh_tokens = {'refresh-1'}
        self.counter = 1
        self.students = [
            {'student_id': 'st-ana', 'teacher_id': TEACHER, 'level': 'B1', 'goal': 'Inglês para viagens', 'age': 24, 'notes': 'Gosta de séries.', 'skills': {'Speaking': 62, 'Writing': 48, 'Reading': 75, 'Listening': 60, 'Grammar': 55, 'Vocabulary': 58, 'Pronunciation': 64}, 'created_at': iso(-9000),
             'student': {'id': 'st-ana', 'full_name': 'Ana Souza', 'email': 'ana@exemplo.com', 'whatsapp_phone': '5581999990001'}},
            {'student_id': 'st-bruno', 'teacher_id': TEACHER, 'level': 'A2', 'goal': 'Entrevista de emprego', 'age': 31, 'notes': '', 'skills': {'Speaking': 40, 'Writing': 45}, 'created_at': iso(-8000),
             'student': {'id': 'st-bruno', 'full_name': 'Bruno Lima', 'email': 'bruno@exemplo.com', 'whatsapp_phone': ''}},
            {'student_id': 'st-carla', 'teacher_id': TEACHER, 'level': 'B2', 'goal': 'Mestrado no exterior', 'age': 27, 'notes': 'Prepara IELTS.', 'skills': {}, 'created_at': iso(-7000),
             'student': {'id': 'st-carla', 'full_name': 'Carla Mendes', 'email': 'carla@exemplo.com', 'whatsapp_phone': '5581999990003'}},
        ]
        today = NOW.astimezone().replace(hour=19, minute=0, second=0, microsecond=0)
        def at(days: int, hour: int) -> str:
            return (today + timedelta(days=days)).replace(hour=hour).astimezone(timezone.utc).isoformat()
        self.lessons = [
            {'id': 'l1', 'teacher_id': TEACHER, 'student_id': 'st-ana', 'starts_at': at(0, 18), 'duration_minutes': 60, 'topic': 'Conditionals in real life', 'online_url': 'https://meet.example.com/ana', 'status': 'scheduled', 'notes': '', 'homework': ''},
            {'id': 'l2', 'teacher_id': TEACHER, 'student_id': 'st-bruno', 'starts_at': at(0, 20), 'duration_minutes': 45, 'topic': 'Job interview practice', 'online_url': '', 'status': 'scheduled', 'notes': '', 'homework': ''},
            {'id': 'l3', 'teacher_id': TEACHER, 'student_id': 'st-carla', 'starts_at': at(1, 19), 'duration_minutes': 60, 'topic': 'IELTS Writing Task 2', 'online_url': 'https://meet.example.com/carla', 'status': 'scheduled', 'notes': '', 'homework': ''},
            {'id': 'l4', 'teacher_id': TEACHER, 'student_id': 'st-ana', 'starts_at': at(-2, 18), 'duration_minutes': 60, 'topic': 'Past simple vs past continuous', 'online_url': '', 'status': 'completed', 'notes': 'Boa evolução nos verbos irregulares.', 'homework': 'Escrever uma história de 80 palavras.', 'attendance': 'presente', 'skill_scores': {'Speaking': 64}},
        ]
        self.notifications = [
            {'id': 'n1', 'user_id': TEACHER, 'kind': 'assessment', 'title': 'Avaliação enviada', 'description': 'Ana Souza enviou "Level Check - B1".', 'target': 'Avaliações', 'urgent': True, 'scheduled_for': iso(-30), 'read_at': None, 'created_at': iso(-30)},
            {'id': 'n2', 'user_id': TEACHER, 'kind': 'lesson', 'title': 'Aula confirmada', 'description': 'Bruno Lima confirmou a aula de hoje às 20:00.', 'target': 'Agenda', 'urgent': False, 'scheduled_for': iso(-180), 'read_at': None, 'created_at': iso(-180)},
            {'id': 'n3', 'user_id': TEACHER, 'kind': 'payment', 'title': 'Pagamento recebido', 'description': 'Carla Mendes pagou a mensalidade de novembro.', 'target': 'Financeiro', 'urgent': False, 'scheduled_for': iso(-1500), 'read_at': iso(-1400), 'created_at': iso(-1500)},
        ]
        self.materials = [
            {'id': 'm1', 'teacher_id': TEACHER, 'title': 'Phrasal verbs for plans', 'type': 'PDF', 'level': 'B1', 'skill': 'Vocabulary', 'url': '',
             'description': 'Lista com exemplos e exercícios.', 'storage_path': f'{TEACHER}/m1-phrasal.pdf', 'file_name': 'phrasal.pdf', 'file_size': 120000,
             'mime_type': 'application/pdf', 'material_source': 'upload', 'created_at': iso(-3000)},
            {'id': 'm2', 'teacher_id': TEACHER, 'title': 'BBC 6 Minute English: Travel', 'type': 'Áudio', 'level': 'A2', 'skill': 'Listening',
             'url': 'https://www.example.com/6-minute-english', 'description': '', 'storage_path': None, 'file_name': None, 'file_size': None,
             'mime_type': None, 'material_source': 'link', 'created_at': iso(-6000)},
        ]
        self.material_assignments = [{'material_id': 'm1', 'student_id': 'st-ana'}]
        self.assignments = [
            {'id': 'a1', 'teacher_id': TEACHER, 'student_id': 'st-ana', 'material_id': 'm1', 'title': 'Write about your weekend', 'instructions': 'Write 80–100 words using the past simple.',
             'due_date': (NOW + timedelta(days=-1)).date().isoformat(), 'status': 'submitted', 'assignment_type': 'regular',
             'submission_text': 'Last weekend I went to the beach with my family. We swam and ate fish. On Sunday I studied for my exam and watched a film.',
             'submitted_at': iso(-200), 'submission_file_path': None, 'submission_file_name': None, 'feedback': '', 'grade': None, 'text_comments': [], 'created_at': iso(-4000)},
            {'id': 'a2', 'teacher_id': TEACHER, 'student_id': 'st-bruno', 'material_id': None, 'title': 'Interview questions', 'instructions': 'Prepare answers to 5 common questions.',
             'due_date': (NOW + timedelta(days=3)).date().isoformat(), 'status': 'pending', 'assignment_type': 'regular', 'submission_text': '', 'submitted_at': None,
             'submission_file_path': None, 'submission_file_name': None, 'feedback': '', 'grade': None, 'text_comments': [], 'created_at': iso(-1000)},
            {'id': 'a3', 'teacher_id': TEACHER, 'student_id': 'st-carla', 'material_id': None, 'title': 'IELTS Task 2 essay', 'instructions': 'Write 250 words.',
             'due_date': (NOW + timedelta(days=-8)).date().isoformat(), 'status': 'reviewed', 'assignment_type': 'regular', 'submission_text': 'Essay…', 'submitted_at': iso(-12000),
             'submission_file_path': None, 'submission_file_name': None, 'feedback': 'Great structure.', 'grade': 85, 'text_comments': [], 'created_at': iso(-15000)},
            {'id': 'q1', 'teacher_id': TEACHER, 'student_id': 'st-ana', 'title': 'Quiz: irregular verbs', 'instructions': 'Responda às questões abaixo.',
             'due_date': (NOW + timedelta(days=2)).date().isoformat(), 'status': 'submitted', 'assignment_type': 'interactive', 'submission_text': '',
             'submitted_at': iso(-90), 'feedback': '', 'grade': None, 'text_comments': [], 'created_at': iso(-500),
             'interactive_content': {'settings': {'maxAttempts': 2, 'revealAnswers': 'after_each'}, 'questions': [
                 {'id': 'qq1', 'type': 'multiple_choice', 'prompt': 'Yesterday I ___ to the cinema.', 'options': ['go', 'went', 'gone'], 'answer': 'went',
                  'explanation': 'Past simple of go.'},
                 {'id': 'qq2', 'type': 'fill_blank', 'prompt': 'She ___ (buy) a new phone last week.', 'options': [], 'answer': 'bought'},
                 {'id': 'qq3', 'type': 'ordering', 'prompt': 'Order the words.', 'options': ['ate', 'We', 'pizza'], 'answer': 'We / ate / pizza'}]},
             'interactive_result': {'answers': {}, 'score': 2, 'total': 3, 'percentage': 67, 'attempts': [{'score': 1}, {'score': 2}]}},
        ]
        today = NOW.date()
        self.payments = [
            {'id': 'p1', 'teacher_id': TEACHER, 'student_id': 'st-ana', 'description': 'Mensalidade de novembro', 'amount': 320, 'due_date': today.replace(day=5).isoformat(), 'status': 'paid', 'paid_at': iso(-9000), 'created_at': iso(-20000)},
            {'id': 'p2', 'teacher_id': TEACHER, 'student_id': 'st-bruno', 'description': 'Mensalidade de novembro', 'amount': 280, 'due_date': (today - timedelta(days=4)).isoformat(), 'status': 'pending', 'paid_at': None, 'created_at': iso(-20000)},
            {'id': 'p3', 'teacher_id': TEACHER, 'student_id': 'st-carla', 'description': 'Pacote IELTS (4 aulas)', 'amount': 480, 'due_date': (today + timedelta(days=10)).isoformat(), 'status': 'pending', 'paid_at': None, 'created_at': iso(-3000)},
        ]
        self.cancellation_requests = [
            {'id': 'cr1', 'lesson_id': 'l3', 'student_id': 'st-carla', 'teacher_id': TEACHER, 'reason': 'Tenho uma consulta médica nesse horário.', 'status': 'pending',
             'teacher_response': '', 'created_at': iso(-60), 'resolved_at': None},
        ]
        self.uploads: dict[str, bytes] = {}
        self.profile = {'id': TEACHER, 'role': 'teacher', 'full_name': 'Professor Demo', 'email': 'professor@exemplo.com', 'school_name': 'Demo English',
                        'avatar_url': '', 'whatsapp_phone': ''}
        self.subscription = {'teacher_id': TEACHER, 'plan': 'owner', 'status': 'active', 'trial_ends_at': None}
        today = NOW.date()
        self.study_activities = [{'student_id': 'st-ana', 'activity_date': (today - timedelta(days=offset)).isoformat()} for offset in range(4)]
        self.streak_freezes = [{'student_id': 'st-ana', 'protected_date': (today - timedelta(days=4)).isoformat()}]
        self.teacher_invitations = [{'id': 'inv-1', 'email': 'nova@exemplo.com', 'full_name': 'Nova Professora', 'token': 'tok123', 'used': False,
                                     'expires_at': iso(600), 'created_at': iso(-60)}]
        self.teachers = [{'id': TEACHER, 'full_name': 'Professor Demo', 'email': 'professor@exemplo.com', 'school_name': 'Demo English', 'created_at': iso(-90000),
                          'plan': 'owner', 'status': 'active', 'trial_ends_at': None, 'student_count': 3, 'is_owner': True},
                         {'id': 'teacher-0002', 'full_name': 'Rita Alves', 'email': 'rita@exemplo.com', 'school_name': '', 'created_at': iso(-30000),
                          'plan': 'trial', 'status': 'trialing', 'trial_ends_at': iso(20000), 'student_count': 1, 'is_owner': False}]
        self.invites: list[dict] = []
        self.question_bank = [
            {'id': 'qb1', 'teacher_id': TEACHER, 'source_origin': 'teacher', 'level': 'A2', 'category': 'Grammar', 'question_type': 'multiple_choice',
             'prompt': 'They ___ football every Sunday.', 'options': ['play', 'plays', 'playing'], 'answer': 'play', 'explanation': None, 'skill': 'language_use',
             'subskill': 'present simple', 'quality_status': 'reviewed', 'usage_count': 3, 'restricted': False, 'created_at': iso(-5000)},
            {'id': 'qb2', 'teacher_id': None, 'source_origin': 'cefr_pilot', 'external_id': 'LU-A2-001', 'level': 'A2', 'category': 'Grammar', 'question_type': 'true_false',
             'prompt': '"He don\'t like tea" is correct.', 'options': ['Verdadeiro', 'Falso'], 'answer': 'Falso', 'explanation': None, 'skill': 'language_use',
             'subskill': None, 'quality_status': 'approved_for_pilot', 'usage_count': 9, 'restricted': False, 'created_at': iso(-9000)},
            {'id': 'qb3', 'teacher_id': TEACHER, 'source_origin': 'teacher', 'level': 'A1', 'category': 'Grammar', 'question_type': 'fill_blank',
             'prompt': 'I ___ a student.', 'options': [], 'answer': 'am', 'explanation': None, 'skill': 'language_use', 'subskill': None,
             'quality_status': 'draft', 'usage_count': 0, 'restricted': False, 'created_at': iso(-3000)}]
        self.created_accounts: list[dict] = []
        self.reviewed: dict[str, dict] = {}
        self.finalized: set[str] = set()

    # ---- assessments
    def queue(self) -> dict:
        items = []
        for response in self.responses():
            if response['responseId'] in self.reviewed:
                continue
            items.append({**{key: response[key] for key in ('responseId', 'attemptId', 'prompt', 'type', 'skill', 'cefr', 'sourceMaterial', 'responseConstraints')},
                          'attemptStatus': 'grading', 'assessmentId': 'as-1', 'assessmentTitle': 'Level Check - B1', 'studentId': 'st-ana', 'studentName': 'Ana Souza',
                          'questionId': response['id'], 'live': False, 'taskType': None, 'primaryEvidence': None, 'operationalDescriptor': None, 'submittedAt': iso(-30)})
        ready = [] if items or 'at-1' in self.finalized else [{'attemptId': 'at-1', 'assessmentId': 'as-1', 'assessmentTitle': 'Level Check - B1', 'studentId': 'st-ana', 'studentName': 'Ana Souza', 'submittedAt': iso(-30)}]
        return {'items': items, 'readyToFinalize': ready}

    def responses(self) -> list[dict]:
        return [
            {'id': 'q-w', 'responseId': 'r-w', 'attemptId': 'at-1', 'type': 'writing', 'skill': 'writing', 'cefr': 'B1', 'sourceMaterial': None,
             'prompt': 'You see this notice on an English-language website:\n\n**Articles wanted! Is it better to learn something new alone or with other people?**\n\nWrite an article giving your opinion. Include reasons and at least one example.',
             'responseConstraints': {'min': 100, 'max': 120, 'unit': 'words', 'label': '100–120 words'},
             'answer': 'I think it is better to learn with other people. When you study with friends you can discuss the topic and ask questions. For example, when I started playing chess, my cousin explained the rules and I learned faster than alone. However, studying alone is good for concentration. In my opinion, the best way is to mix both.',
             'rubric': WRITING_RUBRIC, 'mediaPath': None},
            {'id': 'q-s', 'responseId': 'r-s', 'attemptId': 'at-1', 'type': 'speaking', 'skill': 'spoken_interaction', 'cefr': 'B1', 'sourceMaterial': None,
             'prompt': 'Fewer and fewer people are coming to your class’s monthly social event. Talk with the examiner about possible reasons and agree on two realistic changes to bring more people back.',
             'responseConstraints': {'min': 4, 'max': 5, 'unit': 'minutes', 'label': '4–5 minutes'},
             'answer': 'audio/at-1/q-s.wav', 'rubric': SPEAKING_RUBRIC, 'mediaPath': 'audio/at-1/q-s.wav'},
        ]

    def result(self) -> dict:
        questions = []
        for response in self.responses():
            review = self.reviewed.get(response['responseId'])
            questions.append({'id': response['id'], 'sectionId': response['skill'], 'prompt': response['prompt'], 'type': response['type'], 'options': [],
                              'answer': response['answer'], 'mediaPath': response['mediaPath'], 'rubric': response['rubric'], 'maxScore': 1,
                              'responseId': response['responseId'], 'gradingStatus': 'reviewed' if review else 'manual_review',
                              'score': review['score'] if review else None, 'teacherFeedback': review['feedback'] if review else '',
                              'rubricScores': review['rubric'] if review else None})
        return {'attempt': {'id': 'at-1', 'studentId': 'st-ana', 'studentName': 'Ana Souza', 'status': 'completed' if 'at-1' in self.finalized else 'grading', 'startedAt': iso(-120), 'submittedAt': iso(-30)},
                'assessment': {'id': 'as-1', 'title': 'Level Check - B1'}, 'sections': [], 'questions': questions,
                'integrity': {'events': [{'type': 'recording_discarded', 'occurredAt': iso(-50), 'metadata': {'questionId': 'q-s', 'durationMs': 30000}}]}}

    def live_status(self) -> dict:
        return {
            'attempt': {'id': 'at-live', 'status': 'in_progress', 'studentName': 'Bruno Lima', 'startedAt': iso(-40), 'lastSeenAt': iso(-0.2), 'lastActivityAt': iso(-0.2), 'viewingQuestionId': 'lq-si', 'integrityStatus': 'unusual_activity'},
            'assessment': {'id': 'as-2', 'title': 'Level Check - A2', 'sectionPacing': True},
            'sections': [
                {'id': 'sec-r', 'title': 'PART 1 — Reading · Target A2 · R-A2-007', 'skill': 'reading', 'position': 0, 'startedAt': iso(-38), 'completedAt': iso(-25), 'instructions': 'Read the dialogue and choose the best answer.'},
                {'id': 'sec-w', 'title': 'PART 3 — Writing · Task 1', 'skill': 'writing', 'position': 1, 'startedAt': iso(-24), 'completedAt': iso(-12)},
                {'id': 'sec-si', 'title': 'PART 5 — Spoken Interaction · Target A2', 'skill': 'spoken_interaction', 'position': 2, 'startedAt': iso(-3), 'expiresAt': iso(5), 'instructions': 'Read the task card. When you are ready, start recording.'},
                {'id': 'sec-m', 'title': 'PART 6 — Mediation · Target A2', 'skill': 'mediation', 'position': 3},
            ],
            'questions': [
                {'id': 'lq-r1', 'sectionId': 'sec-r', 'type': 'multiple_choice', 'prompt': 'Where is the Lost & Found office now?', 'options': ['across from the cafeteria', 'next to the ladies’ room', 'down near the elevators', 'in Serenity’s office'], 'answered': True, 'live': False},
                {'id': 'lq-w', 'sectionId': 'sec-w', 'type': 'writing', 'prompt': 'Write about a day when your plans changed.', 'options': [], 'answered': True, 'wordCount': 58, 'live': False},
                {'id': 'lq-si', 'sectionId': 'sec-si', 'type': 'speaking', 'prompt': 'You and the examiner are planning a Saturday outing. There are three options: a picnic in the park, the cinema or the city museum. Talk about the time, the cost and the weather, and agree on one plan.',
                 'options': [], 'answered': False, 'preparationSeconds': 60, 'recordingSeconds': 180, 'responseConstraints': {'label': '3–4 minutes'}, 'live': False},
                {'id': 'lq-m', 'sectionId': 'sec-m', 'type': 'mediation', 'prompt': 'Write a message to a classmate explaining the change.', 'options': [], 'answered': False, 'live': False},
            ],
            'events': [{'type': 'tab_focus', 'occurredAt': iso(-6), 'metadata': {'durationMs': 8200}}, {'type': 'tab_blur', 'occurredAt': iso(-6.2), 'metadata': {}}],
        }

    def active(self) -> list[dict]:
        return [{'attemptId': 'at-live', 'assessmentId': 'as-2', 'assessmentTitle': 'Level Check - A2', 'studentId': 'st-bruno', 'studentName': 'Bruno Lima',
                 'startedAt': iso(-40), 'expiresAt': None, 'lastSeenAt': iso(-0.2), 'lastActivityAt': iso(-0.2), 'integrityStatus': 'unusual_activity',
                 'delivered': 4, 'answered': 2, 'liveTasks': 0, 'currentSectionTitle': 'PART 5 — Spoken Interaction · Target A2'}]

    def progress(self, student_id: str) -> dict:
        if student_id != 'st-ana':
            return {'studentId': student_id, 'currentLevel': 'A2', 'history': [], 'levelUpdates': []}
        return {'studentId': student_id, 'currentLevel': 'B1', 'levelUpdates': [], 'history': [
            {'attemptId': 'old', 'assessmentId': 'as-0', 'title': 'Placement A2', 'type': 'placement', 'version': 1, 'completedAt': iso(-60 * 24 * 40), 'score': 58, 'estimatedCefr': 'A2+', 'skills': {'reading': 70, 'language_use': 55}},
            {'attemptId': 'at-1', 'assessmentId': 'as-1', 'title': 'Level Check - B1', 'type': 'placement', 'version': 1, 'completedAt': iso(-30), 'score': 66, 'estimatedCefr': 'B1', 'skills': {'reading': 88, 'language_use': 70}}]}


STATE = State()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args) -> None:  # quiet
        pass

    def _json(self, status: int, payload) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self) -> dict:
        length = int(self.headers.get('Content-Length') or 0)
        return json.loads(self.rfile.read(length) or b'{}') if length else {}

    def _authorized(self) -> bool:
        token = (self.headers.get('Authorization') or '').removeprefix('Bearer ')
        if token in STATE.access_tokens:
            return True
        self._json(401, {'message': 'JWT expired'})
        return False

    def _session(self) -> dict:
        STATE.counter += 1
        access, refresh = f'access-{STATE.counter}', f'refresh-{STATE.counter}'
        STATE.access_tokens.add(access); STATE.refresh_tokens.add(refresh)
        return {'access_token': access, 'refresh_token': refresh, 'expires_in': 3600, 'user': {'id': TEACHER, 'email': 'professor@exemplo.com'}}

    def do_POST(self) -> None:
        url = urllib.parse.urlparse(self.path)
        query = dict(urllib.parse.parse_qsl(url.query))
        if url.path.startswith('/storage/v1/object/') and not url.path.startswith('/storage/v1/object/sign/'):
            if not self._authorized():
                return None
            length = int(self.headers.get('Content-Length') or 0)
            STATE.uploads[urllib.parse.unquote(url.path.split('/storage/v1/object/', 1)[1])] = self.rfile.read(length)
            return self._json(200, {'Key': url.path})
        body = self._body()
        if url.path == '/auth/v1/token':
            if query.get('grant_type') == 'password':
                if body.get('email') == 'professor@exemplo.com' and body.get('password') == 'demo123':
                    return self._json(200, self._session())
                return self._json(400, {'error': 'invalid_grant', 'error_description': 'Invalid login credentials'})
            if body.get('refresh_token') in STATE.refresh_tokens:
                return self._json(200, self._session())
            return self._json(400, {'error_description': 'Invalid Refresh Token'})
        if url.path == '/auth/v1/logout':
            return self._json(204, {})
        if not self._authorized():
            return None
        if url.path.startswith('/storage/v1/object/sign/'):
            return self._json(200, {'signedURL': '/object/sign/' + url.path.split('/object/sign/', 1)[1] + '?token=demo'})
        if url.path.startswith('/functions/v1/'):
            return self._function(url.path.rsplit('/', 1)[1], body)
        if url.path.startswith('/rest/v1/rpc/'):
            return self._rpc(url.path.rsplit('/', 1)[1], body)
        if url.path == '/rest/v1/lessons':
            row = {'id': f'l{len(STATE.lessons) + 1}', 'teacher_id': TEACHER, 'status': 'scheduled', 'notes': '', 'homework': '', **body}
            STATE.lessons.append(row)
            return self._json(201, [row])
        tables = {'materials': STATE.materials, 'assignments': STATE.assignments, 'payments': STATE.payments, 'material_assignments': STATE.material_assignments,
                  'question_bank': STATE.question_bank}
        table = url.path.removeprefix('/rest/v1/')
        if table in tables:
            rows = body if isinstance(body, list) else [body]
            created = []
            for row in rows:
                if table == 'material_assignments':
                    if row not in STATE.material_assignments:
                        STATE.material_assignments.append(dict(row))
                    continue
                item = {'id': f'{table[0]}{len(tables[table]) + 10}', 'created_at': iso(), **row}
                tables[table].append(item)
                created.append(item)
            return self._json(201, created)
        return self._json(404, {'message': 'not found'})

    def _function(self, name: str, body: dict) -> None:
        if name == 'invite-student':
            if body.get('action') == 'create-with-password':
                if any((row['student'].get('email') == body['email']) for row in STATE.students):
                    return self._json(400, {'error': 'A user with this email address has already been registered'})
                student_id = f'st-new-{len(STATE.created_accounts) + 1}'
                STATE.students.append({'student_id': student_id, 'teacher_id': TEACHER, 'level': body.get('level'), 'goal': body.get('goal'), 'age': body.get('age'),
                                       'notes': body.get('notes', ''), 'skills': {}, 'created_at': iso(),
                                       'student': {'id': student_id, 'full_name': body['fullName'], 'email': body['email'], 'whatsapp_phone': body.get('whatsappPhone', '')}})
                STATE.created_accounts.append(body)
                return self._json(200, {'ok': True, 'temporaryPassword': 'Temp-1234', 'studentId': student_id})
            STATE.invites.append({**body, 'origin': self.headers.get('Origin')})
            return self._json(200, {'ok': True})
        if name == 'invite-teacher':
            token = f'tok{len(STATE.teacher_invitations) + 1}'
            STATE.teacher_invitations.insert(0, {'id': f'inv-{len(STATE.teacher_invitations) + 1}', 'email': body['email'], 'full_name': body['full_name'], 'token': token,
                                                 'used': False, 'expires_at': iso(1440), 'created_at': iso()})
            origin = self.headers.get('Origin') or 'http://localhost:1420'
            return self._json(200, {'ok': True, 'invitation_link': f'{origin}/accept-invite?token={token}&email={urllib.parse.quote(body["email"])}'})
        if name == 'generate-quiz':
            count = int(body.get('count') or 5)
            return self._json(200, {'questions': [{'type': 'multiple_choice', 'prompt': f'{body["topic"]} #{index + 1}: I ___ visited Rome.',
                                                    'options': ['have', 'has', 'had'], 'answer': 'have', 'explanation': 'Present perfect.'} for index in range(count)]})
        if name == 'admin-teachers':
            if body.get('action') == 'list':
                return self._json(200, {'teachers': STATE.teachers})
            teacher = next((row for row in STATE.teachers if row['id'] == body.get('teacher_id')), None)
            if not teacher or teacher['is_owner']:
                return self._json(400, {'error': 'A conta administrativa não pode ser alterada'})
            if body['action'] == 'set-access':
                teacher.update({'plan': 'professional', 'status': 'active', 'trial_ends_at': None} if body['enabled'] else {'status': 'expired'})
            elif body['action'] == 'delete':
                STATE.teachers.remove(teacher)
            return self._json(200, {'ok': True})
        return self._json(404, {'error': f'function {name} not found'})

    def _rpc(self, name: str, body: dict) -> None:
        if name == 'list_assessment_review_queue':
            return self._json(200, STATE.queue())
        if name == 'get_assessment_result':
            return self._json(200, STATE.result())
        if name == 'review_assessment_response':
            STATE.reviewed[body['p_response_id']] = {'score': body['p_score'], 'feedback': body['p_feedback'], 'rubric': body['p_rubric_scores']}
            return self._json(200, None)
        if name == 'exclude_assessment_response':
            STATE.reviewed[body['p_response_id']] = {'score': None, 'feedback': body['p_reason'], 'rubric': {}}
            return self._json(200, None)
        if name == 'finalize_assessment_review':
            STATE.finalized.add(body['p_attempt_id'])
            return self._json(200, None)
        if name == 'list_active_teacher_attempts':
            return self._json(200, STATE.active())
        if name == 'get_attempt_live_status':
            return self._json(200, STATE.live_status())
        if name == 'ensure_teacher_subscription':
            return self._json(200, STATE.subscription)
        if name == 'get_assessment_progress':
            return self._json(200, STATE.progress(body.get('p_student_id', '')))
        return self._json(404, {'message': f'function {name} not found'})

    def do_GET(self) -> None:
        url = urllib.parse.urlparse(self.path)
        if url.path.startswith('/storage/v1/object/sign/'):
            body = tone_wav()
            self.send_response(200); self.send_header('Content-Type', 'audio/wav'); self.send_header('Content-Length', str(len(body))); self.end_headers()
            self.wfile.write(body)
            return None
        if not self._authorized():
            return None
        table = url.path.removeprefix('/rest/v1/')
        if table == 'student_records':
            return self._json(200, STATE.students)
        if table == 'lessons':
            return self._json(200, sorted([row for row in STATE.lessons if _matches(row, url.query)], key=lambda row: row['starts_at']))
        if table in ('study_activities', 'streak_freezes', 'teacher_invitations', 'question_bank'):
            return self._json(200, [row for row in getattr(STATE, table) if _matches(row, url.query)])
        if table == 'notifications':
            return self._json(200, sorted(STATE.notifications, key=lambda row: row['scheduled_for'], reverse=True))
        if table == 'cancellation_requests':
            lessons = {row['id']: row for row in STATE.lessons}
            names = {row['student_id']: row['student']['full_name'] for row in STATE.students}
            return self._json(200, [{**row, 'lessons': {'starts_at': lessons[row['lesson_id']]['starts_at'], 'topic': lessons[row['lesson_id']]['topic']},
                                     'student': {'full_name': names.get(row['student_id'])}} for row in STATE.cancellation_requests if row['status'] == 'pending'])
        if table in ('materials', 'material_assignments', 'assignments', 'payments'):
            return self._json(200, [row for row in getattr(STATE, table) if _matches(row, url.query)])
        if table == 'profiles':
            return self._json(200, [dict(STATE.profile)])
        return self._json(404, {'message': 'not found'})

    def do_PATCH(self) -> None:
        url = urllib.parse.urlparse(self.path)
        if not self._authorized():
            return None
        body = self._body()
        query = dict(urllib.parse.parse_qsl(url.query))
        table = url.path.removeprefix('/rest/v1/')
        if table == 'profiles':
            target = query.get('id', '').removeprefix('eq.')
            if target == TEACHER:
                STATE.profile.update(body)
            for row in STATE.students:
                if row['student_id'] == target:
                    row['student'].update(body)
            self.send_response(204); self.end_headers()
            return None
        rows = {'notifications': STATE.notifications, 'lessons': STATE.lessons, 'assignments': STATE.assignments, 'payments': STATE.payments,
                'cancellation_requests': STATE.cancellation_requests, 'student_records': STATE.students}.get(table, [])
        if 'id' in query:
            selector = query['id']
            ids = selector[4:-1].split(',') if selector.startswith('in.(') else [selector.removeprefix('eq.')]
            matches = [row for row in rows if row.get('id') in ids]
        else:
            matches = [row for row in rows if all(str(row.get(key)) == value.removeprefix('eq.') for key, value in query.items())]
        for row in matches:
            row.update(body)
        self.send_response(204); self.end_headers()


def _matches(row: dict, query: str) -> bool:
    """Minimal PostgREST filtering: eq, neq, is.null, lt/lte/gt/gte on strings (select/order are ignored)."""
    for key, value in urllib.parse.parse_qsl(query):
        if key in ('select', 'order', 'limit'):
            continue
        if value.startswith('eq.') and str(row.get(key)) != value[3:]:
            return False
        if value.startswith('neq.') and str(row.get(key)) == value[4:]:
            return False
        if value == 'is.null' and row.get(key) is not None:
            return False
        for operator, test in (('lt.', lambda a, b: a < b), ('lte.', lambda a, b: a <= b), ('gt.', lambda a, b: a > b), ('gte.', lambda a, b: a >= b)):
            if value.startswith(operator) and (row.get(key) is None or not test(str(row.get(key)), value[len(operator):])):
                return False
    return True


def _delete(self) -> None:
    url = urllib.parse.urlparse(self.path)
    if not self._authorized():
        return
    if url.path.startswith('/storage/v1/object/'):
        for prefix in self._body().get('prefixes', []):
            STATE.uploads.pop(url.path.split('/storage/v1/object/', 1)[1] + '/' + prefix, None)
            STATE.removed_files.append(prefix)
        self._json(200, [])
        return
    query = dict(urllib.parse.parse_qsl(url.query))
    table = url.path.removeprefix('/rest/v1/')
    rows = {'materials': STATE.materials, 'assignments': STATE.assignments, 'payments': STATE.payments, 'material_assignments': STATE.material_assignments,
            'lessons': STATE.lessons, 'student_records': STATE.students, 'teacher_invitations': STATE.teacher_invitations,
            'question_bank': STATE.question_bank}.get(table)
    if rows is None:
        self._json(404, {'message': 'not found'})
        return
    def matches(row):
        return all(str(row.get(key)) == value.removeprefix('eq.') for key, value in query.items())
    rows[:] = [row for row in rows if not matches(row)]
    self.send_response(204)
    self.end_headers()


Handler.do_DELETE = _delete
STATE.removed_files = []


def serve(port: int = 0) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 54321
    print(f'Fake Supabase on http://127.0.0.1:{port} (professor@exemplo.com / demo123)')
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()

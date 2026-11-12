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
            {'id': 'l4', 'teacher_id': TEACHER, 'student_id': 'st-ana', 'starts_at': at(-2, 18), 'duration_minutes': 60, 'topic': 'Past simple vs past continuous', 'online_url': '', 'status': 'completed', 'notes': 'Boa evolução nos verbos irregulares.', 'homework': 'Escrever uma história de 80 palavras.'},
        ]
        self.notifications = [
            {'id': 'n1', 'user_id': TEACHER, 'kind': 'assessment', 'title': 'Avaliação enviada', 'description': 'Ana Souza enviou "Level Check - B1".', 'target': 'Avaliações', 'urgent': True, 'scheduled_for': iso(-30), 'read_at': None, 'created_at': iso(-30)},
            {'id': 'n2', 'user_id': TEACHER, 'kind': 'lesson', 'title': 'Aula confirmada', 'description': 'Bruno Lima confirmou a aula de hoje às 20:00.', 'target': 'Agenda', 'urgent': False, 'scheduled_for': iso(-180), 'read_at': None, 'created_at': iso(-180)},
            {'id': 'n3', 'user_id': TEACHER, 'kind': 'payment', 'title': 'Pagamento recebido', 'description': 'Carla Mendes pagou a mensalidade de novembro.', 'target': 'Financeiro', 'urgent': False, 'scheduled_for': iso(-1500), 'read_at': iso(-1400), 'created_at': iso(-1500)},
        ]
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
        if url.path.startswith('/rest/v1/rpc/'):
            return self._rpc(url.path.rsplit('/', 1)[1], body)
        if url.path == '/rest/v1/lessons':
            row = {'id': f'l{len(STATE.lessons) + 1}', 'teacher_id': TEACHER, 'status': 'scheduled', 'notes': '', 'homework': '', **body}
            STATE.lessons.append(row)
            return self._json(201, [row])
        return self._json(404, {'message': 'not found'})

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
            return self._json(200, sorted(STATE.lessons, key=lambda row: row['starts_at']))
        if table == 'notifications':
            return self._json(200, sorted(STATE.notifications, key=lambda row: row['scheduled_for'], reverse=True))
        if table == 'profiles':
            return self._json(200, [{'id': TEACHER, 'role': 'teacher', 'full_name': 'Professor Demo', 'email': 'professor@exemplo.com'}])
        return self._json(404, {'message': 'not found'})

    def do_PATCH(self) -> None:
        url = urllib.parse.urlparse(self.path)
        if not self._authorized():
            return None
        body = self._body()
        query = dict(urllib.parse.parse_qsl(url.query))
        table = url.path.removeprefix('/rest/v1/')
        rows = {'notifications': STATE.notifications, 'lessons': STATE.lessons}.get(table, [])
        selector = query.get('id', '')
        ids = selector[4:-1].split(',') if selector.startswith('in.(') else [selector.removeprefix('eq.')]
        for row in rows:
            if row['id'] in ids:
                row.update(body)
        self.send_response(204); self.end_headers()


def serve(port: int = 0) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 54321
    print(f'Fake Supabase on http://127.0.0.1:{port} (professor@exemplo.com / demo123)')
    ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()

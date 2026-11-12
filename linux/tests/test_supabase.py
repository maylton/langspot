import time
import unittest

from langspot_linux.supabase import ApiError, AuthError, SupabaseClient
from tests import fake_supabase


class ClientTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = fake_supabase.serve()
        cls.url = f'http://127.0.0.1:{cls.server.server_port}'

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def client(self):
        sessions = []
        client = SupabaseClient(self.url, 'demo', on_session=sessions.append)
        return client, sessions

    def test_wrong_password_is_translated(self):
        client, _ = self.client()
        with self.assertRaisesRegex(AuthError, 'E-mail ou senha incorretos'):
            client.sign_in('professor@exemplo.com', 'wrong')

    def test_sign_in_select_rpc_update(self):
        client, sessions = self.client()
        client.sign_in('professor@exemplo.com', 'demo123')
        self.assertEqual(sessions[-1].user_id, fake_supabase.TEACHER)
        lessons = client.select('lessons', order='starts_at.asc')
        self.assertGreaterEqual(len(lessons), 4)
        queue = client.rpc('list_assessment_review_queue')
        self.assertIn('items', queue)
        client.update('notifications', {'read_at': '2026-11-12T00:00:00Z'}, id='eq.n2')
        self.assertIsNotNone(next(row for row in fake_supabase.STATE.notifications if row['id'] == 'n2')['read_at'])
        self.assertTrue(client.signed_url('assessment-audio', 'audio/x.wav').startswith(self.url + '/storage/v1/object/sign/'))

    def test_expired_token_is_refreshed_and_retried(self):
        client, sessions = self.client()
        client.sign_in('professor@exemplo.com', 'demo123')
        fake_supabase.STATE.access_tokens.discard(client.session.access_token)  # server-side expiry
        rows = client.select('notifications')
        self.assertTrue(rows)
        self.assertEqual(len(sessions), 2)

    def test_refresh_ahead_of_expiry_and_restore(self):
        client, _ = self.client()
        session = client.sign_in('professor@exemplo.com', 'demo123')
        client.session.expires_at = time.time() + 10
        client.select('lessons')
        self.assertNotEqual(client.session.access_token, session.access_token)
        restored, _ = self.client()
        restored.refresh(client.session.refresh_token)
        self.assertTrue(restored.select('student_records'))

    def test_errors(self):
        client, _ = self.client()
        with self.assertRaises(AuthError):
            client.select('lessons')
        client.sign_in('professor@exemplo.com', 'demo123')
        with self.assertRaisesRegex(ApiError, 'not found'):
            client.rpc('missing_function')
        offline = SupabaseClient('http://127.0.0.1:9', 'demo', timeout=2)
        with self.assertRaisesRegex(ApiError, 'Sem conexão'):
            offline.sign_in('a', 'b')


if __name__ == '__main__':
    unittest.main()

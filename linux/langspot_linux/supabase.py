"""Minimal Supabase client (Auth, PostgREST, RPC, Storage) on the standard library.

Calls block: run them through langspot_linux.worker so the UI never waits on the network.
"""
from __future__ import annotations

import json
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Callable


class ApiError(RuntimeError):
    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


class AuthError(ApiError):
    pass


@dataclass
class Session:
    access_token: str
    refresh_token: str
    expires_at: float
    user_id: str
    email: str


_AUTH_MESSAGES = {
    'invalid login credentials': 'E-mail ou senha incorretos.',
    'email not confirmed': 'Confirme o seu e-mail antes de entrar.',
}


class SupabaseClient:
    def __init__(self, url: str, anon_key: str, *, timeout: float = 20, on_session: Callable[[Session | None], None] | None = None):
        self.url = url.rstrip('/')
        self.anon_key = anon_key
        self.timeout = timeout
        self.session: Session | None = None
        self.on_session = on_session
        self._lock = threading.Lock()

    # ------------------------------------------------------------------ HTTP
    def _request(self, method: str, path: str, *, body: Any = None, query: dict | None = None,
                 headers: dict | None = None, auth: bool = True, raw: bool = False) -> Any:
        url = self.url + path
        if query:
            url += ('&' if '?' in url else '?') + urllib.parse.urlencode(query, safe=',.()*:"')
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(url, data=data, method=method)
        request.add_header('apikey', self.anon_key)
        request.add_header('Accept', 'application/json')
        if data is not None:
            request.add_header('Content-Type', 'application/json')
        if auth:
            request.add_header('Authorization', f'Bearer {self._access_token()}')
        for key, value in (headers or {}).items():
            request.add_header(key, value)
        try:
            with urllib.request.urlopen(request, timeout=self.timeout) as response:
                payload = response.read()
        except urllib.error.HTTPError as error:
            raise self._error(error) from None
        except urllib.error.URLError as error:
            raise ApiError('Sem conexão com o LangSpot. Verifique a internet.') from error
        except TimeoutError as error:
            raise ApiError('O LangSpot demorou demais para responder.') from error
        if raw:
            return payload
        if not payload:
            return None
        return json.loads(payload)

    @staticmethod
    def _error(error: urllib.error.HTTPError) -> ApiError:
        try:
            detail = json.loads(error.read() or b'{}')
        except ValueError:
            detail = {}
        message = detail.get('message') or detail.get('msg') or detail.get('error_description') or detail.get('error') or f'Erro {error.code}'
        lowered = str(message).lower()
        for needle, translated in _AUTH_MESSAGES.items():
            if needle in lowered:
                return AuthError(translated, error.code)
        if error.code in (401, 403) and ('jwt' in lowered or 'token' in lowered):
            return AuthError('A sessão expirou. Entre de novo.', error.code)
        return ApiError(str(message), error.code)

    def _authed(self, call: Callable[[], Any]) -> Any:
        try:
            return call()
        except AuthError as error:
            if error.status == 401 and self.session:
                self.refresh()
                return call()
            raise

    # ------------------------------------------------------------------ Auth
    def _set_session(self, payload: dict) -> Session:
        user = payload.get('user') or {}
        self.session = Session(access_token=payload['access_token'], refresh_token=payload['refresh_token'],
                               expires_at=time.time() + float(payload.get('expires_in', 3600)),
                               user_id=user.get('id', ''), email=user.get('email', ''))
        if self.on_session:
            self.on_session(self.session)
        return self.session

    def sign_in(self, email: str, password: str) -> Session:
        payload = self._request('POST', '/auth/v1/token', query={'grant_type': 'password'},
                                body={'email': email.strip(), 'password': password}, auth=False)
        return self._set_session(payload)

    def refresh(self, refresh_token: str | None = None) -> Session:
        token = refresh_token or (self.session.refresh_token if self.session else None)
        if not token:
            raise AuthError('Entre com o seu e-mail e senha.')
        with self._lock:
            payload = self._request('POST', '/auth/v1/token', query={'grant_type': 'refresh_token'},
                                    body={'refresh_token': token}, auth=False)
            return self._set_session(payload)

    def sign_out(self) -> None:
        if self.session:
            try:
                self._request('POST', '/auth/v1/logout')
            except ApiError:
                pass
        self.session = None
        if self.on_session:
            self.on_session(None)

    def _access_token(self) -> str:
        if not self.session:
            raise AuthError('Entre com o seu e-mail e senha.')
        if self.session.expires_at - time.time() < 60:
            self.refresh()
        return self.session.access_token

    # ------------------------------------------------------------------ Data
    def select(self, table: str, select: str = '*', **filters: str) -> list[dict]:
        """GET /rest/v1/<table>; filters use PostgREST syntax, e.g. order='starts_at.asc', status='eq.scheduled'."""
        query = {'select': select, **filters}
        return self._authed(lambda: self._request('GET', f'/rest/v1/{table}', query=query)) or []

    def update(self, table: str, values: dict, **filters: str) -> None:
        self._authed(lambda: self._request('PATCH', f'/rest/v1/{table}', body=values, query=filters,
                                           headers={'Prefer': 'return=minimal'}))

    def insert(self, table: str, values: dict) -> dict:
        rows = self._authed(lambda: self._request('POST', f'/rest/v1/{table}', body=values,
                                                  headers={'Prefer': 'return=representation'}))
        return rows[0] if isinstance(rows, list) and rows else rows

    def delete(self, table: str, **filters: str) -> None:
        if not filters:
            raise ValueError('delete() needs a filter')
        self._authed(lambda: self._request('DELETE', f'/rest/v1/{table}', query=filters, headers={'Prefer': 'return=minimal'}))

    def upsert(self, table: str, values: dict | list, on_conflict: str) -> None:
        self._authed(lambda: self._request('POST', f'/rest/v1/{table}', body=values, query={'on_conflict': on_conflict},
                                           headers={'Prefer': 'resolution=merge-duplicates,return=minimal'}))

    def insert_many(self, table: str, rows: list[dict]) -> None:
        if rows:
            self._authed(lambda: self._request('POST', f'/rest/v1/{table}', body=rows, headers={'Prefer': 'return=minimal'}))

    def upload(self, bucket: str, path: str, data: bytes, content_type: str) -> None:
        quoted = urllib.parse.quote(path)

        def call():
            request = urllib.request.Request(f'{self.url}/storage/v1/object/{bucket}/{quoted}', data=data, method='POST')
            request.add_header('apikey', self.anon_key)
            request.add_header('Authorization', f'Bearer {self._access_token()}')
            request.add_header('Content-Type', content_type or 'application/octet-stream')
            request.add_header('x-upsert', 'false')
            try:
                with urllib.request.urlopen(request, timeout=max(self.timeout, 120)) as response:
                    response.read()
            except urllib.error.HTTPError as error:
                raise self._error(error) from None
            except urllib.error.URLError as error:
                raise ApiError('Sem conexão com o LangSpot. Verifique a internet.') from error

        self._authed(call)

    def remove_files(self, bucket: str, paths: list[str]) -> None:
        if paths:
            self._authed(lambda: self._request('DELETE', f'/storage/v1/object/{bucket}', body={'prefixes': paths}))

    def rpc(self, function: str, **params: Any) -> Any:
        return self._authed(lambda: self._request('POST', f'/rest/v1/rpc/{function}', body=params))

    def signed_url(self, bucket: str, path: str, expires_in: int = 300) -> str:
        quoted = urllib.parse.quote(path)
        result = self._authed(lambda: self._request('POST', f'/storage/v1/object/sign/{bucket}/{quoted}', body={'expiresIn': expires_in}))
        signed = result.get('signedURL') or result.get('signedUrl')
        if not signed:
            raise ApiError('O armazenamento não devolveu o link do arquivo.')
        return signed if signed.startswith('http') else f'{self.url}/storage/v1{signed}'

    def download(self, url: str) -> bytes:
        try:
            with urllib.request.urlopen(url, timeout=self.timeout) as response:
                return response.read()
        except urllib.error.URLError as error:
            raise ApiError('Não foi possível baixar o arquivo.') from error

    def invoke(self, function: str, body: dict, *, origin: str | None = None) -> Any:
        """POST /functions/v1/<function> (Edge Function) as the signed-in user.

        `origin` is sent as the Origin header: functions build their links from it (the web app's address).
        """
        headers = {'Origin': origin} if origin else None
        return self._authed(lambda: self._request('POST', f'/functions/v1/{function}', body=body, headers=headers))

    def update_returning(self, table: str, values: dict, select: str = 'id', **filters: str) -> list[dict]:
        """PATCH that returns the changed rows (empty when the filters matched nothing)."""
        return self._authed(lambda: self._request('PATCH', f'/rest/v1/{table}', body=values, query={'select': select, **filters},
                                                  headers={'Prefer': 'return=representation'})) or []

    def delete_returning(self, table: str, select: str = 'id', **filters: str) -> list[dict]:
        if not filters:
            raise ValueError('delete_returning() needs a filter')
        return self._authed(lambda: self._request('DELETE', f'/rest/v1/{table}', query={'select': select, **filters},
                                                  headers={'Prefer': 'return=representation'})) or []

"""Keeps the refresh token in the system keyring (libsecret), never in a plain file.

LANGSPOT_DISABLE_KEYRING=1 keeps it in memory only (tests and demos), starting from LANGSPOT_REFRESH_TOKEN.
"""
from __future__ import annotations

import os

import gi

gi.require_version('Secret', '1')
from gi.repository import Secret  # noqa: E402

_SCHEMA = Secret.Schema.new('app.langspot.Teacher.Session', Secret.SchemaFlags.NONE, {'service': Secret.SchemaAttributeType.STRING})
_ATTRS = {'service': 'langspot'}


_MEMORY = {'token': os.environ.get('LANGSPOT_REFRESH_TOKEN')}
_DISABLED = os.environ.get('LANGSPOT_DISABLE_KEYRING') == '1'


def save_refresh_token(token: str) -> None:
    if _DISABLED:
        _MEMORY['token'] = token
        return
    Secret.password_store_sync(_SCHEMA, _ATTRS, Secret.COLLECTION_DEFAULT, 'LangSpot (sessão do professor)', token, None)


def load_refresh_token() -> str | None:
    if _DISABLED:
        return _MEMORY['token']
    try:
        return Secret.password_lookup_sync(_SCHEMA, _ATTRS, None)
    except Exception:  # keyring locked or unavailable: ask for the password again
        return None


def clear_refresh_token() -> None:
    if _DISABLED:
        _MEMORY['token'] = None
        return
    try:
        Secret.password_clear_sync(_SCHEMA, _ATTRS, None)
    except Exception:
        pass

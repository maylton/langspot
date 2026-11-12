"""Connection settings: ~/.config/langspot/config.json ({"url": ..., "anonKey": ...}).

The installer writes it from the web project's .env (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
LANGSPOT_SUPABASE_URL and LANGSPOT_SUPABASE_ANON_KEY override it (tests, other environments).
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path


class ConfigError(RuntimeError):
    pass


@dataclass(frozen=True)
class Config:
    url: str
    anon_key: str
    web_url: str


def config_path() -> Path:
    base = Path(os.environ.get('XDG_CONFIG_HOME') or Path.home() / '.config')
    return base / 'langspot' / 'config.json'


def load_config() -> Config:
    from langspot_linux import WEB_URL

    data: dict = {}
    path = config_path()
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding='utf-8'))
        except (OSError, ValueError) as error:
            raise ConfigError(f'Não foi possível ler {path}: {error}') from error
    url = os.environ.get('LANGSPOT_SUPABASE_URL') or data.get('url')
    key = os.environ.get('LANGSPOT_SUPABASE_ANON_KEY') or data.get('anonKey')
    if not url or not key:
        raise ConfigError(f'Configuração do LangSpot não encontrada. Rode o instalador ou crie {path}.')
    return Config(url=url.rstrip('/'), anon_key=key, web_url=(os.environ.get('LANGSPOT_WEB_URL') or data.get('webUrl') or WEB_URL).rstrip('/'))

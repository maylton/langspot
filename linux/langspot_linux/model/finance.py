"""Money, charges, tasks and the materials library."""
from __future__ import annotations

import re
from datetime import date


def money(value: float) -> str:
    """12345.5 → 'R$ 12.345,50'"""
    text = f'{value:,.2f}'.replace(',', '#').replace('.', ',').replace('#', '.')
    return f'R$ {text}'
PAYMENT_LABELS = {'pending': 'Pendente', 'paid': 'Paga', 'overdue': 'Atrasada'}


def payment_status(row: dict, today: date | None = None) -> str:
    """Same rule as the web app: a pending charge past its due date is overdue."""
    today = today or date.today()
    status = row.get('status') or 'pending'
    if status == 'pending' and (row.get('due_date') or '9999-12-31') < today.isoformat():
        return 'overdue'
    return status


def payment_totals(rows: list[dict], today: date | None = None) -> dict:
    totals = {'paid': 0.0, 'open': 0.0, 'overdue': 0.0, 'count': len(rows)}
    for row in rows:
        amount = float(row.get('amount') or 0)
        status = payment_status(row, today)
        if status == 'paid':
            totals['paid'] += amount
        else:
            totals['open'] += amount
            if status == 'overdue':
                totals['overdue'] += amount
    return totals


def short_date(value: str | None) -> str:
    """'2026-11-12' → '12/11/2026'"""
    if not value:
        return '—'
    year, month, day = value[:10].split('-')
    return f'{day}/{month}/{year}'
TASK_LABELS = {'pending': 'Pendente', 'submitted': 'Entregue', 'reviewed': 'Corrigida'}
MATERIAL_TYPES = ['PDF', 'Documento', 'Apresentação', 'Imagem', 'Vídeo', 'Áudio', 'Link', 'Atividade']
MATERIAL_LEVELS = ['Todos', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']
SKILLS = ['Speaking', 'Listening', 'Reading', 'Writing', 'Grammar', 'Vocabulary', 'Pronunciation']
UPLOAD_EXTENSIONS = {'.pdf': ('application/pdf', 'PDF'),
                     '.docx': ('application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Documento'),
                     '.pptx': ('application/vnd.openxmlformats-officedocument.presentationml.presentation', 'Apresentação'),
                     '.jpg': ('image/jpeg', 'Imagem'), '.jpeg': ('image/jpeg', 'Imagem'), '.png': ('image/png', 'Imagem'),
                     '.webp': ('image/webp', 'Imagem'), '.gif': ('image/gif', 'Imagem')}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024


def upload_kind(filename: str, size: int) -> tuple[str, str]:
    """(mime type, material type) for an allowed upload; raises ValueError otherwise."""
    suffix = '.' + filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if suffix not in UPLOAD_EXTENSIONS:
        raise ValueError('Escolha um PDF, DOCX, PPTX ou imagem.')
    if size > MAX_UPLOAD_SIZE:
        raise ValueError('O arquivo passa de 10 MB.')
    return UPLOAD_EXTENSIONS[suffix]


def safe_filename(filename: str) -> str:
    """Same as the web app: drop accents, then any other character becomes '-'."""
    import unicodedata
    plain = ''.join(char for char in unicodedata.normalize('NFD', filename) if unicodedata.category(char) != 'Mn')
    return re.sub(r'[^a-zA-Z0-9._-]', '-', plain)

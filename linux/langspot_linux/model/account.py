"""Teacher account status (trial, active, owner)."""
from __future__ import annotations

from datetime import datetime, timezone

from .common import parse_time


def subscription_active(subscription: dict | None, now: datetime | None = None) -> bool:
    if not subscription:
        return False
    now = now or datetime.now(timezone.utc)
    if subscription.get('plan') == 'owner' or subscription.get('status') == 'active':
        return True
    ends = parse_time(subscription.get('trial_ends_at'))
    return subscription.get('status') == 'trialing' and ends is not None and ends > now


def account_access(subscription: dict | None, now: datetime | None = None) -> tuple[str, str, str] | None:
    """(label, description, kind) like the website's account status card; kind is success / accent / error."""
    if not subscription:
        return None
    now = now or datetime.now(timezone.utc)
    active = subscription_active(subscription, now)
    if subscription.get('plan') == 'owner':
        return 'Acesso permanente', 'Sua conta tem acesso completo ao LangSpot, sem data de expiração.', 'success'
    status = subscription.get('status')
    if status == 'trialing':
        ends = parse_time(subscription.get('trial_ends_at'))
        days = max(0, -(-int((ends - now).total_seconds()) // 86400)) if ends else 0
        title = f'Teste gratuito · {days} dia(s) restante(s)'
    else:
        title = {'active': 'Plano ativo', 'pending_confirmation': 'Confirmação pendente'}.get(status, 'Acesso expirado')
    if status == 'pending_confirmation':
        description = 'Confirme seu e-mail para iniciar os 30 dias de teste gratuito.'
    elif active:
        description = 'Todos os recursos do LangSpot estão liberados para esta conta.'
    else:
        description = 'Seus dados continuam disponíveis, mas novas alterações exigem uma assinatura ativa.'
    return title, description, 'accent' if active else 'error'


def teacher_active(teacher: dict, now: datetime | None = None) -> bool:
    return subscription_active({'plan': teacher.get('plan'), 'status': teacher.get('status'), 'trial_ends_at': teacher.get('trial_ends_at')}, now)

"""An assessment's attempts and one attempt's report: CEFR profile and override, sections, integrity, every question with its review."""
from __future__ import annotations

import re
from typing import Callable

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux import model
from langspot_linux.ui.common import confirm, form_dialog, label, pill, rich_markup, scrolled, text_view, vbox
from langspot_linux.worker import run_async
from .base import _loading, _push, _when
from .student_report import _report_group


def show_results(host, assessment: dict, names: dict[str, str]) -> None:
    holder = Adw.Bin(child=_loading())
    _push(host, f'Resultados · {assessment.get("title")}', holder)

    def loaded(attempts: list[dict]) -> None:
        box = vbox(18)
        box.append(label('Tentativas, notas por seção e revisão pedagógica.', css=('dim-label',)))
        group = Adw.PreferencesGroup(title=f'{len(attempts)} tentativa(s)')
        if not attempts:
            group.add(Adw.ActionRow(title='Nenhuma tentativa', subtitle='Os envios dos alunos aparecem aqui.'))
        for attempt in attempts:
            name = names.get(attempt.get('student_id'), 'Aluno')
            score = attempt.get('scaled_score')
            row = Adw.ActionRow(title=GLib.markup_escape_text(name), activatable=True,
                                subtitle=GLib.markup_escape_text(f'{_when(attempt.get("started_at"))} · {A.ATTEMPT_STATUS.get(attempt.get("status"), attempt.get("status"))} · '
                                                                 + ('aguardando nota' if score is None else f'{score}%')))
            row.add_prefix(Adw.Avatar(size=34, text=name, show_initials=True))
            if attempt.get('estimated_cefr'):
                row.add_suffix(pill(attempt['estimated_cefr'], 'accent'))
            row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
            row.connect('activated', lambda _row, item=attempt: show_attempt(host, item['id'], reload))
            group.add(row)
        box.append(group)
        holder.set_child(scrolled(box))

    def reload() -> None:
        run_async(lambda: host.client.select('assessment_attempts', assessment_id=f'eq.{assessment["id"]}', order='started_at.desc'), loaded,
                  lambda error: host.window.toast(str(error)))
    reload()


def _fetch_result(client, attempt_id: str) -> dict:
    result = client.rpc('get_assessment_result', p_attempt_id=attempt_id)
    try:
        result['cefrProfile'] = client.rpc('get_attempt_cefr_profile', p_attempt_id=attempt_id)
    except Exception:
        result['cefrProfile'] = None
    try:
        result['signals'] = client.rpc('get_assessment_integrity_signals', p_attempt_id=attempt_id)
    except Exception:
        result['signals'] = None
    return result


def show_attempt(host, attempt_id: str, on_changed: Callable[[], None] | None = None) -> None:
    holder = Adw.Bin(child=_loading())
    page = _push(host, 'Relatório da tentativa', holder)
    client = host.client

    def reload() -> None:
        run_async(lambda: _fetch_result(client, attempt_id), build, lambda error: host.window.toast(str(error)))
        if on_changed:
            on_changed()

    def build(result: dict) -> None:
        attempt = result.get('attempt') or {}
        assessment = result.get('assessment') or {}
        profile = result.get('cefrProfile')
        page.set_title(attempt.get('studentName') or 'Relatório')
        box = vbox(20)

        head = Gtk.Box(spacing=14)
        head.append(Adw.Avatar(size=52, text=attempt.get('studentName') or '?', show_initials=True))
        titles = vbox(2)
        titles.set_hexpand(True)
        titles.append(label(attempt.get('studentName') or 'Aluno', css=('title-2',)))
        titles.append(label(f'{assessment.get("title")} · versão {assessment.get("version")} · {attempt.get("scoringModelVersion") or ""}', css=('dim-label',)))
        head.append(titles)
        score = vbox(0)
        score.set_valign(Gtk.Align.CENTER)
        overall = (profile or {}).get('overallLevel') or (f'{attempt["scaledScore"]}%' if attempt.get('scaledScore') is not None else '—')
        score.append(label(overall, css=('ls-big-number',), xalign=1))
        score.append(label(A.ATTEMPT_STATUS.get(attempt.get('status'), attempt.get('status') or ''), css=('caption', 'dim-label'), xalign=1))
        head.append(score)
        box.append(head)

        box.append(_report_group(host, result))
        if profile:
            box.append(_profile_group(profile))
            override = Gtk.Button(label='Revisar nível CEFR', halign=Gtk.Align.START)
            override.add_css_class('pill')
            override.connect('clicked', lambda *_: _override(host, attempt_id, profile.get('overallLevel'), reload))
            box.append(override)
        sections = Adw.PreferencesGroup(title='Resultado por seção')
        for section in result.get('sections') or []:
            row = Adw.ActionRow(title=GLib.markup_escape_text(A.REPORT_SKILLS.get(section.get('skill') or '', section.get('title') or '')),
                                subtitle=f'{section.get("score")}/{section.get("maxScore")} pontos')
            row.add_suffix(Gtk.LevelBar(min_value=0, max_value=100, value=float(section.get('percentage') or 0), valign=Gtk.Align.CENTER, width_request=150))
            row.add_suffix(label(f'{section.get("percentage") or 0}%', css=('numeric',), wrap=False))
            sections.add(row)
        box.append(sections)
        adaptive = result.get('adaptiveSkills') or []
        if adaptive:
            group = Adw.PreferencesGroup(title='Placement adaptativo')
            for skill in adaptive:
                row = Adw.ActionRow(title=A.REPORT_SKILLS.get(skill.get('skill'), skill.get('skill') or ''),
                                    subtitle=f'ability {skill.get("ability")} · confiança {round(float(skill.get("confidence") or 0) * 100)}% · {skill.get("itemsAnswered")} itens')
                row.add_suffix(pill(skill.get('cefr') or '—', 'accent'))
                group.add(row)
            box.append(group)
        box.append(_integrity_group(result.get('integrity') or {}, result.get('signals')))

        questions = Adw.PreferencesGroup(title='Questões')
        for index, question in enumerate(result.get('questions') or [], 1):
            questions.add(_question_row(host, result, index, question, reload))
        box.append(questions)

        pending = sum(1 for question in result.get('questions') or [] if question.get('gradingStatus') in ('manual_review', 'pending'))
        footer = Adw.PreferencesGroup()
        if pending:
            footer.add(Adw.ActionRow(title=f'{pending} resposta(s) aguardando revisão manual.'))
        elif attempt.get('reviewedAt'):
            footer.add(Adw.ActionRow(title=f'Revisão concluída em {_when(attempt["reviewedAt"])}.'))
        else:
            row = Adw.ActionRow(title='Todas as respostas estão corrigidas.')
            finish = Gtk.Button(label='Concluir revisão', valign=Gtk.Align.CENTER)
            finish.add_css_class('suggested-action')
            finish.connect('clicked', lambda *_: confirm(host.window, 'Concluir a revisão?', f'O resultado e o relatório de {attempt.get("studentName") or "o aluno"} serão liberados.',
                                                         'Concluir', lambda: run_async(lambda: client.rpc('finalize_assessment_review', p_attempt_id=attempt_id),
                                                                                       lambda _r: (host.window.toast('Revisão concluída. O aluno já pode ver o resultado.'),
                                                                                                   host.window.app.poll(), reload()),
                                                                                       lambda error: host.window.toast(str(error)))))
            row.add_suffix(finish)
            footer.add(row)
        box.append(footer)
        holder.set_child(scrolled(box, maximum=900))

    reload()


def _question_row(host, result: dict, index: int, question: dict, reload: Callable[[], None]) -> Gtk.Widget:
    status = question.get('gradingStatus') or ''
    rubric = question.get('rubric') or []
    excluded = status == 'reviewed' and question.get('maxScore') is None and bool(rubric)
    manual = status in ('manual_review', 'pending')
    details = ' · '.join(part for part in (A.label_of(A.QUESTION_TYPES, question.get('type')), {'manual_review': 'aguardando revisão', 'pending': 'pendente',
                                                                                                 'reviewed': 'revisada', 'auto': 'automática'}.get(status, status),
                                           A.question_timing(question)) if part)
    row = Adw.ExpanderRow(title=rich_markup(f'{index}. {question.get("prompt") or ""}'), subtitle=GLib.markup_escape_text(details), title_lines=2)
    row.add_suffix(pill('Excluída' if excluded else f'{question.get("score") if question.get("score") is not None else "—"}/{question.get("maxScore") if question.get("maxScore") is not None else "—"}',
                        'warning' if manual else ''))
    answer = question.get('answer')
    kind = question.get('type')
    if answer == 'live' and kind in ('speaking', 'mediation'):
        shown = 'Aplicada ao vivo pelo professor'
    elif kind == 'speaking':
        shown = 'Gravação enviada' if question.get('mediaPath') or answer else 'Sem gravação'
    else:
        shown = answer or 'Em branco'
    for title, value in (('Resposta do aluno', shown), ('Gabarito', question.get('correctAnswer') or 'Correção manual'),
                         ('Transcrição', question.get('transcript')), ('Explicação', question.get('explanation')), ('Feedback', question.get('teacherFeedback'))):
        if value:
            item = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(str(value)), subtitle_selectable=True)
            item.add_css_class('property')
            row.add_row(item)
    if kind == 'speaking':
        info = A.discarded_info(result, question.get('id'))
        if info is not None:
            deleted, pauses = info
            text = (f'O aluno apagou {deleted} gravação(ões) e enviou a tentativa {deleted + 1} de 3.' if deleted else 'O aluno enviou a primeira gravação, sem apagar nenhuma.')
            row.add_row(Adw.ActionRow(title=text + (f' Pausou {pauses} vez(es) nas gravações apagadas.' if pauses else '')))
    if question.get('mediaPath'):
        audio = Adw.ActionRow(title='Gravação do aluno')
        listen = Gtk.Button(label='Ouvir', valign=Gtk.Align.CENTER)
        listen.connect('clicked', lambda *_: host.show_grading({'skill': kind, 'prompt': question.get('prompt')}, result, question['responseId'], on_saved=reload)
                       if question.get('responseId') else None)
        audio.add_suffix(listen)
        row.add_row(audio)
    if excluded:
        row.add_row(Adw.ActionRow(title='Excluída da avaliação', subtitle='Esta tarefa não conta na nota nem no nível CEFR.'))
    elif status == 'reviewed' and rubric and question.get('rubricScores'):
        for criterion in rubric:
            value = (question.get('rubricScores') or {}).get(criterion['key'])
            item = Adw.ActionRow(title=model.criterion_label(criterion))
            text = (A.CEFR_LEVELS[int(value) - 1] if value and 0 < int(value) <= 11 else '—') if criterion.get('scale') == 'cefr' else f'{value if value is not None else "—"}/{criterion.get("maxScore")}'
            item.add_suffix(pill(text, 'accent'))
            row.add_row(item)
    if question.get('responseId') and (manual or (status == 'reviewed' and rubric and not excluded)):
        meta = {'studentName': (result.get('attempt') or {}).get('studentName'), 'skill': kind, 'prompt': question.get('prompt')}
        action = Adw.ButtonRow(title='Corrigir' if manual else 'Editar correção', start_icon_name='document-edit-symbolic')
        if rubric or kind in A.PRODUCTIVE_TYPES:
            action.connect('activated', lambda *_: host.show_grading(meta, result, question['responseId'], on_saved=reload))
        else:
            action.connect('activated', lambda *_: _score_dialog(host, question, reload))
        row.add_row(action)
    row.set_expanded(manual)
    return row


def _score_dialog(host, question: dict, reload: Callable[[], None]) -> None:
    """Manual score for an answer without rubric (e.g. short answers sent to review)."""
    maximum = float(question.get('maxScore') or 1)
    dialog, page, save = form_dialog(host.window, 'Corrigir resposta', 'Salvar correção')
    group = Adw.PreferencesGroup(description=GLib.markup_escape_text(question.get('answer') or 'Em branco'))
    score = Adw.SpinRow.new_with_range(0, maximum, 0.5)
    score.set_title(f'Nota (0–{maximum:g})')
    score.set_digits(1)
    score.set_value(float(question.get('score') or 0))
    group.add(score)
    page.add(group)
    feedback_group = Adw.PreferencesGroup(title='Feedback')
    frame, feedback = text_view(question.get('teacherFeedback') or '', 80)
    feedback_group.add(frame)
    page.add(feedback_group)

    def submit(*_):
        save.set_sensitive(False)
        run_async(lambda: host.client.rpc('review_assessment_response', p_response_id=question['responseId'], p_score=score.get_value(), p_feedback=feedback(),
                                          p_rubric_scores={}),
                  lambda _r: (dialog.close(), host.window.toast('Correção salva.'), reload()),
                  lambda error: (save.set_sensitive(True), dialog.show_error(str(error))))
    save.connect('clicked', submit)
    dialog.present(host.window)


def _profile_group(profile: dict) -> Gtk.Widget:
    title = f'Nível geral: {profile["overallLevel"]}' if profile.get('overallLevel') else 'Evidência insuficiente'
    group = Adw.PreferencesGroup(title=f'Perfil CEFR · {title}', description=GLib.markup_escape_text(A.placement_label(profile.get('recommendedPlacement'))))
    group.set_header_suffix(pill(f'confiança {A.CONFIDENCE.get(profile.get("confidence"), profile.get("confidence") or "—")}', 'accent'))
    for skill, data in (profile.get('skills') or {}).items():
        data = data or {}
        dimensions = data.get('dimensions') or {}
        row = Adw.ExpanderRow(title=A.PROFILE_SKILLS.get(skill, skill),
                              subtitle=f'confiança {A.CONFIDENCE.get(data.get("confidence"), data.get("confidence"))}' if data.get('confidence') else '')
        row.add_suffix(pill(data.get('level') or '—', 'accent'))
        for dimension, value in dimensions.items():
            match = re.match(r'^(\d+)/(\d+) objective', (value or {}).get('evidence') or '')
            item = Adw.ActionRow(title=A.dimension_label(dimension))
            item.add_suffix(label(f'{match[1]}/{match[2]} acertos' if match else (value or {}).get('level') or '—', css=('numeric',), wrap=False))
            row.add_row(item)
        row.set_enable_expansion(bool(dimensions))
        group.add(row)
    for heading, items, empty in (('Pontos fortes', [A.format_profile_item(item) for item in profile.get('strengths') or []], 'Aguardando mais evidências convergentes.'),
                                  ('Prioridades de desenvolvimento', [A.format_profile_item(item) for item in A.meaningful_priorities(profile)],
                                   'Nenhuma prioridade automática identificada.')):
        item = Adw.ActionRow(title=heading, subtitle=GLib.markup_escape_text('\n'.join(f'• {entry}' for entry in items) or empty), subtitle_lines=0)
        item.add_css_class('property')
        group.add(item)
    if profile.get('flags'):
        group.add(Adw.ActionRow(title='Revisão', subtitle=GLib.markup_escape_text(' · '.join(profile['flags'])), subtitle_lines=0))
    note = Adw.ActionRow(title='PADRÃO INTERNO PROVISÓRIO', subtitle=GLib.markup_escape_text(
        f'{profile.get("disclaimer") or ""}\nRegras: {profile.get("decisionRuleVersion")} · {profile.get("routingRuleVersion")} · relatório {profile.get("reportModelVersion")}'),
        subtitle_lines=0)
    group.add(note)
    return group


def _override(host, attempt_id: str, current: str | None, reload: Callable[[], None]) -> None:
    dialog, page, save = form_dialog(host.window, 'Revisar nível CEFR', 'Registrar revisão')
    group = Adw.PreferencesGroup(description=f'Resultado automático: {current or "sem classificação"}. A revisão fica registrada com data e justificativa, '
                                             'e o aluno passa a ver o nível revisado.')
    levels = Adw.ComboRow(title='Nível revisado', model=Gtk.StringList.new(A.CEFR_LEVELS))
    levels.set_selected(A.CEFR_LEVELS.index(current) if current in A.CEFR_LEVELS else A.CEFR_LEVELS.index('B1'))
    group.add(levels)
    page.add(group)
    reason_group = Adw.PreferencesGroup(title='Justificativa', description='Pelo menos 10 caracteres.')
    frame, reason = text_view('', 90)
    reason_group.add(frame)
    page.add(reason_group)

    def submit(*_):
        if len(reason()) < 10:
            dialog.show_error('Escreva a justificativa (pelo menos 10 caracteres).')
            return
        level = A.CEFR_LEVELS[levels.get_selected()]
        save.set_sensitive(False)

        def work():
            host.client.rpc('override_assessment_cefr_level', p_attempt_id=attempt_id, p_level=level, p_reason=reason())
            try:  # same as the website: re-finalise so the report shows the revised level
                host.client.rpc('finalize_assessment_review', p_attempt_id=attempt_id)
            except Exception:
                pass
        run_async(work, lambda _r: (dialog.close(), host.window.toast(f'Nível revisado para {level}.'), reload()),
                  lambda error: (save.set_sensitive(True), dialog.show_error(str(error))))
    save.connect('clicked', submit)
    dialog.present(host.window)


def _integrity_group(report: dict, signals: dict | None) -> Gtk.Widget:
    events = report.get('events') or []
    count = lambda kind: sum(1 for event in events if event.get('type') == kind)  # noqa: E731
    status = report.get('status') or ''
    group = Adw.PreferencesGroup(title='Integridade', description='Evidências factuais para revisão humana; não determinam fraude automaticamente.')
    group.set_header_suffix(pill(A.INTEGRITY_STATUS.get(status, status.replace('_', ' ')), 'success' if status == 'no_unusual_activity' else 'warning'))
    metrics = [('Saídas da janela', str(report.get('windowExits') or 0)), ('Tempo fora da avaliação', f'{round((report.get("timeOutsideMs") or 0) / 1000)}s'),
               ('Colagens', str(report.get('pasteEvents') or 0)), ('Cópias de texto', str(count('copy_detected'))),
               ('Inserções sem digitar', str(count('bulk_insert_detected') + count('drop_detected'))), ('Conflitos de sessão', str(report.get('sessionConflicts') or 0))]
    summary = Adw.ExpanderRow(title='  ·  '.join(f'{title}: {value}' for title, value in metrics[:3]), subtitle='  ·  '.join(f'{title}: {value}' for title, value in metrics[3:]),
                              title_lines=0, subtitle_lines=0)
    summary.set_enable_expansion(bool(events))
    for event in events:
        item = Adw.ActionRow(title=A.EVENT_LABELS.get(event.get('type'), event.get('type') or ''), subtitle=_when(event.get('occurredAt')))
        metadata = event.get('metadata') or {}
        if metadata:
            item.set_subtitle(GLib.markup_escape_text(f'{_when(event.get("occurredAt"))} · {", ".join(f"{key}: {value}" for key, value in metadata.items())}'))
        summary.add_row(item)
    group.add(summary)
    if signals:
        rapid = signals.get('rapidParts') or []
        fast = signals.get('fastObjectiveAnswers') or {}
        shared = signals.get('sharedWrongAnswers') or []
        lines = [('Leitura rápida demais: ' + '; '.join(f'{part["title"]} ({part["words"]} palavras em {part["seconds"]}s, ≈{part["wordsPerMinute"]} palavras/min)' for part in rapid)
                  + f'. Acima de {signals.get("maxReadingWordsPerMinute")} palavras/min a compreensão é improvável.', True) if rapid else
                 ('Nenhuma parte de leitura concluída em tempo incompatível com o texto.', False),
                 (f'{fast.get("count", 0)} de {fast.get("total", 0)} questões objetivas respondidas em menos de 2 segundos.', (fast.get('count') or 0) >= 5),
                 (('Erros idênticos aos de colegas: ' + '; '.join(f'{match.get("studentName") or "Aluno"} ({match.get("sharedWrong")} de {match.get("ownWrong")} erros iguais)' for match in shared) + '.', True)
                  if shared else ('Nenhum padrão de erros idênticos com colegas nesta avaliação.', False))]
        for text, flagged in lines:
            item = Adw.ActionRow(title='Sinal do servidor', subtitle=GLib.markup_escape_text(text), subtitle_lines=0)
            item.add_prefix(Gtk.Image(icon_name='dialog-warning-symbolic' if flagged else 'object-select-symbolic'))
            group.add(item)
    return group

"""Assessment results (the website's AssessmentResults, AssessmentProgress, CefrAnalytics and LiveAssessmentSession):
attempts, the attempt report with review, CEFR profile and override, integrity, the student report with the
teacher's note (and a PDF), the student's progress with level confirmation, item analytics and live sessions.

`host` is the AssessmentsPage (a Page with GradingMixin)."""
from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Callable

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux import model
from langspot_linux.ui.common import confirm, form_dialog, label, pill, rich_markup, scrolled, text_card, text_view, vbox
from langspot_linux.worker import run_async

STATUS_KIND = {'completed': 'success', 'grading': 'accent', 'submitted': 'accent', 'in_progress': 'warning'}


def _when(value: str | None) -> str:
    return model.short_datetime(value) if value else '—'


def _push(host, title: str, content: Gtk.Widget, header_end: list[Gtk.Widget] | None = None) -> Adw.NavigationPage:
    toolbar = Adw.ToolbarView()
    header = Adw.HeaderBar()
    for widget in header_end or []:
        header.pack_end(widget)
    toolbar.add_top_bar(header)
    toolbar.set_content(content)
    page = Adw.NavigationPage(title=title, child=toolbar)
    host.nav.push(page)
    return page


def _loading() -> Gtk.Widget:
    return Adw.Spinner(halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, width_request=32, height_request=32)


# ---------------------------------------------------------------------- attempts of one assessment
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


# ---------------------------------------------------------------------- one attempt
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


# ---------------------------------------------------------------------- student report and note
def _report_group(host, result: dict) -> Gtk.Widget:
    attempt_id = (result.get('attempt') or {}).get('id')
    container = vbox(8)
    row = Adw.ExpanderRow(title='Relatório para o aluno', subtitle='Comentário, próximos passos e o relatório que o aluno vê (com PDF).',
                          expanded=bool((result.get('attempt') or {}).get('reviewedAt')))
    row.add_prefix(Gtk.Image(icon_name='x-office-document-symbolic'))
    group = Adw.PreferencesGroup()
    group.add(row)
    container.append(group)
    state: dict = {'note': None, 'previous': None}
    summary_box = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=8, bottom_margin=8, left_margin=10, right_margin=10, height_request=80)
    steps_box = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=8, bottom_margin=8, left_margin=10, right_margin=10, height_request=80)
    for title, view in (('Comentário do professor', summary_box), ('Próximos passos', steps_box)):
        frame = Gtk.Frame(child=view, margin_start=12, margin_end=12, margin_top=4, margin_bottom=4)
        heading = Adw.ActionRow(title=title)
        row.add_row(heading)
        row.add_row(frame)
    preview_holder = Adw.Bin()
    row.add_row(preview_holder)
    buttons = Gtk.Box(spacing=8, halign=Gtk.Align.END, margin_top=8, margin_bottom=8, margin_end=12)
    save = Gtk.Button(label='Salvar comentário', sensitive=False)
    save.add_css_class('suggested-action')
    pdf = Gtk.Button(label='Salvar PDF')
    buttons.append(pdf)
    buttons.append(save)
    row.add_row(buttons)

    def text(view: Gtk.TextView) -> str:
        buffer = view.get_buffer()
        return buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), False).strip()

    def note_now() -> dict:
        return {'summary': text(summary_box), 'nextSteps': text(steps_box)}

    def refresh_preview(*_):
        saved = state['note'] or {}
        save.set_sensitive(note_now() != {'summary': saved.get('summary') or '', 'nextSteps': saved.get('nextSteps') or ''})
        preview_holder.set_child(_student_report(result, state['previous'], note_now()))

    summary_box.get_buffer().connect('changed', refresh_preview)
    steps_box.get_buffer().connect('changed', refresh_preview)

    def loaded(values) -> None:
        state['note'], state['previous'] = values
        summary_box.get_buffer().set_text((state['note'] or {}).get('summary') or '')
        steps_box.get_buffer().set_text((state['note'] or {}).get('nextSteps') or '')
        refresh_preview()

    def fetch():
        note = host.client.rpc('get_assessment_report_note', p_attempt_id=attempt_id)
        try:
            previous = host.client.rpc('get_previous_assessment_for_report', p_attempt_id=attempt_id)
        except Exception:
            previous = None
        return note, previous
    run_async(fetch, loaded, lambda error: host.window.toast(f'Não foi possível carregar o comentário: {error}'))

    def submit(*_):
        values = note_now()
        save.set_sensitive(False)

        def done(note) -> None:
            state['note'] = note or values
            host.window.toast('Comentário salvo. O aluno verá quando o resultado estiver liberado.')
            refresh_preview()

        def work():
            host.client.rpc('save_assessment_report_note', p_attempt_id=attempt_id, p_summary=values['summary'], p_next_steps=values['nextSteps'])
            return host.client.rpc('get_assessment_report_note', p_attempt_id=attempt_id)
        run_async(work, done, lambda error: (save.set_sensitive(True), host.window.toast(str(error))))
    save.connect('clicked', submit)
    pdf.connect('clicked', lambda *_: save_report_pdf(host.window, result, state['previous'], note_now()))
    return container


def _report_title(result: dict) -> tuple[str, str]:
    attempt = result.get('attempt') or {}
    completed = attempt.get('reviewedAt') or attempt.get('submittedAt')
    when = ''
    if completed:
        try:
            moment = datetime.fromisoformat(completed.replace('Z', '+00:00')).astimezone()
            when = f'{moment.day:02d} de {model.MONTH_NAMES[moment.month - 1].lower()} de {moment.year}'
        except ValueError:
            when = ''
    return (result.get('assessment') or {}).get('title') or 'Avaliação', ' · '.join(part for part in (attempt.get('studentName'), when) if part)


def _student_report(result: dict, previous: dict | None, note: dict) -> Gtk.Widget:
    attempt = result.get('attempt') or {}
    profile = result.get('cefrProfile')
    report = A.build_student_report(result.get('sections') or [], attempt.get('scaledScore'), profile, previous)
    box = vbox(10)
    box.add_css_class('card')
    box.add_css_class('ls-card')
    box.set_margin_start(12)
    box.set_margin_end(12)
    box.set_margin_top(8)
    title, subtitle = _report_title(result)
    box.append(label('RELATÓRIO DE AVALIAÇÃO · prévia do que o aluno vê', css=('caption-heading', 'dim-label')))
    head = Gtk.Box(spacing=12)
    names = vbox(2)
    names.set_hexpand(True)
    names.append(label(title, css=('title-3',)))
    names.append(label(subtitle, css=('dim-label',)))
    head.append(names)
    overall = (profile or {}).get('overallLevel') or attempt.get('estimatedCefr') or (f'{round(attempt["scaledScore"])}%' if isinstance(attempt.get('scaledScore'), (int, float)) else '—')
    side = vbox(0)
    side.append(label(overall, css=('ls-big-number',), xalign=1))
    caption = 'nível estimado (CEFR)' if (profile or {}).get('overallLevel') else 'resultado geral'
    if report['scoreDelta'] is not None:
        caption += f' · {report["scoreDelta"]:+g} p.p.'
    side.append(label(caption, css=('caption', 'dim-label'), xalign=1))
    head.append(side)
    box.append(head)
    for line in report['skills']:
        row = Gtk.Box(spacing=10)
        row.append(label(line['label'], wrap=False, xalign=0))
        row.get_last_child().set_size_request(160, -1)
        if line['rubric']:
            row.append(label('avaliado pelo professor', css=('dim-label', 'caption'), wrap=False))
            row.get_last_child().set_hexpand(True)
            row.append(pill(line['level'], 'accent'))
        elif line['percentage'] is None and not line['level']:
            row.append(label('não avaliado', css=('dim-label', 'caption'), wrap=False))
            row.get_last_child().set_hexpand(True)
        else:
            row.append(Gtk.LevelBar(min_value=0, max_value=100, value=max(0, min(100, line['percentage'] or 0)), hexpand=True, valign=Gtk.Align.CENTER))
            row.append(label(f'{line["percentage"]}%' + (f' · {line["level"]}' if line['level'] else ''), css=('numeric',), wrap=False))
        if line['delta'] is not None:
            row.append(pill(f'{line["delta"]:+g} p.p.', 'success' if line['delta'] > 0 else 'error' if line['delta'] < 0 else ''))
        elif previous:
            row.append(label('novo', css=('caption', 'dim-label'), wrap=False))
        box.append(row)
    for heading, items in (('Pontos fortes', report['strengths']), ('Prioridades', report['priorities'])):
        if items:
            box.append(label(heading, css=('heading',)))
            box.append(label('\n'.join(f'• {item}' for item in items)))
    if note.get('summary') or note.get('nextSteps'):
        if note.get('summary'):
            box.append(text_card('Comentário do professor', note['summary']))
        if note.get('nextSteps'):
            box.append(text_card('Próximos passos', note['nextSteps']))
    if profile and profile.get('disclaimer'):
        box.append(label(profile['disclaimer'], css=('caption', 'dim-label')))
    return box


def save_report_pdf(window, result: dict, previous: dict | None, note: dict) -> None:
    title, subtitle = _report_title(result)
    student = (result.get('attempt') or {}).get('studentName') or 'aluno'
    name = A.student_form_seed(student).rsplit('-', 1)[0]
    chooser = Gtk.FileDialog(title='Salvar relatório em PDF', initial_name=f'relatorio-{name}.pdf')

    def finished(dlg, outcome):
        try:
            target = Path(dlg.save_finish(outcome).get_path())
        except GLib.Error:
            return
        try:
            write_report_pdf(target, result, previous, note)
            window.toast(f'PDF salvo: {target.name}')
        except Exception as error:  # noqa: BLE001 - shown to the teacher
            window.toast(f'Não foi possível gerar o PDF: {error}')
    chooser.save(window, None, finished)


def write_report_pdf(path: Path, result: dict, previous: dict | None, note: dict) -> None:
    """The student report as an A4 PDF (Cairo + Pango), like the website's print to PDF."""
    import cairo
    import gi
    gi.require_version('PangoCairo', '1.0')
    from gi.repository import Pango, PangoCairo

    attempt = result.get('attempt') or {}
    profile = result.get('cefrProfile')
    report = A.build_student_report(result.get('sections') or [], attempt.get('scaledScore'), profile, previous)
    title, subtitle = _report_title(result)
    width, height, margin = 595, 842, 56
    surface = cairo.PDFSurface(str(path), width, height)
    context = cairo.Context(surface)
    state = {'y': margin}

    def layout(markup: str, size: float, *, bold: bool = False, color=(0.12, 0.14, 0.2), width_pt: float = width - 2 * margin):
        item = PangoCairo.create_layout(context)
        font = Pango.FontDescription.from_string(f'Sans {"Bold " if bold else ""}{size}')
        item.set_font_description(font)
        item.set_width(int(width_pt * Pango.SCALE))
        item.set_wrap(Pango.WrapMode.WORD_CHAR)
        item.set_markup(markup, -1)
        return item, color

    def draw(markup: str, size: float = 10.5, *, bold: bool = False, color=(0.12, 0.14, 0.2), gap: float = 6, x: float = margin, width_pt: float | None = None):
        item, color = layout(markup, size, bold=bold, color=color, width_pt=width_pt or width - 2 * margin)
        block = item.get_pixel_extents()[1].height
        if state['y'] + block > height - margin:
            context.show_page()
            state['y'] = margin
        context.set_source_rgb(*color)
        context.move_to(x, state['y'])
        PangoCairo.show_layout(context, item)
        state['y'] += block + gap
        return block

    escape = GLib.markup_escape_text
    accent = (0.2, 0.35, 0.58)
    draw('LANGSPOT · RELATÓRIO DE AVALIAÇÃO', 8.5, bold=True, color=accent, gap=4)
    draw(escape(title), 18, bold=True, gap=2)
    draw(escape(subtitle), 10, color=(0.4, 0.42, 0.48), gap=14)
    overall = (profile or {}).get('overallLevel') or attempt.get('estimatedCefr') or (f'{round(attempt["scaledScore"])}%' if isinstance(attempt.get('scaledScore'), (int, float)) else '—')
    caption = 'nível estimado (CEFR)' if (profile or {}).get('overallLevel') else 'resultado geral'
    if report['scoreDelta'] is not None:
        caption += f' · {report["scoreDelta"]:+g} p.p. desde a avaliação anterior'
    draw(f'<b>{escape(overall)}</b>  <span size="small">{escape(caption)}</span>', 22, color=accent, gap=16)
    draw('Resultado por habilidade', 12, bold=True, gap=8)
    for line in report['skills']:
        top = state['y']
        draw(escape(line['label']), 10.5, gap=0, width_pt=150)
        state['y'] = top
        if line['rubric']:
            value = f'{line["level"]}  ·  avaliado pelo professor'
        elif line['percentage'] is None and not line['level']:
            value = 'não avaliado'
        else:
            value = f'{line["percentage"]}%' + (f'  ·  {line["level"]}' if line['level'] else '')
            bar_x, bar_w = margin + 150, 170
            context.set_source_rgb(0.89, 0.92, 0.97)
            context.rectangle(bar_x, top + 4, bar_w, 7)
            context.fill()
            context.set_source_rgb(*accent)
            context.rectangle(bar_x, top + 4, bar_w * max(0, min(100, line['percentage'] or 0)) / 100, 7)
            context.fill()
        if line['delta'] is not None:
            value += f'  ({line["delta"]:+g} p.p.)'
        draw(escape(value), 10.5, gap=6, x=margin + 335, width_pt=width - margin - (margin + 335))
    state['y'] += 8
    for heading, items in (('Pontos fortes', report['strengths']), ('Prioridades de desenvolvimento', report['priorities'])):
        if items:
            draw(heading, 12, bold=True, gap=4)
            for item in items:
                draw('•  ' + escape(item), 10.5, gap=3)
            state['y'] += 8
    for heading, value in (('Comentário do professor', note.get('summary')), ('Próximos passos', note.get('nextSteps'))):
        if value:
            draw(heading, 12, bold=True, gap=4)
            draw(escape(value), 10.5, gap=12)
    if profile and profile.get('disclaimer'):
        draw(escape(profile['disclaimer']), 8.5, color=(0.45, 0.47, 0.52), gap=4)
    surface.finish()


# ---------------------------------------------------------------------- progress (Evolução)
def show_progress(host, students: dict[str, dict], assessments: list[dict], student_id: str | None = None) -> None:
    holder = vbox(18)
    ids = sorted(students, key=lambda key: students[key]['name'].lower())
    content = Adw.Bin()
    if not ids:
        holder.append(Adw.StatusPage(icon_name='system-users-symbolic', title='Nenhum aluno'))
        _push(host, 'Evolução', scrolled(holder))
        return
    state = {'student': student_id if student_id in ids else ids[0]}
    picker = Adw.PreferencesGroup(description='Compare resultados por competência e confirme mudanças de nível.')
    combo_row = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([students[key]['name'] for key in ids]), enable_search=True)
    combo_row.set_selected(ids.index(state['student']))
    picker.add(combo_row)
    holder.append(picker)
    holder.append(content)
    _push(host, 'Evolução', scrolled(holder))

    def load() -> None:
        content.set_child(_loading())
        run_async(lambda: host.client.rpc('get_assessment_progress', p_student_id=state['student']), render,
                  lambda error: content.set_child(label(f'Não foi possível carregar a evolução: {error}', css=('dim-label',))))

    def render(report: dict) -> None:
        box = vbox(18)
        history = report.get('history') or []
        if not history:
            box.append(Adw.StatusPage(icon_name='power-profile-performance-symbolic', title='Sem histórico concluído',
                                      description='Os resultados aparecem depois da conclusão das avaliações.'))
            content.set_child(box)
            return
        summary = Adw.PreferencesGroup()
        current = Adw.ActionRow(title='Nível atual', subtitle=f'{len(history)} avaliação(ões) concluída(s)')
        current.add_suffix(label(report.get('currentLevel') or '—', css=('title-2',), wrap=False))
        summary.add(current)
        box.append(summary)
        group = Adw.PreferencesGroup(title='Histórico')
        for index, item in enumerate(history):
            before = f' · anterior {history[index - 1].get("score") if history[index - 1].get("score") is not None else "—"}%' if index else ''
            row = Adw.ExpanderRow(title=GLib.markup_escape_text(f'{A.short_date(item.get("completedAt"))} · {item.get("title")}'),
                                  subtitle=GLib.markup_escape_text(f'v{item.get("version")} · {item.get("type")}{before}'))
            row.add_suffix(pill(f'{item.get("score") if item.get("score") is not None else "—"}%' + (f' · {item["estimatedCefr"]}' if item.get('estimatedCefr') else ''), 'accent'))
            for skill, value in (item.get('skills') or {}).items():
                line = Adw.ActionRow(title=A.REPORT_SKILLS.get(skill, skill))
                line.add_suffix(label(f'{value}%', css=('numeric',), wrap=False))
                row.add_row(line)
            open_report = Adw.ButtonRow(title='Ver relatório', start_icon_name='x-office-document-symbolic')
            open_report.connect('activated', lambda _r, attempt=item['attemptId']: show_attempt(host, attempt))
            row.add_row(open_report)
            if item.get('type') == 'placement' and item.get('estimatedCefr'):
                level = item['estimatedCefr']
                confirm_row = Adw.ButtonRow(title=f'Confirmar nível {level}', start_icon_name='object-select-symbolic')
                confirm_row.connect('activated', lambda _r, attempt=item['attemptId'], value=level: confirm(
                    host.window, f'Confirmar o nível {value} para este aluno?', 'O nível do aluno no perfil é atualizado e a mudança fica registrada no histórico.',
                    'Sim, confirmar', lambda: run_async(lambda: host.client.rpc('confirm_assessment_level_update', p_student_id=state['student'], p_attempt_id=attempt,
                                                                                p_level=value),
                                                        lambda _x: (host.window.toast(f'Nível {value} confirmado.'), load()),
                                                        lambda error: host.window.toast(str(error)))))
                row.add_row(confirm_row)
            group.add(row)
        box.append(group)
        updates = report.get('levelUpdates') or []
        if updates:
            log = Adw.PreferencesGroup(title='Mudanças de nível confirmadas')
            for update in updates:
                log.add(Adw.ActionRow(title=f'{update.get("previousLevel")} → {update.get("confirmedLevel")}', subtitle=_when(update.get('createdAt'))))
            box.append(log)
        content.set_child(box)

    combo_row.connect('notify::selected', lambda row, _p: (state.update(student=ids[row.get_selected()]), load()))
    load()


# ---------------------------------------------------------------------- analytics
def show_analytics(host, assessment: dict) -> None:
    holder = Adw.Bin(child=_loading())
    _push(host, f'Analytics · {assessment.get("title")}', holder)

    def loaded(data: dict) -> None:
        box = vbox(18)
        box.append(label('Indicadores descritivos. Alinhamento pedagógico não equivale a validação psicométrica.', css=('dim-label',)))
        box.append(text_card(f'Status de calibração: {data.get("calibrationStatus")}',
                             f'Discriminação só é exibida após {data.get("minimumCalibrationResponses")} respostas válidas por item. '
                             'Até lá, os dados não sustentam cut scores calibrados.'))
        group = Adw.PreferencesGroup(title=f'{len(data.get("items") or [])} item(ns)')
        for item in data.get('items') or []:
            row = Adw.ExpanderRow(title=rich_markup(item.get('prompt') or ''), subtitle=f'{item.get("cefr")} · {item.get("skill")} · {item.get("responses")} resposta(s)',
                                  title_lines=2)
            for title, value in (('Facility', item.get('facility')), ('Tempo médio', f'{round(item["averageTimeMs"] / 1000)} s' if item.get('averageTimeMs') else None),
                                 ('Discriminação', item.get('discrimination') if item.get('discrimination') is not None else 'dados insuficientes'),
                                 ('Confiabilidade', item.get('reliabilityStatus'))):
                line = Adw.ActionRow(title=title)
                line.add_suffix(label(str(value) if value is not None else '—', css=('numeric',), wrap=False))
                row.add_row(line)
            group.add(row)
        box.append(group)
        holder.set_child(scrolled(box))
    run_async(lambda: host.client.rpc('get_cefr_item_analytics', p_assessment_id=assessment['id']), loaded,
              lambda error: holder.set_child(label(f'Não foi possível carregar os indicadores: {error}', css=('dim-label',))))


# ---------------------------------------------------------------------- live session
class LiveSession:
    """Conduct and score live Speaking / Mediation tasks (preparation and speaking timer, CEFR rubric, private notes)."""

    def __init__(self, host, attempt_id: str, on_results: Callable[[], None] | None = None) -> None:
        self.host = host
        self.attempt_id = attempt_id
        self.on_results = on_results
        self.session: dict | None = None
        self.active: str | None = None
        self.timer_source = 0
        self.timer = {'phase': 'idle', 'prep': 0, 'speaking': 0}
        self.holder = Adw.Bin(child=_loading())
        self.page = _push(host, 'Avaliação ao vivo', self.holder)
        self.page.connect('hidden', lambda *_: self._stop_timer())
        self.load()

    def load(self, preferred: str | None = None, advance: bool = False) -> None:
        def loaded(session: dict) -> None:
            self.session = session
            questions = session.get('questions') or []
            if advance:
                preferred_next = next((question['id'] for question in questions if question.get('gradingStatus') != 'reviewed'), preferred)
                self.active = preferred_next
            else:
                self.active = preferred or self.active or next((question['id'] for question in questions if question.get('gradingStatus') != 'reviewed'),
                                                               questions[0]['id'] if questions else None)
            self.render()
        run_async(lambda: self.host.client.rpc('get_live_assessment_session', p_attempt_id=self.attempt_id), loaded,
                  lambda error: self.holder.set_child(label(f'Não foi possível abrir a sessão ao vivo: {error}', css=('dim-label',))))

    def _stop_timer(self) -> None:
        if self.timer_source:
            GLib.source_remove(self.timer_source)
            self.timer_source = 0

    def render(self) -> None:
        session = self.session or {}
        attempt = session.get('attempt') or {}
        questions = session.get('questions') or []
        self.page.set_title(f'Ao vivo · {attempt.get("studentName") or "Aluno"}')
        scored = sum(1 for question in questions if question.get('gradingStatus') == 'reviewed')
        locked = attempt.get('status') not in ('in_progress', 'submitted', 'grading')
        box = vbox(18)
        head = Gtk.Box(spacing=12)
        names = vbox(2)
        names.set_hexpand(True)
        names.append(label(attempt.get('studentName') or 'Aluno', css=('title-2',)))
        names.append(label((session.get('assessment') or {}).get('title') or '', css=('dim-label',)))
        head.append(names)
        progress = vbox(0)
        progress.append(label(f'{scored}/{len(questions)}', css=('ls-big-number',), xalign=1))
        progress.append(label('tarefa(s) pontuada(s)', css=('caption', 'dim-label'), xalign=1))
        student_count = session.get('studentQuestionCount') or 0
        if student_count:
            part = ('Parte do aluno em andamento.' if attempt.get('studentStarted') else 'O aluno ainda não começou a parte dele.') \
                if attempt.get('status') == 'in_progress' else 'Parte do aluno enviada.'
            progress.append(label(part, css=('caption',), xalign=1))
        head.append(progress)
        box.append(head)

        tasks = Adw.PreferencesGroup(title='Tarefas ao vivo')
        for index, question in enumerate(questions, 1):
            done = question.get('gradingStatus') == 'reviewed'
            row = Adw.ActionRow(title=GLib.markup_escape_text(f'{index}. {A.REPORT_SKILLS.get(question.get("skill"), question.get("sectionTitle") or "")}'),
                                subtitle=rich_markup((question.get('prompt') or '')[:140]), activatable=True)
            row.add_prefix(Gtk.Image(icon_name='object-select-symbolic' if done else 'media-record-symbolic'))
            if question['id'] == self.active:
                row.add_suffix(pill('nesta tela', 'accent'))
            row.connect('activated', lambda _row, key=question['id']: (self._stop_timer(), self.timer.update(phase='idle'), setattr(self, 'active', key), self.render()))
            tasks.add(row)
        box.append(tasks)
        active = next((question for question in questions if question['id'] == self.active), None)
        if active:
            box.append(self._task(active, locked))

        footer = Adw.PreferencesGroup()
        status = attempt.get('status')
        if status == 'completed':
            message = 'Avaliação concluída. O resultado já está em Resultados e na evolução do aluno.'
        elif scored < len(questions):
            message = 'Pontue todas as tarefas para concluir a parte ao vivo.'
        elif student_count and status == 'in_progress':
            message = 'Parte ao vivo concluída. A avaliação segue para revisão quando o aluno enviar a parte dele.'
        elif student_count:
            message = 'Parte ao vivo concluída. Finalize a revisão da parte do aluno em Resultados.'
        else:
            message = 'Todas as tarefas foram pontuadas.'
        end = Adw.ActionRow(title=message)
        if scored == len(questions) and questions and not student_count and status == 'in_progress':
            finish = Gtk.Button(label='Concluir avaliação', valign=Gtk.Align.CENTER)
            finish.add_css_class('suggested-action')
            finish.connect('clicked', lambda *_: run_async(lambda: self.host.client.rpc('complete_live_assessment_session', p_attempt_id=self.attempt_id),
                                                           lambda _r: (self.host.window.toast('Avaliação concluída.'), self.load()),
                                                           lambda error: self.host.window.toast(str(error))))
            end.add_suffix(finish)
        if student_count and status in ('grading', 'completed'):
            results = Gtk.Button(label='Abrir resultados', valign=Gtk.Align.CENTER)
            results.connect('clicked', lambda *_: show_attempt(self.host, self.attempt_id))
            end.add_suffix(results)
        footer.add(end)
        box.append(footer)
        self.holder.set_child(scrolled(box, maximum=900))

    def _task(self, question: dict, locked: bool) -> Gtk.Widget:
        box = vbox(14)
        meta = Gtk.Box(spacing=6)
        for text in (A.REPORT_SKILLS.get(question.get('skill'), question.get('skill') or ''), question.get('cefr'), (question.get('taskType') or '').replace('_', ' '),
                     question.get('estimatedDurationLabel')):
            if text:
                meta.append(pill(text, 'accent'))
        if question.get('gradingStatus') == 'reviewed':
            meta.append(pill('Pontuada', 'success'))
        box.append(meta)
        prompt = label('', selectable=True, css=('title-4',))
        prompt.set_markup(rich_markup(question.get('prompt')))
        box.append(prompt)
        if question.get('sourceMaterial'):
            card = text_card('Material de apoio', '')
            body = card.get_last_child()
            body.set_markup(rich_markup(question['sourceMaterial']))
            box.append(card)
        if question.get('primaryEvidence') or question.get('operationalDescriptor'):
            evidence = Adw.PreferencesGroup()
            for title, value in (('Evidência esperada', question.get('primaryEvidence')), ('Descritor', question.get('operationalDescriptor'))):
                if value:
                    row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(value), subtitle_lines=0)
                    row.add_css_class('property')
                    evidence.add(row)
            box.append(evidence)
        box.append(self._timer(question))

        rubric = question.get('rubric') or []
        maximum = float(question.get('maxScore') or 0)
        existing = question.get('rubricScores') or {}
        scoring = Adw.PreferencesGroup(title='Pontuação', sensitive=not locked)
        combos: dict[str, Gtk.Widget] = {}
        score_label = label('', css=('heading',), wrap=False)
        manual = None

        def current_score() -> float | None:
            if rubric:
                values = {}
                for criterion in rubric:
                    widget = combos[criterion['key']]
                    values[criterion['key']] = float(widget.get_selected()) if isinstance(widget, Adw.ComboRow) else widget.get_value()
                return A.live_rubric_score(rubric, values, maximum)
            return manual.get_value() if manual else None

        def update(*_):
            value = current_score()
            score_label.set_text(f'Nota: {"—" if value is None else f"{value:g}"} / {maximum:g}')

        for criterion in rubric:
            if criterion.get('scale') == 'cefr':
                widget = Adw.ComboRow(title=model.criterion_label(criterion), model=Gtk.StringList.new(['Escolha…', *A.CEFR_LEVELS]))
                if existing.get(criterion['key']):
                    widget.set_selected(int(existing[criterion['key']]))
                widget.connect('notify::selected', update)
            else:
                widget = Adw.SpinRow.new_with_range(0, float(criterion.get('maxScore') or 0), 0.5)
                widget.set_title(f'{model.criterion_label(criterion)} (0–{criterion.get("maxScore")})')
                widget.set_digits(1)
                widget.set_value(float(existing.get(criterion['key']) or 0))
                widget.connect('notify::value', update)
            combos[criterion['key']] = widget
            scoring.add(widget)
        if not rubric:
            manual = Adw.SpinRow.new_with_range(0, maximum or 100, 0.5)
            manual.set_title(f'Nota (0–{maximum:g})')
            manual.set_digits(2)
            manual.set_value(float(question.get('score') or 0))
            manual.connect('notify::value', update)
            scoring.add(manual)
        box.append(scoring)
        notes_group = Adw.PreferencesGroup(title='Anotações do professor', description='Privadas; o aluno não vê.', sensitive=not locked)
        notes_frame, notes = text_view(question.get('notes') or '', 70)
        notes_group.add(notes_frame)
        box.append(notes_group)
        feedback_group = Adw.PreferencesGroup(title='Feedback para o aluno', sensitive=not locked)
        feedback_frame, feedback = text_view(question.get('teacherFeedback') or '', 60)
        feedback_group.add(feedback_frame)
        box.append(feedback_group)
        footer = Gtk.Box(spacing=12)
        score_label.set_hexpand(True)
        score_label.set_xalign(0)
        footer.append(score_label)
        if not locked:
            save = Gtk.Button(label='Atualizar pontuação' if question.get('gradingStatus') == 'reviewed' else 'Salvar e avançar')
            save.add_css_class('suggested-action')
            save.add_css_class('pill')

            def submit(*_):
                value = current_score()
                if value is None:
                    missing = [model.criterion_label(criterion) for criterion in rubric
                               if criterion.get('scale') == 'cefr' and not combos[criterion['key']].get_selected()]
                    self.host.window.toast(f'Escolha o nível de: {", ".join(missing)}.' if missing else 'Informe a nota.')
                    return
                scores = {key: (int(widget.get_selected()) if isinstance(widget, Adw.ComboRow) else widget.get_value()) for key, widget in combos.items()}
                save.set_sensitive(False)
                self._stop_timer()
                if self.timer['phase'] == 'speaking':
                    self.timer['phase'] = 'paused'
                run_async(lambda: self.host.client.rpc('score_live_assessment_response', p_attempt_id=self.attempt_id, p_question_id=question['id'],
                                                       p_score=round(value, 2), p_feedback=feedback(), p_rubric_scores=scores, p_notes=notes(),
                                                       p_duration_seconds=self.timer['speaking'] or None),
                          lambda _r: (self.host.window.toast('Pontuação salva.'), self.timer.update(phase='idle', speaking=0), self.load(question['id'], advance=True)),
                          lambda error: (save.set_sensitive(True), self.host.window.toast(f'Não foi possível salvar a pontuação: {error}')))
            save.connect('clicked', submit)
            footer.append(save)
        box.append(footer)
        update()
        return box

    def _timer(self, question: dict) -> Gtk.Widget:
        preparation = int(question.get('preparationSeconds') or 0)
        if self.timer['phase'] == 'idle' and not self.timer['speaking']:
            self.timer.update(prep=preparation, speaking=int(question.get('durationSeconds') or 0))
            if self.timer['speaking']:
                self.timer['phase'] = 'paused'
        group = Adw.PreferencesGroup(title='Cronômetro')
        row = Adw.ActionRow()
        group.add(row)
        clock = label('', css=('ls-big-number', 'numeric'), wrap=False)
        row.add_prefix(clock)
        prep_button = Gtk.Button(label=f'Preparação {A.clock(preparation)}', valign=Gtk.Align.CENTER, visible=bool(preparation))
        talk = Gtk.Button(valign=Gtk.Align.CENTER)
        talk.add_css_class('suggested-action')
        reset = Gtk.Button(icon_name='view-refresh-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Zerar cronômetro')
        reset.add_css_class('flat')
        for widget in (prep_button, talk, reset):
            row.add_suffix(widget)
        target = question.get('recordingSeconds')

        def paint() -> None:
            phase = self.timer['phase']
            title = {'preparing': 'Preparação', 'speaking': 'Fala', 'paused': 'Pausado'}.get(phase, 'Pronto')
            row.set_title(title)
            row.set_subtitle(f'meta: {A.clock(int(target))}' if target else '')
            clock.set_text(A.clock(self.timer['prep'] if phase == 'preparing' else self.timer['speaking']))
            talk.set_label('Pausar' if phase == 'speaking' else 'Retomar fala' if self.timer['speaking'] else 'Iniciar fala')
            prep_button.set_sensitive(phase not in ('preparing', 'speaking'))

        def tick() -> bool:
            if self.timer['phase'] == 'preparing':
                self.timer['prep'] -= 1
                if self.timer['prep'] <= 0:
                    self.timer.update(prep=0, phase='speaking')
            elif self.timer['phase'] == 'speaking':
                self.timer['speaking'] += 1
            else:
                self.timer_source = 0
                return GLib.SOURCE_REMOVE
            if clock.get_root() is None:
                self.timer_source = 0
                return GLib.SOURCE_REMOVE
            paint()
            return GLib.SOURCE_CONTINUE

        def start(phase: str) -> None:
            self.timer['phase'] = phase
            if phase == 'preparing':
                self.timer['prep'] = preparation
            if not self.timer_source:
                self.timer_source = GLib.timeout_add_seconds(1, tick)
            paint()

        prep_button.connect('clicked', lambda *_: start('preparing'))
        talk.connect('clicked', lambda *_: (self.timer.update(phase='paused'), paint()) if self.timer['phase'] == 'speaking' else start('speaking'))
        reset.connect('clicked', lambda *_: (self._stop_timer(), self.timer.update(phase='idle', prep=preparation, speaking=0), paint()))
        paint()
        if self.timer['phase'] in ('preparing', 'speaking') and not self.timer_source:
            self.timer_source = GLib.timeout_add_seconds(1, tick)
        return group

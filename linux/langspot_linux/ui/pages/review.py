"""Review queue: grade Writing, Speaking and Mediation with the CEFR rubric, check and finalise attempts."""
from __future__ import annotations

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, confirm, empty_state, label, pill, scrolled, vbox
from langspot_linux.ui.grading import PRODUCTIVE, GradingMixin
from langspot_linux.worker import run_async


class ReviewPage(GradingMixin, Page):
    key = 'review'
    title = 'Correção'
    icon = 'document-edit-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.queue: dict = {}

    def refresh(self) -> None:
        self.show_loading()
        run_async(lambda: self.client.rpc('list_assessment_review_queue') or {}, self._loaded, self.show_error)

    def _loaded(self, queue: dict) -> None:
        self.queue = queue
        items, ready = queue.get('items') or [], queue.get('readyToFinalize') or []
        self.window.set_count('review', len(items) + len(ready))
        box = vbox(18)
        if not items and not ready:
            box.append(empty_state('document-edit-symbolic', 'Nada para corrigir', 'Quando um aluno enviar Writing, Speaking ou Mediation, a resposta aparece aqui.'))
        if ready:
            group = Adw.PreferencesGroup(title='Prontas para concluir',
                                         description='Todas as respostas já foram corrigidas. Concluir libera o resultado ao aluno.')
            for attempt in ready:
                row = Adw.ActionRow(title=GLib.markup_escape_text(attempt.get('studentName') or 'Aluno'),
                                    subtitle=GLib.markup_escape_text(f'{attempt.get("assessmentTitle")} · enviada {model.relative_time(attempt.get("submittedAt"))}'),
                                    activatable=True)
                row.add_prefix(Adw.Avatar(size=36, text=attempt.get('studentName') or '?', show_initials=True))
                row.add_suffix(pill('Pronta', 'success'))
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, item=attempt: self.show_attempt(item))
                group.add(row)
            box.append(group)
        if items:
            group = Adw.PreferencesGroup(title='Aguardando correção', description='Da entrega mais antiga para a mais recente.')
            for item in items:
                skill = model.SKILL_LABELS.get(item.get('skill') or '', item.get('skill') or '')
                row = Adw.ActionRow(title=GLib.markup_escape_text(f'{item.get("studentName") or "Aluno"} · {skill}'),
                                    subtitle=GLib.markup_escape_text(f'{item.get("assessmentTitle")} · enviada {model.relative_time(item.get("submittedAt"))}'),
                                    activatable=True)
                row.add_prefix(Gtk.Image(icon_name='audio-input-microphone-symbolic' if item.get('type') == 'speaking' else 'document-edit-symbolic'))
                if item.get('cefr'):
                    row.add_suffix(pill(f'alvo {item["cefr"]}', 'accent'))
                if item.get('live'):
                    row.add_suffix(pill('ao vivo', 'warning'))
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, entry=item: self.open_item(entry))
                group.add(row)
            box.append(group)
        self.show_content(scrolled(box))

    # ------------------------------------------------------------------ grading
    def open_item(self, item: dict) -> None:
        if item.get('live'):
            self.window.toast('Tarefas ao vivo são pontuadas na sessão ao vivo, no site.')
            return
        self._with_result(item['attemptId'], lambda result: self.show_grading(item, result, item['responseId']))

    def _with_result(self, attempt_id: str, then) -> None:
        run_async(lambda: self.client.rpc('get_assessment_result', p_attempt_id=attempt_id), then, lambda error: self.window.toast(str(error)))

    def show_attempt(self, ready: dict) -> None:
        self._with_result(ready['attemptId'], lambda result: self._attempt_page(ready, result))

    def _attempt_page(self, ready: dict, result: dict) -> None:
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        holder = Adw.Bin()
        toolbar.set_content(holder)
        page = Adw.NavigationPage(title=ready.get('studentName') or 'Correção', child=toolbar)

        def build(data: dict) -> None:
            box = vbox(18)
            box.append(label('Confira a correção de cada tarefa. Depois de concluir, o resultado e o relatório são liberados ao aluno.', css=('dim-label',)))
            events = (data.get('integrity') or {}).get('events') or []
            for question in data.get('questions') or []:
                if not (question.get('rubric') or question.get('type') in PRODUCTIVE):
                    continue
                excluded = question.get('gradingStatus') == 'reviewed' and question.get('maxScore') is None
                group = Adw.PreferencesGroup(title=model.SKILL_LABELS.get(question.get('type') or '', question.get('type') or ''),
                                             description=GLib.markup_escape_text((question.get('prompt') or '')[:160]))
                if excluded:
                    group.add(Adw.ActionRow(title='Excluída da avaliação', subtitle=GLib.markup_escape_text(question.get('teacherFeedback') or '')))
                else:
                    scores = question.get('rubricScores') or {}
                    for criterion in question.get('rubric') or []:
                        value = scores.get(criterion['key'])
                        row = Adw.ActionRow(title=model.criterion_label(criterion))
                        row.add_suffix(pill(model.CEFR_LEVELS[int(value) - 1] if value else '—', 'accent'))
                        group.add(row)
                    if question.get('teacherFeedback'):
                        feedback = Adw.ActionRow(title='Comentário', subtitle=GLib.markup_escape_text(question['teacherFeedback']), subtitle_selectable=True)
                        feedback.add_css_class('property')
                        group.add(feedback)
                    if question.get('type') == 'speaking':
                        discarded = model.discarded_recordings(events, question.get('id'))
                        if discarded:
                            group.add(Adw.ActionRow(title=f'O aluno apagou {discarded} gravação(ões) antes desta.'))
                    edit = Adw.ButtonRow(title='Editar correção', start_icon_name='document-edit-symbolic')
                    meta = {'studentName': ready.get('studentName'), 'assessmentTitle': ready.get('assessmentTitle'), 'skill': question.get('type'), 'prompt': question.get('prompt')}
                    edit.connect('activated', lambda _row, q=question, m=meta: self.show_grading(m, data, q['responseId'], on_saved=reload))
                    group.add(edit)
                box.append(group)
            finish = Gtk.Button(label='Concluir revisão', halign=Gtk.Align.CENTER)
            finish.add_css_class('suggested-action')
            finish.add_css_class('pill')
            finish.connect('clicked', lambda *_: confirm(self.window, 'Concluir a revisão?',
                                                         f'O resultado e o relatório de {ready.get("studentName") or "o aluno"} serão liberados.',
                                                         'Concluir', lambda: self._finalize(ready)))
            box.append(finish)
            holder.set_child(scrolled(box))

        def reload() -> None:
            run_async(lambda: self.client.rpc('get_assessment_result', p_attempt_id=ready['attemptId']), build, lambda error: self.window.toast(str(error)))

        build(result)
        self.nav.push(page)

    def _finalize(self, ready: dict) -> None:
        def done(_r) -> None:
            self.window.toast('Revisão concluída. O aluno já pode ver o resultado.')
            self.nav.pop_to_tag('root')
            self.window.app.poll()
            self.refresh()

        run_async(lambda: self.client.rpc('finalize_assessment_review', p_attempt_id=ready['attemptId']),
                  done, lambda error: self.window.toast(str(error)))

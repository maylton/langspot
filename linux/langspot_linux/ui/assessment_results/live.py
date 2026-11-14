"""Conduct and score live Speaking / Mediation tasks: timer, CEFR rubric, private notes."""
from __future__ import annotations

from typing import Callable

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux import model
from langspot_linux.ui.common import label, pill, rich_markup, scrolled, text_card, text_view, vbox
from langspot_linux.worker import run_async
from .attempts import show_attempt
from .base import _loading, _push


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

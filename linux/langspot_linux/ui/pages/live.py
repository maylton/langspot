"""Live monitor: students taking a test now, their stage, what is missing and the question on screen."""
from __future__ import annotations

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, empty_state, label, markup, pill, scrolled, text_card, vbox
from langspot_linux.worker import run_async

PRESENCE_KIND = {'online': 'success', 'recent': 'warning', 'away': ''}
STAGE_ICONS = {'done': 'object-select-symbolic', 'current': 'media-record-symbolic', 'open': 'media-playback-start-symbolic',
               'pending': 'changes-prevent-symbolic', 'teacher': 'avatar-default-symbolic'}
LETTERS = 'ABCDEFGH'
REFRESH_SECONDS = 10


class LivePage(Page):
    key = 'live'
    title = 'Ao vivo'
    icon = 'media-record-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self._timer = 0
        self.detail: dict | None = None  # {'attempt': id, 'holder': Adw.Bin, 'selected': question id or None}
        self.nav.connect('popped', lambda *_: self._closed_detail())

    def on_shown(self) -> None:
        super().on_shown()
        if not self._timer:
            self._timer = GLib.timeout_add_seconds(REFRESH_SECONDS, self._tick)

    def _tick(self) -> bool:
        if self.get_mapped():
            if self.detail:
                self._load_detail()
            else:
                self.refresh()
            return GLib.SOURCE_CONTINUE
        self._timer = 0
        return GLib.SOURCE_REMOVE

    def refresh(self) -> None:
        self.show_loading()
        run_async(lambda: self.client.rpc('list_active_teacher_attempts') or [], self._loaded, self.show_error)

    def _loaded(self, attempts: list[dict]) -> None:
        self.window.set_count('live', len(attempts))
        box = vbox(18)
        if not attempts:
            box.append(empty_state('media-record-symbolic', 'Nenhuma prova em andamento',
                                   'Quando um aluno começar uma prova, ela aparece aqui e você recebe uma notificação.'))
        else:
            group = Adw.PreferencesGroup(title='Provas em andamento', description='Atualiza a cada 10 segundos.')
            for attempt in attempts:
                presence = model.presence_of(attempt.get('lastSeenAt'), attempt.get('lastActivityAt'))
                part = model.student_section_title(attempt.get('currentSectionTitle') or '')
                row = Adw.ActionRow(title=GLib.markup_escape_text(attempt.get('studentName') or 'Aluno'),
                                    subtitle=GLib.markup_escape_text(' · '.join(filter(None, [attempt.get('assessmentTitle'), part,
                                                                                             f'{attempt.get("answered", 0)}/{attempt.get("delivered", 0)} respondidas']))),
                                    activatable=True)
                row.add_prefix(Adw.Avatar(size=40, text=attempt.get('studentName') or '?', show_initials=True))
                row.add_suffix(pill(model.PRESENCE_LABELS[presence], PRESENCE_KIND[presence]))
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, item=attempt: self.open(item))
                group.add(row)
            box.append(group)
        self.show_content(scrolled(box))

    # ------------------------------------------------------------------ detail
    def open(self, attempt: dict) -> None:
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
        refresh = Gtk.Button(icon_name='view-refresh-symbolic', tooltip_text='Atualizar')
        refresh.connect('clicked', lambda *_: self._load_detail())
        header.pack_end(refresh)
        toolbar.add_top_bar(header)
        holder = Adw.Bin(child=Adw.Spinner(halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, width_request=32, height_request=32))
        toolbar.set_content(holder)
        self.detail = {'attempt': attempt['attemptId'], 'holder': holder, 'selected': None, 'scroll': 0.0}
        self.nav.push(Adw.NavigationPage(title=attempt.get('studentName') or 'Aluno', tag='detail', child=toolbar))
        self._load_detail()

    def _closed_detail(self) -> None:
        if self.nav.get_visible_page() and self.nav.get_visible_page().get_tag() == 'root':
            self.detail = None
            self.refresh()

    def _load_detail(self) -> None:
        detail = self.detail
        if not detail:
            return
        run_async(lambda: self.client.rpc('get_attempt_live_status', p_attempt_id=detail['attempt']),
                  lambda status: self._render_detail(detail, status), lambda error: self.window.toast(str(error)))

    def _render_detail(self, detail: dict, status: dict) -> None:
        if detail is not self.detail:
            return
        holder = detail['holder']
        old = holder.get_child()
        if isinstance(old, Gtk.ScrolledWindow):
            detail['scroll'] = old.get_vadjustment().get_value()
        attempt = status.get('attempt') or {}
        stages = model.build_stages(status)
        in_progress = attempt.get('status') == 'in_progress'
        viewing = attempt.get('viewingQuestionId') if in_progress else None
        questions = status.get('questions') or []
        student_questions = [question for question in questions if not question.get('live')]
        answered = sum(1 for question in student_questions if question.get('answered'))
        presence = model.presence_of(attempt.get('lastSeenAt'), attempt.get('lastActivityAt'))

        box = vbox(18)
        top = Gtk.Box(spacing=14)
        titles = vbox(4)
        titles.append(label((status.get('assessment') or {}).get('title') or '', css=('title-3',)))
        titles.append(label(f'Última atividade {model.relative_time(attempt.get("lastActivityAt"))}', css=('dim-label',)))
        top.append(titles)
        right = vbox(4)
        right.set_hexpand(True)
        right.set_halign(Gtk.Align.END)
        right.append(pill(model.PRESENCE_LABELS[presence] if in_progress else 'Prova enviada', PRESENCE_KIND[presence] if in_progress else 'accent'))
        right.append(label(f'{answered}/{len(student_questions)}', css=('ls-big-number',), xalign=1))
        right.append(label('respondidas', css=('caption', 'dim-label'), xalign=1))
        top.append(right)
        box.append(top)

        selected = detail['selected'] or viewing or (questions[0]['id'] if questions else None)
        stage_group = Adw.PreferencesGroup(title='Onde o aluno está')
        for stage in stages:
            student_count = sum(1 for question in stage.questions if not question.get('live'))
            parts = [f'Etapa {stage.number}' if stage.number else '', model.STAGE_LABELS[stage.state]]
            if stage.state != 'teacher':
                parts.append(f'{stage.answered}/{student_count}')
            if stage.seconds_left is not None:
                parts.append(f'{model.clock(stage.seconds_left)} restantes')
            row = Adw.ActionRow(title=GLib.markup_escape_text(stage.student_title),
                                subtitle=GLib.markup_escape_text(' · '.join(filter(None, parts))), activatable=bool(stage.questions))
            icon = Gtk.Image(icon_name=STAGE_ICONS[stage.state])
            if stage.state == 'current':
                icon.add_css_class('success')
            row.add_prefix(icon)
            if stage.teacher_detail:
                row.add_suffix(label(stage.teacher_detail, css=('caption', 'dim-label'), wrap=False))
            if stage.questions:
                first = stage.questions[0]['id']
                row.connect('activated', lambda _row, qid=first, st=stage: self._select(detail, None if any(q['id'] == viewing for q in st.questions) else qid, status))
            stage_group.add(row)
        box.append(stage_group)

        missing = model.missing_summary(stages) if in_progress else []
        if in_progress:
            group = Adw.PreferencesGroup(title='O que falta')
            if not missing:
                group.add(Adw.ActionRow(title='Todas as questões têm resposta. Falta só o aluno enviar.'))
            for stage, unanswered in missing:
                row = Adw.ActionRow(title=GLib.markup_escape_text(stage.student_title))
                row.add_suffix(pill('ainda não iniciada' if stage.state == 'pending' else f'{unanswered} sem resposta', 'error'))
                group.add(row)
            box.append(group)

        question = next((item for item in questions if item.get('id') == selected), None)
        if question:
            stage = next((item for item in stages if item.section.get('id') == question.get('sectionId')), None)
            box.append(self._question_card(question, stage, question.get('id') == viewing, detail, status))

        events = status.get('events') or []
        if events:
            group = Adw.PreferencesGroup(title='Sinais recentes')
            for event in events[:8]:
                detail_text = model.event_detail(event)
                row = Adw.ActionRow(title=model.EVENT_LABELS.get(event.get('type'), event.get('type')) + (f' ({detail_text})' if detail_text else ''))
                row.add_suffix(label(model.relative_time(event.get('occurredAt')), css=('caption', 'dim-label'), wrap=False))
                group.add(row)
            box.append(group)

        scroller = scrolled(box)
        holder.set_child(scroller)
        GLib.idle_add(lambda: (scroller.get_vadjustment().set_value(detail.get('scroll', 0.0)), GLib.SOURCE_REMOVE)[1])

    def _select(self, detail: dict, question_id: str | None, status: dict) -> None:
        detail['selected'] = question_id
        self._render_detail(detail, status)

    def _question_card(self, question: dict, stage, viewing: bool, detail: dict, status: dict) -> Gtk.Widget:
        card = vbox(12)
        card.add_css_class('card')
        card.add_css_class('ls-card')
        if viewing:
            card.add_css_class('viewing')
        head = Gtk.Box(spacing=8)
        heading = vbox(2)
        index = stage.questions.index(question) + 1 if stage else 1
        heading.append(label(f'{"ETAPA " + str(stage.number) if stage and stage.number else "TAREFA AO VIVO"} · QUESTÃO {index} DE {len(stage.questions) if stage else 1}',
                             css=('caption-heading', 'dim-label')))
        heading.append(label(stage.student_title if stage else '', css=('title-4',)))
        head.append(heading)
        tag = pill('Na tela do aluno', 'success') if viewing else pill('Respondida', 'accent') if question.get('answered') else pill('Sem resposta')
        tag.set_hexpand(True)
        tag.set_halign(Gtk.Align.END)
        head.append(tag)
        card.append(head)
        if not viewing and detail['selected']:
            back = Gtk.Button(label='Voltar para a questão do aluno', halign=Gtk.Align.START)
            back.add_css_class('flat')
            back.connect('clicked', lambda *_: self._select(detail, None, status))
            card.append(back)

        hint = self._hint(question, stage)
        if hint:
            hint_label = label(hint)
            hint_label.add_css_class('ls-hint')
            card.append(hint_label)
        if stage and stage.section.get('instructions') and index == 1:
            card.append(label(stage.section['instructions'], css=('dim-label',)))
        if question.get('sourceMaterial') and question.get('type') != 'mediation':
            card.append(text_card('', question['sourceMaterial'], css='ls-source'))
        card.append(label(markup(question.get('prompt')), use_markup=True, css=('heading',), selectable=True))
        if question.get('type') == 'mediation' and question.get('sourceMaterial'):
            card.append(text_card('', question['sourceMaterial'], css='ls-source'))
        target = (question.get('responseConstraints') or {}).get('label')
        if target:
            card.append(label(f'{"Duração" if question.get("type") == "speaking" else "Extensão"} esperada: {target}', css=('dim-label',)))
        options = question.get('options') or []
        if options and question.get('type') not in ('writing', 'speaking', 'mediation'):
            for position, option in enumerate(options):
                card.append(label(f'{LETTERS[position] if position < len(LETTERS) else position + 1}.  {option}', css=('ls-option',)))
        if question.get('wordCount') is not None:
            card.append(label(f'{question["wordCount"]} palavras escritas até agora', css=('caption', 'dim-label')))
        return card

    @staticmethod
    def _hint(question: dict, stage) -> str:
        skill = stage.section.get('skill') if stage else ''
        timing = ', '.join(filter(None, [f'{question["preparationSeconds"]}s de preparação' if question.get('preparationSeconds') else '',
                                         f'até {question["recordingSeconds"]}s de gravação' if question.get('recordingSeconds') else '']))
        if question.get('live'):
            return 'Tarefa aplicada ao vivo: leia a instrução com o aluno, conduza a conversa e pontue na sessão ao vivo.'
        if skill == 'spoken_interaction':
            return f'O aluno vê esta instrução e grava a resposta{f" ({timing})" if timing else ""}. Se estiver com ele, você pode fazer o papel do examinador.'
        if question.get('type') == 'speaking':
            return f'O aluno vê esta instrução e grava a resposta{f" ({timing})" if timing else ""}.'
        if question.get('type') == 'mediation':
            return 'O aluno lê o material e escreve a resposta em inglês.'
        return ''

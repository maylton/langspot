"""Assessment draft editor (the website's AssessmentEditor): general settings, sections, questions from the bank
or written by hand, live administration, Listening audio, autosave, validation, publish and the student preview."""
from __future__ import annotations

import copy
import mimetypes
import uuid
from pathlib import Path
from typing import Callable

from gi.repository import Adw, Gio, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux.ui.common import confirm, form_dialog, label, pill, rich_markup, text_view, vbox
from langspot_linux.worker import run_async

BANK_SELECT = '*,question_bank_tasklets(external_id,input_kind,input_text,source_credit,source_reference)'
AUTOSAVE_MS = 1200


def combo(title: str, pairs: list[tuple[str, str]], current, on_change: Callable[[str], None]) -> Adw.ComboRow:
    keys = [key for key, _label in pairs]
    row = Adw.ComboRow(title=title, model=Gtk.StringList.new([text for _key, text in pairs]))
    row.set_selected(keys.index(current) if current in keys else 0)
    row.connect('notify::selected', lambda item, _p: on_change(keys[item.get_selected()]))
    return row


def spin(title: str, low: float, high: float, step: float, value, on_change: Callable[[float], None], *, digits: int = 0, subtitle: str = '') -> Adw.SpinRow:
    row = Adw.SpinRow.new_with_range(low, high, step)
    row.set_title(title)
    if subtitle:
        row.set_subtitle(subtitle)
    row.set_digits(digits)
    row.set_value(float(value if value is not None else low))
    row.connect('notify::value', lambda item, _p: on_change(item.get_value()))
    return row


def entry(title: str, value: str, on_change: Callable[[str], None]) -> Adw.EntryRow:
    row = Adw.EntryRow(title=title, text=value or '')
    row.connect('changed', lambda item: on_change(item.get_text()))
    return row


def switch(title: str, active: bool, on_change: Callable[[bool], None], subtitle: str = '') -> Adw.SwitchRow:
    row = Adw.SwitchRow(title=title, subtitle=subtitle, active=bool(active))
    row.connect('notify::active', lambda item, _p: on_change(item.get_active()))
    return row


class AssessmentEditor:
    def __init__(self, host, draft: dict, *, listening_enabled: bool, students: dict[str, dict], preview_student: str | None,
                 on_published: Callable[[str], None], on_ready_made: Callable[[], None], on_closed: Callable[[], None]) -> None:
        self.host = host
        self.window = host.window
        self.client = host.client
        self.draft = draft
        self.listening = listening_enabled
        self.students = students
        self.preview_student = preview_student
        self.on_published = on_published
        self.on_ready_made = on_ready_made
        self.bank: list[dict] | None = None
        self.saving = False
        self.pending = False
        self.autosave_source = 0
        self.dirty = False

        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
        self.state = label('Salvo', css=('caption', 'dim-label'), wrap=False)
        publish = Gtk.Button(label='Publicar')
        publish.add_css_class('suggested-action')
        publish.connect('clicked', lambda *_: self.publish())
        save = Gtk.Button(icon_name='document-save-symbolic', tooltip_text='Salvar agora')
        save.connect('clicked', lambda *_: self.save(manual=True))
        preview = Gtk.Button(icon_name='view-reveal-symbolic', tooltip_text='Pré-visualizar como o aluno vê')
        preview.connect('clicked', lambda *_: self.preview())
        header.pack_end(publish)
        header.pack_end(save)
        header.pack_end(preview)
        header.pack_end(self.state)
        toolbar.add_top_bar(header)
        self.banner = Adw.Banner(revealed=False)
        toolbar.add_top_bar(self.banner)
        self.scroller = Gtk.ScrolledWindow(hscrollbar_policy=Gtk.PolicyType.NEVER, vexpand=True)
        toolbar.set_content(self.scroller)
        self.page = Adw.NavigationPage(title=draft.get('title') or 'Nova avaliação', child=toolbar)
        self.on_closed = on_closed
        self.popped_handler = host.nav.connect('popped', self._popped)
        self.render()
        host.nav.push(self.page)

    def _popped(self, nav, page) -> None:
        if page is not self.page:
            return
        nav.disconnect(self.popped_handler)
        if self.autosave_source:
            GLib.source_remove(self.autosave_source)
            self.autosave_source = 0
        if self.dirty and (self.draft.get('title') or '').strip():
            self.save()
        self.on_closed()

    # ------------------------------------------------------------------ state
    def changed(self, *, rebuild: bool = False) -> None:
        self.dirty = True
        self.state.set_text('Alterado')
        if self.autosave_source:
            GLib.source_remove(self.autosave_source)
        self.autosave_source = GLib.timeout_add(AUTOSAVE_MS, self._autosave)
        if rebuild:
            GLib.idle_add(lambda: (self.render(), GLib.SOURCE_REMOVE)[1])

    def _autosave(self) -> bool:
        self.autosave_source = 0
        if (self.draft.get('title') or '').strip():
            self.save()
        return GLib.SOURCE_REMOVE

    def save(self, *, manual: bool = False, then: Callable[[str], None] | None = None) -> None:
        if not (self.draft.get('title') or '').strip():
            if manual or then:
                self.show_message('Informe um título antes de salvar.')
            return
        if self.saving:
            self.pending = True
            return
        self.saving = True
        self.dirty = False
        self.state.set_text('Salvando…')
        snapshot = copy.deepcopy(self.draft)
        client = self.client

        def work() -> str:
            assessment_id = client.rpc('save_assessment_draft', p_draft=snapshot)
            client.rpc('save_assessment_cefr_metadata', p_assessment_id=assessment_id, p_metadata=snapshot)
            client.rpc('save_assessment_pacing', p_assessment_id=assessment_id, p_draft=A.pacing_payload(snapshot))
            return assessment_id

        def done(assessment_id: str) -> None:
            self.saving = False
            first = not self.draft.get('id')
            self.draft['id'] = assessment_id
            self.state.set_text('Salvo')
            self.page.set_title(self.draft.get('title') or 'Avaliação')
            if self.pending:
                self.pending = False
                self.save()
            elif first:
                self.render()
            if then:
                then(assessment_id)

        def failed(error: Exception) -> None:
            self.saving = False
            self.dirty = True
            self.state.set_text('Não salvo')
            self.show_message(str(error))
        run_async(work, done, failed)

    def show_message(self, text: str) -> None:
        self.banner.set_title(GLib.markup_escape_text(text))
        self.banner.set_revealed(bool(text))

    # ------------------------------------------------------------------ layout
    def render(self) -> None:
        adjustment = self.scroller.get_vadjustment()
        position = adjustment.get_value()
        draft = self.draft
        box = vbox(20)
        if not A.has_questions(draft):
            hint = Adw.PreferencesGroup()
            row = Adw.ActionRow(title='Esta prova ainda não tem questões',
                                subtitle='Para verificar o nível de um aluno, use uma prova pronta: ela vem completa, com questões revisadas de cada habilidade.')
            ready = Gtk.Button(label='Ver provas prontas', valign=Gtk.Align.CENTER)
            ready.connect('clicked', lambda *_: (self.host.nav.pop(), self.on_ready_made()))
            row.add_suffix(ready)
            hint.add(row)
            box.append(hint)
        if not self.listening and A.has_listening(draft):
            self.show_message('Listening está desativado no momento. Remova as seções e questões de Listening para publicar.')
        box.append(self._general())
        if draft['assessmentMode'] == 'adaptive':
            box.append(self._adaptive())
        if draft['framework'] == 'cefr':
            box.append(self._cefr())
        for index, section in enumerate(draft['sections']):
            box.append(self._section(index, section))
        add = Gtk.Button(label='Adicionar seção', halign=Gtk.Align.CENTER)
        add.add_css_class('pill')
        add.connect('clicked', lambda *_: (draft['sections'].append(A.new_section()), self.changed(rebuild=True)))
        box.append(add)
        clamp = Adw.Clamp(maximum_size=860, child=box, margin_top=18, margin_bottom=24, margin_start=12, margin_end=12)
        self.scroller.set_child(clamp)
        GLib.idle_add(lambda: (adjustment.set_value(position), GLib.SOURCE_REMOVE)[1])

    def _set(self, key: str, rebuild: bool = False):
        def apply(value) -> None:
            self.draft[key] = value
            self.changed(rebuild=rebuild)
        return apply

    def _general(self) -> Gtk.Widget:
        draft = self.draft
        group = Adw.PreferencesGroup(title='Configuração geral', description='Estrutura, aplicação e entrega dos resultados.')
        group.add(entry('Título (ex.: Unit 4 Progress Test)', draft['title'], self._set('title')))
        description = Adw.ExpanderRow(title='Descrição', subtitle=GLib.markup_escape_text((draft.get('description') or 'Sem descrição.')[:90]))
        view = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=10, bottom_margin=10, left_margin=12, right_margin=12, height_request=80)
        view.get_buffer().set_text(draft.get('description') or '')

        def described(buffer) -> None:
            draft['description'] = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), False)
            description.set_subtitle(GLib.markup_escape_text((draft['description'] or 'Sem descrição.')[:90]))
            self.changed()
        view.get_buffer().connect('changed', described)
        description.add_row(view)
        group.add(description)
        group.add(combo('Tipo', A.TYPES, draft['type'], self._set('type')))

        def framework(value: str) -> None:
            A.set_framework(draft, value)
            self.changed(rebuild=True)
        group.add(combo('Framework', A.FRAMEWORKS, draft['framework'], framework))

        def mode(value: str) -> None:
            A.set_mode(draft, value)
            self.changed(rebuild=True)
        group.add(combo('Modo', A.MODES, draft['assessmentMode'], mode))
        group.add(combo('Navegação', A.NAVIGATION, draft['navigationMode'], self._set('navigationMode')))
        paced = A.paced(draft)
        minutes = spin('Tempo (min)', 0, 600, 5, 0 if paced else (draft.get('timeLimitMinutes') or 0),
                       lambda value: self._set('timeLimitMinutes')(int(value) or None), subtitle='Definido por etapa' if paced else '0 = sem limite')
        minutes.set_sensitive(not paced)
        group.add(minutes)
        group.add(spin('Máx. tentativas', 1, 20, 1, draft.get('maxAttempts') or 1, lambda value: self._set('maxAttempts')(int(value))))
        group.add(combo('Resultado para o aluno', A.RESULTS, draft['showResults'], self._set('showResults')))
        if draft['assessmentMode'] == 'fixed':
            group.add(switch('Dividir em etapas', paced, lambda on: self._set('sectionPacing', True)('sections' if on else 'none'),
                             'Cada seção vira uma etapa com tempo próprio; o aluno pode parar entre elas.' if paced else
                             'O aluno faz a prova inteira de uma vez, com um único cronômetro.'))
        group.add(switch('Randomizar questões', draft.get('randomizeQuestions'), self._set('randomizeQuestions')))
        group.add(switch('Randomizar alternativas', draft.get('randomizeOptions'), self._set('randomizeOptions')))
        return group

    def _adaptive(self) -> Gtk.Widget:
        draft = self.draft
        group = Adw.PreferencesGroup(title='Modo adaptativo', description='Critérios de progressão.')
        group.add(spin('Ability inicial (1–10)', 1, 10, 0.5, draft['adaptiveInitialAbility'], self._set('adaptiveInitialAbility'), digits=1))
        group.add(spin('Mínimo por skill', 1, 50, 1, draft['adaptiveMinItems'], lambda value: self._set('adaptiveMinItems')(int(value))))
        group.add(spin('Máximo por skill', 1, 100, 1, draft['adaptiveMaxItems'], lambda value: self._set('adaptiveMaxItems')(int(value))))
        group.add(spin('Confiança para encerrar', 0.1, 0.95, 0.05, draft['adaptiveConfidenceThreshold'], self._set('adaptiveConfidenceThreshold'), digits=2))
        return group

    def _cefr(self) -> Gtk.Widget:
        draft = self.draft
        group = Adw.PreferencesGroup(title='Metadados CEFR', description='Os thresholds iniciais são um PADRÃO INTERNO PROVISÓRIO: o resultado é uma estimativa '
                                                                         'LangSpot alinhada ao CEFR, não uma certificação oficial.')
        group.add(entry('Form version', draft.get('formVersion') or '', self._set('formVersion')))
        rule = Adw.ActionRow(title='Decision rule', subtitle=draft.get('decisionRuleVersion') or '')
        rule.add_css_class('property')
        group.add(rule)
        return group

    def _section(self, index: int, section: dict) -> Gtk.Widget:
        draft = self.draft
        group = Adw.PreferencesGroup(title=f'Seção {index + 1}', description=GLib.markup_escape_text(f'{len(section["questions"])} questão(ões)'))
        remove = Gtk.Button(icon_name='user-trash-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Excluir seção')
        remove.add_css_class('flat')
        remove.connect('clicked', lambda *_: confirm(self.window, f'Excluir “{section["title"]}”?', 'As questões desta seção saem da avaliação.', 'Excluir',
                                                     lambda: (draft['sections'].remove(section), self.changed(rebuild=True)), destructive=True))
        group.set_header_suffix(remove)

        def set_field(key: str, rebuild: bool = False):
            def apply(value) -> None:
                section[key] = value
                self.changed(rebuild=rebuild)
            return apply

        group.add(entry('Título', section.get('title') or '', set_field('title')))
        skills = [pair for pair in A.SECTION_SKILLS if self.listening or pair[0] != 'listening' or section.get('skill') == 'listening']
        group.add(combo('Skill', skills, section.get('skill'), set_field('skill', True)))
        count = len(section['questions'])
        group.add(spin('Questões do pool', 0, max(count, 1), 1, section.get('drawCount') or 0, lambda value: set_field('drawCount')(int(value) or None),
                       subtitle='0 = todas; sorteia esta quantidade das questões da seção'))
        if draft['framework'] == 'cefr':
            group.add(combo('Nível do tasklet', [('', 'Selecione')] + [(level, level) for level in A.CEFR_BASE], section.get('cefrLevel') or '',
                            lambda value: set_field('cefrLevel')(value or None)))
            group.add(combo('Função', A.TASKLET_KINDS, section.get('taskletKind') or 'primary', set_field('taskletKind')))
            group.add(entry('Construct (ex.: reading inference)', section.get('construct') or '', set_field('construct')))
        group.add(entry('Instruções', section.get('instructions') or '', set_field('instructions')))
        if A.paced(draft):
            group.add(spin('Tempo da etapa (min)', 0, 240, 5, section.get('timeLimitMinutes') or 0, lambda value: set_field('timeLimitMinutes')(int(value) or None),
                           subtitle='0 = sem limite'))
        tasklet = next((question['snapshot'].get('taskletId') for question in section['questions'] if question['snapshot'].get('taskletId')), None)
        if section.get('skill') == 'listening' and tasklet:
            ready = all(question['snapshot'].get('audioPath') for question in section['questions'])
            row = Adw.ActionRow(title=tasklet, subtitle='Áudio associado às questões.' if ready else f'Aguardando {tasklet}.mp3')
            row.add_prefix(Gtk.Image(icon_name='audio-x-generic-symbolic'))
            upload = Gtk.Button(label='Associar áudio', valign=Gtk.Align.CENTER)
            upload.connect('clicked', lambda *_: self._pick_audio(lambda path: self._tasklet_audio(section, tasklet, path)))
            row.add_suffix(upload)
            group.add(row)
        for number, question in enumerate(section['questions'], 1):
            group.add(self._question_row(section, number, question))
        actions = Gtk.Box(spacing=8, halign=Gtk.Align.END, margin_top=8)
        from_bank = Gtk.Button(label='Adicionar do banco')
        from_bank.add_css_class('pill')
        from_bank.connect('clicked', lambda *_: self.pick_from_bank(section))
        manual = Gtk.Button(label='Criar questão')
        manual.add_css_class('pill')
        manual.connect('clicked', lambda *_: self.manual_question(section))
        actions.append(from_bank)
        actions.append(manual)
        box = vbox(0)
        box.append(group)
        box.append(actions)
        return box

    def _question_row(self, section: dict, number: int, question: dict) -> Adw.ActionRow:
        snapshot = question['snapshot']
        live = A.is_live(snapshot)
        hint = ' · aplicada ao vivo pelo professor' if live else ' · recomendado: aplicar ao vivo' if section.get('skill') == 'spoken_interaction' and snapshot.get('type') == 'speaking' else ''
        details = ' · '.join(part for part in (A.label_of(A.QUESTION_TYPES, snapshot.get('type')), snapshot.get('cefr') or '', snapshot.get('externalId') or '') if part)
        row = Adw.ActionRow(title=rich_markup(f'{number}. {snapshot.get("prompt") or ""}'), subtitle=GLib.markup_escape_text(details + hint), title_lines=2)
        if A.can_administer_live(snapshot) and self.draft['assessmentMode'] == 'fixed':
            toggle = Gtk.ToggleButton(label='Ao vivo' if live else 'Aluno', active=live, valign=Gtk.Align.CENTER,
                                      tooltip_text='O professor conduz e pontua esta tarefa ao vivo.' if live else 'O aluno responde sozinho. Clique para aplicar ao vivo.')
            toggle.connect('toggled', lambda *_: (A.toggle_live(snapshot), self.changed(rebuild=True)))
            row.add_suffix(toggle)
        remove = Gtk.Button(icon_name='user-trash-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Remover questão')
        remove.add_css_class('flat')
        remove.connect('clicked', lambda *_: (section['questions'].remove(question), self.changed(rebuild=True)))
        row.add_suffix(remove)
        return row

    # ------------------------------------------------------------------ bank
    def _with_bank(self, then: Callable[[], None]) -> None:
        if self.bank is not None:
            then()
            return
        self.state.set_text('Carregando o banco…')

        def done(rows: list[dict]) -> None:
            self.bank = [A.bank_snapshot(row) for row in rows]
            self.state.set_text('Salvo' if not self.dirty else 'Alterado')
            then()
        run_async(lambda: self.client.select('question_bank', select=BANK_SELECT, order='created_at.desc'), done, lambda error: self.show_message(str(error)))

    def pick_from_bank(self, section: dict) -> None:
        self._with_bank(lambda: self._bank_dialog(section))

    def _bank_dialog(self, section: dict) -> None:
        dialog = Adw.Dialog(title=f'Banco · {section.get("title")}', content_width=680, content_height=720)
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        page = Adw.PreferencesPage()
        filters = Adw.PreferencesGroup(description='Mostra os itens compatíveis com a skill da seção. Clique em + para adicionar.')
        state = {'level': 'all', 'status': 'all', 'search': ''}
        level = combo('Nível CEFR', [('all', 'Todos')] + [(item, item) for item in A.CEFR_LEVELS], 'all', lambda value: (state.update(level=value), fill()))
        status = combo('Status', [('all', 'Todos')] + A.QUALITY, 'all', lambda value: (state.update(status=value), fill()))
        search = Adw.EntryRow(title='Buscar (subskill, tipo, tópico, enunciado)')
        search.connect('changed', lambda row: (state.update(search=row.get_text()), fill()))
        for row in (level, status, search):
            filters.add(row)
        page.add(filters)
        results: dict = {'group': None}
        used = {question.get('questionBankId') for question in section['questions']}

        def fill() -> None:
            if results['group']:
                page.remove(results['group'])
            matches = [question for question in self.bank or [] if A.bank_matches(question, section, self.draft['framework'], listening_enabled=self.listening,
                                                                                    level=state['level'], status=state['status'], search=state['search'])]
            group = Adw.PreferencesGroup(title=f'{len(matches)} questão(ões)', description='Mostrando as 60 primeiras; refine a busca.' if len(matches) > 60 else '')
            results['group'] = group
            for question in matches[:60]:
                details = ' · '.join(part for part in (question.get('externalId') or '', question.get('cefr') or '', A.label_of(A.QUESTION_TYPES, question.get('type')),
                                                        question.get('subskill') or '', question.get('qualityStatus') or '') if part)
                row = Adw.ActionRow(title=rich_markup(question.get('prompt') or ''), subtitle=GLib.markup_escape_text(details), title_lines=2)
                add = Gtk.Button(icon_name='object-select-symbolic' if question['bankId'] in used else 'list-add-symbolic', valign=Gtk.Align.CENTER,
                                 sensitive=question['bankId'] not in used, tooltip_text='Adicionar à seção')
                add.add_css_class('flat')

                def added(button, item=question) -> None:
                    section['questions'].append(A.draft_question(item, item['bankId']))
                    used.add(item['bankId'])
                    button.set_icon_name('object-select-symbolic')
                    button.set_sensitive(False)
                    self.changed(rebuild=True)
                add.connect('clicked', added)
                row.add_suffix(add)
                group.add(row)
            page.add(group)
        fill()
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        dialog.present(self.window)

    # ------------------------------------------------------------------ manual question
    def manual_question(self, section: dict) -> None:
        dialog, page, save = form_dialog(self.window, 'Criar questão', 'Adicionar', width=600)
        cefr = self.draft['framework'] == 'cefr'
        types = [pair for pair in A.QUESTION_TYPES if self.listening or pair[0] != 'listening']
        state: dict = {'type': 'multiple_choice', 'audio': None}
        main = Adw.PreferencesGroup()
        kind = combo('Tipo', types, 'multiple_choice', lambda value: (state.update(type=value), visible()))
        prompt = Adw.EntryRow(title='Enunciado')
        level = combo('Nível CEFR', [(item, item) for item in A.CEFR_LEVELS], 'B1', lambda value: state.update(cefr=value))
        state['cefr'] = 'B1'
        difficulty = Adw.SpinRow.new_with_range(1, 10, 1)
        difficulty.set_title('Dificuldade (1–10)')
        difficulty.set_value(5)
        for row in (kind, prompt, level, difficulty):
            main.add(row)
        page.add(main)
        meta = Adw.PreferencesGroup(title='Metadados CEFR', visible=cefr)
        default_skill = section.get('skill', 'grammar').replace('speaking', 'spoken_production').replace('use_of_english', 'language_use')
        if default_skill in ('grammar', 'vocabulary'):
            default_skill = 'language_use'
        cefr_skills = [pair for pair in A.CEFR_SKILLS if self.listening or pair[0] != 'listening']
        state['skill'] = default_skill
        meta.add(combo('Skill', cefr_skills, default_skill, lambda value: state.update(skill=value)))
        fields = {key: Adw.EntryRow(title=title) for key, title in (('subskill', 'Subskill (ex.: inference)'), ('descriptor_id', 'Descriptor ID'),
                                                                    ('descriptor', 'Descritor operacional'), ('task_type', 'Task type'), ('topic', 'Tópico'),
                                                                    ('genre', 'Gênero'))}
        for row in fields.values():
            meta.add(row)
        state['quality'] = 'draft'
        meta.add(combo('Status', A.QUALITY, 'draft', lambda value: state.update(quality=value)))
        page.add(meta)

        options_group = Adw.PreferencesGroup(title='Opções (uma por linha)')
        options_frame, options_value = text_view('', 90)
        options_group.add(options_frame)
        page.add(options_group)
        answer_group = Adw.PreferencesGroup(title='Resposta correta')
        answer_frame, answer_value = text_view('', 60)
        answer_group.add(answer_frame)
        page.add(answer_group)
        truth_group = Adw.PreferencesGroup()
        state['truth'] = 'True'
        truth_group.add(combo('Gabarito', [('True', 'True'), ('False', 'False')], 'True', lambda value: state.update(truth=value)))
        page.add(truth_group)

        listening_group = Adw.PreferencesGroup(title='Listening')
        audio_row = Adw.ActionRow(title='Arquivo de áudio', subtitle='Nenhum arquivo escolhido' if self.draft.get('id') else 'Salve o rascunho para habilitar o upload.')
        choose = Gtk.Button(label='Escolher…', valign=Gtk.Align.CENTER, sensitive=bool(self.draft.get('id')))
        choose.connect('clicked', lambda *_: self._pick_audio(lambda path: (state.update(audio=path), audio_row.set_subtitle(path.name))))
        audio_row.add_suffix(choose)
        plays = Adw.SpinRow.new_with_range(1, 10, 1)
        plays.set_title('Máximo de reproduções')
        plays.set_value(2)
        autoplay = Adw.SwitchRow(title='Reproduzir automaticamente')
        state['transcript_visibility'] = 'after_submit'
        for row in (audio_row, plays, autoplay, combo('Exibir transcrição', A.TRANSCRIPT, 'after_submit', lambda value: state.update(transcript_visibility=value))):
            listening_group.add(row)
        page.add(listening_group)
        transcript_group = Adw.PreferencesGroup(title='Transcrição')
        transcript_frame, transcript_value = text_view('', 70)
        transcript_group.add(transcript_frame)
        page.add(transcript_group)
        source_group = Adw.PreferencesGroup(title='Material-fonte')
        source_frame, source_value = text_view('', 110)
        source_group.add(source_frame)
        page.add(source_group)
        speaking_group = Adw.PreferencesGroup(title='Speaking')
        preparation = Adw.SpinRow.new_with_range(0, 600, 5)
        preparation.set_title('Preparação (segundos)')
        preparation.set_value(30)
        recording = Adw.SpinRow.new_with_range(10, 900, 10)
        recording.set_title('Gravação (segundos)')
        recording.set_value(120)
        review = Adw.SwitchRow(title='Permitir regravação final', subtitle='Desligado por padrão em placement.')
        for row in (preparation, recording, review):
            speaking_group.add(row)
        page.add(speaking_group)
        rubric_note = Adw.PreferencesGroup()
        rubric_label = label('', css=('dim-label', 'caption'))
        rubric_note.add(rubric_label)
        page.add(rubric_note)
        notes = {'writing': 'Rubrica CEFR: Task Achievement, Range, Accuracy, Organisation & Cohesion e Register & Pragmatic Appropriacy.',
                 'speaking': 'Rubrica CEFR: Range, Grammatical Accuracy, Lexical Control, Fluency, Interaction, Coherence e Phonological Control.',
                 'mediation': 'Rubrica CEFR: seleção e precisão da informação, reformulação, organização, adequação ao público e controle linguístico.'}

        def visible() -> None:
            current = state['type']
            productive = current in A.PRODUCTIVE_TYPES
            options_group.set_visible(not productive and current not in ('true_false', 'fill_blank', 'short_answer'))
            options_group.set_title('Opções (uma por linha; “esquerda => direita”)' if current == 'matching' else 'Opções (uma por linha)')
            answer_group.set_visible(not productive and current != 'true_false')
            answer_group.set_title('Gabarito (uma linha por item)' if current in ('ordering', 'multiple_response', 'matching') else 'Resposta correta')
            truth_group.set_visible(current == 'true_false')
            listening_group.set_visible(current == 'listening')
            transcript_group.set_visible(current == 'listening')
            source_group.set_visible(current == 'mediation')
            speaking_group.set_visible(current == 'speaking')
            rubric_note.set_visible(current in notes)
            rubric_label.set_text(notes.get(current, ''))
        visible()

        def submit(*_):
            current = state['type']
            if current == 'listening' and not state['audio']:
                dialog.show_error('Escolha o arquivo de áudio.')
                return
            question_id = uuid.uuid4().hex
            try:
                snapshot = A.manual_snapshot(current, prompt.get_text(), options_text=options_value(),
                                             answer_text=state['truth'] if current == 'true_false' else answer_value(), cefr=state['cefr'],
                                             difficulty=int(difficulty.get_value()), skill=state['skill'] if cefr else None, default_skill=section.get('skill', 'grammar'),
                                             subskill=fields['subskill'].get_text(), descriptor_id=fields['descriptor_id'].get_text(),
                                             descriptor=fields['descriptor'].get_text(), task_type=fields['task_type'].get_text(), topic=fields['topic'].get_text(),
                                             genre=fields['genre'].get_text(), quality=state['quality'], source_material=source_value(),
                                             max_plays=int(plays.get_value()), autoplay=autoplay.get_active(), transcript=transcript_value(),
                                             transcript_visibility=state['transcript_visibility'], preparation_seconds=int(preparation.get_value()),
                                             recording_seconds=int(recording.get_value()), allow_review=review.get_active(), question_id=question_id)
            except ValueError as error:
                dialog.show_error(str(error))
                return
            errors = A.validate_question(snapshot)
            if errors:
                dialog.show_error(errors[0])
                return

            def add(final: dict) -> None:
                section['questions'].append({'id': uuid.uuid4().hex, 'questionBankId': None, 'weight': 1, 'required': True, 'snapshot': final})
                dialog.close()
                self.changed(rebuild=True)
            if current != 'listening':
                add(snapshot)
                return
            save.set_sensitive(False)

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(str(error))
            run_async(lambda: self._upload_audio(question_id, state['audio']), lambda path: add({**snapshot, 'audioPath': path}), failed)
        save.connect('clicked', submit)
        dialog.present(self.window)

    # ------------------------------------------------------------------ Listening audio
    def _pick_audio(self, then: Callable[[Path], None]) -> None:
        if not self.draft.get('id'):
            self.show_message('Salve o rascunho antes de enviar o áudio.')
            return
        chooser = Gtk.FileDialog(title='Escolher áudio')
        filters = Gio.ListStore.new(Gtk.FileFilter)
        audio = Gtk.FileFilter(name='Áudio')
        audio.add_mime_type('audio/*')
        filters.append(audio)
        chooser.set_filters(filters)

        def finished(dlg, result):
            try:
                then(Path(dlg.open_finish(result).get_path()))
            except GLib.Error:
                pass
        chooser.open(self.window, None, finished)

    def _upload_audio(self, question_id: str, path: Path) -> str:
        target = A.audio_path(self.window.profile['id'], self.draft['id'], question_id, path.name)
        self.client.upload(A.AUDIO_BUCKET, target, path.read_bytes(), mimetypes.guess_type(path.name)[0] or 'audio/webm')
        return target

    def _tasklet_audio(self, section: dict, tasklet: str, path: Path) -> None:
        self.state.set_text('Enviando o áudio…')

        def done(target: str) -> None:
            for question in section['questions']:
                question['snapshot']['audioPath'] = target
            self.changed(rebuild=True)
            self.window.toast('Áudio associado ao tasklet.')
        run_async(lambda: self._upload_audio(tasklet, path), done, lambda error: self.show_message(f'Não foi possível enviar o áudio do tasklet: {error}'))

    # ------------------------------------------------------------------ publish and preview
    def publish(self) -> None:
        issues = A.validate_draft(self.draft, listening_enabled=self.listening)
        errors = [message for severity, message in issues if severity == 'error']
        if errors:
            alert = Adw.AlertDialog(heading='Ajuste a avaliação antes de publicar', body='\n'.join(f'• {message}' for message in errors[:12])
                                    + (f'\n… e mais {len(errors) - 12}.' if len(errors) > 12 else ''))
            alert.add_response('ok', 'Voltar e ajustar')
            alert.present(self.window)
            return
        warnings = [message for severity, message in issues if severity == 'warning']
        body = 'Depois de publicada, a prova não pode mais ser editada; você poderá atribuí-la aos alunos.'
        if warnings:
            body = 'São recomendações, não erros:\n' + '\n'.join(f'• {message}' for message in warnings) + '\n\n' + body
        confirm(self.window, 'Publicar mesmo com estes avisos?' if warnings else 'Publicar a avaliação?', body,
                'Sim, publicar', self._confirm_publish)

    def _confirm_publish(self) -> None:
        self.state.set_text('Publicando…')

        def saved(assessment_id: str) -> None:
            def done(_r) -> None:
                self.dirty = False
                self.host.nav.pop()
                self.on_published(assessment_id)
            run_async(lambda: self.client.rpc('publish_assessment', p_assessment_id=assessment_id), done,
                      lambda error: (self.state.set_text('Salvo'), self.show_message(f'Não foi possível publicar: {error}')))
        self.save(then=saved)

    def preview(self) -> None:
        draft = self.draft
        dialog = Adw.Dialog(title='Pré-visualização · como o aluno vê', content_width=720, content_height=760)
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
        key = Gtk.ToggleButton(label='Mostrar gabarito')
        header.pack_start(key)
        toolbar.add_top_bar(header)
        page = Adw.PreferencesPage()
        intro = Adw.PreferencesGroup(title=GLib.markup_escape_text(draft.get('title') or 'Avaliação sem título'),
                                     description=GLib.markup_escape_text(draft.get('description') or 'Sem instruções gerais.'))
        ids = sorted(self.students, key=lambda item: self.students[item]['name'].lower())
        options = [('', 'Nenhum aluno')] + [(item, self.students[item]['name']) for item in ids]
        state: dict = {'student': self.preview_student or '', 'seen': ({}, {})}
        intro.add(combo('Marcar o que este aluno já viu', options, state['student'], lambda value: (state.update(student=value), load_seen())))
        page.add(intro)
        holder: list[Gtk.Widget] = []

        def fill() -> None:
            for group in holder:
                page.remove(group)
            holder.clear()
            items, texts = state['seen']
            name = self.students.get(state['student'], {}).get('name', 'O aluno')
            for index, section in enumerate(draft['sections'], 1):
                questions = section['questions']
                description = section.get('instructions') or ''
                if section.get('drawCount'):
                    description = f'Sorteia {section["drawCount"]} de {len(questions)} questões. ' + description
                group = Adw.PreferencesGroup(title=GLib.markup_escape_text(f'Parte {index} · {section.get("title")}'), description=GLib.markup_escape_text(description))
                shown_texts = set()
                for number, question in enumerate(questions, 1):
                    snapshot = question['snapshot']
                    tasklet = snapshot.get('taskletId')
                    if snapshot.get('sourceMaterial') and snapshot.get('type') != 'mediation' and tasklet not in shown_texts:
                        shown_texts.add(tasklet)
                        text_mark = texts.get(tasklet) if tasklet else None
                        text_row = Adw.ExpanderRow(title='Texto' + (f' · {snapshot.get("taskletTitle")}' if snapshot.get('taskletTitle') else ''),
                                                   subtitle=GLib.markup_escape_text(f'{name} já viu em “{text_mark["assessmentTitle"]}” ({A.short_date(text_mark["seenAt"])})')
                                                   if text_mark else GLib.markup_escape_text(snapshot.get('sourceCredit') or ''))
                        body = label('', selectable=True)
                        body.set_markup(rich_markup(snapshot['sourceMaterial']))
                        body.set_margin_start(12)
                        body.set_margin_end(12)
                        body.set_margin_top(8)
                        body.set_margin_bottom(8)
                        text_row.add_row(body)
                        group.add(text_row)
                    group.add(self._preview_question(number, snapshot, key.get_active(), items.get(snapshot.get('externalId')) if snapshot.get('externalId') else None, name))
                holder.append(group)
                page.add(group)

        def load_seen() -> None:
            if not state['student']:
                state['seen'] = ({}, {})
                fill()
                return
            run_async(lambda: self.client.rpc('list_student_seen_items', p_student_id=state['student']) or [],
                      lambda seen: (state.update(seen=A.seen_index(seen)), fill()), lambda error: self.window.toast(str(error)))
        key.connect('toggled', lambda *_: fill())
        load_seen()
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        dialog.present(self.window)

    @staticmethod
    def _preview_question(number: int, snapshot: dict, show_key: bool, seen: dict | None, name: str) -> Gtk.Widget:
        live = A.is_live(snapshot)
        kind = snapshot.get('type')
        lines = []
        if live:
            lines.append('Você conduz e pontua esta tarefa na sessão ao vivo.')
        elif kind in ('writing', 'mediation'):
            lines.append('O aluno escreve a resposta.')
        elif kind == 'speaking':
            extra = f' ({snapshot.get("preparationSeconds")}s de preparação, {snapshot.get("recordingSeconds")}s de gravação)' if snapshot.get('preparationSeconds') else ''
            lines.append(f'O aluno grava a resposta em áudio{extra}.')
        elif kind in ('fill_blank', 'short_answer'):
            lines.append('Resposta curta digitada pelo aluno.' + (f' Gabarito: {snapshot.get("answer")}' if show_key and snapshot.get('answer') else ''))
        target = (snapshot.get('responseConstraints') or {}).get('label')
        if target:
            lines.append(('Duração esperada: ' if kind == 'speaking' else 'Extensão esperada: ') + target)
        if seen:
            lines.insert(0, f'👁 {name} já viu em “{seen["assessmentTitle"]}” ({A.short_date(seen["seenAt"])})')
        row = Adw.ExpanderRow(title=rich_markup(f'{number}. {snapshot.get("prompt") or ""}'), subtitle=GLib.markup_escape_text('\n'.join(lines)), title_lines=0,
                              subtitle_lines=0)
        if kind == 'mediation' and snapshot.get('sourceMaterial'):
            source = Adw.ActionRow(title='Material-fonte', subtitle=rich_markup(snapshot['sourceMaterial']), subtitle_selectable=True)
            source.add_css_class('property')
            row.add_row(source)
        if snapshot.get('options') and kind not in A.PRODUCTIVE_TYPES:
            answers = A.split_ordering(snapshot.get('answer') or '') if kind == 'multiple_response' else [snapshot.get('answer')]
            for index, option in enumerate(snapshot['options']):
                option_row = Adw.ActionRow(title=GLib.markup_escape_text(f'{"ABCDEFGH"[index] if index < 8 else index + 1}  {option}'))
                if show_key and option in answers:
                    option_row.add_suffix(pill('correta', 'success'))
                row.add_row(option_row)
        if show_key and kind in ('ordering', 'matching') and snapshot.get('answer'):
            key_row = Adw.ActionRow(title='Gabarito', subtitle=GLib.markup_escape_text(' · '.join(A.split_ordering(snapshot['answer']))))
            key_row.add_css_class('property')
            row.add_row(key_row)
        row.set_expanded(bool(snapshot.get('options')) and kind not in A.PRODUCTIVE_TYPES)
        return row

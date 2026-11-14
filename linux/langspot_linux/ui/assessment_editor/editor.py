"""Assessment draft editor (the website's AssessmentEditor): general settings, sections, questions from the bank
or written by hand, live administration, Listening audio, autosave, validation, publish and the student preview."""
from __future__ import annotations

import copy
import mimetypes
from pathlib import Path
from typing import Callable

from gi.repository import Adw, Gio, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux.ui.common import confirm, label, rich_markup, vbox
from langspot_linux.worker import run_async
from .bank import bank_dialog
from .fields import combo, entry, spin, switch
from .manual_question import manual_question
from .preview import preview as show_preview


BANK_SELECT = '*,question_bank_tasklets(external_id,input_kind,input_text,source_credit,source_reference)'
AUTOSAVE_MS = 1200


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
        preview.connect('clicked', lambda *_: show_preview(self))
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
        manual.connect('clicked', lambda *_: manual_question(self, section))
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
        self._with_bank(lambda: bank_dialog(self, section))


    # ------------------------------------------------------------------ manual question

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



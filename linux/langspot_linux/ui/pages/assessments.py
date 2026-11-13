"""Assessments (the website's AssessmentDashboard): attempts in progress, new assessment (ready-made level checks
for a student, blank, empty CEFR placement), drafts, results, analytics, live administration, assignment with
the student's exposure, deletion with its impact, review queue and progress."""
from __future__ import annotations

from datetime import date, timedelta

from gi.repository import Adw, Gio, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux import model
from langspot_linux.ui.assessment_editor import AssessmentEditor
from langspot_linux.ui.assessment_results import LiveSession, show_analytics, show_attempt, show_progress, show_results
from langspot_linux.ui.common import Page, empty_state, form_dialog, label, optional_datetime, pill, scrolled, student_names, vbox
from langspot_linux.ui.grading import GradingMixin
from langspot_linux.worker import run_async

STATUS_KIND = {'draft': 'warning', 'published': 'success', 'archived': ''}


class AssessmentsPage(GradingMixin, Page):
    key = 'assessments'
    title = 'Avaliações'
    icon = 'document-properties-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.items: list[dict] = []
        self.presets: list[dict] = []
        self.live_ids: set[str] = set()
        self.listening = False
        self.students: dict[str, dict] = {}
        self.active: list[dict] = []
        self.pending_reviews = 0
        new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text='Nova avaliação')
        new.add_css_class('suggested-action')
        new.connect('clicked', lambda *_: self.new_assessment())
        self.header.pack_start(new)
        progress = Gtk.Button(icon_name='power-profile-performance-symbolic', tooltip_text='Evolução dos alunos')
        progress.connect('clicked', lambda *_: show_progress(self, self.students, self.items))
        self.header.pack_start(progress)
        queue = Gtk.Button(icon_name='document-edit-symbolic', tooltip_text='Fila de correção')
        queue.connect('clicked', lambda *_: self.window.open_page('review'))
        self.header.pack_end(queue)

    # ------------------------------------------------------------------ data
    def refresh(self) -> None:
        self.show_loading()
        client = self.client

        def work():
            items = client.select('assessments', order='updated_at.desc')
            presets = client.select('cefr_level_check_presets', active='eq.true', order='target_level')
            live = {row['assessment_id'] for row in client.select('assessment_questions', select='assessment_id', **{'question_snapshot->>administration': 'eq.live'})}
            try:
                flags = {row['key']: row['enabled'] for row in client.select('assessment_feature_flags', select='key,enabled')}
            except Exception:
                flags = {}
            students = student_names(client)
            try:
                active = client.rpc('list_active_teacher_attempts') or []
            except Exception:
                active = []
            try:
                queue = client.rpc('list_assessment_review_queue') or {}
            except Exception:
                queue = {}
            return items, presets, live, flags, students, active, queue

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.items, self.presets, self.live_ids, flags, self.students, self.active, queue = result
        self.listening = bool(flags.get('listening', False))
        self.pending_reviews = len(queue.get('items') or []) + len(queue.get('readyToFinalize') or [])
        self.render()

    @property
    def names(self) -> dict[str, str]:
        return {key: value['name'] for key, value in self.students.items()}

    def by_id(self, assessment_id: str) -> dict | None:
        return next((item for item in self.items if item['id'] == assessment_id), None)

    # ------------------------------------------------------------------ dashboard
    def render(self) -> None:
        box = vbox(18)
        if self.active:
            group = Adw.PreferencesGroup(title='Fazendo prova agora', description='Acompanhe ao vivo o que cada aluno está respondendo.')
            for attempt in self.active:
                row = Adw.ActionRow(title=GLib.markup_escape_text(attempt.get('studentName') or 'Aluno'), activatable=True,
                                    subtitle=GLib.markup_escape_text(f'{attempt.get("assessmentTitle")} · começou {model.relative_time(attempt.get("startedAt"))}'))
                row.add_prefix(Gtk.Image(icon_name='media-record-symbolic'))
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, item=attempt: self._monitor(item))
                group.add(row)
            box.append(group)
        if self.pending_reviews:
            queue = Adw.PreferencesGroup()
            row = Adw.ActionRow(title='Fila de correção', subtitle=f'{self.pending_reviews} item(ns) esperando a sua correção', activatable=True)
            row.add_prefix(Gtk.Image(icon_name='document-edit-symbolic'))
            row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
            row.connect('activated', lambda *_: self.window.open_page('review'))
            queue.add(row)
            box.append(queue)
        if not self.items:
            box.append(empty_state('document-properties-symbolic', 'Nenhuma avaliação criada',
                                   'Use o botão + para montar uma prova pronta de nível ou criar a sua.'))
        else:
            for status, title in (('draft', 'Rascunhos'), ('published', 'Publicadas'), ('archived', 'Arquivadas')):
                items = [item for item in self.items if item.get('status') == status]
                if not items:
                    continue
                group = Adw.PreferencesGroup(title=title)
                for item in items:
                    group.add(self._row(item))
                box.append(group)
        self.show_content(scrolled(box))

    def _row(self, assessment: dict) -> Adw.ActionRow:
        status = assessment.get('status')
        minutes = assessment.get('time_limit_minutes')
        details = ' · '.join(part for part in (assessment.get('type') or '', f'{minutes} min' if minutes else 'tempo livre', f'versão {assessment.get("version")}',
                                               f'para {self.names[assessment["generated_for_student_id"]]}' if self.names.get(assessment.get('generated_for_student_id') or '') else '')
                             if part)
        row = Adw.ActionRow(title=GLib.markup_escape_text(assessment.get('title') or 'Avaliação'), subtitle=GLib.markup_escape_text(details), activatable=True)
        row.add_suffix(pill(A.STATUS_LABELS.get(status, status or ''), STATUS_KIND.get(status, '')))
        menu = Gio.Menu()
        actions = Gio.SimpleActionGroup()

        def add(name: str, title: str, callback) -> None:
            menu.append(title, f'assessment.{name}')
            item = Gio.SimpleAction.new(name, None)
            item.connect('activate', lambda *_: callback())
            actions.add_action(item)

        if status == 'draft':
            add('edit', 'Editar rascunho', lambda: self.edit(assessment))
            row.connect('activated', lambda *_: self.edit(assessment))
        elif status == 'published':
            add('assign', 'Atribuir a um aluno', lambda: self.assign(assessment))
            add('results', 'Resultados', lambda: show_results(self, assessment, self.names))
            if assessment.get('framework') == 'cefr':
                add('analytics', 'Analytics', lambda: show_analytics(self, assessment))
            if assessment['id'] in self.live_ids:
                add('live', 'Aplicar ao vivo', lambda: self.live(assessment))
            row.connect('activated', lambda *_: show_results(self, assessment, self.names))
        danger = Gio.Menu()
        danger.append('Excluir avaliação', 'assessment.delete')
        item = Gio.SimpleAction.new('delete', None)
        item.connect('activate', lambda *_: self.delete(assessment))
        actions.add_action(item)
        menu.append_section(None, danger)
        button = Gtk.MenuButton(icon_name='view-more-symbolic', menu_model=menu, valign=Gtk.Align.CENTER, tooltip_text='Ações')
        button.add_css_class('flat')
        button.insert_action_group('assessment', actions)
        row.add_suffix(button)
        return row

    def _monitor(self, attempt: dict) -> None:
        live = self.window.pages['live']
        self.window.open_page('live')
        if live.loaded:
            live.open(attempt)

    # ------------------------------------------------------------------ create and edit
    def new_assessment(self) -> None:
        dialog = Adw.Dialog(title='Nova avaliação', content_width=620, content_height=720)
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        page = Adw.PreferencesPage()
        ids = sorted(self.students, key=lambda key: self.students[key]['name'].lower())
        target = Adw.PreferencesGroup(title='Para qual aluno é a prova? (opcional)')
        student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new(['Nenhum aluno específico'] + [self.students[key]['name'] for key in ids]), enable_search=True)
        hint = label('Escolha o aluno para a prova evitar os textos e questões que ele já viu.', css=('caption', 'dim-label'))
        student.connect('notify::selected', lambda row, _p: hint.set_text(
            'A prova pronta será montada evitando os textos, tarefas e questões que este aluno já viu em provas anteriores.' if row.get_selected()
            else 'Escolha o aluno para a prova evitar os textos e questões que ele já viu.'))
        target.add(student)
        target.add(hint)
        page.add(target)

        def chosen() -> str | None:
            return ids[student.get_selected() - 1] if student.get_selected() else None

        ready = Adw.PreferencesGroup(title='Prova pronta · recomendado',
                                     description='Verificar se o aluno está em um nível: a prova completa (Reading, Language Use, Writing, Speaking e Mediação) é montada com '
                                                 'questões revisadas do banco CEFR. Depois é só revisar, publicar e atribuir.'
                                                 + ('' if self.listening else ' Por enquanto as provas não têm Listening.'))
        if not self.presets:
            ready.add(Adw.ActionRow(title='As provas prontas não carregaram.', subtitle='Atualize a página e tente de novo.'))
        for preset in self.presets:
            levels = [level for level in (preset.get('floor_level'), preset.get('ceiling_level')) if level]
            row = Adw.ActionRow(title=f'Prova de nível {preset.get("target_level")}', activatable=True,
                                subtitle=GLib.markup_escape_text(' · '.join(part for part in (preset.get('purpose') or '',
                                                                                               f'inclui questões de {" e ".join(levels)} para confirmar a faixa' if levels else '',
                                                                                               f'{preset.get("estimated_duration_min_minutes")}–{preset.get("estimated_duration_max_minutes")} min')
                                                                  if part)), subtitle_lines=3)
            row.add_prefix(label(preset.get('target_level') or '', css=('title-3', 'accent'), wrap=False))
            other = Gtk.Button(label='Outra versão', valign=Gtk.Align.CENTER, tooltip_text='Outra seleção de questões com a mesma estrutura, para reaplicar')
            other.add_css_class('flat')
            other.connect('clicked', lambda _b, item=preset: (dialog.close(), self.generate(item['id'], A.new_form_seed(), chosen())))
            row.add_suffix(other)
            row.connect('activated', lambda _r, item=preset: (dialog.close(), self.generate(item['id'], None, chosen())))
            ready.add(row)
        page.add(ready)
        manual = Adw.PreferencesGroup(title='Montar do zero', description='Para escolher cada seção e questão manualmente.')
        for title, subtitle, factory in (('Prova em branco', 'Crie as seções e adicione questões do banco ou suas próprias.', A.empty_draft),
                                         ('Nivelamento CEFR (estrutura vazia)', 'Seções de A1 a C2 já criadas, sem questões. Para aluno sem nível conhecido.',
                                          lambda: A.cefr_placement_draft(self.listening))):
            row = Adw.ActionRow(title=title, subtitle=subtitle, activatable=True)
            row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
            row.connect('activated', lambda _r, make=factory: (dialog.close(), self.open_editor(make(), None)))
            manual.add(row)
        page.add(manual)
        toolbar.set_content(page)
        dialog.set_child(toolbar)
        dialog.present(self.window)

    def generate(self, preset_id: str, seed: str | None, student_id: str | None) -> None:
        name = self.students.get(student_id or '', {}).get('name')
        seed = A.student_form_seed(name) if name else (seed or 'pilot-form-1')
        params = {'p_preset_id': preset_id, 'p_bank_version': A.CURRENT_PILOT_BANK_VERSION, 'p_selection_seed': seed}
        if student_id:
            params['p_student_id'] = student_id
        self.window.toast('Montando a prova pronta…')

        def work():
            assessment_id = self.client.rpc('generate_assessment_from_preset', **params)
            return self._load_draft(assessment_id)
        run_async(work, lambda draft: (self.refresh(), self.open_editor(draft, student_id)),
                  lambda error: self.window.toast(f'Não foi possível montar a prova pronta: {error}'))

    def _load_draft(self, assessment_id: str) -> dict:
        draft = self.client.rpc('get_assessment_draft', p_assessment_id=assessment_id)
        try:
            metadata = self.client.rpc('get_assessment_cefr_metadata', p_assessment_id=assessment_id)
        except Exception:
            metadata = None
        try:
            pacing = self.client.rpc('get_assessment_pacing', p_assessment_id=assessment_id)
        except Exception:
            pacing = None
        return A.merge_loaded_draft(draft, metadata, pacing)

    def edit(self, assessment: dict) -> None:
        run_async(lambda: self._load_draft(assessment['id']), lambda draft: self.open_editor(draft, assessment.get('generated_for_student_id')),
                  lambda error: self.window.toast(f'Não foi possível abrir o rascunho: {error}'))

    def open_editor(self, draft: dict, preview_student: str | None) -> None:
        def published(assessment_id: str) -> None:
            self.window.toast('Avaliação publicada. Agora escolha o aluno.')

            def reloaded(items: list[dict]) -> None:
                self.items = items
                self.render()
                item = self.by_id(assessment_id)
                if item:
                    self.assign(item)
            run_async(lambda: self.client.select('assessments', order='updated_at.desc'), reloaded, lambda error: self.window.toast(str(error)))

        self.editor = AssessmentEditor(self, draft, listening_enabled=self.listening, students=self.students, preview_student=preview_student,
                                       on_published=published, on_ready_made=self.new_assessment, on_closed=self.refresh)
        return self.editor

    # ------------------------------------------------------------------ assign, live, delete
    def assign(self, assessment: dict) -> None:
        if not self.students:
            self.window.toast('Nenhum aluno com conta no portal. Cadastre o aluno na página Alunos.')
            return
        dialog, page, save = form_dialog(self.window, f'Atribuir · {assessment.get("title")}', 'Atribuir', width=560)
        intro = Adw.PreferencesGroup(description='O aluno vê a prova na área Avaliações do portal a partir da data de disponibilidade (ou na hora, se não definir).')
        ids = sorted(self.students, key=lambda key: self.students[key]['name'].lower())
        default = assessment.get('generated_for_student_id')
        student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([self.students[key]['name'] for key in ids]), enable_search=True)
        if default in ids:
            student.set_selected(ids.index(default))
        intro.add(student)
        page.add(intro)
        exposure = Adw.PreferencesGroup(title='O que o aluno já viu')
        page.add(exposure)
        lines: list[Gtk.Widget] = []
        when = Adw.PreferencesGroup()
        available, available_value = optional_datetime('Disponível em', 'Sem data: disponível imediatamente', date.today(), 8)
        due, due_value = optional_datetime('Prazo', 'Sem prazo', date.today() + timedelta(days=7), 23)
        attempts = Adw.SpinRow.new_with_range(1, 10, 1)
        attempts.set_title('Tentativas')
        for row in (available, due, attempts):
            when.add(row)
        page.add(when)

        def show_exposure(*_):
            for row in lines:
                exposure.remove(row)
            lines.clear()
            student_id = ids[student.get_selected()]
            name = self.students[student_id]['name']
            waiting = Adw.ActionRow(title=f'Verificando o que {name} já viu…')
            lines.append(waiting)
            exposure.add(waiting)

            def loaded(data: dict) -> None:
                if ids[student.get_selected()] != student_id:
                    return
                for row in lines:
                    exposure.remove(row)
                lines.clear()
                summary = A.summarize_exposure(data)
                if summary['clean']:
                    rows = [Adw.ActionRow(title=f'Nenhum texto ou questão desta prova foi visto por {name} antes.',
                                          subtitle='Nas partes sorteadas, só entram questões novas para ele.' if data.get('pools') else '')]
                    rows[0].add_prefix(Gtk.Image(icon_name='object-select-symbolic'))
                else:
                    head = Adw.ActionRow(title=f'{name} já viu parte desta prova', subtitle=GLib.markup_escape_text('\n'.join(f'• {line}' for line in A.exposure_lines(data))),
                                         subtitle_lines=0)
                    head.add_prefix(Gtk.Image(icon_name='dialog-warning-symbolic'))
                    rows = [head]
                    if summary['freshPools']:
                        rows.append(Adw.ActionRow(title='Nas outras partes sorteadas (Language Use), o sorteio usa só questões que ele ainda não viu.'))
                    if assessment.get('preset_id') and any(preset['id'] == assessment['preset_id'] for preset in self.presets):
                        again = Adw.ButtonRow(title=f'Gerar uma versão nova para {name}', start_icon_name='view-refresh-symbolic')
                        again.connect('activated', lambda *_: (dialog.close(), self.generate(assessment['preset_id'], None, student_id)))
                        rows.append(again)
                for row in rows:
                    lines.append(row)
                    exposure.add(row)

            def failed(_error: Exception) -> None:
                for row in lines:
                    exposure.remove(row)
                lines.clear()
                row = Adw.ActionRow(title='Não foi possível verificar se o aluno já viu estes textos.')
                lines.append(row)
                exposure.add(row)
            run_async(lambda: self.client.rpc('get_assessment_student_exposure', p_assessment_id=assessment['id'], p_student_id=student_id), loaded, failed)

        student.connect('notify::selected', show_exposure)
        show_exposure()

        def submit(*_):
            start, end = available_value(), due_value()
            values = {'assessment_id': assessment['id'], 'teacher_id': self.window.profile['id'], 'student_id': ids[student.get_selected()],
                      'available_from': start.isoformat() if start else None, 'due_at': end.isoformat() if end else None, 'attempt_limit': int(attempts.get_value())}
            save.set_sensitive(False)

            def done(_r) -> None:
                dialog.close()
                self.window.toast(f'Avaliação atribuída a {self.students[values["student_id"]]["name"]}.')

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(f'Não foi possível atribuir a avaliação: {error}')
            run_async(lambda: self.client.insert('assessment_assignments', values), done, failed)
        save.connect('clicked', submit)
        dialog.present(self.window)

    def live(self, assessment: dict) -> None:
        dialog, page, save = form_dialog(self.window, 'Aplicar ao vivo', 'Abrir sessão')
        group = Adw.PreferencesGroup(description='Conduza e pontue as tarefas ao vivo durante a aula. Se o aluno ainda não tiver a avaliação, ela é atribuída agora.')
        ids = sorted(self.students, key=lambda key: self.students[key]['name'].lower())
        student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([self.students[key]['name'] for key in ids]), enable_search=True)
        group.add(student)
        page.add(group)

        def submit(*_):
            if not ids:
                dialog.show_error('Nenhum aluno com conta no portal.')
                return
            save.set_sensitive(False)
            run_async(lambda: self.client.rpc('open_live_assessment_session', p_assessment_id=assessment['id'], p_student_id=ids[student.get_selected()]),
                      lambda attempt_id: (dialog.close(), LiveSession(self, attempt_id)),
                      lambda error: (save.set_sensitive(True), dialog.show_error(f'Não foi possível abrir a sessão ao vivo: {error}')))
        save.connect('clicked', submit)
        dialog.present(self.window)

    def delete(self, assessment: dict) -> None:
        def ask(impact: dict) -> None:
            warnings = A.deletion_warnings(impact)
            body = '\n'.join(f'• {line}' for line in warnings) + ('\n\n' if warnings else '') + 'Esta ação não pode ser desfeita.'
            dialog = Adw.AlertDialog(heading=f'Excluir “{assessment.get("title")}”?', body=body)
            dialog.add_response('cancel', 'Não')
            dialog.add_response('ok', 'Sim, excluir')
            dialog.set_response_appearance('ok', Adw.ResponseAppearance.DESTRUCTIVE)
            dialog.set_default_response('cancel')

            def response(_dialog, value) -> None:
                if value != 'ok':
                    return

                def done(_r) -> None:
                    self.window.toast(f'“{assessment.get("title")}” foi excluída.')
                    self.refresh()
                run_async(lambda: self.client.rpc('delete_assessment', p_assessment_id=assessment['id']), done,
                          lambda error: self.window.toast(f'Não foi possível excluir a avaliação: {error}'))
            dialog.connect('response', response)
            dialog.present(self.window)
        run_async(lambda: self.client.rpc('get_assessment_deletion_impact', p_assessment_id=assessment['id']), ask,
                  lambda error: self.window.toast(f'Não foi possível verificar a avaliação: {error}'))

    def open_attempt(self, attempt_id: str) -> None:
        show_attempt(self, attempt_id, self.refresh)

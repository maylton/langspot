"""Materials library: search and filter, open, upload a file or save a link, share with students, delete."""
from __future__ import annotations

import uuid
from pathlib import Path

from gi.repository import Adw, Gio, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, confirm, empty_state, form_dialog, open_uri, scrolled, student_names, vbox
from langspot_linux.worker import run_async

TYPE_ICONS = {'PDF': 'x-office-document-symbolic', 'Documento': 'x-office-document-symbolic', 'Apresentação': 'x-office-presentation-symbolic',
              'Imagem': 'image-x-generic-symbolic', 'Vídeo': 'video-x-generic-symbolic', 'Áudio': 'audio-x-generic-symbolic',
              'Link': 'web-browser-symbolic', 'Atividade': 'dialog-question-symbolic'}


class MaterialsPage(Page):
    key = 'materials'
    title = 'Materiais'
    icon = 'folder-documents-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.materials: list[dict] = []
        self.shared: dict[str, set[str]] = {}
        self.students: dict[str, dict] = {}
        self.search = Gtk.SearchEntry(placeholder_text='Buscar material', hexpand=True, max_width_chars=28)
        self.search.connect('search-changed', lambda *_: self.render())
        self.header.set_title_widget(self.search)
        new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text='Novo material')
        new.add_css_class('suggested-action')
        new.connect('clicked', lambda *_: self.new_material())
        self.header.pack_start(new)
        self.type_filter = Gtk.DropDown.new_from_strings(['Todos os tipos', *model.MATERIAL_TYPES])
        self.level_filter = Gtk.DropDown.new_from_strings(['Todos os níveis', *model.MATERIAL_LEVELS[1:]])
        for dropdown in (self.type_filter, self.level_filter):
            dropdown.connect('notify::selected', lambda *_: self.render())

    def refresh(self) -> None:
        self.show_loading()
        client = self.client

        def work():
            materials = client.select('materials', order='created_at.desc')
            shared: dict[str, set[str]] = {}
            for row in client.select('material_assignments', select='material_id,student_id'):
                shared.setdefault(row['material_id'], set()).add(row['student_id'])
            return materials, shared, student_names(client)

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.materials, self.shared, self.students = result
        self.render()

    def render(self) -> None:
        query = self.search.get_text().strip().lower()
        kind = self.type_filter.get_selected()
        level = self.level_filter.get_selected()
        visible = [material for material in self.materials
                   if query in f'{material.get("title")} {material.get("description")} {material.get("skill")}'.lower()
                   and (kind == 0 or material.get('type') == model.MATERIAL_TYPES[kind - 1])
                   and (level == 0 or material.get('level') == model.MATERIAL_LEVELS[level])]
        box = vbox(18)
        filters = Gtk.Box(spacing=8, halign=Gtk.Align.END)
        for dropdown in (self.type_filter, self.level_filter):
            if dropdown.get_parent():
                dropdown.get_parent().remove(dropdown)
            filters.append(dropdown)
        box.append(filters)
        if not visible:
            box.append(empty_state('folder-documents-symbolic', 'Nenhum material encontrado' if self.materials else 'Biblioteca vazia',
                                   'Ajuste a busca ou os filtros.' if self.materials else 'Use o botão + para enviar um arquivo ou salvar um link.'))
        else:
            group = Adw.PreferencesGroup(title=f'{len(visible)} material' + ('' if len(visible) == 1 else 'is'))
            for material in visible:
                shared = len(self.shared.get(material['id'], set()))
                subtitle = ' · '.join(filter(None, [material.get('type'), f'Nível {material.get("level")}' if material.get('level') and material.get('level') != 'Todos' else 'Todos os níveis',
                                                    material.get('skill'), f'{shared} aluno' + ('' if shared == 1 else 's') if shared else 'não compartilhado']))
                row = Adw.ActionRow(title=GLib.markup_escape_text(material.get('title') or 'Material'), subtitle=GLib.markup_escape_text(subtitle), activatable=True)
                row.add_prefix(Gtk.Image(icon_name=TYPE_ICONS.get(material.get('type'), 'x-office-document-symbolic'), pixel_size=24))
                open_button = Gtk.Button(icon_name='document-open-symbolic', valign=Gtk.Align.CENTER, tooltip_text='Abrir')
                open_button.add_css_class('flat')
                open_button.connect('clicked', lambda _b, item=material: self.open(item))
                row.add_suffix(open_button)
                row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
                row.connect('activated', lambda _row, item=material: self.show_material(item))
                group.add(row)
            box.append(group)
        self.show_content(scrolled(box))

    def open(self, material: dict) -> None:
        if material.get('storage_path'):
            run_async(lambda: self.client.signed_url('materials', material['storage_path'], 3600), lambda url: open_uri(self, url),
                      lambda error: self.window.toast(str(error)))
        elif material.get('url'):
            open_uri(self, material['url'])

    # ------------------------------------------------------------------ detail: share and delete
    def show_material(self, material: dict) -> None:
        dialog, page, save = form_dialog(self.window, material.get('title') or 'Material', 'Salvar')
        info = Adw.PreferencesGroup()
        for title, value in (('Tipo', material.get('type') or '—'), ('Nível', material.get('level') or 'Todos'), ('Habilidade', material.get('skill') or '—'),
                             ('Descrição', material.get('description') or '—'),
                             ('Arquivo', f'{material.get("file_name")} · {round((material.get("file_size") or 0) / 1024)} KB' if material.get('file_name') else 'Link')):
            row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(value), subtitle_selectable=True)
            row.add_css_class('property')
            info.add(row)
        opener = Adw.ButtonRow(title='Abrir material', start_icon_name='document-open-symbolic')
        opener.connect('activated', lambda *_: self.open(material))
        info.add(opener)
        page.add(info)
        share = Adw.PreferencesGroup(title='Compartilhado com', description='Os alunos marcados veem este material no portal deles.')
        current = self.shared.get(material['id'], set())
        switches = {}
        for student_id in sorted(self.students, key=lambda key: self.students[key]['name'].lower()):
            row = Adw.SwitchRow(title=GLib.markup_escape_text(self.students[student_id]['name']), active=student_id in current)
            switches[student_id] = row
            share.add(row)
        page.add(share)
        danger = Adw.PreferencesGroup()
        remove = Adw.ButtonRow(title='Excluir material', start_icon_name='user-trash-symbolic')
        remove.add_css_class('destructive-action')
        remove.connect('activated', lambda *_: confirm(dialog, 'Excluir este material?', 'Ele some da biblioteca e do portal dos alunos.', 'Excluir',
                                                       lambda: self._delete(material, dialog), destructive=True))
        danger.add(remove)
        page.add(danger)

        def submit(*_):
            selected = {student_id for student_id, row in switches.items() if row.get_active()}
            save.set_sensitive(False)

            def work():
                # Same as the web app: replace the sharing list.
                self.client.delete('material_assignments', material_id=f'eq.{material["id"]}')
                self.client.insert_many('material_assignments', [{'material_id': material['id'], 'student_id': student_id} for student_id in sorted(selected)])

            def done(_r) -> None:
                dialog.close()
                self.window.toast('Compartilhamento atualizado.')
                self.refresh()
            run_async(work, done, lambda error: dialog.show_error(str(error)))
        save.connect('clicked', submit)
        dialog.present(self.window)

    def _delete(self, material: dict, dialog: Adw.Dialog) -> None:
        def work():
            self.client.delete('materials', id=f'eq.{material["id"]}')
            if material.get('storage_path'):
                self.client.remove_files('materials', [material['storage_path']])

        def done(_r) -> None:
            dialog.close()
            self.window.toast('Material excluído.')
            self.refresh()
        run_async(work, done, lambda error: self.window.toast(str(error)))

    # ------------------------------------------------------------------ new material
    def new_material(self) -> None:
        dialog, page, save = form_dialog(self.window, 'Novo material', 'Salvar')
        source = Adw.ToggleGroup(halign=Gtk.Align.CENTER, margin_bottom=6)
        source.add(Adw.Toggle(label='Enviar arquivo', name='upload'))
        source.add(Adw.Toggle(label='Salvar link', name='link'))
        source.set_active_name('upload')
        top = Adw.PreferencesGroup()
        top.add(source)
        page.add(top)
        group = Adw.PreferencesGroup()
        title = Adw.EntryRow(title='Título')
        chosen: dict = {'file': None}
        file_row = Adw.ActionRow(title='Arquivo', subtitle='PDF, DOCX, PPTX ou imagem até 10 MB')
        pick = Gtk.Button(label='Escolher…', valign=Gtk.Align.CENTER)
        file_row.add_suffix(pick)
        link = Adw.EntryRow(title='Link (https://…)', input_purpose=Gtk.InputPurpose.URL, visible=False)
        kind = Adw.ComboRow(title='Tipo', model=Gtk.StringList.new(model.MATERIAL_TYPES), visible=False, selected=model.MATERIAL_TYPES.index('Link'))
        level = Adw.ComboRow(title='Nível', model=Gtk.StringList.new(model.MATERIAL_LEVELS))
        skill = Adw.ComboRow(title='Habilidade', model=Gtk.StringList.new(model.SKILLS))
        description = Adw.EntryRow(title='Descrição (opcional)')
        for row in (title, file_row, link, kind, level, skill, description):
            group.add(row)
        page.add(group)

        def switched(*_):
            upload = source.get_active_name() == 'upload'
            file_row.set_visible(upload)
            link.set_visible(not upload)
            kind.set_visible(not upload)
        source.connect('notify::active-name', switched)

        def choose(*_):
            file_dialog = Gtk.FileDialog(title='Escolher material')
            filters = Gio.ListStore.new(Gtk.FileFilter)
            accepted = Gtk.FileFilter(name='PDF, DOCX, PPTX e imagens')
            for suffix in model.UPLOAD_EXTENSIONS:
                accepted.add_suffix(suffix[1:])
            filters.append(accepted)
            file_dialog.set_filters(filters)

            def finished(dlg, result):
                try:
                    picked = dlg.open_finish(result)
                except GLib.Error:
                    return
                path = Path(picked.get_path())
                try:
                    model.upload_kind(path.name, path.stat().st_size)
                except ValueError as error:
                    dialog.show_error(str(error))
                    return
                chosen['file'] = path
                file_row.set_subtitle(f'{path.name} · {round(path.stat().st_size / 1024)} KB')
                if not title.get_text().strip():
                    title.set_text(path.stem.replace('_', ' ').replace('-', ' '))
                dialog.show_error('')
            file_dialog.open(self.window, None, finished)
        pick.connect('clicked', choose)

        def submit(*_):
            upload = source.get_active_name() == 'upload'
            if not title.get_text().strip():
                dialog.show_error('Escreva o título do material.')
                return
            if upload and not chosen['file']:
                dialog.show_error('Escolha o arquivo.')
                return
            if not upload and not link.get_text().strip().startswith(('http://', 'https://')):
                dialog.show_error('O link precisa começar com https://')
                return
            teacher = self.window.profile['id']
            base = {'teacher_id': teacher, 'title': title.get_text().strip(), 'level': model.MATERIAL_LEVELS[level.get_selected()],
                    'skill': model.SKILLS[skill.get_selected()], 'description': description.get_text().strip()}
            save.set_sensitive(False)

            def work():
                if not upload:
                    return self.client.insert('materials', {**base, 'type': model.MATERIAL_TYPES[kind.get_selected()], 'url': link.get_text().strip(),
                                                            'material_source': 'link'})
                path: Path = chosen['file']
                mime, material_type = model.upload_kind(path.name, path.stat().st_size)
                storage_path = f'{teacher}/{uuid.uuid4()}-{model.safe_filename(path.name)}'
                self.client.upload('materials', storage_path, path.read_bytes(), mime)
                try:
                    return self.client.insert('materials', {**base, 'type': material_type, 'url': '', 'storage_path': storage_path, 'file_name': path.name,
                                                            'file_size': path.stat().st_size, 'mime_type': mime, 'material_source': 'upload'})
                except Exception:
                    self.client.remove_files('materials', [storage_path])
                    raise

            def done(_r) -> None:
                dialog.close()
                self.window.toast('Material salvo na biblioteca.')
                self.refresh()
            run_async(work, done, lambda error: dialog.show_error(str(error)))
        save.connect('clicked', submit)
        dialog.present(self.window)

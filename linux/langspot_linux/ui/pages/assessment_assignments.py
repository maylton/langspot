"""Assignments on the Avaliações page: the Provas atribuídas panel, assign with the student's exposure, change or cancel before the student starts."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux import model
from langspot_linux.ui.assessment_results import show_results
from langspot_linux.ui.common import action_menu, confirm, form_dialog, optional_datetime, pill
from langspot_linux.worker import run_async


class AssignmentsMixin:
    """Assignments on the Avaliações page: the Provas atribuídas panel, assign with the student's exposure, change or cancel before the student starts."""

    def _assigned_group(self) -> Gtk.Widget:
        group = Adw.PreferencesGroup(title='Provas atribuídas', description='Quem recebeu cada prova e em que ponto está, inclusive quem ainda não começou.')
        filters = Gtk.Box(spacing=6, valign=Gtk.Align.CENTER)
        keys = [key for key, _title in A.ASSIGNMENT_FILTERS]
        rows = [row for row in self.assignments if not self.assign_student or row['student_id'] == self.assign_student]
        counts = {key: sum(1 for row in rows if A.matches_assignment_filter(A.assignment_state(row), key)) for key in keys}
        state_filter = Gtk.DropDown.new_from_strings([f'{title} ({counts[key]})' for key, title in A.ASSIGNMENT_FILTERS])
        state_filter.set_selected(keys.index(self.assign_filter))
        state_filter.connect('notify::selected', lambda dropdown, _p: (setattr(self, 'assign_filter', keys[dropdown.get_selected()]), self.render()))
        ids = sorted(self.students, key=lambda key: self.students[key]['name'].lower())
        student_filter = Gtk.DropDown.new_from_strings(['Todos os alunos'] + [self.students[key]['name'] for key in ids])
        student_filter.set_selected(ids.index(self.assign_student) + 1 if self.assign_student in ids else 0)
        student_filter.connect('notify::selected', lambda dropdown, _p: (setattr(self, 'assign_student', ids[dropdown.get_selected() - 1] if dropdown.get_selected() else None),
                                                                         self.render()))
        filters.append(student_filter)
        filters.append(state_filter)
        group.set_header_suffix(filters)
        visible = [row for row in A.sort_assignments(rows) if A.matches_assignment_filter(A.assignment_state(row), self.assign_filter)]
        if not visible:
            group.add(Adw.ActionRow(title='Nenhuma atribuição neste filtro.' if self.assignments else 'Nenhuma prova atribuída ainda.',
                                    subtitle='' if self.assignments else 'Publique uma avaliação e use “Atribuir a um aluno”.'))
        for row in visible:
            group.add(self._assignment_row(row))
        return group

    def _assignment_row(self, assignment: dict) -> Adw.ActionRow:
        assessment = self.by_id(assignment['assessment_id'])
        state = A.assignment_state(assignment)
        name = self.names.get(assignment['student_id'], 'Aluno')
        row = Adw.ActionRow(title=GLib.markup_escape_text(f'{name} · {(assessment or {}).get("title") or "Avaliação excluída"}'),
                            subtitle=GLib.markup_escape_text(A.assignment_details(assignment)), subtitle_lines=2)
        row.add_prefix(Adw.Avatar(size=34, text=name, show_initials=True))
        row.add_suffix(pill(A.ASSIGNMENT_STATES[state], A.ASSIGNMENT_STATE_KIND[state]))
        entries = []
        attempt = next((item for item in self.active if item.get('assessmentId') == assignment['assessment_id'] and item.get('studentId') == assignment['student_id']), None)
        if attempt:
            entries.append(('Acompanhar ao vivo', lambda: self._monitor(attempt)))
        if assessment and state in ('to_review', 'completed'):
            entries.append(('Resultados', lambda: show_results(self, assessment, self.names)))
        if A.is_not_started(assignment):
            entries += [('Alterar datas e tentativas', lambda: self.edit_assignment(assignment)),
                        ('Cancelar atribuição', lambda: self.cancel_assignment(assignment))]
        if entries:
            row.add_suffix(action_menu(entries))
        return row

    def edit_assignment(self, assignment: dict) -> None:
        name = self.names.get(assignment['student_id'], 'Aluno')
        dialog, page, save = form_dialog(self.window, f'Alterar atribuição · {name}', 'Salvar')
        group = Adw.PreferencesGroup(description=(self.by_id(assignment['assessment_id']) or {}).get('title') or '')
        available, available_value = optional_datetime('Disponível em', 'Sem data: disponível imediatamente', date.today(), 8,
                                                       model.parse_time(assignment.get('available_from')))
        due, due_value = optional_datetime('Prazo', 'Sem prazo', date.today() + timedelta(days=7), 23, model.parse_time(assignment.get('due_at')))
        attempts = Adw.SpinRow.new_with_range(1, 10, 1)
        attempts.set_title('Tentativas')
        attempts.set_value(float(assignment.get('attempt_limit') or 1))
        for row in (available, due, attempts):
            group.add(row)
        page.add(group)

        def submit(*_):
            start, end = available_value(), due_value()
            values = {'available_from': start.isoformat() if start else None, 'due_at': end.isoformat() if end else None, 'attempt_limit': int(attempts.get_value()),
                      'updated_at': datetime.now(timezone.utc).isoformat()}
            save.set_sensitive(False)

            def done(rows: list[dict]) -> None:
                if not rows:
                    save.set_sensitive(True)
                    dialog.show_error('O aluno já começou esta prova; a atribuição não pode mais ser alterada.')
                    return
                dialog.close()
                self.window.toast('Atribuição atualizada.')
                self.refresh()
            run_async(lambda: self.client.update_returning('assessment_assignments', values, id=f'eq.{assignment["id"]}', status='in.(assigned,available)'),
                      done, lambda error: (save.set_sensitive(True), dialog.show_error(str(error))))
        save.connect('clicked', submit)
        dialog.present(self.window)

    def cancel_assignment(self, assignment: dict) -> None:
        name = self.names.get(assignment['student_id'], 'o aluno')
        title = (self.by_id(assignment['assessment_id']) or {}).get('title') or 'esta prova'

        def run() -> None:
            def done(rows: list[dict]) -> None:
                self.window.toast('Atribuição cancelada.' if rows else 'O aluno já começou esta prova; a atribuição não pode mais ser cancelada.')
                self.refresh()
            run_async(lambda: self.client.delete_returning('assessment_assignments', id=f'eq.{assignment["id"]}', status='in.(assigned,available)'), done,
                      lambda error: self.window.toast(str(error)))
        confirm(self.window, f'Cancelar “{title}” para {name}?', 'A prova some do portal do aluno. Ele ainda não começou, então nada respondido é perdido.',
                'Sim, cancelar', run, destructive=True)

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
                self.refresh()

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                dialog.show_error(f'Não foi possível atribuir a avaliação: {error}')
            run_async(lambda: self.client.insert('assessment_assignments', values), done, failed)
        save.connect('clicked', submit)
        dialog.present(self.window)

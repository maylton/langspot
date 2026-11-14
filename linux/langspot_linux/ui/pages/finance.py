"""Finance: totals, charges by status, new charge, mark paid/pending, WhatsApp reminder, delete."""
from __future__ import annotations

import urllib.parse
from datetime import date, datetime, timedelta, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, action_menu, confirm, date_row, empty_state, form_dialog, label, open_uri, pill, scrolled, stat_card, stat_row, student_names, vbox
from langspot_linux.worker import run_async

STATUS_KIND = {'paid': 'success', 'pending': 'accent', 'overdue': 'error'}


class FinancePage(Page):
    key = 'finance'
    title = 'Financeiro'
    icon = 'langspot-money-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.payments: list[dict] = []
        self.students: dict[str, dict] = {}
        self.filter = 'open'
        toggle = Adw.ToggleGroup()
        for name, title in (('open', 'A receber'), ('paid', 'Pagas'), ('all', 'Todas')):
            toggle.add(Adw.Toggle(label=title, name=name))
        toggle.set_active_name('open')
        toggle.connect('notify::active-name', lambda group, _p: self._set_filter(group.get_active_name()))
        self.header.set_title_widget(toggle)
        new = Gtk.Button(icon_name='list-add-symbolic', tooltip_text='Nova cobrança')
        new.add_css_class('suggested-action')
        new.connect('clicked', lambda *_: self.new_payment())
        self.header.pack_start(new)

    def _set_filter(self, name: str) -> None:
        self.filter = name
        self.render()

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        run_async(lambda: (client.select('payments', order='due_date.asc'), student_names(client)), self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.payments, self.students = result
        self.render()

    def render(self) -> None:
        today = date.today()
        totals = model.payment_totals(self.payments, today)
        box = vbox(18)
        box.append(stat_row([stat_card(title, value, note, value_css='title-2') for title, value, note in (
            ('Recebido', model.money(totals['paid']), 'pagamentos registrados'),
            ('A receber', model.money(totals['open']), 'pendentes e atrasados'),
            ('Atrasado', model.money(totals['overdue']), 'vencidos e não pagos'))]))

        def wanted(row: dict) -> bool:
            status = model.payment_status(row, today)
            return self.filter == 'all' or (self.filter == 'paid' and status == 'paid') or (self.filter == 'open' and status != 'paid')

        visible = [row for row in self.payments if wanted(row)]
        if self.filter == 'paid':
            visible.reverse()
        if not visible:
            box.append(empty_state('langspot-money-symbolic', 'Nada por aqui', 'Use o botão + para registrar uma cobrança.' if not self.payments else 'Nenhuma cobrança neste filtro.'))
        else:
            group = Adw.PreferencesGroup(title=f'{len(visible)} cobrança' + ('' if len(visible) == 1 else 's'))
            for row in visible:
                group.add(self._row(row, today))
            box.append(group)
        self.show_content(scrolled(box))

    def _row(self, payment: dict, today: date) -> Adw.ActionRow:
        student = self.students.get(payment['student_id'], {})
        status = model.payment_status(payment, today)
        when = f'pago em {model.short_datetime(payment.get("paid_at"))[:10]}' if status == 'paid' and payment.get('paid_at') else f'vence {model.short_date(payment.get("due_date"))}'
        row = Adw.ActionRow(title=GLib.markup_escape_text(f'{student.get("name", "Aluno")} · {payment.get("description") or ""}'),
                            subtitle=GLib.markup_escape_text(when))
        row.add_prefix(Adw.Avatar(size=34, text=student.get('name', '?'), show_initials=True))
        amount = label(model.money(float(payment.get('amount') or 0)), css=('heading', 'numeric'), wrap=False)
        amount.set_valign(Gtk.Align.CENTER)
        row.add_suffix(amount)
        row.add_suffix(pill(model.PAYMENT_LABELS[status], STATUS_KIND[status]))

        entries = []
        if status != 'paid':
            entries.append(('Marcar como paga', lambda: self._set_status(payment, 'paid')))
            if student.get('phone'):
                entries.append(('Lembrar pelo WhatsApp', lambda: self._remind(payment, student, status)))
        else:
            entries.append(('Marcar como pendente', lambda: self._set_status(payment, 'pending')))
        delete = lambda: confirm(self.window, 'Excluir esta cobrança?', 'Esta ação não pode ser desfeita.', 'Excluir',  # noqa: E731
                                 lambda: self._delete(payment), destructive=True)
        row.add_suffix(action_menu(entries, [('Excluir cobrança', delete)]))
        return row

    def _set_status(self, payment: dict, status: str) -> None:
        values = {'status': status, 'paid_at': datetime.now(timezone.utc).isoformat() if status == 'paid' else None}

        def done(_r) -> None:
            self.window.toast('Cobrança marcada como paga.' if status == 'paid' else 'Cobrança voltou para pendente.')
            self.refresh()
        run_async(lambda: self.client.update('payments', values, id=f'eq.{payment["id"]}'), done, lambda error: self.window.toast(str(error)))

    def _remind(self, payment: dict, student: dict, status: str) -> None:
        first = (student.get('name') or '').split(' ')[0]
        due = model.short_date(payment.get('due_date'))
        text = (f'Olá, {first}! Passando para lembrar da cobrança "{payment.get("description")}" de {model.money(float(payment.get("amount") or 0))}, '
                + (f'que venceu em {due}.' if status == 'overdue' else f'com vencimento em {due}.') + ' Qualquer dúvida, é só me chamar.')
        open_uri(self, f'https://wa.me/{student["phone"]}?text={urllib.parse.quote(text)}')

    def _delete(self, payment: dict) -> None:
        def done(_r) -> None:
            self.window.toast('Cobrança excluída.')
            self.refresh()
        run_async(lambda: self.client.delete('payments', id=f'eq.{payment["id"]}'), done, lambda error: self.window.toast(str(error)))

    def new_payment(self) -> None:
        if not self.students:
            self.window.toast('Cadastre um aluno no site antes de registrar cobranças.')
            return
        dialog, page, save = form_dialog(self.window, 'Nova cobrança', 'Registrar')
        group = Adw.PreferencesGroup()
        ids = sorted(self.students, key=lambda student_id: self.students[student_id]['name'].lower())
        student = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([self.students[i]['name'] for i in ids]), enable_search=True)
        description = Adw.EntryRow(title='Descrição', text=f'Mensalidade de {model.MONTHS[date.today().month - 1]}')
        amount = Adw.SpinRow.new_with_range(1, 100000, 10)
        amount.set_title('Valor (R$)')
        amount.set_digits(2)
        amount.set_value(300)
        due, due_value = date_row('Vencimento', date.today() + timedelta(days=5))
        for row in (student, description, amount, due):
            group.add(row)
        page.add(group)

        def submit(*_):
            if not description.get_text().strip():
                dialog.show_error('Escreva a descrição da cobrança.')
                return
            values = {'teacher_id': self.window.profile['id'], 'student_id': ids[student.get_selected()], 'description': description.get_text().strip(),
                      'amount': round(amount.get_value(), 2), 'due_date': due_value().isoformat(), 'status': 'pending'}
            save.set_sensitive(False)

            def done(_r) -> None:
                dialog.close()
                self.window.toast('Cobrança registrada.')
                self.refresh()
            run_async(lambda: self.client.insert('payments', values), done, lambda error: dialog.show_error(str(error)))
        save.connect('clicked', submit)
        dialog.present(self.window)

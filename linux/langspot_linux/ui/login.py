"""Sign-in screen (teacher accounts only)."""
from __future__ import annotations

from gi.repository import Adw, Gtk

from langspot_linux.ui.common import label, vbox
from langspot_linux.worker import run_async


class LoginView(Adw.Bin):
    def __init__(self, window) -> None:
        super().__init__()
        self.window = window
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar(show_title=False)
        toolbar.add_top_bar(header)

        box = vbox(24)
        box.set_valign(Gtk.Align.CENTER)
        mark = Gtk.Image(icon_name='app.langspot.Teacher', pixel_size=96)
        box.append(mark)
        titles = vbox(6)
        titles.append(label('LangSpot', css=('title-1',), xalign=0.5))
        titles.append(label('Entre com a sua conta de professor.', css=('dim-label',), xalign=0.5))
        box.append(titles)

        group = Adw.PreferencesGroup()
        self.email = Adw.EntryRow(title='E-mail', input_purpose=Gtk.InputPurpose.EMAIL)
        self.password = Adw.PasswordEntryRow(title='Senha')
        self.password.connect('entry-activated', lambda *_: self.submit())
        self.email.connect('entry-activated', lambda *_: self.password.grab_focus())
        group.add(self.email)
        group.add(self.password)
        box.append(group)

        self.error = label('', css=('error',), xalign=0.5)
        self.error.set_visible(False)
        box.append(self.error)

        self.button = Gtk.Button(halign=Gtk.Align.CENTER)
        self.button.add_css_class('suggested-action')
        self.button.add_css_class('pill')
        self.button_stack = Gtk.Stack()
        self.button_stack.add_named(Gtk.Label(label='Entrar'), 'label')
        self.button_stack.add_named(Adw.Spinner(), 'spinner')
        self.button.set_child(self.button_stack)
        self.button.connect('clicked', lambda *_: self.submit())
        box.append(self.button)

        hint = label('A senha diferencia letras maiúsculas e minúsculas.', css=('caption', 'dim-label'), xalign=0.5)
        box.append(hint)

        clamp = Adw.Clamp(maximum_size=380, child=box, margin_start=18, margin_end=18, margin_bottom=36)
        toolbar.set_content(clamp)
        self.set_child(toolbar)

    def reset(self, message: str = '', *, error: bool = True) -> None:
        self.password.set_text('')
        self._busy(False)
        self.error.set_text(message)
        (self.error.add_css_class if error else self.error.remove_css_class)('error')
        (self.error.remove_css_class if error else self.error.add_css_class)('dim-label')
        self.error.set_visible(bool(message))
        self.email.grab_focus()

    def _busy(self, busy: bool) -> None:
        self.button.set_sensitive(not busy)
        self.button_stack.set_visible_child_name('spinner' if busy else 'label')

    def submit(self) -> None:
        email, password = self.email.get_text().strip(), self.password.get_text()
        if not email or not password:
            self.reset('Preencha o e-mail e a senha.')
            return
        self._busy(True)
        self.error.set_visible(False)
        client = self.window.client

        def work():
            session = client.sign_in(email, password)
            return self.window.app.load_profile(session)

        run_async(work, self.window.app.signed_in, lambda error: self.reset(str(error)))

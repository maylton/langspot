"""Main window: sign-in, sidebar with the native pages, and links to the web app."""
from __future__ import annotations

from gi.repository import Adw, Gio, Gtk

from langspot_linux.ui.common import label, open_uri
from langspot_linux.ui.login import LoginView

WEB_SECTIONS = [
    ('Construtor de provas', 'document-properties-symbolic'),
    ('Quiz interativo', 'dialog-question-symbolic'),
    ('Configurações da conta', 'emblem-system-symbolic'),
]


class SidebarRow(Gtk.ListBoxRow):
    def __init__(self, key: str, title: str, icon: str) -> None:
        super().__init__()
        self.key = key
        box = Gtk.Box(spacing=12, margin_top=6, margin_bottom=6, margin_start=6, margin_end=6)
        box.append(Gtk.Image(icon_name=icon))
        box.append(label(title, wrap=False))
        box.get_last_child().set_hexpand(True)
        self.badge = Gtk.Label(valign=Gtk.Align.CENTER)
        self.badge.add_css_class('ls-badge')
        self.badge.set_visible(False)
        box.append(self.badge)
        self.set_child(box)

    def set_count(self, count: int) -> None:
        self.badge.set_text(str(count) if count < 100 else '99+')
        self.badge.set_visible(count > 0)


class MainWindow(Adw.ApplicationWindow):
    def __init__(self, app) -> None:
        super().__init__(application=app, title='LangSpot', default_width=1180, default_height=800)
        self.set_size_request(360, 480)
        self.app = app
        self.client = app.client
        self.pages: dict = {}
        self.rows: dict[str, SidebarRow] = {}

        self.toasts = Adw.ToastOverlay()
        self.stack = Gtk.Stack(transition_type=Gtk.StackTransitionType.CROSSFADE)
        starting = Adw.ToolbarView()
        starting.add_top_bar(Adw.HeaderBar(show_title=False))
        starting.set_content(Adw.Spinner(halign=Gtk.Align.CENTER, valign=Gtk.Align.CENTER, width_request=40, height_request=40))
        self.stack.add_named(starting, 'starting')
        self.login = LoginView(self)
        self.stack.add_named(self.login, 'login')
        self.toasts.set_child(self.stack)
        self.set_content(self.toasts)
        self.split: Adw.NavigationSplitView | None = None

    # ------------------------------------------------------------------ states
    def toast(self, message: str) -> None:
        self.toasts.add_toast(Adw.Toast(title=message, timeout=4))

    def show_login(self, message: str = '', *, error: bool = True) -> None:
        main = self.stack.get_child_by_name('main')
        if main:
            self.stack.remove(main)
        self.pages.clear()
        self.rows.clear()
        self.split = None
        self.stack.set_visible_child_name('login')
        self.login.reset(message, error=error)

    def show_main(self, profile: dict) -> None:
        from langspot_linux.ui.pages.agenda import AgendaPage
        from langspot_linux.ui.pages.finance import FinancePage
        from langspot_linux.ui.pages.live import LivePage
        from langspot_linux.ui.pages.materials import MaterialsPage
        from langspot_linux.ui.pages.notifications import NotificationsPage
        from langspot_linux.ui.pages.reports import ReportsPage
        from langspot_linux.ui.pages.review import ReviewPage
        from langspot_linux.ui.pages.students import StudentsPage
        from langspot_linux.ui.pages.tasks import TasksPage

        self.profile = profile
        for page_class in (AgendaPage, StudentsPage, TasksPage, ReviewPage, LivePage, MaterialsPage, FinancePage, ReportsPage, NotificationsPage):
            self.pages[page_class.key] = page_class(self)

        self.split = Adw.NavigationSplitView(min_sidebar_width=230, max_sidebar_width=280)
        self.split.set_sidebar(self._sidebar(profile))
        self.content = Adw.NavigationPage(title='LangSpot')
        self.split.set_content(self.content)
        breakpoint = Adw.Breakpoint.new(Adw.BreakpointCondition.parse('max-width: 680sp'))
        breakpoint.add_setter(self.split, 'collapsed', True)
        self.add_breakpoint(breakpoint)
        old = self.stack.get_child_by_name('main')
        if old:
            self.stack.remove(old)
        self.stack.add_named(self.split, 'main')
        self.stack.set_visible_child_name('main')
        self.open_page('agenda')

    def _sidebar(self, profile: dict) -> Adw.NavigationPage:
        toolbar = Adw.ToolbarView()
        header = Adw.HeaderBar()
        menu = Gio.Menu()
        section = Gio.Menu()
        section.append('Abrir o LangSpot no navegador', 'app.open-web')
        section.append('Continuar em segundo plano ao fechar', 'app.background')
        section.append('Mostrar as aulas no calendário do sistema', 'app.calendar-sync')
        menu.append_section(None, section)
        account = Gio.Menu()
        account.append('Sair da conta', 'app.logout')
        account.append('Sobre o LangSpot', 'app.about')
        menu.append_section(None, account)
        header.pack_end(Gtk.MenuButton(icon_name='open-menu-symbolic', menu_model=menu, tooltip_text='Menu principal', primary=True))
        toolbar.add_top_bar(header)

        box = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        listbox = Gtk.ListBox(selection_mode=Gtk.SelectionMode.SINGLE)
        listbox.add_css_class('navigation-sidebar')
        for key, page in self.pages.items():
            row = SidebarRow(key, page.title, page.icon)
            self.rows[key] = row
            listbox.append(row)
        listbox.connect('row-activated', lambda _box, row: self.open_page(row.key))
        self.listbox = listbox
        box.append(listbox)

        box.append(label('No site', css=('caption-heading', 'dim-label'), wrap=False))
        box.get_last_child().set_margin_start(18)
        box.get_last_child().set_margin_top(18)
        web = Gtk.ListBox(selection_mode=Gtk.SelectionMode.NONE)
        web.add_css_class('navigation-sidebar')
        for title, icon in WEB_SECTIONS:
            row = SidebarRow('web', title, icon)
            row.get_child().append(Gtk.Image(icon_name='adw-external-link-symbolic'))
            row.set_tooltip_text(f'{title} abre no navegador')
            web.append(row)
        web.connect('row-activated', lambda *_: open_uri(self, self.app.config.web_url))
        box.append(web)

        footer = Gtk.Box(spacing=10, margin_start=14, margin_end=14, margin_top=12, margin_bottom=12, valign=Gtk.Align.END, vexpand=True)
        name = profile.get('full_name') or profile.get('email') or 'Professor'
        footer.append(Adw.Avatar(size=34, text=name, show_initials=True))
        names = Gtk.Box(orientation=Gtk.Orientation.VERTICAL)
        names.append(label(name, css=('heading',), wrap=False))
        names.append(label(profile.get('email') or '', css=('caption', 'dim-label'), wrap=False))
        footer.append(names)
        box.append(footer)
        toolbar.set_content(Gtk.ScrolledWindow(child=box, hscrollbar_policy=Gtk.PolicyType.NEVER))
        return Adw.NavigationPage(title='LangSpot', child=toolbar)

    def open_page(self, key: str) -> None:
        page = self.pages.get(key)
        if not page or not self.split:
            return
        self.content.set_title(page.title)
        if page.get_parent() is not None and page.get_parent() is not self.content:
            page.unparent()
        self.content.set_child(page)
        self.split.set_show_content(True)
        row = self.rows.get(key)
        if row:
            self.listbox.select_row(row)
        page.on_shown()

    def set_count(self, key: str, count: int) -> None:
        row = self.rows.get(key)
        if row:
            row.set_count(count)

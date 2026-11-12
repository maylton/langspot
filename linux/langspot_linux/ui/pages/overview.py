"""Overview: greeting, key numbers, what needs attention now, next lessons and students (as the website's Visão geral)."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, label, open_uri, scrolled, student_names, vbox
from langspot_linux.worker import run_async


class OverviewPage(Page):
    key = 'overview'
    title = 'Visão geral'
    icon = 'user-home-symbolic'

    def refresh(self) -> None:
        self.show_loading()
        client = self.client
        today = date.today()

        def work():
            students = student_names(client)
            names = {key: value['name'] for key, value in students.items()}
            lessons = model.lessons_from_rows(client.select('lessons', order='starts_at.asc'), names)
            queue = client.rpc('list_assessment_review_queue') or {}
            live = client.rpc('list_active_teacher_attempts') or []
            tasks = client.select('assignments', select='id', status='eq.submitted', assignment_type='neq.interactive')
            requests = client.select('cancellation_requests', select='id', status='eq.pending')
            overdue = client.select('payments', select='id,amount', status='neq.paid', due_date=f'lt.{today.isoformat()}')
            unread = client.select('notifications', select='id', read_at='is.null', scheduled_for=f'lte.{datetime.now(timezone.utc).isoformat()}')
            return students, lessons, queue, live, tasks, requests, overdue, unread

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        students, lessons, queue, live, tasks, requests, overdue, unread = result
        profile = self.window.profile
        first = (profile.get('full_name') or 'professor').split(' ')[0]
        now = datetime.now().astimezone()
        box = vbox(20)

        hero = Gtk.Box(spacing=16)
        hero.add_css_class('card')
        hero.add_css_class('ls-card')
        titles = vbox(4)
        titles.set_hexpand(True)
        titles.append(label(f'Olá, {first}!', css=('title-1',)))
        titles.append(label(profile.get('school_name') or 'Seus alunos, aulas e progresso no mesmo lugar.', css=('dim-label',)))
        hero.append(titles)
        agenda = Gtk.Button(label='Ver agenda', valign=Gtk.Align.CENTER)
        agenda.add_css_class('pill')
        agenda.connect('clicked', lambda *_: self.window.open_page('agenda'))
        hero.append(agenda)
        box.append(hero)

        week_start = model.week_start(now.date())
        this_week = [lesson for lesson in lessons if lesson.status != 'cancelled' and week_start <= lesson.starts_at.date() < week_start + timedelta(days=7)]
        progress = round(sum(model.progress_of(value['skills']) for value in students.values()) / len(students)) if students else 0
        cards = Gtk.FlowBox(selection_mode=Gtk.SelectionMode.NONE, max_children_per_line=4, min_children_per_line=2, column_spacing=12, row_spacing=12, homogeneous=True)
        for title, value, note in (('Alunos', str(len(students)), 'com acesso ao portal'),
                                   ('Aulas registradas', str(sum(1 for lesson in lessons if lesson.status == 'completed')), 'histórico completo'),
                                   ('Aulas nesta semana', str(len(this_week)), f'{sum(1 for lesson in this_week if lesson.status == "completed")} já concluídas'),
                                   ('Média de progresso', f'{progress}%', 'média das habilidades')):
            card = vbox(2)
            card.add_css_class('card')
            card.add_css_class('ls-card')
            card.append(label(title, css=('dim-label',)))
            card.append(label(value, css=('ls-big-number',)))
            card.append(label(note, css=('caption', 'dim-label')))
            cards.append(card)
        box.append(cards)

        review = len(queue.get('items') or []) + len(queue.get('readyToFinalize') or [])
        todo = [(len(live), 'Alunos fazendo prova agora', 'Acompanhe ao vivo', 'media-record-symbolic', 'live'),
                (review, 'Avaliações para corrigir', 'Writing, Speaking e Mediation', 'document-edit-symbolic', 'review'),
                (len(tasks), 'Tarefas entregues', 'Esperando a sua correção', 'checkbox-checked-symbolic', 'tasks'),
                (len(requests), 'Pedidos de cancelamento', 'Aprovar ou recusar na agenda', 'action-unavailable-symbolic', 'agenda'),
                (len(overdue), 'Cobranças atrasadas', model.money(sum(float(row.get('amount') or 0) for row in overdue)), 'langspot-money-symbolic', 'finance'),
                (len(unread), 'Notificações não lidas', 'Avisos da plataforma', 'mail-unread-symbolic', 'notifications')]
        pending = [item for item in todo if item[0]]
        attention = Adw.PreferencesGroup(title='Para fazer agora')
        if not pending:
            attention.add(Adw.ActionRow(title='Tudo em dia', subtitle='Nenhuma pendência no momento.'))
        for count, title, subtitle, icon, page in pending:
            row = Adw.ActionRow(title=title, subtitle=GLib.markup_escape_text(subtitle), activatable=True)
            row.add_prefix(Gtk.Image(icon_name=icon))
            badge = label(str(count), css=('ls-badge',), wrap=False)
            badge.set_valign(Gtk.Align.CENTER)
            row.add_suffix(badge)
            row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
            row.connect('activated', lambda _row, key=page: self.window.open_page(key))
            attention.add(row)
        box.append(attention)

        upcoming = [lesson for lesson in lessons if lesson.status == 'scheduled' and lesson.ends_at >= now][:5]
        group = Adw.PreferencesGroup(title='Próximas aulas')
        if not upcoming:
            group.add(Adw.ActionRow(title='Nenhuma aula agendada', subtitle='Suas próximas aulas aparecem aqui.'))
        for lesson in upcoming:
            row = Adw.ActionRow(title=GLib.markup_escape_text(f'{lesson.student_name} · {lesson.topic}'),
                                subtitle=f'{model.day_label(lesson.starts_at.date())}, {lesson.starts_at:%H:%M}–{lesson.ends_at:%H:%M}')
            row.add_prefix(Adw.Avatar(size=34, text=lesson.student_name, show_initials=True))
            if lesson.online_url:
                join = Gtk.Button(label='Entrar', valign=Gtk.Align.CENTER)
                join.add_css_class('pill')
                if lesson.starts_at - timedelta(minutes=15) <= now:
                    join.add_css_class('suggested-action')
                join.connect('clicked', lambda _b, url=lesson.online_url: open_uri(self, url))
                row.add_suffix(join)
            group.add(row)
        box.append(group)

        if students:
            people = Adw.PreferencesGroup(title='Meus alunos')
            ranked = sorted(students.items(), key=lambda item: item[1]['name'].lower())[:6]
            for student_id, student in ranked:
                value = model.progress_of(student['skills'])
                row = Adw.ActionRow(title=GLib.markup_escape_text(student['name']),
                                    subtitle=GLib.markup_escape_text(' · '.join(part for part in (student['level'], student['goal']) if part)), activatable=True)
                row.add_prefix(Adw.Avatar(size=34, text=student['name'], show_initials=True))
                row.add_suffix(Gtk.LevelBar(min_value=0, max_value=100, value=value, valign=Gtk.Align.CENTER, width_request=110))
                row.add_suffix(label(f'{value}%', css=('numeric', 'caption'), wrap=False))
                row.connect('activated', lambda _row, key=student_id: self.window.open_student(key))
                people.add(row)
            if len(students) > len(ranked):
                more = Adw.ButtonRow(title=f'Ver todos os {len(students)} alunos')
                more.connect('activated', lambda *_: self.window.open_page('students'))
                people.add(more)
            box.append(people)
        self.show_content(scrolled(box))

    def on_shown(self) -> None:
        # A dashboard: always current when you come back to it.
        self.refresh()

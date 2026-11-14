"""Progress: class average, strongest skill and point of attention, skill averages, students per level and
each student's progress (same formulas as the website's Progresso)."""
from __future__ import annotations

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import Page, empty_state, hero_card, label, scrolled, stat_card, stat_row, vbox
from langspot_linux.worker import run_async

LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']


class ProgressPage(Page):
    key = 'progress'
    title = 'Progresso'
    icon = 'power-profile-performance-symbolic'

    def __init__(self, window) -> None:
        super().__init__(window)
        self.records: list[dict] = []
        self.lesson_counts: dict[str, int] = {}
        self.level = None
        self.level_filter = Gtk.DropDown.new_from_strings(['Todos os níveis'] + LEVELS)
        self.level_filter.set_tooltip_text('Filtrar por nível')
        self.level_filter.connect('notify::selected', lambda dropdown, _p: self._set_level(dropdown.get_selected()))
        self.header.pack_start(self.level_filter)

    def _set_level(self, index: int) -> None:
        self.level = LEVELS[index - 1] if index else None
        self.render()

    def refresh(self) -> None:
        self.show_loading()
        client = self.client

        def work():
            records = client.select('student_records', select='student_id,level,goal,skills,student:profiles!student_records_student_id_fkey(full_name)')
            lessons = client.select('lessons', select='student_id', status='eq.completed')
            return records, lessons

        run_async(work, self._loaded, self.show_error)

    def _loaded(self, result) -> None:
        self.records, lessons = result
        self.lesson_counts = {}
        for row in lessons:
            self.lesson_counts[row['student_id']] = self.lesson_counts.get(row['student_id'], 0) + 1
        self.render()

    @staticmethod
    def _name(record: dict) -> str:
        return (record.get('student') or {}).get('full_name') or 'Aluno'

    def render(self) -> None:
        box = vbox(20)
        visible = [row for row in self.records if self.level is None or row.get('level') == self.level]
        if not self.records:
            box.append(empty_state('power-profile-performance-symbolic', 'Nenhum aluno ainda', 'O progresso aparece quando você tiver alunos.'))
            self.show_content(scrolled(box))
            return
        skill_sets = [row.get('skills') for row in visible]
        average = round(sum(model.progress_of(skills) for skills in skill_sets) / len(skill_sets)) if skill_sets else 0
        averages = {skill: model.skill_average(skill_sets, skill) for skill in model.SKILLS}

        score = vbox(0)
        score.set_valign(Gtk.Align.CENTER)
        score.append(label(f'{average}%', css=('ls-big-number',), xalign=1))
        score.append(label('média da turma' if self.level is None else f'média do {self.level}', css=('caption', 'dim-label'), xalign=1))
        box.append(hero_card('Panorama de desenvolvimento', 'Compare habilidades e veja onde cada aluno precisa de mais atenção.', score))

        top = max(visible, key=lambda row: model.progress_of(row.get('skills')), default=None)
        strongest = max(model.SKILLS, key=lambda skill: averages[skill]) if visible else None
        weakest = min(model.SKILLS, key=lambda skill: averages[skill]) if visible else None
        box.append(stat_row([stat_card(title, value, note, value_css='title-3') for title, value, note in (('Maior destaque', self._name(top) if top else '—', f'{model.progress_of(top.get("skills"))}% de progresso geral' if top else 'Nenhum aluno'),
                                   ('Habilidade mais forte', strongest or '—', f'{averages[strongest]}% de média' if strongest else 'Sem dados'),
                                   ('Ponto de atenção', weakest or '—', f'{averages[weakest]}% de média' if weakest else 'Sem dados'))],
                            wrap=True, per_line=3, min_per_line=1))

        skills = Adw.PreferencesGroup(title='Desempenho por habilidade', description='Média dos alunos' + (f' do nível {self.level}' if self.level else '') + '.')
        for skill in model.SKILLS:
            row = Adw.ActionRow(title=skill)
            row.add_suffix(Gtk.LevelBar(min_value=0, max_value=100, value=averages[skill], valign=Gtk.Align.CENTER, width_request=220))
            row.add_suffix(label(f'{averages[skill]}%', css=('numeric',), wrap=False))
            skills.add(row)
        box.append(skills)

        levels = Adw.PreferencesGroup(title='Alunos por nível')
        for level in LEVELS:
            count = sum(1 for row in self.records if row.get('level') == level)
            row = Adw.ActionRow(title=level)
            row.add_suffix(Gtk.LevelBar(min_value=0, max_value=max(1, len(self.records)), value=count, valign=Gtk.Align.CENTER, width_request=220))
            row.add_suffix(label(str(count), css=('numeric',), wrap=False))
            levels.add(row)
        box.append(levels)

        people = Adw.PreferencesGroup(title='Progresso dos alunos', description=f'{len(visible)} aluno(s)')
        if not visible:
            people.add(Adw.ActionRow(title='Nenhum aluno neste nível', subtitle='Escolha outro nível para comparar.'))
        for record in sorted(visible, key=lambda row: -model.progress_of(row.get('skills'))):
            values = model.normalize_skills(record.get('skills'))
            best = max(model.SKILLS, key=lambda skill: values[skill])
            value = model.progress_of(values)
            lessons = self.lesson_counts.get(record['student_id'], 0)
            row = Adw.ActionRow(title=GLib.markup_escape_text(self._name(record)),
                                subtitle=GLib.markup_escape_text(f'{record.get("level") or "—"} · destaque: {best} · {lessons} aula(s)'), activatable=True)
            row.add_prefix(Adw.Avatar(size=34, text=self._name(record), show_initials=True))
            row.add_suffix(Gtk.LevelBar(min_value=0, max_value=100, value=value, valign=Gtk.Align.CENTER, width_request=120))
            row.add_suffix(label(f'{value}%', css=('numeric',), wrap=False))
            row.add_suffix(Gtk.Image(icon_name='go-next-symbolic'))
            row.connect('activated', lambda _row, key=record['student_id']: self.window.open_student(key))
            people.add(row)
        box.append(people)
        self.show_content(scrolled(box))

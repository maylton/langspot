"""A student's assessment history with level confirmation (Evolução), and item analytics."""
from __future__ import annotations

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux.ui.common import confirm, label, pill, rich_markup, scrolled, text_card, vbox
from langspot_linux.worker import run_async
from .attempts import show_attempt
from .base import _loading, _push, _when


def show_progress(host, students: dict[str, dict], assessments: list[dict], student_id: str | None = None) -> None:
    holder = vbox(18)
    ids = sorted(students, key=lambda key: students[key]['name'].lower())
    content = Adw.Bin()
    if not ids:
        holder.append(Adw.StatusPage(icon_name='system-users-symbolic', title='Nenhum aluno'))
        _push(host, 'Evolução', scrolled(holder))
        return
    state = {'student': student_id if student_id in ids else ids[0]}
    picker = Adw.PreferencesGroup(description='Compare resultados por competência e confirme mudanças de nível.')
    combo_row = Adw.ComboRow(title='Aluno', model=Gtk.StringList.new([students[key]['name'] for key in ids]), enable_search=True)
    combo_row.set_selected(ids.index(state['student']))
    picker.add(combo_row)
    holder.append(picker)
    holder.append(content)
    _push(host, 'Evolução', scrolled(holder))

    def load() -> None:
        content.set_child(_loading())
        run_async(lambda: host.client.rpc('get_assessment_progress', p_student_id=state['student']), render,
                  lambda error: content.set_child(label(f'Não foi possível carregar a evolução: {error}', css=('dim-label',))))

    def render(report: dict) -> None:
        box = vbox(18)
        history = report.get('history') or []
        if not history:
            box.append(Adw.StatusPage(icon_name='power-profile-performance-symbolic', title='Sem histórico concluído',
                                      description='Os resultados aparecem depois da conclusão das avaliações.'))
            content.set_child(box)
            return
        summary = Adw.PreferencesGroup()
        current = Adw.ActionRow(title='Nível atual', subtitle=f'{len(history)} avaliação(ões) concluída(s)')
        current.add_suffix(label(report.get('currentLevel') or '—', css=('title-2',), wrap=False))
        summary.add(current)
        box.append(summary)
        group = Adw.PreferencesGroup(title='Histórico')
        for index, item in enumerate(history):
            before = f' · anterior {history[index - 1].get("score") if history[index - 1].get("score") is not None else "—"}%' if index else ''
            row = Adw.ExpanderRow(title=GLib.markup_escape_text(f'{A.local_date(item.get("completedAt"))} · {item.get("title")}'),
                                  subtitle=GLib.markup_escape_text(f'v{item.get("version")} · {item.get("type")}{before}'))
            row.add_suffix(pill(f'{item.get("score") if item.get("score") is not None else "—"}%' + (f' · {item["estimatedCefr"]}' if item.get('estimatedCefr') else ''), 'accent'))
            for skill, value in (item.get('skills') or {}).items():
                line = Adw.ActionRow(title=A.REPORT_SKILLS.get(skill, skill))
                line.add_suffix(label(f'{value}%', css=('numeric',), wrap=False))
                row.add_row(line)
            open_report = Adw.ButtonRow(title='Ver relatório', start_icon_name='x-office-document-symbolic')
            open_report.connect('activated', lambda _r, attempt=item['attemptId']: show_attempt(host, attempt))
            row.add_row(open_report)
            if item.get('type') == 'placement' and item.get('estimatedCefr'):
                level = item['estimatedCefr']
                confirm_row = Adw.ButtonRow(title=f'Confirmar nível {level}', start_icon_name='object-select-symbolic')
                confirm_row.connect('activated', lambda _r, attempt=item['attemptId'], value=level: confirm(
                    host.window, f'Confirmar o nível {value} para este aluno?', 'O nível do aluno no perfil é atualizado e a mudança fica registrada no histórico.',
                    'Sim, confirmar', lambda: run_async(lambda: host.client.rpc('confirm_assessment_level_update', p_student_id=state['student'], p_attempt_id=attempt,
                                                                                p_level=value),
                                                        lambda _x: (host.window.toast(f'Nível {value} confirmado.'), load()),
                                                        lambda error: host.window.toast(str(error)))))
                row.add_row(confirm_row)
            group.add(row)
        box.append(group)
        updates = report.get('levelUpdates') or []
        if updates:
            log = Adw.PreferencesGroup(title='Mudanças de nível confirmadas')
            for update in updates:
                log.add(Adw.ActionRow(title=f'{update.get("previousLevel")} → {update.get("confirmedLevel")}', subtitle=_when(update.get('createdAt'))))
            box.append(log)
        content.set_child(box)

    combo_row.connect('notify::selected', lambda row, _p: (state.update(student=ids[row.get_selected()]), load()))
    load()


def show_analytics(host, assessment: dict) -> None:
    holder = Adw.Bin(child=_loading())
    _push(host, f'Analytics · {assessment.get("title")}', holder)

    def loaded(data: dict) -> None:
        box = vbox(18)
        box.append(label('Indicadores descritivos. Alinhamento pedagógico não equivale a validação psicométrica.', css=('dim-label',)))
        box.append(text_card(f'Status de calibração: {data.get("calibrationStatus")}',
                             f'Discriminação só é exibida após {data.get("minimumCalibrationResponses")} respostas válidas por item. '
                             'Até lá, os dados não sustentam cut scores calibrados.'))
        group = Adw.PreferencesGroup(title=f'{len(data.get("items") or [])} item(ns)')
        for item in data.get('items') or []:
            row = Adw.ExpanderRow(title=rich_markup(item.get('prompt') or ''), subtitle=f'{item.get("cefr")} · {item.get("skill")} · {item.get("responses")} resposta(s)',
                                  title_lines=2)
            for title, value in (('Facility', item.get('facility')), ('Tempo médio', f'{round(item["averageTimeMs"] / 1000)} s' if item.get('averageTimeMs') else None),
                                 ('Discriminação', item.get('discrimination') if item.get('discrimination') is not None else 'dados insuficientes'),
                                 ('Confiabilidade', item.get('reliabilityStatus'))):
                line = Adw.ActionRow(title=title)
                line.add_suffix(label(str(value) if value is not None else '—', css=('numeric',), wrap=False))
                row.add_row(line)
            group.add(row)
        box.append(group)
        holder.set_child(scrolled(box))
    run_async(lambda: host.client.rpc('get_cefr_item_analytics', p_assessment_id=assessment['id']), loaded,
              lambda error: holder.set_child(label(f'Não foi possível carregar os indicadores: {error}', css=('dim-label',))))

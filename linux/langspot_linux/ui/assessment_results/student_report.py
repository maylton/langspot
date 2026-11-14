"""The report the student sees: the teacher's note, the preview and the PDF."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path

from gi.repository import Adw, GLib, Gtk

from langspot_linux import assessments as A
from langspot_linux import model
from langspot_linux.ui.common import card_box, label, pill, text_card, vbox
from langspot_linux.worker import run_async


def _report_group(host, result: dict) -> Gtk.Widget:
    attempt_id = (result.get('attempt') or {}).get('id')
    container = vbox(8)
    row = Adw.ExpanderRow(title='Relatório para o aluno', subtitle='Comentário, próximos passos e o relatório que o aluno vê (com PDF).',
                          expanded=bool((result.get('attempt') or {}).get('reviewedAt')))
    row.add_prefix(Gtk.Image(icon_name='x-office-document-symbolic'))
    group = Adw.PreferencesGroup()
    group.add(row)
    container.append(group)
    state: dict = {'note': None, 'previous': None}
    summary_box = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=8, bottom_margin=8, left_margin=10, right_margin=10, height_request=80)
    steps_box = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=8, bottom_margin=8, left_margin=10, right_margin=10, height_request=80)
    for title, view in (('Comentário do professor', summary_box), ('Próximos passos', steps_box)):
        frame = Gtk.Frame(child=view, margin_start=12, margin_end=12, margin_top=4, margin_bottom=4)
        heading = Adw.ActionRow(title=title)
        row.add_row(heading)
        row.add_row(frame)
    preview_holder = Adw.Bin()
    row.add_row(preview_holder)
    buttons = Gtk.Box(spacing=8, halign=Gtk.Align.END, margin_top=8, margin_bottom=8, margin_end=12)
    save = Gtk.Button(label='Salvar comentário', sensitive=False)
    save.add_css_class('suggested-action')
    pdf = Gtk.Button(label='Salvar PDF')
    buttons.append(pdf)
    buttons.append(save)
    row.add_row(buttons)

    def text(view: Gtk.TextView) -> str:
        buffer = view.get_buffer()
        return buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), False).strip()

    def note_now() -> dict:
        return {'summary': text(summary_box), 'nextSteps': text(steps_box)}

    def refresh_preview(*_):
        saved = state['note'] or {}
        save.set_sensitive(note_now() != {'summary': saved.get('summary') or '', 'nextSteps': saved.get('nextSteps') or ''})
        preview_holder.set_child(_student_report(result, state['previous'], note_now()))

    summary_box.get_buffer().connect('changed', refresh_preview)
    steps_box.get_buffer().connect('changed', refresh_preview)

    def loaded(values) -> None:
        state['note'], state['previous'] = values
        summary_box.get_buffer().set_text((state['note'] or {}).get('summary') or '')
        steps_box.get_buffer().set_text((state['note'] or {}).get('nextSteps') or '')
        refresh_preview()

    def fetch():
        note = host.client.rpc('get_assessment_report_note', p_attempt_id=attempt_id)
        try:
            previous = host.client.rpc('get_previous_assessment_for_report', p_attempt_id=attempt_id)
        except Exception:
            previous = None
        return note, previous
    run_async(fetch, loaded, lambda error: host.window.toast(f'Não foi possível carregar o comentário: {error}'))

    def submit(*_):
        values = note_now()
        save.set_sensitive(False)

        def done(note) -> None:
            state['note'] = note or values
            host.window.toast('Comentário salvo. O aluno verá quando o resultado estiver liberado.')
            refresh_preview()

        def work():
            host.client.rpc('save_assessment_report_note', p_attempt_id=attempt_id, p_summary=values['summary'], p_next_steps=values['nextSteps'])
            return host.client.rpc('get_assessment_report_note', p_attempt_id=attempt_id)
        run_async(work, done, lambda error: (save.set_sensitive(True), host.window.toast(str(error))))
    save.connect('clicked', submit)
    pdf.connect('clicked', lambda *_: save_report_pdf(host.window, result, state['previous'], note_now()))
    return container


def _report_title(result: dict) -> tuple[str, str]:
    attempt = result.get('attempt') or {}
    completed = attempt.get('reviewedAt') or attempt.get('submittedAt')
    when = ''
    if completed:
        try:
            moment = datetime.fromisoformat(completed.replace('Z', '+00:00')).astimezone()
            when = f'{moment.day:02d} de {model.MONTH_NAMES[moment.month - 1].lower()} de {moment.year}'
        except ValueError:
            when = ''
    return (result.get('assessment') or {}).get('title') or 'Avaliação', ' · '.join(part for part in (attempt.get('studentName'), when) if part)


def _student_report(result: dict, previous: dict | None, note: dict) -> Gtk.Widget:
    attempt = result.get('attempt') or {}
    profile = result.get('cefrProfile')
    report = A.build_student_report(result.get('sections') or [], attempt.get('scaledScore'), profile, previous)
    box = card_box(10)
    box.set_margin_start(12)
    box.set_margin_end(12)
    box.set_margin_top(8)
    title, subtitle = _report_title(result)
    box.append(label('RELATÓRIO DE AVALIAÇÃO · prévia do que o aluno vê', css=('caption-heading', 'dim-label')))
    head = Gtk.Box(spacing=12)
    names = vbox(2)
    names.set_hexpand(True)
    names.append(label(title, css=('title-3',)))
    names.append(label(subtitle, css=('dim-label',)))
    head.append(names)
    overall = (profile or {}).get('overallLevel') or attempt.get('estimatedCefr') or (f'{round(attempt["scaledScore"])}%' if isinstance(attempt.get('scaledScore'), (int, float)) else '—')
    side = vbox(0)
    side.append(label(overall, css=('ls-big-number',), xalign=1))
    caption = 'nível estimado (CEFR)' if (profile or {}).get('overallLevel') else 'resultado geral'
    if report['scoreDelta'] is not None:
        caption += f' · {report["scoreDelta"]:+g} p.p.'
    side.append(label(caption, css=('caption', 'dim-label'), xalign=1))
    head.append(side)
    box.append(head)
    for line in report['skills']:
        row = Gtk.Box(spacing=10)
        row.append(label(line['label'], wrap=False, xalign=0))
        row.get_last_child().set_size_request(160, -1)
        if line['rubric']:
            row.append(label('avaliado pelo professor', css=('dim-label', 'caption'), wrap=False))
            row.get_last_child().set_hexpand(True)
            row.append(pill(line['level'], 'accent'))
        elif line['percentage'] is None and not line['level']:
            row.append(label('não avaliado', css=('dim-label', 'caption'), wrap=False))
            row.get_last_child().set_hexpand(True)
        else:
            row.append(Gtk.LevelBar(min_value=0, max_value=100, value=max(0, min(100, line['percentage'] or 0)), hexpand=True, valign=Gtk.Align.CENTER))
            row.append(label(f'{line["percentage"]}%' + (f' · {line["level"]}' if line['level'] else ''), css=('numeric',), wrap=False))
        if line['delta'] is not None:
            row.append(pill(f'{line["delta"]:+g} p.p.', 'success' if line['delta'] > 0 else 'error' if line['delta'] < 0 else ''))
        elif previous:
            row.append(label('novo', css=('caption', 'dim-label'), wrap=False))
        box.append(row)
    for heading, items in (('Pontos fortes', report['strengths']), ('Prioridades', report['priorities'])):
        if items:
            box.append(label(heading, css=('heading',)))
            box.append(label('\n'.join(f'• {item}' for item in items)))
    if note.get('summary') or note.get('nextSteps'):
        if note.get('summary'):
            box.append(text_card('Comentário do professor', note['summary']))
        if note.get('nextSteps'):
            box.append(text_card('Próximos passos', note['nextSteps']))
    if profile and profile.get('disclaimer'):
        box.append(label(profile['disclaimer'], css=('caption', 'dim-label')))
    return box


def save_report_pdf(window, result: dict, previous: dict | None, note: dict) -> None:
    title, subtitle = _report_title(result)
    student = (result.get('attempt') or {}).get('studentName') or 'aluno'
    name = A.student_form_seed(student).rsplit('-', 1)[0]
    chooser = Gtk.FileDialog(title='Salvar relatório em PDF', initial_name=f'relatorio-{name}.pdf')

    def finished(dlg, outcome):
        try:
            target = Path(dlg.save_finish(outcome).get_path())
        except GLib.Error:
            return
        try:
            write_report_pdf(target, result, previous, note)
            window.toast(f'PDF salvo: {target.name}')
        except Exception as error:  # noqa: BLE001 - shown to the teacher
            window.toast(f'Não foi possível gerar o PDF: {error}')
    chooser.save(window, None, finished)


def write_report_pdf(path: Path, result: dict, previous: dict | None, note: dict) -> None:
    """The student report as an A4 PDF (Cairo + Pango), like the website's print to PDF."""
    import cairo
    import gi
    gi.require_version('PangoCairo', '1.0')
    from gi.repository import Pango, PangoCairo

    attempt = result.get('attempt') or {}
    profile = result.get('cefrProfile')
    report = A.build_student_report(result.get('sections') or [], attempt.get('scaledScore'), profile, previous)
    title, subtitle = _report_title(result)
    width, height, margin = 595, 842, 56
    surface = cairo.PDFSurface(str(path), width, height)
    context = cairo.Context(surface)
    state = {'y': margin}

    def layout(markup: str, size: float, *, bold: bool = False, color=(0.12, 0.14, 0.2), width_pt: float = width - 2 * margin):
        item = PangoCairo.create_layout(context)
        font = Pango.FontDescription.from_string(f'Sans {"Bold " if bold else ""}{size}')
        item.set_font_description(font)
        item.set_width(int(width_pt * Pango.SCALE))
        item.set_wrap(Pango.WrapMode.WORD_CHAR)
        item.set_markup(markup, -1)
        return item, color

    def draw(markup: str, size: float = 10.5, *, bold: bool = False, color=(0.12, 0.14, 0.2), gap: float = 6, x: float = margin, width_pt: float | None = None):
        item, color = layout(markup, size, bold=bold, color=color, width_pt=width_pt or width - 2 * margin)
        block = item.get_pixel_extents()[1].height
        if state['y'] + block > height - margin:
            context.show_page()
            state['y'] = margin
        context.set_source_rgb(*color)
        context.move_to(x, state['y'])
        PangoCairo.show_layout(context, item)
        state['y'] += block + gap
        return block

    escape = GLib.markup_escape_text
    accent = (0.2, 0.35, 0.58)
    draw('LANGSPOT · RELATÓRIO DE AVALIAÇÃO', 8.5, bold=True, color=accent, gap=4)
    draw(escape(title), 18, bold=True, gap=2)
    draw(escape(subtitle), 10, color=(0.4, 0.42, 0.48), gap=14)
    overall = (profile or {}).get('overallLevel') or attempt.get('estimatedCefr') or (f'{round(attempt["scaledScore"])}%' if isinstance(attempt.get('scaledScore'), (int, float)) else '—')
    caption = 'nível estimado (CEFR)' if (profile or {}).get('overallLevel') else 'resultado geral'
    if report['scoreDelta'] is not None:
        caption += f' · {report["scoreDelta"]:+g} p.p. desde a avaliação anterior'
    draw(f'<b>{escape(overall)}</b>  <span size="small">{escape(caption)}</span>', 22, color=accent, gap=16)
    draw('Resultado por habilidade', 12, bold=True, gap=8)
    for line in report['skills']:
        top = state['y']
        draw(escape(line['label']), 10.5, gap=0, width_pt=150)
        state['y'] = top
        if line['rubric']:
            value = f'{line["level"]}  ·  avaliado pelo professor'
        elif line['percentage'] is None and not line['level']:
            value = 'não avaliado'
        else:
            value = f'{line["percentage"]}%' + (f'  ·  {line["level"]}' if line['level'] else '')
            bar_x, bar_w = margin + 150, 170
            context.set_source_rgb(0.89, 0.92, 0.97)
            context.rectangle(bar_x, top + 4, bar_w, 7)
            context.fill()
            context.set_source_rgb(*accent)
            context.rectangle(bar_x, top + 4, bar_w * max(0, min(100, line['percentage'] or 0)) / 100, 7)
            context.fill()
        if line['delta'] is not None:
            value += f'  ({line["delta"]:+g} p.p.)'
        draw(escape(value), 10.5, gap=6, x=margin + 335, width_pt=width - margin - (margin + 335))
    state['y'] += 8
    for heading, items in (('Pontos fortes', report['strengths']), ('Prioridades de desenvolvimento', report['priorities'])):
        if items:
            draw(heading, 12, bold=True, gap=4)
            for item in items:
                draw('•  ' + escape(item), 10.5, gap=3)
            state['y'] += 8
    for heading, value in (('Comentário do professor', note.get('summary')), ('Próximos passos', note.get('nextSteps'))):
        if value:
            draw(heading, 12, bold=True, gap=4)
            draw(escape(value), 10.5, gap=12)
    if profile and profile.get('disclaimer'):
        draw(escape(profile['disclaimer']), 8.5, color=(0.45, 0.47, 0.52), gap=4)
    surface.finish()

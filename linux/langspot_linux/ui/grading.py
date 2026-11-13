"""Grading of one productive response (Writing, Speaking, Mediation) with the CEFR rubric.

Shared by the review queue and the assessment results; the host is a Page (nav, window, client, refresh).
"""
from __future__ import annotations

import os
from pathlib import Path

from gi.repository import Adw, GLib, Gtk

from langspot_linux import model
from langspot_linux.ui.common import ask_text, label, pill, scrolled, text_card, vbox
from langspot_linux.worker import run_async

PRODUCTIVE = ('writing', 'speaking', 'mediation')


def cache_dir() -> Path:
    base = Path(os.environ.get('XDG_CACHE_HOME') or Path.home() / '.cache') / 'langspot' / 'audio'
    base.mkdir(parents=True, exist_ok=True)
    return base


class GradingMixin:
    def show_grading(self, meta: dict, result: dict, response_id: str, on_saved=None) -> None:
        question = next((entry for entry in result.get('questions') or [] if entry.get('responseId') == response_id), None)
        if not question:
            self.window.toast('Resposta não encontrada nesta tentativa.')
            return
        attempt = result.get('attempt') or {}
        student = attempt.get('studentName') or meta.get('studentName') or 'Aluno'
        skill = model.SKILL_LABELS.get(meta.get('skill') or '', question.get('type') or '')
        toolbar = Adw.ToolbarView()
        toolbar.add_top_bar(Adw.HeaderBar())
        box = vbox(18)

        head = Gtk.Box(spacing=12)
        head.append(Adw.Avatar(size=44, text=student, show_initials=True))
        titles = vbox(2)
        titles.append(label(student, css=('title-3',)))
        titles.append(label(f'{(result.get("assessment") or {}).get("title") or meta.get("assessmentTitle") or ""} · {skill}', css=('dim-label',)))
        head.append(titles)
        if meta.get('cefr'):
            target = pill(f'alvo {meta["cefr"]}', 'accent')
            target.set_hexpand(True)
            target.set_halign(Gtk.Align.END)
            head.append(target)
        box.append(head)

        box.append(text_card('Tarefa', question.get('prompt') or meta.get('prompt') or ''))
        source = meta.get('sourceMaterial')
        if source:
            box.append(text_card('Material-fonte', source, css='ls-source'))

        answer = question.get('answer') or ''
        constraints = meta.get('responseConstraints') or {}
        if question.get('type') == 'speaking':
            box.append(self._audio_card(question, result))
        else:
            card = vbox(8)
            card.add_css_class('card')
            card.add_css_class('ls-card')
            card.append(label('Resposta do aluno', css=('caption-heading', 'dim-label')))
            card.append(label(answer or 'Em branco', selectable=True, css=() if answer else ('dim-label',)))
            if answer:
                words = model.word_count(answer)
                info = f'{words} palavras'
                kind = ''
                if constraints.get('unit') == 'words':
                    info += f' · pedido: {constraints.get("label")}'
                    kind = 'warning' if words < (constraints.get('min') or 0) or words > (constraints.get('max') or 10 ** 6) else 'success'
                count = pill(info, kind)
                count.set_halign(Gtk.Align.START)
                card.append(count)
            box.append(card)

        rubric = question.get('rubric') or []
        existing = question.get('rubricScores') or {}
        combos: dict[str, Adw.ComboRow] = {}
        if rubric:
            group = Adw.PreferencesGroup(title='Rubrica', description='Escolha o nível demonstrado em cada critério.')
            levels = Gtk.StringList.new(['Escolha…', *model.CEFR_LEVELS])
            for criterion in rubric:
                combo = Adw.ComboRow(title=model.criterion_label(criterion), model=levels)
                value = existing.get(criterion['key'])
                if value:
                    combo.set_selected(int(value))
                combos[criterion['key']] = combo
                group.add(combo)
            box.append(group)

        feedback_group = Adw.PreferencesGroup(title='Comentário para o aluno', description='Aparece no resultado e no relatório.')
        feedback = Gtk.TextView(wrap_mode=Gtk.WrapMode.WORD_CHAR, top_margin=10, bottom_margin=10, left_margin=12, right_margin=12, height_request=110)
        feedback.get_buffer().set_text(question.get('teacherFeedback') or '')
        frame = Gtk.Frame(child=feedback)
        frame.add_css_class('card')
        feedback_group.add(frame)
        box.append(feedback_group)

        buttons = Gtk.Box(spacing=12, halign=Gtk.Align.END)
        if not answer:
            exclude = Gtk.Button(label='Excluir da avaliação')
            exclude.add_css_class('destructive-action')
            exclude.add_css_class('pill')
            exclude.connect('clicked', lambda *_: ask_text(self.window, 'Excluir esta tarefa da avaliação?',
                                                           'Use quando não há resposta por um problema técnico. A tarefa não conta na nota nem no nível.',
                                                           'Motivo (o aluno vê este texto)', 'Excluir', lambda reason: self._exclude(response_id, reason, on_saved)))
            buttons.append(exclude)
        save = Gtk.Button(label='Salvar correção')
        save.add_css_class('suggested-action')
        save.add_css_class('pill')
        buttons.append(save)
        box.append(buttons)

        def submit(*_):
            scores = {key: float(combo.get_selected()) for key, combo in combos.items() if combo.get_selected() > 0}
            buffer = feedback.get_buffer()
            text = buffer.get_text(buffer.get_start_iter(), buffer.get_end_iter(), False).strip()
            try:
                score = model.rubric_score(rubric, scores, float(question.get('maxScore') or 1)) if rubric else float(question.get('maxScore') or 1)
            except ValueError as error:
                self.window.toast(str(error))
                return
            save.set_sensitive(False)

            def done(_r) -> None:
                self.window.toast('Correção salva.')
                self.nav.pop()
                self.window.app.poll()
                (on_saved or self.refresh)()

            def failed(error: Exception) -> None:
                save.set_sensitive(True)
                self.window.toast(str(error))

            run_async(lambda: self.client.rpc('review_assessment_response', p_response_id=response_id, p_score=score, p_feedback=text,
                                              p_rubric_scores={key: int(value) for key, value in scores.items()}), done, failed)

        save.connect('clicked', submit)
        toolbar.set_content(scrolled(box))
        self.nav.push(Adw.NavigationPage(title=f'{student} · {skill}', child=toolbar))

    def _audio_card(self, question: dict, result: dict) -> Gtk.Widget:
        card = vbox(10)
        card.add_css_class('card')
        card.add_css_class('ls-card')
        card.append(label('Gravação do aluno', css=('caption-heading', 'dim-label')))
        discarded = model.discarded_recordings((result.get('integrity') or {}).get('events') or [], question.get('id'))
        if discarded:
            card.append(label(f'O aluno apagou {discarded} gravação(ões) e enviou a tentativa {discarded + 1} de 3.', css=('caption',)))
        path = question.get('mediaPath') or question.get('answer')
        if not path:
            card.append(label('Sem gravação.', css=('dim-label',)))
            return card
        status = label('Baixando o áudio…', css=('dim-label', 'caption'))
        card.append(status)

        def fetch() -> str:
            url = self.client.signed_url('assessment-audio', path, 300)
            target = cache_dir() / (question['responseId'] + Path(path).suffix)
            target.write_bytes(self.client.download(url))
            return str(target)

        def ready(filename: str) -> None:
            media = Gtk.MediaFile.new_for_filename(filename)
            controls = Gtk.MediaControls(media_stream=media)
            card.remove(status)
            card.append(controls)

        run_async(fetch, ready, lambda error: status.set_text(f'Não foi possível baixar o áudio: {error}'))
        return card

    def _exclude(self, response_id: str, reason: str, on_saved) -> None:
        def done(_r) -> None:
            self.window.toast('Tarefa excluída da avaliação.')
            self.nav.pop()
            self.window.app.poll()
            (on_saved or self.refresh)()

        run_async(lambda: self.client.rpc('exclude_assessment_response', p_response_id=response_id, p_reason=reason),
                  done, lambda error: self.window.toast(str(error)))

    # ------------------------------------------------------------------ finished attempts

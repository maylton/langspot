import { ArrowLeft, Brain, Clock3, Layers3, LoaderCircle, Plus, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { confirmAction } from '../../components/dialogs';
import { Flashcard, FlashcardDeck, FlashcardReview, Profile, supabase } from '../../supabase';
import { EmptyPortal } from '../components/ui';
import { type FlashcardRating } from '../types';

export function StudentFlashcards({ profile, onActivity, readOnly = false }: { profile: Profile; onActivity: () => Promise<void>; readOnly?: boolean }) {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [reviews, setReviews] = useState<FlashcardReview[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [creatingDeckBusy, setCreatingDeckBusy] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [creatingCardBusy, setCreatingCardBusy] = useState(false);
  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId) ?? null;

  const loadFlashcards = async () => {
    if (!supabase) return;
    setLoading(true);
    setMessage('');
    const deckResult = await supabase.from('flashcard_decks').select('*').eq('user_id', profile.id).order('updated_at', { ascending: false });
    const deckRows = (deckResult.data ?? []) as FlashcardDeck[];
    const deckIds = deckRows.map((deck) => deck.id);
    const [cardResult, reviewResult] = await Promise.all([
      deckIds.length ? supabase.from('flashcards').select('*').in('deck_id', deckIds).order('created_at', { ascending: true }) : Promise.resolve({ data: [], error: null }),
      supabase.from('flashcard_reviews').select('*').eq('user_id', profile.id),
    ]);
    if (deckResult.error || cardResult.error || reviewResult.error) {
      setMessage(deckResult.error?.message ?? cardResult.error?.message ?? reviewResult.error?.message ?? 'Não foi possível carregar os flashcards.');
    } else {
      setDecks(deckRows);
      setCards((cardResult.data ?? []) as Flashcard[]);
      setReviews((reviewResult.data ?? []) as FlashcardReview[]);
    }
    setLoading(false);
  };

  useEffect(() => { void loadFlashcards(); }, [profile.id]);

  const reviewByCard = useMemo(() => new Map(reviews.map((review) => [review.card_id, review])), [reviews]);
  const now = Date.now();
  const dueCards = cards.filter((card) => {
    const review = reviewByCard.get(card.id);
    return !review || new Date(review.due_at).getTime() <= now;
  });
  const learnedCount = reviews.filter((review) => review.repetitions > 0).length;
  const deckCards = selectedDeckId ? cards.filter((card) => card.deck_id === selectedDeckId) : [];
  const deckDueCards = selectedDeckId ? dueCards.filter((card) => card.deck_id === selectedDeckId) : dueCards;

  const openDeckCreator = () => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    setMessage('');
    setSelectedDeckId(null);
    setCreatingCard(false);
    setCreatingDeck(true);
  };

  const createDeck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase) return;
    setMessage('');
    setCreatingDeckBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { data, error } = await supabase.from('flashcard_decks').insert({
      user_id: profile.id,
      teacher_id: profile.teacher_id,
      title: String(form.get('title') || '').trim(),
      description: String(form.get('description') || '').trim(),
    }).select('*').single();
    if (error || !data) setMessage(error?.message ?? 'Não foi possível criar o baralho.');
    else {
      const createdDeck = data as FlashcardDeck;
      formElement.reset();
      setDecks((current) => [createdDeck, ...current.filter((deck) => deck.id !== createdDeck.id)]);
      setSelectedDeckId(createdDeck.id);
      setCreatingDeck(false);
      setMessage('Baralho criado! Adicione agora o primeiro cartão.');
    }
    setCreatingDeckBusy(false);
  };

  const deleteDeck = async (deckId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !(await confirmAction({ title: 'Excluir este baralho e todos os cartões?', confirmLabel: 'Sim, excluir', danger: true }))) return;
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', deckId);
    if (error) setMessage(error.message);
    else { setSelectedDeckId(null); await loadFlashcards(); }
  };

  const createCard = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !selectedDeckId) return;
    setMessage('');
    setCreatingCardBusy(true);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const { data, error } = await supabase.from('flashcards').insert({
      deck_id: selectedDeckId,
      front: String(form.get('front') || '').trim(),
      back: String(form.get('back') || '').trim(),
      example: String(form.get('example') || '').trim(),
    }).select('*').single();
    if (error || !data) setMessage(error?.message ?? 'Não foi possível salvar o cartão.');
    else {
      const createdCard = data as Flashcard;
      formElement.reset();
      setCards((current) => [...current.filter((card) => card.id !== createdCard.id), createdCard]);
      setMessage('Cartão salvo! Você pode adicionar outro ou começar a estudar.');
    }
    setCreatingCardBusy(false);
  };

  const deleteCard = async (cardId: string) => {
    if (readOnly) { setMessage('Modo de visualização: alterações estão desativadas.'); return; }
    if (!supabase || !(await confirmAction({ title: 'Excluir este cartão?', confirmLabel: 'Sim, excluir', danger: true }))) return;
    const { error } = await supabase.from('flashcards').delete().eq('id', cardId);
    if (error) setMessage(error.message); else await loadFlashcards();
  };

  const beginStudy = (scope: Flashcard[]) => {
    if (!scope.length) { setMessage('Nenhum cartão está programado para revisão agora.'); return; }
    setMessage('');
    setStudyCards([...scope].sort(() => Math.random() - 0.5));
    setStudyIndex(0);
    setShowAnswer(false);
  };

  const rateCard = async (rating: FlashcardRating) => {
    if (readOnly) { setMessage('Modo de visualização: avaliações de estudo estão desativadas.'); return; }
    if (!supabase) return;
    const card = studyCards[studyIndex];
    const previous = reviewByCard.get(card.id);
    const previousInterval = previous?.interval_days ?? 0;
    const previousEase = previous?.ease_factor ?? 2.5;
    const previousRepetitions = previous?.repetitions ?? 0;
    let repetitions = previousRepetitions + 1;
    let intervalDays = 1;
    let easeFactor = previousEase;

    if (rating === 'again') {
      repetitions = 0;
      intervalDays = 1;
      easeFactor = Math.max(1.3, previousEase - 0.2);
    } else if (rating === 'hard') {
      intervalDays = Math.max(1, Math.round(Math.max(1, previousInterval) * 1.2));
      easeFactor = Math.max(1.3, previousEase - 0.15);
    } else if (rating === 'good') {
      intervalDays = previousRepetitions === 0 ? 1 : previousRepetitions === 1 ? 3 : Math.max(4, Math.round(previousInterval * previousEase));
    } else {
      intervalDays = previousRepetitions === 0 ? 4 : Math.max(6, Math.round(Math.max(1, previousInterval) * previousEase * 1.3));
      easeFactor = Math.min(3.2, previousEase + 0.15);
    }

    const reviewedAt = new Date();
    const dueAt = new Date(reviewedAt.getTime() + intervalDays * 86400000);
    const { error } = await supabase.from('flashcard_reviews').upsert({
      card_id: card.id,
      user_id: profile.id,
      due_at: dueAt.toISOString(),
      interval_days: intervalDays,
      ease_factor: easeFactor,
      repetitions,
      last_reviewed_at: reviewedAt.toISOString(),
    }, { onConflict: 'card_id,user_id' });
    if (error) { setMessage(error.message); return; }

    if (studyIndex + 1 >= studyCards.length) {
      setStudyCards([]);
      setStudyIndex(0);
      setShowAnswer(false);
      setMessage(`Sessão concluída! ${studyCards.length} cartão(ões) revisado(s).`);
      await loadFlashcards();
      await onActivity();
    } else {
      setStudyIndex((current) => current + 1);
      setShowAnswer(false);
    }
  };

  if (loading) return <div className="auth-loading compact"><LoaderCircle className="spin" size={26} />Carregando seus flashcards...</div>;

  if (studyCards.length) {
    const card = studyCards[studyIndex];
    return <div className="student-page flashcard-study-page"><section className="student-panel flashcard-study-shell"><div className="flashcard-study-header"><button className="flashcard-back-button" onClick={() => { setStudyCards([]); setShowAnswer(false); }}><ArrowLeft size={16} />Sair da sessão</button><span>{studyIndex + 1} de {studyCards.length}</span></div><div className={`study-card ${showAnswer ? 'flipped' : ''}`} onClick={() => setShowAnswer(true)} role="button" tabIndex={0}><span>{showAnswer ? 'RESPOSTA' : 'PERGUNTA'}</span><h2>{showAnswer ? card.back : card.front}</h2>{showAnswer && card.example && <p>{card.example}</p>}{!showAnswer && <small>Toque no cartão para revelar a resposta</small>}</div>{showAnswer ? <div className="flashcard-ratings"><button className="again" onClick={() => rateCard('again')}>Errei<small>rever amanhã</small></button><button className="hard" onClick={() => rateCard('hard')}>Difícil<small>intervalo curto</small></button><button className="good" onClick={() => rateCard('good')}>Acertei<small>intervalo normal</small></button><button className="easy" onClick={() => rateCard('easy')}>Fácil<small>intervalo maior</small></button></div> : <button className="student-primary reveal-answer" onClick={() => setShowAnswer(true)}><RotateCcw size={16} />Mostrar resposta</button>}</section></div>;
  }

  const mastery = cards.length ? Math.round((learnedCount / cards.length) * 100) : 0;

  return <div className="student-page flashcards-page">
    <section className="student-goals-hero flashcards-goal-hero"><div><p className="eyebrow">REPETIÇÃO ESPAÇADA</p><h2>Meus flashcards</h2><p>Organize o que deseja memorizar e revise cada conteúdo no momento certo.</p></div><div className="flashcards-hero-actions"><button className="cancel-button" onClick={openDeckCreator}><Plus size={16} />Novo baralho</button><button className="student-primary" onClick={() => beginStudy(dueCards)} disabled={!dueCards.length}><Brain size={16} />Estudar agora ({dueCards.length})</button></div></section>
    <section className="student-goal-stats flashcard-stat-grid"><article><Layers3 size={20} /><span>Baralhos</span><strong>{decks.length}</strong></article><article><Clock3 size={20} /><span>Para revisar</span><strong>{dueCards.length}</strong></article><article><Sparkles size={20} /><span>Progresso de estudo</span><strong>{mastery}%</strong></article></section>
    {message && <div className="auth-message">{message}</div>}
    {creatingDeck && !selectedDeck && <section className="student-panel"><form className="student-interactive-form" onSubmit={createDeck}><label>Título do baralho<input name="title" required placeholder="Ex.: Phrasal verbs" /></label><label>Descrição <span>(opcional)</span><input name="description" placeholder="Ex.: Vocabulário da unidade 4" /></label><div className="form-actions full-field"><button type="button" className="cancel-button" disabled={creatingDeckBusy} onClick={() => setCreatingDeck(false)}>Cancelar</button><button className="primary-button" disabled={creatingDeckBusy}>{creatingDeckBusy ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}{creatingDeckBusy ? 'Criando...' : 'Criar baralho'}</button></div></form></section>}
    {selectedDeck ? <section className="student-panel flashcard-deck-detail"><div className="student-section-heading"><div><button className="flashcard-back-button" onClick={() => setSelectedDeckId(null)}><ArrowLeft size={15} />Todos os baralhos</button><p className="eyebrow">BARALHO ATUAL</p><h2>{selectedDeck.title}</h2><p>{selectedDeck.description || 'Sem descrição.'}</p></div><div className="flashcard-deck-actions"><button className="cancel-button" onClick={() => beginStudy(deckDueCards)} disabled={!deckDueCards.length}><Brain size={15} />Estudar ({deckDueCards.length})</button><button className="danger-text-button" onClick={() => deleteDeck(selectedDeck.id)}><Trash2 size={15} />Excluir</button></div></div><div className="flashcard-deck-progress"><div><span>Cartões estudados</span><strong>{deckCards.filter((card) => reviewByCard.has(card.id)).length}/{deckCards.length}</strong></div><i><b style={{ width: `${deckCards.length ? (deckCards.filter((card) => reviewByCard.has(card.id)).length / deckCards.length) * 100 : 0}%` }} /></i></div><div className="flashcard-card-toolbar"><span>{deckCards.length} cartão(ões) · {deckDueCards.length} para revisar</span><button className="student-primary" onClick={() => setCreatingCard((value) => !value)}><Plus size={15} />Novo cartão</button></div>{creatingCard && <form className="student-interactive-form flashcard-editor" onSubmit={createCard}><label>Frente do cartão<textarea name="front" rows={3} required placeholder="Ex.: What does 'borrow' mean?" /></label><label>Verso do cartão<textarea name="back" rows={3} required placeholder="Ex.: Pedir algo emprestado" /></label><label className="full-field">Exemplo ou observação <span>(opcional)</span><textarea name="example" rows={2} placeholder="Ex.: Can I borrow your pencil?" /></label><div className="form-actions full-field"><button type="button" className="cancel-button" disabled={creatingCardBusy} onClick={() => setCreatingCard(false)}>Concluir</button><button className="primary-button" disabled={creatingCardBusy}>{creatingCardBusy ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}{creatingCardBusy ? 'Salvando...' : 'Salvar cartão'}</button></div></form>}<div className="flashcard-list">{deckCards.length ? deckCards.map((card) => { const review = reviewByCard.get(card.id); return <article key={card.id}><div><span>{review ? `Próxima revisão: ${new Date(review.due_at).toLocaleDateString('pt-BR')}` : 'Novo cartão'}</span><h3>{card.front}</h3><p>{card.back}</p>{card.example && <small>{card.example}</small>}</div><button className="icon-button danger" title="Excluir cartão" onClick={() => deleteCard(card.id)}><Trash2 size={15} /></button></article>; }) : <EmptyPortal icon={Brain} title="Este baralho ainda está vazio" text="Adicione o primeiro cartão para começar seus estudos." />}</div></section> : <section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">SEUS BARALHOS</p><h2>Conteúdos em estudo</h2></div></div><div className="flashcard-deck-grid goal-inspired-decks">{decks.length ? decks.map((deck) => { const deckItems = cards.filter((card) => card.deck_id === deck.id); const due = dueCards.filter((card) => card.deck_id === deck.id).length; const studied = deckItems.filter((card) => reviewByCard.has(card.id)).length; const progress = deckItems.length ? Math.round((studied / deckItems.length) * 100) : 0; return <article key={deck.id}><button className="flashcard-deck-open" onClick={() => setSelectedDeckId(deck.id)}><div className="goal-card-heading"><div><span>{due ? `${due} PARA REVISAR` : 'EM DIA'}</span><h3>{deck.title}</h3></div><Brain size={20} /></div><p>{deck.description || 'Baralho pessoal'}</p><div className="goal-progress-heading"><span>Cartões estudados</span><strong>{progress}%</strong></div><i><b style={{ width: `${progress}%` }} /></i><small>{deckItems.length} cartão(ões) · {studied} estudado(s)</small></button><div className="flashcard-deck-footer"><button onClick={() => setSelectedDeckId(deck.id)}>Abrir baralho</button><button disabled={!due} onClick={() => beginStudy(dueCards.filter((card) => card.deck_id === deck.id))}><Brain size={14} />Estudar</button></div></article>; }) : <EmptyPortal icon={Brain} title="Crie seu primeiro baralho" text="Organize palavras, expressões, perguntas e respostas para revisar com repetição espaçada." />}</div></section>}
  </div>;
}

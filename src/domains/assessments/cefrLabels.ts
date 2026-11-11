import type { CefrConfidence, CefrProfile } from './types';

/** Portuguese labels for profile dimensions (objective subskills and rubric criteria). */
export const DIMENSION_LABELS: Record<string, string> = {
  // Reading / Listening subskills
  main_idea: 'ideia principal', basic_gist: 'sentido geral', detail: 'detalhes', specific_information: 'informação específica',
  inference: 'inferência', basic_inference: 'inferência simples', simple_inference: 'inferência simples', nuanced_inference: 'inferência sutil',
  sequence: 'sequência', simple_purpose: 'finalidade do texto', writer_purpose: 'objetivo do autor', writer_attitude: 'atitude do autor',
  writer_stance: 'posição do autor', author_stance: 'posição do autor', speaker_attitude: 'atitude de quem fala', speaker_opinion: 'opinião de quem fala',
  text_organisation: 'organização do texto', paragraph_function: 'função do parágrafo', reference: 'referência', implication: 'implicação',
  implicit_meaning: 'sentido implícito', main_argument: 'argumento central', nuanced_stance: 'posição com nuances', rhetorical_purpose: 'intenção retórica',
  figurative_meaning: 'sentido figurado', tone: 'tom', cause_effect: 'causa e efeito',
  // Language Use
  grammar: 'gramática', vocabulary: 'vocabulário', collocation: 'colocações', phrasal_verbs: 'phrasal verbs', discourse_markers: 'conectores',
  functional_language: 'linguagem funcional', lexical_choice: 'escolha de palavras', register: 'registro', word_formation: 'formação de palavras',
  // Rubric criteria
  task_achievement: 'cumprimento da tarefa', range: 'repertório', accuracy: 'correção', grammatical_accuracy: 'correção gramatical',
  lexical_control: 'controle do vocabulário', organisation_cohesion: 'organização e coesão', organisation: 'organização',
  register_pragmatic_appropriacy: 'adequação ao contexto', fluency: 'fluência', coherence: 'coerência', interaction: 'interação',
  pronunciation_phonological_control: 'pronúncia', information_selection: 'seleção de informações', accuracy_of_meaning: 'precisão do significado',
  reformulation: 'reformulação', audience_appropriacy: 'adequação ao leitor', language_control: 'controle da língua',
};

export const SKILL_LABELS: Record<string, string> = {
  reading: 'Reading', listening: 'Listening', writing: 'Writing', spoken_production: 'Spoken Production',
  spoken_interaction: 'Spoken Interaction', mediation: 'Mediation', language_use: 'Language Use', speaking: 'Speaking',
};

export const CONFIDENCE_LABELS: Record<CefrConfidence, string> = { low: 'baixa', moderate: 'moderada', high: 'alta' };

/** Skills rated by the teacher with a rubric: their percentage is a position on the CEFR scale, not a score. */
export const RUBRIC_SKILLS = new Set(['writing', 'speaking', 'spoken_production', 'spoken_interaction', 'mediation']);

export const dimensionLabel = (key: string) => DIMENSION_LABELS[key] ?? key.replace(/_/g, ' ');

/** "writing.task_achievement" → "Writing · cumprimento da tarefa" */
export function formatProfileItem(item: string): string {
  const [skill, dimension] = item.split('.');
  const label = SKILL_LABELS[skill] ?? skill.replace(/_/g, ' ');
  return dimension ? `${label} · ${dimensionLabel(dimension)}` : label;
}

/** "A2+ approaching B1" / "B1 consolidation" → Portuguese. */
export function placementLabel(placement: string | null | undefined): string {
  if (!placement) return '';
  return placement.replace(/^(\S+) approaching (\S+)$/, '$1, perto do $2').replace(/^(\S+) consolidation$/, '$1 (consolidar)');
}

/**
 * Development priorities worth showing. An objective dimension whose items were mostly answered
 * correctly is not a priority, even when its items were below the overall level (an A2 item answered
 * right still yields "A2").
 */
export function meaningfulPriorities(profile: CefrProfile): string[] {
  return profile.developmentPriorities.filter((item) => {
    const [skill, dimension] = item.split('.');
    if (!dimension) return true;
    const evidence = profile.skills[skill as keyof CefrProfile['skills']]?.dimensions?.[dimension]?.evidence ?? '';
    const match = /^(\d+)\/(\d+) objective/.exec(evidence);
    return !match || Number(match[2]) === 0 || Number(match[1]) / Number(match[2]) < 0.75;
  });
}

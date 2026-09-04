export type QuestionType = 'multiple_choice' | 'multiple_response' | 'fill_blank' | 'short_answer' | 'true_false' | 'matching' | 'ordering' | 'listening' | 'writing' | 'speaking' | 'mediation';
export type QuestionOption = string;

type BaseQuestion = {
  id: string;
  prompt: string;
  options: QuestionOption[];
  answer: string;
  explanation?: string;
};

export type MultipleChoiceQuestion = BaseQuestion & { type: 'multiple_choice' };
export type MultipleResponseQuestion = BaseQuestion & { type: 'multiple_response' };
export type FillBlankQuestion = BaseQuestion & { type: 'fill_blank' };
export type ShortAnswerQuestion = BaseQuestion & { type: 'short_answer' };
export type TrueFalseQuestion = BaseQuestion & { type: 'true_false' };
export type MatchingQuestion = BaseQuestion & { type: 'matching' };
export type OrderingQuestion = BaseQuestion & { type: 'ordering' };
export type ListeningQuestion = BaseQuestion & { type: 'listening' };
export type WritingQuestion = BaseQuestion & { type: 'writing' };
export type SpeakingQuestion = BaseQuestion & { type: 'speaking' };
export type MediationQuestion = BaseQuestion & { type: 'mediation' };

export type QuestionDefinition =
  | MultipleChoiceQuestion
  | MultipleResponseQuestion
  | FillBlankQuestion
  | ShortAnswerQuestion
  | TrueFalseQuestion
  | MatchingQuestion
  | OrderingQuestion
  | ListeningQuestion
  | WritingQuestion
  | SpeakingQuestion
  | MediationQuestion;

export type ObjectiveQuestion = MultipleChoiceQuestion | MultipleResponseQuestion | FillBlankQuestion | ShortAnswerQuestion | TrueFalseQuestion | MatchingQuestion | OrderingQuestion;
export type QuestionResult = QuestionGradingResult;

export type QuestionResponse = {
  questionId: string;
  answer: string;
};

export type QuestionGradingResult = {
  questionId: string;
  correct: boolean;
  score: number;
  maxScore: number;
};

export type QuestionAttempt = {
  answers: Record<string, string>;
  score: number;
  total: number;
  percentage: number;
  submittedAt: string;
};

export type QuestionSetResult = {
  answers: Record<string, string>;
  score: number;
  total: number;
  percentage: number;
  attempts?: QuestionAttempt[];
};

export type QuestionSet = {
  questions: QuestionDefinition[];
};

export type QuestionValidationCode =
  | 'empty_prompt'
  | 'duplicate_option'
  | 'insufficient_options'
  | 'missing_answer'
  | 'answer_not_in_options'
  | 'invalid_ordering';

export type QuestionValidationIssue = {
  code: QuestionValidationCode;
  message: string;
};

export type QuestionValidationResult = {
  valid: boolean;
  errors: QuestionValidationIssue[];
};

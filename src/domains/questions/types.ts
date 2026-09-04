export type QuestionType = 'multiple_choice' | 'fill_blank' | 'true_false' | 'ordering' | 'listening' | 'writing' | 'speaking';
export type QuestionOption = string;

type BaseQuestion = {
  id: string;
  prompt: string;
  options: QuestionOption[];
  answer: string;
  explanation?: string;
};

export type MultipleChoiceQuestion = BaseQuestion & { type: 'multiple_choice' };
export type FillBlankQuestion = BaseQuestion & { type: 'fill_blank' };
export type TrueFalseQuestion = BaseQuestion & { type: 'true_false' };
export type OrderingQuestion = BaseQuestion & { type: 'ordering' };
export type ListeningQuestion = BaseQuestion & { type: 'listening' };
export type WritingQuestion = BaseQuestion & { type: 'writing' };
export type SpeakingQuestion = BaseQuestion & { type: 'speaking' };

export type QuestionDefinition =
  | MultipleChoiceQuestion
  | FillBlankQuestion
  | TrueFalseQuestion
  | OrderingQuestion
  | ListeningQuestion
  | WritingQuestion
  | SpeakingQuestion;

export type ObjectiveQuestion = MultipleChoiceQuestion | FillBlankQuestion | TrueFalseQuestion | OrderingQuestion;
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

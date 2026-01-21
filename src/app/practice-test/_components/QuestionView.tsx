import type { QuestionBankRow } from './types';

interface QuestionViewProps {
  question: QuestionBankRow;
  questionNumber: number;
  totalQuestions: number;
  questionsCompleted: number;
  selectedAnswer: string | null;
  submitting: boolean;
  isRetakeOfIncorrect: boolean;
  retakeQuestionCount: number;
  onAnswerSelect: (option: string) => void;
  onConfirmAnswer: () => void;
}

export function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  questionsCompleted,
  selectedAnswer,
  submitting,
  isRetakeOfIncorrect,
  retakeQuestionCount,
  onAnswerSelect,
  onConfirmAnswer,
}: QuestionViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <div className="frame bg-surface-workbench p-6 shadow-lg">
        {isRetakeOfIncorrect && (
          <div className="mb-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-400 font-medium text-center">
              📚 Retaking {retakeQuestionCount} question{retakeQuestionCount !== 1 ? 's' : ''} you got wrong on your last test
            </p>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-brand-green font-semibold">
              Question {questionNumber} of {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-surface-interactive rounded-full h-2">
            <div
              className="bg-brand-green h-2 rounded-full transition-all duration-300"
              style={{ width: `${(questionsCompleted / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-foreground mb-6">
          {question.question}
        </h2>

        <div className="space-y-3 mb-6">
          {Object.entries(question.options).map(([letter, text]) => {
            const isSelected = selectedAnswer === letter;
            
            const optionClasses = `w-full text-left p-4 rounded-lg border-2 transition-all ${
              isSelected
                ? 'border-brand-green bg-brand-green/10 text-foreground'
                : 'border-border-subtle bg-surface-interactive text-foreground hover:border-brand-green/50'
            }`;

            return (
              <button
                key={letter}
                onClick={() => onAnswerSelect(letter)}
                disabled={submitting}
                className={optionClasses}
              >
                <span className="font-semibold">{letter}.</span> {text}
              </button>
            );
          })}
        </div>

        <button
          onClick={onConfirmAnswer}
          disabled={!selectedAnswer || submitting}
          className={`w-full font-semibold py-3 px-6 rounded-lg transition-colors ${
            selectedAnswer && !submitting
              ? 'bg-brand-green hover:bg-brand-green/90 text-black'
              : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
          }`}
        >
          {submitting ? 'Saving...' : 'Submit Answer'}
        </button>
      </div>
    </div>
  );
}

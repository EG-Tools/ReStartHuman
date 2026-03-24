import { renderQuestionContent } from './questionScreen.sections'
import { QuestionLayout } from './questionScreen.shared'
import type { QuestionScreenProps } from './questionScreen.config'
import type { RetireCalcFormData } from '../../types/retireCalc'

export function QuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  formData,
  onBack,
  onNext,
  onSeekQuestion,
  onPatchFormData,
  headerAction,
}: QuestionScreenProps) {
  const update = <K extends keyof RetireCalcFormData>(
    key: K,
    value: RetireCalcFormData[K],
  ) => {
    onPatchFormData({ [key]: value } as Pick<RetireCalcFormData, K>)
  }

  return (
    <QuestionLayout
      question={question}
      questionIndex={questionIndex}
      totalQuestions={totalQuestions}
      onBack={onBack}
      onNext={onNext}
      onSeekQuestion={onSeekQuestion}
      headerAction={headerAction}
    >
      {renderQuestionContent({
        question,
        formData,
        update,
        onPatchFormData,
      })}
    </QuestionLayout>
  )
}

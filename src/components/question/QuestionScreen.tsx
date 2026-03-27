import { renderQuestionContent } from './questionScreen.sections'
import { QuestionLayout } from './questionScreen.shared'
import type { QuestionScreenProps } from './questionScreen.config'
import type { AlphaFormData } from '../../types/alpha'

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
  const update = <K extends keyof AlphaFormData>(
    key: K,
    value: AlphaFormData[K],
  ) => {
    onPatchFormData({ [key]: value } as Pick<AlphaFormData, K>)
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

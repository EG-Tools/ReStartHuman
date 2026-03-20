import { useMemo, useState } from 'react'
import { appRoutes } from '../app/routes'
import { questionFlow } from '../data/questionFlow'
import type { AppRoute } from '../app/routes'
import type { RetireCalcFormData } from '../types/retireCalc'

export const useRetireCalcFlow = (formData: RetireCalcFormData) => {
  const [route, setRoute] = useState<AppRoute>(appRoutes.start)
  const [questionIndex, setQuestionIndex] = useState(0)

  const visibleQuestions = useMemo(
    () => questionFlow.filter((question) => question.visibility(formData)),
    [formData],
  )

  const clampQuestionIndex = (index: number) =>
    Math.max(0, Math.min(index, Math.max(visibleQuestions.length - 1, 0)))

  const boundedQuestionIndex = clampQuestionIndex(questionIndex)
  const currentQuestion =
    visibleQuestions[boundedQuestionIndex] ?? visibleQuestions[0]

  return {
    route,
    visibleQuestions,
    questionIndex: boundedQuestionIndex,
    currentQuestion,
    openQuestions: () => setRoute(appRoutes.question),
    openResult: () => setRoute(appRoutes.result),
    returnToQuestions: () => setRoute(appRoutes.question),
    reset: () => {
      setRoute(appRoutes.start)
      setQuestionIndex(0)
    },
    nextQuestion: () => {
      if (boundedQuestionIndex >= visibleQuestions.length - 1) {
        setRoute(appRoutes.result)
        return
      }

      setQuestionIndex(boundedQuestionIndex + 1)
    },
    previousQuestion: () => {
      setQuestionIndex(Math.max(boundedQuestionIndex - 1, 0))
    },
    goToQuestion: (index: number) => {
      setRoute(appRoutes.question)
      setQuestionIndex(clampQuestionIndex(index))
    },
    syncFromHistory: (nextRoute: AppRoute, nextQuestionIndex: number) => {
      setRoute(nextRoute)
      setQuestionIndex(clampQuestionIndex(nextQuestionIndex))
    },
  }
}

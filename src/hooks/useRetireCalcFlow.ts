import { useCallback, useMemo, useState } from 'react'
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

  const clampQuestionIndex = useCallback(
    (index: number) => Math.max(0, Math.min(index, Math.max(visibleQuestions.length - 1, 0))),
    [visibleQuestions.length],
  )

  const boundedQuestionIndex = clampQuestionIndex(questionIndex)
  const currentQuestion = visibleQuestions[boundedQuestionIndex] ?? visibleQuestions[0] ?? questionFlow[0]

  const openQuestions = useCallback(() => setRoute(appRoutes.question), [])
  const openResult = useCallback(() => setRoute(appRoutes.result), [])
  const returnToQuestions = useCallback(() => setRoute(appRoutes.question), [])

  const reset = useCallback(() => {
    setRoute(appRoutes.start)
    setQuestionIndex(0)
  }, [])

  const nextQuestion = useCallback(() => {
    if (boundedQuestionIndex >= visibleQuestions.length - 1) {
      setRoute(appRoutes.result)
      return
    }

    setQuestionIndex(boundedQuestionIndex + 1)
  }, [boundedQuestionIndex, visibleQuestions.length])

  const previousQuestion = useCallback(() => {
    setQuestionIndex(Math.max(boundedQuestionIndex - 1, 0))
  }, [boundedQuestionIndex])

  const goToQuestion = useCallback(
    (index: number) => {
      setRoute(appRoutes.question)
      setQuestionIndex(clampQuestionIndex(index))
    },
    [clampQuestionIndex],
  )

  const syncFromHistory = useCallback(
    (nextRoute: AppRoute, nextQuestionIndex: number) => {
      setRoute(nextRoute)
      setQuestionIndex(clampQuestionIndex(nextQuestionIndex))
    },
    [clampQuestionIndex],
  )

  return useMemo(
    () => ({
      route,
      visibleQuestions,
      questionIndex: boundedQuestionIndex,
      currentQuestion,
      openQuestions,
      openResult,
      returnToQuestions,
      reset,
      nextQuestion,
      previousQuestion,
      goToQuestion,
      syncFromHistory,
    }),
    [
      boundedQuestionIndex,
      currentQuestion,
      goToQuestion,
      nextQuestion,
      openQuestions,
      openResult,
      previousQuestion,
      reset,
      returnToQuestions,
      route,
      syncFromHistory,
      visibleQuestions,
    ],
  )
}

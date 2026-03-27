import { useEffect, useEffectEvent, useMemo, useRef } from 'react'
import { appRoutes } from '../app/routes'
import type { AppRoute } from '../app/routes'

export type SaveSlotMode = 'load' | 'save' | 'manage'

interface AppHistoryState {
  __alphaNav: true
  route: AppRoute
  questionIndex: number
  saveSlotMode: SaveSlotMode | null
}

interface UseAppHistoryNavigationParams {
  route: AppRoute
  questionIndex: number
  saveSlotMode: SaveSlotMode | null
  onRestoreHistoryState: (state: {
    route: AppRoute
    questionIndex: number
    saveSlotMode: SaveSlotMode | null
  }) => void
}

const buildHistoryState = (
  route: AppRoute,
  questionIndex: number,
  saveSlotMode: SaveSlotMode | null,
): AppHistoryState => ({
  __alphaNav: true,
  route,
  questionIndex,
  saveSlotMode,
})

const defaultHistoryState = buildHistoryState(appRoutes.start, 0, null)

const isAppHistoryState = (value: unknown): value is AppHistoryState => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<AppHistoryState>

  return (
    candidate.__alphaNav === true &&
    typeof candidate.questionIndex === 'number' &&
    (candidate.route === appRoutes.start ||
      candidate.route === appRoutes.question ||
      candidate.route === appRoutes.result) &&
    (candidate.saveSlotMode === null ||
      candidate.saveSlotMode === 'load' ||
      candidate.saveSlotMode === 'save' ||
      candidate.saveSlotMode === 'manage')
  )
}

export function useAppHistoryNavigation({
  route,
  questionIndex,
  saveSlotMode,
  onRestoreHistoryState,
}: UseAppHistoryNavigationParams) {
  const historyReadyRef = useRef(false)
  const isRestoringHistoryRef = useRef(false)

  const navigationState = useMemo(
    () => buildHistoryState(route, questionIndex, saveSlotMode),
    [questionIndex, route, saveSlotMode],
  )

  const restoreFromHistory = useEffectEvent((state: AppHistoryState) => {
    isRestoringHistoryRef.current = true
    onRestoreHistoryState(state)
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.history.replaceState(defaultHistoryState, '', window.location.href)
    historyReadyRef.current = true

    const handlePopState = (event: PopStateEvent) => {
      if (isAppHistoryState(event.state)) {
        restoreFromHistory(event.state)
        return
      }

      restoreFromHistory(defaultHistoryState)
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !historyReadyRef.current) {
      return
    }

    if (isRestoringHistoryRef.current) {
      isRestoringHistoryRef.current = false
      return
    }

    if (
      isAppHistoryState(window.history.state) &&
      window.history.state.route === navigationState.route &&
      window.history.state.questionIndex === navigationState.questionIndex &&
      window.history.state.saveSlotMode === navigationState.saveSlotMode
    ) {
      return
    }

    window.history.pushState(navigationState, '', window.location.href)
  }, [navigationState])
}

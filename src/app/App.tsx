import { startTransition, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import { AppOptionsButton, AppOptionsModal } from '../components/common/AppOptions'
import { QuestionScreen } from '../components/question/QuestionScreen'
import { ResultScreen } from '../components/result/ResultScreen'
import { SaveSlotModal } from '../components/result/SaveSlotModal'
import { StartScreen } from '../components/start/StartScreen'
import { defaultFormData } from '../data/defaultFormData'
import { calculateRetireScenario } from '../engine/calculator'
import { useRetireCalcFlow } from '../hooks/useRetireCalcFlow'
import { useSaveSlots } from '../hooks/useSaveSlots'
import { appRoutes } from './routes'
import type { AppRoute } from './routes'
import type { RetireCalcFormData, SaveSlotRecord } from '../types/retireCalc'

type SaveSlotMode = 'load' | 'save' | 'manage'

interface AppHistoryState {
  __retireCalcNav: true
  route: AppRoute
  questionIndex: number
  saveSlotMode: SaveSlotMode | null
}

const buildHistoryState = (
  route: AppRoute,
  questionIndex: number,
  saveSlotMode: SaveSlotMode | null,
): AppHistoryState => ({
  __retireCalcNav: true,
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
    candidate.__retireCalcNav === true &&
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

export default function App() {
  const [formData, setFormData] = useState<RetireCalcFormData>(defaultFormData)
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)

  const result = useMemo(() => calculateRetireScenario(formData), [formData])
  const flow = useRetireCalcFlow(formData)
  const saveSlots = useSaveSlots()
  const historyReadyRef = useRef(false)
  const isRestoringHistoryRef = useRef(false)

  const navigationState = useMemo(
    () => buildHistoryState(flow.route, flow.questionIndex, saveSlotMode),
    [flow.questionIndex, flow.route, saveSlotMode],
  )

  const restoreFromHistory = useEffectEvent((state: AppHistoryState) => {
    isRestoringHistoryRef.current = true
    flow.syncFromHistory(state.route, state.questionIndex)
    setSaveSlotMode(state.saveSlotMode)
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
  }, [restoreFromHistory])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const root = document.documentElement
    const timerIds = new Set<number>()

    const syncViewportSize = () => {
      const viewportWidth = Math.round(
        document.documentElement.clientWidth || window.innerWidth,
      )
      const viewportHeight = Math.round(
        window.innerHeight || document.documentElement.clientHeight,
      )

      root.style.setProperty('--app-height', `${viewportHeight}px`)
      root.style.setProperty('--app-width', `${viewportWidth}px`)
    }

    const queueViewportSync = () => {
      syncViewportSize()
      window.requestAnimationFrame(syncViewportSize)

      ;[120, 280, 520, 900].forEach((delay) => {
        const timerId = window.setTimeout(() => {
          syncViewportSize()
          timerIds.delete(timerId)
        }, delay)

        timerIds.add(timerId)
      })
    }

    queueViewportSync()

    window.addEventListener('resize', queueViewportSync)
    window.addEventListener('orientationchange', queueViewportSync)
    window.addEventListener('pageshow', queueViewportSync)
    window.visualViewport?.addEventListener('resize', queueViewportSync)
    window.visualViewport?.addEventListener('scroll', queueViewportSync)

    return () => {
      timerIds.forEach((timerId) => {
        window.clearTimeout(timerId)
      })
      window.removeEventListener('resize', queueViewportSync)
      window.removeEventListener('orientationchange', queueViewportSync)
      window.removeEventListener('pageshow', queueViewportSync)
      window.visualViewport?.removeEventListener('resize', queueViewportSync)
      window.visualViewport?.removeEventListener('scroll', queueViewportSync)
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

  const patchFormData = (patch: Partial<RetireCalcFormData>) => {
    startTransition(() => {
      setFormData((currentValue) => ({
        ...currentValue,
        ...patch,
      }))
    })
  }

  const startFresh = () => {
    startTransition(() => {
      setFormData(defaultFormData)
      flow.goToQuestion(0)
    })
  }

  const handleLoadSlot = (slot: SaveSlotRecord) => {
    startTransition(() => {
      setFormData({ ...defaultFormData, ...slot.formData })
      setSaveSlotMode(null)
      flow.openResult()
    })
  }

  const handleSaveSlot = (slotId: number) => {
    saveSlots.saveSlot(slotId, formData, result)
    setSaveSlotMode(null)
  }

  const handleDeleteSlot = (slotId: number) => {
    saveSlots.deleteSlot(slotId)
  }

  const startOver = () => {
    startTransition(() => {
      setFormData(defaultFormData)
      setSaveSlotMode(null)
      flow.reset()
    })
  }

  const renderOptionsButton = () => <AppOptionsButton onClick={() => setIsOptionsOpen(true)} />

  return (
    <div className="app-shell">
      <div className="aurora aurora-left" aria-hidden="true" />
      <div className="aurora aurora-right" aria-hidden="true" />
      <div className="phone-stage">
        <div className="device-frame">
          {flow.route === appRoutes.start ? (
            <StartScreen
              onStart={startFresh}
              onOpenLoadSlots={() => setSaveSlotMode('load')}
              headerAction={renderOptionsButton()}
            />
          ) : null}

          {flow.route === appRoutes.question && flow.currentQuestion ? (
            <QuestionScreen
              question={flow.currentQuestion}
              questionIndex={flow.questionIndex}
              totalQuestions={flow.visibleQuestions.length}
              formData={formData}
              onBack={flow.previousQuestion}
              onNext={flow.nextQuestion}
              onSeekQuestion={flow.goToQuestion}
              onPatchFormData={patchFormData}
              headerAction={renderOptionsButton()}
            />
          ) : null}

          {flow.route === appRoutes.result ? (
            <ResultScreen
              formData={formData}
              result={result}
              onEditAnswers={() => flow.goToQuestion(0)}
              onStartOver={startOver}
              onOpenSaveSlots={() => setSaveSlotMode('manage')}
              onPatchFormData={patchFormData}
              headerAction={renderOptionsButton()}
            />
          ) : null}
        </div>
      </div>

      {saveSlotMode ? (
        <SaveSlotModal
          mode={saveSlotMode}
          slotCount={saveSlots.slotCount}
          slotsById={saveSlots.slotsById}
          onClose={() => setSaveSlotMode(null)}
          onLoad={handleLoadSlot}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
        />
      ) : null}

      {isOptionsOpen ? <AppOptionsModal onClose={() => setIsOptionsOpen(false)} /> : null}
    </div>
  )
}
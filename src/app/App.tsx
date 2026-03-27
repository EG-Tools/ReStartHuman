import { Suspense, lazy, startTransition, useCallback, useDeferredValue, useMemo, useState } from 'react'
import { AppOptionsButton, AppOptionsModal } from '../components/common/AppOptions'
import { StartScreen } from '../components/start/StartScreen'
import { defaultFormData } from '../data/defaultFormData'
import { calculateAlphaScenario } from '../engine/calculator'
import { useAlphaFlow } from '../hooks/useAlphaFlow'
import { useAppHistoryNavigation, type SaveSlotMode } from '../hooks/useAppHistoryNavigation'
import { useViewportCssVars } from '../hooks/useViewportCssVars'
import { useSaveSlots } from '../hooks/useSaveSlots'
import { appRoutes } from './routes'
import type { AlphaFormData, SaveSlotRecord } from '../types/alpha'

const QuestionScreen = lazy(async () => {
  const module = await import('../components/question/QuestionScreen')
  return { default: module.QuestionScreen }
})

const ResultAdScreen = lazy(async () => {
  const module = await import('../components/ad/ResultAdScreen')
  return { default: module.ResultAdScreen }
})

const ResultScreen = lazy(async () => {
  const module = await import('../components/result/ResultScreen')
  return { default: module.ResultScreen }
})

const SaveSlotModal = lazy(async () => {
  const module = await import('../components/result/SaveSlotModal')
  return { default: module.SaveSlotModal }
})

const createCalculatorInput = (formData: AlphaFormData): AlphaFormData => ({
  ...defaultFormData,
  ...formData,
})

const hasPatchChanges = (
  currentValue: AlphaFormData,
  patch: Partial<AlphaFormData>,
) => Object.entries(patch).some(([key, value]) => currentValue[key as keyof AlphaFormData] !== value)

export default function App() {
  const [formData, setFormData] = useState<AlphaFormData>(defaultFormData)
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)

  const flow = useAlphaFlow(formData)
  const saveSlots = useSaveSlots()
  const calculationInput = useMemo(() => createCalculatorInput(formData), [formData])
  const deferredCalculationInput = useDeferredValue(calculationInput)
  const shouldRenderResult =
    flow.route === appRoutes.result || saveSlotMode === 'manage' || saveSlotMode === 'save'
  const result = useMemo(
    () => (shouldRenderResult ? calculateAlphaScenario(deferredCalculationInput) : null),
    [deferredCalculationInput, shouldRenderResult],
  )
  const optionsButton = useMemo(
    () => <AppOptionsButton onClick={() => setIsOptionsOpen(true)} />,
    [],
  )

  useViewportCssVars()

  useAppHistoryNavigation({
    route: flow.route,
    questionIndex: flow.questionIndex,
    saveSlotMode,
    onRestoreHistoryState: (state) => {
      flow.syncFromHistory(state.route, state.questionIndex)
      setSaveSlotMode(state.saveSlotMode)
    },
  })

  const patchFormData = useCallback((patch: Partial<AlphaFormData>) => {
    startTransition(() => {
      setFormData((currentValue) => {
        if (!hasPatchChanges(currentValue, patch)) {
          return currentValue
        }

        return {
          ...currentValue,
          ...patch,
        }
      })
    })
  }, [])

  const startFresh = useCallback(() => {
    startTransition(() => {
      setFormData(defaultFormData)
      flow.goToQuestion(0)
    })
  }, [flow])

  const handleLoadSlot = useCallback(
    (slot: SaveSlotRecord) => {
      startTransition(() => {
        setFormData({ ...defaultFormData, ...slot.formData })
        setSaveSlotMode(null)
        flow.openAd()
      })
    },
    [flow],
  )

  const handleSaveSlot = useCallback(
    (slotId: number, slotName: string) => {
      saveSlots.saveSlot(
        slotId,
        formData,
        result ?? calculateAlphaScenario(calculationInput),
        slotName,
      )
    },
    [calculationInput, formData, result, saveSlots],
  )

  const handleDeleteSlot = useCallback(
    (slotId: number) => {
      saveSlots.deleteSlot(slotId)
    },
    [saveSlots],
  )

  const startOver = useCallback(() => {
    startTransition(() => {
      setFormData(defaultFormData)
      setSaveSlotMode(null)
      flow.reset()
    })
  }, [flow])

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
              headerAction={optionsButton}
            />
          ) : null}

          {flow.route === appRoutes.question && flow.currentQuestion ? (
            <Suspense fallback={<section className="screen question-screen" />}>
              <QuestionScreen
                question={flow.currentQuestion}
                questionIndex={flow.questionIndex}
                totalQuestions={flow.visibleQuestions.length}
                formData={formData}
                onBack={flow.previousQuestion}
                onNext={flow.nextQuestion}
                onSeekQuestion={flow.goToQuestion}
                onPatchFormData={patchFormData}
                headerAction={optionsButton}
              />
            </Suspense>
          ) : null}

          {flow.route === appRoutes.ad ? (
            <Suspense fallback={<section className="screen ad-screen" />}>
              <ResultAdScreen
                onContinue={flow.openResult}
                onEditAnswers={() => flow.goToQuestion(0)}
                headerAction={optionsButton}
              />
            </Suspense>
          ) : null}

          {flow.route === appRoutes.result && result ? (
            <Suspense fallback={<section className="screen result-screen" />}>
              <ResultScreen
                formData={formData}
                result={result}
                onEditAnswers={() => flow.goToQuestion(0)}
                onStartOver={startOver}
                onOpenSaveSlots={() => setSaveSlotMode('save')}
                onPatchFormData={patchFormData}
                headerAction={optionsButton}
              />
            </Suspense>
          ) : null}
        </div>
      </div>

      {saveSlotMode ? (
        <Suspense fallback={null}>
          <SaveSlotModal
            mode={saveSlotMode}
            slotCount={saveSlots.slotCount}
            slotsById={saveSlots.slotsById}
            canSave={flow.route === appRoutes.result && result !== null}
            onClose={() => setSaveSlotMode(null)}
            onModeChange={(nextMode: 'load' | 'save') => setSaveSlotMode(nextMode)}
            onLoad={handleLoadSlot}
            onSave={handleSaveSlot}
            onDelete={handleDeleteSlot}
          />
        </Suspense>
      ) : null}

      {isOptionsOpen ? <AppOptionsModal onClose={() => setIsOptionsOpen(false)} /> : null}
    </div>
  )
}

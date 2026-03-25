import { Suspense, lazy, startTransition, useDeferredValue, useMemo, useState } from 'react'
import { AppOptionsButton, AppOptionsModal } from '../components/common/AppOptions'
import { StartScreen } from '../components/start/StartScreen'
import { defaultFormData } from '../data/defaultFormData'
import { calculateRetireScenario } from '../engine/calculator'
import { useRetireCalcFlow } from '../hooks/useRetireCalcFlow'
import { useAppHistoryNavigation, type SaveSlotMode } from '../hooks/useAppHistoryNavigation'
import { useViewportCssVars } from '../hooks/useViewportCssVars'
import { useSaveSlots } from '../hooks/useSaveSlots'
import { appRoutes } from './routes'
import type { RetireCalcFormData, SaveSlotRecord } from '../types/retireCalc'

const QuestionScreen = lazy(async () => {
  const module = await import('../components/question/QuestionScreen')
  return { default: module.QuestionScreen }
})

const ResultScreen = lazy(async () => {
  const module = await import('../components/result/ResultScreen')
  return { default: module.ResultScreen }
})

const SaveSlotModal = lazy(async () => {
  const module = await import('../components/result/SaveSlotModal')
  return { default: module.SaveSlotModal }
})

export default function App() {
  const [formData, setFormData] = useState<RetireCalcFormData>(defaultFormData)
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)

  const flow = useRetireCalcFlow(formData)
  const saveSlots = useSaveSlots()
  const deferredFormData = useDeferredValue(formData)
  const shouldRenderResult =
    flow.route === appRoutes.result || saveSlotMode === 'manage' || saveSlotMode === 'save'
  const result = useMemo(
    () => (shouldRenderResult ? calculateRetireScenario(deferredFormData) : null),
    [deferredFormData, shouldRenderResult],
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

  const handleSaveSlot = (slotId: number, slotName: string) => {
    saveSlots.saveSlot(slotId, formData, result ?? calculateRetireScenario(formData), slotName)
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
                headerAction={renderOptionsButton()}
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
                headerAction={renderOptionsButton()}
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

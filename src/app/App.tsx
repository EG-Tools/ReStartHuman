import {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AppOptionsButton, AppOptionsModal } from '../components/common/AppOptions'
import { policyConfig } from '../config/policyConfig'
import { StartScreen } from '../components/start/StartScreen'
import { defaultFormData } from '../data/defaultFormData'
import { calculateAlphaScenario } from '../engine/calculator'
import { useAdSupport } from '../hooks/useAdSupport'
import { useAlphaFlow } from '../hooks/useAlphaFlow'
import { useAppHistoryNavigation, type SaveSlotMode } from '../hooks/useAppHistoryNavigation'
import { useSaveSlots } from '../hooks/useSaveSlots'
import { useViewportCssVars } from '../hooks/useViewportCssVars'
import type { AlphaFormData, AlphaResult, SaveSlotRecord } from '../types/alpha'
import { appRoutes } from './routes'

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
) =>
  Object.entries(patch).some(
    ([key, value]) => currentValue[key as keyof AlphaFormData] !== value,
  )

export default function App() {
  const [formData, setFormData] = useState<AlphaFormData>(defaultFormData)
  const [loadedSlotResult, setLoadedSlotResult] = useState<AlphaResult | null>(null)
  const [needsLoadedSlotRefresh, setNeedsLoadedSlotRefresh] = useState(false)
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)

  const adSupport = useAdSupport()
  const flow = useAlphaFlow(formData, adSupport.isAdFreeEnabled)
  const saveSlots = useSaveSlots()
  const calculationInput = useMemo(() => createCalculatorInput(formData), [formData])
  const shouldRenderResult =
    flow.route === appRoutes.result || saveSlotMode === 'manage' || saveSlotMode === 'save'
  const liveResult = useMemo(
    () =>
      shouldRenderResult && loadedSlotResult === null
        ? calculateAlphaScenario(calculationInput)
        : null,
    [calculationInput, loadedSlotResult, shouldRenderResult],
  )
  const result = loadedSlotResult ?? liveResult
  const optionsButton = useMemo(
    () => <AppOptionsButton onClick={() => setIsOptionsOpen(true)} />,
    [],
  )

  const flowRoute = flow.route
  const openResult = flow.openResult

  useViewportCssVars()

  useEffect(() => {
    void import('../components/result/ResultScreen')
    void import('../components/ad/ResultAdScreen')
  }, [])

  useAppHistoryNavigation({
    route: flowRoute,
    questionIndex: flow.questionIndex,
    saveSlotMode,
    onRestoreHistoryState: (state) => {
      flow.syncFromHistory(state.route, state.questionIndex)
      setSaveSlotMode(state.saveSlotMode)
    },
  })

  useEffect(() => {
    if (!adSupport.isAdFreeEnabled || flowRoute !== appRoutes.ad) {
      return
    }

    openResult()
  }, [adSupport.isAdFreeEnabled, flowRoute, openResult])

  useEffect(() => {
    if (!needsLoadedSlotRefresh) {
      return
    }

    const refreshTimer = window.setTimeout(() => {
      const refreshedResult = calculateAlphaScenario(calculationInput)

      startTransition(() => {
        setLoadedSlotResult(refreshedResult)
        setNeedsLoadedSlotRefresh(false)
      })
    }, 0)

    return () => {
      window.clearTimeout(refreshTimer)
    }
  }, [calculationInput, needsLoadedSlotRefresh])

  const patchFormData = useCallback((patch: Partial<AlphaFormData>) => {
    setLoadedSlotResult(null)
    setNeedsLoadedSlotRefresh(false)
    setFormData((currentValue) => {
      if (!hasPatchChanges(currentValue, patch)) {
        return currentValue
      }

      return {
        ...currentValue,
        ...patch,
      }
    })
  }, [])

  const startFresh = useCallback(() => {
    startTransition(() => {
      setLoadedSlotResult(null)
      setNeedsLoadedSlotRefresh(false)
      setFormData(defaultFormData)
      flow.goToQuestion(0)
    })
  }, [flow])

  const handleLoadSlot = useCallback(
    (slot: SaveSlotRecord) => {
      const nextFormData = { ...defaultFormData, ...slot.formData }
      const canReuseStoredResult =
        slot.result.policyBaseDate === policyConfig.policyBaseDate

      setLoadedSlotResult(canReuseStoredResult ? slot.result : null)
      setNeedsLoadedSlotRefresh(true)
      setFormData(nextFormData)
      setSaveSlotMode(null)
      flow.openAd()
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
      setLoadedSlotResult(null)
      setNeedsLoadedSlotRefresh(false)
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

          {flow.route === appRoutes.ad && !adSupport.isAdFreeEnabled ? (
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

      {isOptionsOpen ? (
        <AppOptionsModal
          onClose={() => setIsOptionsOpen(false)}
          isAdFreeEnabled={adSupport.isAdFreeEnabled}
          canEnableAdFree={adSupport.canEnableAdFree}
          onEnableAdFree={adSupport.enableAdFree}
        />
      ) : null}
    </div>
  )
}



import { Suspense, lazy, startTransition, useCallback, useDeferredValue, useMemo, useState } from 'react'
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

const createCalculatorInput = (formData: RetireCalcFormData): RetireCalcFormData => ({
  ...defaultFormData,
  householdType: formData.householdType,
  simulationYears: formData.simulationYears,
  housingType: formData.housingType,
  homeMarketValue: formData.homeMarketValue,
  homeOfficialValue: formData.homeOfficialValue,
  isJointOwnership: formData.isJointOwnership,
  isSingleHomeOwner: formData.isSingleHomeOwner,
  jeonseDeposit: formData.jeonseDeposit,
  monthlyRentDeposit: formData.monthlyRentDeposit,
  monthlyRentAmount: formData.monthlyRentAmount,
  landValue: formData.landValue,
  landOwnershipType: formData.landOwnershipType,
  myLandShare: formData.myLandShare,
  spouseLandShare: formData.spouseLandShare,
  otherPropertyOfficialValue: formData.otherPropertyOfficialValue,
  otherPropertyOwnershipType: formData.otherPropertyOwnershipType,
  myOtherPropertyShare: formData.myOtherPropertyShare,
  spouseOtherPropertyShare: formData.spouseOtherPropertyShare,
  taxableAccountAssets: formData.taxableAccountAssets,
  isaAssets: formData.isaAssets,
  pensionAccountAssets: formData.pensionAccountAssets,
  otherAssets: formData.otherAssets,
  taxableAccountDividendAnnual: formData.taxableAccountDividendAnnual,
  isaDividendAnnual: formData.isaDividendAnnual,
  pensionDividendAnnual: formData.pensionDividendAnnual,
  dividendInputMode: formData.dividendInputMode,
  isaType: formData.isaType,
  isaYearsSinceOpen: formData.isaYearsSinceOpen,
  myIsaType: formData.myIsaType,
  spouseIsaType: formData.spouseIsaType,
  dividendOwnershipType: formData.dividendOwnershipType,
  myAnnualDividendAttributed: formData.myAnnualDividendAttributed,
  spouseAnnualDividendAttributed: formData.spouseAnnualDividendAttributed,
  isaOwnershipType: formData.isaOwnershipType,
  myAnnualIsaDividendAttributed: formData.myAnnualIsaDividendAttributed,
  spouseAnnualIsaDividendAttributed: formData.spouseAnnualIsaDividendAttributed,
  otherIncomeType: formData.otherIncomeType,
  otherIncomeMonthly: formData.otherIncomeMonthly,
  pensionStartAge: formData.pensionStartAge,
  pensionMonthlyAmount: formData.pensionMonthlyAmount,
  healthInsuranceType: formData.healthInsuranceType,
  salaryMonthly: formData.salaryMonthly,
  healthInsuranceOverrideMonthly: formData.healthInsuranceOverrideMonthly,
  insuranceMonthly: formData.insuranceMonthly,
  maintenanceMonthly: formData.maintenanceMonthly,
  telecomMonthly: formData.telecomMonthly,
  nationalPensionMonthly: formData.nationalPensionMonthly,
  currentCarMarketValue: formData.currentCarMarketValue,
  carYearlyCost: formData.carYearlyCost,
  loanInterestMonthly: formData.loanInterestMonthly,
  loanInterestYears: formData.loanInterestYears,
  otherFixedMonthly: formData.otherFixedMonthly,
  livingCostInputMode: formData.livingCostInputMode,
  livingCostMonthlyTotal: formData.livingCostMonthlyTotal,
  foodMonthly: formData.foodMonthly,
  necessitiesMonthly: formData.necessitiesMonthly,
  diningOutMonthly: formData.diningOutMonthly,
  hobbyMonthly: formData.hobbyMonthly,
  academyMonthly: formData.academyMonthly,
  otherLivingMonthly: formData.otherLivingMonthly,
  inflationEnabled: formData.inflationEnabled,
  inflationRateAnnual: formData.inflationRateAnnual,
  startingCashReserve: formData.startingCashReserve,
  currentAge: formData.currentAge,
})

const hasPatchChanges = (
  currentValue: RetireCalcFormData,
  patch: Partial<RetireCalcFormData>,
) => Object.entries(patch).some(([key, value]) => currentValue[key as keyof RetireCalcFormData] !== value)

export default function App() {
  const [formData, setFormData] = useState<RetireCalcFormData>(defaultFormData)
  const [saveSlotMode, setSaveSlotMode] = useState<SaveSlotMode | null>(null)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)

  const flow = useRetireCalcFlow(formData)
  const saveSlots = useSaveSlots()
  const calculationInput = useMemo(
    () => createCalculatorInput(formData),
    [
      formData.householdType,
      formData.simulationYears,
      formData.housingType,
      formData.homeMarketValue,
      formData.homeOfficialValue,
      formData.isJointOwnership,
      formData.isSingleHomeOwner,
      formData.jeonseDeposit,
      formData.monthlyRentDeposit,
      formData.monthlyRentAmount,
      formData.landValue,
      formData.landOwnershipType,
      formData.myLandShare,
      formData.spouseLandShare,
      formData.otherPropertyOfficialValue,
      formData.otherPropertyOwnershipType,
      formData.myOtherPropertyShare,
      formData.spouseOtherPropertyShare,
      formData.taxableAccountAssets,
      formData.isaAssets,
      formData.pensionAccountAssets,
      formData.otherAssets,
      formData.taxableAccountDividendAnnual,
      formData.isaDividendAnnual,
      formData.pensionDividendAnnual,
      formData.dividendInputMode,
      formData.isaType,
      formData.isaYearsSinceOpen,
      formData.myIsaType,
      formData.spouseIsaType,
      formData.dividendOwnershipType,
      formData.myAnnualDividendAttributed,
      formData.spouseAnnualDividendAttributed,
      formData.isaOwnershipType,
      formData.myAnnualIsaDividendAttributed,
      formData.spouseAnnualIsaDividendAttributed,
      formData.otherIncomeType,
      formData.otherIncomeMonthly,
      formData.pensionStartAge,
      formData.pensionMonthlyAmount,
      formData.healthInsuranceType,
      formData.salaryMonthly,
      formData.healthInsuranceOverrideMonthly,
      formData.insuranceMonthly,
      formData.maintenanceMonthly,
      formData.telecomMonthly,
      formData.nationalPensionMonthly,
      formData.currentCarMarketValue,
      formData.carYearlyCost,
      formData.loanInterestMonthly,
      formData.loanInterestYears,
      formData.otherFixedMonthly,
      formData.livingCostInputMode,
      formData.livingCostMonthlyTotal,
      formData.foodMonthly,
      formData.necessitiesMonthly,
      formData.diningOutMonthly,
      formData.hobbyMonthly,
      formData.academyMonthly,
      formData.otherLivingMonthly,
      formData.inflationEnabled,
      formData.inflationRateAnnual,
      formData.startingCashReserve,
      formData.currentAge,
    ],
  )
  const deferredCalculationInput = useDeferredValue(calculationInput)
  const shouldRenderResult =
    flow.route === appRoutes.result || saveSlotMode === 'manage' || saveSlotMode === 'save'
  const result = useMemo(
    () => (shouldRenderResult ? calculateRetireScenario(deferredCalculationInput) : null),
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

  const patchFormData = useCallback((patch: Partial<RetireCalcFormData>) => {
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
        flow.openResult()
      })
    },
    [flow],
  )

  const handleSaveSlot = useCallback(
    (slotId: number, slotName: string) => {
      saveSlots.saveSlot(
        slotId,
        formData,
        result ?? calculateRetireScenario(calculationInput),
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

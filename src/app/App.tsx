import { startTransition, useMemo, useState } from 'react'
import { StartScreen } from '../components/start/StartScreen'
import { QuestionScreen } from '../components/question/QuestionScreen'
import { ResultScreen } from '../components/result/ResultScreen'
import { SaveSlotModal } from '../components/result/SaveSlotModal'
import { defaultFormData } from '../data/defaultFormData'
import { calculateRetireScenario } from '../engine/calculator'
import { useRetireCalcFlow } from '../hooks/useRetireCalcFlow'
import { useSaveSlots } from '../hooks/useSaveSlots'
import { appRoutes } from './routes'
import type { RetireCalcFormData, SaveSlotRecord } from '../types/retireCalc'

export default function App() {
  const [formData, setFormData] = useState<RetireCalcFormData>(defaultFormData)
  const [saveSlotMode, setSaveSlotMode] = useState<'load' | 'save' | 'manage' | null>(null)

  const result = useMemo(() => calculateRetireScenario(formData), [formData])
  const flow = useRetireCalcFlow(formData)
  const saveSlots = useSaveSlots()

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
              savedCount={saveSlots.slots.length}
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
              onPatchFormData={patchFormData}
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
    </div>
  )
}

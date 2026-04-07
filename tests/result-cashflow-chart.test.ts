import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { defaultFormData } from '../src/data/defaultFormData'
import { calculateAlphaScenario } from '../src/engine/calculator'
import { CashFlowChart } from '../src/components/result/resultScreen.sections'

test('cashflow chart shows the start and end age labels only once after long projections', () => {
  const formData = {
    ...defaultFormData,
    currentAge: 50,
    simulationYears: 50,
  }
  const result = calculateAlphaScenario(formData)

  const markup = renderToStaticMarkup(
    createElement(CashFlowChart, {
      currentAge: formData.currentAge,
      formData,
      inflationEnabled: formData.inflationEnabled,
      inflationRateAnnual: formData.inflationRateAnnual,
      projectionYears: formData.simulationYears,
      result,
    }),
  )

  const startMatches = markup.match(/50세/g) ?? []
  const endMatches = markup.match(/100세/g) ?? []

  assert.equal(startMatches.length, 1)
  assert.equal(endMatches.length, 1)
})
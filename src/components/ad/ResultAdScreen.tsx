import type { ReactNode } from 'react'
import { PrimaryButton } from '../common/Ui'

const sponsorHighlights = [
  '\uAD6D\uBBFC\uC5F0\uAE08',
  '\uAC74\uAC15\uBCF4\uD5D8\uB8CC',
  '\uBCF4\uC720\uC138',
  '\uC0DD\uD65C\uBE44 \uC810\uAC80',
] as const

interface ResultAdScreenProps {
  onContinue: () => void
  onEditAnswers: () => void
  headerAction?: ReactNode
}

export function ResultAdScreen({ onContinue, onEditAnswers, headerAction }: ResultAdScreenProps) {
  return (
    <section className="screen ad-screen">
      <div className="screen-header ad-screen-header">
        <div>
          <p className="eyebrow">{'\uAD11\uACE0'}</p>
          <h1 className="screen-title">{'\uACB0\uACFC \uBCF4\uAE30 \uC804 \uC81C\uD734 \uC548\uB0B4'}</h1>
        </div>
        {headerAction ? <div className="result-screen-header-action">{headerAction}</div> : null}
      </div>

      <div className="ad-screen-layout">
        <article className="ad-interstitial-card">
          <div className="ad-interstitial-topline">
            <span className="ad-sponsored-pill">SPONSORED</span>
            <span className="ad-interstitial-note">
              {'\uACB0\uACFC \uD654\uBA74 \uC804\uC5D0 \uB178\uCD9C\uB418\uB294 \uAD11\uACE0 \uC790\uB9AC\uC785\uB2C8\uB2E4'}
            </span>
          </div>

          <div className="ad-slot-visual" aria-hidden="true">
            <span>AD SLOT</span>
            <strong>{'\uC138\uBB34 \u00B7 \uC5F0\uAE08 \u00B7 \uBD80\uB3D9\uC0B0'}</strong>
            <p>{'\uC81C\uD734 \uBC30\uB108 \uB610\uB294 \uB124\uC774\uD2F0\uBE0C \uAD11\uACE0 \uC601\uC5ED'}</p>
          </div>

          <div className="ad-copy-block">
            <h2>{'\uD070 \uC758\uC0AC\uACB0\uC815 \uC804\uC5D0\uB294 \uD55C \uBC88 \uB354 \uC810\uAC80\uD558\uC138\uC694'}</h2>
            <p>
              {
                '\uC774 \uACC4\uC0B0\uAE30\uB294 \uBE60\uB978 \uCD94\uC815\uC6A9\uC785\uB2C8\uB2E4. \uAC74\uAC15\uBCF4\uD5D8\uB8CC, \uAD6D\uBBFC\uC5F0\uAE08 \uC218\uB839 \uC2DC\uC810, \uAE08\uC735\uC18C\uB4DD 2\uCC9C\uB9CC\uC6D0 \uCD08\uACFC, \uBCF4\uC720\uC138\uB294 \uC2E4\uC81C \uC870\uAC74\uC5D0 \uB530\uB77C \uB2EC\uB77C\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
              }
            </p>
          </div>

          <div className="chip-row ad-chip-row">
            {sponsorHighlights.map((highlight) => (
              <span key={highlight} className="chip ad-chip">
                {highlight}
              </span>
            ))}
          </div>

          <div className="ad-mini-grid">
            <section className="notice-card ad-mini-card">
              <h2>{'\uAD11\uACE0/\uC81C\uD734 \uC790\uB9AC'}</h2>
              <p>
                {
                  '\uC774 \uC601\uC5ED\uC740 \uCD94\uD6C4 \uC2E4\uC81C \uAD11\uACE0 SDK \uB610\uB294 \uC678\uBD80 \uBC30\uB108 \uCEF4\uD3EC\uB10C\uD2B8\uB85C \uAD50\uCCB4\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4.'
                }
              </p>
            </section>
            <section className="notice-card ad-mini-card ad-mini-card-accent">
              <h2>{'\uAD11\uACE0 \uC5C6\uB294 \uBC84\uC804'}</h2>
              <p>
                {
                  '\uD6C4\uC6D0 \uAE30\uB2A5\uC774 \uC5F0\uACB0\uB418\uBA74 \uACB0\uACFC \uC804 \uAD11\uACE0\uB97C \uAC74\uB108\uB6F0\uB294 \uD750\uB984\uB3C4 \uBD99\uC77C \uC218 \uC788\uAC8C \uC5F4\uC5B4\uB463\uC2B5\uB2C8\uB2E4.'
                }
              </p>
            </section>
          </div>
        </article>

        <div className="start-actions ad-screen-actions">
          <PrimaryButton onClick={onContinue}>{'\uACB0\uACFC \uBCF4\uAE30'}</PrimaryButton>
          <PrimaryButton variant="secondary" onClick={onEditAnswers}>
            {'\uC9C8\uBB38 \uC218\uC815'}
          </PrimaryButton>
        </div>
      </div>
    </section>
  )
}

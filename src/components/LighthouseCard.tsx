import { formatMoney, formatProgress } from '../kernel/format'
import { formatYears, MESSAGES } from '../kernel/lighthouse'
import type { LighthouseId, LighthouseResult } from '../kernel/lighthouse'

/** 一句话解释每个灯塔在问什么（口径来自 OPHE-29，不是自由发挥） */
const TAGLINES: Record<LighthouseId, string> = {
  'lighthouse-1': '资产年收益 = 年新增储蓄',
  'lighthouse-2': '资产年收益 = 年开销',
  'lighthouse-3': '可持续提款覆盖年开销',
}

interface LighthouseCardProps {
  lighthouse: LighthouseResult
  /** 当前总资产，用来算「还差多少」；未填为 null */
  assets: number | null
}

export function LighthouseCard({ lighthouse, assets }: LighthouseCardProps) {
  const titleId = `${lighthouse.id}-title`

  return (
    <section className="card" aria-labelledby={titleId}>
      <div className="card__head">
        <h2 className="card__name" id={titleId}>
          {lighthouse.name}
          <span className="card__formula">{lighthouse.formula}</span>
        </h2>
        <p className="card__tagline">{TAGLINES[lighthouse.id]}</p>
      </div>

      {lighthouse.state === 'computed' ? (
        <ComputedBody lighthouse={lighthouse} assets={assets} />
      ) : (
        <UnavailableBody message={lighthouse.message} />
      )}
    </section>
  )
}

function ComputedBody({
  lighthouse,
  assets,
}: {
  lighthouse: Extract<LighthouseResult, { state: 'computed' }>
  assets: number | null
}) {
  const percent = formatProgress(lighthouse.progress)
  const gap = assets === null ? null : Math.max(lighthouse.target - assets, 0)

  return (
    <>
      <dl className="card__metrics">
        <div className="card__metric">
          <dt className="card__metric-label">目标资产</dt>
          <dd className="card__metric-value">{formatMoney(lighthouse.target)}</dd>
        </div>
        <div className="card__metric card__metric--right">
          <dt className="card__metric-label">预计年数</dt>
          <dd className="card__metric-value card__metric-value--text">{formatYears(lighthouse.years)}</dd>
        </div>
      </dl>

      <div
        className="progress"
        role="progressbar"
        aria-label={`${lighthouse.name}进度`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(lighthouse.progress * 100)}
        aria-valuetext={percent}
      >
        <div
          className="progress__fill"
          style={{ width: `${Math.min(Math.max(lighthouse.progress, 0), 1) * 100}%` }}
        />
      </div>

      <div className="card__foot">
        <span>
          <span className="progress__value">{percent}</span>
          {gap === null || gap === 0 ? null : <span> · 还差 {formatMoney(gap)}</span>}
        </span>
        {lighthouse.achieved ? <span className="badge">{MESSAGES.achieved}</span> : null}
      </div>
    </>
  )
}

function UnavailableBody({ message }: { message: string }) {
  return (
    <>
      <dl className="card__metrics">
        <div className="card__metric">
          <dt className="card__metric-label">目标资产</dt>
          <dd className="card__metric-value card__placeholder">—</dd>
        </div>
        <div className="card__metric card__metric--right">
          <dt className="card__metric-label">预计年数</dt>
          <dd className="card__metric-value card__metric-value--text card__placeholder">—</dd>
        </div>
      </dl>

      <div className="progress" aria-hidden="true">
        <div className="progress__fill progress__fill--empty" style={{ width: '0%' }} />
      </div>

      <p className="card__message">{message}</p>
    </>
  )
}

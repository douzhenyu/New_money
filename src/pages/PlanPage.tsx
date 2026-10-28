import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { LighthouseCard } from '../components/LighthouseCard'
import { NumberField } from '../components/NumberField'
import { formatMoney } from '../kernel/format'
import { computeL1, validateInputs } from '../kernel/lighthouse'
import type { L1Result } from '../kernel/lighthouse'
import { parseForm } from '../kernel/parse'
import type { FieldErrors, L1Field, L1Form } from '../kernel/parse'
import { isFormEmpty, loadForm, saveForm } from '../storage'
import type { KeyValueStore } from '../storage'

/** 测算页：原 L1 结果页整体搬过来，口径与内核不变 */
export function PlanPage({ store }: { store: KeyValueStore }) {
  const [form, setForm] = useState<L1Form>(() => loadForm(store))

  // 改动即存：刷新不丢，没有提交按钮
  useEffect(() => {
    saveForm(store, form)
  }, [store, form])

  const { inputs, errors: formatErrors } = useMemo(() => parseForm(form), [form])
  const errors: FieldErrors = useMemo(
    () => ({ ...formatErrors, ...validateInputs(inputs) }),
    [formatErrors, inputs],
  )
  const result = useMemo(() => computeL1(inputs), [inputs])
  const empty = isFormEmpty(form)

  const setField = (field: L1Field) => (value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  return (
    <div className="plan">
      <section className="panel" aria-labelledby="form-title">
        <h2 className="panel__title" id="form-title">
          你的数字
        </h2>
        <p className="panel__lead">改任何一个数字都会立刻重算，不需要提交。</p>

        <div className="form">
          <NumberField
            id="assets"
            label="当前总资产"
            suffix="元"
            hint="可投资金融资产，不含自住房"
            value={form.assets}
            error={errors.assets}
            onChange={setField('assets')}
          />
          <NumberField
            id="savings"
            label="年新增储蓄"
            suffix="元"
            hint="税后年收入 − 年支出，可以为负"
            value={form.savings}
            error={errors.savings}
            onChange={setField('savings')}
          />
          <NumberField
            id="expenses"
            label="年生活开销"
            suffix="元"
            hint="不含买房、医疗等一次性大额"
            value={form.expenses}
            error={errors.expenses}
            onChange={setField('expenses')}
          />
          <NumberField
            id="returnPct"
            label="预期年化收益率"
            suffix="%"
            hint="你自己填，不是我们的预测"
            value={form.returnPct}
            error={errors.returnPct}
            onChange={setField('returnPct')}
          />
        </div>

        <details className="assumptions">
          <summary className="assumptions__summary">假设</summary>
          <div className="assumptions__body">
            <NumberField
              id="withdrawalPct"
              label="提款率"
              suffix="%"
              hint="默认 4%，可填 2.5%–5%"
              value={form.withdrawalPct}
              error={errors.withdrawalPct}
              onChange={setField('withdrawalPct')}
            />
            <p className="assumptions__note">
              预期年化收益率 r 也在上方主表单里，随时可改。未计入通胀与税费。
            </p>
          </div>
        </details>
      </section>

      {empty ? (
        <section className="empty" aria-labelledby="empty-title">
          <h2 className="empty__title" id="empty-title">
            填 4 个数，10 分钟
          </h2>
          <p className="empty__body">
            当前总资产、年新增储蓄、年生活开销、预期年化收益率。不用导入流水，也不用注册。
          </p>
          <p className="empty__note">数据只存在这台设备的浏览器里，刷新不丢。</p>
        </section>
      ) : (
        <section className="results" aria-label="三个灯塔">
          <p className="headline">{headlineContent(result)}</p>
          <div className="lighthouses">
            {result.lighthouses.map((lighthouse) => (
              <LighthouseCard key={lighthouse.id} lighthouse={lighthouse} assets={inputs.assets} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function headlineContent(result: L1Result): ReactNode {
  const { summary } = result

  if (summary.kind === 'incomplete' || summary.next === null) {
    return '把四个数字填完，就能看到三个灯塔的距离。'
  }

  const next = summary.next
  if (summary.nearest?.achieved === true) {
    return (
      <>
        最近达成：<strong>{summary.nearest.name}</strong>；距{next.name}还差{' '}
        <strong>{formatMoney(next.gap)}</strong>
      </>
    )
  }

  return (
    <>
      距{next.name}还差 <strong>{formatMoney(next.gap)}</strong>
    </>
  )
}

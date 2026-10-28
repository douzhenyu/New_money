import { describe, expect, it } from 'vitest'
import { parseForm, parseNumericInput } from './parse'
import type { L1Form } from './parse'
import { computeL1, validateInputs } from './lighthouse'

const EMPTY_FORM: L1Form = {
  assets: '',
  savings: '',
  expenses: '',
  returnPct: '10',
  withdrawalPct: '4',
}

describe('边界 6：未填与 0 在解析层就分开', () => {
  it('空字符串 → null（未填），"0" → 0', () => {
    expect(parseNumericInput('')).toEqual({ value: null, error: null })
    expect(parseNumericInput('   ')).toEqual({ value: null, error: null })
    expect(parseNumericInput('0')).toEqual({ value: 0, error: null })
    expect(parseNumericInput('0.0')).toEqual({ value: 0, error: null })
  })

  it('非数字给格式错误，而不是当成 0 或未填', () => {
    expect(parseNumericInput('abc')).toEqual({ value: null, error: 'not-a-number' })
    expect(parseNumericInput('1万')).toEqual({ value: null, error: 'not-a-number' })
  })

  it('容忍千分位逗号、空格与百分号', () => {
    expect(parseNumericInput('1,000,000').value).toBe(1_000_000)
    expect(parseNumericInput(' 100 ').value).toBe(100)
    expect(parseNumericInput('10%').value).toBe(10)
    expect(parseNumericInput('10％').value).toBe(10)
  })

  it('parseForm 把未填保留成 null，不会被默认值顶替', () => {
    const { inputs, errors } = parseForm(EMPTY_FORM)
    expect(inputs.assets).toBeNull()
    expect(inputs.savings).toBeNull()
    expect(inputs.expenses).toBeNull()
    expect(inputs.returnPct).toBe(10)
    expect(inputs.withdrawalPct).toBe(4)
    expect(errors).toEqual({})
  })

  it('解析结果直接喂给内核：0 是已填，空是未填', () => {
    const zero = parseForm({ ...EMPTY_FORM, assets: '0', savings: '0', expenses: '0' }).inputs
    const blank = parseForm({ ...EMPTY_FORM, assets: '', savings: '', expenses: '' }).inputs
    const zeroFirst = computeL1(zero).lighthouses[0]!
    const blankFirst = computeL1(blank).lighthouses[0]!
    if (zeroFirst.state !== 'unavailable' || blankFirst.state !== 'unavailable') {
      throw new Error('两种情况都应当未计算，只是原因不同')
    }
    expect(zeroFirst.reason).toBe('savings-not-positive')
    expect(blankFirst.reason).toBe('assets-missing')
  })
})

describe('字段范围校验', () => {
  it('总资产为负 → 提示', () => {
    expect(validateInputs({ ...parseForm(EMPTY_FORM).inputs, assets: -1 }).assets).toBe('当前总资产不能为负')
  })

  it('开销为 0 或负 → 提示', () => {
    expect(validateInputs({ ...parseForm(EMPTY_FORM).inputs, expenses: 0 }).expenses).toBe('年生活开销需大于 0')
    expect(validateInputs({ ...parseForm(EMPTY_FORM).inputs, expenses: -5 }).expenses).toBe('年生活开销需大于 0')
  })

  it('收益率 0 / 超过 30 → 提示', () => {
    expect(validateInputs({ ...parseForm(EMPTY_FORM).inputs, returnPct: 0 }).returnPct).toBe('收益率需大于 0')
    expect(validateInputs({ ...parseForm(EMPTY_FORM).inputs, returnPct: 30.5 }).returnPct).toBe('收益率需不超过 30%')
  })

  it('提款率超出 2.5%–5% → 提示', () => {
    expect(validateInputs({ ...parseForm(EMPTY_FORM).inputs, withdrawalPct: 6 }).withdrawalPct).toBe(
      '提款率需在 2.5%–5%',
    )
  })

  it('未填不是错误（由灯塔显示未计算状态）', () => {
    expect(validateInputs(parseForm(EMPTY_FORM).inputs)).toEqual({})
  })
})

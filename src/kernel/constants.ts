/**
 * L1 计算内核的口径常量。
 *
 * 全部口径来自 OPHE-29（父 issue）：「输入」「三个灯塔」「边界」三节。
 * 修改这些数值等于改产品口径，必须回去改 issue，不要在这里顺手调。
 */

/** 预期年化收益率 r 的合法区间：(0, 30] 百分数 */
export const RETURN_PCT_MIN_EXCLUSIVE = 0
export const RETURN_PCT_MAX = 30

/** 提款率 w 的合法区间：[2.5, 5] 百分数 */
export const WITHDRAWAL_PCT_MIN = 2.5
export const WITHDRAWAL_PCT_MAX = 5

/** 主表单里 r 的默认值 */
export const RETURN_PCT_DEFAULT = 10
/** 假设区里 w 的默认值 */
export const WITHDRAWAL_PCT_DEFAULT = 4

/** 预计年数上限：超过它只显示「60 年以上」 */
export const MAX_YEARS = 60

import { sparklinePoints } from '../watch/market'

export interface SparklineProps {
  trend: readonly number[]
  /** 涨跌方向：决定描边颜色（语义 token，随配色开关翻转） */
  direction: 'up' | 'down' | 'flat'
  width?: number
  height?: number
}

/** 迷你走势：只是形状，不带坐标轴；点太少就不画 */
export function Sparkline({ trend, direction, width = 64, height = 20 }: SparklineProps) {
  const points = sparklinePoints(trend, width, height, 1)
  if (points === '') return null

  return (
    <svg
      className={`sparkline sparkline--${direction}`}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label="近期走势"
      preserveAspectRatio="none"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

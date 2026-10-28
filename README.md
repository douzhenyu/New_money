# New money

个人理财工具。当前版本 **L1**：填四个数字，立刻看到自己离三个财富灯塔各有多远。

- 不导入流水、不需要账号、不发任何网络请求
- 数据只存在这台设备的浏览器里（`localStorage`）
- 仅记录与测算，不构成投资建议

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 单元测试
npm run build    # 产物在 dist/
```

## 页面在算什么

输入 `A`（当前总资产）、`S`（年新增储蓄）、`E`（年生活开销）、`r`（预期年化收益率），
假设区可改 `w`（提款率，默认 4%）：

| 灯塔 | 目标资产 | 含义 |
| --- | --- | --- |
| 灯塔一 | `A₁ = S / r` | 资产年收益 = 年新增储蓄 |
| 灯塔二 | `A₂ = E / r` | 资产年收益 = 年开销 |
| 灯塔三 | `A₃ = E / w` | 可持续提款覆盖年开销 |

进度 = `min(A / Aₙ, 1) × 100%`；预计年数是使 `A_t ≥ Aₙ` 的最小整数 `t`，
其中 `A_{t+1} = A_t × (1 + r) + S`。

未计入通胀与税费。完整术语与边界口径见 `CONTEXT.md`，开发约定见 `AGENTS.md`。

## 目录

```
src/
  kernel/          计算内核：纯函数 + 单元测试（公式、边界、文案口径都在这里）
  components/      展示组件
  styles/          tokens.css（设计变量）+ global.css
  storage.ts       localStorage 读写（未填 ≠ 0，只存原始文本）
  App.tsx          页面装配
```

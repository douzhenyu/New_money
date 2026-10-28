# New money — 开发约定

个人理财工具。当前只做 L1：填四个数字（当前总资产、年新增储蓄、年生活开销、预期年化收益率），
看清离三个财富灯塔各有多远。口径见 `CONTEXT.md`，产品范围见 issue OPHE-29。

## 技术栈

- **Vite 8** + **React 19** + **TypeScript 5.9**（严格模式）
- 单元测试：**Vitest 5**（`environment: node`，不需要 jsdom）
- 样式：手写 CSS + CSS variables（`src/styles/tokens.css`），不引入 UI 组件库
- 无后端、无账号、无网络请求；数据存 `localStorage`

## 命令

```bash
npm install        # 装依赖
npm run dev        # 本地开发，默认 http://localhost:5173
npm test           # 单元测试（跑一次）
npm run test:watch # 单元测试（监听）
npm run build      # tsc -b + vite build，产物在 dist/
npm run preview    # 预览 dist/
```

提交前必须实际跑过 `npm test` 和 `npm run build`，把命令与输出贴进 PR。

## 代码约定

- **计算口径只写在 `src/kernel/`**：纯函数，不碰 DOM、localStorage、`Date`、随机数。
  组件里不许出现 `/ 100`、`* (1 + r)` 这类公式。
- **口径文案只有一份**：`src/kernel/lighthouse.ts` 的 `MESSAGES`。UI 里出现
  「未填开销」「60 年以上」等文案时一律引用它，不要另写同义句。
- **未填 ≠ 0**：表单状态一律用原始文本（`string`）保存，解析放在 `kernel/parse.ts`，
  空串解析成 `null`。不要用 `0` 当默认值兜底。
- **格式化只走 `kernel/format.ts`**：金额自动切「万 / 亿」，不允许出现 `1e+9`。
- **数字排版**：等宽数字（`font-variant-numeric: tabular-nums`），重算时不许抖动。
- **布局**：375 与 1440 都必须无横向滚动；新增元素先自查这两档。
- **新增依赖**：先问，不要为了小功能引入框架或组件库。

## 测试约定

- 公式、边界、文案口径的变化必须同时有测试：`src/kernel/*.test.ts`。
- 失败路径与边界优先于 happy path（未填、0、负数、超范围、60 年以上）。
- 测试用父 issue 的测试向量对答案，不要自己另造一套数字。

## 提交与交付

- 一个 issue 一个 PR，描述写清：改了什么、怎么验证的、已知限制。
- 不修改验收标准来让任务通过；口径有歧义先停下来问。

# New money

个人理财工具。当前版本 **L1**，两个页面：

| 路由 | 页面 | 内容 |
| --- | --- | --- |
| `/` | 资产 | 总资产 + 配置结构（按类别横条）+ 资产明细（可增删改） |
| `/watch` | 大盘 | 指数卡片 + 自选列表（名称 / 全称 / 走势 / 价格 + 涨跌胶囊） |

- 不需要账号、不发任何网络请求、没有后端
- 数据只存在这台设备的浏览器里（`localStorage`）
- 大盘的行情是**静态示例数据**（`src/watch/market.json`），不是实时价格
- 仅记录，不构成投资建议

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 单元测试
npm run build    # 产物在 dist/
npm run preview  # 预览 dist/（内置 SPA 回退，直接打开 /watch 也能进）
```

## 页面在算什么

### 资产（`/`）

- 一条资产 = 名称 + 类别 + 金额（股票/基金可选填份额与现价）
- 类别七项：现金、存款、货币基金、股票、基金、债券、其他（定义在 `src/assets/categories.ts`）
- **总资产** = Σ 市值；股票/基金填了份额与现价时市值 = 份额 × 现价，否则用金额
- **浮动**（总资产下面那行）= 总资产 − 成本（股票/基金的金额记为成本）
- **配置结构** = 按类别占总资产的比例，金额降序；没有条目的类别不显示
- 增、改、删即时保存，删除需二次确认

### 大盘（`/watch`）

- 指数卡片：上证 / 深证成指 / 创业板指，点位 + 涨跌幅 + 迷你走势（移动端可横向滑）
- 自选行四段：名称、全称、迷你走势、价格 + 涨跌额胶囊
- 涨跌配色默认红涨绿跌，可切绿涨红跌，配置存本机
- 空状态给「添加自选」与 3 个热门建议

### 测算内核（保留，暂无界面）

`src/kernel/` 保留 L1 的四个输入与三个灯塔计算（公式、边界、文案口径与单测都在），
供后续版本接界面时直接使用。

完整术语与口径边界见 `CONTEXT.md`，开发约定见 `AGENTS.md`。

## 目录

```
src/
  kernel/          测算内核：纯函数 + 单测（公式、边界、文案口径）——当前无界面，保留
  assets/          资产领域：类别、条目校验、市值/浮动/配置结构聚合、金额格式化（纯函数 + 测试）
  watch/           大盘领域：静态假数据（market.json）、指数与自选读取、涨跌方向与走势坐标、配色配置
  storage/         localStorage 读写（按 key 版本化，坏数据丢弃）
  router/          40 行 History API 路由 + 路由匹配测试
  pages/           AssetsPage / MarketPage
  components/      展示组件（AppNav / AssetForm / AssetList / AllocationBars / IndexCards / QuoteRow / Sparkline / 表单控件）
  styles/          tokens.css（设计变量）+ global.css
  App.tsx          路由装配 + 导航 + 页脚
```

## 部署

产物是纯静态文件（`dist/`）。两条路径需要 SPA 回退：`/` 与 `/watch` 都回 `index.html`
（`npm run preview` 已内置；静态托管需自行配置 rewrite）。

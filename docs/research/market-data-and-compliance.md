# 行情数据源与投顾合规边界调研

## 一句话结论

**建议缩范围做：个人自用的资产配置记录与指数日终关注，在接受数据日期不齐、少量人工核对及明确权限约束时够用；不把它直接升级为对外发布的配置建议或可再分发行情服务。**[推断 / MEDIUM，依据下列数据源文档、授权条款及监管规则；商业方向这条需要成员本人拍板]

核对日期：2026-10-28。仅查公开网页、官方文件、维护者文档和源码；未登录、未申请 key、未调用行情 API、未验证本地网络可达性或连续更新成功率。HIGH 表示来源明确记载该事实，**不表示接口已实测可用**；MEDIUM 表示有依据但适用性、完整性或稳定性尚未验证；LOW 表示证据不足。全文区分「证据」「推断/建议」「未找到公开证据」。法律部分只是公开规则整理，不是律师意见。[方法说明]

任务沿用 OPHE-27 已确认的方向修正；已读 [PR #2 的旧研究][old-research]，只延续账户、持仓、交易的相关语义，不重做记账竞品研究。当前 main 只有 README，没有 `.planning/` 或既有研究文件；本篇不修改产品范围文件、不写产品代码、不定技术选型或项目排期。[仓库观察 / HIGH；方向依据：OPHE-27 任务正文]

## 支撑证据（按可信度排序）

### HIGH：先明确能取得什么，以及取得后能否展示

**数据能力、接口访问条件、数据使用权是三个问题。**网页能看到数字、开源库能采集数字，都不足以证明允许自动化访问、缓存后再分发或用于商用。下表中的「无 key」仅指所核对的适配器没有个人 key 参数；「全部历史」仅是供应商文档表述，不保证每个标的从成立日开始连续无缺漏。[推断 / HIGH，依据 [Tushare 协议][ts-terms]、[AKShare 概览][ak-about]、[Yahoo 条款][yahoo-terms]、[FRED 条款][fred-terms]]

#### 国内：指数、基金、ETF 与汇率分开看

| 来源 | key / 免费额度 / 费用 | 更新频率、延迟与历史范围 | 调用条款、商用限制与个人自用判断 |
| --- | --- | --- | --- |
| **Tushare Pro** | 需注册后的 token。免费 120 积分档仅非复权股票日线：50 次/分钟、8000 次/日，不能据此承诺指数/NAV 免费。公开个人 2000 档 200 元/年，200 次/分钟、每 API 每日 100000 次；5000 档 500 元/年，500 次/分钟、常规数据无日总量上限。积分是权限门槛，不逐次扣减。[证据 / HIGH：[报价][ts-price]、[权限][ts-access]] | 国内 `index_daily` 门槛 2000，汇总页称交易日 15—17 点更新、全部历史；`fund_nav` 门槛 2000、每日定期更新，区分公告日与净值日。ETF 场内 `fund_daily` **当前专页门槛 5000**，收盘后数据、超过十年历史、单次最多 5000 行。`fx_daily` 门槛 2000，日线、GMT 日期、单次 1000 行，统一最早日期与发布时间未获承诺。[证据 / HIGH：[指数][ts-index]、[净值][ts-nav]、[ETF][ts-etf]、[FX][ts-fx]、[更新说明][ts-access]] | 服务协议二（一）3(1)、二（二）5 限个人非商业用途、个人查看，账号不得分享；付费不自动获得商用/再分发权。[证据 / HIGH：[协议][ts-terms]] **自用判断：**取得相应权限后，少量国内指数、NAV 日更/周更在能力上足够；不是无账号全免费方案。[推断 / MEDIUM，依据本行] |
| **AKShare** | 采集库，本次相关新浪/腾讯/东财适配器无个人 key 参数；未见库自身按次收费。文档的单次返回范围不是每日免费调用配额；上游速率及封禁阈值未找到公开承诺。[证据 / HIGH（参数）；未知 / LOW（额度）：[指数][ak-index]、[基金][ak-fund]、[FX][ak-fx]] | 有 A 股指数日线、美指、ETF 市价、基金净值和外汇。日终数据与所谓实时接口分开；没有统一固定延迟 SLA。历史随上游和标的变化，不能统一保证起点；指数文档中新浪美指示例出现 2004-01-02，但不证明每个指数都从该日开始。[证据 / HIGH（文档能力）；完整性未知 / LOW：[指数][ak-index]、[基金][ak-fund]] | 官网将接口及相关数据限定为学术研究定位；MIT 是代码许可，不替上游授予行情权。[证据 / HIGH：[概览][ak-about]、[许可][ak-license]] **自用判断：**低频研究技术上够用，个人理财自动采集的授权充分性仍未确认；须容许失败与手工核对，不能作为必达或对外商用承诺。[推断 / MEDIUM] |
| **天天基金 / 东方财富** | 公开净值页可免登录阅读；经上述库访问相关网页时无个人 key。未找到面向第三方的稳定免费 API 配额、SLA 或商用再分发许可。[观察 / HIGH；证据缺口 / LOW：[官网][eastmoney]、[适配器文档][ak-fund]] | 官网标注交易日 16—23 点更新当日净值；这不是每只基金的统一完成时间。场外单位/累计 NAV、ETF NAV 与场内交易价有不同入口；盘中估值不等于正式 NAV。库文档可返回上游所存净值历史，但无统一年数保证；海外基金等需逐只看净值日期。[证据 / HIGH（字段/窗口）；推断 / MEDIUM（日期检查）：[官网][eastmoney]、[基金文档][ak-fund]] | **自用判断：**适合低频关注和手工核对；网页免费可读不能推出长期自动抓取与对外展示权。正式 NAV 可用作资产记录，盘中估值不替代结算口径。[推断 / MEDIUM，依据本行] |
| **新浪行情** | 所核指数适配器无个人 key；未找到相关第三方接口官方免费配额。[证据 / HIGH（参数）；未知 / LOW（额度）：[指数文档][ak-index]] | A 股指数日线及美指；`index_us_stock_sina` 支持 `.INX`（标普500）、`.NDX`（纳指100）、`.IXIC`（纳指综合）等。日线与盘中报价不混用；固定实时延迟、统一历史起点和完整性未找到官方承诺。[证据 / HIGH（维护者文档），供应商保证未知 / LOW：[指数文档][ak-index]] | 新浪对有权内容的版权声明不能解释为第三方行情再发布授权。[证据 / HIGH：[版权声明][sina-rights]] **自用判断：**日终观察可作能力候选和交叉核对；调用权与长期稳定性未证实，不能独担持续自动更新。[推断 / MEDIUM] |
| **腾讯行情** | 所核日线适配器无个人 key；官方第三方接口配额、SLA、商用再分发授权未找到公开证据。[证据 / HIGH（参数）；未知 / LOW（其他）：[指数文档][ak-index]] | `stock_zh_index_daily_tx` 可按日期取得指数历史。文档明确最早日期是腾讯数据起点，不是上市/成立日期；统一最早日期与固定延迟未承诺。[证据 / HIGH：[指数文档][ak-index]] | **自用判断：**国内指数低频观察在技术上是候选，权利和可用性待验证；不适合唯一的必达依赖。[推断 / MEDIUM，依据本行及[维护记录][ak-log]] |

**需要保留的文档冲突：**Tushare 总权限页列 `fund_daily` 为 2000，ETF 当前专页列 5000；本研究按较高的 5000 门槛估算能力/费用，真实权限未登录确认。报价不替代数据服务协议；即使另行采购，能否给 SaaS 用户展示仍需以书面合同确认。[证据 / HIGH（门槛冲突）；许可适用推断 / MEDIUM：[总表][ts-access]、[端点][ts-etf]、[报价][ts-price]、[协议][ts-terms]]

**海外指数经国内源也不能只按名称映射：**Tushare `index_global` 门槛 6000、单次 4000 行，公开代码表列 `SPX` 与 `IXIC`，未列 `NDX`；没有据此确认纳指100可用。6000 的单独现金档与所有标的历史起点未找到明确公开承诺，不能从 5000 档外推。[证据 / HIGH（已列代码/门槛）；未知 / LOW（其余）：[国际指数文档][ts-global]]

目标指数的明确映射如下；代码对应关系有文档依据，不表示本次已成功获取报价。[证据 / HIGH；实际覆盖待实测 / MEDIUM]

| 关注对象 | 已核对的来源标识与边界 |
| --- | --- |
| 标普500 | FRED `SP500`、Tushare `SPX`、新浪适配器 `.INX` 指向价格指数；均不能改称全收益。[依据[SP500说明][fred-sp]、[国际指数表][ts-global]、[美指文档][ak-index]] |
| 纳指100 | FRED `NASDAQ100`、新浪适配器 `.NDX`；纳指综合 `.IXIC` 是另一个指数。FRED `NASDAQXNDX` 才是另列的纳指100全收益。[依据[NDX历史][fred-ndx-data]、[XNDX历史][fred-xndx-data]、[指数文档][ak-index]] |
| 沪深300 | 新浪公开页明确 `000300.SH`；Tushare指数日线示例用 `399300.SZ`。可结合新浪日线适配器作为候选，尚未实测这条API；其余源后缀应查各自代码表，不直接复制。[依据[新浪页][sina-csi300]、[Tushare示例][ts-index]、[日线文档][ak-index]] |
| 中证500 | 新浪公开页明确 `000905.SH`；官方事实表另列全收益 `H00905`、净收益 `N00905`。三种收益口径不能混用；有代码不证明任一免费API完整覆盖全收益。[依据[新浪页][sina-csi500]、[中证事实表][csi500]] |

#### 海外：Stooq / Yahoo Finance / Alpha Vantage / FRED

| 来源 | key / 免费额度 | 频率、延迟与历史区间 | 条款和个人自用判断 |
| --- | --- | --- | --- |
| **FRED** | 官方 API 需 key，需账号申请；服务/API 免费。API 文档要求每个应用独立 key、应用用户使用各自 key。未从本次官方页面确认固定数字调用限额，不将流传的额度当 SLA。[证据 / HIGH：[key][fred-key]、[条款][fred-terms]；额度未知 / LOW] | `SP500` 是日收盘价格指数，**不含分红、仅滚动十年历史**；`NASDAQ100` 日收盘，公开表从 1986-01-02；另有全收益 `NASDAQXNDX`，从 1999-03-04。日终发布不等于收盘即到，无统一保证延迟。`DEXCHUS` 从 1981-01-02，人民币/美元的纽约午间买入参考汇率，日频观测却按 H.10 **每周一美东 16:15 发布上周数据，节假日顺延**。[证据 / HIGH：[SP500][fred-sp]、[NDX历史][fred-ndx-data]、[XNDX历史][fred-xndx-data]、[FX历史][fred-fx-data]、[H.10][fed-h10]] | SP500 明示转载须先获 S&P 书面许可；Nasdaq 序列也有版权/预先许可标记。FRED 不能代第三方授权；DEXCHUS 页面标公共领域、请求引用，但不能推到全部 FRED 数据。[证据 / HIGH：[SP500][fred-sp]、[XNDX][fred-xndx]、[FX][fred-fx]、[条款][fred-terms]] **自用判断：**指数日终关注、每周回看汇率足够；要求当日 FX、十年以上标普或对外转载则不够。[推断 / MEDIUM] |
| **Alpha Vantage** | 需 API key，普通免费额度 **25 次/日**；免费额度不覆盖所有端点。实时及15分钟延迟美股数据有付费授权条件。[证据 / HIGH：[支持页][av-support]] | 股票日线免费 compact 最近100点，完整长历史属付费；官方 `INDEX_DATA` 的 SPX/NDX 为 Premium，提供日/周/月历史；`FX_DAILY` 支持日线更新。不要拿 SPY 等 ETF 当 SPX；精确端点延迟与实际免费 key 可得币对未实测。[证据 / HIGH：[API文档][av-docs]；实际可得未知 / LOW] | 标准条款是个人非商业使用；超出私人的研究/监测，以及向其他人间接提供数据等，需另行书面约定。[证据 / HIGH：[条款][av-terms]] **自用判断：**少量允许端点的股票/FX 关注可能够；免费方案不能承担本任务的 SPX/NDX 正式指数历史。指数付费非本研究必需，未购买或申请报价。[推断 / MEDIUM] |
| **Yahoo Finance / yfinance** | yfinance 示例无个人 key。未找到 Yahoo 面向该非官方调用方式的稳定免费额度或 SLA；不能把无 key 当无限调用。[证据 / HIGH（库说明）；未知 / LOW（配额）：[维护者说明][yf-about]] | Yahoo 有标普、纳指100历史网页；具体行情延迟依交易所/供应商，并非统一实时。yfinance 支持 `period=max`，但没有保证每个标的的年数；日内历史文档上限为最近60日，不能外推到日线。[证据 / HIGH：[Yahoo历史页][yahoo-ndx]、[延迟帮助摘要][yahoo-delay]、[库参数][yf-download]] | 库作者说明个人研究用途，非 Yahoo 官方授权。Yahoo 总条款禁止未经事先许可的自动化采集；本次总条款正文抓取被拒，仅检得官方索引摘录，该限制不因个人用途自动消失。[证据 / MEDIUM：[Yahoo条款][yahoo-terms]；证据 / HIGH：[库说明][yf-about]] **自用判断：**能力广但访问授权和稳定性不足以支撑默认自动数据源；可核对公开页面，不承诺生产更新。[推断 / MEDIUM] |
| **Stooq** | 旧版 pandas-datareader 的适配器曾无个人 key 调用 CSV；**不能代表现在有可用无 key 服务**。本次 Stooq 首页、历史下载页均只返回 JavaScript 浏览器验证，未取得正文。当前免费配额与正式 API 合同未找到公开证据。[历史实现 / HIGH：[旧适配器][stooq-old]；当前观察 / HIGH：[官网][stooq-home]、[下载页][stooq-download]] | 当前精确指数代码覆盖、实时/日终延迟、各标的历史长度及调整规则均未能从一手正文核实，不抄二手“几十年历史”结论。pandas-datareader 2026年6月版已移除 Stooq 等依赖失效或严重损坏上游的证券适配器；这是客户端变更，不等于 Stooq 官方宣布停服。[证据 / HIGH：[更新日志][pdr-log]] | 当前个人/商用/再分发条款未取得可核实正文，**未找到公开证据支持允许商用**；也不凭二手转述断言其具体合同。**自用判断：**当前证据不够，不能算入已可自动更新方案。[推断 / MEDIUM] |

Yahoo 延迟帮助页只检得官方搜索摘要，正文返回 429；因此不为任何市场填未经核实的“延迟15分钟”。Stooq 的验证页只证明本次访问受阻，不代表普通浏览器均不可用。[观察 / HIGH；结论适用性 / MEDIUM，依据上述页面]

#### 已知变更：用具体记录判断维护风险

| 来源 | 找到的记录、日期/版本 | 能得出什么，不能得出什么 |
| --- | --- | --- |
| Tushare | FX 文档要求部分 INDEX/COMMODIT/BUND/FX_BASKET 自 2023-06-01 后改用无后缀代码；更新日志 2026-09-07 将 ETF 涨跌停迁至 `etf_limit`。[证据 / HIGH：[FX][ts-fx]、[日志][ts-log]] | 字段/代码/端点会迁移；不是整个服务停服证据。[推断 / HIGH] |
| AKShare及其天天基金、腾讯适配器 | 2024-01-04 / 1.12.11 将 `stock_zh_index_spot` 改名为 `stock_zh_index_spot_sina`；1.16.97、1.16.98 修复 `fund_open_fund_info_em`；1.18.60 修复腾讯指数日线。[证据 / HIGH：[维护者日志][ak-log]] | 需要跟随网页及库更新；未据此确认上游永久停服。天天基金/新浪/腾讯本次未找到针对这些第三方接口的完整官方停服历史。[推断 / MEDIUM；缺口 / LOW] |
| Yahoo / yfinance | 维护者 issue #1407 记录 2023 年加密变化导致非行情网页数据失效，6月转 API；#2297 有 429 限流报告。[证据 / HIGH（维护者记录）；MEDIUM（用户故障报告）：[1407][yf-break]、[2297][yf-rate]] | 不能把“财务表曾坏”写成“历史价格全部停服”；但能反证非官方适配零维护。[推断 / MEDIUM] |
| Alpha Vantage | 当前文档的免费100点/完整历史和指数付费边界可确认；pandas-datareader 2026年6月也移除其旧适配器。[证据 / HIGH：[API][av-docs]、[客户端日志][pdr-log]] | 未找到本次可核实的供应商免费额度变更时间线或整体停服公告；不据旧教程的500次/日承诺当前额度，也不把客户端移除等同供应商关闭。[推断 / HIGH；缺口 / LOW] |
| FRED | SP500 页明确有新授权协议、只保留十年日历史；H.10 官方说明 2006-05-22 至2009年1月曾暂停周发布。[证据 / HIGH：[SP500说明][fred-sp]、[H.10][fed-h10]] | 来源权利/发布节奏会变；本次未找到 FRED API 永久稳定、固定延迟或无变更保证。[推断 / MEDIUM；缺口 / LOW] |

### HIGH：同一指数的数字不等于同一种收益

| 口径 | 是什么、何时有用 | 会怎样误导「我的配置 vs 标普500」 |
| --- | --- | --- |
| **价格指数点位** | 表示按指数方法汇总的市场价格水平，基值是计算尺度，不是投资金额。FRED SP500 明示不含分红。[证据 / HIGH：[SP500][fred-sp]] | 把自己含分红的收益与价格指数比，会高估相对表现；不同指数的点位绝对值也不能直接相减判断谁更好。[推断 / HIGH] |
| **全收益 / 净全收益指数** | 全收益计入现金分红再投资；净全收益再按特定预提税假设处理。其净税口径不必等于本人的税负。[证据 / HIGH：[S&P计算方法][sp-math]] | 把税前、税后或不含分红混用会改变比较结论；一个 `Adj Close` 字段名不能证明它是正式全收益指数。[推断 / HIGH，另见[调整收盘价定义][yahoo-adjust]] |
| **ETF NAV** | 单位净资产来自基金资产减负债后除份额；反映基金持有资产、费用等，按估值日计算，不是盘中可成交报价。[证据 / HIGH：[SEC投教][sec-etf]、[净资产定义][sec-nav]] | 指数全收益不扣某只基金的管理费；ETF 还可能有复制偏差、税和现金拖累，不能改名为“指数本身”。[推断 / HIGH，依据[Vanguard跟踪解释][tracking]] |
| **ETF 市价** | 交易所买卖价格，可能对 NAV 溢价或折价，另有买卖价差；与 NAV 是不同量。[证据 / HIGH：[SEC投教][sec-etf]] | 跨境 ETF 在国内交易时与海外收盘不同步；溢价收缩造成的亏损不能归成“标普跌了”。以 NAV 估算可卖市值也会漏掉折溢价。[推断 / HIGH] |
| **场外基金单位/累计/复权净值** | 单位净值是某日每份价值；累计净值考虑历次分红等累计信息，复权净值有其再投资/拆分算法。Tushare 分列这些字段及公告日、净值日。[证据 / HIGH：[NAV字段][ts-nav]；算法须逐源确认 / MEDIUM] | 累计净值简单相除一般不能直接当分红再投资回报；盘中估值不是正式净值。也不能混合 A/C 份额、人民币/美元份额或 ETF 联接与 ETF。[推断 / HIGH，依据[基金文档][ak-fund]] |
| **跟踪差异与跟踪误差** | 跟踪差异是同期间基金回报减基准回报；跟踪误差是这些回报差的波动度，需说明频率及年化方法。[证据 / HIGH：[Vanguard][tracking]] | “落后2个百分点”不是“跟踪误差2%”；低波动的持续费用拖累可有低跟踪误差但负跟踪差异。[推断 / HIGH] |
| **汇率折算** | 要给出报价方向、时点、参考/成交/买卖价类型；DEXCHUS 是人民币/美元纽约午间参考买入汇率，不是个人银行成交价。[证据 / HIGH：[FRED FX][fred-fx]] | 人民币资产与美元指数直接比较，把汇率变化当作选股/配置能力；用最新汇率回算整个历史，会消掉真实汇兑收益。[推断 / HIGH] |

**MVP 只显示一个数字时：指数关注卡建议显示「最近已确认交易日的收盘价格指数点位」**，紧邻标注“价格指数、不含分红、原币、交易日期、来源/过期状态”，不把它叫投资回报。它可对应官方收盘口径，避免把某只 ETF 的费用、分红或溢价冒充指数。[建议 / MEDIUM，依据[SP500定义][fred-sp]与上表]

**若这个数字用于评价“跑赢标普多少”，则应选同期间、同报告币种、明确税假设的全收益基准累计回报**，对照剔除外部资金流影响的组合收益。拿不到已核实且可使用的全收益序列时，保留行情关注，暂不生成跑赢/跑输分数；不能默默用价格指数或 ETF 补位。FRED 有纳指100全收益，不代表也提供同样免费的标普全收益；本次未确认可直接承担此用途的免费、稳定、可再分发标普全收益 API。[建议 / MEDIUM：[S&P方法][sp-math]、[FRED XNDX][fred-xndx]、[GIPS计算原则][gips]]

组合比较还有三个容易漏掉的条件。[推断 / HIGH，依据上表及[GIPS][gips]；GIPS用于解释收益计算，不主张本产品已符合该标准]

- **资金流：**账户间转账在整个组合内不是新增收益。新投入100元不能计作赚100元；时间加权收益按资金流分段连接，资金加权收益受投入时机/金额影响。只有当前仓位快照不足以准确还原过去收益，更不能用今天权重回算历史配置表现。
- **分红与费用：**已把分红计为现金/再投资份额，就不能又叠加复权价格里的同一分红；本人税费与基准假设不同应写明。正式净值与银行/券商实际到账金额也不同。
- **日期：**中美交易日、收盘时刻、净值估值日和公告日不同；周度比较取双方都有有效观测的共同截止日。缺失值不填成当日零收益；跨境基金净值未到齐时不能拿另一侧最新价声称同日比较。

**可复核的合成反例（不是市场数据）：**

| 场景 | 手算结果与应有解释 |
| --- | --- |
| 标的100→110，期末另付现金分红2；简化为期末分红、不再投资 | 价格回报10%，含分红回报12%；把个人12%对价格指数10%称“跑赢2个百分点”没有排除口径差异。[合成演算 / HIGH] |
| 美元资产回报10%，人民币/美元从7.0→7.2，期间无现金流 | 人民币回报 `1.10 × (7.2/7.0) − 1 = 13.142857…%`，不是10%或简单加汇率百分比。[合成演算 / HIGH；按上表汇率方向推导] |
| NAV恒为1.00，ETF市价1.10→1.00 | NAV回报0%，买入后市价回报约−9.09%；变化来自溢价消失，不能冒充指数走势。[合成演算 / HIGH] |
| 期初组合100，期末新增资金100后余额200，价格不变 | 余额涨100%，投资回报0%；没有资金流记录就不应输出100%的投资收益。[合成演算 / HIGH] |

### HIGH：中国大陆公开规则的边界和时效

**不是律师意见。**这里仅整理证券及公募基金相关建议的公开规则，不对所有“大类资产配置”场景、境外证券服务、宣传、隐私或产品上线义务出具全面法律结论；“个人自用”也不豁免供应商访问/版权约束。[范围说明]

| 官方证据（先列已发布规则，再列草案/计划） | 能确认的边界与时效 |
| --- | --- |
| 《证券、期货投资咨询管理暂行办法》，1997-12-25发布，1998-04-01施行，司法部行政法规库全文第二、三、十二条。[证据 / HIGH：[原文][law-consult]] | 向投资人/客户提供证券期货分析、预测或建议，直接或间接有偿咨询受业务许可约束；包括网络等传播方式。不能把“个人考过资格考试”当机构许可。具体从业登记须结合后续规定，不照搬旧证书流程。 |
| 《证券投资顾问业务暂行规定》的官方解释，深圳局2019-05-17；证监会2020-10-30第66号公告作后续修改。[证据 / HIGH：[解释][law-advice]、[修订][law-amend]] | 涉及证券/相关产品的品种选择、投资组合和理财规划建议，辅助客户决策并直接或间接获益，属于其定义关注对象。人员条件/注册登记与机构许可分别核对；不以2010旧版被删除条款作结论。 |
| 2012年第40号“荐股软件”规定，2013-01-01施行；浙江局公开解释范围，2020年亦有修订。[证据 / HIGH：[公告][law-software]、[范围解释][law-software-scope]、[修订][law-amend]] | 软件提供具体证券分析、品种选择、买卖时机等建议，不因载体是软件就绕过监管。仅证券信息汇总、历史统计且没有所列分析/预测/建议功能，有该规定下的明确排除；**不等于整款资产配置产品的法定免责**。 |
| 基金投顾试点与2023-06-09征求意见通知/起草说明。[证据 / HIGH：[通知][law-fund-draft]、[说明][law-fund-background]] | 官方说明确认2019年10月启动试点；2023文本拟推动试点转常规、以组合策略提供基金投资建议等。**2023文本是征求意见稿，不把其中比例、适当性或业绩展示条款写成现行义务**。2019试点通知完整独立原文本次未找到可核实公开证据，不能据转述编出精确条款。 |
| 基金业协会2023年《基金投顾服务协议内容与格式指引》公告及官方附件搜索摘录。[证据 / MEDIUM：[协会公告][law-amac]、[附件][law-amac-pdf]；正文访问受限，未逐条核对] | 官方附件摘录要求声明已备案、具试点资格，并区分基金投顾与基金销售。这是已发布自律文件，性质不同于2023证监会草案；不能据本次公开材料推定一般开发者可向他人提供具体基金组合/调仓建议，基金销售资格也不能自动替代基金投顾资格。具体适用需查有效全文与机构资格。[推断 / MEDIUM] |
| 证监会2026-04-10年度立法计划。[证据 / HIGH：[原文][law-plan]] | 《证券基金投资顾问业务管理办法》当时仍列“需要抓紧研究、择机出台”。**截至本次检索，未找到该新统一办法已正式公布生效的公开证据**；立法计划不能证明其后绝无新规，检索完整性为 MEDIUM。 |

#### “自用”与“发布给他人”不是同一个业务场景

| 场景/文案 | 判断及依据 |
| --- | --- |
| 本人本地记录资产，查看行情、持仓占比和历史统计 | 未呈现向客户提供经营性建议的典型要素，可支持有限自用验证；**未找到个人资产软件全面法定豁免**。[推断 / MEDIUM，依据[咨询定义][law-consult]、[统计排除][law-software-scope]] |
| “当前相关资产32%；你自行设定目标40%；低于目标8个百分点” | 前提是目标由用户独立设定、系统只算差额，更接近事实统计。32%与40%的差是8个百分点，不是8%的资产损失；这段文案没有获得监管预先认可。[推断 / MEDIUM，依据[软件范围][law-software-scope]] |
| “建议加仓到40%”“根据你的年龄和风险偏好应买入某ETF” | 系统决定比例/产品/动作，接近投资组合、品种选择和理财规划建议。对外提供应核业务资格及具体结构，不能沿用纯信息展示结论。[推断 / MEDIUM，依据[投顾定义][law-advice]] |
| 系统先推荐40%，随后只显示“偏离目标8个百分点” | 后一步改写文案不消除前一步的推荐；审查整个功能链。建议目标是否预填、算法是否自动调仓都影响判断。[推断 / MEDIUM，依据[软件范围][law-software-scope]] |
| 公开分享网站、免费推荐组合、附广告/导流/返佣或后续订阅 | 免费公开推荐不自动免责；直接或间接经济利益只是需核对的要素之一，也不把公开内容一概当作对单个客户的建议。需分别核公众传播、获益结构和数据再发布权。[推断 / MEDIUM，依据[咨询办法][law-consult]、[投顾定义][law-advice]及各源条款] |
| 有“仅供参考/不构成投资建议”，功能仍给品种/调仓/收益承诺 | 未找到只靠免责声明即可豁免的公开依据；不按标题或免责声明替代功能判断。[证据缺口 / MEDIUM，依据前述业务及软件定义] |

**发布信息也要同时过数据授权这一关。**即使没有投顾功能，FRED 的 S&P/Nasdaq 版权标记、Tushare 非商业条款、Yahoo 自动采集约束以及国内网页数据授权缺口仍存在。开源发布工具与在公共服务器提供行情不是同一行为，不能把前者的代码许可移给后者。[推断 / HIGH：[FRED条款][fred-terms]、[Tushare协议][ts-terms]、[Yahoo条款][yahoo-terms]、[AKShare许可][ak-license]]

### MEDIUM：个人自用到底够不够，维护什么

| 约束与目标 | 可执行判断及尚缺什么 |
| --- | --- |
| 每周一次，接受各自最近有效日、仅本人查看 | **有条件够用。**FRED 覆盖美指日终和上周 FX；国内指数/正式 NAV 需相应 Tushare 权限或另确认上游许可；保留手工核对/补录。周更只降低频次，不能解决授权。[推断 / MEDIUM，依据前述能力与条款] |
| 每天运行一次，所有数字必须是同一当日 | **不够承诺。**美股、A股、跨境基金估值日不齐，H.10周发布；每日执行可以仅检查并纳入新发布的数据，但不能制造当天净值和汇率。[推断 / HIGH，依据[H.10][fed-h10]、[净值日期字段][ts-nav]] |
| 每天一次，仅要求已经发布的日终价格/NAV | **技术上可行、尚未实测。**正规权限端点的量级足以覆盖少量指数/基金；不存在需要本次登录或付费才能完成研究的阻塞。实施后才可验证所选标的完整性与本地连续运行。[推断 / MEDIUM，依据[权限][ts-price]、[FRED][fred-key]] |
| 全免费、无账号、自动更新稳定、全部正式指数/长历史且可公开分发 | **未找到公开证据证明同时成立。**FRED API需key、标普仅十年且有版权；Tushare相关能力有门槛；网页采集无明确授权/SLA；Stooq未能核实。不能许诺“先免费抓，再上线”。[证据缺口 / LOW；限制本身 / HIGH，见前表] |

**维护工作量：**公开文档不能给可靠的月度工时或故障率，因此不编“每月维护10分钟”。正常时行情/NAV不需逐项手录；仍需人工登记持仓变动、资金进出、分红及真实成交费用，并核对过期和异常值。适配器变更时需查文档、升级/修正映射或临时手录；若采集受限，人工维护可能成为常态。预计劳动类型明确，工时和是否可持续都尚未测量。[推断 / MEDIUM：[AKShare维护说明][ak-about]、[变更记录][ak-log]、[GIPS资金流原则][gips]]

**仍拿不到/未确认能合法稳定拿到的数字：**统一时刻的全球“实时”行情、免费无授权限制的标普全收益长历史、所有基金成立以来的完整复权/分红序列、当天尚未公布的正式 NAV、本人真实银行汇兑成交价/税费、仅由持仓快照还原的准确历史收益。前三项属于源覆盖/授权证据缺口；后三项不能靠换一个行情源补齐。[推断 / MEDIUM，依据前述数据表、口径与计算原则；不宣称市场上不存在付费产品]

## 主要风险与反证

### 什么情况下这个判断是错的

| 判断 | 使判断失效的情况 | 能尽早发现的信号 / 应改成什么结论 |
| --- | --- | --- |
| 有权限的日终/周度自用够用。[推断 / MEDIUM] | 需要盘中决策、跨境 NAV 当日齐全，或本地网络长期不能访问来源。 | 用户因日期滞后无法完成回看；先核净值日/收盘日和访问失败，判为该约束下不够用，不把旧值伪装最新。[依据[H.10][fed-h10]、[基金字段][ts-nav]] |
| 库文档可代表所选标的可取。[推断 / MEDIUM] | 上游加验证、代码迁移、权限提高、字段/单位变动，或文档过时。 | 请求成功但日期不前进、空表、单位突变、重复日期；核数据语义，不只HTTP状态。Tushare ETF权限冲突、Stooq验证页已是早期信号。[依据前述变更/冲突] |
| 比较数字反映投资表现。[推断 / MEDIUM] | 把分红、注资、汇率、溢价或不同估值日的差异算成超额收益。 | 合成反例不能复算、分红日断崖、入金日收益跳升、人民币/美元结果混用；暂停跑赢分数，保留可解释的持仓和行情。[依据口径表及[GIPS][gips]] |
| 自用记录更接近信息工具。[推断 / MEDIUM] | 增加自动目标权重、推荐组合/品种、买卖时点、默认调仓清单，或广告返佣。 | 文案出现“应买/建议加仓”、系统代填目标、对外推荐入口；重新核投顾与获益结构。[依据[软件范围][law-software-scope]、[投顾定义][law-advice]] |
| 公开规则整理足以界定下一步验证。[推断 / MEDIUM] | 检索漏掉新规、监管口径或适用于具体业务的新要求。 | 证监会正式公告/法规库效力更新、持牌机构或律师提出反例；以新有效文件纠正，不把2023草案当现行规则。[依据[2026计划][law-plan]、[草案通知][law-fund-draft]] |
| 数据可用于所想的交付方式。[推断 / MEDIUM] | 合同限制缓存、间接展示、衍生结果或再分发；开源项目也不获数据权。 | 供应商书面答复拒绝目标用途，条款显示仅个人查看；缩到私人查看/来源链接，或另谈授权。不能用“免费产品”解释商用许可。[依据[供应商条款][ts-terms]、[FRED条款][fred-terms]] |

**检索限制：**Stooq只有浏览器验证页；Yahoo部分帮助/条款正文429/999；协会部分正文超时；中证300事实表未成功取回，故不列其全收益代码映射为已核事实。Tushare/AKShare的额度、字段和历史承诺只核文档，未拿账号验证。未找到公开证据不等于不存在，也不表示已经获得使用许可。[观察 / HIGH；检索完整性 / MEDIUM]

## 下一步最小验证动作（一天内能做完）

以下是一次验证的范围，不是项目排期；全部可用公开文件和合成数字完成，无需私人账单、账号、付费订阅或产品代码。[建议 / MEDIUM，依据前述证据缺口]

1. **做六行来源契约核对。**标普500、纳指100、沪深300、中证500、一只国内ETF、一只场外基金；另附人民币/美元参考汇率。记录所选源、标的与代码、点位/市价/NAV/全收益、币种、历史起点证据、交易/净值/公告日期、权限、授权缺口。用公开官方说明与网页样例交叉核对，缺口就写缺口。验收：不出现 IXIC 冒充 NDX、ETF 市价冒充 NAV、日频 FX 冒充日发布；不声称完成自动接口测试。
2. **复算四个合成反例，并审一次所有拟用文案。**复算上表分红、汇率、溢价、注资；列清目标谁设、是否建议品种/时机、是否对外、如何获益。验收：每个数字有口径，信息统计与系统建议分别标注；需要真实交易或全收益数据才能回答的部分保持待验证。
3. **将具体升级项交给 Mika 协调，成员拍板。**若要对外发布或完整标普全收益比较，需供应商明确书面说明允许缓存、公开/间接展示、再分发和所需历史覆盖；若要配置建议，需中国大陆执业律师/持牌机构核实际功能链和当时有效规则。公开资料未给这两类服务可核实统一报价，不编成本。已知个人 Tushare 200/500元年档只供量级参考，不是商用授权报价；没有证据证明付费源是本次有限自用验证唯一途径，**本次不购买、不索取账号**。将本篇权限/文案清单作为协调输入即可，不要求先取得上述资源才验收本次研究。

## 给 New money MVP 的建议取舍

1. **保留个人资产配置记录与指数日终关注，允许数据按最近有效日呈现。**个人自定目标的偏差用百分点表达；先确认使用权，再承诺所选来源的自动日更/周更。是否接受注册、个人数据费用和手工兜底，这条需要成员本人拍板。[建议 / MEDIUM，依据数据源表及[统计范围][law-software-scope]]
2. **把行情关注与收益评价分开。**单数字关注优先用带日期的收盘价格指数；正式收益比较只在同币种、同期间、分红/资金流已处理时启用，缺可靠全收益基准则暂不打跑赢分数。[建议 / MEDIUM，依据口径表、[S&P方法][sp-math]、[GIPS][gips]]
3. **对外发布与系统配置建议另作验证决策。**不靠免责声明或付个人数据费推定获得资质/再分发权；将具体授权和法律缺口交 Mika 协调，成员决定是否投入该方向，本篇不作技术选型定稿。[建议 / MEDIUM，依据合规表及供应商条款]

[old-research]: https://github.com/douzhenyu/New_money/pull/2
[ts-price]: https://tushare.pro/document/2?doc_id=290
[ts-access]: https://tushare.pro/document/1?doc_id=108
[ts-terms]: https://tushare.pro/document/1?doc_id=405
[ts-index]: https://tushare.pro/document/2?doc_id=95
[ts-nav]: https://tushare.pro/document/2?doc_id=119
[ts-etf]: https://tushare.pro/document/2?doc_id=127
[ts-global]: https://tushare.pro/document/2?doc_id=211
[ts-fx]: https://tushare.pro/document/2?doc_id=179
[ts-log]: https://tushare.pro/document/1?doc_id=9
[ak-about]: https://akshare.akfamily.xyz/introduction.html
[ak-license]: https://github.com/akfamily/akshare/blob/main/LICENSE
[ak-index]: https://akshare.akfamily.xyz/data/index/index.html
[ak-fund]: https://akshare.akfamily.xyz/data/fund/fund_public.html
[ak-fx]: https://akshare.akfamily.xyz/data/fx/fx.html
[ak-log]: https://akshare.akfamily.xyz/changelog.html
[csi500]: https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/zh_CN/000905factsheet.pdf
[eastmoney]: https://fund.eastmoney.com/
[sina-rights]: https://corp.sina.com.cn/chn/copyright.html
[sina-csi300]: https://finance.sina.com.cn/realstock/company/sh000300/nc.shtml
[sina-csi500]: https://finance.sina.com.cn/realstock/company/sh000905/nc.shtml
[fred-key]: https://fred.stlouisfed.org/docs/api/api_key.html
[fred-terms]: https://fred.stlouisfed.org/legal/
[fred-sp]: https://fred.stlouisfed.org/series/SP500
[fred-ndx-data]: https://fred.stlouisfed.org/data/NASDAQ100
[fred-xndx-data]: https://fred.stlouisfed.org/data/NASDAQXNDX
[fred-xndx]: https://fred.stlouisfed.org/series/NASDAQXNDX
[fred-fx-data]: https://fred.stlouisfed.org/data/DEXCHUS
[fred-fx]: https://fred.stlouisfed.org/series/DEXCHUS
[fed-h10]: https://www.federalreserve.gov/releases/h10/
[av-support]: https://www.alphavantage.co/support/
[av-docs]: https://www.alphavantage.co/documentation/
[av-terms]: https://www.alphavantage.co/terms_of_service/
[yf-about]: https://ranaroussi.github.io/yfinance/
[yf-download]: https://ranaroussi.github.io/yfinance/reference/api/yfinance.download.html
[yf-break]: https://github.com/ranaroussi/yfinance/issues/1407
[yf-rate]: https://github.com/ranaroussi/yfinance/issues/2297
[yahoo-terms]: https://legal.yahoo.com/us/en/yahoo/terms/otos/index.html
[yahoo-delay]: https://help.yahoo.com/kb/SLN2310.html
[yahoo-ndx]: https://finance.yahoo.com/quote/%5ENDX/history/
[yahoo-adjust]: https://in.help.yahoo.com/kb/adjusted-close-sln28256.html
[stooq-home]: https://stooq.com/
[stooq-download]: https://stooq.com/db/h/
[stooq-old]: https://github.com/pydata/pandas-datareader/blob/v0.10.0/pandas_datareader/stooq.py
[pdr-log]: https://pandas-datareader.readthedocs.io/en/latest/whatsnew.html
[sp-math]: https://www.spglobal.com/spdji/kr/documents/methodologies/methodology-index-math.pdf?force_download=true
[sec-etf]: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-24
[sec-nav]: https://www.investor.gov/introduction-investing/investing-basics/glossary/net-asset-value
[tracking]: https://www.vanguard.ca/en/tools-and-resources/etf-fundamentals/management/index-tracking
[gips]: https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/
[law-consult]: https://xzfg.moj.gov.cn/mobile/law/detail?LawID=500
[law-advice]: https://www.csrc.gov.cn/shenzhen/c105614/c1575193/content.shtml
[law-amend]: https://www.csrc.gov.cn/csrc/c101950/c1047975/content.shtml
[law-software]: https://www.csrc.gov.cn/csrc/c101838/c1021995/content.shtml
[law-software-scope]: https://www.csrc.gov.cn/zhejiang/c103930/c1073287/content.shtml
[law-fund-draft]: https://www.csrc.gov.cn/csrc/c101981/c7413553/content.shtml
[law-fund-background]: https://www.csrc.gov.cn/csrc/c101981/c7413553/7413553/files/%E9%99%84%E4%BB%B62%EF%BC%9A%E3%80%8A%E5%85%AC%E5%BC%80%E5%8B%9F%E9%9B%86%E8%AF%81%E5%88%B8%E6%8A%95%E8%B5%84%E5%9F%BA%E9%87%91%E6%8A%95%E8%B5%84%E9%A1%BE%E9%97%AE%E4%B8%9A%E5%8A%A1%E7%AE%A1%E7%90%86%E8%A7%84%E5%AE%9A%EF%BC%88%E5%BE%81%E6%B1%82%E6%84%8F%E8%A7%81%E7%A8%BF%EF%BC%89%E3%80%8B%E8%B5%B7%E8%8D%89%E8%AF%B4%E6%98%8E.pdf
[law-amac]: https://www.amac.org.cn/xwfb/hydt/202303/t20230303_18919.html
[law-amac-pdf]: https://www.amac.org.cn/xwfb/hydt/202303/P020231126370117104735.pdf
[law-plan]: https://www.csrc.gov.cn/csrc/c100028/c7625742/content.shtml

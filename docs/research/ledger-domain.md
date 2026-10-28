# 记账产品与账本领域调研

## 一句话结论

**缩范围做**：建议先验证“单币种记账与月度复盘”，用账户样例澄清退款、转账、余额及导入重复的口径，再决定是否扩展分期和多币种；这是研究建议，商业上做不做、范围是否接受，**这条需要成员本人拍板**。[推断 / MEDIUM，依据下述产品分歧与导入证据]

## 支撑证据，按可信度排序

### 阅读口径与研究边界

- 核验日期：2026-10-28。研究样本为 YNAB、Monarch Money、Wallet by BudgetBakers、GnuCash、MoneyWiz，覆盖预算管理、聚合理财、移动记账与桌面复式记账。不是按市场份额排序；未找到足以证明它们是“中国用户使用量前五”的公开证据。[范围说明]
- **证据 / HIGH**：官方现行帮助、官方 API/SDK 或可定位的维护者源码，直接支撑该项公开行为。**证据 / MEDIUM**：旧版官方手册或集成方操作说明，适用范围受版本限制。**推断 / MEDIUM/LOW**：从证据提出的假设，不能当作产品承诺。未知项写“未找到公开证据”，不等于功能不存在。
- 只核对公开资料，未登录五款产品实测，未接触真实私人账单。下文“最短路径”指已有账户、分类后的最少业务步骤，不是测得的点击数；一个月度报表仅含一笔时不能代表完整月度结论。[方法限制]
- 仓库上下文：基于 `309f94c`，仅有 `README.md`；未发现仓库级 `AGENTS.md`、`.planning/`、既有研究、产品规格或术语表。当前 issue 无历史评论，因此没有既有结论需要覆盖。[本地检查 / HIGH]
- 另核对了尚未合并的 [OPHE-25 产品定义 PR #1](https://github.com/douzhenyu/New_money/pull/1) 及其[固定版本草案](https://github.com/douzhenyu/New_money/blob/85dce452680b4db686e7fce39dc026ab3019192f/docs/product/mvp.md)：它假设单人手动记账、月度概览、JSON 导入导出，明确不做自动账单导入、预算、趋势和多币种。本文的账户/分期/账单讨论用于澄清边界，**不将这些能力加入 MVP 验收范围**；草案仍待成员拍板。[仓库证据 / HIGH；状态核验同上日期]

### HIGH：公开模型能证明什么

闭源产品的 API 合约能证明对象关系，不能证明物理表结构；“能显示余额”也不能证明它每次都重算。以下分开回答。[方法判断 / HIGH]

| 产品 | 账户、分类、交易、标签、预算如何组织 | 一笔跨分类、转账与支出是否同构 | 余额：已证实与未知 |
| --- | --- | --- | --- |
| YNAB | Plan 下有账户与分类组；交易引用账户、收款人、分类；分类返回当期分配、活动、可用额及目标。交易有 memo、命名 flag，不能将其等同任意多标签实体。[证据 / HIGH：[账户][Y-account]、[交易][Y-txn]、[分类][Y-cat]] | 子交易各有金额/分类；主交易和子交易均可带转入账户、另一侧交易 ID。**公开对象层同构**，不能据此断言同一数据库表。[证据 / HIGH：[子交易][Y-sub]、[交易][Y-txn]] | API 返回总额、已清算、未清算余额；连接银行时创建起始余额交易。**内部持久化、缓存策略未找到公开证据**。[证据 / HIGH：[账户][Y-account]、[起始余额][Y-import]] |
| Monarch | 连接下有账户；交易选择账户、商户、分类，可附 tags；分类属于组，Category Budget 按分类，Flex Budget 按固定、弹性、非月度三桶组织。[证据 / HIGH：[手动记录][M-manual]、[预算][M-budget]、[连接层级][M-delete]] | 支持拆分类；Transfer 是分类组，信用卡还款两端均标还款类。**产品层沿用交易分类，内部表结构、两端自动关联机制未找到公开证据**。[证据 / HIGH：[拆分][M-split]、[转账][M-transfer]] | 同步账户加手动交易不改同步余额；手动账户可选择调整余额。余额不能被默认解释成所见交易总和；数据库存储/重算策略未知。[证据 / HIGH：[手动记录][M-manual]] |
| Wallet | 官方 MCP 明列 accounts、records、categories、labels、budgets；分类有层级，预算按期间及账户/分类/标签过滤。[证据 / HIGH：[MCP 合约][W-api]] | record 有收入/支出/转账类型；paired transfer 是关联的两条记录，也允许 unpaired。Android 可拆为不同分类的新记录；iOS/Web 帮助标记不支持。统一父记录是否保留未知。[证据 / HIGH：[MCP][W-api]、[平台差异][W-record]] | 有 initial balance，统计帮助说明如何汇总收支；**当前余额是否存储或缓存未找到公开证据**。[证据 / HIGH：[MCP][W-api]、[统计][W-stats]] |
| GnuCash | Book 内账户树同时包含资产、负债、收入、费用；“餐饮分类”对应费用账户，不是另一套分类表。Transaction 由至少两个 Split 组成；预算按账户×期间存金额。未找到与 Wallet labels 等价的通用标签实体证据。[证据 / HIGH：[交易概念][G-txn]、[SQL 模型][G-sql]] | 费用可分配到多个费用账户；银行互转、消费均使用 Transaction/Split，**有公开 SQL 同构证据**，但业务账户类型不同。[证据 / HIGH：[交易概念][G-txn]、[SQL 模型][G-sql]] | 公开 SQL 的账户表无当前余额字段，金额在 splits；引擎另提供余额接口。只能证明该后端模型，不声称“内存没有余额缓存”或适用于所有存储后端。[证据 / HIGH：[SQL][G-sql]、[引擎接口][G-engine]] |

**共性和不能混同的概念：**分类回答钱用于什么，账户回答钱在哪里或欠谁，标签提供另一维过滤；GnuCash 把前两者都表示为账户。至少这些样本支持分配一笔总额到多个用途，但拆分的父子关系、平台覆盖不同；不能直接设计成“每笔交易只能一个分类”，也不能把所有产品强行解释成复式账本。[推断 / MEDIUM，依据上表]

### HIGH：四款产品从记录到月度结论的路径

| 产品与平台范围 | 最短业务路径（文档步骤的组合） | 当月能回答什么 |
| --- | --- | --- |
| YNAB，Web/移动端 | Add Transaction → 金额、账户、收款人、分类 → 保存 → Reflect → Spending Breakdown → 选月份。分类页还可查看预算可用额。[证据 / HIGH：[录入][Y-add]、[月度报表][Y-report]] | 当月钱花在哪些分类、哪些分类净流入为正；分类分配和活动可辅助判断余量。[证据 / HIGH：[报表][Y-report]、[分类][Y-cat]] |
| Monarch，Web；移动报告已于 2026-06 发布 | Transactions → Add transaction → 选账户/金额/日期/商户/分类 → 保存 → Reports 选 This month；可保存相对日期报表。[证据 / HIGH：[录入][M-manual]、[保存报告][M-report]、[移动发布][M-mobile]] | 当月支出/现金流及分类结构；保存后下次不必重配日期。[证据 / HIGH：[保存报告][M-report]] |
| Wallet，Android | Records → `+` → Income/Expense/Transfer → 金额、账户、分类 → 保存 → Statistics/Reports 选本月。[证据 / HIGH：[录入][W-record]、[月度统计][W-month]；路径拼接 / MEDIUM] | 收支结构、现金流及相对上月的变化；预算另显示剩余和预估支出。[证据 / HIGH：[月度统计][W-month]、[预算][W-budget]] |
| GnuCash，桌面 v5 | 打开资金账户登记簿 → 日期/描述/对方费用账户/金额 → Enter → Reports 的费用报告或 Budget Report → 设月度区间和账户。[证据 / HIGH：[登记簿][G-enter]、[报告][G-report]] | 费用账户合计、预算与实际及差额；前提是选对费用账户和报告期间。[证据 / HIGH：[报告][G-report]] |

以上证明有这些操作和报告，不证明流程易用或用户会长期使用。第五款 MoneyWiz 的步骤及版本限制在后面的 MEDIUM 部分，避免把旧手册写成当前实测。[方法限制]

### HIGH：边界语义逐产品核对

#### 退款与冲减

| 产品 | 找到的证据与缺口 |
| --- | --- |
| YNAB | 退款流入原消费分类，返还可用额；报表可出现某分类本月净流入，官方举例为上月消费、本月报销。不是自动改写原月支出。[证据 / HIGH：[分类规则][Y-refund]、[跨月例子][Y-report]] |
| Monarch | 未找到足以确认原交易关联、部分多次退款、跨月归属的公开规则；不将其等同 YNAB。[未知 / LOW；检索范围：官方帮助与产品更新] |
| Wallet | 退款计 Income，原 Expense 保留，且不支持负 Expense；可排除专用账户或隐藏分类改变展示，官方不提供逐笔隐藏统计开关。[证据 / HIGH：[统计逻辑][W-stats]、[排除与退款][W-exclude]] |
| GnuCash | 从原费用账户反向转回信用卡负债账户，可用 reversing transaction 并修改日期，减少费用和欠款。[证据 / HIGH：[退款与还款][G-cc]] |

**常见做法 / 推断 MEDIUM：**本样本中可见“原费用冲减”和“退款收入”两条路线；不应删除原购买来伪装未发生。**公认标准：未找到统一的个人财务产品退款统计标准；Wallet 与 YNAB/GnuCash 已构成明确反例。**这不是对企业会计或税务准则的判断。[依据上表]

#### 账户间转账

| 产品 | 找到的证据与缺口 |
| --- | --- |
| YNAB | 使用 transfer payee；账户间两侧交易 ID 可关联。两端均在预算内与涉及 tracking 账户不能混为一谈，账户有 on_budget 标记。[证据 / HIGH：[交易分类][Y-refund]、[SDK][Y-txn]、[账户][Y-account]] |
| Monarch | Transfers 组和信用卡还款不进入预算、现金流或支出；两端分类均应正确。是否存在通用配对 ID 未找到公开证据。[证据 / HIGH：[转账][M-transfer]] |
| Wallet | linked records 可配对；同币种改金额传播到另一侧，跨币种不传播；银行识别可能因描述/金额/时间不一致失败。[证据 / HIGH：[MCP][W-api]、[统计][W-stats]] |
| GnuCash | 资产账户之间移动，与消费共用分录模型；涉及费用账户才形成费用。[证据 / HIGH：[交易概念][G-txn]] |

**常见做法 / 推断 MEDIUM：**自己两个资金账户之间移动应避免重复计收入和支出。**公认标准：未找到统一的数据表示标准**；分类排除、配对流水、复式分录并存。报表是否只覆盖预算内账户也要明示。[依据上表]

#### 分期与信用卡账单

| 产品 | 找到的证据与缺口 |
| --- | --- |
| YNAB | 信用卡还款是转账，在付款账户流出、卡账户流入，不能当第二次消费；官方另有 BNPL 指引，但本次未取得足够正文，不能确认其分期模型。[证据 / HIGH：[还款][Y-cc]；分期未知 / LOW：[指引入口][Y-bnpl]] |
| Monarch | 购买时计支出，部分或全额还卡均为转账。原消费转分期、手续费、账单实体和账单日归属未找到公开证据。[证据 / HIGH：[还款规则][M-transfer]；分期未知 / LOW] |
| Wallet | 信用卡账户可设额度、还款到期日，展示 Available Credit 或负数 Credit Balance；分期本金/利息及账单关联未找到公开证据。[证据 / HIGH：[信用卡][W-cc]；分期未知 / LOW] |
| GnuCash | 卡作为负债账户，消费增加负债和费用，银行还款减少资产和负债。消费转分期及国内账单自动解析未找到公开证据。[证据 / HIGH：[信用卡][G-cc]；分期未知 / LOW] |

**常见做法 / 推断 MEDIUM：**购买、欠款和还款至少应分开解释。**公认标准：未找到统一的分期确认时点或信用卡账单实体标准**；不能把“支持信用卡”推成“支持花呗/银行账单分期”。发生额、实际付款额、剩余本金三者会给出不同月度结论。[依据上表]

#### 多币种

| 产品 | 找到的证据与缺口 |
| --- | --- |
| YNAB | 官方建议每种货币单独 Plan，跨 Plan 分别记发出、收到；同一 Plan 内账户使用同币种。[证据 / HIGH：[多币种指南][Y-fx]] |
| Monarch | 官方说明不区分 USD/CAD、不换算，只统一显示 `$`，不能把美加可用理解为多币种账本。[证据 / HIGH：[币种限制][M-fx]] |
| Wallet | 每账户一种币，汇率夜间更新或手设；MCP 支持跨币转账和历史汇率聚合。市场汇率不保证等于银行实际成交价。[证据 / HIGH：[汇率][W-fx]、[MCP][W-api]] |
| GnuCash | 每账户有币种/商品单位，交易有自身币种，分录同时记录数量与价值，可维护汇率并选择报告币种。[证据 / HIGH：[多币种][G-fx]、[SQL][G-sql]] |

**常见做法 / 推断 MEDIUM：**支持多币种时需区分原币、资金账户币和报告币。**公认标准：未找到统一换算日期、汇差和手续费统计标准**；上述产品甚至不都支持同一账本换汇。[依据上表]

#### 修改历史流水

| 产品 | 找到的证据与缺口 |
| --- | --- |
| YNAB | 可改/删已有交易，报表可下钻到交易再编辑。API 有 deleted 标记，但它是同步合约，不能当成完整修订审计日志。[证据 / HIGH：[编辑][Y-add]、[报表][Y-report]、[SDK][Y-txn]] |
| Monarch | 历史分类和拆分可改；Retail Sync 重同步指定历史范围可能覆盖手工分类/拆分。没有证据支持“账本不可变”。[证据 / HIGH：[拆分][M-split]、[覆盖规则][M-retail]] |
| Wallet | 手动记录可编辑；MCP 的银行同步记录锁定金额、日期、状态、账户，仅放开类别/标签/备注等。修订审计和重算策略未公开。[证据 / HIGH：[编辑][W-record]、[MCP][W-api]] |
| GnuCash | 登记簿可选字段或展开 Split 修改。不能将其解释成必须冲销后重记的产品。[证据 / HIGH：[修改操作][G-edit]] |

**常见做法 / 推断 MEDIUM：**用户可纠错，但同步来源字段可能受限。**公认标准：未找到个人账本统一的锁账或修订标准**。New money 必须先说明历史报表会随修改变化，还是另保留发布时快照；目前证据不能替成员作这个选择。[依据上表]

#### 删除账户后历史数据

| 产品 | 找到的证据与缺口 |
| --- | --- |
| YNAB | Close 保留历史并停止计划流水；Delete 通常要求先移除交易。非零余额关闭可能生成调整交易，影响预算。[证据 / HIGH：[关闭与删除][Y-delete]] |
| Monarch | 只删连接可停止同步且保留历史；连账户和交易一起删除会永久移除。单账户 Undelete 只恢复交易、不恢复余额历史。[证据 / HIGH：[删除层级][M-delete]] |
| Wallet | MCP 拒绝删除仍被流水/预算引用的账户；**不能等同 UI 行为**。Archive 保留数据，但官方提示可能影响历史统计展示；UI 永久删除级联规则未找到公开证据。[证据 / HIGH：[MCP][W-api]、[归档影响][W-archive]] |
| GnuCash | v5 手册警告删除会移除账户及相关交易信息并可能出现不平衡；项目 Wiki 另说明可把交易移往别的账户。应按具体对话框选项复核，不能概括成“删除一定留历史”。[证据 / HIGH：[v5 手册][G-delete]、[项目 Wiki][G-usage]] |

**常见做法 / 推断 MEDIUM：**关闭/隐藏/归档与永久删除应区分。**公认标准：未找到统一历史保留或统计纳入规则**，Wallet 的归档统计差异也是反例。[依据上表]

### HIGH：国内账单导入的已公开实现

| 路径 | 找到的证据 | 不能据此承诺什么 |
| --- | --- | --- |
| 微信用户导出 | 财付通政策写明“我→服务→钱包→账单→常见问题→下载账单”，覆盖消费、转账、充值、提现、退款等。[证据 / HIGH：[官方政策][I-tenpay]；2022 年文本，提示入口可能调整] | 未实测当前版本按钮、文件格式、窗口限制，也不证明存在开放的个人流水 API。 |
| 银行用户下载 | 中信官方支持按卡、周期、最小金额申请并下载带电子签章的流水证明。[证据 / HIGH：[官方说明][I-citic]] | 未承诺提供 CSV/XLSX；电子证明下载不等于机器可读接口。 |
| 导出文件→格式解析 | `china_bean_importers` 的支付宝移动解析器用 GBK、查找业务表头，保留订单号/状态，读取付款方式映射资金账户；微信解析 CSV/XLSX，读取交易号、状态、方向并特殊处理充值、还款、退款。[证据 / HIGH：[支付宝源码][I-alipay-code]、[微信源码][I-wechat-code]，固定 SHA] | 不代表原始付款方式/状态均完整留存，也不证明当前所有版本文件都兼容。 |
| 银行 PDF→文本提取 | 同项目招商银行借记卡解析器按文本坐标取日期、金额、余额等，并区分“客户摘要”列布局。[证据 / HIGH：[源码][I-cmb]] | 不代表银行格式统一，也不证明扫描 PDF/OCR 或其他银行可用。 |
| 映射预览→确认入账 | ezBookkeeping 文档列出支付宝 App/Web、微信及 OFX/QFX/QIF、camt、MT940 等导入，提供账户/分类/标签映射和预览选择。[证据 / HIGH：[维护者文档][I-ez]] | 支持这些交换格式，不等于国内每家银行都向普通用户开放它们。 |

**解析与去重必须分开：**上面两份 `extract` 接收 `existing_entries`，函数体并未使用它完成通用订单号去重。保留 serial 不等于已实现幂等；该仓库的 `dedup.py` 也有专门业务范围。[证据 / HIGH：[支付宝][I-alipay-code]、[微信][I-wechat-code]、[专门去重][I-dedup]]

**跨来源匹配的公开案例：**FinancialBeancount 的 L1 使用日期、分单位金额、归一化对手、方向，运行时要求跨平台且时间差不超过 120 秒；L2 放宽对手但限定平台组合和时差；L3 用一天/一元容差产出复核候选，另保存文件状态及已见指纹。这里只验证源码，未运行算法或测准确率，更不是行业标准。[证据 / HIGH：[指纹][I-fingerprint]、[引擎][I-engine]、[状态][I-state]，固定 SHA]

| 常见坑 | 可核验依据与对 New money 的含义 |
| --- | --- |
| 编码、表头说明行、CSV/XLSX 与版本漂移 | 解析器含 GBK、表头定位和不同格式分支。[证据 / HIGH：[支付宝][I-alipay-code]、[微信][I-wechat-code]] 未知列或状态应报警/待映射，不能静默丢行。[推断 / MEDIUM] |
| 正负号不足以判断经济事件 | 微信 `/`、支付宝“不计收支”等需结合交易类型；退款、失败、退还、组合支付需要特判。[证据 / HIGH：同上] 充值、提现、信用卡还款不能一律当消费。[推断 / MEDIUM] |
| 重导同文件、重叠日期与状态更新 | 两份源码保留交易号；支付宝另保留状态，微信主要根据状态筛选或加标签。[证据 / HIGH：同上] New money 的同源幂等候选键可含来源+所属账户+交易号，但同号状态变化应更新/复核，不能全部丢弃；退款是否复用订单号要看样本。这是建议，不是现有解析器已实现的能力。[建议 / MEDIUM] |
| 银行和钱包重复呈现同一笔 | 已有跨源匹配代码，但相同金额/时间只是线索。[证据 / HIGH：[跨源引擎][I-engine]] “支付宝支付”可能扣银行卡，不能同时减支付宝余额和银行余额；跨源匹配与同源重导是两件事。[推断 / MEDIUM] |
| 同分钟同额两笔、跨日入账、部分退款 | 指纹容差存在碰撞和漏配边界。[推断 / MEDIUM，依据 [匹配规则][I-engine]] 不宜仅按日期+金额硬删除；保留两条来源与匹配理由供撤销。 |
| PDF 坐标和账户信息缺失 | PDF 解析依赖布局。[证据 / HIGH：[招商源码][I-cmb]] 网页支付宝导出缺付款账户是维护者报告，非官方保证。[证据 / MEDIUM：[操作说明][I-readme]] 不能据平台名猜资金账户。[推断 / MEDIUM] |

### MEDIUM：MoneyWiz 与尚未证实的国内路径

**MoneyWiz 的版本限制：**现行官网宣称支持自定义多级分类、标签预算、手动/银行导入和多种报表；细节依赖官方《MoneyWiz 2022 offline guide》，其声明准确截至 **2021-12-14**。在线帮助本次未返回可读正文，因此以下旧版细节对当前产品均仅 MEDIUM；未找到足以确认 2026 行为的公开证据。[证据 / HIGH：现行[官网][MW-home]；版本受限证据 / MEDIUM：[旧手册][MW-guide]]

| 问题 | 旧版公开行为（均为证据 / MEDIUM，出处为上述手册章节） |
| --- | --- |
| 记录→月度结论 | 选账户新增收入/支出，填金额与分类并保存；Reports 选分类报表与月度区间（§2.1、§6.1）。 |
| 实体与拆分 | 账户/组、交易、分类、标签、预算；支持分类/账户拆分，不支持混合收支拆分（§2.12、§2.16–18、§3）。 |
| 退款冲减 | 原消费可全额/部分 Refund；Reimbursement 可负支出（§2.11）。 |
| 转账 | 银行下载可能是收支两笔，再尝试识别转账；内部物理模型未知（§2.10）。 |
| 余额 | 可按新流水计算；也可每次刷新读银行余额、调整起始余额；物理缓存未知（§7.6）。 |
| 信用卡与分期 | 未找到足以确认当前信用卡账单实体/分期关系的公开证据；不能从支持贷款或计划流水补推。 |
| 多币种 | 可设本位币，用于净资产和多币种报告（§7.10）；当前历史汇率细则未知。 |
| 修改历史 | 普通交易可编辑；调整余额交易仅可删除，不能修改（§2.2、§2.13）。 |
| 删除账户 | 会删相关流水，转账两侧也删除；建议归档（§1.5–6）。 |

这五款的对比说明：哪怕共用“退款”“余额”“删除”几个名称，规则也不能互换；MoneyWiz 旧版资料进一步提示版本本身就是语义风险。[推断 / MEDIUM，依据前述对照]

**支付宝导出：**维护者指引为“我的→账单→…→开具交易流水证明→用于个人对账”，邮件取得 CSV；钱迹的旧指引还描述加密 ZIP 及另行获取解压密码。**未找到可确认的支付宝官方当前手机端个人导出说明**，需在用户版本复核。[证据 / MEDIUM：[导入器说明][I-readme]、[钱迹说明][I-qianji]]

**接口判断：**本次未找到公开可申请、可读取普通用户支付宝/微信完整个人历史流水的接口证据；这是检索结论，不是“不存在接口”。已找到支付宝商家账单文档，不能将商户权限推为个人授权能力。文件导出→预览→确认是有实现依据的验证方向，自动同步仍未证实。[证据 / MEDIUM：[商家账单][I-merchant]；推断 / MEDIUM，依据上述公开导入器]

### MEDIUM：哪里可能留住人，以及哪些语义必须早定

**未找到五款产品能够验证“某一步导致留存”的公开因果数据。**下面只是假设，不能作为竞品留存结论。[证据缺口 / LOW]

| 产品 | 最可能产生持续价值的一步（推断 / MEDIUM） | 依据 |
| --- | --- | --- |
| YNAB | 记录后知道某分类还可花多少，再把实际与计划对照。 | [当期分类可用额][Y-cat]、[月度反思][Y-report] |
| Monarch | 自动整理后审阅，再反复打开保存的相对月份报表，减少重复设置。 | [Review/Smart Split][M-split]、[保存报告][M-report] |
| Wallet | 查看预算剩余、预估月底支出，用于下一次消费判断。 | [预算帮助][W-budget] |
| GnuCash | 对账后能从月度费用追溯到平衡分录，建立可信度。 | [信用卡对账流程][G-chapter-cc]、[报告][G-report] |
| MoneyWiz | 将分类/标签自动纳入预算和常用报表，减少整理劳动。 | 现行[官网][MW-home] |

**写账本前需要成员明确的最小语义清单（建议 / MEDIUM，依据以上反例）：**

| 必须早定的词 | 可供选择的规则与不可回避的例子 |
| --- | --- |
| 月度支出/退款 | 当月净支出、消费发生额还是实际付款额？9 月买 100、10 月退 30，要不要改 9 月？需要同时保留购买和退款日期吗？ |
| 账户/支付渠道/转账 | 银行卡经支付宝消费算哪个资金账户？现金转储蓄是否有两条关联流水？未导入另一侧时算不算待配对？ |
| 余额 | 起始余额+流水结果、银行最新快照和可用额度分别叫什么？差额由补录、调整流水还是改起始余额解释？ |
| 交易/拆分/标签 | 总额 100 分餐饮 60/日用 40时，报表只统计分项；标签是否允许交叉统计、避免相加虚增？ |
| 信用卡/分期 | 购买、账单、还款、利息分开还是只跟踪现金？购买 1200 分 12 期不能同时计 1200 和每月 100 的消费。 |
| 币种/历史修订/账户生命周期 | 单币种还是原币+报告币？改日期是否重算旧月？“关闭”是否保留统计、“删除”是否影响另一侧？ |
| 导入记录/经济事件 | 同源重导和跨源匹配分开；明确修改过的交易重导时更新、跳过还是待确认，以及如何撤销匹配。 |

这里列的是待决口径，不是技术选型、已确认领域模型或实施排期。[边界说明]

## 主要风险与反证

### 什么情况下这个判断是错的

| 本文判断/假设 | 反证成立的情况 | 能尽早发现的信号 |
| --- | --- | --- |
| 单币种先验证足够。[推断 / MEDIUM] | 目标用户日常跨币消费/资产占比高，人民币单账本无法回答主要问题。 | 用户频繁手算汇率、无法解释余额；访谈账本主要是外币。 |
| 文件导入可覆盖初步需求。[推断 / MEDIUM] | 当前客户端不能导出、格式变动、只有扫描 PDF、关键账户或状态缺失。 | 表头拒识、笔数/总额对不上、频繁人工补资金账户。依据：[解析器][I-alipay-code]、[银行布局][I-cmb]。 |
| 记录后月度复盘有留存价值。[推断 / LOW，尚无需求数据] | 用户只关心即时限额、还款提醒或净资产，不愿月度复盘。 | 用户看完月报仍不能决定下一步，真实使用不返回报告；需访谈验证。 |
| 转账/退款语义可被一套简单规则解释。[推断 / MEDIUM] | 用户要报销往来、共同账户、利息、优惠和部分退款的不同口径。 | 同五笔样本在产品间月报不同，用户持续更改收入/支出归类。反例：[Wallet 退款][W-stats]、[GnuCash 退款][G-cc]。 |
| 相近金额/日期可以帮助跨源匹配。[推断 / MEDIUM] | 两笔真实同额付款落在同一容差窗口，或银行入账延迟超出窗口。 | 去重被撤销、正常交易消失、消费与余额差额扩大。依据：[匹配源码][I-engine]。 |
| 公开文档代表当前可用能力。[推断 / MEDIUM] | 平台、地区、订阅或版本不同；帮助过时。 | 实际界面与文档不符；Wallet Android 拆分不能在 iOS 重现，MoneyWiz 旧行为变化。依据：[平台差异][W-record]、[旧版范围][MW-guide]。 |

**其他限制：**未对中国市场需求强度、导入成功率、五款产品留存和付费转化作出结论；未找到相应公开证据，也未进行访谈。现成解析器只证明技术路线有案例，不证明正确率、维护成本或国内个人账户自动同步权限。[范围判断 / HIGH]

## 下一步最小验证动作（一天内能做完）

以下是一次验证实验的范围，不是项目排期；不需要产品代码、付费数据或用户账号。[建议 / MEDIUM]

1. **写一页口径选择表并用合成账核对。** 起始银行 1000、钱包 0、信用卡欠款 0；9 月银行买日用 100（60/40 拆分）、10 月退 30、银行转钱包 50、信用卡消费 20 后银行还卡 20、再加一笔分期示例。分别写出月度消费/现金流/账户余额；改日期、关闭账户后再解释结果。净支出路线下，未加分期且不改历史时应为银行 860、钱包 50、卡欠款 0，9 月支出 100、10 月净支出 -10；Wallet 式口径则 10 月收入 30、支出 20。**这些数字是合成数据手算对照，未在竞品中执行。** 验收是每个结果有明确规则，不能靠“像某竞品”解释。
2. **做一张导入反例对照表。** 用公开虚构样本/手工合成行覆盖：同文件重导、重叠范围、同分钟同额两笔、部分退款、失败支付、充值/提现、信用卡还款、跨日入账、组合支付、银行/钱包两源重复。逐行标“新增/同源更新/待配对/拒绝”及原因。验收是合成笔数、金额和余额解释一致，未知格式不被静默接受；不宣称真实平台兼容性已通过。
3. **将缺口交给 Mika 组织获取。** 需要成员自愿提供的脱敏支付宝个人 CSV、微信当前 CSV/XLSX、至少一家目标银行借记卡流水和信用卡账单，附版本、导出入口、选项；还需一轮真实用户访谈确认月报/预算/还款谁是主要价值。只保留验证必需字段，不索取密码或登录凭据。当前没有这些资料，因此真实导入成功率和留存假设仍未验证；不阻止交付本次公开研究。

## 给 New money MVP 的建议取舍

1. **建议延续产品草案的单币种记录→月度概览。** 账户核对只作为合成数据的语义实验，不要求 MVP 新增账户管理、预算或趋势报表；分期、多币种保持未覆盖，范围由成员拍板。[建议 / MEDIUM，依据前述产品草案、[YNAB 币种限制][Y-fx]、[Monarch 余额独立][M-manual]及分期证据缺口]
2. **建议先约定能追溯的退款、转账和账户关闭规则。** 倾向保留原购买与退款，内部转账排除消费，关闭保留历史；是否采用净支出、是否重算旧月须书面选择，不能以“行业标准”代替决定。[建议 / MEDIUM，依据 [Wallet 反例][W-stats]、[YNAB 关闭][Y-delete]、[GnuCash 删除风险][G-delete]]
3. **建议 MVP 保持草案的 JSON 搬迁能力，外部账单导入仅做离线可行性验证。** 若成员以后纳入范围，再验证预览、同源幂等和可撤销的跨源匹配；拿到脱敏样本前，不承诺支付宝/微信/银行全部兼容或个人账户自动同步。[建议 / MEDIUM，依据前述产品草案、[公开导入路径][I-ez]、[匹配边界][I-engine]]

[Y-account]: https://github.com/ynab/ynab-sdk-js/blob/b1c4c0387c02de9fab2b41775eb8f14184261e09/src/models/Account.ts
[Y-txn]: https://github.com/ynab/ynab-sdk-js/blob/b1c4c0387c02de9fab2b41775eb8f14184261e09/src/models/TransactionDetail.ts
[Y-sub]: https://github.com/ynab/ynab-sdk-js/blob/b1c4c0387c02de9fab2b41775eb8f14184261e09/src/models/SubTransaction.ts
[Y-cat]: https://github.com/ynab/ynab-sdk-js/blob/b1c4c0387c02de9fab2b41775eb8f14184261e09/src/models/Category.ts
[Y-import]: https://support.ynab.com/en_us/how-direct-import-works-H1IGYLgnxl
[Y-add]: https://support.ynab.com/en_us/how-to-add-transactions-in-ynab-HyDwA_byi
[Y-report]: https://support.ynab.com/en_us/spending-breakdown-H1H7YxmD0
[Y-refund]: https://support.ynab.com/en_us/getting-started-transactions-and-categories-SJejV3szx
[Y-cc]: https://support.ynab.com/en_us/credit-card-payments-a-guide-r1_506Q1j
[Y-bnpl]: https://support.ynab.com/en_us/managing-buy-now-pay-later-purchases-in-ynab-an-overview-BJrmfNdVj
[Y-fx]: https://support.ynab.com/en_us/using-multiple-currencies-in-ynab-a-guide-SyBF6PHno
[Y-delete]: https://support.ynab.com/how-to-close-or-delete-an-account-in-ynab-ry_409Gko
[M-manual]: https://help.monarchmoney.com/hc/en-us/articles/360058441811-Manual-transactions
[M-budget]: https://www.monarch.com/blog/flex-vs-category-budgeting-how-to-choose-whats-right-for-you
[M-split]: https://www.monarch.com/blog/review-on-the-go-and-smart-split
[M-transfer]: https://help.monarch.com/hc/en-us/articles/360048393292-Transfers-and-Credit-Card-Payments
[M-delete]: https://help.monarch.com/hc/en-us/articles/360054863431-Delete-a-Connection-Financial-Institution-vs-Delete-an-Account
[M-report]: https://www.monarch.com/blog/saved-reports-and-more
[M-mobile]: https://www.monarch.com/blog/june-product-update
[M-fx]: https://help.monarch.com/hc/en-us/articles/360048393552-International-Accounts-and-Currency
[M-retail]: https://help.monarch.com/hc/en-us/articles/36463599367188-Using-the-Retail-Sync-Extension
[W-api]: https://mcp.wallet.budgetbakers.com/docs
[W-record]: https://support.budgetbakers.com/hc/en-us/articles/7149271363090-Everything-About-Transactions-Add-edit-clone-split-duplicates
[W-stats]: https://support.budgetbakers.com/hc/en-us/articles/31001090941970-Understanding-Your-Wallet-Statistics
[W-exclude]: https://support.budgetbakers.com/hc/en-us/articles/36544649033618-How-to-exclude-an-account-records-or-transfers-from-your-statistics
[W-month]: https://support.budgetbakers.com/hc/en-us/articles/36546774821778-What-does-the-percentage-next-to-Income-Expenses-mean
[W-budget]: https://support.budgetbakers.com/hc/en-us/articles/7076953735314-Setup-Budgets
[W-cc]: https://support.budgetbakers.com/hc/en-us/articles/6950259945362-Adding-a-Credit-Card
[W-fx]: https://support.budgetbakers.com/hc/en-us/articles/7149418777746-Multiple-Currencies-Exchange-Rates
[W-archive]: https://support.budgetbakers.com/hc/en-us/articles/36544201479186-Archiving-an-account-vs-Exclude-from-statistics-what-s-the-difference
[G-txn]: https://www.gnucash.org/docs/v5/C/gnucash-guide/chapter_txns.html
[G-sql]: https://wiki.gnucash.org/wiki/SQL
[G-engine]: https://wiki.gnucash.org/docs/STABLE/group__Account.html
[G-enter]: https://www.gnucash.org/docs/v5/C/gnucash-manual/trans-enter.html
[G-report]: https://www.gnucash.org/docs/v5/C/gnucash-manual/report-classes.html
[G-cc]: https://www.gnucash.org/docs/v5/C/gnucash-guide/cc-enterpay1.html
[G-chapter-cc]: https://www.gnucash.org/docs/v5/C/gnucash-guide/chapter_cc.html
[G-fx]: https://www.gnucash.org/docs/v5/C/gnucash-guide/currency_manual.html
[G-edit]: https://www.gnucash.org/docs/v5/C/gnucash-manual/trans-edit.html
[G-delete]: https://www.gnucash.org/docs/v5/C/gnucash-manual/acct-delete.html
[G-usage]: https://wiki.gnucash.org/wiki/Using_GnuCash
[MW-home]: https://www.wiz.money/
[MW-guide]: https://assets.wiz.money/MoneyWiz_Guide.pdf
[I-tenpay]: https://posts.tenpay.com/posts/058dfefe62bd931d0b6ab94206333129.html
[I-citic]: https://www.citicbank.com/personal/trans_flow/
[I-ez]: https://ezbookkeeping.mayswind.net/export_and_import/
[I-readme]: https://github.com/jiegec/china_bean_importers/blob/0c69ec90f2b48f044481d14492ed90e5449ac315/README.md
[I-alipay-code]: https://github.com/jiegec/china_bean_importers/blob/0c69ec90f2b48f044481d14492ed90e5449ac315/china_bean_importers/alipay_mobile/__init__.py
[I-wechat-code]: https://github.com/jiegec/china_bean_importers/blob/0c69ec90f2b48f044481d14492ed90e5449ac315/china_bean_importers/wechat/__init__.py
[I-cmb]: https://github.com/jiegec/china_bean_importers/blob/0c69ec90f2b48f044481d14492ed90e5449ac315/china_bean_importers/cmb_debit_card/__init__.py
[I-dedup]: https://github.com/jiegec/china_bean_importers/blob/0c69ec90f2b48f044481d14492ed90e5449ac315/china_bean_importers/dedup.py
[I-qianji]: https://docs.qianjiapp.com/other/import_guide_alipay_app.html
[I-merchant]: https://help.alipay.com/enterprise/knowledgeDetail.htm?knowledgeId=201603401890
[I-fingerprint]: https://github.com/CacinieP/FinancialBeancount/blob/1b8e157eb38c9d303055cdf405b27c5b8679a6a7/beancount_dedup/fingerprinter.py
[I-engine]: https://github.com/CacinieP/FinancialBeancount/blob/1b8e157eb38c9d303055cdf405b27c5b8679a6a7/beancount_dedup/deduplicator.py
[I-state]: https://github.com/CacinieP/FinancialBeancount/blob/1b8e157eb38c9d303055cdf405b27c5b8679a6a7/beancount_dedup/state.py

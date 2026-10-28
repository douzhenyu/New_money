/* 仅用于设计评审的交互演示，生产计算内核由 Dev 实现。 */
const fields = ["A", "S", "E", "r", "w"];
const presets = {
  empty: { A: "", S: "", E: "", r: "10", w: "4" },
  filled: { A: "1000000", S: "100000", E: "200000", r: "10", w: "4" },
  "zero-rate": { A: "1000000", S: "100000", E: "200000", r: "0", w: "4" },
  "no-saving": { A: "1000000", S: "0", E: "200000", r: "10", w: "4" }
};
const direction = document.documentElement.dataset.direction;
const storageKey = "new-money-l1-design-" + direction;
const requested = new URLSearchParams(location.search).get("state");
let initial = presets[requested] || presets.empty;
if (!requested) {
  try { initial = { ...initial, ...JSON.parse(localStorage.getItem(storageKey) || "{}") }; }
  catch { document.getElementById("save-status").textContent = "本机记录暂不可用"; }
}
fields.forEach(id => { document.getElementById(id).value = initial[id]; });
const money = n => {
  const abs = Math.abs(n);
  const scale = abs >= 1e8 ? 1e8 : abs >= 1e4 ? 1e4 : 1;
  return (n / scale).toLocaleString("zh-CN", { maximumFractionDigits: 2 }) +
    (scale === 1e8 ? " 亿元" : scale === 1e4 ? " 万元" : " 元");
};
function yearsTo(A, S, r, target) {
  if (A >= target) return "已达成 · 0 年";
  if (S <= 0) return "按当前储蓄无法到达";
  let asset = A;
  for (let t = 1; t <= 60; t++) {
    asset = asset * (1 + r) + S;
    if (asset >= target) return t + " 年";
  }
  return "60 年以上";
}
function render() {
  const raw = Object.fromEntries(fields.map(id => [id, document.getElementById(id).value.trim()]));
  const v = Object.fromEntries(fields.map(id => [id, raw[id] === "" ? null : Number(raw[id])]));
  const errors = {};
  fields.forEach(id => {
    if (v[id] !== null && (!Number.isFinite(v[id]) || Math.abs(v[id]) > Number.MAX_SAFE_INTEGER))
      errors[id] = "请填写可计算的数字";
  });
  if (v.A !== null && v.A < 0) errors.A = "总资产需大于或等于 0";
  if (v.E !== null && v.E < 0) errors.E = "年开销需大于 0";
  if (v.r !== null && (v.r <= 0 || v.r > 30)) errors.r = v.r <= 0 ? "收益率需大于 0" : "收益率需不高于 30%";
  if (v.w !== null && (v.w < 2.5 || v.w > 5)) errors.w = "提款率需在 2.5%–5%";
  fields.forEach(id => {
    document.getElementById(id + "-error").textContent = errors[id] || "";
    document.getElementById(id).setAttribute("aria-invalid", errors[id] ? "true" : "false");
  });
  const commonReady = ["A", "S", "r"].every(id => v[id] !== null && !errors[id]);
  const targets = [commonReady ? v.S / (v.r / 100) : null,
    commonReady && v.E !== null && v.E > 0 && !errors.E ? v.E / (v.r / 100) : null,
    commonReady && v.E !== null && v.E > 0 && !errors.E && v.w !== null && !errors.w ? v.E / (v.w / 100) : null];
  const progresses = [];
  targets.forEach((target, i) => {
    let percent = "未计算", gap = "等待填写", years = "—", progress = null;
    if (target !== null && target > 0) {
      progress = Math.min(v.A / target, 1) * 100;
      percent = v.A >= target ? "已达成 · 100%" : progress.toFixed(1).replace(/\.0$/, "") + "%";
      gap = v.A >= target ? "目标已覆盖" : "还差 " + money(target - v.A);
      years = yearsTo(v.A, v.S, v.r / 100, target);
    } else if (target !== null) {
      // shortcut: 非正储蓄产生非正目标，候选呈现待成员确认，不伪造百分比。
      percent = "无正储蓄可对照"; gap = "查看其余灯塔";
      years = "—";
    } else if (i > 0 && v.E === 0) {
      percent = "未填开销"; gap = "请填写大于 0 的年开销";
    } else if (errors.r) {
      percent = "暂停测算"; gap = "请先修改收益率";
    } else if (Object.keys(errors).length) {
      gap = "请检查输入提示";
    }
    document.getElementById("target-" + i).textContent = target === null ? "—" : money(target);
    document.getElementById("percent-" + i).textContent = percent;
    document.getElementById("gap-" + i).textContent = gap;
    document.getElementById("years-" + i).textContent = years;
    document.getElementById("fill-" + i).style.width = (progress ?? 0) + "%";
    const track = document.getElementById("track-" + i);
    if (progress !== null) track.setAttribute("aria-valuenow", progress.toFixed(1));
    else track.removeAttribute("aria-valuenow");
    track.setAttribute("aria-valuetext", percent + "，" + gap);
    progresses.push(progress);
  });
  let headline = "填 4 个数，10 分钟";
  let detail = "记录资产与收支，即时看三个财富灯塔的差距。";
  if (Object.keys(errors).length) {
    headline = errors.r || "请检查标出的输入";
    detail = "修改后即时重新测算；空白不会当作 0。";
  } else if (commonReady) {
    const reached = targets.map((target, i) => target > 0 && v.A >= target ? i : -1).filter(i => i >= 0);
    const next = targets.map((target, i) => ({ target, i })).filter(x => x.target > v.A).sort((a, b) => a.target - b.target)[0];
    if (v.S <= 0) {
      headline = "年储蓄不为正，先看已有资产覆盖";
      detail = "未达灯塔按当前储蓄无法到达；灯塔一暂无正储蓄可对照。";
    } else if (next) {
      headline = (reached.length ? "已达成灯塔" + reached.map(i => ["一", "二", "三"][i]).join("、") + "；" : "") +
        "距灯塔" + ["一", "二", "三"][next.i] + "还差 " + money(next.target - v.A);
      detail = "保持当前储蓄与自填收益率，查看各灯塔预计年数。";
    } else if (targets.every(t => t !== null)) {
      headline = "三个财富灯塔均已达成";
      detail = "这是按当前输入得到的测算，未来收益并不保证。";
    } else {
      headline = "继续填写年开销，查看完整结果";
      detail = v.E === 0 ? "灯塔二、三未填开销；0 与空白分别保留。" : "已填写的数值会保留，空白不会当作 0。";
    }
  }
  document.getElementById("conclusion").textContent = headline;
  document.getElementById("conclusion-detail").textContent = detail;
  document.getElementById("assumption-summary").textContent =
    "年化 " + (raw.r || "—") + "% / 提款 " + (raw.w || "—") + "% · 未计入通胀与税费";
  clearTimeout(render.announce);
  render.announce = setTimeout(() => {
    document.getElementById("live-status").textContent = headline + "。" + detail;
  }, 450);
  return raw;
}
fields.forEach(id => document.getElementById(id).addEventListener("input", () => {
  const raw = render();
  try {
    localStorage.setItem(storageKey, JSON.stringify(raw));
    document.getElementById("save-status").textContent = "已存本机";
  } catch { document.getElementById("save-status").textContent = "未能保存，先保留本页"; }
}));
render();

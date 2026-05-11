import {
  DEFAULT_SETTINGS,
  RECORD_MODES,
  SALARY_MODES,
  WORK_LIMITS,
  buildCalendarDays,
  buildEntryFromShiftPreset,
  calculateCumulativeTaxForMonth,
  calculateEntryPay,
  calculateMonthlyPayroll,
  calculateTimeHours,
  deriveSalaryInsights,
  formatDate,
  getShiftPreset,
  inferDayType,
  mergeSettings,
  monthIndexFromDate,
  normalizeEntry,
  round2,
  summarizeYear,
  validateEntry,
  yearFromDate
} from "./calculations.js";
import {
  createId,
  exportBackup,
  importBackupText,
  loadState,
  saveState
} from "./storage.js";
import { exportYearCsv, exportYearExcel, shareYearReport } from "./export.js";

const app = document.querySelector("#app");
const now = new Date();
const today = formatDate(now);
let state = loadState();
let ui = {
  view: state.activeView || "calendar",
  year: now.getFullYear(),
  monthIndex: now.getMonth(),
  selectedDate: today,
  editingEntryId: "",
  entryError: "",
  notice: "",
  lastDeleted: null
};
const repairedOnLoad = repairRepeatedEntries();
if (repairedOnLoad) {
  ui.notice = `已合并 ${repairedOnLoad} 条重复工时记录`;
  saveState(state);
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];
const MODE_LABELS = {
  [SALARY_MODES.REGULAR_OVERTIME]: "正班+加班",
  [SALARY_MODES.BASE_OVERTIME]: "底薪+加班",
  [SALARY_MODES.COMPREHENSIVE]: "综合工时制",
  [SALARY_MODES.HOURLY]: "小时计算"
};
const DAY_TYPE_LABELS = {
  workday: "工作日",
  restday: "休息日",
  holiday: "法定节假日"
};
const MISSING_LABELS = {
  baseSalary: "底薪",
  standardMonthlyHours: "月标准小时",
  regularHourlyRate: "正班时薪",
  baseOvertimeRate: "加班基数",
  comprehensiveHourlyRate: "综合工时时薪",
  hourlyRate: "小时工时薪"
};

render();

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action], [data-view], [data-date], [data-preset], [data-delete-entry], [data-edit-entry], [data-delete-adjustment]");
  if (!target) return;

  if (target.dataset.view) {
    ui.view = target.dataset.view;
    state.activeView = ui.view;
    persist();
    render();
    return;
  }

  if (target.dataset.date) {
    ui.selectedDate = target.dataset.date;
    ui.year = yearFromDate(ui.selectedDate);
    ui.monthIndex = monthIndexFromDate(ui.selectedDate);
    ui.editingEntryId = "";
    ui.entryError = "";
    render();
    return;
  }

  if (target.dataset.preset) {
    ui.entryError = "";
    applyPresetToForm(target.dataset.preset);
    return;
  }

  if (target.dataset.editEntry) {
    ui.editingEntryId = target.dataset.editEntry;
    ui.entryError = "";
    render();
    return;
  }

  if (target.dataset.deleteEntry) {
    const deleted = state.entries.find((entry) => entry.id === target.dataset.deleteEntry);
    state.entries = state.entries.filter((entry) => entry.id !== target.dataset.deleteEntry);
    if (ui.editingEntryId === target.dataset.deleteEntry) ui.editingEntryId = "";
    ui.lastDeleted = deleted ? { type: "entry", payload: deleted } : null;
    persist("已删除工时记录，可撤销");
    render();
    return;
  }

  if (target.dataset.deleteAdjustment) {
    const deleted = state.adjustments.find((item) => item.id === target.dataset.deleteAdjustment);
    state.adjustments = state.adjustments.filter((item) => item.id !== target.dataset.deleteAdjustment);
    ui.lastDeleted = deleted ? { type: "adjustment", payload: deleted } : null;
    persist("已删除补扣记录，可撤销");
    render();
    return;
  }

  const action = target.dataset.action;
  if (action === "prev-month" || action === "next-month") {
    const delta = action === "next-month" ? 1 : -1;
    const date = new Date(ui.year, ui.monthIndex + delta, 1);
    ui.year = date.getFullYear();
    ui.monthIndex = date.getMonth();
    ui.selectedDate = formatDate(date);
    ui.editingEntryId = "";
    ui.entryError = "";
    render();
  }

  if (action === "today") {
    ui.year = now.getFullYear();
    ui.monthIndex = now.getMonth();
    ui.selectedDate = today;
    ui.editingEntryId = "";
    ui.entryError = "";
    render();
  }

  if (action === "clear-edit") {
    ui.editingEntryId = "";
    ui.entryError = "";
    render();
  }

  if (action === "export-csv") {
    exportYearCsv(state.entries, state.adjustments, state.settings, ui.year);
  }

  if (action === "export-excel") {
    exportYearExcel(state.entries, state.adjustments, state.settings, ui.year);
  }

  if (action === "share-report") {
    try {
      const shared = await shareYearReport(state.entries, state.adjustments, state.settings, ui.year);
      persist(shared ? "已打开分享" : "报表摘要已复制");
    } catch {
      persist("分享未完成");
    }
    render();
  }

  if (action === "backup") {
    exportBackup(state);
    persist("已导出备份");
    render();
  }

  if (action === "seed-demo") {
    seedDemoData();
    persist("已加入示例记录");
    render();
  }

  if (action === "repair-records") {
    const count = repairRepeatedEntries();
    if (count) {
      persist(`已合并 ${count} 条重复工时记录`);
    } else {
      const issue = findEntryIntegrityIssues()[0];
      if (issue) {
        ui.selectedDate = issue.date;
        ui.year = yearFromDate(issue.date);
        ui.monthIndex = monthIndexFromDate(issue.date);
        persist("已定位到需要手动检查的日期");
      } else {
        persist("没有发现异常工时");
      }
    }
    render();
  }

  if (action === "save-default-shift") {
    const defaultPreset = getShiftPreset(state.settings, state.settings.defaultPresetId);
    saveEntryObject(buildEntryFromShiftPreset(ui.selectedDate, defaultPreset, {
      settings: state.settings,
      dayType: inferDayType(ui.selectedDate, state.settings),
      source: "default-shift"
    }), "已套用默认班次", { strategy: "replace-main" });
  }

  if (action === "copy-previous") {
    copyPreviousEntry();
  }

  if (action === "quick-overtime") {
    saveEntryObject({
      date: ui.selectedDate,
      recordMode: RECORD_MODES.HOURS,
      dayType: inferDayType(ui.selectedDate, state.settings),
      regularHours: 0,
      overtimeHours: 2,
      totalHours: 2,
      target: "",
      note: "快速加班",
      source: "quick-overtime"
    }, "已设置 2 小时加班", { strategy: "replace-quick-overtime" });
  }

  if (action === "add-day-adjustment") {
    addAutoAdjustment(ui.selectedDate, "已添加日补扣");
    render();
  }

  if (action === "bulk-current-month") {
    bulkGenerateMonth();
  }

  if (action === "undo-delete") {
    undoDelete();
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const formId = form.getAttribute("id");
  if (formId === "entry-form") saveEntry(form);
  if (formId === "adjustment-form") saveAdjustment(form);
  if (formId === "settings-form") saveSettings(form);
});

document.addEventListener("input", (event) => {
  if (event.target.closest("#entry-form")) {
    ui.entryError = "";
    updateEntryPreview();
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.name === "recordMode") {
    document.querySelector("#entry-form")?.setAttribute("data-record-mode", event.target.value);
    updateEntryPreview();
  }

  if (event.target.id === "import-file" && event.target.files?.[0]) {
    try {
      const text = await event.target.files[0].text();
      state = importBackupText(text);
      state.settings = limitSettings(state.settings);
      persist("已导入备份");
      render();
    } catch {
      persist("导入失败，请检查备份文件");
      render();
    }
  }
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

function render() {
  state.settings = limitSettings(state.settings);
  app.innerHTML = `
    <div class="shell">
      ${renderSidebar()}
      <main class="main">
        ${renderTopbar()}
        ${renderReadiness()}
        ${ui.notice ? `<p class="notice" role="status">${escapeHtml(ui.notice)}${ui.lastDeleted ? ` <button type="button" data-action="undo-delete">撤销</button>` : ""}</p>` : ""}
        ${ui.view === "calendar" ? renderCalendarView() : ""}
        ${ui.view === "records" ? renderRecordsView() : ""}
        ${ui.view === "reports" ? renderReportsView() : ""}
        ${ui.view === "settings" ? renderSettingsView() : ""}
      </main>
      ${renderMobileNav()}
    </div>
  `;
  updateEntryPreview();
}

function renderSidebar() {
  return `
    <aside class="sidebar" aria-label="主导航">
      <div class="brand">
        <img src="./assets/icon.svg" alt="" width="40" height="40">
        <div>
          <strong>明薪工时</strong>
          <span>${MODE_LABELS[state.settings.salaryMode]}</span>
        </div>
      </div>
      <nav class="nav">
        ${navButton("calendar", "月历")}
        ${navButton("records", "记录")}
        ${navButton("reports", "报表")}
        ${navButton("settings", "设置")}
      </nav>
      <div class="privacy-note">数据保存在本机浏览器。</div>
    </aside>
  `;
}

function renderMobileNav() {
  return `
    <nav class="mobile-nav" aria-label="底部导航">
      ${navButton("calendar", "月历")}
      ${navButton("records", "记录")}
      ${navButton("reports", "报表")}
      ${navButton("settings", "设置")}
    </nav>
  `;
}

function navButton(view, label) {
  const active = ui.view === view ? "is-active" : "";
  return `<button class="nav-button ${active}" type="button" data-view="${view}" aria-current="${active ? "page" : "false"}">${label}</button>`;
}

function renderTopbar() {
  const payroll = calculateMonthlyPayroll(state.entries, state.adjustments, state.settings, ui.year, ui.monthIndex);
  const grossByMonth = summarizeYear(state.entries, state.adjustments, state.settings, ui.year).map((item) => item.grossBeforeTax);
  const tax = calculateCumulativeTaxForMonth(grossByMonth, state.settings, ui.monthIndex);
  const goalDelta = Number(state.settings.goals.monthlyIncome || 0) - (payroll.grossBeforeTax - tax.currentTax);
  return `
    <header class="topbar">
      <div>
        <p class="eyebrow">${ui.year} 年 ${MONTHS[ui.monthIndex]}</p>
        <h1>${ui.viewTitle || viewTitle(ui.view)}</h1>
      </div>
      <div class="month-controls" aria-label="月份切换">
        <button class="icon-button" type="button" data-action="prev-month" aria-label="上个月">‹</button>
        <button class="plain-button" type="button" data-action="today">今天</button>
        <button class="icon-button" type="button" data-action="next-month" aria-label="下个月">›</button>
      </div>
    </header>
    <section class="metric-strip" aria-label="本月汇总">
      ${metric("税前", money(payroll.grossBeforeTax))}
      ${metric("税后", money(payroll.grossBeforeTax - tax.currentTax))}
      ${metric("工时", `${payroll.totalHours}h`)}
      ${metric(goalDelta > 0 ? "距目标" : "超目标", money(Math.abs(goalDelta)))}
    </section>
  `;
}

function renderReadiness() {
  const insights = deriveSalaryInsights(state.settings);
  const missing = insights.missingConfig.map((key) => MISSING_LABELS[key] || key);
  const integrityIssues = findEntryIntegrityIssues();
  const backupText = state.backup?.lastExportedAt
    ? `最近备份 ${formatDateTime(state.backup.lastExportedAt)}`
    : "尚未备份";
  const derivedText = [
    insights.isDerived.regularHourlyRate ? `正班时薪 ${money(insights.regularHourlyRate)} 自动推算` : "",
    insights.isDerived.baseOvertimeRate ? `加班基数 ${money(insights.baseOvertimeRate)} 自动推算` : ""
  ].filter(Boolean).join("，");
  const needsAttention = missing.length || integrityIssues.length;
  const issueDates = integrityIssues.slice(0, 3).map((item) => item.date.slice(5)).join("、");
  return `
    <section class="readiness ${needsAttention ? "needs-attention" : ""}">
      <div>
        <strong>${integrityIssues.length ? `发现 ${integrityIssues.length} 天工时异常` : (missing.length ? `还差 ${missing.length} 项，工资可能算不准` : "工资规则已就绪")}</strong>
        <span>${integrityIssues.length ? `${issueDates} 超过合理上限，请整理或编辑` : (missing.length ? missing.join("、") : (derivedText || "每天记时间，系统会自动拆分正班和加班"))}</span>
      </div>
      <div>
        <span>${backupText}</span>
        ${integrityIssues.length ? `<button class="plain-button" type="button" data-action="repair-records">整理</button>` : `<button class="plain-button" type="button" data-view="settings">规则</button>`}
      </div>
    </section>
  `;
}

function renderCalendarView() {
  const days = buildCalendarDays(ui.year, ui.monthIndex);
  const entriesByDate = groupByDate(state.entries);
  const adjustmentsByDate = groupByDate(state.adjustments);
  const selectedEntries = entriesForDate(ui.selectedDate);
  const selectedAdjustments = adjustmentsForDate(ui.selectedDate);
  return `
    <div class="workspace calendar-layout">
      <section class="calendar-panel" aria-label="日历">
        <div class="weekday-grid">
          ${WEEKDAYS.map((day) => `<span>${day}</span>`).join("")}
        </div>
        <div class="calendar-grid">
          ${days.map((day) => renderDayCell(day, entriesByDate.get(day.date) || [], adjustmentsByDate.get(day.date) || [])).join("")}
        </div>
      </section>
      <section class="detail-panel" aria-label="每日记录">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${selectedDateLabel(ui.selectedDate)}</p>
            <h2>每日记录</h2>
          </div>
          ${ui.editingEntryId ? `<button class="plain-button" type="button" data-action="clear-edit">新增</button>` : ""}
        </div>
        ${renderDayStatus(selectedEntries)}
        ${renderDayCommandBar()}
        ${renderEntryForm()}
        ${renderSelectedDayList(selectedEntries, selectedAdjustments)}
      </section>
    </div>
  `;
}

function renderDayCommandBar() {
  const preset = getShiftPreset(state.settings, state.settings.defaultPresetId);
  const autoAmount = Number(state.settings.autoAdjustment?.amount || 0);
  return `
    <div class="command-strip" aria-label="快速记录">
      <button type="button" data-action="save-default-shift"><strong>套用${escapeHtml(preset?.name || "默认班次")}</strong><span>替换当天主记录</span></button>
      <button type="button" data-action="copy-previous"><strong>复制上次</strong><span>替换当天主记录</span></button>
      <button type="button" data-action="quick-overtime"><strong>加班 2h</strong><span>重复点击不叠加</span></button>
      <button type="button" data-action="add-day-adjustment"><strong>${autoAmount ? `补扣 ${money(autoAmount)}` : "补贴/扣款"}</strong><span>记录奖罚餐补</span></button>
    </div>
  `;
}

function renderDayStatus(entries) {
  const normalized = entries.map((entry) => normalizeEntry(entry, state.settings));
  const totalHours = round2(normalized.reduce((sum, entry) => sum + entry.totalHours, 0));
  const regularHours = round2(normalized.reduce((sum, entry) => sum + entry.regularHours, 0));
  const overtimeHours = round2(normalized.reduce((sum, entry) => sum + entry.overtimeHours, 0));
  const pay = round2(entries.reduce((sum, entry) => sum + calculateEntryPay(entry, state.settings).totalPay, 0));
  const isWarning = totalHours > WORK_LIMITS.maxDayHours;
  const text = entries.length
    ? `${entries.length} 条记录，正班 ${regularHours}h，加班 ${overtimeHours}h`
    : "当天还没有工时，先套班次或直接填时间";
  return `
    <div class="day-status ${isWarning ? "is-warning" : ""}">
      <div>
        <strong>${totalHours ? `${totalHours}h` : "未记录"}</strong>
        <span>${text}</span>
      </div>
      <div>
        <b>${money(pay)}</b>
        <span>当天上限 ${WORK_LIMITS.maxDayHours}h</span>
      </div>
    </div>
  `;
}

function renderDayCell(day, entries, adjustments) {
  const normalized = entries.map((entry) => normalizeEntry(entry, state.settings));
  const hours = round2(normalized.reduce((sum, entry) => sum + entry.totalHours, 0));
  const pay = round2(normalized.reduce((sum, entry) => sum + calculateEntryPay(entry, state.settings).totalPay, 0));
  const hasAdjustment = adjustments.length > 0;
  const classes = [
    "day-cell",
    day.inMonth ? "" : "is-muted",
    day.date === ui.selectedDate ? "is-selected" : "",
    day.date === today ? "is-today" : "",
    hours > 0 ? "has-work" : "",
    hasAdjustment ? "has-adjustment" : ""
  ].filter(Boolean).join(" ");
  return `
    <button class="${classes}" type="button" data-date="${day.date}">
      <span class="day-number">${Number(day.date.slice(8, 10))}</span>
      <span class="day-hours">${hours ? `${hours}h` : ""}</span>
      <span class="day-pay">${pay ? money(pay) : ""}</span>
    </button>
  `;
}

function renderEntryForm() {
  const editing = state.entries.find((entry) => entry.id === ui.editingEntryId);
  const entry = editing || {
    date: ui.selectedDate,
    recordMode: RECORD_MODES.TIME,
    dayType: "workday",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    regularHours: state.settings.normalHoursPerDay,
    overtimeHours: 0,
    totalHours: state.settings.normalHoursPerDay,
    note: "",
    target: ""
  };
  const recordMode = entry.recordMode || RECORD_MODES.TIME;
  return `
    <form id="entry-form" class="tool-form" data-record-mode="${recordMode}">
      <input type="hidden" name="id" value="${escapeAttr(entry.id || "")}">
      <div class="preset-grid" aria-label="班次模板">
        ${state.settings.shiftPresets.map((preset) => renderPresetButton(preset, entry)).join("")}
      </div>
      <div class="form-grid">
        ${field("日期", `<input name="date" type="date" value="${escapeAttr(entry.date || ui.selectedDate)}" required>`)}
        ${field("日期类型", `
          <select name="dayType">
            ${option("workday", "工作日", entry.dayType)}
            ${option("restday", "休息日", entry.dayType)}
            ${option("holiday", "法定节假日", entry.dayType)}
          </select>
        `)}
      </div>
      <div class="segmented" role="radiogroup" aria-label="记录方式">
        ${radio("recordMode", RECORD_MODES.TIME, "时间记录", recordMode)}
        ${radio("recordMode", RECORD_MODES.HOURS, "工时记录", recordMode)}
      </div>
      <div class="mode-fields time-fields">
        <div class="form-grid">
          ${field("上班", `<input name="startTime" type="time" value="${escapeAttr(entry.startTime || "09:00")}">`)}
          ${field("下班", `<input name="endTime" type="time" value="${escapeAttr(entry.endTime || "18:00")}">`)}
          ${field("休息分钟", `<input name="breakMinutes" type="number" min="0" max="${WORK_LIMITS.maxBreakMinutes}" step="1" value="${escapeAttr(entry.breakMinutes ?? 60)}">`)}
        </div>
      </div>
      <div class="mode-fields hour-fields">
        <div class="form-grid">
          ${field("正班小时", `<input name="regularHours" type="number" min="0" max="${WORK_LIMITS.maxRegularHours}" step="0.25" value="${escapeAttr(entry.regularHours ?? state.settings.normalHoursPerDay)}">`)}
          ${field("加班小时", `<input name="overtimeHours" type="number" min="0" max="${WORK_LIMITS.maxOvertimeHours}" step="0.25" value="${escapeAttr(entry.overtimeHours ?? 0)}">`)}
          ${field("总小时", `<input name="totalHours" type="number" min="0" max="${WORK_LIMITS.maxEntryHours}" step="0.25" value="${escapeAttr(entry.totalHours ?? "")}">`)}
        </div>
      </div>
      ${field("目标", `<input name="target" type="text" maxlength="40" value="${escapeAttr(entry.target || "")}" placeholder="本日目标">`)}
      ${field("备注", `<textarea name="note" rows="3" maxlength="160" placeholder="备注">${escapeHtml(entry.note || "")}</textarea>`)}
      <div id="entry-error" class="form-error" role="alert" ${ui.entryError ? "" : "hidden"}>${escapeHtml(ui.entryError)}</div>
      <div class="form-footer">
        <output id="entry-preview">0h / ¥0.00</output>
        <button class="primary-button" type="submit">${editing ? "保存修改" : "保存记录"}</button>
      </div>
    </form>
  `;
}

function renderPresetButton(preset, entry) {
  const active = matchesPreset(preset, entry);
  return `
    <button class="${active ? "is-active" : ""}" type="button" data-preset="${escapeAttr(preset.id)}">
      <strong>${escapeHtml(preset.name)}</strong>
      <span>${preset.recordMode === RECORD_MODES.TIME ? `${preset.startTime}-${preset.endTime}` : `${preset.totalHours || preset.regularHours + preset.overtimeHours}h`}</span>
    </button>
  `;
}

function renderSelectedDayList(entries, adjustments) {
  const entryList = entries.length
    ? entries.map((entry) => renderEntryItem(entry)).join("")
    : `<p class="empty">暂无工时记录</p>`;
  const adjustmentList = adjustments.length
    ? adjustments.map((item) => renderAdjustmentItem(item)).join("")
    : `<p class="empty">暂无补扣记录</p>`;
  return `
    <div class="day-lists">
      <h3>工时</h3>
      <div class="item-list">${entryList}</div>
      <h3>补扣</h3>
      <div class="item-list">${adjustmentList}</div>
    </div>
  `;
}

function renderEntryItem(entry) {
  const normalized = normalizeEntry(entry, state.settings);
  const pay = calculateEntryPay(entry, state.settings);
  const time = entry.recordMode === RECORD_MODES.TIME
    ? `${entry.startTime || "--:--"}-${entry.endTime || "--:--"}`
    : "工时录入";
  return `
    <article class="record-item">
      <div>
        <strong>${time}</strong>
        <span>${DAY_TYPE_LABELS[normalized.dayType]} · ${normalized.totalHours}h · ${money(pay.totalPay)}</span>
        ${entry.target ? `<small>目标：${escapeHtml(entry.target)}</small>` : ""}
        ${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ""}
      </div>
      <div class="item-actions">
        <button class="icon-button" type="button" data-edit-entry="${entry.id}" aria-label="编辑">✎</button>
        <button class="icon-button danger" type="button" data-delete-entry="${entry.id}" aria-label="删除">×</button>
      </div>
    </article>
  `;
}

function renderAdjustmentItem(item) {
  const isDeduction = item.type === "deduction";
  return `
    <article class="record-item">
      <div>
        <strong>${isDeduction ? "扣款" : "补贴"} · ${money(item.amount)}</strong>
        <span>${escapeHtml(item.category || "未分类")}</span>
        ${item.note ? `<small>${escapeHtml(item.note)}</small>` : ""}
      </div>
      <button class="icon-button danger" type="button" data-delete-adjustment="${item.id}" aria-label="删除">×</button>
    </article>
  `;
}

function renderRecordsView() {
  const monthEntries = state.entries
    .filter((entry) => entry.date?.startsWith(`${ui.year}-${String(ui.monthIndex + 1).padStart(2, "0")}`))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const monthAdjustments = state.adjustments
    .filter((item) => item.date?.startsWith(`${ui.year}-${String(ui.monthIndex + 1).padStart(2, "0")}`))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return `
    <div class="workspace two-column">
      <section class="detail-panel" aria-label="补扣记录">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${MONTHS[ui.monthIndex]}</p>
            <h2>补贴扣款</h2>
          </div>
          <button class="plain-button" type="button" data-action="bulk-current-month">批量工作日</button>
        </div>
        ${renderBulkPreview()}
        ${renderAdjustmentForm()}
      </section>
      <section class="detail-panel" aria-label="记录列表">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${monthEntries.length + monthAdjustments.length} 条</p>
            <h2>本月明细</h2>
          </div>
          <button class="plain-button" type="button" data-action="seed-demo">示例</button>
        </div>
        <div class="timeline">
          ${monthEntries.map((entry) => `<div><time>${entry.date}</time>${renderEntryItem(entry)}</div>`).join("") || `<p class="empty">暂无工时记录</p>`}
          ${monthAdjustments.map((item) => `<div><time>${item.date}</time>${renderAdjustmentItem(item)}</div>`).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderBulkPreview() {
  const preset = getShiftPreset(state.settings, state.settings.defaultPresetId);
  const dates = workDatesForMonth(ui.year, ui.monthIndex, state.settings.workweek);
  const existing = new Set(state.entries.map((entry) => entry.date));
  const pending = dates.filter((date) => !existing.has(date));
  return `
    <div class="bulk-panel">
      <div>
        <strong>批量生成工作日记录</strong>
        <span>${MONTHS[ui.monthIndex]} 还有 ${pending.length} 个工作日未记录，将套用 ${escapeHtml(preset?.name || "默认班次")}</span>
      </div>
      <button class="primary-button" type="button" data-action="bulk-current-month">生成</button>
    </div>
  `;
}

function renderAdjustmentForm() {
  return `
    <form id="adjustment-form" class="tool-form">
      <div class="form-grid">
        ${field("日期", `<input name="date" type="date" value="${escapeAttr(ui.selectedDate)}" required>`)}
        ${field("类型", `
          <select name="type">
            <option value="allowance">补贴</option>
            <option value="deduction">扣款</option>
          </select>
        `)}
      </div>
      <div class="form-grid">
        ${field("金额", `<input name="amount" type="number" min="0" step="0.01" value="0" required>`)}
        ${field("分类", `<input name="category" type="text" maxlength="30" placeholder="餐补 / 罚款 / 奖金">`)}
      </div>
      ${field("备注", `<textarea name="note" rows="3" maxlength="160"></textarea>`)}
      <div class="form-footer">
        <span></span>
        <button class="primary-button" type="submit">保存补扣</button>
      </div>
    </form>
  `;
}

function renderReportsView() {
  const yearSummary = summarizeYear(state.entries, state.adjustments, state.settings, ui.year);
  const selected = yearSummary[ui.monthIndex];
  const maxIncome = Math.max(1, ...yearSummary.map((item) => item.netIncome));
  const maxHours = Math.max(1, ...yearSummary.map((item) => item.totalHours));
  const incomeGoal = Number(state.settings.goals.monthlyIncome) || 0;
  const hoursGoal = Number(state.settings.goals.monthlyHours) || 0;
  const explainRows = [
    ["底薪", selected.basePay],
    ["正班工资", selected.regularPay],
    ["加班工资", selected.overtimePay],
    ["补贴", selected.allowances],
    ["扣款", -selected.deductions],
    ["个税", -selected.tax.currentTax]
  ];
  return `
    <div class="workspace report-layout">
      <section class="detail-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${ui.year}</p>
            <h2>年度总结</h2>
          </div>
          <div class="button-row">
            <button class="plain-button" type="button" data-action="share-report">分享</button>
            <button class="plain-button" type="button" data-action="export-csv">CSV</button>
            <button class="plain-button" type="button" data-action="export-excel">Excel</button>
          </div>
        </div>
        <div class="chart" aria-label="年度工资与工时">
          ${yearSummary.map((item) => `
            <button class="bar-row ${item.monthIndex === ui.monthIndex ? "is-active" : ""}" type="button" data-date="${ui.year}-${String(item.monthIndex + 1).padStart(2, "0")}-01">
              <span>${MONTHS[item.monthIndex]}</span>
              <i style="--income:${Math.max(3, item.netIncome / maxIncome * 100)}%;--hours:${Math.max(3, item.totalHours / maxHours * 100)}%"></i>
              <b>${money(item.netIncome)}</b>
            </button>
          `).join("")}
        </div>
      </section>
      <section class="detail-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${MONTHS[ui.monthIndex]}</p>
            <h2>薪资拆分</h2>
          </div>
        </div>
        <div class="summary-list">
          ${summaryLine("出勤天数", `${selected.attendanceDays} 天`)}
          ${summaryLine("总工时", `${selected.totalHours} 小时`)}
          ${summaryLine("正班工资", money(selected.regularPay))}
          ${summaryLine("加班工资", money(selected.overtimePay))}
          ${summaryLine("底薪", money(selected.basePay))}
          ${summaryLine("补贴", money(selected.allowances))}
          ${summaryLine("扣款", money(selected.deductions))}
          ${summaryLine("税前合计", money(selected.grossBeforeTax))}
          ${summaryLine("个税", money(selected.tax.currentTax))}
          ${summaryLine("税后收入", money(selected.netIncome), true)}
        </div>
        <h3>本月工资怎么算出来的</h3>
        <div class="explain-list">
          ${explainRows.map(([label, value]) => `
            <div>
              <span>${label}</span>
              <strong class="${value < 0 ? "negative" : ""}">${value < 0 ? "-" : ""}${money(Math.abs(value))}</strong>
            </div>
          `).join("")}
        </div>
        <div class="goals">
          ${goal("收入目标", selected.netIncome, incomeGoal, money(selected.netIncome), money(incomeGoal))}
          ${goal("工时目标", selected.totalHours, hoursGoal, `${selected.totalHours}h`, `${hoursGoal}h`)}
        </div>
      </section>
    </div>
  `;
}

function renderSettingsView() {
  const settings = state.settings;
  const insights = deriveSalaryInsights(settings);
  const modeFields = settingsFieldsForMode(settings.salaryMode);
  return `
    <div class="workspace settings-layout">
      <section class="detail-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">规则</p>
            <h2>薪资设置</h2>
          </div>
        </div>
        <form id="settings-form" class="tool-form">
          <div class="insight-panel">
            <div>
              <span>自动推算</span>
              <strong>正班 ${money(insights.regularHourlyRate)} / 加班基数 ${money(insights.baseOvertimeRate)}</strong>
            </div>
            <p>${insights.missingConfig.length ? `还需要填写：${insights.missingConfig.map((key) => MISSING_LABELS[key] || key).join("、")}` : "底薪、月标准小时和倍率会联动计算，留空的时薪会自动推导。"}</p>
          </div>
          ${field("薪资方式", `
            <select name="salaryMode">
              ${option(SALARY_MODES.REGULAR_OVERTIME, MODE_LABELS[SALARY_MODES.REGULAR_OVERTIME], settings.salaryMode)}
              ${option(SALARY_MODES.BASE_OVERTIME, MODE_LABELS[SALARY_MODES.BASE_OVERTIME], settings.salaryMode)}
              ${option(SALARY_MODES.COMPREHENSIVE, MODE_LABELS[SALARY_MODES.COMPREHENSIVE], settings.salaryMode)}
              ${option(SALARY_MODES.HOURLY, MODE_LABELS[SALARY_MODES.HOURLY], settings.salaryMode)}
            </select>
          `)}
          <div class="form-grid">
            ${modeFields.includes("normalHoursPerDay") ? numberField("每日正班小时", "normalHoursPerDay", settings.normalHoursPerDay, 0.25, { max: WORK_LIMITS.maxRegularHours }) : ""}
            ${modeFields.includes("baseSalary") ? numberField("底薪", "baseSalary", settings.baseSalary, 0.01) : ""}
            ${modeFields.includes("standardMonthlyHours") ? numberField("月标准小时", "standardMonthlyHours", settings.standardMonthlyHours, 0.25, { max: WORK_LIMITS.maxMonthlyHours }) : ""}
            ${modeFields.includes("regularHourlyRate") ? numberField("正班时薪（可留空自动算）", "regularHourlyRate", settings.regularHourlyRate, 0.01) : ""}
            ${modeFields.includes("hourlyRate") ? numberField("小时工时薪", "hourlyRate", settings.hourlyRate, 0.01) : ""}
            ${modeFields.includes("baseOvertimeRate") ? numberField("底薪加班时薪（可留空）", "baseOvertimeRate", settings.baseOvertimeRate, 0.01) : ""}
            ${modeFields.includes("comprehensiveHourlyRate") ? numberField("综合工时时薪", "comprehensiveHourlyRate", settings.comprehensiveHourlyRate, 0.01) : ""}
            ${modeFields.includes("comprehensiveTargetHours") ? numberField("综合目标小时", "comprehensiveTargetHours", settings.comprehensiveTargetHours, 0.25, { max: WORK_LIMITS.maxMonthlyHours }) : ""}
          </div>
          <div class="form-grid">
            ${numberField("工作日加班倍率", "overtimeMultiplier", settings.overtimeMultiplier, 0.05, { max: 5 })}
            ${numberField("休息日倍率", "restDayMultiplier", settings.restDayMultiplier, 0.05, { max: 5 })}
            ${numberField("法定节假日倍率", "holidayMultiplier", settings.holidayMultiplier, 0.05, { max: 5 })}
            ${numberField("综合超时倍率", "comprehensiveOvertimeMultiplier", settings.comprehensiveOvertimeMultiplier, 0.05, { max: 5 })}
          </div>
          <h3>目标</h3>
          <div class="form-grid">
            ${numberField("月收入目标", "goals.monthlyIncome", settings.goals.monthlyIncome, 0.01)}
            ${numberField("月工时目标", "goals.monthlyHours", settings.goals.monthlyHours, 0.25, { max: WORK_LIMITS.maxMonthlyHours })}
          </div>
          <h3>班次</h3>
          ${field("默认班次", `
            <select name="defaultPresetId">
              ${settings.shiftPresets.map((preset) => option(preset.id, preset.name, settings.defaultPresetId)).join("")}
            </select>
          `)}
          <div class="preset-editor">
            ${settings.shiftPresets.map((preset, index) => renderPresetEditor(preset, index)).join("")}
          </div>
          <h3>工作日与自动补扣</h3>
          <div class="workweek-grid">
            ${WEEKDAYS.map((day, index) => checkbox(`workweek.${index}`, String(index), day, settings.workweek.includes(index))).join("")}
          </div>
          <label class="check-row">
            <input type="checkbox" name="autoAdjustment.enabled" value="true" ${settings.autoAdjustment.enabled ? "checked" : ""}>
            <span>保存工时时自动添加日补扣</span>
          </label>
          <div class="form-grid">
            ${numberField("日补扣金额", "autoAdjustment.amount", settings.autoAdjustment.amount, 0.01)}
            ${field("补扣类型", `<select name="autoAdjustment.type">${option("allowance", "补贴", settings.autoAdjustment.type)}${option("deduction", "扣款", settings.autoAdjustment.type)}</select>`)}
            ${field("补扣分类", `<input name="autoAdjustment.category" type="text" maxlength="30" value="${escapeAttr(settings.autoAdjustment.category)}">`)}
            ${field("补扣备注", `<input name="autoAdjustment.note" type="text" maxlength="60" value="${escapeAttr(settings.autoAdjustment.note)}">`)}
          </div>
          <h3>个税</h3>
          <div class="form-grid">
            ${numberField("月减除费用", "tax.standardDeductionMonthly", settings.tax.standardDeductionMonthly, 0.01)}
            ${numberField("固定扣除", "tax.fixedDeductionMonthly", settings.tax.fixedDeductionMonthly, 0.01)}
            ${numberField("专项附加扣除", "tax.specialAdditionalDeductionMonthly", settings.tax.specialAdditionalDeductionMonthly, 0.01)}
            ${numberField("扣除比例%", "tax.deductionPercent", settings.tax.deductionPercent, 0.01, { max: 100 })}
            ${numberField("社保公积金固定", "tax.socialSecurityFixedMonthly", settings.tax.socialSecurityFixedMonthly, 0.01)}
            ${numberField("社保公积金比例%", "tax.socialSecurityPercent", settings.tax.socialSecurityPercent, 0.01, { max: 100 })}
          </div>
          <div class="form-footer">
            <label class="file-button">
              导入
              <input id="import-file" type="file" accept="application/json,.json">
            </label>
            <div class="button-row">
              <button class="plain-button" type="button" data-action="backup">备份</button>
              <button class="primary-button" type="submit">保存设置</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  `;
}

function saveEntry(form) {
  const data = Object.fromEntries(new FormData(form));
  const existingId = data.id || ui.editingEntryId;
  const existing = state.entries.find((item) => item.id === existingId);
  saveEntryObject({
    id: existingId || createId("entry"),
    date: data.date,
    recordMode: data.recordMode,
    dayType: data.dayType,
    startTime: data.startTime,
    endTime: data.endTime,
    breakMinutes: Number(data.breakMinutes || 0),
    regularHours: Number(data.regularHours || 0),
    overtimeHours: Number(data.overtimeHours || 0),
    totalHours: Number(data.totalHours || 0),
    target: data.target.trim(),
    note: data.note.trim(),
    source: existing?.source || "manual",
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString()
  }, "已保存工时记录");
}

function saveEntryObject(entry, notice, options = {}) {
  const resolved = resolveEntryForSave(entry, options);
  if (resolved.blocked) {
    ui.entryError = resolved.message;
    persist(resolved.message);
    render();
    return false;
  }

  const normalizedEntry = {
    ...entry,
    id: resolved.id || entry.id || createId("entry"),
    source: entry.source || options.source || "manual",
    updatedAt: new Date().toISOString(),
    createdAt: resolved.createdAt || entry.createdAt || new Date().toISOString()
  };
  const validation = validateEntry(normalizedEntry, state.settings, state.entries);
  if (!validation.valid) {
    ui.entryError = validation.errors[0] || "记录无效";
    persist(ui.entryError);
    render();
    return false;
  }
  const entryToSave = {
    ...normalizedEntry,
    regularHours: validation.normalized.regularHours,
    overtimeHours: validation.normalized.overtimeHours,
    totalHours: validation.normalized.totalHours
  };
  state.entries = state.entries.filter((item) => item.id !== normalizedEntry.id).concat(entryToSave);
  state.entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  addAutoAdjustment(normalizedEntry.date);
  ui.selectedDate = normalizedEntry.date;
  ui.year = yearFromDate(normalizedEntry.date);
  ui.monthIndex = monthIndexFromDate(normalizedEntry.date);
  ui.editingEntryId = "";
  ui.entryError = "";
  persist(validation.warnings[0] || notice);
  render();
  return true;
}

function resolveEntryForSave(entry, options = {}) {
  if (entry.id) {
    const existing = state.entries.find((item) => item.id === entry.id);
    if (existing) return { id: existing.id, createdAt: existing.createdAt };
  }

  const sameDate = state.entries.filter((item) => item.date === entry.date);
  if (options.strategy === "replace-quick-overtime") {
    const existing = sameDate.find((item) => isQuickOvertimeEntry(item));
    return existing ? { id: existing.id, createdAt: existing.createdAt } : {};
  }

  if (options.strategy === "replace-main") {
    const mainEntries = sameDate.filter((item) => !isQuickOvertimeEntry(item));
    if (mainEntries.length > 1) {
      return {
        blocked: true,
        message: "当天已有多条主记录，请编辑具体记录，避免误覆盖"
      };
    }
    const existing = mainEntries[0];
    return existing ? { id: existing.id, createdAt: existing.createdAt } : {};
  }

  return {};
}

function isQuickOvertimeEntry(entry = {}) {
  return entry.source === "quick-overtime" || entry.note === "快速加班";
}

function saveAdjustment(form) {
  const data = Object.fromEntries(new FormData(form));
  state.adjustments.push({
    id: createId("adjustment"),
    date: data.date,
    type: data.type,
    amount: Number(data.amount || 0),
    category: data.category.trim(),
    note: data.note.trim(),
    createdAt: new Date().toISOString()
  });
  ui.selectedDate = data.date;
  persist("已保存补扣记录");
  render();
}

function saveSettings(form) {
  const data = Object.fromEntries(new FormData(form));
  const next = mergeSettings(state.settings);
  next.workweek = [];
  next.shiftPresets = [];
  next.autoAdjustment.enabled = false;
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("workweek.")) {
      next.workweek.push(Number(value));
      continue;
    }
    if (key.startsWith("shiftPresets.")) {
      const [, index, fieldName] = key.split(".");
      next.shiftPresets[index] = next.shiftPresets[index] || {};
      next.shiftPresets[index][fieldName] = numericSettingField(fieldName) ? Number(value || 0) : value;
      continue;
    }
    if (key === "autoAdjustment.enabled") {
      next.autoAdjustment.enabled = true;
      continue;
    }
    setDeep(next, key, value === "" ? 0 : Number.isNaN(Number(value)) ? value : Number(value));
  }
  state.settings = limitSettings(next);
  persist("已保存设置");
  render();
}

function updateEntryPreview() {
  const form = document.querySelector("#entry-form");
  const output = document.querySelector("#entry-preview");
  const errorBox = document.querySelector("#entry-error");
  if (!form || !output) return;
  const data = Object.fromEntries(new FormData(form));
  const recordMode = data.recordMode || RECORD_MODES.TIME;
  let totalHours = 0;
  if (recordMode === RECORD_MODES.TIME) {
    totalHours = calculateTimeHours(data.startTime, data.endTime, Number(data.breakMinutes || 0));
  } else {
    const regular = Number(data.regularHours || 0);
    const overtime = Number(data.overtimeHours || 0);
    totalHours = Number(data.totalHours || 0) || regular + overtime;
  }
  const entry = {
    ...data,
    id: data.id || ui.editingEntryId,
    recordMode,
    breakMinutes: Number(data.breakMinutes || 0),
    regularHours: Number(data.regularHours || 0),
    overtimeHours: Number(data.overtimeHours || 0),
    totalHours
  };
  const normalized = normalizeEntry(entry, state.settings);
  const pay = calculateEntryPay(entry, state.settings);
  const validation = validateEntry(entry, state.settings, state.entries);
  output.textContent = validation.valid
    ? `${normalized.totalHours}h / ${money(pay.totalPay)}`
    : `${normalized.totalHours}h / 不可保存`;
  const message = ui.entryError || validation.errors[0] || validation.warnings[0] || "";
  if (errorBox) {
    errorBox.hidden = !message;
    errorBox.textContent = message;
    errorBox.classList.toggle("is-warning", validation.valid && Boolean(validation.warnings[0]) && !ui.entryError);
  }
}

function applyPresetToForm(presetId) {
  const form = document.querySelector("#entry-form");
  if (!form) return;
  const preset = getShiftPreset(state.settings, presetId);
  if (!preset) return;
  const entry = buildEntryFromShiftPreset(form.elements.date.value || ui.selectedDate, preset, {
    settings: state.settings,
    dayType: preset.dayType || inferDayType(ui.selectedDate, state.settings)
  });
  form.elements.recordMode.value = entry.recordMode;
  form.setAttribute("data-record-mode", entry.recordMode);
  form.elements.dayType.value = entry.dayType;
  form.elements.startTime.value = entry.startTime || "09:00";
  form.elements.endTime.value = entry.endTime || "18:00";
  form.elements.breakMinutes.value = entry.breakMinutes;
  form.elements.regularHours.value = entry.regularHours;
  form.elements.overtimeHours.value = entry.overtimeHours;
  form.elements.totalHours.value = entry.totalHours;
  updateEntryPreview();
  for (const button of form.querySelectorAll("[data-preset]")) {
    button.classList.toggle("is-active", button.dataset.preset === presetId);
  }
}

function copyPreviousEntry() {
  const previous = [...state.entries]
    .filter((entry) => entry.date < ui.selectedDate)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  if (!previous) {
    persist("还没有可复制的记录");
    render();
    return;
  }
  const { id, createdAt, updatedAt, ...rest } = previous;
  saveEntryObject({
    ...rest,
    date: ui.selectedDate,
    note: previous.note || "复制上次",
    source: "copied"
  }, "已复制上次记录", { strategy: "replace-main" });
}

function addAutoAdjustment(date, notice = "") {
  const config = state.settings.autoAdjustment || {};
  if (!config.enabled && !notice) return;
  const amount = Number(config.amount || 0);
  if (amount <= 0) {
    if (notice) persist("请先在规则里设置日补扣金额");
    return;
  }
  const exists = state.adjustments.some((item) => item.date === date && item.auto === true && item.category === config.category);
  if (exists) return;
  state.adjustments.push({
    id: createId("adjustment"),
    date,
    type: config.type || "allowance",
    amount,
    category: config.category || "日补贴",
    note: config.note || "自动记录",
    auto: true,
    createdAt: new Date().toISOString()
  });
  if (notice) persist(notice);
}

function bulkGenerateMonth() {
  const preset = getShiftPreset(state.settings, state.settings.defaultPresetId);
  const dates = workDatesForMonth(ui.year, ui.monthIndex, state.settings.workweek);
  const existing = new Set(state.entries.map((entry) => entry.date));
  let count = 0;
  for (const date of dates) {
    if (existing.has(date)) continue;
    const entry = buildEntryFromShiftPreset(date, preset, {
      settings: state.settings,
      dayType: inferDayType(date, state.settings),
      source: "bulk"
    });
    const entryToSave = {
      ...entry,
      id: createId("entry"),
      note: entry.note || "批量生成",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const validation = validateEntry(entryToSave, state.settings, state.entries);
    if (!validation.valid) continue;
    state.entries.push({
      ...entryToSave,
      regularHours: validation.normalized.regularHours,
      overtimeHours: validation.normalized.overtimeHours,
      totalHours: validation.normalized.totalHours
    });
    addAutoAdjustment(date);
    count += 1;
  }
  state.entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  persist(count ? `已生成 ${count} 条工作日记录` : "本月工作日都已记录");
  render();
}

function undoDelete() {
  if (!ui.lastDeleted) return;
  if (ui.lastDeleted.type === "entry") state.entries.push(ui.lastDeleted.payload);
  if (ui.lastDeleted.type === "adjustment") state.adjustments.push(ui.lastDeleted.payload);
  state.entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  state.adjustments.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  ui.lastDeleted = null;
  persist("已撤销删除");
  render();
}

function seedDemoData() {
  const prefix = `${ui.year}-${String(ui.monthIndex + 1).padStart(2, "0")}`;
  state.entries = state.entries.concat([
    {
      id: createId("entry"),
      date: `${prefix}-03`,
      recordMode: RECORD_MODES.TIME,
      dayType: "workday",
      startTime: "09:00",
      endTime: "20:30",
      breakMinutes: 75,
      note: "赶订单",
      target: "完成首批",
      createdAt: new Date().toISOString()
    },
    {
      id: createId("entry"),
      date: `${prefix}-08`,
      recordMode: RECORD_MODES.HOURS,
      dayType: "restday",
      regularHours: 0,
      overtimeHours: 6,
      totalHours: 6,
      note: "周末支援",
      target: "",
      createdAt: new Date().toISOString()
    },
    {
      id: createId("entry"),
      date: `${prefix}-16`,
      recordMode: RECORD_MODES.TIME,
      dayType: "workday",
      startTime: "22:00",
      endTime: "06:00",
      breakMinutes: 30,
      note: "夜班",
      target: "",
      createdAt: new Date().toISOString()
    }
  ]);
  state.adjustments.push({
    id: createId("adjustment"),
    date: `${prefix}-20`,
    type: "allowance",
    amount: 180,
    category: "餐补",
    note: "",
    createdAt: new Date().toISOString()
  });
}

function workDatesForMonth(year, monthIndex, workweek = []) {
  const days = new Date(year, monthIndex + 1, 0).getDate();
  const enabled = new Set((workweek || []).map(Number));
  const dates = [];
  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, monthIndex, day);
    if (enabled.has(date.getDay())) dates.push(formatDate(date));
  }
  return dates;
}

function persist(notice = "") {
  ui.notice = notice;
  saveState(state);
  if (notice) window.setTimeout(() => {
    if (ui.notice === notice) {
      ui.notice = "";
      render();
    }
  }, 2400);
}

function entriesForDate(date) {
  return state.entries.filter((entry) => entry.date === date);
}

function adjustmentsForDate(date) {
  return state.adjustments.filter((item) => item.date === date);
}

function groupByDate(items) {
  const map = new Map();
  for (const item of items) {
    if (!item.date) continue;
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date).push(item);
  }
  return map;
}

function findEntryIntegrityIssues() {
  const issues = [];
  const entriesByDate = groupByDate(state.entries);
  for (const [date, entries] of entriesByDate.entries()) {
    const total = round2(entries.reduce((sum, entry) => sum + normalizeEntry(entry, state.settings).totalHours, 0));
    const invalidEntry = entries.find((entry) => !validateEntry(entry, state.settings, []).valid);
    if (total > WORK_LIMITS.maxDayHours || invalidEntry) {
      issues.push({ date, total, count: entries.length });
    }
  }
  return issues.sort((a, b) => a.date.localeCompare(b.date));
}

function repairRepeatedEntries() {
  const byKey = new Map();
  const repaired = [];
  let removed = 0;

  for (const rawEntry of state.entries) {
    const entry = normalizeLegacySource(rawEntry);
    const key = duplicateEntryKey(entry);
    if (!key) {
      repaired.push(entry);
      continue;
    }
    const previousIndex = byKey.get(key);
    if (previousIndex === undefined) {
      byKey.set(key, repaired.length);
      repaired.push(entry);
      continue;
    }
    const previous = repaired[previousIndex];
    repaired[previousIndex] = newerEntry(previous, entry);
    removed += 1;
  }

  if (removed) {
    state.entries = repaired.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }
  return removed;
}

function normalizeLegacySource(entry) {
  if (entry.source) return entry;
  if (entry.note === "快速加班") return { ...entry, source: "quick-overtime" };
  if (entry.note === "批量生成") return { ...entry, source: "bulk" };
  if (entry.note === "复制上次") return { ...entry, source: "copied" };
  return entry;
}

function duplicateEntryKey(entry) {
  if (!entry.date) return "";
  if (isQuickOvertimeEntry(entry)) return `${entry.date}|quick-overtime`;
  const normalized = normalizeEntry(entry, state.settings);
  return [
    entry.date,
    entry.recordMode || RECORD_MODES.TIME,
    normalized.dayType,
    entry.startTime || "",
    entry.endTime || "",
    Number(entry.breakMinutes || 0),
    normalized.regularHours,
    normalized.overtimeHours,
    normalized.totalHours,
    entry.target || "",
    entry.note || ""
  ].join("|");
}

function newerEntry(left, right) {
  const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime();
  const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime();
  return rightTime >= leftTime ? { ...left, ...right, id: left.id || right.id } : left;
}

function settingsFieldsForMode(mode) {
  if (mode === SALARY_MODES.HOURLY) return ["hourlyRate"];
  if (mode === SALARY_MODES.COMPREHENSIVE) return ["comprehensiveHourlyRate", "comprehensiveTargetHours"];
  if (mode === SALARY_MODES.BASE_OVERTIME) return ["baseSalary", "standardMonthlyHours", "baseOvertimeRate"];
  return ["normalHoursPerDay", "baseSalary", "standardMonthlyHours", "regularHourlyRate"];
}

function limitSettings(settings) {
  const next = mergeSettings(settings);
  next.normalHoursPerDay = boundedNumber(next.normalHoursPerDay, 0, WORK_LIMITS.maxRegularHours);
  next.standardMonthlyHours = boundedNumber(next.standardMonthlyHours, 0, WORK_LIMITS.maxMonthlyHours);
  next.comprehensiveTargetHours = boundedNumber(next.comprehensiveTargetHours, 0, WORK_LIMITS.maxMonthlyHours);
  next.goals.monthlyHours = boundedNumber(next.goals.monthlyHours, 0, WORK_LIMITS.maxMonthlyHours);
  next.overtimeMultiplier = boundedNumber(next.overtimeMultiplier, 0, 5);
  next.restDayMultiplier = boundedNumber(next.restDayMultiplier, 0, 5);
  next.holidayMultiplier = boundedNumber(next.holidayMultiplier, 0, 5);
  next.comprehensiveOvertimeMultiplier = boundedNumber(next.comprehensiveOvertimeMultiplier, 0, 5);
  next.tax.deductionPercent = boundedNumber(next.tax.deductionPercent, 0, 100);
  next.tax.socialSecurityPercent = boundedNumber(next.tax.socialSecurityPercent, 0, 100);
  return next;
}

function boundedNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function renderPresetEditor(preset, index) {
  return `
    <div class="preset-row">
      ${field("名称", `<input name="shiftPresets.${index}.name" type="text" value="${escapeAttr(preset.name)}" maxlength="18">`)}
      <input type="hidden" name="shiftPresets.${index}.id" value="${escapeAttr(preset.id)}">
      ${field("方式", `<select name="shiftPresets.${index}.recordMode">${option(RECORD_MODES.TIME, "时间", preset.recordMode)}${option(RECORD_MODES.HOURS, "工时", preset.recordMode)}</select>`)}
      ${field("上班", `<input name="shiftPresets.${index}.startTime" type="time" value="${escapeAttr(preset.startTime)}">`)}
      ${field("下班", `<input name="shiftPresets.${index}.endTime" type="time" value="${escapeAttr(preset.endTime)}">`)}
      ${field("休息", `<input name="shiftPresets.${index}.breakMinutes" type="number" min="0" max="${WORK_LIMITS.maxBreakMinutes}" step="1" value="${escapeAttr(preset.breakMinutes)}">`)}
      ${field("总小时", `<input name="shiftPresets.${index}.totalHours" type="number" min="0" max="${WORK_LIMITS.maxEntryHours}" step="0.25" value="${escapeAttr(preset.totalHours)}">`)}
    </div>
  `;
}

function checkbox(name, value, label, checked) {
  return `
    <label>
      <input type="checkbox" name="${escapeAttr(name)}" value="${escapeAttr(value)}" ${checked ? "checked" : ""}>
      <span>${escapeHtml(label)}</span>
    </label>
  `;
}

function numericSettingField(fieldName) {
  return ["breakMinutes", "regularHours", "overtimeHours", "totalHours"].includes(fieldName);
}

function matchesPreset(preset, entry) {
  if (!preset || !entry) return false;
  if (preset.recordMode !== entry.recordMode) return false;
  if (preset.recordMode === RECORD_MODES.TIME) {
    return preset.startTime === entry.startTime && preset.endTime === entry.endTime;
  }
  return Number(preset.totalHours || 0) === Number(entry.totalHours || 0);
}

function field(label, control) {
  return `<label class="field"><span>${label}</span>${control}</label>`;
}

function numberField(label, name, value, step, options = {}) {
  const min = options.min ?? 0;
  const max = options.max === undefined ? "" : ` max="${escapeAttr(options.max)}"`;
  return field(label, `<input name="${escapeAttr(name)}" type="number" min="${escapeAttr(min)}"${max} step="${step}" value="${escapeAttr(value)}">`);
}

function radio(name, value, label, current) {
  return `
    <label>
      <input type="radio" name="${name}" value="${value}" ${current === value ? "checked" : ""}>
      <span>${label}</span>
    </label>
  `;
}

function option(value, label, current) {
  return `<option value="${escapeAttr(value)}" ${current === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function summaryLine(label, value, strong = false) {
  return `<div class="${strong ? "is-strong" : ""}"><span>${label}</span><strong>${value}</strong></div>`;
}

function goal(label, value, target, valueLabel, targetLabel) {
  const percent = target > 0 ? Math.min(100, Math.round(value / target * 100)) : 0;
  return `
    <div class="goal">
      <div><span>${label}</span><strong>${valueLabel} / ${targetLabel}</strong></div>
      <i style="--progress:${percent}%"></i>
    </div>
  `;
}

function viewTitle(view) {
  return ({ calendar: "月历", records: "记录", reports: "报表", settings: "设置" })[view] || "月历";
}

function selectedDateLabel(date) {
  const parsed = new Date(`${date}T00:00:00`);
  return `${date} 周${WEEKDAYS[parsed.getDay()]}`;
}

function money(value) {
  return `¥${Number(value || 0).toFixed(2)}`;
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function setDeep(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    cursor[parts[index]] = cursor[parts[index]] || {};
    cursor = cursor[parts[index]];
  }
  cursor[parts.at(-1)] = value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

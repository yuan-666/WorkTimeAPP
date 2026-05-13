import {
  DEFAULT_SETTINGS,
  RECORD_MODES,
  REST_CYCLE_MODES,
  SALARY_MODES,
  WORK_LIMITS,
  buildCalendarDays,
  buildBaseWorkEntry,
  buildEntryFromShiftPreset,
  buildOvertimeEntry,
  calculateCumulativeTaxForMonth,
  calculateEntryPay,
  calculateMonthlyPayroll,
  calculateRestReminder,
  calculateTimeHours,
  deriveSalaryInsights,
  formatDate,
  getAutoFilledEntries,
  getHolidayInfo,
  getShiftPreset,
  getUnloggedDays,
  hasBaseWorkEntryForDate,
  inferDayType,
  mergeSettings,
  monthIndexFromDate,
  normalizeEntry,
  overtimeMultiplierForDay,
  parseTimeToMinutes,
  round2,
  summarizeYear,
  validateEntry,
  yearFromDate
} from "./calculations.js?v=0.2.10";
import {
  createId,
  exportBackup,
  importBackupText,
  loadState,
  saveState
} from "./storage.js?v=0.2.10";
import { exportYearCsv, exportYearExcel, shareYearReport } from "./export.js?v=0.2.10";

const app = document.querySelector("#app");
const now = new Date();
const today = formatDate(now);
const APP_VERSION = "v0.2.10";
const RELEASE_COUNT = 20;
const CLOUD_API_BASE = "/api/cloud";
let state = loadState();
let ui = {
  view: state.activeView || "calendar",
  year: now.getFullYear(),
  monthIndex: now.getMonth(),
  selectedDate: today,
  editingEntryId: "",
  entryAdvanced: false,
  entryIntent: "",
  entryError: "",
  entrySheetOpen: false,
  entrySheetVisible: false,
  bulkMode: "add",
  bulkAddKind: "",
  bulkDraft: null,
  bulkDraftMonth: "",
  settingsSheetOpen: "",
  notice: "",
  lastDeleted: null,
  recordsSearch: "",
  recordsDateFrom: "",
  recordsDateTo: "",
  pageTransition: true
};
const repairedOnLoad = repairRepeatedEntries();
if (repairedOnLoad) {
  ui.notice = `已合并 ${repairedOnLoad} 条重复工时记录`;
  saveState(state);
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
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
  standardMonthlyHours: "月计薪小时",
  regularHourlyRate: "正班时薪",
  baseOvertimeRate: "加班基数",
  comprehensiveHourlyRate: "综合工时时薪",
  hourlyRate: "小时工时薪"
};
const LEAVE_TYPES = {
  annual: "年假",
  personal: "事假",
  sick: "病假",
  restAdjust: "调休",
  other: "其他请假"
};

applyTheme();
render();

document.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action], [data-view], [data-date], [data-preset], [data-entry-intent], [data-time-shortcut], [data-leave-shortcut], [data-bulk-mode], [data-delete-entry], [data-edit-entry], [data-delete-adjustment]");
  if (!target) return;

  if (target.dataset.view) {
    const nextView = target.dataset.view;
    ui.pageTransition = ui.view !== nextView;
    ui.view = nextView;
    state.activeView = ui.view;
    ui.entrySheetOpen = false;
    ui.entrySheetVisible = false;
    persist();
    render();
    return;
  }

  if (target.dataset.date) {
    ui.selectedDate = target.dataset.date;
    ui.year = yearFromDate(ui.selectedDate);
    ui.monthIndex = monthIndexFromDate(ui.selectedDate);
    ui.editingEntryId = "";
    ui.entryAdvanced = false;
    ui.entryIntent = "";
    ui.entryError = "";
    if (isMobileViewport() && target.closest(".calendar-panel, .unlogged-panel")) {
      openEntrySheet();
    } else {
      render();
    }
    return;
  }

  if (target.dataset.preset) {
    ui.entryError = "";
    applyPresetToForm(target.dataset.preset);
    return;
  }

  if (target.dataset.entryIntent) {
    ui.entryError = "";
    applyEntryIntent(target.dataset.entryIntent);
    return;
  }

  if (target.dataset.timeShortcut) {
    ui.entryError = "";
    applyTimeShortcut(target.dataset.timeShortcut);
    return;
  }

  if (target.dataset.leaveShortcut) {
    ui.entryError = "";
    applyLeaveShortcut(target.dataset.leaveShortcut);
    return;
  }

  if (target.dataset.bulkMode) {
    const form = target.closest("#bulk-form") || document.querySelector("#bulk-form");
    if (form) rememberBulkDraft(form);
    ui.bulkMode = target.dataset.bulkMode;
    render();
    return;
  }

  if (target.dataset.editEntry) {
    ui.editingEntryId = target.dataset.editEntry;
    ui.entryAdvanced = true;
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
    ui.entryAdvanced = false;
    ui.entryIntent = "";
    ui.entryError = "";
    render();
  }

  if (action === "today") {
    ui.year = now.getFullYear();
    ui.monthIndex = now.getMonth();
    ui.selectedDate = today;
    ui.editingEntryId = "";
    ui.entryAdvanced = false;
    ui.entryIntent = "";
    ui.entryError = "";
    render();
  }

  if (action === "toggle-theme") {
    const current = state.settings.themeMode || "system";
    const nextMode = current === "system" ? "light" : (current === "light" ? "dark" : "system");
    state.settings = limitSettings({
      ...state.settings,
      themeMode: nextMode
    });
    applyTheme();
    persist(`已切换为${themeModeLabel(nextMode)}`);
    render();
  }

  if (action === "skip-setup") {
    state.settings._wizardDone = true;
    persist();
    render();
  }

  if (action === "clear-edit") {
    ui.editingEntryId = "";
    ui.entryAdvanced = false;
    ui.entryIntent = "";
    ui.entryError = "";
    render();
  }

  if (action === "close-entry-sheet") {
    closeEntrySheet();
    return;
  }

  if (action === "close-settings-sheet") {
    ui.settingsSheetOpen = "";
    render();
    return;
  }

  if (action === "open-settings-sheet") {
    ui.settingsSheetOpen = target.dataset.group || "";
    render();
    return;
  }

  if (action === "toggle-entry-advanced") {
    ui.entryAdvanced = !ui.entryAdvanced;
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

  if (action?.startsWith("cloud-")) {
    await handleCloudAction(action, target);
    return;
  }

  if (action === "bulk-add") {
    const form = document.querySelector("#bulk-form");
    if (form) bulkAdd(form);
    return;
  }

  if (action === "bulk-delete") {
    const form = document.querySelector("#bulk-form");
    if (form) bulkDelete(form);
    return;
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

  if (action === "copy-previous") {
    copyPreviousEntry();
  }

  if (action === "undo-delete") {
    undoDelete();
  }
});

document.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const formId = form.getAttribute("id");
  const formClass = form.className;
  if (formId === "entry-form") saveEntry(form, event.submitter?.value);
  if (formId === "adjustment-form") saveAdjustment(form);
  if (formId === "settings-form") saveSettings(form);
  if (formClass.includes("settings-detail-form")) saveSettings(form);
  if (formId === "bulk-form") {
    if ((form.dataset.bulkMode || ui.bulkMode) === "delete") bulkDelete(form);
    else bulkAdd(form);
  }
  if (formId === "setup-form") saveSetupWizard(form);
});

document.addEventListener("input", (event) => {
  if (event.target.closest("#entry-form")) {
    ui.entryError = "";
    if (event.target.name === "date" && state.settings.autoDayType) {
      const form = event.target.closest("#entry-form");
      form.elements.dayType.value = inferDayType(event.target.value, state.settings);
    }
    updateEntryPreview();
  }
  if (event.target.closest("#setup-form")) updateSetupPreview();
  if (event.target.closest("#bulk-form")) {
    if (event.target.name === "addKind") {
      ui.bulkAddKind = event.target.value;
    }
    updateBulkPreview();
  }

  // Records filter
  if (event.target.dataset.filter === "search") {
    ui.recordsSearch = event.target.value;
    render();
    return;
  }
  if (event.target.dataset.filter === "date-from") {
    ui.recordsDateFrom = event.target.value;
    render();
    return;
  }
  if (event.target.dataset.filter === "date-to") {
    ui.recordsDateTo = event.target.value;
    render();
    return;
  }
});

document.addEventListener("change", async (event) => {
  if (event.target.closest("#entry-form")) {
    const form = event.target.closest("#entry-form");
    if (event.target.name === "leaveType") applyLeaveTypeDefaults(form, event.target.value);
    if (event.target.name === "leavePayMode") applyLeavePayModeDefaults(form, event.target.value);
    form?.setAttribute("data-record-mode", form.elements.recordMode?.value || RECORD_MODES.TIME);
    form?.setAttribute("data-leave-pay-mode", form.elements.leavePayMode?.value || "paid");
    updateEntryPreview();
  }

  if (event.target.closest("#bulk-form")) {
    if (event.target.name === "addKind") {
      ui.bulkAddKind = event.target.value;
      updateBulkPreview();
      return;
    }
    updateBulkPreview();
  }

  const settingsForm = event.target.closest("#settings-form, .settings-detail-form");
  if (settingsForm) {
    if (event.target.name === "tax.otherDeductionMode") {
      settingsForm.dataset.taxOtherMode = event.target.value;
    }
    if (event.target.name === "tax.socialSecurityMode") {
      settingsForm.dataset.taxSocialMode = event.target.value;
    }
    if (event.target.name === "restCycle.mode") {
      settingsForm.dataset.restCycleMode = event.target.value;
    }
  }

  if (event.target.name === "salaryMode" && settingsForm) {
    const draft = settingsFromForm(settingsForm);
    draft.settings.salaryMode = event.target.value;
    state.settings = limitSettings(draft.settings);
    state.cloud = draft.cloud;
    ui.settingsSheetOpen = settingsForm.dataset.settingsGroup || ui.settingsSheetOpen;
    render();
    return;
  }

  if (event.target.name === "workType" && settingsForm) {
    const workType = event.target.value;
    if (workType !== "custom") {
      const newPresets = defaultPresetsForWorkType(workType);
      state.settings = limitSettings({
        ...state.settings,
        shiftPresets: newPresets,
        defaultPresetId: newPresets.find((p) => p.dayType !== "restday")?.id || "day"
      });
      updatePresetEditor(settingsForm);
    }
    return;
  }

  if (event.target.name === "salaryMode" && event.target.closest("#setup-form")) {
    ui.setupSalaryMode = event.target.value;
    render();
    return;
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

document.addEventListener("wheel", () => {
  blurActiveTimeEditor();
}, { passive: true, capture: true });

document.addEventListener("touchmove", () => {
  blurActiveTimeEditor();
}, { passive: true, capture: true });

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./sw.js?v=0.2.10", { updateViaCache: "none" });
      registration.update().catch(() => {});
    } catch {
      // Service Worker registration is optional; the app remains usable online.
    }
  });
}

function render() {
  state.settings = limitSettings(state.settings);
  applyTheme();
  if (!["calendar", "records", "reports", "settings"].includes(ui.view)) {
    ui.view = "calendar";
    state.activeView = ui.view;
    saveState(state);
  }
  if (shouldShowSetupWizard()) {
    app.innerHTML = renderSetupWizard();
    updateSetupPreview();
    return;
  }
  app.innerHTML = `
    <div class="shell">
      ${renderSidebar()}
      <main class="main ${ui.pageTransition ? "is-page-entering" : ""}">
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
  ui.pageTransition = false;
  syncEntrySheetState();
  updateEntryPreview();
}

function shouldShowSetupWizard() {
  return state.entries.length === 0
    && state.settings.baseSalary === DEFAULT_SETTINGS.baseSalary
    && state.settings.regularHourlyRate === 0
    && state.settings.hourlyRate === DEFAULT_SETTINGS.hourlyRate
    && !state.settings._wizardDone;
}

function openEntrySheet() {
  ui.entrySheetOpen = true;
  ui.entrySheetVisible = false;
  render();
  window.requestAnimationFrame(() => {
    ui.entrySheetVisible = true;
    syncEntrySheetState();
  });
}

function closeEntrySheet() {
  ui.entrySheetVisible = false;
  syncEntrySheetState();
  window.setTimeout(() => {
    if (ui.entrySheetVisible) return;
    ui.entrySheetOpen = false;
    ui.editingEntryId = "";
    ui.entryError = "";
    render();
  }, 230);
}

function syncEntrySheetState() {
  document.body.classList.toggle("entry-sheet-locked", ui.entrySheetOpen && isMobileViewport());
  document.querySelector(".day-entry-panel")?.classList.toggle("is-entry-sheet-open", ui.entrySheetVisible);
  document.querySelector(".entry-sheet-backdrop")?.classList.toggle("is-entry-sheet-open", ui.entrySheetVisible);
}

function renderSetupWizard() {
  const salaryMode = ui.setupSalaryMode || SALARY_MODES.REGULAR_OVERTIME;
  const modeFields = settingsFieldsForMode(salaryMode);
  return `
    <div class="setup-wizard">
      <div class="setup-wizard-card">
        <div class="setup-wizard-header">
          <img src="./assets/icon.svg" alt="" width="56" height="56">
          <h1>欢迎使用明薪工时</h1>
          <p>花 1 分钟设置你的薪资规则，之后每天记工时就很快了。</p>
        </div>
        <form id="setup-form" class="setup-wizard-form">
          <div class="setup-step">
            <h2>1. 选择薪资方式</h2>
            <p class="setup-hint">选最接近你工资结算的方式</p>
            <div class="setup-choice-grid">
              ${setupChoiceButton("salaryMode", SALARY_MODES.REGULAR_OVERTIME, "正班+加班", "按小时算正班和加班工资", salaryMode)}
              ${setupChoiceButton("salaryMode", SALARY_MODES.BASE_OVERTIME, "底薪+加班", "底薪固定，加班另算", salaryMode)}
              ${setupChoiceButton("salaryMode", SALARY_MODES.COMPREHENSIVE, "综合工时制", "按月总工时计算", salaryMode)}
              ${setupChoiceButton("salaryMode", SALARY_MODES.HOURLY, "小时计算", "纯按小时计薪", salaryMode)}
            </div>
          </div>

          <div class="setup-step">
            <h2>2. 填写基本薪资</h2>
            <p class="setup-hint">这些数字可以随时在设置里改</p>
            <div class="form-grid">
              ${modeFields.includes("baseSalary") ? moneyField("月薪（底薪）", "baseSalary", 6000) : ""}
              ${modeFields.includes("standardMonthlyHours") ? numberField("月计薪小时", "standardMonthlyHours", 174, 1) : ""}
              ${modeFields.includes("hourlyRate") ? moneyField("时薪", "hourlyRate", 0) : ""}
            </div>
          </div>

          <div class="setup-step">
            <h2>3. 确认班次</h2>
            <p class="setup-hint">你的默认上下班时间</p>
            <div class="form-grid">
              ${field("上班时间", `<input name="startTime" type="time" value="09:00" required>`)}
              ${field("下班时间", `<input name="endTime" type="time" value="18:00" required>`)}
              ${field("午休（分钟）", `<input name="breakMinutes" type="number" min="0" max="120" step="1" value="60">`)}
            </div>
            <output id="setup-time-preview" class="setup-time-preview" aria-live="polite"></output>
          </div>

          <div class="setup-footer">
            <div class="button-row">
              <button class="plain-button theme-button" type="button" data-action="toggle-theme" title="${themeModeLabel(state.settings.themeMode)}">${themeIcon(state.settings.themeMode)}</button>
              <button class="plain-button" type="button" data-action="skip-setup">稍后设置</button>
            </div>
            <button class="primary-button" type="submit">开始使用</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function setupChoiceButton(name, value, title, detail, current) {
  return `
    <label class="setup-choice ${current === value ? "is-active" : ""}">
      <input type="radio" name="${name}" value="${value}" ${current === value ? "checked" : ""}>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </label>
  `;
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
      ${renderAppFooter()}
    </aside>
  `;
}

function renderMobileNav() {
  const mainViews = ["calendar", "records", "reports", "settings"];
  const isSubPage = !mainViews.includes(ui.view);
  if (isSubPage) {
    return `
      <nav class="mobile-nav mobile-nav-back" aria-label="返回">
        <button class="mobile-back-button" type="button" data-view="calendar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span>返回</span>
        </button>
        <span class="mobile-page-title">${viewTitle(ui.view)}</span>
        <span></span>
      </nav>
    `;
  }
  return `
    <nav class="mobile-nav" aria-label="底部导航">
      <div class="mobile-nav-row">
        ${navButton("calendar", "月历")}
        ${navButton("records", "记录")}
        ${navButton("reports", "报表")}
        ${navButton("settings", "设置")}
      </div>
      ${renderMobileFooter()}
    </nav>
  `;
}

function navButton(view, label) {
  const active = ui.view === view ? "is-active" : "";
  return `<button class="nav-button ${active}" type="button" data-view="${view}" aria-current="${active ? "page" : "false"}">${label}</button>`;
}

function isMobileViewport() {
  return window.matchMedia?.("(max-width: 720px)").matches;
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
        <button class="plain-button theme-button" type="button" data-action="toggle-theme" title="${themeModeLabel(state.settings.themeMode)}">${themeIcon(state.settings.themeMode)}</button>
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
  const restReminder = calculateRestReminder(today, state.settings, state.entries);
  const backupText = state.backup?.lastExportedAt
    ? `最近备份 ${formatDateTime(state.backup.lastExportedAt)}`
    : "尚未备份";
  const cloudText = state.cloud?.lastSyncAt
    ? `云同步 ${formatDateTime(state.cloud.lastSyncAt)}`
    : (state.cloud?.userId ? "云端已登录" : "云端未登录");
  const derivedText = [
    insights.isDerived.regularHourlyRate ? `正班时薪 ${money(insights.regularHourlyRate)} 自动推算` : "",
    insights.isDerived.baseOvertimeRate ? `加班基数 ${money(insights.baseOvertimeRate)} 自动推算` : "",
    insights.isDerived.hourlyRate ? `小时工时薪 ${money(insights.rates.hourlyRate)} 自动推算` : "",
    insights.isDerived.comprehensiveHourlyRate ? `综合工时时薪 ${money(insights.rates.comprehensiveHourlyRate)} 自动推算` : ""
  ].filter(Boolean).join("，");
  const needsAttention = missing.length || integrityIssues.length || restReminder.isRestDue || restReminder.requiresAnchor;
  const issueDates = integrityIssues.slice(0, 3).map((item) => item.date.slice(5)).join("、");
  const title = integrityIssues.length
    ? `发现 ${integrityIssues.length} 天工时异常`
    : (missing.length ? `还差 ${missing.length} 项，工资可能算不准` : (restReminder.isRestDue ? "今天建议安排休息" : "工资规则已就绪"));
  const detail = integrityIssues.length
    ? `${issueDates} 超过合理上限，请整理或编辑`
    : (missing.length ? missing.join("、") : (derivedText || `${restReminder.label}：${restReminder.detail}`));
  return `
    <section class="readiness ${needsAttention ? "needs-attention" : ""}">
      <div>
        <strong>${title}</strong>
        <span>${detail}</span>
      </div>
      <div>
        <span>${backupText} · ${cloudText}</span>
        ${integrityIssues.length ? `<button class="plain-button" type="button" data-action="repair-records">整理</button>` : `<button class="plain-button" type="button" data-view="settings">规则</button>`}
      </div>
    </section>
  `;
}

function renderUnloggedPanel() {
  const unlogged = getUnloggedDays(ui.year, ui.monthIndex, state.entries, state.settings);
  if (!unlogged.length) return "";
  const items = unlogged.map((date) => {
    const d = new Date(`${date}T00:00:00`);
    const wd = weekLabelByIndex(d.getDay());
    const md = date.slice(5).replace("-", "/");
    return `<button class="unlogged-item" type="button" data-date="${date}"><span>${md}</span><small>周${wd}</small></button>`;
  }).join("");
  return `
    <div class="unlogged-panel">
      <div class="unlogged-head">
        <span class="unlogged-badge">${unlogged.length}</span>
        <strong>未补登</strong>
        <small>工作日缺记录</small>
      </div>
      <div class="unlogged-list">${items}</div>
    </div>
  `;
}

function renderCalendarView() {
  const days = buildCalendarDays(ui.year, ui.monthIndex, state.settings.weekStart);
  const entriesByDate = groupByDate(state.entries);
  const adjustmentsByDate = groupByDate(state.adjustments);
  const selectedEntries = entriesForDate(ui.selectedDate);
  const selectedAdjustments = adjustmentsForDate(ui.selectedDate);
  const useListView = isMobileViewport();
  const mobilePanelHidden = useListView && !ui.entrySheetOpen;
  return `
    <div class="workspace calendar-layout">
      ${renderUnloggedPanel()}
      ${useListView
        ? renderCalendarListView(days, entriesByDate, adjustmentsByDate)
        : `<section class="calendar-panel" aria-label="日历">
            <div class="weekday-grid">
              ${weekdayOrder(state.settings.weekStart).map((day) => `<span>${weekLabelByIndex(day)}</span>`).join("")}
            </div>
            <div class="calendar-grid">
              ${renderCalendarWithWeekSummaries(days, entriesByDate, adjustmentsByDate)}
            </div>
          </section>`
      }
      ${ui.entrySheetOpen ? `<button class="entry-sheet-backdrop ${ui.entrySheetVisible ? "is-entry-sheet-open" : ""}" type="button" data-action="close-entry-sheet" aria-label="关闭登记面板"></button>` : ""}
      <section class="detail-panel day-entry-panel ${ui.entrySheetVisible ? "is-entry-sheet-open" : ""}" aria-label="每日记录" aria-hidden="${mobilePanelHidden ? "true" : "false"}" ${mobilePanelHidden ? "inert" : ""}>
        <div class="sheet-handle" aria-hidden="true"></div>
        <div class="panel-head">
          <div>
            <p class="eyebrow">${selectedDateLabel(ui.selectedDate)}</p>
            <h2>每日记录</h2>
          </div>
          <div class="button-row">
            <button class="icon-button mobile-sheet-close" type="button" data-action="close-entry-sheet" aria-label="关闭">×</button>
            ${ui.editingEntryId ? `<button class="plain-button" type="button" data-action="clear-edit">新增</button>` : `<button class="plain-button" type="button" data-action="copy-previous">复制昨天</button>`}
            <button class="plain-button" type="button" data-view="records">批量处理</button>
          </div>
        </div>
        ${renderDayStatus(selectedEntries)}
        ${renderRestReminderCard(ui.selectedDate)}
        ${renderEntryForm()}
        ${renderSelectedDayList(selectedEntries, selectedAdjustments)}
      </section>
    </div>
  `;
}

function renderCalendarListView(days, entriesByDate, adjustmentsByDate) {
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  const weekdayHeaders = weekdayOrder(state.settings.weekStart);
  const html = weeks.map((weekDays) => {
    const weekStart = weekDays[0]?.date || "";
    const isCurrentWeek = weekDays.some((d) => d.date === today);
    let weekHours = 0;
    let weekPay = 0;
    const cells = weekDays.map((day) => {
      const entries = entriesByDate.get(day.date) || [];
      const normalized = entries.map((e) => normalizeEntry(e, state.settings));
      const hours = round2(normalized.reduce((sum, e) => sum + e.totalHours, 0));
      const pay = round2(entries.reduce((sum, e) => sum + calculateEntryPay(e, state.settings).totalPay, 0));
      const dayType = inferDayType(day.date, state.settings);
      const holiday = day.holiday || getHolidayInfo(day.date);
      const marker = holiday?.marker || (dayType === "restday" ? "休" : "");
      const isAutoFilled = state.settings.autoFillWorkday && !entries.length && dayType === "workday" && day.date <= today;
      const isSelected = day.date === ui.selectedDate;
      const isToday = day.date === today;
      const dayNum = Number(day.date.slice(8, 10));
      const typeClass = dayType === "holiday" ? "is-holiday" : (dayType === "restday" ? "is-restday" : "");
      const hasData = hours > 0 || isAutoFilled;
      const displayHours = hours || (isAutoFilled ? state.settings.normalHoursPerDay : 0);
      weekHours += displayHours;
      weekPay += pay || (isAutoFilled ? calculateEntryPay({ date: day.date, recordMode: RECORD_MODES.HOURS, dayType: "workday", regularHours: state.settings.normalHoursPerDay, overtimeHours: 0, totalHours: state.settings.normalHoursPerDay }, state.settings).totalPay : 0);
      return `
        <button class="mcal-cell ${isSelected ? "is-selected" : ""} ${isToday ? "is-today" : ""} ${typeClass} ${hasData ? "has-data" : ""} ${!day.inMonth ? "is-muted" : ""}" type="button" data-date="${day.date}">
          <span class="mcal-num">${dayNum}</span>
          ${marker ? `<span class="mcal-marker">${escapeHtml(marker)}</span>` : ""}
          ${isAutoFilled ? `<span class="mcal-marker auto">默</span>` : ""}
          ${displayHours ? `<span class="mcal-hours">${displayHours}h</span>` : ""}
          ${pay ? `<span class="mcal-pay">${money(pay)}</span>` : ""}
        </button>
      `;
    }).join("");
    return `
      <div class="mcal-week ${isCurrentWeek ? "is-current" : ""}">
        <div class="mcal-weekdays">${weekdayHeaders.map((d) => `<span>${weekLabelByIndex(d)}</span>`).join("")}</div>
        <div class="mcal-row">${cells}</div>
        <div class="mcal-week-sum"><span>${round2(weekHours)}h</span><span>${money(weekPay)}</span></div>
      </div>
    `;
  }).join("");
  return `
    <section class="calendar-panel mcal-panel" aria-label="日历">
      ${html}
    </section>
  `;
}

function renderDayStatus(entries) {
  const inferredDayType = inferDayType(ui.selectedDate, state.settings);
  const holiday = getHolidayInfo(ui.selectedDate);
  const normalized = entries.map((entry) => normalizeEntry(entry, state.settings));
  const totalHours = round2(normalized.reduce((sum, entry) => sum + entry.totalHours, 0));
  const regularHours = round2(normalized.reduce((sum, entry) => sum + entry.regularHours, 0));
  const overtimeHours = round2(normalized.reduce((sum, entry) => sum + entry.overtimeHours, 0));
  const pay = round2(entries.reduce((sum, entry) => sum + calculateEntryPay(entry, state.settings).totalPay, 0));
  const text = entries.length
    ? `${entries.length} 条记录，正班 ${regularHours}h，加班 ${overtimeHours}h`
    : (inferredDayType === "workday" ? "默认有班，确认班次后保存" : `${holiday ? holiday.name : DAY_TYPE_LABELS[inferredDayType]}，按实际情况记录`);
  const ruleText = entries.length ? payRuleTextForEntries(entries) : payRuleTextForDayType(inferredDayType);
  const dayMeta = holiday
    ? holiday.name || holiday.marker
    : (inferredDayType === "restday" ? "休息日" : "默认工作日");
  return `
    <div class="day-status">
      <div>
        <strong>${totalHours ? `${totalHours}h` : "未记录"}</strong>
        <span>${text}</span>
      </div>
      <div>
        <b>${money(pay)}</b>
        <span>${dayMeta} · ${ruleText}</span>
      </div>
    </div>
  `;
}

function renderRestReminderCard(date) {
  const reminder = calculateRestReminder(date, state.settings, state.entries);
  const text = reminder.requiresAnchor
    ? "设置上一次休息日后，系统会按你的排班反推下一次该休息的日子。"
    : `${reminder.detail}${reminder.nextRestDate ? ` · 下次 ${reminder.nextRestDate}` : ""}`;
  return `
    <div class="rest-reminder ${reminder.isRestDue ? "is-due" : ""}">
      <span>${escapeHtml(reminder.label)}</span>
      <strong>${escapeHtml(text)}</strong>
    </div>
  `;
}

function renderCalendarWithWeekSummaries(days, entriesByDate, adjustmentsByDate) {
  let html = "";
  let currentWeek = -1;
  let weekHours = 0;
  let weekPay = 0;
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const weekNum = Math.floor(i / 7);
    if (weekNum !== currentWeek) {
      if (currentWeek >= 0) {
        html += `<div class="week-summary-row"><span>周合计</span><strong>${round2(weekHours)}h</strong><span>${money(weekPay)}</span></div>`;
      }
      currentWeek = weekNum;
      weekHours = 0;
      weekPay = 0;
    }
    const entries = entriesByDate.get(day.date) || [];
    const adjustments = adjustmentsByDate.get(day.date) || [];
    html += renderDayCell(day, entries, adjustments);
    const normalized = entries.map((e) => normalizeEntry(e, state.settings));
    const entryHours = normalized.reduce((sum, e) => sum + e.totalHours, 0);
    const entryPay = entries.reduce((sum, e) => sum + calculateEntryPay(e, state.settings).totalPay, 0);
    if (entries.length > 0) {
      weekHours += entryHours;
      weekPay += entryPay;
    } else if (state.settings.autoFillWorkday && inferDayType(day.date, state.settings) === "workday" && day.date <= today) {
      weekHours += state.settings.normalHoursPerDay;
      const autoEntry = { date: day.date, recordMode: RECORD_MODES.HOURS, dayType: "workday", regularHours: state.settings.normalHoursPerDay, overtimeHours: 0, totalHours: state.settings.normalHoursPerDay };
      weekPay += calculateEntryPay(autoEntry, state.settings).totalPay;
    }
  }
  if (days.length > 0) {
    html += `<div class="week-summary-row"><span>周合计</span><strong>${round2(weekHours)}h</strong><span>${money(weekPay)}</span></div>`;
  }
  return html;
}

function renderDayCell(day, entries, adjustments) {
  const normalized = entries.map((entry) => normalizeEntry(entry, state.settings));
  const hours = round2(normalized.reduce((sum, entry) => sum + entry.totalHours, 0));
  const pay = round2(normalized.reduce((sum, entry) => sum + calculateEntryPay(entry, state.settings).totalPay, 0));
  const hasAdjustment = adjustments.length > 0;
  const dayType = inferDayType(day.date, state.settings);
  const holiday = day.holiday || getHolidayInfo(day.date);
  const marker = holiday?.marker || (dayType === "restday" ? "休" : "");
  const note = holiday?.name || (dayType === "restday" ? "周末" : "");
  const isAutoFilled = state.settings.autoFillWorkday && !entries.length && dayType === "workday" && day.date <= today;
  const classes = [
    "day-cell",
    day.inMonth ? "" : "is-muted",
    day.date === ui.selectedDate ? "is-selected" : "",
    day.date === today ? "is-today" : "",
    hours > 0 ? "has-work" : "",
    hasAdjustment ? "has-adjustment" : "",
    dayType === "holiday" ? "is-holiday" : "",
    dayType === "restday" ? "is-restday" : "",
    holiday?.adjusted ? "is-adjusted" : "",
    isAutoFilled ? "is-auto-filled" : ""
  ].filter(Boolean).join(" ");
  const ariaParts = [
    selectedDateLabel(day.date),
    holiday?.name || DAY_TYPE_LABELS[dayType],
    holiday?.adjusted ? "调休上班" : "",
    marker ? `标记 ${marker}` : "",
    hours ? `工时 ${hours} 小时` : (isAutoFilled ? `默认 ${state.settings.normalHoursPerDay} 小时` : "未记录工时"),
    pay ? `工资 ${money(pay)}` : ""
  ].filter(Boolean).join("，");
  return `
    <button class="${classes}" type="button" data-date="${day.date}" aria-label="${escapeAttr(ariaParts)}" title="${escapeAttr(ariaParts)}">
      <span class="day-number">${Number(day.date.slice(8, 10))}</span>
      ${marker ? `<span class="day-marker">${escapeHtml(marker)}</span>` : ""}
      ${isAutoFilled ? `<span class="day-marker auto-fill-marker">默认</span>` : ""}
      ${note ? `<span class="day-note">${escapeHtml(note)}</span>` : ""}
      <span class="day-hours">${hours ? `${hours}h` : (isAutoFilled ? `${state.settings.normalHoursPerDay}h` : "")}</span>
      <span class="day-pay">${pay ? money(pay) : ""}</span>
    </button>
  `;
}

function payRuleTextForEntries(entries) {
  const hasHoliday = entries.some((entry) => normalizeEntry(entry, state.settings).dayType === "holiday");
  const hasRestDay = entries.some((entry) => normalizeEntry(entry, state.settings).dayType === "restday");
  if (hasHoliday) return payRuleTextForDayType("holiday");
  if (hasRestDay) return payRuleTextForDayType("restday");
  return payRuleTextForDayType("workday");
}

function payRuleTextForDayType(dayType) {
  if (dayType === "holiday") return `假日倍率 ${overtimeMultiplierForDay("holiday", state.settings)} 倍`;
  if (dayType === "restday") return `休息日倍率 ${overtimeMultiplierForDay("restday", state.settings)} 倍`;
  return `加班倍率 ${overtimeMultiplierForDay("workday", state.settings)} 倍`;
}

function renderEntryForm() {
  const editing = state.entries.find((entry) => entry.id === ui.editingEntryId);
  const inferredDayType = inferDayType(ui.selectedDate, state.settings);
  const holiday = getHolidayInfo(ui.selectedDate);
  const overtimePreset = findPresetByIntent("overtime");
  const defaultPreset = getWorkDefaultPreset(state.settings);
  const defaultEntry = buildEntryFromShiftPreset(ui.selectedDate, defaultPreset, {
    settings: state.settings,
    dayType: defaultPreset?.dayType && defaultPreset.dayType !== "workday" ? defaultPreset.dayType : inferredDayType
  });
  const intentEntry = ui.entryIntent === "leave-note" && editing
    ? {
        ...editing,
        recordMode: RECORD_MODES.HOURS,
        dayType: editing.dayType || inferredDayType,
        regularHours: 0,
        overtimeHours: 0,
        totalHours: 0,
        leaveType: editing.leaveType || "annual",
        leavePayMode: editing.leavePayMode || "paid",
        leavePayMultiplier: editing.leavePayMultiplier ?? 1,
        leaveDeductionAmount: editing.leaveDeductionAmount || 0,
        leaveHours: editing.leaveHours || state.settings.normalHoursPerDay,
        source: "leave-note"
      }
    : editing;
  const entry = intentEntry || {
    ...defaultEntry,
    recordMode: ui.entryIntent === "leave-note" ? RECORD_MODES.HOURS : defaultEntry.recordMode,
    regularHours: ui.entryIntent === "leave-note" ? 0 : defaultEntry.regularHours,
    overtimeHours: ui.entryIntent === "leave-note" ? 0 : defaultEntry.overtimeHours,
    totalHours: ui.entryIntent === "leave-note" ? 0 : defaultEntry.totalHours,
    note: "",
    target: "",
    leaveType: "annual",
    leavePayMode: "paid",
    leavePayMultiplier: 1,
    leaveDeductionAmount: 0,
    leaveHours: state.settings.normalHoursPerDay,
    source: ui.entryIntent
  };
  const recordMode = entry.recordMode || RECORD_MODES.TIME;
  const sourceHint = entry.source || ui.entryIntent || "";
  const normalizedForChoice = normalizeEntry(entry, state.settings);
  const isRestChoice = sourceHint === "rest-day";
  const isNoteChoice = sourceHint === "leave-note";
  const isOvertimeChoice = !isRestChoice && !isNoteChoice && normalizedForChoice.overtimeHours > 0;
  const isNormalChoice = !isRestChoice && !isNoteChoice && !isOvertimeChoice;
  const advancedClass = ui.entryAdvanced || editing ? "" : "is-collapsed";
  const advancedLabel = ui.entryAdvanced || editing ? "收起更多" : "更多设置";
  const timeTools = isNoteChoice ? renderLeaveFields(entry) : `
      ${renderShiftChoice(entry)}
      <div class="mode-fields time-fields">
        <div class="form-grid compact-times">
          ${field("上班", `<input name="startTime" type="time" value="${escapeAttr(entry.startTime || "09:00")}" enterkeyhint="done">`)}
          ${field("下班", `<input name="endTime" type="time" value="${escapeAttr(entry.endTime || "18:00")}" enterkeyhint="done">`)}
          ${field("休息", `<input name="breakMinutes" type="number" min="0" max="${WORK_LIMITS.maxBreakMinutes}" step="1" value="${escapeAttr(entry.breakMinutes ?? 60)}" inputmode="numeric" enterkeyhint="done">`)}
        </div>
        ${renderTimeShortcuts(entry)}
      </div>
      <div class="time-preview" id="time-preview" aria-live="polite"></div>
    `;
  return `
    <form id="entry-form" class="tool-form" data-record-mode="${recordMode}" data-leave-pay-mode="${escapeAttr(entry.leavePayMode || "paid")}">
      <input type="hidden" name="id" value="${escapeAttr(entry.id || "")}">
      <input type="hidden" name="sourceHint" value="${escapeAttr(sourceHint)}">
      <div class="record-form-head">
        <div>
          <span>${editing ? "编辑这条记录" : "今天发生了什么"}</span>
          <strong>${escapeHtml(dayDecisionText(ui.selectedDate, inferredDayType, holiday))}</strong>
        </div>
        <small>${payRuleTextForDayType(entry.dayType || inferredDayType)}</small>
      </div>
      <div class="entry-choice-grid" aria-label="登记类型">
        ${entryIntentButton("normal", "正常上班", "默认班次，自动算加班", isNormalChoice)}
        ${entryIntentButton("overtime", "有加班", overtimePreset ? escapeHtml(overtimePreset.name) : "晚下班自动拆加班", isOvertimeChoice)}
        ${entryIntentButton("rest", "休息", "一键标记，不计工资", isRestChoice)}
        ${entryIntentButton("note", "请假", "年假事假病假都在这里", isNoteChoice)}
      </div>
      ${timeTools}
      <div class="entry-advanced ${advancedClass}">
        <div class="form-grid">
        ${field("日期", `<input name="date" type="date" value="${escapeAttr(entry.date || ui.selectedDate)}" required>`)}
        ${field("日期类型", `
          <div class="segmented compact" role="radiogroup" aria-label="日期类型">
            ${radio("dayType", "workday", "工作日", entry.dayType)}
            ${radio("dayType", "restday", "休息日", entry.dayType)}
            ${radio("dayType", "holiday", "法定假日", entry.dayType)}
          </div>
        `)}
        </div>
        <div class="segmented" role="radiogroup" aria-label="记录方式">
          ${radio("recordMode", RECORD_MODES.TIME, "按上下班时间", recordMode)}
          ${radio("recordMode", RECORD_MODES.HOURS, "直接填小时", recordMode)}
        </div>
        <div class="mode-fields hour-fields">
          <div class="form-grid">
            ${field("正班小时", `<input name="regularHours" type="number" min="0" max="${WORK_LIMITS.maxRegularHours}" step="0.25" value="${escapeAttr(entry.regularHours ?? state.settings.normalHoursPerDay)}">`)}
            ${field("加班小时", `<input name="overtimeHours" type="number" min="0" max="${WORK_LIMITS.maxOvertimeHours}" step="0.25" value="${escapeAttr(entry.overtimeHours ?? 0)}">`)}
            ${field("总小时", `<input name="totalHours" type="number" min="0" max="${WORK_LIMITS.maxEntryHours}" step="0.25" value="${escapeAttr(entry.totalHours ?? "")}">`)}
          </div>
          <small class="helper">只有选择“直接填小时”时才需要改这里；按上下班时间会自动计算总时长。</small>
        </div>
        ${field("目标", `<input name="target" type="text" maxlength="40" value="${escapeAttr(entry.target || "")}" placeholder="今天想完成什么">`)}
        ${field("备注", `<textarea name="note" rows="3" maxlength="160" placeholder="请假、调班、特殊说明">${escapeHtml(entry.note || "")}</textarea>`)}
      </div>
      <button class="subtle-toggle" type="button" data-action="toggle-entry-advanced">${advancedLabel}</button>
      <div id="entry-error" class="form-error" role="alert" ${ui.entryError ? "" : "hidden"}>${escapeHtml(ui.entryError)}</div>
      <div class="form-footer form-footer-strong">
        <output id="entry-preview">0h / ¥0.00</output>
        <button class="primary-button submit-button" type="submit" name="saveMode" value="work">${editing ? "保存修改" : (sourceHint === "leave-note" ? "保存请假" : "保存今日记录")}</button>
      </div>
    </form>
  `;
}

function entryIntentButton(intent, title, detail, active = false) {
  const submitRest = intent === "rest" ? ` name="saveMode" value="rest"` : "";
  const type = intent === "rest" ? "submit" : "button";
  const dataAttr = intent === "rest" ? "" : ` data-entry-intent="${intent}"`;
  return `
    <button class="${active ? "is-active" : ""}" type="${type}" data-choice-intent="${intent}"${dataAttr}${submitRest}>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </button>
  `;
}

function renderShiftChoice(entry) {
  const workPresets = workShiftPresets(state.settings);
  const hasDifferentWorkShifts = workPresets.length > 1 && !presetsHaveSameTime(workPresets);
  return `
    <div class="shift-choice">
      <div>
        <span>今日班次</span>
        <strong>${hasDifferentWorkShifts ? "白班和夜班时间不同，先选今天上哪个班" : "工作日默认有班，确认后保存即可"}</strong>
      </div>
      <div class="preset-grid" aria-label="班次模板">
        ${state.settings.shiftPresets.map((preset) => renderPresetButton(preset, entry)).join("")}
      </div>
    </div>
  `;
}

function renderTimeShortcuts(entry) {
  const normalized = normalizeEntry(entry, state.settings);
  const activeExtra = Math.max(0, normalized.overtimeHours);
  return `
    <div class="shortcut-row" aria-label="下班时间快捷调整">
      <button type="button" data-time-shortcut="standard">准点下班</button>
      <button type="button" data-time-shortcut="plus-1" class="${activeExtra === 1 ? "is-active" : ""}">加 1 小时</button>
      <button type="button" data-time-shortcut="plus-2" class="${activeExtra === 2 ? "is-active" : ""}">加 2 小时</button>
      <button type="button" data-time-shortcut="plus-3" class="${activeExtra === 3 ? "is-active" : ""}">加 3 小时</button>
    </div>
  `;
}

function renderLeaveFields(entry) {
  const leaveType = entry.leaveType || "annual";
  const leavePayMode = entry.leavePayMode || "paid";
  const leaveHours = Number(entry.leaveHours ?? state.settings.normalHoursPerDay);
  return `
    <div class="leave-panel">
      <div>
        <span>请假信息</span>
        <strong>先选假别，再确认请假时长</strong>
      </div>
      <div class="shortcut-row leave-shortcuts" aria-label="请假时长快捷选择">
        <button type="button" data-leave-shortcut="full" class="${leaveHours === state.settings.normalHoursPerDay ? "is-active" : ""}">全天</button>
        <button type="button" data-leave-shortcut="half" class="${leaveHours === state.settings.normalHoursPerDay / 2 ? "is-active" : ""}">半天</button>
        <button type="button" data-leave-shortcut="two-hours" class="${leaveHours === 2 ? "is-active" : ""}">2 小时</button>
        <button type="button" data-leave-shortcut="custom">自定义</button>
      </div>
      <div class="form-grid">
        ${field("假别", `
          <select name="leaveType">
            ${Object.entries(LEAVE_TYPES).map(([value, label]) => option(value, label, leaveType)).join("")}
          </select>
        `)}
        ${field("是否扣工资", `
          <select name="leavePayMode">
            ${option("paid", "带薪", leavePayMode)}
            ${option("unpaid", "不计薪", leavePayMode)}
            ${option("deduct", "扣工资", leavePayMode)}
            ${option("custom", "按倍数计薪", leavePayMode)}
          </select>
        `)}
      </div>
      <div class="form-grid">
        ${fieldWithClass("计薪倍数", `<input name="leavePayMultiplier" type="number" min="0" step="0.1" value="${escapeAttr(entry.leavePayMultiplier ?? 1)}" inputmode="decimal" enterkeyhint="done">`, "leave-multiplier-field")}
        ${field("请假小时", `<input name="leaveHours" type="number" min="0" max="${WORK_LIMITS.maxEntryHours}" step="0.25" value="${escapeAttr(entry.leaveHours ?? state.settings.normalHoursPerDay)}" inputmode="decimal" enterkeyhint="done">`)}
        ${moneyFieldWithClass("扣工资金额", "leaveDeductionAmount", entry.leaveDeductionAmount || 0, "leave-deduction-field")}
      </div>
      <div class="time-preview" id="time-preview" aria-live="polite"></div>
      <small class="helper">年假通常选带薪；事假可选不计薪或扣工资；病假可按你的工资规则填倍数。</small>
    </div>
  `;
}

function renderPresetButton(preset, entry) {
  const active = matchesPreset(preset, entry);
  const previewEntry = buildEntryFromShiftPreset(ui.selectedDate, preset, {
    settings: state.settings,
    dayType: preset.dayType && preset.dayType !== "workday" ? preset.dayType : inferDayType(ui.selectedDate, state.settings)
  });
  const pay = calculateEntryPay(previewEntry, state.settings);
  return `
    <button class="${active ? "is-active" : ""}" type="button" data-preset="${escapeAttr(preset.id)}">
      <strong>${escapeHtml(preset.name)}</strong>
      <span>${preset.recordMode === RECORD_MODES.TIME ? `${preset.startTime}-${preset.endTime}` : `${preset.totalHours || preset.regularHours + preset.overtimeHours}h`}</span>
      <small>${previewEntry.totalHours}h · ${money(pay.totalPay)}</small>
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
  if (entry.source === "leave-note") {
    return `
      <article class="record-item">
        <div>
          <strong>${escapeHtml(LEAVE_TYPES[entry.leaveType] || "请假")} · ${entry.leaveHours || state.settings.normalHoursPerDay}h</strong>
          <span>${leavePayModeLabel(entry.leavePayMode)} · ${money(pay.totalPay)}</span>
          <small>请假计薪 ${money(pay.regularPay)}${entry.leavePayMode === "deduct" ? ` · 扣 ${money(entry.leaveDeductionAmount)}` : ""}</small>
          ${entry.note ? `<small>${escapeHtml(entry.note)}</small>` : ""}
        </div>
        <div class="item-actions">
          <button class="icon-button" type="button" data-edit-entry="${entry.id}" aria-label="编辑">✎</button>
          <button class="icon-button danger" type="button" data-delete-entry="${entry.id}" aria-label="删除">×</button>
        </div>
      </article>
    `;
  }
  if (entry.source === "rest-day") {
    return `
      <article class="record-item">
        <div>
          <strong>休息</strong>
          <span>${entry.note ? escapeHtml(entry.note) : "当天不上班，不计工时"}</span>
        </div>
        <div class="item-actions">
          <button class="icon-button" type="button" data-edit-entry="${entry.id}" aria-label="编辑">✎</button>
          <button class="icon-button danger" type="button" data-delete-entry="${entry.id}" aria-label="删除">×</button>
        </div>
      </article>
    `;
  }
  const time = entry.recordMode === RECORD_MODES.TIME
    ? `${entry.startTime || "--:--"}-${entry.endTime || "--:--"}`
    : "工时录入";
  return `
    <article class="record-item">
      <div>
        <strong>${time}</strong>
        <span>${DAY_TYPE_LABELS[normalized.dayType]} · ${normalized.totalHours}h · ${money(pay.totalPay)}</span>
        <small>正班 ${money(pay.regularPay)} · 加班 ${money(pay.overtimePay)} · 倍率 ${overtimeMultiplierForDay(normalized.dayType, state.settings)}x</small>
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
  const monthPrefix = `${ui.year}-${String(ui.monthIndex + 1).padStart(2, "0")}`;
  let monthEntries = state.entries
    .filter((entry) => entry.date?.startsWith(monthPrefix))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  let monthAdjustments = state.adjustments
    .filter((item) => item.date?.startsWith(monthPrefix))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // Apply search filter
  const search = (ui.recordsSearch || "").trim().toLowerCase();
  if (search) {
    monthEntries = monthEntries.filter((entry) => {
      const text = [
        entry.date, entry.note, entry.target, entry.source,
        LEAVE_TYPES[entry.leaveType], entry.startTime, entry.endTime
      ].filter(Boolean).join(" ").toLowerCase();
      return text.includes(search);
    });
    monthAdjustments = monthAdjustments.filter((item) => {
      const text = [item.date, item.category, item.note, item.type]
        .filter(Boolean).join(" ").toLowerCase();
      return text.includes(search);
    });
  }

  // Apply date range filter
  const dateFrom = ui.recordsDateFrom || "";
  const dateTo = ui.recordsDateTo || "";
  if (dateFrom) {
    monthEntries = monthEntries.filter((entry) => entry.date >= dateFrom);
    monthAdjustments = monthAdjustments.filter((item) => item.date >= dateFrom);
  }
  if (dateTo) {
    monthEntries = monthEntries.filter((entry) => entry.date <= dateTo);
    monthAdjustments = monthAdjustments.filter((item) => item.date <= dateTo);
  }

  const totalCount = monthEntries.length + monthAdjustments.length;
  const filtered = search || dateFrom || dateTo;
  return `
    <div class="workspace two-column">
      <section class="detail-panel" aria-label="批量处理">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${MONTHS[ui.monthIndex]}</p>
            <h2>批量处理</h2>
          </div>
        </div>
        ${renderBulkPreview()}
        <h3>补贴扣款</h3>
        ${renderAdjustmentForm()}
      </section>
      <section class="detail-panel" aria-label="记录列表">
        <div class="panel-head">
          <div>
            <p class="eyebrow">${totalCount} 条${filtered ? "（已筛选）" : ""}</p>
            <h2>本月明细</h2>
          </div>
        </div>
        <div class="records-filter">
          <input type="search" placeholder="搜索备注、日期、分类…" value="${escapeAttr(ui.recordsSearch || "")}" data-filter="search" aria-label="搜索记录">
          <input type="date" value="${escapeAttr(dateFrom)}" data-filter="date-from" aria-label="开始日期" title="开始日期">
          <input type="date" value="${escapeAttr(dateTo)}" data-filter="date-to" aria-label="结束日期" title="结束日期">
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
  const availableAddKinds = bulkAddKindOptions();
  const config = currentBulkDraft();
  const preset = getShiftPreset(state.settings, config.presetId);
  const currentKind = availableAddKinds.some((item) => item.value === config.addKind)
    ? config.addKind
    : defaultBulkAddKind();
  ui.bulkAddKind = currentKind;
  config.addKind = currentKind;
  const addPreview = previewBulkAdd(config);
  const deletePreview = previewBulkDelete(config);
  const bulkMode = ui.bulkMode || "add";
  return `
    <form id="bulk-form" class="bulk-tool" data-bulk-mode="${escapeAttr(bulkMode)}">
      <div class="bulk-mode-switch" aria-label="批量操作类型">
        <button class="${bulkMode === "add" ? "is-active" : ""}" type="button" data-bulk-mode="add">批量添加</button>
        <button class="${bulkMode === "delete" ? "is-active" : ""}" type="button" data-bulk-mode="delete">批量删除</button>
      </div>
      <div class="bulk-summary" id="bulk-preview" data-add="${escapeAttr(addPreview.summary)}" data-delete="${escapeAttr(deletePreview.summary)}">
        <strong>${escapeHtml(bulkMode === "delete" ? deletePreview.summary : addPreview.summary)}</strong>
        <span>${bulkMode === "delete" ? "删除前会先计算影响，且可撤销。" : bulkAddKindHelp(currentKind)}</span>
        <small>${bulkMode === "delete" ? "为了防误删，需要勾选确认批量删除。" : bulkAddKindDetail(currentKind)}</small>
      </div>
      <div class="form-grid">
        ${field("开始", `<input name="start" type="date" value="${escapeAttr(config.start)}" required>`)}
        ${field("结束", `<input name="end" type="date" value="${escapeAttr(config.end)}" required>`)}
      </div>
      ${bulkMode === "delete" ? `
        <div class="form-grid">
          ${field("删除范围", `
            <select name="deleteKind">
              ${option("bulk", "仅批量生成", config.deleteKind)}
              ${option("overtime", "仅批量加班", config.deleteKind)}
              ${option("entries", "全部工时记录", config.deleteKind)}
              ${option("adjustments", "全部补扣记录", config.deleteKind)}
              ${option("all", "工时和补扣都删", config.deleteKind)}
            </select>
          `)}
          <label class="check-row slim confirm-delete">
            <input type="checkbox" name="confirmDelete" value="true" ${config.confirmDelete ? "checked" : ""}>
            <span>确认批量删除</span>
          </label>
        </div>
      ` : `
        <div class="form-grid">
          ${field("添加方式", `
            <select name="addKind">
              ${availableAddKinds.map((item) => option(item.value, item.label, currentKind)).join("")}
            </select>
          `)}
          ${field("添加规则", `
            <select name="rule">
              ${option("workdays", "仅工作日和调休上班", config.rule)}
              ${option("all", "每天都添加", config.rule)}
              ${option("rest", "只添加休息日/节假日", config.rule)}
            </select>
          `)}
          ${field("每天加班", `<input name="overtimeHours" type="number" min="0" max="${WORK_LIMITS.maxOvertimeHours}" step="0.25" value="${escapeAttr(config.overtimeHours)}" inputmode="decimal">`)}
          ${field("班次", `
            <select name="presetId">
              ${state.settings.shiftPresets.map((item) => option(item.id, item.name, preset?.id || config.presetId)).join("")}
            </select>
          `)}
        </div>
        <label class="check-row slim">
          <input type="checkbox" name="overwrite" value="true" ${config.overwrite ? "checked" : ""}>
          <span>覆盖已有同类记录</span>
        </label>
      `}
      <div class="form-footer">
        <span></span>
        ${bulkMode === "delete"
          ? `<button class="danger-button" type="button" data-action="bulk-delete">删除预览中的记录</button>`
          : `<button class="primary-button" type="button" data-action="bulk-add">添加预览中的日期</button>`}
      </div>
    </form>
  `;
}

function defaultBulkAddKind() {
  return [SALARY_MODES.REGULAR_OVERTIME, SALARY_MODES.BASE_OVERTIME].includes(state.settings.salaryMode)
    ? "monthlyBase"
    : "overtime";
}

function bulkDefaultConfig() {
  const monthKey = `${ui.year}-${String(ui.monthIndex + 1).padStart(2, "0")}`;
  if (ui.bulkDraftMonth !== monthKey) {
    ui.bulkDraftMonth = monthKey;
    ui.bulkDraft = null;
  }
  const preset = getShiftPreset(state.settings, state.settings.defaultPresetId);
  return {
    start: `${monthKey}-01`,
    end: formatDate(new Date(ui.year, ui.monthIndex + 1, 0)),
    addKind: defaultBulkAddKind(),
    rule: "workdays",
    presetId: preset?.id || state.settings.defaultPresetId,
    overtimeHours: 2,
    overwrite: false,
    deleteKind: "bulk",
    confirmDelete: false
  };
}

function currentBulkDraft() {
  const defaults = bulkDefaultConfig();
  const draft = { ...defaults, ...(ui.bulkDraft || {}) };
  const availableKinds = bulkAddKindOptions().map((item) => item.value);
  if (!availableKinds.includes(draft.addKind)) draft.addKind = defaults.addKind;
  if (!["workdays", "all", "rest"].includes(draft.rule)) draft.rule = defaults.rule;
  if (!["bulk", "overtime", "entries", "adjustments", "all"].includes(draft.deleteKind)) draft.deleteKind = defaults.deleteKind;
  draft.overtimeHours = Number.isFinite(Number(draft.overtimeHours)) ? Number(draft.overtimeHours) : defaults.overtimeHours;
  draft.overwrite = Boolean(draft.overwrite);
  draft.confirmDelete = Boolean(draft.confirmDelete);
  return draft;
}

function rememberBulkDraft(form) {
  ui.bulkDraft = bulkConfigFromForm(form, { saveDraft: false });
}

function bulkAddKindOptions() {
  const options = [];
  if ([SALARY_MODES.REGULAR_OVERTIME, SALARY_MODES.BASE_OVERTIME].includes(state.settings.salaryMode)) {
    options.push({ value: "monthlyBase", label: "补齐基础工时 8h" });
  }
  options.push({ value: "overtime", label: "批量登记加班" });
  options.push({ value: "preset", label: "按班次模板添加" });
  return options;
}

function bulkAddKindHelp(kind) {
  if (kind === "monthlyBase") return "一键补齐本月基础工作日 8 小时；已有加班不会被跳过。";
  if (kind === "overtime") return "只添加每天加班小时，适合综合工时制、小时工或补记固定加班。";
  return "按当前班次模板批量生成，适合固定白班、夜班或休息日加班。";
}

function bulkAddKindDetail(kind) {
  if (kind === "monthlyBase") return "默认只补没有基础工时的工作日，调休上班会包含，节假日和休息日会跳过。";
  if (kind === "overtime") return "默认不重复添加同来源批量加班；勾选覆盖只替换批量加班，不动正班。";
  return "默认只补空白日期；勾选覆盖会替换范围内已有工时。";
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
        ${moneyField("金额", "amount", 0, { required: true })}
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
        ${renderPieChart(selected)}
        ${renderWeeklyTrend(yearSummary, ui.year, ui.monthIndex)}
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


function renderPieChart(selected) {
  const segments = [
    { label: "正班工资", value: Math.max(0, selected.regularPay), color: "#176b5b" },
    { label: "加班工资", value: Math.max(0, selected.overtimePay), color: "#3fb68b" },
    { label: "底薪", value: Math.max(0, selected.basePay), color: "#2d8f73" },
    { label: "补贴", value: Math.max(0, selected.allowances), color: "#f0c85a" },
    { label: "扣款", value: Math.max(0, selected.deductions), color: "#e5534b" },
    { label: "个税", value: Math.max(0, selected.tax.currentTax), color: "#bf6f2f" }
  ].filter((s) => s.value > 0);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return "";
  let accumulated = 0;
  const stops = [];
  for (const segment of segments) {
    const start = accumulated / total * 360;
    accumulated += segment.value;
    const end = accumulated / total * 360;
    stops.push(`${segment.color} ${start}deg ${end}deg`);
  }
  const gradient = `conic-gradient(${stops.join(", ")})`;
  const legend = segments.map((s) => `
    <div class="pie-legend-item">
      <span class="pie-legend-dot" style="background:${s.color}"></span>
      <span class="pie-legend-label">${escapeHtml(s.label)}</span>
      <span class="pie-legend-value">${money(s.value)}</span>
    </div>
  `).join("");
  return `
    <div class="pie-chart-wrap">
      <div class="pie-chart" style="background:${gradient}" aria-label="薪资构成饼图"></div>
      <div class="pie-legend">${legend}</div>
    </div>
  `;
}

function renderWeeklyTrend(yearSummary, year, monthIndex) {
  const entries = state.entries.filter((entry) => {
    return entry.date?.startsWith(`${year}-${String(monthIndex + 1).padStart(2, "0")}`);
  });
  if (!entries.length) return "";
  const weeks = new Map();
  for (const entry of entries) {
    const d = new Date(`${entry.date}T00:00:00`);
    const key = weekStartDate(entry.date, state.settings.weekStart);
    if (!weeks.has(key)) weeks.set(key, { hours: 0, label: key.slice(5) });
    weeks.get(key).hours += normalizeEntry(entry, state.settings).totalHours;
  }
  const weekData = [...weeks.values()].sort((a, b) => a.label.localeCompare(b.label));
  if (!weekData.length) return "";
  const maxHours = Math.max(1, ...weekData.map((w) => w.hours));
  const bars = weekData.map((w) => {
    const pct = Math.max(4, w.hours / maxHours * 100);
    return `
      <div class="weekly-bar-item">
        <span class="weekly-bar-hours">${round2(w.hours)}h</span>
        <div class="weekly-bar" style="height:${pct}%"></div>
        <span class="weekly-bar-label">${w.label}</span>
      </div>
    `;
  }).join("");
  return `
    <div class="weekly-trend">
      <span class="weekly-trend-title">周工时趋势</span>
      <div class="weekly-bars">${bars}</div>
    </div>
  `;
}

function renderAppFooter() {
  const year = new Date().getFullYear();
  return `
    <footer class="sidebar-footer" aria-label="页脚">
      <a class="sidebar-release-link" href="./changelog.html" aria-label="查看更新日志">
        <span class="footer-stat">
          <strong>${APP_VERSION}</strong>
          <em>当前版本</em>
        </span>
        <span class="footer-stat-action">查看日志</span>
      </a>
      <div class="sidebar-footer-bottom">
        <span>© ${year} yuan 版权所有</span>
        <div class="sidebar-footer-links">
          <a class="footer-icon-link" href="https://github.com/yuan-666/WorkTimeAPP" target="_blank" rel="noopener" aria-label="GitHub">
            <svg width="18" height="18" aria-hidden="true"><use href="./assets/social-icons.svg#github-icon"></use></svg>
          </a>
          <a class="footer-icon-link" href="https://yuan6.cn" target="_blank" rel="noopener" aria-label="友情链接：yuan6.cn">
            <svg width="18" height="18" aria-hidden="true"><use href="./assets/social-icons.svg#blog-icon"></use></svg>
          </a>
        </div>
      </div>
    </footer>
  `;
}

function renderMobileFooter() {
  const year = new Date().getFullYear();
  return `
    <div class="mobile-footer-strip" aria-label="页脚">
      <span>© ${year} yuan</span>
      <a href="./changelog.html" aria-label="查看更新日志">${APP_VERSION}</a>
      <a href="https://github.com/yuan-666/WorkTimeAPP" target="_blank" rel="noopener" aria-label="GitHub">
        <svg width="15" height="15" aria-hidden="true"><use href="./assets/social-icons.svg#github-icon"></use></svg>
      </a>
      <a href="https://yuan6.cn" target="_blank" rel="noopener" aria-label="友情链接：yuan6.cn">
        <svg width="15" height="15" aria-hidden="true"><use href="./assets/social-icons.svg#blog-icon"></use></svg>
      </a>
    </div>
  `;
}

function renderSettingsView() {
  const settings = state.settings;
  const insights = deriveSalaryInsights(settings);
  const modeFields = settingsFieldsForMode(settings.salaryMode);
  const isMobile = isMobileViewport();
  const sheetGroup = ui.settingsSheetOpen;
  const settingsGroups = [
    { id: "salary", title: "薪资方式与时薪", summary: MODE_LABELS[settings.salaryMode], open: true },
    { id: "overtime", title: "加班倍率", summary: `工作日 ${settings.overtimeMultiplier}x / 休息日 ${settings.restDayMultiplier}x / 节假日 ${settings.holidayMultiplier}x`, open: true },
    { id: "goals", title: "目标", summary: `月收入 ${money(settings.goals.monthlyIncome)} / 月工时 ${settings.goals.monthlyHours}h`, open: false },
    { id: "shifts", title: "班次管理", summary: `${settings.shiftPresets.length} 个班次模板`, open: false },
    { id: "workdays", title: "工作日与假期", summary: `${restCycleLabel(settings.restCycle.mode)} · 周${weekLabelByIndex(settings.weekStart)}开周`, open: false },
    { id: "adjustment", title: "自动补扣", summary: settings.autoAdjustment.enabled ? `已开启 ${money(settings.autoAdjustment.amount)}/天` : "未开启", open: false },
    { id: "tax", title: "个税设置", summary: "累计预扣法", open: false },
    { id: "display", title: "显示", summary: themeModeLabel(settings.themeMode), open: false },
    { id: "data", title: "数据管理", summary: state.cloud?.lastSyncAt ? `云同步 ${formatDateTime(state.cloud.lastSyncAt)}` : "本地备份与云同步", open: false },
    { id: "about", title: "关于", summary: `明薪工时 ${APP_VERSION}`, open: false }
  ];

  const salaryBody = `
    <div class="settings-group-body">
      ${field("薪资方式", `
        <select name="salaryMode">
          ${option(SALARY_MODES.REGULAR_OVERTIME, MODE_LABELS[SALARY_MODES.REGULAR_OVERTIME], settings.salaryMode)}
          ${option(SALARY_MODES.BASE_OVERTIME, MODE_LABELS[SALARY_MODES.BASE_OVERTIME], settings.salaryMode)}
          ${option(SALARY_MODES.COMPREHENSIVE, MODE_LABELS[SALARY_MODES.COMPREHENSIVE], settings.salaryMode)}
          ${option(SALARY_MODES.HOURLY, MODE_LABELS[SALARY_MODES.HOURLY], settings.salaryMode)}
        </select>
      `)}
      <label class="check-row">
        <input type="checkbox" name="autoFillWorkday" value="true" ${settings.autoFillWorkday ? "checked" : ""}>
        <span>无记录的工作日自动算 ${settings.normalHoursPerDay}h 正班（勾选后不需要每天手动登记）</span>
      </label>
      <div class="form-grid">
        ${modeFields.includes("normalHoursPerDay") ? numberField("每日正班小时", "normalHoursPerDay", settings.normalHoursPerDay, 0.25, { max: WORK_LIMITS.maxRegularHours }) : ""}
        ${modeFields.includes("baseSalary") ? moneyField("底薪", "baseSalary", settings.baseSalary) : ""}
        ${modeFields.includes("standardMonthlyHours") ? numberField("月计薪小时", "standardMonthlyHours", settings.standardMonthlyHours, 0.25, { max: WORK_LIMITS.maxMonthlyHours }) : ""}
        ${modeFields.includes("regularHourlyRate") ? moneyField("正班时薪（可留空自动算）", "regularHourlyRate", settings.regularHourlyRate) : ""}
        ${modeFields.includes("hourlyRate") ? moneyField("小时工正班时薪（可留空自动算）", "hourlyRate", settings.hourlyRate) : ""}
        ${modeFields.includes("baseOvertimeRate") ? moneyField("底薪加班时薪（可留空）", "baseOvertimeRate", settings.baseOvertimeRate) : ""}
        ${modeFields.includes("comprehensiveHourlyRate") ? moneyField("综合工时时薪", "comprehensiveHourlyRate", settings.comprehensiveHourlyRate) : ""}
        ${modeFields.includes("comprehensiveTargetHours") ? numberField("综合目标小时", "comprehensiveTargetHours", settings.comprehensiveTargetHours, 0.25, { max: WORK_LIMITS.maxMonthlyHours }) : ""}
      </div>
    </div>`;

  const overtimeBody = `
    <div class="settings-group-body">
      <div class="form-grid">
        ${numberField("工作日加班倍率", "overtimeMultiplier", settings.overtimeMultiplier, 0.05, { max: 5 })}
        ${numberField("休息日倍率", "restDayMultiplier", settings.restDayMultiplier, 0.05, { max: 5 })}
        ${numberField("节假日倍率", "holidayMultiplier", settings.holidayMultiplier, 0.05, { max: 5 })}
        ${numberField("综合超时倍率", "comprehensiveOvertimeMultiplier", settings.comprehensiveOvertimeMultiplier, 0.05, { max: 5 })}
      </div>
    </div>`;

  const goalsBody = `
    <div class="settings-group-body">
      <div class="form-grid">
        ${moneyField("月收入目标", "goals.monthlyIncome", settings.goals.monthlyIncome)}
        ${numberField("月工时目标", "goals.monthlyHours", settings.goals.monthlyHours, 0.25, { max: WORK_LIMITS.maxMonthlyHours })}
      </div>
    </div>`;

  const currentWorkType = detectWorkType(settings.shiftPresets);
  const shiftsBody = `
    <div class="settings-group-body">
      ${field("上班方式", `
        <select name="workType">
          <option value="day" ${currentWorkType === "day" ? "selected" : ""}>固定白班</option>
          <option value="night" ${currentWorkType === "night" ? "selected" : ""}>固定夜班</option>
          <option value="rotating" ${currentWorkType === "rotating" ? "selected" : ""}>轮班（白班+夜班）</option>
          <option value="custom" ${currentWorkType === "custom" ? "selected" : ""}>自定义班次</option>
        </select>
      `)}
      ${field("默认班次", `
        <select name="defaultPresetId">
          ${settings.shiftPresets.filter((p) => p.dayType !== "restday").map((preset) => option(preset.id, preset.name, settings.defaultPresetId)).join("")}
        </select>
      `)}
      <div class="preset-editor">
        ${settings.shiftPresets.map((preset, index) => `<div class="${preset.id === "rest" ? "preset-hidden" : ""}">${renderPresetEditor(preset, index)}</div>`).join("")}
      </div>
      <small class="helper">选择上班方式会自动配置常用班次；默认班次决定工作日自动使用哪个模板。</small>
    </div>`;

  const workdaysBody = `
    <div class="settings-group-body">
      <div class="form-grid">
        ${field("每周从哪天开始", `
          <select name="weekStart">
            ${weekdayOrder(1).map((day) => option(String(day), `周${weekLabelByIndex(day)}`, String(settings.weekStart))).join("")}
          </select>
        `)}
        ${field("休假方式", `
          <select name="restCycle.mode">
            ${option(REST_CYCLE_MODES.DOUBLE_WEEKEND, "每周双休（周六周日）", settings.restCycle.mode)}
            ${option(REST_CYCLE_MODES.SINGLE_SUNDAY, "每周单休（周日）", settings.restCycle.mode)}
            ${option(REST_CYCLE_MODES.WORKWEEK, "自定义每周休息日", settings.restCycle.mode)}
            ${option(REST_CYCLE_MODES.WORK_6_REST_1, "上六休一", settings.restCycle.mode)}
            ${option(REST_CYCLE_MODES.WORK_14_REST_1, "上十四休一", settings.restCycle.mode)}
            ${option(REST_CYCLE_MODES.CUSTOM, "自定义连续周期", settings.restCycle.mode)}
          </select>
        `)}
      </div>
      <small class="helper">每周双休/单休会自动套用常见休息日；轮班制可用上六休一、上十四休一，并通过休息记录自动推算下一次休假。</small>
      <div class="workweek-grid custom-workweek-grid">
        ${weekdayOrder(settings.weekStart).map((weekday) => checkbox(`workweek.${weekday}`, String(weekday), `周${weekLabelByIndex(weekday)}上班`, settings.workweek.includes(weekday))).join("")}
      </div>
      ${renderHolidayRuleCard()}
      <h3>放假提醒</h3>
      ${renderRestCycleSettings(settings)}
    </div>`;

  const adjustmentBody = `
    <div class="settings-group-body">
      <label class="check-row">
        <input type="checkbox" name="autoAdjustment.enabled" value="true" ${settings.autoAdjustment.enabled ? "checked" : ""}>
        <span>保存工时时自动添加日补扣</span>
      </label>
      <div class="form-grid">
        ${moneyField("日补扣金额", "autoAdjustment.amount", settings.autoAdjustment.amount)}
        ${field("补扣类型", `<select name="autoAdjustment.type">${option("allowance", "补贴", settings.autoAdjustment.type)}${option("deduction", "扣款", settings.autoAdjustment.type)}</select>`)}
        ${field("补扣分类", `<input name="autoAdjustment.category" type="text" maxlength="30" value="${escapeAttr(settings.autoAdjustment.category)}">`)}
        ${field("补扣备注", `<input name="autoAdjustment.note" type="text" maxlength="60" value="${escapeAttr(settings.autoAdjustment.note)}">`)}
      </div>
    </div>`;

  const taxBody = `
    <div class="settings-group-body">
      <div class="tax-note">
        <strong>累计预扣法</strong>
        <span>应纳税所得额 = 累计收入 - 累计减除费用 - 累计专项扣除 - 累计专项附加扣除 - 依法确定的其他扣除。</span>
      </div>
      <div class="form-grid">
        ${moneyField("月减除费用", "tax.standardDeductionMonthly", settings.tax.standardDeductionMonthly)}
        ${moneyField("专项附加扣除", "tax.specialAdditionalDeductionMonthly", settings.tax.specialAdditionalDeductionMonthly)}
        ${field("其他扣除", `<select name="tax.otherDeductionMode">${option("fixed", "按金额", settings.tax.otherDeductionMode)}${option("percent", "按比例", settings.tax.otherDeductionMode)}</select>`)}
        ${moneyFieldWithClass("其他扣除金额", "tax.fixedDeductionMonthly", settings.tax.fixedDeductionMonthly, "tax-other-fixed")}
        ${numberFieldWithClass("其他扣除比例%", "tax.deductionPercent", settings.tax.deductionPercent, 0.01, { max: 100 }, "tax-other-percent")}
        ${field("社保公积金", `<select name="tax.socialSecurityMode">${option("fixed", "按金额", settings.tax.socialSecurityMode)}${option("percent", "按比例", settings.tax.socialSecurityMode)}</select>`)}
        ${moneyFieldWithClass("社保公积金金额", "tax.socialSecurityFixedMonthly", settings.tax.socialSecurityFixedMonthly, "tax-social-fixed")}
        ${numberFieldWithClass("社保公积金比例%", "tax.socialSecurityPercent", settings.tax.socialSecurityPercent, 0.01, { max: 100 }, "tax-social-percent")}
      </div>
    </div>`;

  const displayBody = `
    <div class="settings-group-body">
      ${field("明暗模式", `
        <select name="themeMode">
          ${option("system", "跟随系统", settings.themeMode)}
          ${option("light", "浅色", settings.themeMode)}
          ${option("dark", "深色", settings.themeMode)}
        </select>
      `)}
    </div>`;

  const dataBody = `
    <div class="settings-group-body">
      ${renderCloudSyncPanel()}
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
    </div>`;

  const aboutBody = `
    <div class="settings-group-body about-section">
      <div class="about-logo">
        <img src="./assets/icon.svg" alt="" width="48" height="48">
        <div>
          <strong>明薪工时</strong>
          <span>${APP_VERSION}</span>
        </div>
      </div>
      <p class="about-desc">离线优先的工时记录 PWA，支持跨平台使用。</p>
      <div class="about-links">
        <a class="about-link" href="./changelog.html">
          <span>更新日志</span>
          <span class="settings-menu-arrow">›</span>
        </a>
        <a class="about-link" href="https://github.com/yuan-666/WorkTimeAPP" target="_blank" rel="noopener">
          <span>GitHub 仓库</span>
          <span class="settings-menu-arrow">›</span>
        </a>
        <a class="about-link" href="https://yuan6.cn" target="_blank" rel="noopener">
          <span>作者博客</span>
          <span class="settings-menu-arrow">›</span>
        </a>
      </div>
      <p class="about-copyright">© ${new Date().getFullYear()} yuan 版权所有</p>
    </div>`;

  const groupBodies = { salary: salaryBody, overtime: overtimeBody, goals: goalsBody, shifts: shiftsBody, workdays: workdaysBody, adjustment: adjustmentBody, tax: taxBody, display: displayBody, data: dataBody, about: aboutBody };

  if (isMobile) {
    const hasDetail = Boolean(sheetGroup);
    return `
      <div class="workspace settings-layout">
        <section class="detail-panel">
          <div class="settings-mobile-list ${hasDetail ? "is-hidden" : ""}">
            <div class="panel-head">
              <div>
                <p class="eyebrow">规则</p>
                <h2>薪资设置</h2>
              </div>
            </div>
            <form id="settings-form" class="tool-form" data-tax-other-mode="${escapeAttr(settings.tax.otherDeductionMode)}" data-tax-social-mode="${escapeAttr(settings.tax.socialSecurityMode)}" data-rest-cycle-mode="${escapeAttr(settings.restCycle.mode)}">
              <div class="insight-panel">
                <div>
                  <span>自动推算</span>
                  <strong>正班 ${money(insights.regularHourlyRate)} / 小时 ${money(insights.rates.hourlyRate)}</strong>
                </div>
                <p>${insights.missingConfig.length ? `还需要填写：${insights.missingConfig.map((key) => MISSING_LABELS[key] || key).join("、")}` : `可用底薪和月计薪小时自动反推时薪。`}</p>
              </div>
              <div class="settings-mobile-menu">
                ${settingsGroups.map((group) => `
                  <button class="settings-menu-item" type="button" data-action="open-settings-sheet" data-group="${group.id}">
                    <div>
                      <strong>${escapeHtml(group.title)}</strong>
                      <span>${escapeHtml(group.summary)}</span>
                    </div>
                    <span class="settings-menu-arrow">›</span>
                  </button>
                `).join("")}
              </div>
              <div class="settings-mobile-save">
                <button class="primary-button" type="submit">保存全部设置</button>
              </div>
            </form>
          </div>
          ${settingsGroups.map((group) => {
            const isVisibleDetail = sheetGroup === group.id;
            return `
            <div class="settings-mobile-detail ${isVisibleDetail ? "is-visible" : ""}" data-settings-detail="${group.id}" aria-hidden="${isVisibleDetail ? "false" : "true"}" ${isVisibleDetail ? "" : "inert"}>
              <div class="settings-detail-header">
                <button class="mobile-back-btn" type="button" data-action="close-settings-sheet">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <h2>${escapeHtml(group.title)}</h2>
                <span></span>
              </div>
              <form class="tool-form settings-detail-form" data-settings-group="${group.id}" data-tax-other-mode="${escapeAttr(settings.tax.otherDeductionMode)}" data-tax-social-mode="${escapeAttr(settings.tax.socialSecurityMode)}" data-rest-cycle-mode="${escapeAttr(settings.restCycle.mode)}">
                ${groupBodies[group.id]}
                <div class="settings-detail-save">
                  <button class="primary-button" type="submit">保存</button>
                </div>
              </form>
            </div>
          `;
          }).join("")}
        </section>
      </div>
    `;
  }

  return `
    <div class="workspace settings-layout">
      <section class="detail-panel">
        <div class="panel-head">
          <div>
            <p class="eyebrow">规则</p>
            <h2>薪资设置</h2>
          </div>
        </div>
        <form id="settings-form" class="tool-form" data-tax-other-mode="${escapeAttr(settings.tax.otherDeductionMode)}" data-tax-social-mode="${escapeAttr(settings.tax.socialSecurityMode)}" data-rest-cycle-mode="${escapeAttr(settings.restCycle.mode)}">
          <div class="insight-panel">
            <div>
              <span>自动推算</span>
              <strong>正班 ${money(insights.regularHourlyRate)} / 小时 ${money(insights.rates.hourlyRate)}</strong>
            </div>
            <p>${insights.missingConfig.length ? `还需要填写：${insights.missingConfig.map((key) => MISSING_LABELS[key] || key).join("、")}` : `可用底薪和月计薪小时自动反推时薪，也可以手动填写。`}</p>
          </div>
          ${settingsGroups.map((group) => `
            <details class="settings-group" ${group.open ? "open" : ""}>
              <summary class="settings-group-title">
                <span>${escapeHtml(group.title)}</span>
                <small>${escapeHtml(group.summary)}</small>
              </summary>
              ${groupBodies[group.id]}
            </details>
          `).join("")}
        </form>
      </section>
    </div>
  `;
}

function renderCloudSyncPanel() {
  const cloud = state.cloud || {};
  return `
    <div class="cloud-sync-card">
      <div class="cloud-sync-head">
        <div>
          <span>云备份</span>
          <strong>${cloud.userId ? `账号 ${escapeHtml(cloud.userId)}` : "未登录"}</strong>
        </div>
        <small>${cloud.remoteUpdatedAt ? `云端更新 ${formatDateTime(cloud.remoteUpdatedAt)}` : "可在多台设备之间恢复数据"}</small>
      </div>
      <div class="form-grid">
        ${field("云备份账号", `<input name="cloud.userId" type="text" value="${escapeAttr(cloud.userId || "")}" autocomplete="username" placeholder="3-64 位字母、数字、下划线或短横线">`)}
        ${field("密码", `<input name="cloud.password" type="password" autocomplete="current-password" placeholder="仅本次操作使用，不会保存到本机">`)}
        <label class="field cloud-hint"><span>说明</span><small>登录后可以把本机记录备份到云端，也可以在新设备上恢复。恢复前请确认账号无误。</small></label>
      </div>
      <div class="button-row cloud-actions">
        <button class="plain-button" type="button" data-action="cloud-login">登录</button>
        <button class="plain-button" type="button" data-action="cloud-register">创建并备份</button>
        <button class="primary-button" type="button" data-action="cloud-push">备份本机</button>
        <button class="danger-button" type="button" data-action="cloud-pull">恢复到本机</button>
      </div>
      <small class="helper">恢复会用云端备份覆盖本机工时、设置和补扣记录。</small>
    </div>
  `;
}

function renderHolidayRuleCard() {
  const sample = getHolidayInfo(`${ui.year}-01-01`) || getHolidayInfo("2026-01-01");
  const hasSchedule = !!getHolidayInfo(`${ui.year}-01-01`);
  return `
    <div class="holiday-card">
      <div>
        <span>节假日识别</span>
        <strong>${hasSchedule ? `已接入 ${ui.year} 年调休表` : (sample ? "已接入 2026/2027 调休表" : "按每周工作日判断")}</strong>
      </div>
      <p>${hasSchedule ? "法定节假日、休息日和调休上班会覆盖上方每周工作日设置；批量生成也会自动跳过放假日期。" : (sample ? `${ui.year} 年暂未内置调休表，会使用上方勾选的每周工作日。已有 2026/2027 年数据。` : "当前年份未内置国务院放假表，会使用上方勾选的每周工作日。")}</p>
    </div>
  `;
}

function renderRestCycleSettings(settings) {
  const reminder = calculateRestReminder(today, settings, state.entries);
  return `
    <div class="rest-cycle-card">
      <div>
        <span>${escapeHtml(reminder.label)}</span>
        <strong>${escapeHtml(reminder.detail)}${reminder.anchorDate ? ` · 起点 ${escapeHtml(reminder.anchorDate)}` : ""}</strong>
      </div>
      <div class="form-grid">
        ${fieldWithClass("上一次休息", `<input name="restCycle.lastRestDate" type="date" value="${escapeAttr(settings.restCycle.lastRestDate || "")}">`, "rest-anchor-field")}
        ${numberFieldWithClass("连续上班天数", "restCycle.workDays", settings.restCycle.workDays, 1, { min: 1, max: 31 }, "rest-custom-field")}
        ${numberFieldWithClass("连续休息天数", "restCycle.restDays", settings.restCycle.restDays, 1, { min: 1, max: 14 }, "rest-custom-field")}
      </div>
    </div>
  `;
}

function saveEntry(form, saveMode = "work") {
  const data = Object.fromEntries(new FormData(form));
  const existingId = data.id || ui.editingEntryId;
  const existing = state.entries.find((item) => item.id === existingId);
  if (data.sourceHint === "leave-note") {
    const leaveDefaults = leaveDefaultsForType(data.leaveType);
    const leavePayMode = data.leavePayMode || leaveDefaults.leavePayMode;
    const leaveMultiplier = leavePayMode === "unpaid" ? 0 : Number(data.leavePayMultiplier || leaveDefaults.leavePayMultiplier);
    saveEntryObject({
      id: existingId || createId("entry"),
      date: data.date,
      recordMode: RECORD_MODES.HOURS,
      dayType: data.dayType || inferDayType(data.date, state.settings),
      regularHours: 0,
      overtimeHours: 0,
      totalHours: 0,
      leaveType: data.leaveType || "annual",
      leavePayMode,
      leavePayMultiplier: leaveMultiplier,
      leaveHours: Number(data.leaveHours || state.settings.normalHoursPerDay),
      leaveDeductionAmount: leavePayMode === "deduct" ? Number(data.leaveDeductionAmount || 0) : 0,
      target: data.target?.trim() || "",
      note: data.note?.trim() || LEAVE_TYPES[data.leaveType] || "请假",
      source: "leave-note",
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    }, "已保存请假", { strategy: "replace-main", skipAutoAdjustment: true });
    return;
  }
  if (saveMode === "rest") {
    saveEntryObject({
      id: existingId || createId("entry"),
      date: data.date,
      recordMode: RECORD_MODES.HOURS,
      dayType: "restday",
      regularHours: 0,
      overtimeHours: 0,
      totalHours: 0,
      target: data.target?.trim() || "",
      note: data.note?.trim() || "休息",
      source: "rest-day",
      updatedAt: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    }, "已标记休息", { strategy: "replace-main", skipAutoAdjustment: true });
    return;
  }
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
    source: "manual",
    updatedAt: new Date().toISOString(),
    createdAt: existing?.createdAt || new Date().toISOString()
  }, "已保存工时记录", { strategy: "replace-main" });
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
  if (!options.skipAutoAdjustment) addAutoAdjustment(normalizedEntry.date);
  ui.selectedDate = normalizedEntry.date;
  ui.year = yearFromDate(normalizedEntry.date);
  ui.monthIndex = monthIndexFromDate(normalizedEntry.date);
  ui.editingEntryId = "";
  ui.entryIntent = "";
  ui.entryError = "";
  if (isMobileViewport()) {
    ui.entrySheetOpen = false;
    ui.entrySheetVisible = false;
  }
  persist(validation.warnings[0] ? `${notice}，${validation.warnings[0]}` : notice);
  render();
  return true;
}

function resolveEntryForSave(entry, options = {}) {
  if (entry.id) {
    const existing = state.entries.find((item) => item.id === entry.id);
    if (existing) return { id: existing.id, createdAt: existing.createdAt };
  }

  const sameDate = state.entries.filter((item) => item.date === entry.date);
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
  const draft = settingsFromForm(form);
  state.settings = draft.settings;
  state.cloud = draft.cloud;
  ui.settingsSheetOpen = "";
  persist("已保存设置");
  render();
}

function settingsFromForm(form) {
  const data = Object.fromEntries(new FormData(form));
  const next = mergeSettings(state.settings);
  const nextCloud = { ...(state.cloud || {}) };
  const hasWorkweek = Boolean(form.querySelector('[name^="workweek."]'));
  const hasPresets = Boolean(form.querySelector('[name^="shiftPresets."]'));
  const hasAutoAdj = Boolean(form.querySelector('[name="autoAdjustment.enabled"]'));
  const hasAutoFill = Boolean(form.querySelector('[name="autoFillWorkday"]'));
  const hasRestCycleMode = Boolean(form.querySelector('[name="restCycle.mode"]'));
  if (hasWorkweek) next.workweek = [];
  if (hasPresets) next.shiftPresets = [];
  if (hasAutoAdj) next.autoAdjustment.enabled = false;
  if (hasAutoFill) next.autoFillWorkday = false;
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("cloud.")) {
      const fieldName = key.split(".")[1];
      if (fieldName !== "password") nextCloud[fieldName] = value;
      continue;
    }
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
    if (key === "autoFillWorkday") {
      next.autoFillWorkday = true;
      continue;
    }
    if (key === "workType") continue;
    setDeep(next, key, value === "" ? 0 : Number.isNaN(Number(value)) ? value : Number(value));
  }
  if (hasRestCycleMode && next.restCycle.mode === REST_CYCLE_MODES.DOUBLE_WEEKEND) {
    next.workweek = [1, 2, 3, 4, 5];
    next.restCycle.workDays = 5;
    next.restCycle.restDays = 2;
  }
  if (hasRestCycleMode && next.restCycle.mode === REST_CYCLE_MODES.SINGLE_SUNDAY) {
    next.workweek = [1, 2, 3, 4, 5, 6];
    next.restCycle.workDays = 6;
    next.restCycle.restDays = 1;
  }
  if (hasWorkweek && !next.workweek.length) next.workweek = DEFAULT_SETTINGS.workweek;
  return {
    settings: limitSettings(next),
    cloud: normalizeCloudConfig(nextCloud)
  };
}

function saveSetupWizard(form) {
  const data = Object.fromEntries(new FormData(form));
  const salaryMode = data.salaryMode || SALARY_MODES.REGULAR_OVERTIME;
  const settings = mergeSettings(state.settings);
  settings.salaryMode = salaryMode;
  settings.baseSalary = Number(data.baseSalary || 0);
  settings.standardMonthlyHours = Number(data.standardMonthlyHours || 174);
  settings.hourlyRate = Number(data.hourlyRate || 0);
  settings._wizardDone = true;

  // Update default shift preset
  const startTime = data.startTime || "09:00";
  const endTime = data.endTime || "18:00";
  const breakMinutes = Number(data.breakMinutes || 60);
  if (settings.shiftPresets.length > 0) {
    settings.shiftPresets[0].startTime = startTime;
    settings.shiftPresets[0].endTime = endTime;
    settings.shiftPresets[0].breakMinutes = breakMinutes;
  }

  state.settings = limitSettings(settings);
  persist("设置完成，开始记录工时吧");
  render();
}

async function handleCloudAction(action, sourceTarget = null) {
  const auth = cloudConfigFromForm(sourceTarget);
  if (!auth.userId || !auth.password) {
    persist("请填写云备份账号和密码");
    render();
    return;
  }
  if (!/^[a-zA-Z0-9_-]{3,64}$/.test(auth.userId)) {
    persist("用户 ID 仅支持 3-64 位字母、数字、下划线或短横线");
    render();
    return;
  }
  if (auth.password.length < 6) {
    persist("密码至少 6 位");
    render();
    return;
  }
  if (action === "cloud-pull" && !window.confirm("确认用云端备份覆盖本机数据吗？")) {
    return;
  }

  const actionName = action.replace("cloud-", "");
  const payload = {
    action: actionName,
    userId: auth.userId
  };
  if (actionName === "register" || actionName === "push") {
    payload.data = createCloudSnapshot();
    payload.knownUpdatedAt = state.cloud?.remoteUpdatedAt || "";
  }

  try {
    const encryptedPassword = await encryptCloudPassword(auth.password);
    payload.passwordCipher = encryptedPassword.ciphertext;
    payload.passwordKeyId = encryptedPassword.keyId;
    const result = await postCloud(payload);
    if (!result.ok) throw new Error(cloudErrorMessage(actionName, result.error, result.status));
    state.cloud = normalizeCloudConfig({
      ...state.cloud,
      userId: auth.userId,
      lastSyncAt: new Date().toISOString(),
      remoteUpdatedAt: result.updatedAt || result.record?.updatedAt || state.cloud?.remoteUpdatedAt || ""
    });
    if (actionName === "pull" && result.data) {
      applyCloudSnapshot(result.data, state.cloud);
      persist("已从云端恢复本机数据");
    } else {
      saveState(state);
      persist(cloudActionNotice(actionName));
    }
  } catch (error) {
    persist(cloudErrorMessage(actionName, error.message));
  }
  render();
}

function cloudErrorMessage(action, message, status) {
  if (!message) return "云同步失败，请检查网络后重试";
  if (message.includes("已存在")) return "该账号已存在，请直接登录";
  if (message.includes("账号或密码不正确")) return "账号或密码不正确，请检查后重试";
  if (message.includes("已停用")) return "账号已停用，暂时无法使用云备份";
  if (message.includes("已有更新")) return "云端已有新数据，请先恢复或重新登录后再备份";
  if (message.includes("登录信息")) return message;
  if (message.includes("安全密钥")) return "云备份安全配置异常，请联系管理员";
  if (message.includes("超过")) return "数据量过大，请先导出本地备份或清理历史记录";
  if (status === 401) return action === "register" ? "注册失败，请更换账号名" : "登录失败，请检查账号和密码";
  if (status === 409) return action === "register" ? "该账号已存在，请直接登录" : "数据冲突，请先恢复再备份";
  if (status === 403) return "账号已被停用，暂时无法操作";
  if (status >= 500) return "服务器暂时不可用，请稍后再试";
  return message;
}

function cloudConfigFromForm(sourceTarget = null) {
  const form = sourceTarget?.closest?.("form")
    || document.querySelector(".cloud-sync-card")?.closest("form")
    || document.querySelector("#settings-form");
  const data = form ? Object.fromEntries(new FormData(form)) : {};
  const cloud = normalizeCloudConfig({
    ...(state.cloud || {}),
    userId: data["cloud.userId"] || state.cloud?.userId
  });
  state.cloud = cloud;
  saveState(state);
  return {
    ...cloud,
    password: String(data["cloud.password"] || "")
  };
}

function normalizeCloudConfig(cloud = {}) {
  return {
    userId: String(cloud.userId || "").trim(),
    lastSyncAt: cloud.lastSyncAt || "",
    remoteUpdatedAt: cloud.remoteUpdatedAt || ""
  };
}

async function encryptCloudPassword(password) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("当前浏览器不支持安全云备份，请换用新版浏览器。");
  }
  const keyResponse = await fetch(`${CLOUD_API_BASE}/key`, { method: "GET", cache: "no-store" });
  const keyInfo = await keyResponse.json().catch(() => ({}));
  if (!keyResponse.ok || !keyInfo.publicKey) {
    throw new Error(keyInfo.error || "云备份暂未配置安全密钥。");
  }
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    keyInfo.publicKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
  const encrypted = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    new TextEncoder().encode(password)
  );
  return {
    ciphertext: base64UrlBytes(new Uint8Array(encrypted)),
    keyId: keyInfo.keyId || ""
  };
}

async function postCloud(payload) {
  const response = await fetch(CLOUD_API_BASE, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));
  return response.ok ? { ok: true, ...result } : { ok: false, status: response.status, ...result };
}

function createCloudSnapshot() {
  return {
    app: "worktimeapp",
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: mergeSettings(state.settings || {}),
    entries: state.entries || [],
    adjustments: state.adjustments || [],
    activeView: state.activeView || "calendar",
    backup: state.backup || {}
  };
}

function applyCloudSnapshot(data, cloud) {
  state = {
    ...state,
    settings: limitSettings(mergeSettings(data.settings || {})),
    entries: Array.isArray(data.entries) ? data.entries : [],
    adjustments: Array.isArray(data.adjustments) ? data.adjustments : [],
    activeView: data.activeView || state.activeView || "calendar",
    backup: { ...(state.backup || {}), ...(data.backup || {}) },
    cloud
  };
  ui.view = state.activeView || "calendar";
  saveState(state);
}

function cloudActionNotice(actionName) {
  return ({
    login: "云备份账号已登录",
    register: "已创建账号并备份本机数据",
    push: "已备份本机数据"
  })[actionName] || "云同步完成";
}

function updateSetupPreview() {
  const form = document.querySelector("#setup-form");
  const output = document.querySelector("#setup-time-preview");
  if (!form || !output) return;
  const data = Object.fromEntries(new FormData(form));
  const breakMinutes = Number(data.breakMinutes || 0);
  const totalHours = calculateTimeHours(data.startTime, data.endTime, breakMinutes);
  const regularHours = Math.min(totalHours, DEFAULT_SETTINGS.normalHoursPerDay);
  const overtimeHours = Math.max(0, round2(totalHours - regularHours));
  output.innerHTML = `
    <span>预计每天</span>
    <strong>${round2(totalHours)}h</strong>
    <small>正班 ${round2(regularHours)}h · 加班 ${round2(overtimeHours)}h · 午休 ${Math.max(0, breakMinutes)} 分钟</small>
  `;
}

function updateEntryPreview() {
  const form = document.querySelector("#entry-form");
  const output = document.querySelector("#entry-preview");
  const timePreview = document.querySelector("#time-preview");
  const errorBox = document.querySelector("#entry-error");
  if (!form || !output) return;
  const data = Object.fromEntries(new FormData(form));
  const recordMode = data.recordMode || RECORD_MODES.TIME;
  let totalHours = 0;
  if (data.sourceHint === "leave-note") {
    totalHours = 0;
  } else if (recordMode === RECORD_MODES.TIME) {
    totalHours = calculateTimeHours(data.startTime, data.endTime, Number(data.breakMinutes || 0));
  } else {
    const regular = Number(data.regularHours || 0);
    const overtime = Number(data.overtimeHours || 0);
    totalHours = Number(data.totalHours || 0) || regular + overtime;
  }
  const entry = {
    ...data,
    id: data.id || ui.editingEntryId,
    source: data.sourceHint || "",
    recordMode,
    breakMinutes: Number(data.breakMinutes || 0),
    regularHours: Number(data.regularHours || 0),
    overtimeHours: Number(data.overtimeHours || 0),
    totalHours,
    leaveType: data.leaveType,
    leavePayMode: data.leavePayMode,
    leavePayMultiplier: Number(data.leavePayMultiplier || 0),
    leaveHours: Number(data.leaveHours || state.settings.normalHoursPerDay),
    leaveDeductionAmount: Number(data.leaveDeductionAmount || 0)
  };
  const normalized = normalizeEntry(entry, state.settings);
  const pay = calculateEntryPay(entry, state.settings);
  const validation = validateEntry(entry, state.settings, state.entries);
  const isLeave = data.sourceHint === "leave-note";
  const leaveHours = Number(data.leaveHours || state.settings.normalHoursPerDay);
  const displayHours = isLeave ? leaveHours : normalized.totalHours;
  const monthlyPreview = validation.valid ? monthlyPreviewAfterEntry(entry, validation.normalized) : "";
  output.textContent = validation.valid
    ? `${isLeave ? "请假 " : ""}${displayHours}h · 本条 ${money(pay.totalPay)}${monthlyPreview ? ` · ${monthlyPreview}` : ""}`
    : `${displayHours}h / 不可保存`;
  if (timePreview) {
    timePreview.innerHTML = isLeave
      ? `
        <span>请假预览</span>
        <strong>${leaveHours}h</strong>
        <small>${escapeHtml(LEAVE_TYPES[data.leaveType] || "请假")} · ${escapeHtml(leavePayModeLabel(data.leavePayMode))} · 预计 ${money(pay.totalPay)}</small>
      `
      : `
        <span>当天工时</span>
        <strong>${normalized.totalHours}h</strong>
        <small>正班 ${normalized.regularHours}h · 加班 ${normalized.overtimeHours}h · 预计 ${money(pay.totalPay)}</small>
      `;
  }
  const message = ui.entryError || validation.errors[0] || validation.warnings[0] || "";
  if (errorBox) {
    errorBox.hidden = !message;
    errorBox.textContent = message;
    errorBox.classList.toggle("is-warning", validation.valid && Boolean(validation.warnings[0]) && !ui.entryError);
  }
}

function monthlyPreviewAfterEntry(entry, normalized) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date || ""))) return "";
  const simulatedEntry = {
    ...entry,
    regularHours: normalized.regularHours,
    overtimeHours: normalized.overtimeHours,
    totalHours: normalized.totalHours
  };
  let entries = state.entries.filter((item) => item.id !== simulatedEntry.id);
  const sameDateMain = entries.filter((item) => item.date === simulatedEntry.date && !isQuickOvertimeEntry(item));
  if (!simulatedEntry.id && sameDateMain.length === 1) {
    const replacedId = sameDateMain[0].id;
    entries = entries.filter((item) => item.id !== replacedId);
  }
  entries = entries.concat(simulatedEntry);
  const month = summarizeYear(entries, state.adjustments, state.settings, yearFromDate(simulatedEntry.date))[monthIndexFromDate(simulatedEntry.date)];
  if (!month) return "";
  const goal = Number(state.settings.goals.monthlyIncome || 0);
  const gapText = goal > 0
    ? (month.netIncome >= goal ? `，超目标 ${money(month.netIncome - goal)}` : `，距目标 ${money(goal - month.netIncome)}`)
    : "";
  return `本月税后约 ${money(month.netIncome)}${gapText}`;
}

function leavePayModeLabel(mode) {
  return ({
    paid: "带薪",
    unpaid: "不计薪",
    deduct: "扣工资",
    custom: "按倍数计薪"
  })[mode] || "带薪";
}

function applyPresetToForm(presetId) {
  const form = document.querySelector("#entry-form");
  if (!form) return;
  const preset = getShiftPreset(state.settings, presetId);
  if (!preset) return;
  const date = form.elements.date.value || ui.selectedDate;
  const entry = buildEntryFromShiftPreset(form.elements.date.value || ui.selectedDate, preset, {
    settings: state.settings,
    dayType: preset.dayType && preset.dayType !== "workday" ? preset.dayType : inferDayType(date, state.settings)
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

function applyEntryIntent(intent) {
  const form = document.querySelector("#entry-form");
  if (!form) return;
  if (intent === "normal") {
    ui.entryIntent = "";
    if (!form.elements.startTime) {
      ui.entryAdvanced = false;
      render();
      return;
    }
    form.elements.sourceHint.value = "";
    applyPresetToForm(getWorkDefaultPreset(state.settings)?.id || state.settings.defaultPresetId);
    setEntryChoiceActive("normal");
    return;
  }
  if (intent === "overtime") {
    ui.entryIntent = "";
    if (!form.elements.startTime) {
      ui.entryAdvanced = false;
      render();
      window.setTimeout(() => applyEntryIntent("overtime"), 0);
      return;
    }
    form.elements.sourceHint.value = "";
    applyPresetToForm(findPresetByIntent("overtime")?.id || state.settings.defaultPresetId);
    setEntryChoiceActive("overtime");
    return;
  }
  if (intent === "note") {
    ui.entryIntent = "leave-note";
    ui.entryAdvanced = true;
    render();
    document.querySelector("#entry-form select[name='leaveType']")?.focus();
  }
}

function applyTimeShortcut(shortcut) {
  const form = document.querySelector("#entry-form");
  if (!form?.elements.startTime || !form?.elements.endTime) return;
  const extraHours = {
    standard: 0,
    "plus-1": 1,
    "plus-2": 2,
    "plus-3": 3
  }[shortcut];
  if (extraHours === undefined) return;
  const defaultPreset = getWorkDefaultPreset(state.settings);
  const startMinutes = parseTimeToMinutes(form.elements.startTime.value)
    ?? parseTimeToMinutes(defaultPreset?.startTime || "09:00");
  const breakMinutes = Number(form.elements.breakMinutes?.value || defaultPreset?.breakMinutes || 0);
  const matchingPreset = (state.settings.shiftPresets || []).find((preset) => {
    return preset.recordMode === RECORD_MODES.TIME
      && preset.dayType !== "restday"
      && preset.dayType !== "holiday"
      && preset.startTime === form.elements.startTime.value
      && Number(preset.breakMinutes || 0) === breakMinutes;
  });
  const presetEnd = parseTimeToMinutes(matchingPreset?.endTime || "");
  const baseEnd = presetEnd === null
    ? startMinutes + Number(state.settings.normalHoursPerDay || 0) * 60 + breakMinutes
    : presetEnd + (presetEnd <= startMinutes ? 24 * 60 : 0);
  form.elements.recordMode.value = RECORD_MODES.TIME;
  form.setAttribute("data-record-mode", RECORD_MODES.TIME);
  form.elements.endTime.value = minutesToClock(baseEnd + extraHours * 60);
  updateEntryPreview();
}

function applyLeaveShortcut(shortcut) {
  const form = document.querySelector("#entry-form");
  if (!form?.elements.leaveHours) return;
  if (shortcut === "custom") {
    form.elements.leaveHours.focus();
    return;
  }
  const normalHours = Number(state.settings.normalHoursPerDay || 8);
  const hours = {
    full: normalHours,
    half: round2(normalHours / 2),
    "two-hours": 2
  }[shortcut];
  if (hours === undefined) return;
  form.elements.leaveHours.value = hours;
  for (const button of form.querySelectorAll("[data-leave-shortcut]")) {
    button.classList.toggle("is-active", button.dataset.leaveShortcut === shortcut);
  }
  updateEntryPreview();
}

function setEntryChoiceActive(intent) {
  const form = document.querySelector("#entry-form");
  if (!form) return;
  for (const button of form.querySelectorAll("[data-choice-intent]")) {
    button.classList.toggle("is-active", button.dataset.choiceIntent === intent);
  }
}

function minutesToClock(totalMinutes) {
  const minutesInDay = 24 * 60;
  const normalized = ((Math.round(totalMinutes) % minutesInDay) + minutesInDay) % minutesInDay;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function applyLeaveTypeDefaults(form, leaveType) {
  if (!form?.elements.leavePayMode) return;
  const defaults = leaveDefaultsForType(leaveType);
  form.elements.leavePayMode.value = defaults.leavePayMode;
  form.elements.leavePayMultiplier.value = defaults.leavePayMultiplier;
  form.elements.leaveDeductionAmount.value = 0;
  form.setAttribute("data-leave-pay-mode", defaults.leavePayMode);
}

function applyLeavePayModeDefaults(form, mode) {
  if (!form?.elements.leavePayMultiplier) return;
  if (mode === "unpaid") form.elements.leavePayMultiplier.value = 0;
  if (mode === "paid" && Number(form.elements.leavePayMultiplier.value || 0) === 0) {
    form.elements.leavePayMultiplier.value = 1;
  }
  form.setAttribute("data-leave-pay-mode", mode || "paid");
}

function leaveDefaultsForType(leaveType) {
  if (leaveType === "personal") return { leavePayMode: "unpaid", leavePayMultiplier: 0 };
  if (leaveType === "sick") return { leavePayMode: "custom", leavePayMultiplier: 0.8 };
  return { leavePayMode: "paid", leavePayMultiplier: 1 };
}

function findPresetByIntent(intent) {
  const presets = state.settings.shiftPresets || [];
  if (intent === "overtime") {
    return presets.find((preset) => preset.id === "overtime")
      || presets.find((preset) => /加班/.test(preset.name || "") && preset.dayType !== "restday")
      || presets.find((preset) => preset.recordMode === RECORD_MODES.TIME && calculateTimeHours(preset.startTime, preset.endTime, preset.breakMinutes) > state.settings.normalHoursPerDay);
  }
  if (intent === "rest") {
    return presets.find((preset) => preset.id === "rest")
      || presets.find((preset) => preset.dayType === "restday")
      || presets.find((preset) => /休息|周末/.test(preset.name || ""));
  }
  return getShiftPreset(state.settings, state.settings.defaultPresetId);
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

function bulkAdd(form) {
  const config = bulkConfigFromForm(form);
  if (config.addKind === "overtime" && (!Number.isFinite(config.overtimeHours) || config.overtimeHours <= 0)) {
    persist("请先填写每天加班小时");
    render();
    return;
  }
  const preview = previewBulkAdd(config);
  if (!preview.dates.length) {
    persist("没有可添加的日期");
    render();
    return;
  }
  const preset = getShiftPreset(state.settings, config.presetId);
  const targetDates = new Set(preview.dates);
  let removed = [];
  if (config.overwrite) {
    removed = state.entries.filter((entry) => shouldRemoveForBulkOverwrite(entry, config, targetDates));
    if (removed.length) {
      const removedIds = new Set(removed.map((entry) => entry.id));
      state.entries = state.entries.filter((entry) => !removedIds.has(entry.id));
    }
  }

  let count = 0;
  let failed = 0;
  const addedIds = [];
  for (const date of preview.dates) {
    const entry = buildBulkEntry(date, config, preset);
    const entryToSave = {
      ...entry,
      id: createId("entry"),
      note: entry.note || "批量生成",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const validation = validateEntry(entryToSave, state.settings, state.entries);
    if (!validation.valid) {
      failed += 1;
      continue;
    }
    const savedEntry = {
      ...entryToSave,
      regularHours: validation.normalized.regularHours,
      overtimeHours: validation.normalized.overtimeHours,
      totalHours: validation.normalized.totalHours
    };
    state.entries.push(savedEntry);
    addedIds.push(savedEntry.id);
    addAutoAdjustment(date);
    count += 1;
  }

  state.entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (removed.length || (config.overwrite && addedIds.length)) {
    ui.lastDeleted = { type: "batch-replace", payload: { entries: removed, adjustments: [], addedIds } };
  }
  let message = count ? `已批量添加 ${count} 条记录` : "没有可添加的日期";
  if (failed > 0) message += `，${failed} 条因数据校验跳过`;
  if (removed.length) message += "，可撤销覆盖";
  persist(message);
  render();
}

function bulkDelete(form) {
  const config = bulkConfigFromForm(form);
  if (!config.confirmDelete) {
    persist("请先勾选确认批量删除");
    render();
    return;
  }
  const preview = previewBulkDelete(config);
  if (!preview.entries.length && !preview.adjustments.length) {
    persist("当前条件下没有可删除记录");
    render();
    return;
  }
  const entryIds = new Set(preview.entries.map((entry) => entry.id));
  const adjustmentIds = new Set(preview.adjustments.map((item) => item.id));
  state.entries = state.entries.filter((entry) => !entryIds.has(entry.id));
  state.adjustments = state.adjustments.filter((item) => !adjustmentIds.has(item.id));
  ui.lastDeleted = {
    type: "batch",
    payload: { entries: preview.entries, adjustments: preview.adjustments }
  };
  persist(`已删除 ${preview.count} 条记录，可撤销`);
  render();
}

function updateBulkPreview() {
  const form = document.querySelector("#bulk-form");
  const preview = document.querySelector("#bulk-preview");
  if (!form || !preview) return;
  const config = bulkConfigFromForm(form);
  const addPreview = previewBulkAdd(config);
  const deletePreview = previewBulkDelete(config);
  const mode = form.dataset.bulkMode || ui.bulkMode || "add";
  preview.querySelector("strong").textContent = mode === "delete" ? deletePreview.summary : addPreview.summary;
  preview.querySelector("span").textContent = mode === "delete"
    ? "删除前会先计算影响，且可撤销。"
    : bulkAddKindHelp(config.addKind);
  preview.querySelector("small").textContent = mode === "delete"
    ? (config.confirmDelete ? "已确认删除，提交后仍可撤销。" : "为了防误删，需要勾选确认批量删除。")
    : (config.overwrite ? "已打开覆盖，只会按当前添加方式替换同类记录。" : bulkAddKindDetail(config.addKind));
}

function bulkConfigFromForm(form, options = {}) {
  const data = Object.fromEntries(new FormData(form));
  const defaults = bulkDefaultConfig();
  const availableKinds = bulkAddKindOptions().map((item) => item.value);
  const addKind = availableKinds.includes(data.addKind) ? data.addKind : defaults.addKind;
  const config = {
    start: data.start || defaults.start,
    end: data.end || defaults.end,
    addKind,
    rule: data.rule || defaults.rule,
    presetId: data.presetId || defaults.presetId,
    overtimeHours: Number(data.overtimeHours || 0),
    overwrite: data.overwrite === "true",
    deleteKind: data.deleteKind || "bulk",
    confirmDelete: data.confirmDelete === "true"
  };
  if (options.saveDraft !== false) ui.bulkDraft = config;
  return config;
}

function previewBulkAdd(config) {
  const preset = getShiftPreset(state.settings, config.presetId);
  const rule = config.addKind === "monthlyBase" ? "workdays" : config.rule;
  const candidates = datesForBulkRule(config.start, config.end, rule);
  const dates = config.overwrite
    ? candidates
    : candidates.filter((date) => !shouldSkipBulkAddDate(date, config));
  const skipped = candidates.length - dates.length;
  const samplePay = dates.reduce((sum, date) => {
    const entry = buildBulkEntry(date, config, preset);
    return sum + calculateEntryPay(entry, state.settings).totalPay;
  }, 0);
  const actionText = config.addKind === "monthlyBase"
    ? "补齐基础工时"
    : (config.addKind === "overtime" ? "添加加班" : "添加班次");
  return {
    dates,
    skipped,
    summary: dates.length
      ? `将${actionText} ${dates.length} 天，跳过 ${skipped} 天，预计 ${money(samplePay)}`
      : "没有可添加的日期。已记录、已存在同类记录或节假日已被自动跳过。"
  };
}

function shouldSkipBulkAddDate(date, config) {
  if (config.addKind === "monthlyBase") {
    return hasBaseWorkEntryForDate(state.entries, date, state.settings);
  }
  if (config.addKind === "overtime") {
    return state.entries.some((entry) => entry.date === date && entry.source === "bulk-overtime");
  }
  return state.entries.some((entry) => entry.date === date);
}

function shouldRemoveForBulkOverwrite(entry, config, targetDates) {
  if (!targetDates.has(entry.date)) return false;
  if (config.addKind === "monthlyBase") {
    return hasBaseWorkEntryForDate([entry], entry.date, state.settings);
  }
  if (config.addKind === "overtime") {
    return entry.source === "bulk-overtime";
  }
  return true;
}

function buildBulkEntry(date, config, preset) {
  if (config.addKind === "monthlyBase") {
    return buildBaseWorkEntry(date, state.settings, { source: "bulk-base", note: "基础工时" });
  }
  if (config.addKind === "overtime") {
    return buildOvertimeEntry(date, config.overtimeHours || 0, state.settings, { source: "bulk-overtime", note: "批量加班" });
  }
  return buildEntryFromShiftPreset(date, preset, {
    settings: state.settings,
    dayType: preset?.dayType && preset.dayType !== "workday" ? preset.dayType : inferDayType(date, state.settings),
    source: "bulk"
  });
}

function previewBulkDelete(config) {
  const start = normalizeDateInput(config.start);
  const end = normalizeDateInput(config.end);
  const inRange = (item) => item.date >= start && item.date <= end;
  const entries = state.entries.filter((entry) => {
    if (!inRange(entry)) return false;
    if (config.deleteKind === "all" || config.deleteKind === "entries") return true;
    if (config.deleteKind === "bulk") return isBulkGeneratedEntry(entry);
    if (config.deleteKind === "overtime") return entry.source === "bulk-overtime";
    return false;
  });
  const adjustments = state.adjustments.filter((item) => {
    if (!inRange(item)) return false;
    return config.deleteKind === "all" || config.deleteKind === "adjustments";
  });
  const hours = round2(entries.reduce((sum, entry) => sum + normalizeEntry(entry, state.settings).totalHours, 0));
  const pay = round2(entries.reduce((sum, entry) => sum + calculateEntryPay(entry, state.settings).totalPay, 0));
  const count = entries.length + adjustments.length;
  return {
    entries,
    adjustments,
    count,
    summary: count
      ? `将删除 ${count} 条，影响 ${hours}h，预计 ${money(pay)}`
      : "当前条件下没有可删除记录。换个范围或类型试试。"
  };
}

function isBulkGeneratedEntry(entry = {}) {
  return ["bulk", "bulk-base", "bulk-overtime"].includes(entry.source)
    || entry.note === "批量生成"
    || entry.note === "基础工时"
    || entry.note === "批量加班";
}

function datesForBulkRule(start, end, rule) {
  const startDate = new Date(`${normalizeDateInput(start)}T00:00:00`);
  const endDate = new Date(`${normalizeDateInput(end)}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [];
  const dates = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const date = formatDate(cursor);
    const dayType = inferDayType(date, state.settings);
    const include = rule === "all"
      || (rule === "rest" && dayType !== "workday")
      || (rule === "workdays" && dayType === "workday");
    if (include) dates.push(date);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function normalizeDateInput(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : today;
}

function undoDelete() {
  if (!ui.lastDeleted) return;
  if (ui.lastDeleted.type === "entry") state.entries.push(ui.lastDeleted.payload);
  if (ui.lastDeleted.type === "adjustment") state.adjustments.push(ui.lastDeleted.payload);
  if (ui.lastDeleted.type === "batch") {
    state.entries.push(...(ui.lastDeleted.payload.entries || []));
    state.adjustments.push(...(ui.lastDeleted.payload.adjustments || []));
  }
  if (ui.lastDeleted.type === "batch-replace") {
    const addedIds = new Set(ui.lastDeleted.payload.addedIds || []);
    state.entries = state.entries.filter((entry) => !addedIds.has(entry.id));
    state.entries.push(...(ui.lastDeleted.payload.entries || []));
    state.adjustments.push(...(ui.lastDeleted.payload.adjustments || []));
  }
  state.entries.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  state.adjustments.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  ui.lastDeleted = null;
  persist("已撤销删除");
  render();
}

function persist(notice = "") {
  ui.notice = notice;
  saveState(state);
  const duration = /删除|覆盖|导入/.test(notice) ? 9000 : 2800;
  if (notice) window.setTimeout(() => {
    if (ui.notice === notice) {
      ui.notice = "";
      render();
    }
  }, duration);
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
  if (entry.note === "基础工时") return { ...entry, source: "bulk-base" };
  if (entry.note === "批量加班") return { ...entry, source: "bulk-overtime" };
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
  if (mode === SALARY_MODES.HOURLY) return ["baseSalary", "standardMonthlyHours", "hourlyRate"];
  if (mode === SALARY_MODES.COMPREHENSIVE) return ["baseSalary", "standardMonthlyHours", "comprehensiveHourlyRate", "comprehensiveTargetHours"];
  if (mode === SALARY_MODES.BASE_OVERTIME) return ["baseSalary", "standardMonthlyHours", "baseOvertimeRate"];
  return ["normalHoursPerDay", "baseSalary", "standardMonthlyHours", "regularHourlyRate"];
}

function workShiftPresets(settings = state.settings) {
  return (settings.shiftPresets || []).filter((preset) => {
    return preset.recordMode === RECORD_MODES.TIME && preset.dayType !== "restday" && preset.dayType !== "holiday";
  });
}

function getWorkDefaultPreset(settings = state.settings) {
  const configured = getShiftPreset(settings, settings.defaultPresetId);
  if (configured && configured.dayType !== "restday" && configured.dayType !== "holiday") return configured;
  return workShiftPresets(settings)[0] || getShiftPreset(settings, settings.defaultPresetId);
}

function presetsHaveSameTime(presets = []) {
  if (presets.length < 2) return true;
  const [first] = presets;
  return presets.every((preset) => {
    return preset.startTime === first.startTime
      && preset.endTime === first.endTime
      && Number(preset.breakMinutes || 0) === Number(first.breakMinutes || 0);
  });
}

function defaultPresetsForWorkType(workType) {
  const rest = { id: "rest", name: "休息日加班", recordMode: RECORD_MODES.HOURS, dayType: "restday", regularHours: 0, overtimeHours: 8, totalHours: 8 };
  if (workType === "night") {
    return [
      { id: "night", name: "夜班", recordMode: RECORD_MODES.TIME, dayType: "workday", startTime: "22:00", endTime: "06:00", breakMinutes: 30 },
      { id: "night-ot", name: "夜班加班", recordMode: RECORD_MODES.TIME, dayType: "workday", startTime: "22:00", endTime: "10:00", breakMinutes: 30 },
      rest
    ];
  }
  if (workType === "rotating") {
    return [
      { id: "day", name: "白班", recordMode: RECORD_MODES.TIME, dayType: "workday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
      { id: "overtime", name: "白班加班", recordMode: RECORD_MODES.TIME, dayType: "workday", startTime: "09:00", endTime: "20:00", breakMinutes: 60 },
      { id: "night", name: "夜班", recordMode: RECORD_MODES.TIME, dayType: "workday", startTime: "22:00", endTime: "06:00", breakMinutes: 30 },
      rest
    ];
  }
  return [
    { id: "day", name: "白班", recordMode: RECORD_MODES.TIME, dayType: "workday", startTime: "09:00", endTime: "18:00", breakMinutes: 60 },
    { id: "overtime", name: "白班加班", recordMode: RECORD_MODES.TIME, dayType: "workday", startTime: "09:00", endTime: "20:00", breakMinutes: 60 },
    rest
  ];
}

function detectWorkType(presets) {
  const ids = presets.map((p) => p.id);
  const has = (id) => ids.includes(id);
  if (has("day") && has("night") && has("overtime")) return "rotating";
  if (has("day") && has("overtime") && !has("night")) return "day";
  if (has("night") && has("night-ot") && !has("day")) return "night";
  if (has("night") && !has("day")) return "night";
  return "custom";
}

function updatePresetEditor(form) {
  const editor = form.querySelector(".preset-editor");
  if (!editor) return;
  const settings = state.settings;
  editor.innerHTML = settings.shiftPresets.map((preset, index) =>
    `<div class="${preset.id === "rest" ? "preset-hidden" : ""}">${renderPresetEditor(preset, index)}</div>`
  ).join("");
  const defaultSelect = form.querySelector('[name="defaultPresetId"]');
  if (defaultSelect) {
    defaultSelect.innerHTML = settings.shiftPresets
      .filter((p) => p.dayType !== "restday")
      .map((p) => `<option value="${escapeAttr(p.id)}" ${p.id === settings.defaultPresetId ? "selected" : ""}>${escapeHtml(p.name)}</option>`)
      .join("");
  }
}

function limitSettings(settings) {
  const next = mergeSettings(settings);
  next.themeMode = ["system", "light", "dark"].includes(next.themeMode) ? next.themeMode : "system";
  next.weekStart = boundedNumber(next.weekStart, 0, 6);
  next.weekStart = Math.round(next.weekStart);
  next.workweek = [...new Set((next.workweek || []).map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
  if (!next.workweek.length) next.workweek = DEFAULT_SETTINGS.workweek;
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
  next.tax.otherDeductionMode = ["fixed", "percent"].includes(next.tax.otherDeductionMode) ? next.tax.otherDeductionMode : "fixed";
  next.tax.socialSecurityMode = ["fixed", "percent"].includes(next.tax.socialSecurityMode) ? next.tax.socialSecurityMode : "fixed";
  next.restCycle.mode = Object.values(REST_CYCLE_MODES).includes(next.restCycle.mode) ? next.restCycle.mode : REST_CYCLE_MODES.WORKWEEK;
  next.restCycle.workDays = boundedNumber(next.restCycle.workDays, 1, 31);
  next.restCycle.restDays = boundedNumber(next.restCycle.restDays, 1, 14);
  next.autoFillWorkday = Boolean(next.autoFillWorkday);
  return next;
}

function boundedNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function blurActiveTimeEditor() {
  const active = document.activeElement;
  if (!active?.matches?.("#entry-form input[type='number'], #entry-form input[type='time']")) return;
  active.blur();
}

function renderPresetEditor(preset, index) {
  return `
    <div class="preset-row">
      ${field("名称", `<input name="shiftPresets.${index}.name" type="text" value="${escapeAttr(preset.name)}" maxlength="18">`)}
      <input type="hidden" name="shiftPresets.${index}.id" value="${escapeAttr(preset.id)}">
      ${field("方式", `<select name="shiftPresets.${index}.recordMode">${option(RECORD_MODES.TIME, "时间", preset.recordMode)}${option(RECORD_MODES.HOURS, "工时", preset.recordMode)}</select>`)}
      ${field("日期类型", `<select name="shiftPresets.${index}.dayType">${option("workday", "自动/工作日", preset.dayType)}${option("restday", "休息日", preset.dayType)}${option("holiday", "法定假日", preset.dayType)}</select>`)}
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

function fieldWithClass(label, control, className) {
  return `<label class="field ${escapeAttr(className)}"><span>${label}</span>${control}</label>`;
}

function numberField(label, name, value, step, options = {}) {
  const min = options.min ?? 0;
  const max = options.max === undefined ? "" : ` max="${escapeAttr(options.max)}"`;
  return field(label, `<input name="${escapeAttr(name)}" type="number" min="${escapeAttr(min)}"${max} step="${step}" value="${escapeAttr(value)}">`);
}

function moneyField(label, name, value, options = {}) {
  const required = options.required ? " required" : "";
  return field(label, `<input name="${escapeAttr(name)}" type="number" step="any" value="${escapeAttr(value)}" inputmode="decimal" enterkeyhint="done"${required}>`);
}

function numberFieldWithClass(label, name, value, step, options = {}, className = "") {
  const min = options.min ?? 0;
  const max = options.max === undefined ? "" : ` max="${escapeAttr(options.max)}"`;
  return fieldWithClass(label, `<input name="${escapeAttr(name)}" type="number" min="${escapeAttr(min)}"${max} step="${step}" value="${escapeAttr(value)}">`, className);
}

function moneyFieldWithClass(label, name, value, className = "", options = {}) {
  const required = options.required ? " required" : "";
  return fieldWithClass(label, `<input name="${escapeAttr(name)}" type="number" step="any" value="${escapeAttr(value)}" inputmode="decimal" enterkeyhint="done"${required}>`, className);
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
  const holiday = getHolidayInfo(date);
  return `${date} 周${weekLabelByIndex(parsed.getDay())}${holiday ? ` · ${holiday.name}` : ""}`;
}

function dayDecisionText(date, dayType, holiday) {
  const parsed = new Date(`${date}T00:00:00`);
  const prefix = date === today ? "今天" : `周${weekLabelByIndex(parsed.getDay())}`;
  if (dayType === "holiday") return `${prefix} · 节假日 · 按当前倍率`;
  if (dayType === "restday") return `${prefix} · ${holiday?.name || "休息日"} · 按休息日倍率`;
  return `${prefix} · 工作日 · 自动拆正班和加班`;
}

function weekLabelByIndex(index) {
  return WEEKDAY_NAMES[Number(index)] || "";
}

function weekdayOrder(start = 1) {
  const first = Number.isInteger(Number(start)) ? Number(start) : 1;
  return Array.from({ length: 7 }, (_, index) => (first + index) % 7);
}

function weekStartDate(date, weekStart = 1) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "";
  const offset = ((parsed.getDay() - Number(weekStart || 1)) % 7 + 7) % 7;
  parsed.setDate(parsed.getDate() - offset);
  return formatDate(parsed);
}

function restCycleLabel(mode) {
  return ({
    [REST_CYCLE_MODES.DOUBLE_WEEKEND]: "每周双休",
    [REST_CYCLE_MODES.SINGLE_SUNDAY]: "每周单休",
    [REST_CYCLE_MODES.WORKWEEK]: "自定义周休",
    [REST_CYCLE_MODES.WORK_6_REST_1]: "上六休一",
    [REST_CYCLE_MODES.WORK_14_REST_1]: "上十四休一",
    [REST_CYCLE_MODES.CUSTOM]: "自定义周期"
  })[mode] || "自定义周休";
}

function applyTheme() {
  const mode = ["system", "light", "dark"].includes(state.settings?.themeMode)
    ? state.settings.themeMode
    : "system";
  if (mode === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = mode;
  }
  const prefersDark = globalThis.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const effective = mode === "system" ? (prefersDark ? "dark" : "light") : mode;
  document.documentElement.style.colorScheme = effective;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", effective === "dark" ? "#171b20" : "#176b5b");
}

function themeModeLabel(mode) {
  return ({
    system: "跟随系统",
    light: "浅色",
    dark: "深色"
  })[mode] || "跟随系统";
}

function themeIcon(mode) {
  if (mode === "dark") return `<svg class="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  if (mode === "light") return `<svg class="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  return `<svg class="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`;
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

function base64UrlBytes(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
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

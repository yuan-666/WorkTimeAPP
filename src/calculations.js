export const SALARY_MODES = {
  REGULAR_OVERTIME: "regularOvertime",
  BASE_OVERTIME: "baseOvertime",
  COMPREHENSIVE: "comprehensive",
  HOURLY: "hourly"
};

export const RECORD_MODES = {
  TIME: "time",
  HOURS: "hours"
};

export const REST_CYCLE_MODES = {
  WORKWEEK: "workweek",
  DOUBLE_WEEKEND: "doubleWeekend",
  SINGLE_SUNDAY: "singleSunday",
  WORK_6_REST_1: "work6rest1",
  WORK_14_REST_1: "work14rest1",
  CUSTOM: "custom"
};

export const SHIFT_CALENDAR_KINDS = {
  DAY: "day",
  NIGHT: "night",
  REST: "rest",
  OFF_NIGHT: "offNight",
  CUSTOM: "custom"
};

const DEFAULT_SHIFT_CALENDAR_ITEMS = [
  {
    id: "cycle-day",
    name: "白班",
    startTime: "09:00",
    endTime: "18:00",
    kind: SHIFT_CALENDAR_KINDS.DAY
  },
  {
    id: "cycle-night",
    name: "上夜班",
    startTime: "22:00",
    endTime: "06:00",
    kind: SHIFT_CALENDAR_KINDS.NIGHT
  },
  {
    id: "cycle-off-night",
    name: "下夜班",
    startTime: "",
    endTime: "",
    kind: SHIFT_CALENDAR_KINDS.OFF_NIGHT
  },
  {
    id: "cycle-rest",
    name: "休班",
    startTime: "",
    endTime: "",
    kind: SHIFT_CALENDAR_KINDS.REST
  }
];

export const LEGAL_RULES = {
  dailyStandardHours: 8,
  weeklyStandardHours: 44,
  dailyOvertimeSoftLimit: 1,
  dailyOvertimeHardLimit: 3,
  monthlyOvertimeLimit: 36,
  paidDaysPerMonth: 21.75,
  wageHourlyDivisor: 174,
  averageWorkDaysPerMonth: 20.67,
  standardMonthlyWorkHours: 165.36,
  workdayOvertimeMultiplier: 1.5,
  restDayOvertimeMultiplier: 2,
  holidayOvertimeMultiplier: 3
};

export const WORK_LIMITS = {
  maxEntryHours: 16,
  maxDayHours: 20,
  maxRegularHours: LEGAL_RULES.dailyStandardHours,
  maxOvertimeHours: 12,
  maxBreakMinutes: 720,
  maxMonthlyHours: 360
};

export const DEFAULT_SETTINGS = {
  currency: "CNY",
  salaryMode: SALARY_MODES.REGULAR_OVERTIME,
  normalHoursPerDay: LEGAL_RULES.dailyStandardHours,
  regularHourlyRate: 0,
  overtimeMultiplier: LEGAL_RULES.workdayOvertimeMultiplier,
  restDayMultiplier: LEGAL_RULES.restDayOvertimeMultiplier,
  holidayMultiplier: LEGAL_RULES.holidayOvertimeMultiplier,
  baseSalary: 6000,
  standardMonthlyHours: LEGAL_RULES.wageHourlyDivisor,
  baseHourlyRate: 0,
  baseOvertimeRate: 0,
  comprehensiveHourlyRate: 0,
  comprehensiveTargetHours: LEGAL_RULES.standardMonthlyWorkHours,
  comprehensiveOvertimeMultiplier: LEGAL_RULES.workdayOvertimeMultiplier,
  hourlyRate: 30,
  defaultPresetId: "day",
  workweek: [1, 2, 3, 4, 5],
  weekStart: 1,
  themeMode: "system",
  autoDayType: true,
  autoFillWorkday: true,
  shiftPresets: [
    {
      id: "day",
      name: "白班",
      recordMode: RECORD_MODES.TIME,
      dayType: "workday",
      startTime: "09:00",
      endTime: "18:00",
      breakMinutes: 60
    },
    {
      id: "overtime",
      name: "白班加班",
      recordMode: RECORD_MODES.TIME,
      dayType: "workday",
      startTime: "09:00",
      endTime: "20:00",
      breakMinutes: 60
    },
    {
      id: "night",
      name: "夜班",
      recordMode: RECORD_MODES.TIME,
      dayType: "workday",
      startTime: "22:00",
      endTime: "06:00",
      breakMinutes: 30
    },
    {
      id: "rest",
      name: "休息日加班",
      recordMode: RECORD_MODES.HOURS,
      dayType: "restday",
      regularHours: 0,
      overtimeHours: 8,
      totalHours: 8
    }
  ],
  autoAdjustment: {
    enabled: false,
    type: "allowance",
    amount: 0,
    category: "日补贴",
    note: "自动记录"
  },
  goals: {
    monthlyIncome: 10000,
    monthlyHours: 220
  },
  tax: {
    calculationMethod: "cumulative",
    standardDeductionMonthly: 5000,
    otherDeductionMode: "fixed",
    fixedDeductionMonthly: 0,
    specialAdditionalDeductionMonthly: 0,
    deductionPercent: 0,
    socialSecurityMode: "fixed",
    socialSecurityFixedMonthly: 0,
    socialSecurityPercent: 0
  },
  restCycle: {
    mode: REST_CYCLE_MODES.DOUBLE_WEEKEND,
    workDays: 5,
    restDays: 2,
    lastRestDate: ""
  },
  shiftCalendar: {
    enabled: false,
    name: "我的倒班",
    teamName: "1 班",
    anchorDate: "2026-05-15",
    anchorTime: "00:00",
    items: DEFAULT_SHIFT_CALENDAR_ITEMS
  }
};

export const HOLIDAY_SCHEDULES = {
  2026: {
    source: "国务院办公厅关于2026年部分节假日安排的通知",
    sourceUrl: "https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm",
    days: {
      "2026-01-01": { dayType: "holiday", name: "元旦", marker: "法定" },
      "2026-01-02": { dayType: "restday", name: "元旦假期", marker: "休" },
      "2026-01-03": { dayType: "restday", name: "元旦假期", marker: "休" },
      "2026-01-04": { dayType: "workday", name: "调休上班", marker: "班", adjusted: true },

      "2026-02-14": { dayType: "workday", name: "春节调休上班", marker: "班", adjusted: true },
      "2026-02-15": { dayType: "restday", name: "春节假期", marker: "休" },
      "2026-02-16": { dayType: "holiday", name: "除夕", marker: "法定" },
      "2026-02-17": { dayType: "holiday", name: "春节", marker: "法定" },
      "2026-02-18": { dayType: "holiday", name: "春节", marker: "法定" },
      "2026-02-19": { dayType: "holiday", name: "春节", marker: "法定" },
      "2026-02-20": { dayType: "restday", name: "春节假期", marker: "休" },
      "2026-02-21": { dayType: "restday", name: "春节假期", marker: "休" },
      "2026-02-22": { dayType: "restday", name: "春节假期", marker: "休" },
      "2026-02-23": { dayType: "restday", name: "春节假期", marker: "休" },
      "2026-02-28": { dayType: "workday", name: "春节调休上班", marker: "班", adjusted: true },

      "2026-04-04": { dayType: "restday", name: "清明假期", marker: "休" },
      "2026-04-05": { dayType: "holiday", name: "清明节", marker: "法定" },
      "2026-04-06": { dayType: "restday", name: "清明补休", marker: "休" },

      "2026-05-01": { dayType: "holiday", name: "劳动节", marker: "法定" },
      "2026-05-02": { dayType: "holiday", name: "劳动节", marker: "法定" },
      "2026-05-03": { dayType: "restday", name: "劳动节假期", marker: "休" },
      "2026-05-04": { dayType: "restday", name: "劳动节假期", marker: "休" },
      "2026-05-05": { dayType: "restday", name: "劳动节假期", marker: "休" },
      "2026-05-09": { dayType: "workday", name: "劳动节调休上班", marker: "班", adjusted: true },

      "2026-06-19": { dayType: "holiday", name: "端午节", marker: "法定" },
      "2026-06-20": { dayType: "restday", name: "端午假期", marker: "休" },
      "2026-06-21": { dayType: "restday", name: "端午假期", marker: "休" },

      "2026-09-20": { dayType: "workday", name: "国庆调休上班", marker: "班", adjusted: true },
      "2026-09-25": { dayType: "holiday", name: "中秋节", marker: "法定" },
      "2026-09-26": { dayType: "restday", name: "中秋假期", marker: "休" },
      "2026-09-27": { dayType: "restday", name: "中秋假期", marker: "休" },

      "2026-10-01": { dayType: "holiday", name: "国庆节", marker: "法定" },
      "2026-10-02": { dayType: "holiday", name: "国庆节", marker: "法定" },
      "2026-10-03": { dayType: "holiday", name: "国庆节", marker: "法定" },
      "2026-10-04": { dayType: "restday", name: "国庆假期", marker: "休" },
      "2026-10-05": { dayType: "restday", name: "国庆假期", marker: "休" },
      "2026-10-06": { dayType: "restday", name: "国庆假期", marker: "休" },
      "2026-10-07": { dayType: "restday", name: "国庆假期", marker: "休" },
      "2026-10-10": { dayType: "workday", name: "国庆调休上班", marker: "班", adjusted: true }
    }
  },
  2027: {
    source: "2027年节假日安排（预估，以国务院正式通知为准）",
    sourceUrl: "",
    days: {
      "2027-01-01": { dayType: "holiday", name: "元旦", marker: "法定" },
      "2027-01-02": { dayType: "restday", name: "元旦假期", marker: "休" },
      "2027-01-03": { dayType: "restday", name: "元旦假期", marker: "休" },

      "2027-02-04": { dayType: "workday", name: "春节调休上班", marker: "班", adjusted: true },
      "2027-02-05": { dayType: "holiday", name: "除夕", marker: "法定" },
      "2027-02-06": { dayType: "holiday", name: "春节", marker: "法定" },
      "2027-02-07": { dayType: "holiday", name: "春节", marker: "法定" },
      "2027-02-08": { dayType: "restday", name: "春节假期", marker: "休" },
      "2027-02-09": { dayType: "restday", name: "春节假期", marker: "休" },
      "2027-02-10": { dayType: "restday", name: "春节假期", marker: "休" },
      "2027-02-11": { dayType: "restday", name: "春节假期", marker: "休" },
      "2027-02-20": { dayType: "workday", name: "春节调休上班", marker: "班", adjusted: true },

      "2027-04-03": { dayType: "restday", name: "清明假期", marker: "休" },
      "2027-04-04": { dayType: "holiday", name: "清明节", marker: "法定" },
      "2027-04-05": { dayType: "restday", name: "清明补休", marker: "休" },

      "2027-04-25": { dayType: "workday", name: "劳动节调休上班", marker: "班", adjusted: true },
      "2027-05-01": { dayType: "holiday", name: "劳动节", marker: "法定" },
      "2027-05-02": { dayType: "holiday", name: "劳动节", marker: "法定" },
      "2027-05-03": { dayType: "restday", name: "劳动节假期", marker: "休" },
      "2027-05-04": { dayType: "restday", name: "劳动节假期", marker: "休" },
      "2027-05-05": { dayType: "restday", name: "劳动节假期", marker: "休" },

      "2027-06-06": { dayType: "workday", name: "端午调休上班", marker: "班", adjusted: true },
      "2027-06-18": { dayType: "holiday", name: "端午节", marker: "法定" },
      "2027-06-19": { dayType: "restday", name: "端午假期", marker: "休" },
      "2027-06-20": { dayType: "restday", name: "端午假期", marker: "休" },

      "2027-09-26": { dayType: "workday", name: "中秋国庆调休上班", marker: "班", adjusted: true },
      "2027-10-01": { dayType: "holiday", name: "国庆节", marker: "法定" },
      "2027-10-02": { dayType: "holiday", name: "国庆节", marker: "法定" },
      "2027-10-03": { dayType: "holiday", name: "国庆节", marker: "法定" },
      "2027-10-04": { dayType: "holiday", name: "中秋节", marker: "法定" },
      "2027-10-05": { dayType: "restday", name: "中秋国庆假期", marker: "休" },
      "2027-10-06": { dayType: "restday", name: "中秋国庆假期", marker: "休" },
      "2027-10-07": { dayType: "restday", name: "中秋国庆假期", marker: "休" },
      "2027-10-08": { dayType: "restday", name: "中秋国庆假期", marker: "休" }
    }
  }
};

export function getHolidayInfo(date) {
  const dateText = String(date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  const year = yearFromDate(dateText);
  const schedule = HOLIDAY_SCHEDULES[year];
  const info = schedule?.days?.[dateText];
  if (!info) return null;
  return {
    ...info,
    date: dateText,
    source: schedule.source,
    sourceUrl: schedule.sourceUrl
  };
}

export const ANNUAL_TAX_BRACKETS = [
  { limit: 36000, rate: 0.03, quickDeduction: 0 },
  { limit: 144000, rate: 0.1, quickDeduction: 2520 },
  { limit: 300000, rate: 0.2, quickDeduction: 16920 },
  { limit: 420000, rate: 0.25, quickDeduction: 31920 },
  { limit: 660000, rate: 0.3, quickDeduction: 52920 },
  { limit: 960000, rate: 0.35, quickDeduction: 85920 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.45, quickDeduction: 181920 }
];

export function mergeSettings(partial = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...partial,
    shiftPresets: normalizeShiftPresets(partial.shiftPresets || DEFAULT_SETTINGS.shiftPresets),
    workweek: Array.isArray(partial.workweek) ? normalizeWeekdayList(partial.workweek) : DEFAULT_SETTINGS.workweek,
    weekStart: normalizeWeekday(partial.weekStart, DEFAULT_SETTINGS.weekStart),
    autoAdjustment: { ...DEFAULT_SETTINGS.autoAdjustment, ...(partial.autoAdjustment || {}) },
    goals: { ...DEFAULT_SETTINGS.goals, ...(partial.goals || {}) },
    tax: { ...DEFAULT_SETTINGS.tax, ...(partial.tax || {}) },
    restCycle: { ...DEFAULT_SETTINGS.restCycle, ...(partial.restCycle || {}) },
    shiftCalendar: normalizeShiftCalendar(partial.shiftCalendar || DEFAULT_SETTINGS.shiftCalendar)
  };
}

export function normalizeWeekday(value, fallback = 1) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 6) return fallback;
  return number;
}

export function normalizeWeekdayList(values = []) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6))]
    .sort((a, b) => a - b);
}

export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function clampNumber(value, min = 0, fallback = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, number);
}

export function clampNumberMax(value, min = 0, max = Number.POSITIVE_INFINITY, fallback = 0) {
  return Math.min(max, clampNumber(value, min, fallback));
}

export function normalizeShiftPresets(presets = DEFAULT_SETTINGS.shiftPresets) {
  const normalized = Array.isArray(presets) ? presets : DEFAULT_SETTINGS.shiftPresets;
  return normalized.map((preset, index) => ({
    id: preset.id || `preset-${index + 1}`,
    name: preset.name || `班次${index + 1}`,
    recordMode: preset.recordMode || RECORD_MODES.TIME,
    dayType: normalizePresetDayType(preset),
    startTime: preset.startTime || "09:00",
    endTime: preset.endTime || "18:00",
    breakMinutes: clampNumberMax(preset.breakMinutes, 0, WORK_LIMITS.maxBreakMinutes),
    regularHours: clampNumberMax(preset.regularHours, 0, WORK_LIMITS.maxRegularHours),
    overtimeHours: clampNumberMax(preset.overtimeHours, 0, WORK_LIMITS.maxOvertimeHours),
    totalHours: clampNumberMax(preset.totalHours, 0, WORK_LIMITS.maxEntryHours)
  }));
}

export function normalizeShiftCalendar(config = DEFAULT_SETTINGS.shiftCalendar) {
  const source = config && typeof config === "object" ? config : DEFAULT_SETTINGS.shiftCalendar;
  const rawItems = Array.isArray(source.items) && source.items.length
    ? source.items
    : DEFAULT_SHIFT_CALENDAR_ITEMS;
  const items = rawItems.slice(0, 31).map((item, index) => normalizeShiftCalendarItem(item, index));
  if (
    items.length === 3
    && !items.some((item) => item.kind === SHIFT_CALENDAR_KINDS.OFF_NIGHT)
    && items.some((item) => item.kind === SHIFT_CALENDAR_KINDS.NIGHT)
    && items.some((item) => item.kind === SHIFT_CALENDAR_KINDS.REST)
  ) {
    const restIndex = items.findIndex((item) => item.kind === SHIFT_CALENDAR_KINDS.REST);
    items.splice(restIndex >= 0 ? restIndex : items.length, 0, {
      id: "cycle-off-night",
      name: "下夜班",
      startTime: "",
      endTime: "",
      kind: SHIFT_CALENDAR_KINDS.OFF_NIGHT
    });
  }
  return {
    enabled: Boolean(source.enabled),
    name: String(source.name || DEFAULT_SETTINGS.shiftCalendar.name).trim().slice(0, 24) || DEFAULT_SETTINGS.shiftCalendar.name,
    teamName: String(source.teamName || DEFAULT_SETTINGS.shiftCalendar.teamName).trim().slice(0, 18) || DEFAULT_SETTINGS.shiftCalendar.teamName,
    anchorDate: isValidDateString(String(source.anchorDate || ""))
      ? String(source.anchorDate)
      : DEFAULT_SETTINGS.shiftCalendar.anchorDate,
    anchorTime: normalizeTimeText(source.anchorTime) || DEFAULT_SETTINGS.shiftCalendar.anchorTime,
    items: items.length ? items : DEFAULT_SHIFT_CALENDAR_ITEMS.map((item, index) => normalizeShiftCalendarItem(item, index))
  };
}

function normalizeShiftCalendarItem(item = {}, index = 0) {
  const fallback = DEFAULT_SHIFT_CALENDAR_ITEMS[index % DEFAULT_SHIFT_CALENDAR_ITEMS.length];
  const kind = Object.values(SHIFT_CALENDAR_KINDS).includes(item.kind) ? item.kind : fallback.kind;
  const isRestLike = kind === SHIFT_CALENDAR_KINDS.REST || kind === SHIFT_CALENDAR_KINDS.OFF_NIGHT;
  return {
    id: item.id || `cycle-${index + 1}`,
    name: String(item.name || fallback.name || `第${index + 1}天`).trim().slice(0, 18) || `第${index + 1}天`,
    startTime: isRestLike ? "" : (normalizeTimeText(item.startTime) || fallback.startTime || "09:00"),
    endTime: isRestLike ? "" : (normalizeTimeText(item.endTime) || fallback.endTime || "18:00"),
    kind
  };
}

function normalizeTimeText(value) {
  const text = String(value || "");
  return /^\d{2}:\d{2}$/.test(text) ? text : "";
}

function inferPresetDayType(preset = {}) {
  if (preset.id === "rest" || /休息|周末/.test(String(preset.name || ""))) return "restday";
  if (/节假|法定/.test(String(preset.name || ""))) return "holiday";
  return "workday";
}

function normalizePresetDayType(preset = {}) {
  const inferred = inferPresetDayType(preset);
  if (preset.dayType && !(preset.dayType === "workday" && inferred !== "workday")) return preset.dayType;
  return inferred;
}

export function getShiftPreset(settings = DEFAULT_SETTINGS, presetId) {
  const merged = mergeSettings(settings);
  return merged.shiftPresets.find((preset) => preset.id === presetId)
    || merged.shiftPresets.find((preset) => preset.id === merged.defaultPresetId)
    || merged.shiftPresets[0];
}

export function inferDayType(date, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  if (!merged.autoDayType || !date) return "workday";
  const holidayInfo = getHolidayInfo(date);
  if (holidayInfo) return holidayInfo.dayType;
  const weekday = new Date(`${date}T00:00:00`).getDay();
  return merged.workweek.includes(weekday) ? "workday" : "restday";
}

export function isWorkday(date, settings = DEFAULT_SETTINGS) {
  return inferDayType(date, settings) === "workday";
}

export function deriveSalaryInsights(settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  const baseSalary = clampNumber(merged.baseSalary, 0);
  const standardMonthlyHours = clampNumber(merged.standardMonthlyHours, 0, LEGAL_RULES.wageHourlyDivisor);
  const canDeriveFromBase = baseSalary > 0 && standardMonthlyHours > 0;
  const derivedFromBase = canDeriveFromBase ? baseSalary / standardMonthlyHours : 0;
  const configuredBaseHourlyRate = clampNumber(merged.baseHourlyRate, 0);
  const configuredBaseOvertimeRate = clampNumber(merged.baseOvertimeRate, 0);
  const configuredRegularHourlyRate = clampNumber(merged.regularHourlyRate, 0);
  const configuredComprehensiveHourlyRate = clampNumber(merged.comprehensiveHourlyRate, 0);
  const configuredHourlyRate = clampNumber(merged.hourlyRate, 0);
  const baseHourlyRate = configuredBaseHourlyRate > 0 ? configuredBaseHourlyRate : derivedFromBase;
  const baseOvertimeRate = configuredBaseOvertimeRate > 0 ? configuredBaseOvertimeRate : baseHourlyRate;
  const regularHourlyRate = configuredRegularHourlyRate > 0 ? configuredRegularHourlyRate : derivedFromBase;
  const comprehensiveHourlyRate = configuredComprehensiveHourlyRate > 0 ? configuredComprehensiveHourlyRate : derivedFromBase;
  const hourlyRate = configuredHourlyRate > 0 ? configuredHourlyRate : derivedFromBase;
  const missingConfig = [];

  const needsBaseFallback = (
    (merged.salaryMode === SALARY_MODES.REGULAR_OVERTIME && configuredRegularHourlyRate <= 0)
    || (merged.salaryMode === SALARY_MODES.BASE_OVERTIME && configuredBaseOvertimeRate <= 0)
    || (merged.salaryMode === SALARY_MODES.COMPREHENSIVE && configuredComprehensiveHourlyRate <= 0)
    || (merged.salaryMode === SALARY_MODES.HOURLY && configuredHourlyRate <= 0)
  );

  if (needsBaseFallback && !canDeriveFromBase) {
    if (baseSalary <= 0) missingConfig.push("baseSalary");
    if (standardMonthlyHours <= 0) missingConfig.push("standardMonthlyHours");
  }

  if (merged.salaryMode === SALARY_MODES.REGULAR_OVERTIME && regularHourlyRate <= 0) {
    missingConfig.push("regularHourlyRate");
  }

  if (merged.salaryMode === SALARY_MODES.BASE_OVERTIME && baseOvertimeRate <= 0) {
    missingConfig.push("baseOvertimeRate");
  }

  if (merged.salaryMode === SALARY_MODES.COMPREHENSIVE && comprehensiveHourlyRate <= 0) {
    missingConfig.push("comprehensiveHourlyRate");
  }

  if (merged.salaryMode === SALARY_MODES.HOURLY && hourlyRate <= 0) {
    missingConfig.push("hourlyRate");
  }

  const uniqueMissingConfig = [...new Set(missingConfig)];

  return {
    salaryMode: merged.salaryMode,
    baseSalary,
    standardMonthlyHours,
    baseHourlyRate: round2(baseHourlyRate),
    baseOvertimeRate: round2(baseOvertimeRate),
    regularHourlyRate: round2(regularHourlyRate),
    rates: {
      baseHourlyRate: round2(baseHourlyRate),
      baseOvertimeRate: round2(baseOvertimeRate),
      regularHourlyRate: round2(regularHourlyRate),
      hourlyRate: round2(hourlyRate),
      comprehensiveHourlyRate: round2(comprehensiveHourlyRate)
    },
    isDerived: {
      baseHourlyRate: configuredBaseHourlyRate <= 0 && baseHourlyRate > 0,
      baseOvertimeRate: configuredBaseOvertimeRate <= 0 && baseOvertimeRate > 0,
      regularHourlyRate: configuredRegularHourlyRate <= 0 && regularHourlyRate > 0,
      hourlyRate: configuredHourlyRate <= 0 && hourlyRate > 0,
      comprehensiveHourlyRate: configuredComprehensiveHourlyRate <= 0 && comprehensiveHourlyRate > 0
    },
    missingConfig: uniqueMissingConfig,
    prompts: uniqueMissingConfig.map((key) => `missing:${key}`)
  };
}

export function parseTimeToMinutes(value) {
  if (!value || typeof value !== "string") return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function calculateTimeHours(startTime, endTime, breakMinutes = 0) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (start === null || end === null) return 0;
  const normalizedEnd = end <= start ? end + 24 * 60 : end;
  const workMinutes = Math.max(0, normalizedEnd - start - clampNumber(breakMinutes, 0));
  return round2(workMinutes / 60);
}

export function monthKeyFromDate(date) {
  return String(date || "").slice(0, 7);
}

export function yearFromDate(date) {
  return Number(String(date || "").slice(0, 4));
}

export function monthIndexFromDate(date) {
  return Number(String(date || "").slice(5, 7)) - 1;
}

export function normalizeEntry(entry = {}, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  const recordMode = entry.recordMode || RECORD_MODES.TIME;
  const dayType = entry.dayType || "workday";
  let totalHours = 0;
  let regularHours = 0;
  let overtimeHours = 0;

  if (recordMode === RECORD_MODES.TIME) {
    totalHours = calculateTimeHours(entry.startTime, entry.endTime, entry.breakMinutes);
    const standardHours = dayType === "workday" ? merged.normalHoursPerDay : 0;
    regularHours = Math.min(totalHours, standardHours);
    overtimeHours = Math.max(0, totalHours - regularHours);
  } else {
    regularHours = clampNumber(entry.regularHours, 0);
    overtimeHours = clampNumber(entry.overtimeHours, 0);
    const detailTotal = regularHours + overtimeHours;
    const explicitTotal = clampNumber(entry.totalHours, 0, detailTotal);
    if (detailTotal > 0) {
      totalHours = detailTotal;
    } else {
      totalHours = explicitTotal;
      const standardHours = dayType === "workday" ? merged.normalHoursPerDay : 0;
      regularHours = Math.min(totalHours, standardHours);
      overtimeHours = Math.max(0, totalHours - regularHours);
    }
  }

  return {
    ...entry,
    recordMode,
    dayType,
    totalHours: round2(totalHours),
    regularHours: round2(regularHours),
    overtimeHours: round2(overtimeHours)
  };
}

export function buildEntryFromShiftPreset(date, preset = {}, overrides = {}) {
  const inferredDayType = inferDayType(date, overrides.settings || {});
  const presetDayType = preset.dayType && preset.dayType !== "workday" ? preset.dayType : inferredDayType;
  const source = {
    recordMode: RECORD_MODES.TIME,
    dayType: presetDayType,
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60,
    ...preset,
    ...overrides,
    date: overrides.date || date || preset.date
  };
  const normalHoursPerDay = clampNumber(
    source.normalHoursPerDay ?? source.settings?.normalHoursPerDay,
    0,
    DEFAULT_SETTINGS.normalHoursPerDay
  );
  const entry = {
    date: source.date,
    recordMode: source.recordMode || RECORD_MODES.TIME,
    dayType: source.dayType || "workday",
    startTime: source.startTime,
    endTime: source.endTime,
    breakMinutes: clampNumberMax(source.breakMinutes, 0, WORK_LIMITS.maxBreakMinutes),
    regularHours: clampNumberMax(source.regularHours, 0, WORK_LIMITS.maxRegularHours),
    overtimeHours: clampNumberMax(source.overtimeHours, 0, WORK_LIMITS.maxOvertimeHours),
    totalHours: clampNumberMax(source.totalHours, 0, WORK_LIMITS.maxEntryHours),
    target: source.target || "",
    note: source.note || ""
  };
  if (source.source) entry.source = source.source;

  if (entry.recordMode === RECORD_MODES.TIME) {
    entry.totalHours = calculateTimeHours(entry.startTime, entry.endTime, entry.breakMinutes);
    const standardHours = entry.dayType === "workday" ? normalHoursPerDay : 0;
    entry.regularHours = round2(Math.min(entry.totalHours, standardHours));
    entry.overtimeHours = round2(Math.max(0, entry.totalHours - entry.regularHours));
  } else {
    const detailTotal = entry.regularHours + entry.overtimeHours;
    if (entry.totalHours === 0) entry.totalHours = round2(detailTotal);
    if (detailTotal === 0 && entry.totalHours > 0) {
      const standardHours = entry.dayType === "workday" ? normalHoursPerDay : 0;
      entry.regularHours = round2(Math.min(entry.totalHours, standardHours));
      entry.overtimeHours = round2(Math.max(0, entry.totalHours - entry.regularHours));
    }
  }

  return entry;
}

export function buildBaseWorkEntry(date, settings = DEFAULT_SETTINGS, overrides = {}) {
  const merged = mergeSettings(settings);
  const dayType = inferDayType(date, merged);
  const regularHours = dayType === "workday"
    ? clampNumberMax(merged.normalHoursPerDay, 0, WORK_LIMITS.maxRegularHours, LEGAL_RULES.dailyStandardHours)
    : 0;
  const entry = {
    date,
    recordMode: RECORD_MODES.HOURS,
    dayType,
    regularHours,
    overtimeHours: 0,
    totalHours: regularHours,
    source: "bulk-base",
    note: "基础工时",
    ...overrides
  };
  return normalizeEntry(entry, merged);
}

export function buildOvertimeEntry(date, overtimeHours = 0, settings = DEFAULT_SETTINGS, overrides = {}) {
  const merged = mergeSettings(settings);
  const hours = clampNumberMax(overtimeHours, 0, WORK_LIMITS.maxOvertimeHours);
  const entry = {
    date,
    recordMode: RECORD_MODES.HOURS,
    dayType: inferDayType(date, merged),
    regularHours: 0,
    overtimeHours: hours,
    totalHours: hours,
    source: "bulk-overtime",
    note: "批量加班",
    ...overrides
  };
  return normalizeEntry(entry, merged);
}

export function hasBaseWorkEntryForDate(entries = [], date, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  return entries.some((entry) => {
    if (entry.date !== date || ["rest-day", "leave-note"].includes(entry.source)) return false;
    return normalizeEntry(entry, merged).regularHours > 0;
  });
}

export function validateEntry(entry = {}, settings = DEFAULT_SETTINGS, existingEntries = []) {
  const merged = mergeSettings(settings);
  const normalized = normalizeEntry(entry, merged);
  const errors = [];
  const warnings = [];
  const date = String(entry.date || "");
  const recordMode = entry.recordMode || RECORD_MODES.TIME;
  const dayType = entry.dayType || "workday";
  const zeroHourMarker = ["rest-day", "leave-note"].includes(entry.source);
  const sameDateEntries = existingEntries.filter((item) => item.date === date && item.id !== entry.id);
  const sameMonthEntries = existingEntries.filter((item) => {
    return monthKeyFromDate(item.date) === monthKeyFromDate(date) && item.id !== entry.id;
  });
  const existingDayTotal = sameDateEntries.reduce((sum, item) => sum + normalizeEntry(item, merged).totalHours, 0);
  const existingMonthTotal = sameMonthEntries.reduce((sum, item) => sum + normalizeEntry(item, merged).totalHours, 0);
  const dailyTotal = round2(existingDayTotal + normalized.totalHours);
  const monthlyTotal = round2(existingMonthTotal + normalized.totalHours);

  if (!isValidDateString(date)) errors.push("请选择有效日期");
  if (![RECORD_MODES.TIME, RECORD_MODES.HOURS].includes(recordMode)) errors.push("请选择正确的记录方式");
  if (!["workday", "restday", "holiday"].includes(dayType)) errors.push("请选择正确的日期类型");

  if (recordMode === RECORD_MODES.TIME) {
    const start = parseTimeToMinutes(entry.startTime);
    const end = parseTimeToMinutes(entry.endTime);
    const breakMinutes = Number(entry.breakMinutes || 0);
    if (start === null || end === null) errors.push("请填写有效的上下班时间");
    if (start !== null && end !== null && start === end) errors.push("上下班时间不能相同");
    if (!Number.isFinite(breakMinutes) || breakMinutes < 0) errors.push("休息时间不能为负数");
    if (breakMinutes > WORK_LIMITS.maxBreakMinutes) errors.push(`单次休息不能超过 ${WORK_LIMITS.maxBreakMinutes / 60} 小时`);
  } else {
    const regularHours = Number(entry.regularHours || 0);
    const overtimeHours = Number(entry.overtimeHours || 0);
    const totalHours = Number(entry.totalHours || 0);
    if ([regularHours, overtimeHours, totalHours].some((value) => !Number.isFinite(value) || value < 0)) {
      errors.push("工时不能为负数或无效数字");
    }
    if (totalHours > 0 && regularHours + overtimeHours > 0 && Math.abs(totalHours - regularHours - overtimeHours) > 0.01) {
      warnings.push("总小时会按正班小时 + 加班小时重新计算");
    }
  }

  if (normalized.totalHours <= 0 && !zeroHourMarker) errors.push("工时必须大于 0");
  if (normalized.totalHours > WORK_LIMITS.maxEntryHours) {
    errors.push(`单条记录不能超过 ${WORK_LIMITS.maxEntryHours} 小时`);
  }
  if (normalized.regularHours > WORK_LIMITS.maxRegularHours) {
    errors.push(`单条正班不能超过 ${WORK_LIMITS.maxRegularHours} 小时`);
  }
  if (normalized.overtimeHours > WORK_LIMITS.maxOvertimeHours) {
    errors.push(`单条加班不能超过 ${WORK_LIMITS.maxOvertimeHours} 小时`);
  }
  if (dailyTotal > WORK_LIMITS.maxDayHours) {
    errors.push(`当天合计不能超过 ${WORK_LIMITS.maxDayHours} 小时，当前将达到 ${dailyTotal} 小时`);
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    normalized,
    dailyTotal,
    monthlyTotal,
    monthlyOvertime: round2(sameMonthEntries.reduce((sum, item) => sum + normalizeEntry(item, merged).overtimeHours, 0) + normalized.overtimeHours)
  };
}

export function overtimeMultiplierForDay(dayType, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  if (dayType === "holiday") return clampNumber(merged.holidayMultiplier, 0, LEGAL_RULES.holidayOvertimeMultiplier);
  if (dayType === "restday") return clampNumber(merged.restDayMultiplier, 0, LEGAL_RULES.restDayOvertimeMultiplier);
  return clampNumber(merged.overtimeMultiplier, 0, LEGAL_RULES.workdayOvertimeMultiplier);
}

export function comprehensiveOvertimeMultiplier(settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  return clampNumber(merged.comprehensiveOvertimeMultiplier, 0, LEGAL_RULES.workdayOvertimeMultiplier);
}

export function calculateEntryPay(entry = {}, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  const insights = deriveSalaryInsights(merged);
  const normalized = normalizeEntry(entry, merged);
  const mode = merged.salaryMode;
  const leavePay = calculateLeavePay(normalized, merged, insights);
  if (leavePay) return leavePay;

  if (mode === SALARY_MODES.HOURLY) {
    const hourlyRate = insights.rates.hourlyRate;
    const regularPay = normalized.regularHours * hourlyRate;
    const overtimePay = normalized.overtimeHours * hourlyRate * overtimeMultiplierForDay(normalized.dayType, merged);
    return {
      regularPay: round2(regularPay),
      overtimePay: round2(overtimePay),
      totalPay: round2(regularPay + overtimePay)
    };
  }

  if (mode === SALARY_MODES.BASE_OVERTIME) {
    const overtimeRate = insights.baseOvertimeRate;
    const pay = normalized.overtimeHours * overtimeRate * overtimeMultiplierForDay(normalized.dayType, merged);
    return {
      regularPay: 0,
      overtimePay: round2(pay),
      totalPay: round2(pay)
    };
  }

  if (mode === SALARY_MODES.COMPREHENSIVE) {
    const hourlyRate = insights.rates.comprehensiveHourlyRate;
    const multiplier = normalized.dayType === "holiday" ? overtimeMultiplierForDay("holiday", merged) : 1;
    const pay = normalized.totalHours * hourlyRate * multiplier;
    return {
      regularPay: normalized.dayType === "holiday" ? 0 : round2(pay),
      overtimePay: normalized.dayType === "holiday" ? round2(pay) : 0,
      totalPay: round2(pay)
    };
  }

  const overtimePay = normalized.overtimeHours * insights.regularHourlyRate
    * overtimeMultiplierForDay(normalized.dayType, merged);
  const regularPay = normalized.regularHours * insights.regularHourlyRate;
  return {
    regularPay: round2(regularPay),
    overtimePay: round2(overtimePay),
    totalPay: round2(regularPay + overtimePay)
  };
}

export function calculateAdjustmentTotals(adjustments = [], year, monthIndex) {
  const month = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  return adjustments.reduce((totals, adjustment) => {
    if (monthKeyFromDate(adjustment.date) !== month) return totals;
    const amount = clampNumber(adjustment.amount, 0);
    if (adjustment.type === "deduction") {
      totals.deductions = round2(totals.deductions + amount);
    } else {
      totals.allowances = round2(totals.allowances + amount);
    }
    return totals;
  }, { allowances: 0, deductions: 0 });
}

export function calculateMonthlyPayroll(entries = [], adjustments = [], settings = DEFAULT_SETTINGS, year, monthIndex) {
  const merged = mergeSettings(settings);
  const month = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  let monthEntries = entries
    .filter((entry) => monthKeyFromDate(entry.date) === month)
    .map((entry) => normalizeEntry(entry, merged));
  if (merged.autoFillWorkday && merged.salaryMode !== SALARY_MODES.HOURLY) {
    const autoFilled = getAutoFilledEntries(year, monthIndex, entries, merged);
    monthEntries = monthEntries.concat(autoFilled.map((entry) => normalizeEntry(entry, merged)));
  }

  const attendanceDays = new Set(monthEntries.filter((entry) => entry.totalHours > 0).map((entry) => entry.date)).size;
  const totalHours = round2(monthEntries.reduce((sum, entry) => sum + entry.totalHours, 0));
  let regularHours = round2(monthEntries.reduce((sum, entry) => sum + entry.regularHours, 0));
  let overtimeHours = round2(monthEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0));
  let basePay = 0;
  let regularPay = 0;
  let overtimePay = 0;

  if (merged.salaryMode === SALARY_MODES.BASE_OVERTIME) {
    basePay = merged.baseSalary;
    const pay = monthEntries.reduce((sum, entry) => {
      const entryPay = calculateEntryPay(entry, merged);
      return {
        regularPay: sum.regularPay + entryPay.regularPay,
        overtimePay: sum.overtimePay + entryPay.overtimePay
      };
    }, { regularPay: 0, overtimePay: 0 });
    regularPay = pay.regularPay;
    overtimePay = pay.overtimePay;
  } else if (merged.salaryMode === SALARY_MODES.COMPREHENSIVE) {
    const targetHours = clampNumber(merged.comprehensiveTargetHours, 0);
    const hourlyRate = deriveSalaryInsights(merged).rates.comprehensiveHourlyRate;
    const holidayHours = monthEntries
      .filter((entry) => entry.dayType === "holiday")
      .reduce((sum, entry) => sum + entry.totalHours, 0);
    const nonHolidayHours = Math.max(0, totalHours - holidayHours);
    const excessHours = Math.max(0, nonHolidayHours - targetHours);
    regularHours = round2(Math.min(nonHolidayHours, targetHours));
    overtimeHours = round2(excessHours + holidayHours);
    regularPay = regularHours * hourlyRate;
    overtimePay = excessHours * hourlyRate * comprehensiveOvertimeMultiplier(merged)
      + holidayHours * hourlyRate * overtimeMultiplierForDay("holiday", merged);
  } else {
    const pay = monthEntries.reduce((sum, entry) => {
      const entryPay = calculateEntryPay(entry, merged);
      return {
        regularPay: sum.regularPay + entryPay.regularPay,
        overtimePay: sum.overtimePay + entryPay.overtimePay
      };
    }, { regularPay: 0, overtimePay: 0 });
    regularPay = pay.regularPay;
    overtimePay = pay.overtimePay;
  }

  const adjustmentTotals = calculateAdjustmentTotals(adjustments, year, monthIndex);
  const grossBeforeTax = round2(basePay + regularPay + overtimePay + adjustmentTotals.allowances - adjustmentTotals.deductions);

  return {
    year,
    monthIndex,
    attendanceDays,
    entries: monthEntries,
    totalHours,
    regularHours: round2(regularHours),
    overtimeHours: round2(overtimeHours),
    basePay: round2(basePay),
    regularPay: round2(regularPay),
    overtimePay: round2(overtimePay),
    allowances: adjustmentTotals.allowances,
    deductions: adjustmentTotals.deductions,
    grossBeforeTax
  };
}

export function calculateComplianceSummary(entries = [], settings = DEFAULT_SETTINGS, year, monthIndex) {
  const merged = mergeSettings(settings);
  const month = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  const monthEntries = entries
    .filter((entry) => monthKeyFromDate(entry.date) === month)
    .map((entry) => normalizeEntry(entry, merged));
  const daily = new Map();
  const weekly = new Map();

  for (const entry of monthEntries) {
    if (!daily.has(entry.date)) {
      daily.set(entry.date, {
        date: entry.date,
        totalHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        workdayOvertimeHours: 0
      });
    }
    const day = daily.get(entry.date);
    day.totalHours = round2(day.totalHours + entry.totalHours);
    day.regularHours = round2(day.regularHours + entry.regularHours);
    day.overtimeHours = round2(day.overtimeHours + entry.overtimeHours);
    if (entry.dayType === "workday") {
      day.workdayOvertimeHours = round2(day.workdayOvertimeHours + entry.overtimeHours);
    }

    const weekKey = weekKeyFromDate(entry.date);
    weekly.set(weekKey, round2((weekly.get(weekKey) || 0) + entry.totalHours));
  }

  const days = [...daily.values()];
  const monthlyOvertimeHours = round2(days.reduce((sum, day) => sum + day.overtimeHours, 0));
  const dailySoftOvertimeDays = days.filter((day) => day.workdayOvertimeHours > LEGAL_RULES.dailyOvertimeSoftLimit);
  const dailyHardOvertimeDays = days.filter((day) => day.workdayOvertimeHours > LEGAL_RULES.dailyOvertimeHardLimit);
  const weeklyOverLimit = [...weekly.entries()]
    .filter(([, hours]) => hours > LEGAL_RULES.weeklyStandardHours)
    .map(([week, hours]) => ({ week, hours }));
  const warnings = [];

  return {
    monthlyOvertimeHours,
    dailySoftOvertimeDays,
    dailyHardOvertimeDays,
    weeklyOverLimit,
    warnings
  };
}

export function buildGrossByMonth(entries = [], adjustments = [], settings = DEFAULT_SETTINGS, year) {
  return Array.from({ length: 12 }, (_, monthIndex) => {
    return calculateMonthlyPayroll(entries, adjustments, settings, year, monthIndex).grossBeforeTax;
  });
}

export function calculateAnnualTax(taxableIncome) {
  const taxable = Math.max(0, taxableIncome);
  const bracket = ANNUAL_TAX_BRACKETS.find((item) => taxable <= item.limit) || ANNUAL_TAX_BRACKETS.at(-1);
  return {
    taxableIncome: round2(taxable),
    rate: bracket.rate,
    quickDeduction: bracket.quickDeduction,
    tax: round2(Math.max(0, taxable * bracket.rate - bracket.quickDeduction))
  };
}

export function monthlyDeductionForGross(gross, settings = DEFAULT_SETTINGS) {
  const tax = mergeSettings(settings).tax;
  const grossAmount = clampNumber(gross, 0);
  const otherDeduction = tax.otherDeductionMode === "percent"
    ? grossAmount * clampNumber(tax.deductionPercent, 0) / 100
    : clampNumber(tax.fixedDeductionMonthly, 0);
  const socialSecurity = tax.socialSecurityMode === "percent"
    ? grossAmount * clampNumber(tax.socialSecurityPercent, 0) / 100
    : clampNumber(tax.socialSecurityFixedMonthly, 0);
  return round2(
    clampNumber(tax.standardDeductionMonthly, 0)
    + clampNumber(tax.specialAdditionalDeductionMonthly, 0)
    + otherDeduction
    + socialSecurity
  );
}

export function calculateCumulativeTaxForMonth(grossByMonth = [], settings = DEFAULT_SETTINGS, monthIndex = 0) {
  let cumulativeGross = 0;
  let cumulativeDeduction = 0;
  let paidBefore = 0;
  let result = {
    currentTax: 0,
    cumulativeTax: 0,
    paidBefore: 0,
    taxableIncome: 0,
    cumulativeGross: 0,
    cumulativeDeduction: 0,
    rate: 0,
    quickDeduction: 0
  };

  for (let index = 0; index <= monthIndex; index += 1) {
    const gross = clampNumber(grossByMonth[index], 0);
    cumulativeGross += gross;
    cumulativeDeduction += monthlyDeductionForGross(gross, settings);
    const taxInfo = calculateAnnualTax(Math.max(0, cumulativeGross - cumulativeDeduction));
    result = {
      currentTax: round2(Math.max(0, taxInfo.tax - paidBefore)),
      cumulativeTax: taxInfo.tax,
      paidBefore: round2(paidBefore),
      taxableIncome: taxInfo.taxableIncome,
      cumulativeGross: round2(cumulativeGross),
      cumulativeDeduction: round2(cumulativeDeduction),
      rate: taxInfo.rate,
      quickDeduction: taxInfo.quickDeduction
    };
    paidBefore = taxInfo.tax;
  }

  return result;
}

export function summarizeYear(entries = [], adjustments = [], settings = DEFAULT_SETTINGS, year) {
  const grossByMonth = buildGrossByMonth(entries, adjustments, settings, year);
  return grossByMonth.map((gross, monthIndex) => {
    const payroll = calculateMonthlyPayroll(entries, adjustments, settings, year, monthIndex);
    const tax = calculateCumulativeTaxForMonth(grossByMonth, settings, monthIndex);
    return {
      ...payroll,
      tax,
      netIncome: round2(payroll.grossBeforeTax - tax.currentTax)
    };
  });
}

export function buildCalendarDays(year, monthIndex, weekStart = 1) {
  const first = new Date(year, monthIndex, 1);
  const normalizedWeekStart = normalizeWeekday(weekStart, 1);
  const startDay = positiveModulo(first.getDay() - normalizedWeekStart, 7);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();
  const cells = [];

  for (let i = startDay - 1; i >= 0; i -= 1) {
    const day = previousMonthDays - i;
    const date = new Date(year, monthIndex - 1, day);
    const dateText = formatDate(date);
    cells.push({ date: dateText, inMonth: false, holiday: getHolidayInfo(dateText) });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const dateText = formatDate(date);
    cells.push({ date: dateText, inMonth: true, holiday: getHolidayInfo(dateText) });
  }

  let trailingDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, monthIndex + 1, trailingDay);
    const dateText = formatDate(date);
    cells.push({ date: dateText, inMonth: false, holiday: getHolidayInfo(dateText) });
    trailingDay += 1;
  }

  return cells;
}

export function buildShiftCalendarDays(year, monthIndex, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  return buildCalendarDays(year, monthIndex, merged.weekStart).map((day) => ({
    ...day,
    shift: shiftCycleForDate(day.date, merged)
  }));
}

export function shiftCycleForDate(date, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  const config = normalizeShiftCalendar(merged.shiftCalendar);
  const dateText = isValidDateString(String(date || "")) ? String(date) : formatDate(new Date());
  if (!config.enabled || !config.items.length) {
    return {
      enabled: false,
      date: dateText,
      config,
      item: null,
      index: -1,
      cycleDay: 0,
      cycleLength: config.items.length,
      cycleNumber: 0,
      daysFromAnchor: 0,
      nextChangeDate: "",
      nextRestDate: "",
      nextRestItem: null
    };
  }

  const daysFromAnchor = daysBetween(config.anchorDate, dateText);
  const index = positiveModulo(daysFromAnchor, config.items.length);
  const item = config.items[index];
  const cycleNumber = daysFromAnchor >= 0
    ? Math.floor(daysFromAnchor / config.items.length) + 1
    : Math.floor(daysFromAnchor / config.items.length);
  const nextRest = findNextShiftByKind(dateText, config, SHIFT_CALENDAR_KINDS.REST);
  return {
    enabled: true,
    date: dateText,
    config,
    item,
    index,
    cycleDay: index + 1,
    cycleLength: config.items.length,
    cycleNumber,
    daysFromAnchor,
    nextChangeDate: addDays(dateText, 1),
    nextRestDate: nextRest.date,
    nextRestItem: nextRest.item
  };
}

function findNextShiftByKind(date, config, kind) {
  if (!config.items.some((item) => item.kind === kind)) return { date: "", item: null };
  for (let offset = 0; offset <= config.items.length * 2; offset += 1) {
    const candidateDate = addDays(date, offset);
    const index = positiveModulo(daysBetween(config.anchorDate, candidateDate), config.items.length);
    const item = config.items[index];
    if (item.kind === kind) return { date: candidateDate, item };
  }
  return { date: "", item: null };
}

export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDateString(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime()) && formatDate(parsed) === value;
}

function weekKeyFromDate(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const weekday = date.getDay() || 7;
  date.setDate(date.getDate() - weekday + 1);
  return formatDate(date);
}

function calculateLeavePay(entry = {}, settings = DEFAULT_SETTINGS, insights = deriveSalaryInsights(settings)) {
  if (entry.source !== "leave-note" || !entry.leavePayMode) return null;
  const mode = entry.leavePayMode;
  const multiplier = mode === "unpaid" ? 0 : clampNumber(entry.leavePayMultiplier, 0, 1);
  const deduction = mode === "deduct" ? clampNumber(entry.leaveDeductionAmount, 0) : 0;
  const hours = clampNumber(entry.leaveHours, 0, settings.normalHoursPerDay || DEFAULT_SETTINGS.normalHoursPerDay);
  let hourlyRate = insights.regularHourlyRate;
  if (settings.salaryMode === SALARY_MODES.HOURLY) hourlyRate = insights.rates.hourlyRate;
  if (settings.salaryMode === SALARY_MODES.COMPREHENSIVE) hourlyRate = insights.rates.comprehensiveHourlyRate;
  const grossLeavePay = settings.salaryMode === SALARY_MODES.BASE_OVERTIME
    ? 0
    : hours * hourlyRate * multiplier;
  const regularPay = round2(grossLeavePay - deduction);
  return {
    regularPay,
    overtimePay: 0,
    totalPay: regularPay
  };
}

export function calculateRestReminder(date, settings = DEFAULT_SETTINGS, entries = []) {
  const merged = mergeSettings(settings);
  const dateText = isValidDateString(String(date || "")) ? String(date) : formatDate(new Date());
  const config = merged.restCycle || DEFAULT_SETTINGS.restCycle;
  if (config.mode === REST_CYCLE_MODES.WORKWEEK
    || config.mode === REST_CYCLE_MODES.DOUBLE_WEEKEND
    || config.mode === REST_CYCLE_MODES.SINGLE_SUNDAY) {
    return workweekRestReminder(dateText, restSettingsForMode(merged, config.mode), config.mode);
  }

  const cycle = restCycleConfig(config);
  const anchorDate = isValidDateString(config.lastRestDate || "")
    ? config.lastRestDate
    : inferLastRestDate(dateText, entries, merged);
  if (!isValidDateString(anchorDate || "")) {
    return {
      mode: config.mode,
      label: cycle.label,
      requiresAnchor: true,
      isRestDue: false,
      daysUntilRest: null,
      nextRestDate: "",
      detail: "设置上一次休息日，或先记录一次休息，系统就能开始倒计时"
    };
  }

  const days = daysBetween(anchorDate, dateText);
  if (days === 0) {
    return {
      mode: config.mode,
      label: cycle.label,
      requiresAnchor: false,
      isRestDue: true,
      daysUntilRest: 0,
      nextRestDate: dateText,
      anchorDate,
      detail: "今天就是记录里的休息日"
    };
  }

  const cycleLength = cycle.workDays + cycle.restDays;
  const position = positiveModulo(days - 1, cycleLength);
  const isRestDue = position >= cycle.workDays;
  const daysUntilRest = isRestDue ? 0 : cycle.workDays - position;
  const nextRestDate = addDays(dateText, daysUntilRest);
  return {
    mode: config.mode,
    label: cycle.label,
    requiresAnchor: false,
    isRestDue,
    daysUntilRest,
    nextRestDate,
    anchorDate,
    detail: isRestDue ? "今天建议安排休息" : `距离建议休息还有 ${daysUntilRest} 天`
  };
}

function restCycleConfig(config = DEFAULT_SETTINGS.restCycle) {
  if (config.mode === REST_CYCLE_MODES.WORK_6_REST_1) {
    return { label: "上六休一", workDays: 6, restDays: 1 };
  }
  if (config.mode === REST_CYCLE_MODES.WORK_14_REST_1) {
    return { label: "上十四休一", workDays: 14, restDays: 1 };
  }
  return {
    label: "自定义",
    workDays: Math.max(1, Math.round(clampNumber(config.workDays, 1, 5))),
    restDays: Math.max(1, Math.round(clampNumber(config.restDays, 1, 1)))
  };
}

function restSettingsForMode(settings, mode) {
  if (mode === REST_CYCLE_MODES.DOUBLE_WEEKEND) {
    return { ...settings, workweek: [1, 2, 3, 4, 5] };
  }
  if (mode === REST_CYCLE_MODES.SINGLE_SUNDAY) {
    return { ...settings, workweek: [1, 2, 3, 4, 5, 6] };
  }
  return settings;
}

function restModeLabel(mode) {
  if (mode === REST_CYCLE_MODES.DOUBLE_WEEKEND) return "每周双休";
  if (mode === REST_CYCLE_MODES.SINGLE_SUNDAY) return "每周单休";
  return "自定义周休";
}

function workweekRestReminder(date, settings, mode = REST_CYCLE_MODES.WORKWEEK) {
  for (let offset = 0; offset <= 14; offset += 1) {
    const dateText = addDays(date, offset);
    if (inferDayType(dateText, settings) !== "workday") {
      return {
        mode,
        label: restModeLabel(mode),
        requiresAnchor: false,
        isRestDue: offset === 0,
        daysUntilRest: offset,
        nextRestDate: dateText,
        detail: offset === 0 ? "今天是休息日" : `距离休息日还有 ${offset} 天`
      };
    }
  }
  return {
    mode,
    label: restModeLabel(mode),
    requiresAnchor: false,
    isRestDue: false,
    daysUntilRest: null,
    nextRestDate: "",
    detail: "未来两周没有找到休息日"
  };
}

function inferLastRestDate(date, entries = [], settings = DEFAULT_SETTINGS) {
  const restEntries = (Array.isArray(entries) ? entries : [])
    .filter((entry) => entry?.date && entry.date <= date)
    .filter((entry) => {
      if (entry.source === "rest-day") return true;
      if (entry.dayType === "restday" && normalizeEntry(entry, settings).totalHours <= 0) return true;
      return false;
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return restEntries[0]?.date || "";
}

export function getUnloggedDays(year, monthIndex, entries, settings = DEFAULT_SETTINGS) {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const entryDates = new Set(entries.map((entry) => entry.date));
  const unlogged = [];
  const today = formatDate(new Date());
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const dateText = formatDate(date);
    if (dateText > today) break;
    if (entryDates.has(dateText)) continue;
    if (inferDayType(dateText, settings) === "workday") {
      unlogged.push(dateText);
    }
  }
  return unlogged;
}

export function getAutoFilledEntries(year, monthIndex, entries, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  if (!merged.autoFillWorkday) return [];
  if (merged.salaryMode === SALARY_MODES.HOURLY) return [];
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const entryDates = new Set(entries.map((entry) => entry.date));
  const today = formatDate(new Date());
  const normalHours = clampNumber(merged.normalHoursPerDay, 0, WORK_LIMITS.maxRegularHours, LEGAL_RULES.dailyStandardHours);
  const autoEntries = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    const dateText = formatDate(date);
    if (dateText > today) break;
    if (entryDates.has(dateText)) continue;
    const dayType = inferDayType(dateText, merged);
    if (dayType !== "workday") continue;
    autoEntries.push({
      date: dateText,
      recordMode: RECORD_MODES.HOURS,
      dayType,
      regularHours: normalHours,
      overtimeHours: 0,
      totalHours: normalHours,
      source: "auto-fill",
      note: "默认工时"
    });
  }
  return autoEntries;
}

function addDays(date, days) {
  const parsed = new Date(`${date}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);
  return formatDate(parsed);
}

function daysBetween(start, end) {
  const left = new Date(`${start}T00:00:00`);
  const right = new Date(`${end}T00:00:00`);
  return Math.floor((right - left) / 86400000);
}

function positiveModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

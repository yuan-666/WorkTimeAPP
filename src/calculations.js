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
  autoDayType: true,
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
    standardDeductionMonthly: 5000,
    fixedDeductionMonthly: 0,
    specialAdditionalDeductionMonthly: 0,
    deductionPercent: 0,
    socialSecurityFixedMonthly: 0,
    socialSecurityPercent: 0
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
    workweek: Array.isArray(partial.workweek) ? partial.workweek.map(Number) : DEFAULT_SETTINGS.workweek,
    autoAdjustment: { ...DEFAULT_SETTINGS.autoAdjustment, ...(partial.autoAdjustment || {}) },
    goals: { ...DEFAULT_SETTINGS.goals, ...(partial.goals || {}) },
    tax: { ...DEFAULT_SETTINGS.tax, ...(partial.tax || {}) }
  };
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

export function validateEntry(entry = {}, settings = DEFAULT_SETTINGS, existingEntries = []) {
  const merged = mergeSettings(settings);
  const normalized = normalizeEntry(entry, merged);
  const errors = [];
  const warnings = [];
  const date = String(entry.date || "");
  const recordMode = entry.recordMode || RECORD_MODES.TIME;
  const dayType = entry.dayType || "workday";
  const sameDateEntries = existingEntries.filter((item) => item.date === date && item.id !== entry.id);
  const sameMonthEntries = existingEntries.filter((item) => {
    return monthKeyFromDate(item.date) === monthKeyFromDate(date) && item.id !== entry.id;
  });
  const existingDayTotal = sameDateEntries.reduce((sum, item) => sum + normalizeEntry(item, merged).totalHours, 0);
  const existingMonthTotal = sameMonthEntries.reduce((sum, item) => sum + normalizeEntry(item, merged).totalHours, 0);
  const existingMonthOvertime = sameMonthEntries.reduce((sum, item) => sum + normalizeEntry(item, merged).overtimeHours, 0);
  const dailyTotal = round2(existingDayTotal + normalized.totalHours);
  const monthlyTotal = round2(existingMonthTotal + normalized.totalHours);
  const monthlyOvertime = round2(existingMonthOvertime + normalized.overtimeHours);

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

  if (normalized.totalHours <= 0) errors.push("工时必须大于 0");
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
  if (normalized.dayType === "workday" && normalized.overtimeHours > LEGAL_RULES.dailyOvertimeSoftLimit) {
    warnings.push(`工作日延长工时超过 ${LEGAL_RULES.dailyOvertimeSoftLimit} 小时，应确认已协商审批`);
  }
  if (normalized.dayType === "workday" && normalized.overtimeHours > LEGAL_RULES.dailyOvertimeHardLimit) {
    warnings.push(`工作日延长工时超过 ${LEGAL_RULES.dailyOvertimeHardLimit} 小时，存在合规风险`);
  }
  if (monthlyOvertime > LEGAL_RULES.monthlyOvertimeLimit) {
    warnings.push(`本月加班将达到 ${monthlyOvertime} 小时，超过 ${LEGAL_RULES.monthlyOvertimeLimit} 小时合规警戒线`);
  }
  if (monthlyTotal > WORK_LIMITS.maxMonthlyHours) {
    warnings.push(`本月工时将达到 ${monthlyTotal} 小时，请确认排班是否真实`);
  }

  return {
    valid: errors.length === 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
    normalized,
    dailyTotal,
    monthlyTotal,
    monthlyOvertime
  };
}

export function overtimeMultiplierForDay(dayType, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  if (dayType === "holiday") return Math.max(
    LEGAL_RULES.holidayOvertimeMultiplier,
    clampNumber(merged.holidayMultiplier, 0)
  );
  if (dayType === "restday") return Math.max(
    LEGAL_RULES.restDayOvertimeMultiplier,
    clampNumber(merged.restDayMultiplier, 0)
  );
  return Math.max(
    LEGAL_RULES.workdayOvertimeMultiplier,
    clampNumber(merged.overtimeMultiplier, 0)
  );
}

export function comprehensiveOvertimeMultiplier(settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  return Math.max(
    LEGAL_RULES.workdayOvertimeMultiplier,
    clampNumber(merged.comprehensiveOvertimeMultiplier, 0)
  );
}

export function calculateEntryPay(entry = {}, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  const insights = deriveSalaryInsights(merged);
  const normalized = normalizeEntry(entry, merged);
  const mode = merged.salaryMode;

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
  const monthEntries = entries
    .filter((entry) => monthKeyFromDate(entry.date) === month)
    .map((entry) => normalizeEntry(entry, merged));

  const attendanceDays = new Set(monthEntries.filter((entry) => entry.totalHours > 0).map((entry) => entry.date)).size;
  const totalHours = round2(monthEntries.reduce((sum, entry) => sum + entry.totalHours, 0));
  let regularHours = round2(monthEntries.reduce((sum, entry) => sum + entry.regularHours, 0));
  let overtimeHours = round2(monthEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0));
  let basePay = 0;
  let regularPay = 0;
  let overtimePay = 0;

  if (merged.salaryMode === SALARY_MODES.BASE_OVERTIME) {
    basePay = merged.baseSalary;
    overtimePay = monthEntries.reduce((sum, entry) => sum + calculateEntryPay(entry, merged).overtimePay, 0);
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

  if (monthlyOvertimeHours > LEGAL_RULES.monthlyOvertimeLimit) {
    warnings.push(`本月加班 ${monthlyOvertimeHours}h，超过 ${LEGAL_RULES.monthlyOvertimeLimit}h 警戒线`);
  }
  if (dailyHardOvertimeDays.length) {
    warnings.push(`${dailyHardOvertimeDays.length} 天工作日加班超过 ${LEGAL_RULES.dailyOvertimeHardLimit}h`);
  }
  if (weeklyOverLimit.length) {
    warnings.push(`${weeklyOverLimit.length} 周总工时超过 ${LEGAL_RULES.weeklyStandardHours}h`);
  }

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
  const percent = clampNumber(tax.deductionPercent, 0) + clampNumber(tax.socialSecurityPercent, 0);
  return round2(
    clampNumber(tax.standardDeductionMonthly, 0)
    + clampNumber(tax.fixedDeductionMonthly, 0)
    + clampNumber(tax.specialAdditionalDeductionMonthly, 0)
    + clampNumber(tax.socialSecurityFixedMonthly, 0)
    + clampNumber(gross, 0) * percent / 100
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

export function buildCalendarDays(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startDay = first.getDay();
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

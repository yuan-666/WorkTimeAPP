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

export const DEFAULT_SETTINGS = {
  currency: "CNY",
  salaryMode: SALARY_MODES.REGULAR_OVERTIME,
  normalHoursPerDay: 8,
  regularHourlyRate: 0,
  overtimeMultiplier: 1.5,
  restDayMultiplier: 2,
  holidayMultiplier: 3,
  baseSalary: 6000,
  standardMonthlyHours: 174,
  baseHourlyRate: 0,
  baseOvertimeRate: 0,
  comprehensiveHourlyRate: 28,
  comprehensiveTargetHours: 174,
  comprehensiveOvertimeMultiplier: 1.5,
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

export function normalizeShiftPresets(presets = DEFAULT_SETTINGS.shiftPresets) {
  const normalized = Array.isArray(presets) ? presets : DEFAULT_SETTINGS.shiftPresets;
  return normalized.map((preset, index) => ({
    id: preset.id || `preset-${index + 1}`,
    name: preset.name || `班次${index + 1}`,
    recordMode: preset.recordMode || RECORD_MODES.TIME,
    dayType: preset.dayType || "workday",
    startTime: preset.startTime || "09:00",
    endTime: preset.endTime || "18:00",
    breakMinutes: clampNumber(preset.breakMinutes, 0),
    regularHours: clampNumber(preset.regularHours, 0),
    overtimeHours: clampNumber(preset.overtimeHours, 0),
    totalHours: clampNumber(preset.totalHours, 0)
  }));
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
  const weekday = new Date(`${date}T00:00:00`).getDay();
  return merged.workweek.includes(weekday) ? "workday" : "restday";
}

export function deriveSalaryInsights(settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  const baseSalary = clampNumber(merged.baseSalary, 0);
  const standardMonthlyHours = clampNumber(merged.standardMonthlyHours, 0);
  const canDeriveFromBase = baseSalary > 0 && standardMonthlyHours > 0;
  const derivedFromBase = canDeriveFromBase ? baseSalary / standardMonthlyHours : 0;
  const configuredBaseHourlyRate = clampNumber(merged.baseHourlyRate, 0);
  const configuredBaseOvertimeRate = clampNumber(merged.baseOvertimeRate, 0);
  const configuredRegularHourlyRate = clampNumber(merged.regularHourlyRate, 0);
  const baseHourlyRate = configuredBaseHourlyRate > 0 ? configuredBaseHourlyRate : derivedFromBase;
  const baseOvertimeRate = configuredBaseOvertimeRate > 0 ? configuredBaseOvertimeRate : baseHourlyRate;
  const regularHourlyRate = configuredRegularHourlyRate > 0 ? configuredRegularHourlyRate : derivedFromBase;
  const missingConfig = [];

  if (!canDeriveFromBase) {
    if (baseSalary <= 0) missingConfig.push("baseSalary");
    if (standardMonthlyHours <= 0) missingConfig.push("standardMonthlyHours");
  }

  if (merged.salaryMode === SALARY_MODES.REGULAR_OVERTIME && regularHourlyRate <= 0) {
    missingConfig.push("regularHourlyRate");
  }

  if (merged.salaryMode === SALARY_MODES.BASE_OVERTIME && baseOvertimeRate <= 0) {
    missingConfig.push("baseOvertimeRate");
  }

  if (merged.salaryMode === SALARY_MODES.COMPREHENSIVE && clampNumber(merged.comprehensiveHourlyRate, 0) <= 0) {
    missingConfig.push("comprehensiveHourlyRate");
  }

  if (merged.salaryMode === SALARY_MODES.HOURLY && clampNumber(merged.hourlyRate, 0) <= 0) {
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
      hourlyRate: round2(clampNumber(merged.hourlyRate, 0)),
      comprehensiveHourlyRate: round2(clampNumber(merged.comprehensiveHourlyRate, 0))
    },
    isDerived: {
      baseHourlyRate: configuredBaseHourlyRate <= 0 && baseHourlyRate > 0,
      baseOvertimeRate: configuredBaseOvertimeRate <= 0 && baseOvertimeRate > 0,
      regularHourlyRate: configuredRegularHourlyRate <= 0 && regularHourlyRate > 0
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
    totalHours = clampNumber(entry.totalHours, 0, regularHours + overtimeHours);
    if (totalHours === 0) totalHours = regularHours + overtimeHours;
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
  const normalHoursPerDay = clampNumber(source.normalHoursPerDay, 0, DEFAULT_SETTINGS.normalHoursPerDay);
  const entry = {
    date: source.date,
    recordMode: source.recordMode || RECORD_MODES.TIME,
    dayType: source.dayType || "workday",
    startTime: source.startTime,
    endTime: source.endTime,
    breakMinutes: clampNumber(source.breakMinutes, 0),
    regularHours: clampNumber(source.regularHours, 0),
    overtimeHours: clampNumber(source.overtimeHours, 0),
    totalHours: clampNumber(source.totalHours, 0),
    target: source.target || "",
    note: source.note || ""
  };

  if (entry.recordMode === RECORD_MODES.TIME) {
    entry.totalHours = calculateTimeHours(entry.startTime, entry.endTime, entry.breakMinutes);
    const standardHours = entry.dayType === "workday" ? normalHoursPerDay : 0;
    entry.regularHours = round2(Math.min(entry.totalHours, standardHours));
    entry.overtimeHours = round2(Math.max(0, entry.totalHours - entry.regularHours));
  } else {
    if (entry.totalHours === 0) entry.totalHours = round2(entry.regularHours + entry.overtimeHours);
  }

  return entry;
}

export function overtimeMultiplierForDay(dayType, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  if (dayType === "holiday") return merged.holidayMultiplier;
  if (dayType === "restday") return merged.restDayMultiplier;
  return merged.overtimeMultiplier;
}

export function calculateEntryPay(entry = {}, settings = DEFAULT_SETTINGS) {
  const merged = mergeSettings(settings);
  const insights = deriveSalaryInsights(merged);
  const normalized = normalizeEntry(entry, merged);
  const mode = merged.salaryMode;

  if (mode === SALARY_MODES.HOURLY) {
    return {
      regularPay: round2(normalized.totalHours * merged.hourlyRate),
      overtimePay: 0,
      totalPay: round2(normalized.totalHours * merged.hourlyRate)
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
    const multiplier = normalized.dayType === "holiday" ? merged.holidayMultiplier : 1;
    const pay = normalized.totalHours * merged.comprehensiveHourlyRate * multiplier;
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
    const holidayHours = monthEntries
      .filter((entry) => entry.dayType === "holiday")
      .reduce((sum, entry) => sum + entry.totalHours, 0);
    const nonHolidayHours = Math.max(0, totalHours - holidayHours);
    const excessHours = Math.max(0, nonHolidayHours - targetHours);
    regularHours = round2(Math.min(nonHolidayHours, targetHours));
    overtimeHours = round2(excessHours + holidayHours);
    regularPay = regularHours * merged.comprehensiveHourlyRate;
    overtimePay = excessHours * merged.comprehensiveHourlyRate * merged.comprehensiveOvertimeMultiplier
      + holidayHours * merged.comprehensiveHourlyRate * merged.holidayMultiplier;
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
    cells.push({ date: formatDate(date), inMonth: false });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, monthIndex, day);
    cells.push({ date: formatDate(date), inMonth: true });
  }

  let trailingDay = 1;
  while (cells.length % 7 !== 0) {
    const date = new Date(year, monthIndex + 1, trailingDay);
    cells.push({ date: formatDate(date), inMonth: false });
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

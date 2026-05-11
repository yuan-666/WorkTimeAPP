import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGAL_RULES,
  RECORD_MODES,
  SALARY_MODES,
  WORK_LIMITS,
  calculateAnnualTax,
  calculateCumulativeTaxForMonth,
  calculateEntryPay,
  calculateComplianceSummary,
  calculateMonthlyPayroll,
  calculateTimeHours,
  buildCalendarDays,
  buildEntryFromShiftPreset,
  getHolidayInfo,
  inferDayType,
  isWorkday,
  mergeSettings,
  normalizeEntry,
  overtimeMultiplierForDay,
  deriveSalaryInsights,
  validateEntry
} from "../src/calculations.js";

test("time records subtract breaks and support overnight shifts", () => {
  assert.equal(calculateTimeHours("09:00", "18:00", 60), 8);
  assert.equal(calculateTimeHours("22:00", "06:00", 30), 7.5);
});

test("normal plus overtime mode splits regular and overtime hours", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.REGULAR_OVERTIME,
    regularHourlyRate: 20,
    normalHoursPerDay: 8,
    overtimeMultiplier: 1.5
  });
  const entry = {
    date: "2026-05-01",
    recordMode: "time",
    dayType: "workday",
    startTime: "09:00",
    endTime: "20:00",
    breakMinutes: 60
  };
  assert.deepEqual(normalizeEntry(entry, settings), {
    ...entry,
    totalHours: 10,
    regularHours: 8,
    overtimeHours: 2
  });
  assert.equal(calculateEntryPay(entry, settings).totalPay, 220);
});

test("rest days use rest-day overtime multiplier", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.REGULAR_OVERTIME,
    regularHourlyRate: 30,
    restDayMultiplier: 2
  });
  const pay = calculateEntryPay({
    date: "2026-05-02",
    recordMode: "hours",
    dayType: "restday",
    overtimeHours: 6,
    totalHours: 6
  }, settings);
  assert.equal(pay.totalPay, 360);
});

test("base plus overtime mode adds base salary once per month", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.BASE_OVERTIME,
    baseSalary: 6000,
    standardMonthlyHours: 174,
    baseOvertimeRate: 50,
    overtimeMultiplier: 1.5
  });
  const payroll = calculateMonthlyPayroll([
    {
      date: "2026-05-06",
      recordMode: "hours",
      dayType: "workday",
      regularHours: 8,
      overtimeHours: 2,
      totalHours: 10
    }
  ], [], settings, 2026, 4);
  assert.equal(payroll.basePay, 6000);
  assert.equal(payroll.overtimePay, 150);
  assert.equal(payroll.grossBeforeTax, 6150);
});

test("regular overtime mode derives hourly rate from monthly salary fallback", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.REGULAR_OVERTIME,
    baseSalary: 8700,
    standardMonthlyHours: 174,
    regularHourlyRate: 0,
    overtimeMultiplier: 1.5
  });
  const pay = calculateEntryPay({
    date: "2026-05-07",
    recordMode: "hours",
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 2,
    totalHours: 10
  }, settings);
  assert.equal(deriveSalaryInsights(settings).regularHourlyRate, 50);
  assert.equal(pay.regularPay, 400);
  assert.equal(pay.overtimePay, 150);
  assert.equal(pay.totalPay, 550);
});

test("base overtime mode derives base hourly and overtime fallback rates", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.BASE_OVERTIME,
    baseSalary: 8700,
    standardMonthlyHours: 174,
    baseHourlyRate: 0,
    baseOvertimeRate: 0,
    overtimeMultiplier: 1.5
  });
  const insights = deriveSalaryInsights(settings);
  const pay = calculateEntryPay({
    date: "2026-05-08",
    recordMode: "hours",
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 2,
    totalHours: 10
  }, settings);
  assert.equal(insights.baseHourlyRate, 50);
  assert.equal(insights.baseOvertimeRate, 50);
  assert.equal(insights.isDerived.baseHourlyRate, true);
  assert.equal(insights.isDerived.baseOvertimeRate, true);
  assert.equal(pay.overtimePay, 150);
});

test("comprehensive mode pays excess hours and holiday hours as overtime", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.COMPREHENSIVE,
    comprehensiveHourlyRate: 40,
    comprehensiveTargetHours: 10,
    comprehensiveOvertimeMultiplier: 1.5,
    holidayMultiplier: 3
  });
  const payroll = calculateMonthlyPayroll([
    { date: "2026-05-01", recordMode: "hours", dayType: "workday", totalHours: 12, regularHours: 12, overtimeHours: 0 },
    { date: "2026-05-02", recordMode: "hours", dayType: "holiday", totalHours: 2, regularHours: 0, overtimeHours: 2 }
  ], [], settings, 2026, 4);
  assert.equal(payroll.regularHours, 10);
  assert.equal(payroll.overtimeHours, 4);
  assert.equal(payroll.regularPay, 400);
  assert.equal(payroll.overtimePay, 360);
});

test("hourly mode pays regular hours and overtime premium by legal day type", () => {
  const settings = mergeSettings({ salaryMode: SALARY_MODES.HOURLY, hourlyRate: 32 });
  const pay = calculateEntryPay({
    date: "2026-05-03",
    recordMode: "hours",
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 2,
    totalHours: 10
  }, settings);
  assert.equal(pay.regularPay, 256);
  assert.equal(pay.overtimePay, 96);
  assert.equal(pay.totalPay, 352);

  const restDayPay = calculateEntryPay({
    date: "2026-05-03",
    recordMode: "hours",
    dayType: "restday",
    totalHours: 6
  }, settings);
  assert.equal(restDayPay.regularPay, 0);
  assert.equal(restDayPay.overtimePay, 384);
  assert.equal(restDayPay.totalPay, 384);
});

test("configured overtime multipliers cannot drop below legal minimums", () => {
  const settings = mergeSettings({
    overtimeMultiplier: 1,
    restDayMultiplier: 1,
    holidayMultiplier: 1
  });
  assert.equal(overtimeMultiplierForDay("workday", settings), LEGAL_RULES.workdayOvertimeMultiplier);
  assert.equal(overtimeMultiplierForDay("restday", settings), LEGAL_RULES.restDayOvertimeMultiplier);
  assert.equal(overtimeMultiplierForDay("holiday", settings), LEGAL_RULES.holidayOvertimeMultiplier);
});

test("comprehensive mode derives hourly rate from monthly wage and uses legal overtime premium", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.COMPREHENSIVE,
    baseSalary: 8700,
    standardMonthlyHours: LEGAL_RULES.wageHourlyDivisor,
    comprehensiveHourlyRate: 0,
    comprehensiveTargetHours: 10,
    comprehensiveOvertimeMultiplier: 1
  });
  const payroll = calculateMonthlyPayroll([
    { date: "2026-05-01", recordMode: "hours", dayType: "workday", totalHours: 12 },
    { date: "2026-05-02", recordMode: "hours", dayType: "holiday", totalHours: 2 }
  ], [], settings, 2026, 4);
  assert.equal(deriveSalaryInsights(settings).rates.comprehensiveHourlyRate, 50);
  assert.equal(payroll.regularPay, 500);
  assert.equal(payroll.overtimePay, 450);
});

test("manual hour records use regular plus overtime as the source of truth", () => {
  const entry = normalizeEntry({
    date: "2026-05-04",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 2,
    totalHours: 200
  });
  assert.equal(entry.totalHours, 10);
  assert.equal(entry.overtimeHours, 2);
});

test("entry validation rejects unrealistic hours and invalid time ranges", () => {
  const tooLarge = validateEntry({
    date: "2026-05-04",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 0,
    overtimeHours: 200,
    totalHours: 200
  });
  assert.equal(tooLarge.valid, false);
  assert.match(tooLarge.errors.join(" "), /单条记录不能超过/);
  assert.match(tooLarge.errors.join(" "), /单条加班不能超过/);

  const sameTime = validateEntry({
    date: "2026-05-04",
    recordMode: RECORD_MODES.TIME,
    dayType: "workday",
    startTime: "09:00",
    endTime: "09:00",
    breakMinutes: 0
  });
  assert.equal(sameTime.valid, false);
  assert.match(sameTime.errors.join(" "), /上下班时间不能相同/);
});

test("entry validation checks daily aggregate limits", () => {
  const result = validateEntry({
    id: "new",
    date: "2026-05-05",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 0,
    overtimeHours: 4,
    totalHours: 4
  }, mergeSettings(), [
    {
      id: "existing",
      date: "2026-05-05",
      recordMode: RECORD_MODES.HOURS,
      dayType: "workday",
      regularHours: 8,
      overtimeHours: WORK_LIMITS.maxDayHours - 8,
      totalHours: WORK_LIMITS.maxDayHours
    }
  ]);

  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /当天合计不能超过/);
});

test("entry validation and compliance summary warn when overtime exceeds legal guardrails", () => {
  const settings = mergeSettings();
  const warning = validateEntry({
    id: "new",
    date: "2026-05-06",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 4,
    totalHours: 12
  }, settings);
  assert.equal(warning.valid, true);
  assert.match(warning.warnings.join(" "), /超过 3 小时/);

  const summary = calculateComplianceSummary(Array.from({ length: 10 }, (_, index) => ({
    date: `2026-05-${String(index + 1).padStart(2, "0")}`,
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 4,
    totalHours: 12
  })), settings, 2026, 4);
  assert.equal(summary.monthlyOvertimeHours, 40);
  assert.match(summary.warnings.join(" "), /超过 36h/);
  assert.equal(summary.dailyHardOvertimeDays.length, 10);
});

test("buildEntryFromShiftPreset supports defaults, rest days, and overnight shifts", () => {
  const entry = buildEntryFromShiftPreset("2026-05-09", {
    dayType: "restday",
    startTime: "22:00",
    endTime: "06:00",
    breakMinutes: 30
  }, {
    note: "night support"
  });
  assert.deepEqual(entry, {
    date: "2026-05-09",
    recordMode: "time",
    dayType: "restday",
    startTime: "22:00",
    endTime: "06:00",
    breakMinutes: 30,
    regularHours: 0,
    overtimeHours: 7.5,
    totalHours: 7.5,
    target: "",
    note: "night support"
  });
});

test("shift presets infer rest days from workweek when preset is a normal workday", () => {
  const entry = buildEntryFromShiftPreset("2026-05-10", {
    id: "day",
    name: "白班",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60
  }, {
    settings: mergeSettings({ workweek: [1, 2, 3, 4, 5] })
  });
  assert.equal(entry.dayType, "restday");
  assert.equal(entry.regularHours, 0);
  assert.equal(entry.overtimeHours, 8);
});

test("state council holiday schedule overrides weekends and workweek", () => {
  const settings = mergeSettings({ workweek: [1, 2, 3, 4, 5] });

  assert.equal(getHolidayInfo("2026-10-01").name, "国庆节");
  assert.equal(inferDayType("2026-10-01", settings), "holiday");
  assert.equal(inferDayType("2026-10-04", settings), "restday");
  assert.equal(inferDayType("2026-10-10", settings), "workday");
  assert.equal(isWorkday("2026-10-10", settings), true);
  assert.equal(isWorkday("2026-10-04", settings), false);
  assert.equal(mergeSettings({
    shiftPresets: [{ id: "rest", name: "休息日加班" }]
  }).shiftPresets[0].dayType, "restday");
});

test("holiday inferred shift entries use legal holiday overtime pay", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.HOURLY,
    hourlyRate: 30,
    workweek: [1, 2, 3, 4, 5]
  });
  const entry = buildEntryFromShiftPreset("2026-05-01", {
    id: "day",
    name: "白班",
    startTime: "09:00",
    endTime: "18:00",
    breakMinutes: 60
  }, { settings });

  assert.equal(entry.dayType, "holiday");
  assert.equal(entry.regularHours, 0);
  assert.equal(entry.overtimeHours, 8);
  assert.equal(calculateEntryPay(entry, settings).totalPay, 720);
});

test("salary insights report missing configuration prompts", () => {
  const insights = deriveSalaryInsights({
    salaryMode: SALARY_MODES.REGULAR_OVERTIME,
    baseSalary: 0,
    standardMonthlyHours: 0,
    regularHourlyRate: 0
  });
  assert.deepEqual(insights.missingConfig, [
    "baseSalary",
    "standardMonthlyHours",
    "regularHourlyRate"
  ]);
  assert.deepEqual(insights.prompts, [
    "missing:baseSalary",
    "missing:standardMonthlyHours",
    "missing:regularHourlyRate"
  ]);
});

test("allowances and deductions affect monthly gross", () => {
  const settings = mergeSettings({ salaryMode: SALARY_MODES.HOURLY, hourlyRate: 10 });
  const payroll = calculateMonthlyPayroll([
    { date: "2026-05-01", recordMode: "hours", dayType: "workday", totalHours: 8 }
  ], [
    { date: "2026-05-02", type: "allowance", amount: 100 },
    { date: "2026-05-03", type: "deduction", amount: 20 }
  ], settings, 2026, 4);
  assert.equal(payroll.grossBeforeTax, 160);
});

test("annual tax bracket boundaries and cumulative monthly tax", () => {
  assert.equal(calculateAnnualTax(36000).tax, 1080);
  assert.equal(calculateAnnualTax(36001).tax, 1080.1);
  assert.equal(calculateAnnualTax(144000).tax, 11880);

  const settings = mergeSettings({
    tax: {
      standardDeductionMonthly: 5000,
      fixedDeductionMonthly: 0,
      specialAdditionalDeductionMonthly: 0,
      deductionPercent: 0,
      socialSecurityFixedMonthly: 0,
      socialSecurityPercent: 0
    }
  });
  const tax = calculateCumulativeTaxForMonth([10000, 10000], settings, 1);
  assert.equal(tax.taxableIncome, 10000);
  assert.equal(tax.cumulativeTax, 300);
  assert.equal(tax.currentTax, 150);
});

test("calendar builder returns full weeks", () => {
  const days = buildCalendarDays(2026, 4);
  assert.equal(days.length % 7, 0);
  assert.equal(days.some((day) => day.date === "2026-05-01" && day.inMonth), true);
  assert.equal(days.some((day) => day.date === "2026-06-01" && !day.inMonth), true);
  assert.equal(days.find((day) => day.date === "2026-05-01").holiday.dayType, "holiday");
});

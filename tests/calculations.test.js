import test from "node:test";
import assert from "node:assert/strict";
import {
  LEGAL_RULES,
  RECORD_MODES,
  REST_CYCLE_MODES,
  SALARY_MODES,
  WORK_LIMITS,
  calculateAnnualTax,
  calculateCumulativeTaxForMonth,
  calculateEntryPay,
  calculateComplianceSummary,
  calculateMonthlyPayroll,
  calculateRestReminder,
  calculateTimeHours,
  buildCalendarDays,
  buildEntryFromShiftPreset,
  getHolidayInfo,
  getUnloggedDays,
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

test("configured overtime multipliers can follow custom payroll rules", () => {
  const settings = mergeSettings({
    overtimeMultiplier: 1,
    restDayMultiplier: 1,
    holidayMultiplier: 1
  });
  assert.equal(overtimeMultiplierForDay("workday", settings), 1);
  assert.equal(overtimeMultiplierForDay("restday", settings), 1);
  assert.equal(overtimeMultiplierForDay("holiday", settings), 1);
});

test("comprehensive mode derives hourly rate from monthly wage and uses configured overtime premium", () => {
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
  assert.equal(payroll.overtimePay, 400);
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

test("entry validation allows rest and leave markers without work hours", () => {
  const rest = validateEntry({
    date: "2026-05-10",
    recordMode: RECORD_MODES.HOURS,
    dayType: "restday",
    regularHours: 0,
    overtimeHours: 0,
    totalHours: 0,
    source: "rest-day",
    note: "休息"
  });
  assert.equal(rest.valid, true);
  assert.equal(calculateEntryPay(rest.normalized).totalPay, 0);

  const leave = validateEntry({
    date: "2026-05-11",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 0,
    overtimeHours: 0,
    totalHours: 0,
    source: "leave-note",
    leavePayMode: "paid",
    leavePayMultiplier: 1,
    leaveHours: 8,
    note: "年假"
  });
  assert.equal(leave.valid, true);
  assert.equal(calculateEntryPay(leave.normalized, mergeSettings({ regularHourlyRate: 50 })).totalPay, 400);
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

test("entry validation keeps data limits without legal warning prompts", () => {
  const settings = mergeSettings();
  const result = validateEntry({
    id: "new",
    date: "2026-05-06",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 4,
    totalHours: 12
  }, settings);
  assert.equal(result.valid, true);
  assert.deepEqual(result.warnings, []);

  const summary = calculateComplianceSummary(Array.from({ length: 10 }, (_, index) => ({
    date: `2026-05-${String(index + 1).padStart(2, "0")}`,
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 4,
    totalHours: 12
  })), settings, 2026, 4);
  assert.equal(summary.monthlyOvertimeHours, 40);
  assert.deepEqual(summary.warnings, []);
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
      otherDeductionMode: "fixed",
      fixedDeductionMonthly: 0,
      specialAdditionalDeductionMonthly: 0,
      deductionPercent: 0,
      socialSecurityMode: "fixed",
      socialSecurityFixedMonthly: 0,
      socialSecurityPercent: 0
    }
  });
  const tax = calculateCumulativeTaxForMonth([10000, 10000], settings, 1);
  assert.equal(tax.taxableIncome, 10000);
  assert.equal(tax.cumulativeTax, 300);
  assert.equal(tax.currentTax, 150);

  const percentTax = calculateCumulativeTaxForMonth([10000], mergeSettings({
    tax: {
      standardDeductionMonthly: 5000,
      specialAdditionalDeductionMonthly: 0,
      otherDeductionMode: "percent",
      deductionPercent: 10,
      socialSecurityMode: "percent",
      socialSecurityPercent: 5
    }
  }), 0);
  assert.equal(percentTax.taxableIncome, 3500);
  assert.equal(percentTax.currentTax, 105);
});

test("calendar builder starts weeks on Monday and returns full weeks", () => {
  const days = buildCalendarDays(2026, 4);
  assert.equal(days.length % 7, 0);
  assert.equal(new Date(`${days[0].date}T00:00:00`).getDay(), 1);
  assert.equal(days.some((day) => day.date === "2026-05-01" && day.inMonth), true);
  assert.equal(days.some((day) => day.date === "2026-04-27" && !day.inMonth), true);
  assert.equal(days.find((day) => day.date === "2026-05-01").holiday.dayType, "holiday");
});

test("rest reminders support non-weekend shift cycles", () => {
  const settings = mergeSettings({
    restCycle: {
      mode: REST_CYCLE_MODES.WORK_6_REST_1,
      lastRestDate: "2026-05-01"
    }
  });
  const beforeRest = calculateRestReminder("2026-05-06", settings);
  assert.equal(beforeRest.isRestDue, false);
  assert.equal(beforeRest.daysUntilRest, 2);
  assert.equal(beforeRest.nextRestDate, "2026-05-08");

  const restDay = calculateRestReminder("2026-05-08", settings);
  assert.equal(restDay.isRestDue, true);
  assert.equal(restDay.daysUntilRest, 0);
});

test("leave pay calculations for different leave types", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.REGULAR_OVERTIME,
    regularHourlyRate: 50
  });

  // Annual leave - full pay
  const annualLeave = calculateEntryPay({
    date: "2026-05-07",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 0,
    overtimeHours: 0,
    totalHours: 0,
    source: "leave-note",
    leaveType: "annual",
    leavePayMode: "paid",
    leavePayMultiplier: 1,
    leaveHours: 8
  }, settings);
  assert.equal(annualLeave.totalPay, 400);

  // Personal leave - unpaid
  const personalLeave = calculateEntryPay({
    date: "2026-05-08",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 0,
    overtimeHours: 0,
    totalHours: 0,
    source: "leave-note",
    leaveType: "personal",
    leavePayMode: "unpaid",
    leavePayMultiplier: 0,
    leaveHours: 8
  }, settings);
  assert.equal(personalLeave.totalPay, 0);

  // Sick leave - 80% pay
  const sickLeave = calculateEntryPay({
    date: "2026-05-09",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 0,
    overtimeHours: 0,
    totalHours: 0,
    source: "leave-note",
    leaveType: "sick",
    leavePayMode: "custom",
    leavePayMultiplier: 0.8,
    leaveHours: 8
  }, settings);
  assert.equal(sickLeave.totalPay, 320);

  // Half day leave
  const halfDayLeave = calculateEntryPay({
    date: "2026-05-10",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 0,
    overtimeHours: 0,
    totalHours: 0,
    source: "leave-note",
    leaveType: "annual",
    leavePayMode: "paid",
    leavePayMultiplier: 1,
    leaveHours: 4
  }, settings);
  assert.equal(halfDayLeave.totalPay, 200);
});

test("monthly payroll with mixed work and leave entries", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.REGULAR_OVERTIME,
    regularHourlyRate: 40,
    overtimeMultiplier: 1.5,
    restDayMultiplier: 2
  });

  const entries = [
    // Normal workday - 10 hours
    { date: "2026-05-04", recordMode: RECORD_MODES.HOURS, dayType: "workday", regularHours: 8, overtimeHours: 2, totalHours: 10 },
    // Rest day work - 6 hours
    { date: "2026-05-03", recordMode: RECORD_MODES.HOURS, dayType: "restday", regularHours: 0, overtimeHours: 6, totalHours: 6 },
    // Annual leave - full day
    { date: "2026-05-05", recordMode: RECORD_MODES.HOURS, dayType: "workday", regularHours: 0, overtimeHours: 0, totalHours: 0, source: "leave-note", leavePayMode: "paid", leavePayMultiplier: 1, leaveHours: 8 },
    // Personal leave - unpaid
    { date: "2026-05-06", recordMode: RECORD_MODES.HOURS, dayType: "workday", regularHours: 0, overtimeHours: 0, totalHours: 0, source: "leave-note", leavePayMode: "unpaid", leavePayMultiplier: 0, leaveHours: 8 }
  ];

  const payroll = calculateMonthlyPayroll(entries, [], settings, 2026, 4);
  // Day 1: 8*40 + 2*40*1.5 = 320 + 120 = 440
  // Day 2: 6*40*2 = 480
  // Day 3: 8*40 = 320 (annual leave at regular rate)
  // Day 4: 0
  assert.equal(payroll.regularPay, 640); // 320 (workday) + 320 (leave)
  assert.equal(payroll.overtimePay, 600); // 120 (workday OT) + 480 (restday)
  assert.equal(payroll.grossBeforeTax, 1240);
});

test("overtime edge cases - maximum legal overtime", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.REGULAR_OVERTIME,
    regularHourlyRate: 30,
    overtimeMultiplier: 1.5,
    restDayMultiplier: 2,
    holidayMultiplier: 3
  });

  // Workday with max overtime (3 hours legal limit, but we allow up to 12 in validation)
  const maxOvertime = calculateEntryPay({
    date: "2026-05-06",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 4,
    totalHours: 12
  }, settings);
  assert.equal(maxOvertime.regularPay, 240);
  assert.equal(maxOvertime.overtimePay, 180);
  assert.equal(maxOvertime.totalPay, 420);

  // Holiday work - all overtime at 3x
  const holidayWork = calculateEntryPay({
    date: "2026-05-01",
    recordMode: RECORD_MODES.HOURS,
    dayType: "holiday",
    regularHours: 0,
    overtimeHours: 8,
    totalHours: 8
  }, settings);
  assert.equal(holidayWork.regularPay, 0);
  assert.equal(holidayWork.overtimePay, 720);
  assert.equal(holidayWork.totalPay, 720);
});

test("tax calculation with percent-based deductions", () => {
  const settings = mergeSettings({
    tax: {
      standardDeductionMonthly: 5000,
      otherDeductionMode: "percent",
      deductionPercent: 10,
      socialSecurityMode: "percent",
      socialSecurityPercent: 5,
      specialAdditionalDeductionMonthly: 1000
    }
  });

  // Monthly income 15000
  // Taxable = 15000 - 5000 - 1500 (10%) - 750 (5%) - 1000 = 6750
  const tax = calculateCumulativeTaxForMonth([15000], settings, 0);
  assert.equal(tax.taxableIncome, 6750);
  assert.equal(tax.currentTax, 202.5); // 6750 * 0.03
});

test("comprehensive mode with multiple months", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.COMPREHENSIVE,
    comprehensiveHourlyRate: 35,
    comprehensiveTargetHours: 160,
    comprehensiveOvertimeMultiplier: 1.5,
    holidayMultiplier: 3
  });

  // Month 1: 170 hours (10 overtime)
  const month1 = calculateMonthlyPayroll([
    { date: "2026-01-15", recordMode: RECORD_MODES.HOURS, dayType: "workday", regularHours: 160, overtimeHours: 10, totalHours: 170 }
  ], [], settings, 2026, 0);
  assert.equal(month1.regularPay, 5600); // 160 * 35
  assert.equal(month1.overtimePay, 525); // 10 * 35 * 1.5

  // Month 2: 150 hours (under target)
  const month2 = calculateMonthlyPayroll([
    { date: "2026-02-15", recordMode: RECORD_MODES.HOURS, dayType: "workday", regularHours: 150, overtimeHours: 0, totalHours: 150 }
  ], [], settings, 2026, 1);
  assert.equal(month2.regularPay, 5250); // 150 * 35
  assert.equal(month2.overtimePay, 0);
});

test("hourly mode with mixed day types", () => {
  const settings = mergeSettings({
    salaryMode: SALARY_MODES.HOURLY,
    hourlyRate: 25,
    overtimeMultiplier: 1.5,
    restDayMultiplier: 2,
    holidayMultiplier: 3
  });

  // Workday - regular hours
  const workday = calculateEntryPay({
    date: "2026-05-06",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 0,
    totalHours: 8
  }, settings);
  assert.equal(workday.regularPay, 200);
  assert.equal(workday.overtimePay, 0);

  // Workday - with overtime
  const workdayOT = calculateEntryPay({
    date: "2026-05-07",
    recordMode: RECORD_MODES.HOURS,
    dayType: "workday",
    regularHours: 8,
    overtimeHours: 2,
    totalHours: 10
  }, settings);
  assert.equal(workdayOT.regularPay, 200);
  assert.equal(workdayOT.overtimePay, 75); // 2 * 25 * 1.5

  // Rest day - all overtime at 2x
  const restday = calculateEntryPay({
    date: "2026-05-03",
    recordMode: RECORD_MODES.HOURS,
    dayType: "restday",
    regularHours: 0,
    overtimeHours: 6,
    totalHours: 6
  }, settings);
  assert.equal(restday.regularPay, 0);
  assert.equal(restday.overtimePay, 300); // 6 * 25 * 2
});

test("getUnloggedDays finds workdays missing entries up to today", () => {
  const settings = mergeSettings({ workweek: [0, 6], autoDayType: true });
  // 2026-05-04 is Monday, 05-05 Tuesday, 05-06 Wednesday — all workdays
  const entries = [
    { date: "2026-05-04", recordMode: RECORD_MODES.HOURS, totalHours: 8 }
  ];
  const unlogged = getUnloggedDays(2026, 4, entries, settings);
  // Should include 05-05 and 05-06 (workdays without entries, if today >= those dates)
  // Should not include 05-03 (Sunday = restday) or 05-04 (has entry)
  assert.ok(!unlogged.includes("2026-05-03"), "restday excluded");
  assert.ok(!unlogged.includes("2026-05-04"), "day with entry excluded");
  // Only past/today dates are included — future dates are excluded
  const today = new Date().toISOString().slice(0, 10);
  for (const date of unlogged) {
    assert.ok(date <= today, `date ${date} should be <= today`);
  }
});

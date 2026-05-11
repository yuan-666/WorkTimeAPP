import { dateStamp, downloadBlob } from "./storage.js";
import { calculateEntryPay, normalizeEntry, summarizeYear } from "./calculations.js";

const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function exportYearCsv(entries, adjustments, settings, year) {
  const rows = [
    ["年度汇总"],
    ...buildYearRows(entries, adjustments, settings, year),
    [],
    ["每日明细"],
    ...buildDailyRows(entries, adjustments, settings, year)
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `工时报表_${year}_${dateStamp()}.csv`);
}

export function exportYearExcel(entries, adjustments, settings, year) {
  const summaryRows = buildYearRows(entries, adjustments, settings, year);
  const dailyRows = buildDailyRows(entries, adjustments, settings, year);
  const summaryHtml = renderTable(summaryRows);
  const dailyHtml = renderTable(dailyRows);
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
body{font-family:Arial,"Microsoft YaHei",sans-serif;color:#16201d}
table{border-collapse:collapse;margin:0 0 24px}
caption{font-size:18px;font-weight:700;text-align:left;margin:12px 0}
th,td{border:1px solid #ccd3df;padding:8px 10px;text-align:right}
th:first-child,td:first-child{text-align:left}
th{background:#eef3f8}
</style></head><body><table><caption>年度汇总</caption>${summaryHtml}</table><table><caption>每日明细</caption>${dailyHtml}</table></body></html>`;
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, `工时报表_${year}_${dateStamp()}.xls`);
}

function renderTable(rows) {
  return rows.map((row, index) => {
    const tag = index === 0 ? "th" : "td";
    return `<tr>${row.map((cell) => `<${tag}>${escapeHtml(String(cell))}</${tag}>`).join("")}</tr>`;
  }).join("");
}

export async function shareYearReport(entries, adjustments, settings, year) {
  const summary = summarizeYear(entries, adjustments, settings, year);
  const totalIncome = summary.reduce((sum, item) => sum + item.netIncome, 0).toFixed(2);
  const totalHours = summary.reduce((sum, item) => sum + item.totalHours, 0).toFixed(2);
  const text = `${year} 年工时 ${totalHours} 小时，税后收入 ${totalIncome} 元。`;
  if (navigator.share) {
    await navigator.share({ title: `${year} 年工时报表`, text });
    return true;
  }
  await navigator.clipboard?.writeText(text);
  return false;
}

function buildYearRows(entries, adjustments, settings, year) {
  const summary = summarizeYear(entries, adjustments, settings, year);
  return [
    ["月份", "出勤天数", "总工时", "正班工时", "加班工时", "底薪", "正班工资", "加班工资", "补贴", "扣款", "税前合计", "本月个税", "税后收入"],
    ...summary.map((item) => [
      MONTH_NAMES[item.monthIndex],
      item.attendanceDays,
      item.totalHours,
      item.regularHours,
      item.overtimeHours,
      item.basePay,
      item.regularPay,
      item.overtimePay,
      item.allowances,
      item.deductions,
      item.grossBeforeTax,
      item.tax.currentTax,
      item.netIncome
    ])
  ];
}

function buildDailyRows(entries, adjustments, settings, year) {
  const adjustmentByDate = new Map();
  for (const adjustment of adjustments.filter((item) => String(item.date || "").startsWith(`${year}-`))) {
    if (!adjustmentByDate.has(adjustment.date)) adjustmentByDate.set(adjustment.date, []);
    adjustmentByDate.get(adjustment.date).push(adjustment);
  }
  const rows = entries
    .filter((entry) => String(entry.date || "").startsWith(`${year}-`))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((entry) => {
      const normalized = normalizeEntry(entry, settings);
      const pay = calculateEntryPay(entry, settings);
      const dayAdjustments = adjustmentByDate.get(entry.date) || [];
      const allowances = dayAdjustments
        .filter((item) => item.type !== "deduction")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const deductions = dayAdjustments
        .filter((item) => item.type === "deduction")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return [
        entry.date,
        normalized.dayType,
        normalized.recordMode,
        entry.startTime || "",
        entry.endTime || "",
        entry.breakMinutes || 0,
        normalized.totalHours,
        normalized.regularHours,
        normalized.overtimeHours,
        pay.regularPay,
        pay.overtimePay,
        allowances,
        deductions,
        entry.target || "",
        entry.note || ""
      ];
    });
  return [
    ["日期", "日期类型", "记录方式", "上班", "下班", "休息分钟", "总工时", "正班工时", "加班工时", "正班工资", "加班工资", "补贴", "扣款", "目标", "备注"],
    ...rows
  ];
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

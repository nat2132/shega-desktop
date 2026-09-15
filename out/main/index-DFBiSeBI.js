"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const index = require("./index.js");
const PLANS = [
  { key: "mobile-1", label: "1 Device · any platform", maxMobile: 1, maxDesktop: 1, maxDevices: 1 },
  { key: "mobile-many", label: "5 Devices · any platform", maxMobile: 5, maxDesktop: 5, maxDevices: 5 },
  { key: "mobile-desktop", label: "2 Devices · any platform", maxMobile: 2, maxDesktop: 2, maxDevices: 2 },
  { key: "mobile-many-desktop", label: "10 Devices · any platform", maxMobile: 10, maxDesktop: 10, maxDevices: 10 },
  { key: "multi-device", label: "Unlimited Devices · any platform", maxMobile: 99, maxDesktop: 99, maxDevices: 99 }
];
function getDefaultPlan() {
  return PLANS[0];
}
function buildSaleId(businessCode, registerCode, date, seq) {
  return `${businessCode}-${registerCode}-${date}-${String(seq).padStart(6, "0")}`;
}
function getConflictStrategy(entity) {
  const IMMUTABLE_ENTITIES = /* @__PURE__ */ new Set([
    "sales",
    "debt_payments",
    "returns",
    "audit_logs"
  ]);
  if (IMMUTABLE_ENTITIES.has(entity)) return "immutable";
  const MOVEMENT_ENTITIES = /* @__PURE__ */ new Set([
    "stock_movements",
    "adjustments"
  ]);
  if (MOVEMENT_ENTITIES.has(entity)) return "movement-ledger";
  const VERSIONED_ENTITIES = /* @__PURE__ */ new Set([
    "items",
    "item_packs",
    "categories",
    "customers",
    "businesses",
    "locations",
    "registers",
    "business_roles",
    "users"
  ]);
  if (VERSIONED_ENTITIES.has(entity)) return "version-detect";
  return "lww";
}
function getSyncStrategy(net) {
  if (net.hasLan && net.hasInternet) return "lan";
  if (net.hasLan) return "lan";
  if (net.hasInternet && net.cloudConfigured) return "cloud";
  return "offline";
}
const TAX_RULES = [
  { kind: "VAT", name: "Value Added Tax", rate: 0.15, appliesTo: "sales", effectiveFrom: "2003-01-01", note: "Output VAT on taxable sales" },
  { kind: "TOT_2", name: "Turnover Tax 2%", rate: 0.02, appliesTo: "sales", effectiveFrom: "2003-01-01" },
  { kind: "TOT_10", name: "Turnover Tax 10%", rate: 0.1, appliesTo: "sales", effectiveFrom: "2003-01-01" },
  { kind: "WHT_DOMESTIC", name: "Withholding Tax 3% (domestic)", rate: 0.03, appliesTo: "payments", effectiveFrom: "2024-07-08" },
  { kind: "WHT_MISSING_TIN", name: "Withholding Tax when TIN missing", rate: 0.3, appliesTo: "payments", effectiveFrom: "2024-07-08", note: "Higher WHT when supplier TIN/license cannot be shown" },
  { kind: "VAT_WITHHOLDING", name: "Government VAT withholding (50%)", rate: 0.5, appliesTo: "payments", effectiveFrom: "2024-07-08", note: "Government entities withhold 50% of VAT on purchases" },
  { kind: "MAT", name: "Minimum Alternative Tax", rate: 0.025, appliesTo: "compliance", effectiveFrom: "2024-07-08" },
  { kind: "ADVANCE", name: "Quarterly advance income tax", rate: 0.25, appliesTo: "compliance", effectiveFrom: "2024-07-08" }
];
const CATEGORY_B_BRACKETS = [
  { floor: 0, rate: 0 },
  { floor: 7200, rate: 0.02 },
  { floor: 19800, rate: 0.04 },
  { floor: 38400, rate: 0.06 },
  { floor: 6e4, rate: 0.08 },
  { floor: 84e3, rate: 0.09 },
  { floor: 12e4, rate: 0.09 }
];
const PAYE_BRACKETS = [
  { floor: 0, rate: 0 },
  { floor: 600, rate: 0.1 },
  { floor: 1650, rate: 0.15 },
  { floor: 3200, rate: 0.2 },
  { floor: 5250, rate: 0.25 },
  { floor: 7800, rate: 0.3 },
  { floor: 10900, rate: 0.35 }
];
const PENSION_RATES = { employeeRate: 0.07, employerRate: 0.11, monthlyCap: 5e3 };
const COMPLIANCE_THRESHOLDS = {
  vatRegistrationTurnover: 1e6,
  buyerTinTurnover: 1e4,
  cashTransactionLimit: 5e4,
  matTurnover: 1e6
};
function rulesFor(date) {
  const d = date ?? /* @__PURE__ */ new Date();
  return TAX_RULES.filter((r) => {
    if (r.effectiveFrom && d < /* @__PURE__ */ new Date(`${r.effectiveFrom}T00:00:00`)) return false;
    if (r.effectiveTo && d >= /* @__PURE__ */ new Date(`${r.effectiveTo}T00:00:00`)) return false;
    return true;
  });
}
function rateFor(kind, date) {
  const rule = rulesFor(date).find((r) => r.kind === kind);
  return rule ? rule.rate : 0;
}
function ratePctFor(kind, date) {
  return Math.round(rateFor(kind, date) * 1e4) / 100;
}
function applyBrackets(income, brackets) {
  const sorted = [...brackets].sort((a, b) => a.floor - b.floor);
  let remaining = Math.max(0, income);
  let tax = 0;
  const breakdown = [];
  for (let i = 0; i < sorted.length; i++) {
    const from = sorted[i].floor;
    const to = i + 1 < sorted.length ? sorted[i + 1].floor : Infinity;
    if (remaining <= 0) break;
    const bandTop = Math.min(remaining, to - from);
    if (bandTop > 0) {
      const amount = bandTop * sorted[i].rate;
      tax += amount;
      breakdown.push({ rate: sorted[i].rate, amount, from, to });
      remaining -= bandTop;
    }
  }
  return { tax, breakdown };
}
function categoryBIncomeTax(annualIncome) {
  return applyBrackets(annualIncome, CATEGORY_B_BRACKETS);
}
function payeForMonth(grossMonthlySalary) {
  return applyBrackets(grossMonthlySalary, PAYE_BRACKETS);
}
function classifyTaxpayer(annualTurnover, vatRegistered) {
  const overThreshold = annualTurnover >= COMPLIANCE_THRESHOLDS.vatRegistrationTurnover;
  if (vatRegistered || overThreshold) return "A";
  return "B";
}
function taxpayerCategoryName(category) {
  return category === "A" ? "Category A" : "Category B";
}
function needsVatRegistration(annualTurnover) {
  return annualTurnover >= COMPLIANCE_THRESHOLDS.vatRegistrationTurnover;
}
const defaultTaxProfile = (businessName) => ({
  tin: "",
  businessName,
  authority: "Ministry of Revenues",
  category: "B",
  vatRegistered: false,
  vatNumber: "",
  licenseNumber: "",
  cashRegisterNumber: "",
  estimatedAnnualTurnover: 0,
  estimatedAnnualTax: 0,
  payrollActive: false,
  taxYearStartMonth: 1,
  taxYearStartDay: 1
});
function isoDate(year, month, day, clampToMonthEnd = false) {
  let y = year;
  let m = month;
  if (m > 12) {
    y += Math.floor((m - 1) / 12);
    m = (m - 1) % 12 + 1;
  }
  const last = new Date(y, m, 0).getDate();
  const d = clampToMonthEnd ? Math.min(day, last) : Math.min(Math.max(1, day), last);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
const periodForMonth = (year, month) => `${year}-${String(month).padStart(2, "0")}`;
const quarterLabel = (year, quarter) => `${year}-Q${quarter}`;
function advanceQuarterDates(year) {
  const lastDays = { 1: 31, 2: 30, 3: 30, 4: 31 };
  return [1, 2, 3, 4].map((q, i) => ({
    quarter: q,
    period: quarterLabel(year, q),
    dueDate: isoDate(year, 3 + i * 3, lastDays[q])
  }));
}
function buildTaxObligations(input, year) {
  const obligations = [];
  for (let m = 1; m <= 12; m++) {
    const period = periodForMonth(year, m);
    if (input.category === "A" && input.vatRegistered) {
      const following = new Date(year, m + 1, 0).getDate();
      obligations.push({
        id: `vat-${period}`,
        kind: "vat",
        period,
        label: `VAT return & payment - ${period}`,
        dueDate: isoDate(year, m + 1, following)
      });
    }
    obligations.push({
      id: `wht-${period}`,
      kind: "wht",
      period,
      label: `Withholding tax remittance - ${period}`,
      dueDate: isoDate(year, m + 1, 15)
    });
    if (input.payrollActive) {
      obligations.push({
        id: `paye-${period}`,
        kind: "paye",
        period,
        label: `PAYE (employee income tax) - ${period}`,
        dueDate: isoDate(year, m + 1, 15)
      });
      obligations.push({
        id: `pension-${period}`,
        kind: "pension",
        period,
        label: `Pension contribution remittance - ${period}`,
        dueDate: isoDate(year, m + 1, 15)
      });
    }
    if (input.category === "B") {
      obligations.push({
        id: `tot-${period}`,
        kind: "tot",
        period,
        label: `Turnover / gross-receipts tax - ${period}`,
        dueDate: isoDate(year, m + 1, 15)
      });
    }
  }
  if (input.category === "A") {
    for (const q of advanceQuarterDates(year)) {
      obligations.push({
        id: `advance-${q.period}`,
        kind: "advance",
        period: q.period,
        label: `Quarterly advance income tax (25%) - ${q.period}`,
        dueDate: q.dueDate
      });
    }
    obligations.push({
      id: `annual-${year}`,
      kind: "annual",
      period: String(year),
      label: `Annual income tax return & balance - ${year} tax year`,
      dueDate: isoDate(year + 1, 6, 30)
    });
  }
  return obligations.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
function nextDueObligations(input, fromDate, horizonDays = 45) {
  const obligations = buildTaxObligations(input, fromDate.getFullYear()).concat(buildTaxObligations(input, fromDate.getFullYear() + 1));
  const horizon = new Date(fromDate.getTime() + horizonDays * 24 * 60 * 60 * 1e3);
  return obligations.filter((o) => {
    const due = /* @__PURE__ */ new Date(`${o.dueDate}T00:00:00`);
    return due >= fromDate && due <= horizon;
  });
}
function obligationKindLabel(kind) {
  switch (kind) {
    case "vat":
      return "VAT";
    case "wht":
      return "Withholding tax";
    case "paye":
      return "PAYE";
    case "pension":
      return "Pension";
    case "tot":
      return "Turnover tax";
    case "advance":
      return "Advance income tax";
    case "annual":
      return "Annual income tax";
  }
}
function mergePaymentStatus(obligations, payments, now = /* @__PURE__ */ new Date()) {
  const paid = new Map(payments.map((p) => [p.obligationId, p]));
  return obligations.map((o) => {
    const p = paid.get(o.id);
    const due = /* @__PURE__ */ new Date(`${o.dueDate}T00:00:00`);
    const status = p ? "paid" : due < now ? "overdue" : "pending";
    return { ...o, status, paidAmount: p?.paidAmount, paidDate: p?.paidDate, reference: p?.reference };
  });
}
exports.APPEND_ONLY = index.APPEND_ONLY;
exports.BUILTIN_ROLES = index.BUILTIN_ROLES;
exports.BUSINESS_ADAPTER_ENTITIES = index.BUSINESS_ADAPTER_ENTITIES;
exports.COLLECTION_TABLE = index.COLLECTION_TABLE;
exports.DEFAULT_DISCOUNT_CAPS = index.DEFAULT_DISCOUNT_CAPS;
exports.DEFAULT_ICE_SERVERS = index.DEFAULT_ICE_SERVERS;
exports.DEFAULT_ROLE_SETS = index.DEFAULT_ROLE_SETS;
exports.DEVICE_JOIN_MSG = index.DEVICE_JOIN_MSG;
exports.DISCOUNT_APPROVED_MAX_PERCENT = index.DISCOUNT_APPROVED_MAX_PERCENT;
exports.DISCOUNT_OVERRIDE_CEILING = index.DISCOUNT_OVERRIDE_CEILING;
exports.FIELD_MAPS = index.FIELD_MAPS;
exports.MOR_CACHE_TTL_MS = index.MOR_CACHE_TTL_MS;
exports.OVERRIDE_REASONS = index.OVERRIDE_REASONS;
exports.PERIPHERAL_MSG = index.PERIPHERAL_MSG;
exports.PERMISSION_BY_KEY = index.PERMISSION_BY_KEY;
exports.PERMISSION_CATALOG = index.PERMISSION_CATALOG;
exports.RETURN_REASONS = index.RETURN_REASONS;
exports.ROLE_DESCRIPTION = index.ROLE_DESCRIPTION;
exports.ROLE_NAME = index.ROLE_NAME;
exports.ROLE_ORDER = index.ROLE_ORDER;
exports.SCOPE_LABELS = index.SCOPE_LABELS;
exports.SURFACED_BUILTIN_ROLES = index.SURFACED_BUILTIN_ROLES;
exports.VOID_REASONS = index.VOID_REASONS;
exports.YJS_COLLECTIONS = index.YJS_COLLECTIONS;
exports.applyUpdate = index.applyUpdate;
exports.barcodeModules = index.barcodeModules;
exports.barcodePng = index.barcodePng;
exports.barcodeRaster = index.barcodeRaster;
exports.buildClientCacheRecord = index.buildClientCacheRecord;
exports.can = index.can;
exports.checkPermission = index.checkPermission;
exports.createBusinessDoc = index.createBusinessDoc;
exports.describePermission = index.describePermission;
exports.desktopTableName = index.desktopTableName;
exports.desktopToMobileData = index.desktopToMobileData;
exports.desktopToMobilePayload = index.desktopToMobilePayload;
exports.detectPayloadPlatform = index.detectPayloadPlatform;
exports.detectSymbology = index.detectSymbology;
exports.encodeFullState = index.encodeFullState;
exports.exceedsDiscountCap = index.exceedsDiscountCap;
exports.fromMorBackendResponse = index.fromMorBackendResponse;
exports.getBuiltinRole = index.getBuiltinRole;
exports.getDiscountCap = index.getDiscountCap;
exports.getPermissionDef = index.getPermissionDef;
exports.getRoleName = index.getRoleName;
exports.isMorVerified = index.isMorVerified;
exports.isValidPermissionKey = index.isValidPermissionKey;
exports.isVerificationFresh = index.isVerificationFresh;
exports.isVerificationStale = index.isVerificationStale;
exports.isYjsCollection = index.isYjsCollection;
exports.mergePermissionSets = index.mergePermissionSets;
exports.mobileToDesktopData = index.mobileToDesktopData;
exports.mobileToDesktopPayload = index.mobileToDesktopPayload;
exports.morStatusLabel = index.morStatusLabel;
exports.normalizeSubTin = index.normalizeSubTin;
exports.normalizeTin = index.normalizeTin;
exports.normalizeToPlatform = index.normalizeToPlatform;
exports.permissionsForScope = index.permissionsForScope;
exports.reconcileToColumns = index.reconcileToColumns;
exports.requiresApproval = index.requiresApproval;
exports.upceToUpca = index.upceToUpca;
exports.verificationAgeLabel = index.verificationAgeLabel;
exports.CATEGORY_B_BRACKETS = CATEGORY_B_BRACKETS;
exports.COMPLIANCE_THRESHOLDS = COMPLIANCE_THRESHOLDS;
exports.PAYE_BRACKETS = PAYE_BRACKETS;
exports.PENSION_RATES = PENSION_RATES;
exports.PLANS = PLANS;
exports.TAX_RULES = TAX_RULES;
exports.advanceQuarterDates = advanceQuarterDates;
exports.applyBrackets = applyBrackets;
exports.buildSaleId = buildSaleId;
exports.buildTaxObligations = buildTaxObligations;
exports.categoryBIncomeTax = categoryBIncomeTax;
exports.classifyTaxpayer = classifyTaxpayer;
exports.defaultTaxProfile = defaultTaxProfile;
exports.getConflictStrategy = getConflictStrategy;
exports.getDefaultPlan = getDefaultPlan;
exports.getSyncStrategy = getSyncStrategy;
exports.mergePaymentStatus = mergePaymentStatus;
exports.needsVatRegistration = needsVatRegistration;
exports.nextDueObligations = nextDueObligations;
exports.obligationKindLabel = obligationKindLabel;
exports.payeForMonth = payeForMonth;
exports.periodForMonth = periodForMonth;
exports.quarterLabel = quarterLabel;
exports.rateFor = rateFor;
exports.ratePctFor = ratePctFor;
exports.rulesFor = rulesFor;
exports.taxpayerCategoryName = taxpayerCategoryName;

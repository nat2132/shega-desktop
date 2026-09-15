import { g as useSettings, ah as React, V as toEthiopianDate, j as jsxRuntimeExports, W as getEthiopianMonthName, bo as fromEthiopianDate } from "./index-wvHtiMql.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-iyCsL0f8.js";
function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}
function gregorianMonthName(language, m) {
  const loc = language === "am" ? "am-ET" : language === "om" ? "om-ET" : language === "ti" ? "ti-ET" : "en-US";
  return new Date(2e3, m - 1, 1).toLocaleDateString(loc, { month: "long" });
}
const DatePicker = ({ value, onChange, className = "", required, placeholder, min, max }) => {
  const { calendarType, language } = useSettings();
  const parsed = value ? new Date(value) : /* @__PURE__ */ new Date();
  const initial = !isNaN(parsed.getTime()) ? parsed : /* @__PURE__ */ new Date();
  const [gYear, setGYear] = React.useState(initial.getFullYear());
  const [gMonth, setGMonth] = React.useState(initial.getMonth() + 1);
  const [gDay, setGDay] = React.useState(initial.getDate());
  const etInit = toEthiopianDate(initial);
  const [etYear, setEtYear] = React.useState(etInit.year);
  const [etMonth, setEtMonth] = React.useState(etInit.month);
  const [etDay, setEtDay] = React.useState(etInit.day);
  React.useEffect(() => {
    const d = value ? new Date(value) : /* @__PURE__ */ new Date();
    if (isNaN(d.getTime())) return;
    setGYear(d.getFullYear());
    setGMonth(d.getMonth() + 1);
    setGDay(d.getDate());
    const e = toEthiopianDate(d);
    setEtYear(e.year);
    setEtMonth(e.month);
    setEtDay(e.day);
  }, [value]);
  if (calendarType === "gregorian") {
    const gDaysInMonth = new Date(gYear, gMonth, 0).getDate();
    const emitGregorian = (y, m, d) => {
      onChange(new Date(Date.UTC(y, m - 1, d)).toISOString().split("T")[0]);
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex gap-1 ${className}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(gDay), onValueChange: (v) => {
        const d = parseInt(v);
        setGDay(d);
        emitGregorian(gYear, gMonth, d);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-16 h-10 bg-card rounded-xl text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: pad(gDay) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: gDaysInMonth }, (_, i) => i + 1).map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(d), className: "rounded-lg", children: pad(d) }, d)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(gMonth), onValueChange: (v) => {
        const m = parseInt(v);
        setGMonth(m);
        emitGregorian(gYear, m, gDay);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "flex-1 h-10 bg-card rounded-xl text-xs font-bold min-w-[110px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: gregorianMonthName(language, gMonth) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: 12 }, (_, i) => i + 1).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(m), className: "rounded-lg", children: gregorianMonthName(language, m) }, m)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(gYear), onValueChange: (v) => {
        const y = parseInt(v);
        setGYear(y);
        emitGregorian(y, gMonth, gDay);
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-24 h-10 bg-card rounded-xl text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: String(gYear) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: 21 }, (_, i) => gYear - 10 + i).map((y) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(y), className: "rounded-lg", children: y }, y)) })
      ] })
    ] });
  }
  const year = value ? etYear : etInit.year;
  const month = value ? etMonth : etInit.month;
  const day = value ? etDay : etInit.day;
  const daysInMonth = month === 13 ? 6 : 30;
  const emitEthiopian = (y, m, d) => {
    const g = fromEthiopianDate(y, m, d);
    onChange(g.toISOString().split("T")[0]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex gap-1 ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(day), onValueChange: (v) => {
      const d = parseInt(v);
      setEtDay(d);
      emitEthiopian(etYear, etMonth, d);
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-16 h-10 bg-card rounded-xl text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: pad(day) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(d), className: "rounded-lg", children: pad(d) }, d)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(month), onValueChange: (v) => {
      const m = parseInt(v);
      setEtMonth(m);
      emitEthiopian(etYear, m, etDay);
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "flex-1 h-10 bg-card rounded-xl text-xs font-bold min-w-[80px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: getEthiopianMonthName(month - 1, language) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: 13 }, (_, i) => i + 1).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(m), className: "rounded-lg", children: getEthiopianMonthName(m - 1, language) }, m)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(year), onValueChange: (v) => {
      const y = parseInt(v);
      setEtYear(y);
      emitEthiopian(y, etMonth, etDay);
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-24 h-10 bg-card rounded-xl text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: String(year) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: 21 }, (_, i) => year - 10 + i).map((y) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(y), className: "rounded-lg", children: y }, y)) })
    ] })
  ] });
};
export {
  DatePicker as D
};

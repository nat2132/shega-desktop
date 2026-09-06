import { b as useSettings, j as jsxRuntimeExports, J as Input, t as toEthiopianDate, a2 as React, h as getEthiopianMonthName, bb as fromEthiopianDate } from "./index-BcwudWUj.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-BztXyn8Q.js";
function pad(n) {
  return n < 10 ? `0${n}` : `${n}`;
}
const DatePicker = ({ value, onChange, className = "", required, placeholder, min, max }) => {
  const { calendarType, language } = useSettings();
  if (calendarType === "gregorian") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Input,
      {
        type: "date",
        value,
        onChange: (e) => onChange(e.target.value),
        className,
        required,
        placeholder,
        min,
        max
      }
    );
  }
  const date = value ? new Date(value) : /* @__PURE__ */ new Date();
  const et = !isNaN(date.getTime()) ? toEthiopianDate(date) : toEthiopianDate(/* @__PURE__ */ new Date());
  const [etYear, setEtYear] = React.useState(et.year);
  const [etMonth, setEtMonth] = React.useState(et.month);
  const [etDay, setEtDay] = React.useState(et.day);
  React.useEffect(() => {
    const d = value ? new Date(value) : /* @__PURE__ */ new Date();
    if (isNaN(d.getTime())) return;
    const e = toEthiopianDate(d);
    setEtYear(e.year);
    setEtMonth(e.month);
    setEtDay(e.day);
  }, [value]);
  const emit = (y, m, d) => {
    const g = fromEthiopianDate(y, m, d);
    onChange(g.toISOString().split("T")[0]);
  };
  const year = value ? etYear : et.year;
  const month = value ? etMonth : et.month;
  const day = value ? etDay : et.day;
  const daysInMonth = month === 13 ? 6 : 30;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex gap-1 ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(day), onValueChange: (v) => {
      const d = parseInt(v);
      setEtDay(d);
      emit(etYear, etMonth, d);
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-16 h-10 bg-card rounded-xl text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: pad(day) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(d), className: "rounded-lg", children: pad(d) }, d)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(month), onValueChange: (v) => {
      const m = parseInt(v);
      setEtMonth(m);
      emit(etYear, m, etDay);
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "flex-1 h-10 bg-card rounded-xl text-xs font-bold min-w-[80px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: getEthiopianMonthName(month - 1, language) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: 13 }, (_, i) => i + 1).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(m), className: "rounded-lg", children: getEthiopianMonthName(m - 1, language) }, m)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: String(year), onValueChange: (v) => {
      const y = parseInt(v);
      setEtYear(y);
      emit(y, etMonth, etDay);
    }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-24 h-10 bg-card rounded-xl text-xs font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: String(year) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl max-h-48", children: Array.from({ length: 21 }, (_, i) => year - 10 + i).map((y) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(y), className: "rounded-lg", children: y }, y)) })
    ] })
  ] });
};
export {
  DatePicker as D
};

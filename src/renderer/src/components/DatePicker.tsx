import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { toEthiopianDate, fromEthiopianDate, getEthiopianMonthName } from '../utils/ethiopian-calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  min?: string;
  max?: string;
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

function gregorianMonthName(language: string, m: number) {
  const loc = language === 'am' ? 'am-ET' : language === 'om' ? 'om-ET' : language === 'ti' ? 'ti-ET' : 'en-US';
  return new Date(2000, m - 1, 1).toLocaleDateString(loc, { month: 'long' });
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '', required, placeholder, min, max }) => {
  const { calendarType, language } = useSettings();

  const parsed = value ? new Date(value) : new Date();
  const initial = !isNaN(parsed.getTime()) ? parsed : new Date();

  const [gYear, setGYear] = React.useState(initial.getFullYear());
  const [gMonth, setGMonth] = React.useState(initial.getMonth() + 1);
  const [gDay, setGDay] = React.useState(initial.getDate());

  const etInit = toEthiopianDate(initial);
  const [etYear, setEtYear] = React.useState(etInit.year);
  const [etMonth, setEtMonth] = React.useState(etInit.month);
  const [etDay, setEtDay] = React.useState(etInit.day);

  React.useEffect(() => {
    const d = value ? new Date(value) : new Date();
    if (isNaN(d.getTime())) return;
    setGYear(d.getFullYear());
    setGMonth(d.getMonth() + 1);
    setGDay(d.getDate());
    const e = toEthiopianDate(d);
    setEtYear(e.year);
    setEtMonth(e.month);
    setEtDay(e.day);
  }, [value]);

  if (calendarType === 'gregorian') {
    const gDaysInMonth = new Date(gYear, gMonth, 0).getDate();
    const emitGregorian = (y: number, m: number, d: number) => {
      onChange(new Date(Date.UTC(y, m - 1, d)).toISOString().split('T')[0]);
    };

    return (
      <div className={`flex gap-1 ${className}`}>
        <Select value={String(gDay)} onValueChange={v => { const d = parseInt(v); setGDay(d); emitGregorian(gYear, gMonth, d); }}>
          <SelectTrigger className="w-16 h-10 bg-card rounded-xl text-xs font-bold">
            <SelectValue placeholder={pad(gDay)} />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-48">
            {Array.from({ length: gDaysInMonth }, (_, i) => i + 1).map(d => (
              <SelectItem key={d} value={String(d)} className="rounded-lg">{pad(d)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(gMonth)} onValueChange={v => { const m = parseInt(v); setGMonth(m); emitGregorian(gYear, m, gDay); }}>
          <SelectTrigger className="flex-1 h-10 bg-card rounded-xl text-xs font-bold min-w-[110px]">
            <SelectValue placeholder={gregorianMonthName(language, gMonth)} />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-48">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <SelectItem key={m} value={String(m)} className="rounded-lg">{gregorianMonthName(language, m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(gYear)} onValueChange={v => { const y = parseInt(v); setGYear(y); emitGregorian(y, gMonth, gDay); }}>
          <SelectTrigger className="w-24 h-10 bg-card rounded-xl text-xs font-bold">
            <SelectValue placeholder={String(gYear)} />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-48">
            {Array.from({ length: 21 }, (_, i) => gYear - 10 + i).map(y => (
              <SelectItem key={y} value={String(y)} className="rounded-lg">{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const year = value ? etYear : etInit.year;
  const month = value ? etMonth : etInit.month;
  const day = value ? etDay : etInit.day;

  const daysInMonth = month === 13 ? 6 : 30;

  const emitEthiopian = (y: number, m: number, d: number) => {
    const g = fromEthiopianDate(y, m, d);
    onChange(g.toISOString().split('T')[0]);
  };

  return (
    <div className={`flex gap-1 ${className}`}>
      <Select value={String(day)} onValueChange={v => { const d = parseInt(v); setEtDay(d); emitEthiopian(etYear, etMonth, d); }}>
        <SelectTrigger className="w-16 h-10 bg-card rounded-xl text-xs font-bold">
          <SelectValue placeholder={pad(day)} />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-48">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
            <SelectItem key={d} value={String(d)} className="rounded-lg">{pad(d)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(month)} onValueChange={v => { const m = parseInt(v); setEtMonth(m); emitEthiopian(etYear, m, etDay); }}>
        <SelectTrigger className="flex-1 h-10 bg-card rounded-xl text-xs font-bold min-w-[80px]">
          <SelectValue placeholder={getEthiopianMonthName(month - 1, language as any)} />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-48">
          {Array.from({ length: 13 }, (_, i) => i + 1).map(m => (
            <SelectItem key={m} value={String(m)} className="rounded-lg">{getEthiopianMonthName(m - 1, language as any)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={v => { const y = parseInt(v); setEtYear(y); emitEthiopian(y, etMonth, etDay); }}>
        <SelectTrigger className="w-24 h-10 bg-card rounded-xl text-xs font-bold">
          <SelectValue placeholder={String(year)} />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-48">
          {Array.from({ length: 21 }, (_, i) => year - 10 + i).map(y => (
            <SelectItem key={y} value={String(y)} className="rounded-lg">{y}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
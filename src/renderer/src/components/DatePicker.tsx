import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { toEthiopianDate, fromEthiopianDate, getEthiopianMonthName } from '../utils/ethiopian-calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';

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

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, className = '', required, placeholder, min, max }) => {
  const { calendarType, language } = useSettings();

  if (calendarType === 'gregorian') {
    return (
      <Input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={className}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    );
  }

  const date = value ? new Date(value) : new Date();
  const et = !isNaN(date.getTime()) ? toEthiopianDate(date) : toEthiopianDate(new Date());
  const [etYear, setEtYear] = React.useState(et.year);
  const [etMonth, setEtMonth] = React.useState(et.month);
  const [etDay, setEtDay] = React.useState(et.day);

  React.useEffect(() => {
    const d = value ? new Date(value) : new Date();
    if (isNaN(d.getTime())) return;
    const e = toEthiopianDate(d);
    setEtYear(e.year);
    setEtMonth(e.month);
    setEtDay(e.day);
  }, [value]);

  const emit = (y: number, m: number, d: number) => {
    const g = fromEthiopianDate(y, m, d);
    onChange(g.toISOString().split('T')[0]);
  };

  const year = value ? etYear : et.year;
  const month = value ? etMonth : et.month;
  const day = value ? etDay : et.day;

  const daysInMonth = month === 13 ? 6 : 30;

  return (
    <div className={`flex gap-1 ${className}`}>
      <Select value={String(day)} onValueChange={v => { const d = parseInt(v); setEtDay(d); emit(etYear, etMonth, d); }}>
        <SelectTrigger className="w-16 h-10 bg-card rounded-xl text-xs font-bold">
          <SelectValue placeholder={pad(day)} />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-48">
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
            <SelectItem key={d} value={String(d)} className="rounded-lg">{pad(d)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(month)} onValueChange={v => { const m = parseInt(v); setEtMonth(m); emit(etYear, m, etDay); }}>
        <SelectTrigger className="flex-1 h-10 bg-card rounded-xl text-xs font-bold min-w-[80px]">
          <SelectValue placeholder={getEthiopianMonthName(month - 1, language as any)} />
        </SelectTrigger>
        <SelectContent className="rounded-xl max-h-48">
          {Array.from({ length: 13 }, (_, i) => i + 1).map(m => (
            <SelectItem key={m} value={String(m)} className="rounded-lg">{getEthiopianMonthName(m - 1, language as any)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={v => { const y = parseInt(v); setEtYear(y); emit(y, etMonth, etDay); }}>
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

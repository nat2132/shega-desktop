import React, { useMemo } from "react";
import { Bell, BellRing, CalendarDays, Wallet } from "lucide-react";
import { useSettings } from "../context/SettingsContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

interface ExpenseReminderModalProps {
  open: boolean;
  onClose: () => void;
  expense: {
    id: number;
    name: string;
    amount: number;
    category: string;
    frequency: string;
    nextBillingDate: string;
  } | null;
  onMarkPaid: () => void;
}

const getNextDate = (from: string, frequency: string): string => {
  const d = new Date(from);
  switch (frequency) {
    case "weekly":
      d.setDate(d.getDate() + 7);
      break;
    case "biweekly":
      d.setDate(d.getDate() + 14);
      break;
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString().split("T")[0];
};

const ExpenseReminderModal: React.FC<ExpenseReminderModalProps> = ({
  open,
  onClose,
  expense,
  onMarkPaid,
}) => {
  const { t, formatDate } = useSettings();

  const overdueDays = useMemo(() => {
    if (!expense) return 0;
    const due = new Date(expense.nextBillingDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor(
      (today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diff > 0 ? diff : 0;
  }, [expense]);

  const isOverdue = overdueDays > 0;

  const handleMarkPaid = async () => {
    if (!expense) return;
    try {
      await window.api.updateExpense(expense.id, { isRecurring: 0 });
      const newDate = getNextDate(expense.nextBillingDate, expense.frequency);
      await window.api.insertExpense({
        name: expense.name,
        amount: expense.amount,
        category: expense.category,
        date: new Date().toISOString().split("T")[0],
        isRecurring: 1,
        frequency: expense.frequency,
        nextBillingDate: newDate,
      });
      toast.success(
        t("expense_reminder.marked_paid") || "Expense marked as paid",
      );
      onMarkPaid();
    } catch {
      toast.error(
        t("expense_reminder.error") || "Failed to mark expense as paid",
      );
    }
  };

  if (!expense) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/50">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
              <BellRing className="h-5 w-5 text-amber-500" />
            </div>
            {isOverdue ? (
              <Badge
                variant="destructive"
                className="text-[9px] font-black uppercase tracking-widest"
              >
                {t("expense_reminder.overdue")}
              </Badge>
            ) : (
              <Badge
                variant="default"
                className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20"
              >
                {t("expense_reminder.due_today")}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg font-black uppercase tracking-widest">
            {expense.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("expense_reminder.amount")}
              </span>
            </div>
            <span className="text-lg font-black">
              ${expense.amount.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("expense_reminder.category")}
              </p>
              <p className="text-sm font-medium">{expense.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("expense_reminder.frequency")}
              </p>
              <p className="text-sm font-medium capitalize">
                {expense.frequency}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl border">
            <div className="flex items-center gap-2">
              <CalendarDays
                className={`h-4 w-4 ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}
              />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("expense_reminder.due_date")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {formatDate(expense.nextBillingDate)}
              </span>
              {isOverdue && (
                <Badge
                  variant="destructive"
                  className="text-[9px] font-black uppercase tracking-widest"
                >
                  {t("expense_reminder.overdue_by", { days: overdueDays })}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1"
          >
            <Bell className="h-3 w-3 mr-1" />
            {t("expense_reminder.snooze")}
          </Button>
          <Button
            size="sm"
            onClick={handleMarkPaid}
            className="rounded-xl text-[10px] font-black uppercase tracking-widest flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            {t("expense_reminder.mark_paid")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpenseReminderModal;

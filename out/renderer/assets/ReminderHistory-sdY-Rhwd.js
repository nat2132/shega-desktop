import { b as useSettings, r as reactExports, j as jsxRuntimeExports, e as Button, b6 as BellOff, B as Bell, g as Badge, h as Clock, y as Trash2, M as Modal, V as Input, _ as toast } from "./index-D0em7kRt.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-CXuVPKuV.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-D9ZBWN4s.js";
import { T as Textarea } from "./textarea-DCtXuZEG.js";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BPeeFIqV.js";
import { D as DatePicker } from "./DatePicker-Cwt8y7qq.js";
import { P as Plus } from "./plus-C617I_e3.js";
import { C as Calendar } from "./calendar-CJUwBmhR.js";
import { C as CircleCheckBig } from "./circle-check-big-Dl2I80yP.js";
const REMINDER_TYPES = ["once", "daily", "weekly", "monthly"];
const MOCK_REMINDERS = [
  { id: 1, title: "Stock Check", message: "Review low stock items", type: "weekly", status: "active", triggerAt: new Date(Date.now() + 864e5).toISOString(), lastTriggered: null, snoozedUntil: null },
  { id: 2, title: "Supplier Payment", message: "Pay ABC Supplies", type: "monthly", status: "active", triggerAt: new Date(Date.now() + 1728e5).toISOString(), lastTriggered: null, snoozedUntil: null },
  { id: 3, title: "Inventory Count", message: "End of month count", type: "monthly", status: "completed", triggerAt: new Date(Date.now() - 6048e5).toISOString(), lastTriggered: new Date(Date.now() - 6048e5).toISOString(), snoozedUntil: null }
];
const initialFormState = {
  title: "",
  message: "",
  type: "once",
  triggerDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
  triggerTime: "09:00"
};
const ReminderHistory = () => {
  const { t, formatDate } = useSettings();
  const [reminders, setReminders] = reactExports.useState([]);
  const [activeTab, setActiveTab] = reactExports.useState("active");
  const [showModal, setShowModal] = reactExports.useState(false);
  const [editingReminder, setEditingReminder] = reactExports.useState(null);
  const [deleteId, setDeleteId] = reactExports.useState(null);
  const [formData, setFormData] = reactExports.useState({ ...initialFormState });
  reactExports.useEffect(() => {
    loadReminders();
  }, []);
  const loadReminders = async () => {
    try {
      const data = await window.api?.getReminders();
      if (data && Array.isArray(data)) {
        const mapped = data.map((r) => ({
          id: r.id,
          title: r.title,
          message: r.message || "",
          type: r.repeatInterval || "once",
          status: r.status === "pending" ? "active" : r.status,
          triggerAt: r.triggerDate,
          lastTriggered: r.lastTriggeredAt || null,
          snoozedUntil: r.snoozedUntil || null
        }));
        setReminders(mapped);
      } else {
        setReminders(MOCK_REMINDERS);
      }
    } catch {
      setReminders(MOCK_REMINDERS);
    }
  };
  const filteredReminders = reminders.filter((r) => r.status === (activeTab === "all" ? r.status : activeTab));
  const resetForm = () => {
    setFormData({ ...initialFormState });
    setEditingReminder(null);
  };
  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    const triggerDate = `${formData.triggerDate}T${formData.triggerTime}:00`;
    const repeatInterval = formData.type === "once" ? null : formData.type;
    const payload = { title: formData.title.trim(), message: formData.message.trim(), repeatInterval, triggerDate };
    if (editingReminder) {
      try {
        await window.api?.updateReminder(editingReminder.id, payload);
        toast.success(t("reminders.reminder_updated"));
      } catch {
        toast.error(t("reminders.update_error"));
      }
    } else {
      try {
        await window.api?.createReminder(payload);
        toast.success(t("reminders.reminder_created"));
      } catch {
        toast.error(t("reminders.create_error"));
      }
    }
    setShowModal(false);
    resetForm();
    loadReminders();
  };
  const handleDelete = async (id) => {
    try {
      await window.api?.deleteReminder(id);
    } catch {
      console.log("deleteReminder", id);
    }
    setDeleteId(null);
    loadReminders();
  };
  const handleSnooze = async (id, hours) => {
    try {
      const untilIso = new Date(Date.now() + hours * 36e5).toISOString();
      await window.api?.snoozeReminder(id, untilIso);
      toast.success(t("reminders.snoozed_hours", { hours }));
    } catch {
      console.log("snoozeReminder", id, hours);
    }
    loadReminders();
  };
  const handleComplete = async (id) => {
    try {
      await window.api?.completeReminder(id);
    } catch {
      console.log("completeReminder", id);
    }
    loadReminders();
  };
  const getTypeLabel = (type) => {
    const keyMap = { once: "reminders.once", daily: "reminders.daily", weekly: "reminders.weekly", monthly: "reminders.monthly" };
    return t(keyMap[type]);
  };
  const getStatusBadge = (status) => {
    const config = {
      active: { label: t("reminders.status_active"), variant: "default" },
      completed: { label: t("reminders.status_completed"), variant: "secondary" },
      snoozed: { label: t("reminders.status_snoozed"), variant: "outline" }
    };
    const c = config[status];
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: c.variant, className: "uppercase text-xs font-bold", children: c.label });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-black tracking-tighter uppercase", children: t("reminders.title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-black uppercase tracking-widest mt-1", children: t("reminders.subtitle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openCreate, className: "h-11 px-5 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-2" }),
          t("reminders.new_reminder")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "mb-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "active", children: t("reminders.active") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "completed", children: t("reminders.completed") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "snoozed", children: t("reminders.snoozed") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: activeTab, className: "space-y-3 mt-0", children: filteredReminders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-20 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BellOff, { className: "h-8 w-8 text-muted-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-black uppercase tracking-widest text-muted-foreground", children: t("reminders.no_reminders") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-bold mt-1", children: t("reminders.create_first") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openCreate, variant: "outline", size: "sm", className: "mt-4 h-9 text-xs font-black uppercase tracking-widest rounded-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3 mr-1.5" }),
            t("reminders.new_reminder")
          ] })
        ] }) : filteredReminders.map((reminder) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5 rounded-2xl border bg-card hover:shadow-md transition-all", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-4 w-4 text-primary shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-black text-sm truncate", children: reminder.title })
            ] }),
            reminder.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-medium truncate mt-0.5", children: reminder.message }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 mt-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "uppercase text-xs font-bold", children: getTypeLabel(reminder.type) }),
              getStatusBadge(reminder.status)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground font-bold uppercase tracking-wider", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  t("reminders.trigger_at"),
                  ": ",
                  formatDate(reminder.triggerAt)
                ] })
              ] }),
              reminder.lastTriggered && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  t("reminders.last_triggered"),
                  ": ",
                  formatDate(reminder.lastTriggered)
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
            reminder.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative group/snooze", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0", title: t("reminders.snooze_1h"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 top-full mt-1 hidden group-hover/snooze:flex flex-col bg-popover border rounded-xl shadow-xl p-1 z-10 min-w-[100px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 justify-start text-xs font-black uppercase tracking-widest rounded-lg", onClick: () => handleSnooze(reminder.id, 1), children: t("reminders.snooze_1h") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 justify-start text-xs font-black uppercase tracking-widest rounded-lg", onClick: () => handleSnooze(reminder.id, 24), children: t("reminders.snooze_1d") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 justify-start text-xs font-black uppercase tracking-widest rounded-lg", onClick: () => handleSnooze(reminder.id, 168), children: t("reminders.snooze_1w") })
              ] })
            ] }),
            reminder.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-green-600", onClick: () => handleComplete(reminder.id), title: t("reminders.mark_complete"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-8 w-8 p-0 text-destructive", onClick: () => setDeleteId(reminder.id), title: t("reminders.delete_reminder"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
          ] })
        ] }) }, reminder.id)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showModal, onClose: () => {
        setShowModal(false);
        resetForm();
      }, title: editingReminder ? t("reminders.edit_reminder") : t("reminders.new_reminder"), size: "lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-8 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("reminders.reminder_title") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("reminders.reminder_title") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, value: formData.title, onChange: (e) => setFormData({ ...formData, title: e.target.value }), className: "h-12 bg-card rounded-xl font-bold" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("reminders.reminder_type") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.type, onValueChange: (val) => setFormData({ ...formData, type: val }), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: REMINDER_TYPES.map((type) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: type, children: getTypeLabel(type) }, type)) })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("reminders.reminder_message") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: formData.message, onChange: (e) => setFormData({ ...formData, message: e.target.value }), className: "min-h-[80px] bg-card rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-muted-foreground border-b border-border/50 pb-2", children: t("reminders.trigger_at") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("reminders.trigger_at") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: formData.triggerDate, onChange: (v) => setFormData({ ...formData, triggerDate: v }), className: "h-12 bg-card rounded-xl" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("reminders.trigger_at") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "time", value: formData.triggerTime, onChange: (e) => setFormData({ ...formData, triggerTime: e.target.value }), className: "h-12 bg-card rounded-xl" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-4 sticky bottom-0 bg-background/80 backdrop-blur-md pb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg", children: editingReminder ? t("reminders.edit_reminder") : t("reminders.new_reminder") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", onClick: () => {
            setShowModal(false);
            resetForm();
          }, className: "py-6 font-bold uppercase tracking-widest opacity-40 hover:bg-transparent", children: t("common.abort") })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!deleteId, onOpenChange: () => setDeleteId(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] bg-background border-border shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black uppercase tracking-tight", children: t("reminders.confirm_delete") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: t("reminders.confirm_delete") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-border h-11 text-xs font-black uppercase tracking-widest", children: t("common.abort") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: () => deleteId && handleDelete(deleteId), className: "rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-xs font-black uppercase tracking-widest", children: t("reminders.delete_reminder") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        className: "fixed bottom-8 right-8 h-20 w-20 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-primary text-primary-foreground hover:scale-110 active:scale-95 transition-all z-[9999] flex flex-col gap-1 items-center justify-center border-4 border-primary-foreground/20 group",
        onClick: openCreate,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-8 w-8 group-hover:rotate-90 transition-transform duration-300", strokeWidth: 4 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-tighter", children: t("reminders.new_reminder") })
        ]
      }
    )
  ] });
};
export {
  ReminderHistory as default
};

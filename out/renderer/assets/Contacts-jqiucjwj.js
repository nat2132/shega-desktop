import { c as createLucideIcon, b as useSettings, r as reactExports, t as toast, j as jsxRuntimeExports, as as Users, e as Button, a1 as Search, K as Input, R as RefreshCw, $ as User, h as Trash2, Q as Dialog, U as DialogContent, W as DialogHeader, Y as DialogTitle, an as Building2, g as Badge } from "./index-ym3eqgeD.js";
import { C as Card, c as CardContent, L as Label } from "./label-DrbGdDFZ.js";
import { T as Textarea } from "./textarea-B9td8Kgh.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-t5N9kU1h.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-DA-UjefH.js";
import { P as Plus } from "./plus-DTUPnwur.js";
import { P as Pencil } from "./pencil-tX2FYbSt.js";
import { P as Phone } from "./phone-fqPuzCu3.js";
import { C as Copy } from "./copy-CgTagT0y.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const HardHat = createLucideIcon("HardHat", [
  ["path", { d: "M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5", key: "1p9q5i" }],
  ["path", { d: "M14 6a6 6 0 0 1 6 6v3", key: "1hnv84" }],
  ["path", { d: "M4 15v-3a6 6 0 0 1 6-6", key: "9ciidu" }],
  ["rect", { x: "2", y: "15", width: "20", height: "4", rx: "1", key: "g3x8cw" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Wrench = createLucideIcon("Wrench", [
  [
    "path",
    {
      d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
      key: "cbrjhi"
    }
  ]
]);
const CATEGORIES = ["supplier", "worker", "service", "other"];
const CATEGORY_ICONS = {
  supplier: /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4" }),
  worker: /* @__PURE__ */ jsxRuntimeExports.jsx(HardHat, { className: "h-4 w-4" }),
  service: /* @__PURE__ */ jsxRuntimeExports.jsx(Wrench, { className: "h-4 w-4" }),
  other: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-4 w-4" })
};
const DEFAULT_FORM = {
  name: "",
  phone: "",
  category: "",
  subCategory: "",
  notes: ""
};
const Contacts = () => {
  const { t } = useSettings();
  const [contacts, setContacts] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [search, setSearch] = reactExports.useState("");
  const [categoryFilter, setCategoryFilter] = reactExports.useState("all");
  const [showForm, setShowForm] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState(DEFAULT_FORM);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = reactExports.useState(false);
  const loadContacts = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const result = await window.api.getContacts({
        search: search || void 0,
        category: categoryFilter === "all" ? void 0 : categoryFilter,
        limit: 1e4,
        offset: 0
      });
      const rows = result.rows || result || [];
      setContacts(Array.isArray(rows) ? rows : []);
    } catch (e) {
      toast.error(e.message || "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);
  reactExports.useEffect(() => {
    loadContacts();
  }, [loadContacts]);
  const filtered = reactExports.useMemo(() => {
    let list = contacts;
    if (categoryFilter !== "all") {
      list = list.filter((c) => c.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q) || (c.subCategory || "").toLowerCase().includes(q) || (c.notes || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [contacts, categoryFilter, search]);
  const openAddForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(true);
  };
  const openEditForm = (contact) => {
    setForm({
      name: contact.name,
      phone: contact.phone,
      category: contact.category,
      subCategory: contact.subCategory || "",
      notes: contact.notes || ""
    });
    setEditingId(contact.id);
    setShowForm(true);
  };
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    try {
      if (editingId) {
        await window.api.updateContact(editingId, form);
        toast.success(t("contacts.contact_updated"));
      } else {
        await window.api.insertContact(form);
        toast.success(t("contacts.contact_added"));
      }
      setShowForm(false);
      setForm(DEFAULT_FORM);
      setEditingId(null);
      loadContacts();
    } catch (e2) {
      toast.error(e2.message || "Save failed");
    }
  };
  const handleDeleteClick = (contact) => {
    setDeleteTarget(contact);
    setShowDeleteAlert(true);
  };
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteContact(deleteTarget.id);
      toast.success(t("contacts.contact_deleted"));
      setShowDeleteAlert(false);
      setDeleteTarget(null);
      loadContacts();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };
  const handleCopyPhone = (phone) => {
    navigator.clipboard.writeText(phone);
    toast.success(t("contacts.call") || "Phone number copied");
  };
  const categoryBadge = (cat) => {
    const variantMap = {
      supplier: "default",
      worker: "secondary",
      service: "outline",
      other: "destructive"
    };
    const labelMap = {
      supplier: t("contacts.supplier") || "Supplier",
      worker: t("contacts.worker") || "Worker",
      service: t("contacts.service") || "Service",
      other: t("contacts.other") || "Other"
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: variantMap[cat] || "outline", className: "text-[10px] gap-1", children: [
      CATEGORY_ICONS[cat],
      labelMap[cat] || cat
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in px-4 lg:px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between flex-wrap gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-6 w-6" }),
          t("contacts.title")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: t("contacts.subtitle") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: openAddForm, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
        t("contacts.add_contact")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            className: "pl-9",
            placeholder: t("common.search") + "...",
            value: search,
            onChange: (e) => setSearch(e.target.value)
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: loadContacts, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 flex-wrap", children: ["all", ...CATEGORIES].map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setCategoryFilter(cat),
        className: `px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`,
        children: cat === "all" ? t("contacts.all") || "All" : CATEGORY_ICONS[cat] ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
          CATEGORY_ICONS[cat],
          t(`contacts.${cat}`)
        ] }) : t(`contacts.${cat}`)
      },
      cat
    )) }),
    loading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-8 w-8 animate-spin text-muted-foreground" }) }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-12 w-12 mb-3 opacity-30" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium", children: t("contacts.no_contacts") }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: openAddForm, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4 mr-1" }),
        t("contacts.add_contact")
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: filtered.map((contact) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl overflow-hidden group", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted", children: CATEGORY_ICONS[contact.category] || /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5 text-muted-foreground" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold text-sm truncate", children: contact.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5", children: categoryBadge(contact.category) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-8 w-8",
              onClick: () => openEditForm(contact),
              title: t("contacts.edit_contact") || "Edit",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-8 w-8 text-red-500 hover:text-red-600",
              onClick: () => handleDeleteClick(contact),
              title: t("contacts.delete_contact") || "Delete",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" })
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => handleCopyPhone(contact.phone),
          className: "flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-full text-left",
          title: t("contacts.call") || "Copy phone number",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: contact.phone }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3 ml-auto shrink-0 opacity-40" })
          ]
        }
      ),
      contact.subCategory && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-black uppercase tracking-widest", children: [
          t("contacts.sub_category") || "Sub Category",
          ":"
        ] }),
        " ",
        contact.subCategory
      ] }),
      contact.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground/70 mt-2 line-clamp-2 italic border-t pt-2 border-border/40", children: contact.notes })
    ] }) }, contact.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: showForm, onOpenChange: setShowForm, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "sm:max-w-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: editingId ? t("contacts.edit_contact") : t("contacts.add_contact") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSave, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
            t("contacts.name"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              required: true,
              value: form.name,
              onChange: (e) => setForm({ ...form, name: e.target.value }),
              placeholder: "Contact name"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
            t("contacts.phone"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              required: true,
              value: form.phone,
              onChange: (e) => setForm({ ...form, phone: e.target.value }),
              placeholder: "+251..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
            t("contacts.category"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Select,
            {
              value: form.category,
              onValueChange: (v) => setForm({ ...form, category: v }),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Select category" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CATEGORIES.map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: cat, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-2", children: [
                  CATEGORY_ICONS[cat],
                  t(`contacts.${cat}`)
                ] }) }, cat)) })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("contacts.sub_category") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: form.subCategory,
              onChange: (e) => setForm({ ...form, subCategory: e.target.value }),
              placeholder: "e.g. Plumber, Electrician"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("contacts.notes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              value: form.notes,
              onChange: (e) => setForm({ ...form, notes: e.target.value }),
              rows: 3,
              placeholder: "Additional notes..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "button",
              variant: "outline",
              onClick: () => {
                setShowForm(false);
                setForm(DEFAULT_FORM);
                setEditingId(null);
              },
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", children: editingId ? "Update" : "Save" })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showDeleteAlert, onOpenChange: setShowDeleteAlert, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("contacts.delete_contact") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogDescription, { children: [
          t("contacts.confirm_delete"),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: deleteTarget?.name }),
          "?"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { onClick: () => setDeleteTarget(null), children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialogAction,
          {
            variant: "destructive",
            onClick: handleDeleteConfirm,
            children: t("contacts.delete_contact")
          }
        )
      ] })
    ] }) })
  ] });
};
export {
  Contacts as default
};

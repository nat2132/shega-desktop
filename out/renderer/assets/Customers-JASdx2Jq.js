import { c as createLucideIcon, g as useSettings, r as reactExports, j as jsxRuntimeExports, m as Badge, i as Button, a2 as Sheet, a3 as SheetTrigger, a4 as Filter, a5 as SheetContent, a6 as SheetHeader, a7 as SheetTitle, a8 as SheetDescription, a9 as SheetFooter, aa as SheetClose, M as Modal, ao as CreditCard, ap as History, G as Input, y as Trash2, H as toast } from "./index-wvHtiMql.js";
import { E } from "./jspdf.es.min-BFulL-Sj.js";
import { b as addPdfHeader, c as autoTable } from "./export-utils-DxRsu4JU.js";
import { S as SectionCards } from "./section-cards-CbIjTjY2.js";
import { D as DataTable } from "./data-table-D5_iPqtD.js";
import { T as Textarea } from "./textarea-BU9_DHH1.js";
import { L as Label } from "./label-CVXISaaQ.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-iyCsL0f8.js";
import { c as computeTrend } from "./trend-utils-D_UP5BUt.js";
import { P as Pencil } from "./pencil-BsujgjTN.js";
import { P as Printer } from "./printer-N-GncOQF.js";
import { P as Phone } from "./phone-BccnzlvK.js";
import { M as Mail } from "./mail-UL7hF6ux.js";
import { M as MapPin } from "./map-pin-BbusgxIC.js";
import { T as Tag, S as Save } from "./tag-BUIFdhxv.js";
import "./card-BnskyD18.js";
import "./kpi-visibility-CCHECjn6.js";
import "./trending-up-B1IsTNPA.js";
import "./table-CnJV7hxz.js";
import "./tabs-DerxGOpk.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Building = createLucideIcon("Building", [
  ["rect", { width: "16", height: "20", x: "4", y: "2", rx: "2", ry: "2", key: "76otgf" }],
  ["path", { d: "M9 22v-4h6v4", key: "r93iot" }],
  ["path", { d: "M8 6h.01", key: "1dz90k" }],
  ["path", { d: "M16 6h.01", key: "1x0f13" }],
  ["path", { d: "M12 6h.01", key: "1vi96p" }],
  ["path", { d: "M12 10h.01", key: "1nrarc" }],
  ["path", { d: "M12 14h.01", key: "1etili" }],
  ["path", { d: "M16 10h.01", key: "1m94wz" }],
  ["path", { d: "M16 14h.01", key: "1gbofw" }],
  ["path", { d: "M8 10h.01", key: "19clt8" }],
  ["path", { d: "M8 14h.01", key: "6423bh" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CircleUser = createLucideIcon("CircleUser", [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }],
  ["path", { d: "M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662", key: "154egf" }]
]);
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const MessageSquare = createLucideIcon("MessageSquare", [
  ["path", { d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", key: "1lielz" }]
]);
const CUSTOMER_GROUPS = ["general", "vip", "wholesale", "retail", "corporate"];
const CUSTOMER_GROUP_LABELS = {
  general: "customers.group_general",
  vip: "customers.group_vip",
  wholesale: "customers.group_wholesale",
  retail: "customers.group_retail",
  corporate: "customers.group_corporate"
};
const emptyCustomer = {
  id: 0,
  customerName: "",
  createdAt: "",
  phone: "",
  secondaryPhone: "",
  email: "",
  address: "",
  city: "",
  company: "",
  taxNumber: "",
  groupName: "general",
  creditLimit: 0,
  notes: "",
  isActive: 1,
  salesStats: {}
};
const Customers = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const translateGroupName = (group) => {
    const key = CUSTOMER_GROUP_LABELS[group];
    return key ? t(key, group) : group;
  };
  const [customers, setCustomers] = reactExports.useState([]);
  const [selectedCustomer, setSelectedCustomer] = reactExports.useState(null);
  const [customerSales, setCustomerSales] = reactExports.useState([]);
  const [customerNotes, setCustomerNotes] = reactExports.useState([]);
  const [showPaymentModal, setShowPaymentModal] = reactExports.useState(false);
  const [showProfileModal, setShowProfileModal] = reactExports.useState(false);
  const [showFormModal, setShowFormModal] = reactExports.useState(false);
  const [paymentAmount, setPaymentAmount] = reactExports.useState("");
  const [selectedSale, setSelectedSale] = reactExports.useState(null);
  const [editingCustomer, setEditingCustomer] = reactExports.useState({ ...emptyCustomer });
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [newNote, setNewNote] = reactExports.useState("");
  const [isFilterOpen, setIsFilterOpen] = reactExports.useState(false);
  const [filterGroup, setFilterGroup] = reactExports.useState("All");
  const [filterCity, setFilterCity] = reactExports.useState("All");
  const [filterStatus, setFilterStatus] = reactExports.useState("All");
  reactExports.useEffect(() => {
    loadCustomers();
  }, []);
  useDataChangedRefresh(() => {
    loadCustomers();
  });
  const loadCustomers = () => {
    window.api?.getCustomers().then((data) => {
      setCustomers(data);
    });
  };
  const uniqueGroups = reactExports.useMemo(() => ["All", ...new Set(customers.map((c) => c.groupName).filter(Boolean))], [customers]);
  const uniqueCities = reactExports.useMemo(() => ["All", ...new Set(customers.map((c) => c.city).filter(Boolean))], [customers]);
  const filteredCustomers = reactExports.useMemo(() => {
    return customers.filter((c) => {
      if (filterGroup !== "All" && c.groupName !== filterGroup) return false;
      if (filterCity !== "All" && c.city !== filterCity) return false;
      if (filterStatus !== "All" && (filterStatus === "Active" ? !c.isActive : c.isActive)) return false;
      return true;
    });
  }, [customers, filterGroup, filterCity, filterStatus]);
  const viewCustomer = (customer) => {
    setSelectedCustomer(customer);
    window.api?.getCustomerSales(customer.customerName).then((data) => {
      setCustomerSales(data);
    });
    window.api?.getCustomerNotes(customer.id).then((data) => {
      setCustomerNotes(data || []);
    });
    setNewNote("");
    setShowProfileModal(true);
  };
  const openEditCustomer = (customer) => {
    setEditingCustomer({ ...customer });
    setIsEditing(true);
    setShowFormModal(true);
  };
  const openNewCustomer = () => {
    setEditingCustomer({ ...emptyCustomer });
    setIsEditing(false);
    setShowFormModal(true);
  };
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const trimmedName = editingCustomer.customerName.trim();
    if (!trimmedName) return;
    const payload = { ...editingCustomer, customerName: trimmedName };
    let result;
    if (isEditing) {
      result = await window.api?.updateCustomer(payload);
    } else {
      result = await window.api?.insertCustomer(payload);
    }
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isEditing ? t("customers.customer_updated", "Customer updated") : t("customers.customer_created", "Customer created"));
    setShowFormModal(false);
    loadCustomers();
  };
  const handleDeleteCustomer = async (customer) => {
    const result = await window.api?.deleteCustomer(customer.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(t("customers.customer_deactivated", "Customer deactivated"));
    loadCustomers();
    if (selectedCustomer?.id === customer.id) setShowProfileModal(false);
  };
  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCustomer) return;
    await window.api?.addCustomerNote(selectedCustomer.id, newNote, "Admin");
    setNewNote("");
    const notes = await window.api?.getCustomerNotes(selectedCustomer.id);
    setCustomerNotes(notes || []);
  };
  const openPayment = (sale) => {
    setSelectedSale(sale);
    setPaymentAmount(String(sale.totalPrice - sale.paidAmount));
    setShowPaymentModal(true);
  };
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!selectedSale || !paymentAmount) return;
    await window.api?.payDebt(selectedSale.id, parseFloat(paymentAmount));
    setShowPaymentModal(false);
    setPaymentAmount("");
    setSelectedSale(null);
    if (selectedCustomer) viewCustomer(selectedCustomer);
    loadCustomers();
  };
  const generateInvoicePDF = (sale) => {
    const doc = new E();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(/* @__PURE__ */ new Date());
    let y = y0 + 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t("customers.invoice").toUpperCase(), 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${t("common.date")}: ${date}`, 190, y, { align: "right" });
    doc.text(`${t("sales.customer")}: ${selectedCustomer?.customerName}`, 15, y);
    y += 7;
    doc.text(`${t("sales.phone_number")}: ${selectedCustomer?.phone || "N/A"}`, 15, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [[t("inventory.product"), t("common.quantity"), t("common.price"), t("common.total"), t("sales.paid"), t("sales.outstanding")]],
      body: [[
        sale.itemName,
        sale.quantity,
        `${t("common.etb")} ${(sale.totalPrice / sale.quantity).toLocaleString()}`,
        `${t("common.etb")} ${sale.totalPrice.toLocaleString()}`,
        `${t("common.etb")} ${sale.paidAmount.toLocaleString()}`,
        `${t("common.etb")} ${(sale.totalPrice - sale.paidAmount).toLocaleString()}`
      ]],
      theme: "grid",
      headStyles: { fillColor: [0, 0, 0] }
    });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(t("customers.invoice_footer"), 105, 280, { align: "center" });
    doc.save(`Invoice_${selectedCustomer?.customerName}_${sale.id}.pdf`);
  };
  const generateStatementPDF = (customer, sales) => {
    const doc = new E();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(/* @__PURE__ */ new Date());
    let y = y0 + 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t("customers.statement").toUpperCase(), 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${t("common.date")}: ${date}`, 190, y, { align: "right" });
    doc.text(`${t("sales.customer")}: ${customer.customerName}`, 15, y);
    y += 7;
    doc.text(`${t("sales.phone_number")}: ${customer.phone || "N/A"}`, 15, y);
    y += 4;
    autoTable(doc, {
      startY: y,
      head: [[t("common.date"), t("inventory.product"), t("common.total"), t("sales.paid"), t("sales.outstanding")]],
      body: sales.map((s) => [
        formatDate(s.createdAt),
        s.itemName,
        s.totalPrice.toLocaleString(),
        s.paidAmount.toLocaleString(),
        (s.totalPrice - s.paidAmount).toLocaleString()
      ]),
      theme: "striped",
      headStyles: { fillColor: [0, 0, 0] },
      foot: [[
        "",
        t("pdf.total"),
        customer.salesStats?.totalDebt?.toLocaleString() || "0",
        customer.salesStats?.totalPaid?.toLocaleString() || "0",
        (customer.salesStats?.outstanding || 0).toLocaleString()
      ]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: "bold" }
    });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(t("customers.statement_footer"), 105, 280, { align: "center" });
    doc.save(`Statement_${customer.customerName}_${date.replace(/\//g, "-")}.pdf`);
  };
  const kpiCards = reactExports.useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.salesStats?.outstanding || 0), 0);
    const totalPaid = customers.reduce((sum, c) => sum + (c.salesStats?.totalPaid || 0), 0);
    const debtCount = customers.filter((c) => (c.salesStats?.outstanding || 0) > 0).length;
    const overdueAmt = totalOutstanding * 0.15;
    const outTrend = computeTrend(customers, "createdAt", (c) => c.salesStats?.outstanding || 0);
    const colTrend = computeTrend(customers, "createdAt", (c) => c.salesStats?.totalPaid || 0);
    const activeTrend = computeTrend(customers, "createdAt", (c) => (c.salesStats?.outstanding || 0) > 0 ? 1 : 0);
    const overdueTrend = computeTrend(customers, "createdAt", (c) => (c.salesStats?.outstanding || 0) * 0.15);
    return [
      {
        title: t("customers.outstanding"),
        value: `${t("common.etb")} ${totalOutstanding.toLocaleString()}`,
        ...outTrend,
        footerTitle: t("customers.credit_volume"),
        footerSub: t("customers.last_30")
      },
      {
        title: t("customers.collected"),
        value: `${t("common.etb")} ${totalPaid.toLocaleString()}`,
        ...colTrend,
        footerTitle: t("customers.recovery_rate"),
        footerSub: t("customers.high_efficiency")
      },
      {
        title: t("customers.active"),
        value: debtCount,
        ...activeTrend,
        footerTitle: t("customers.entity_count"),
        footerSub: t("customers.active_ledgers")
      },
      {
        title: t("customers.overdue"),
        value: `${t("common.etb")} ${overdueAmt.toLocaleString(void 0, { maximumFractionDigits: 0 })}`,
        ...overdueTrend,
        footerTitle: t("customers.est_risk"),
        footerSub: t("customers.action_req")
      }
    ];
  }, [customers]);
  const columns = [
    {
      accessorKey: "customerName",
      header: t("customers.identity"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircleUser, { className: "h-6 w-6 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: row.original.customerName }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: row.original.phone || t("sales.walk_in") }),
            row.original.groupName !== "general" && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs h-4 px-1", children: translateGroupName(row.original.groupName) })
          ] })
        ] })
      ] })
    },
    {
      accessorKey: "salesStats.outstanding",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("customers.outstanding") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right font-black text-destructive", children: [
        t("common.etb"),
        " ",
        (row.original.salesStats?.outstanding || 0).toLocaleString()
      ] })
    },
    {
      accessorKey: "salesStats.transactionCount",
      header: t("customers.activity"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold", children: [
          row.original.salesStats?.transactionCount || 0,
          " ",
          t("sales.transactions")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 w-20 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary", style: { width: `${Math.min(100, (row.original.salesStats?.transactionCount || 0) * 10)}%` } }) })
      ] })
    },
    {
      id: "actions",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.actions") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => viewCustomer(row.original), children: t("customers.view_ledger") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => openEditCustomer(row.original), title: t("customers.edit_profile", "Edit Profile"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 14 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => {
          window.api?.getCustomerSales(row.original.customerName).then((sales) => {
            generateStatementPDF(row.original, sales);
          });
        }, title: t("customers.statement"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { size: 14 }) })
      ] })
    }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards, storageKey: "customers" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: isFilterOpen, onOpenChange: setIsFilterOpen, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: `h-8 px-3 transition-all ${filterGroup !== "All" || filterCity !== "All" || filterStatus !== "All" ? "border-primary text-primary bg-primary/5 shadow-sm" : "border-border/60 hover:bg-muted/50"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "mr-1.5 h-3.5 w-3.5" }),
            t("common.filters", "Filters"),
            " ",
            (filterGroup !== "All" || filterCity !== "All" || filterStatus !== "All") && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1.5 h-4 px-1 text-xs rounded-full", children: t("common.active", "Active") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-border/50 p-6", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("customers.filters_title", "Customer Filters") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-xs font-bold text-muted-foreground uppercase tracking-widest", children: t("customers.filters_desc", "Refine your customer view") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 p-6 flex-1 overflow-y-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("customers.group", "Group") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterGroup, onValueChange: setFilterGroup, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("customers.all_groups", "All Groups") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: uniqueGroups.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: g, children: g === "All" ? t("common.all", "All") : translateGroupName(g) }, g)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("customers.city", "City") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterCity, onValueChange: setFilterCity, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("customers.all_cities", "All Cities") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: uniqueCities.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c)) })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("common.status", "Status") }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterStatus, onValueChange: setFilterStatus, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("customers.all_statuses", "All Statuses") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("common.all", "All") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Active", children: t("common.active", "Active") }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "Inactive", children: t("common.inactive", "Inactive") })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetFooter, { className: "p-6 border-t border-border/50 bg-background/80 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 w-full", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  variant: "outline",
                  className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl",
                  onClick: () => {
                    setFilterGroup("All");
                    setFilterCity("All");
                    setFilterStatus("All");
                  },
                  children: t("customers.reset_all", "Reset All")
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 py-3 font-black uppercase tracking-widest rounded-xl shadow-xl", children: t("customers.apply_filters", "Apply Filters") }) })
            ] }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DataTable,
        {
          columns,
          data: filteredCustomers,
          title: t("customers.header"),
          onAddClick: openNewCustomer,
          addLabel: t("customers.add_customer", "Add Customer")
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: showProfileModal,
        onClose: () => setShowProfileModal(false),
        title: `${t("customers.ledger_title")}: ${selectedCustomer?.customerName}`,
        size: "lg",
        children: selectedCustomer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("customers.master_balance") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black", children: [
                t("common.etb"),
                " ",
                (selectedCustomer.salesStats?.outstanding || 0).toLocaleString()
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-primary/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-primary", children: t("customers.lifetime_paid") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-black text-primary", children: [
                t("common.etb"),
                " ",
                (selectedCustomer.salesStats?.totalPaid || 0).toLocaleString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 12, className: "text-muted-foreground shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: selectedCustomer.phone || "-" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { size: 12, className: "text-muted-foreground shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: selectedCustomer.email || "-" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 12, className: "text-muted-foreground shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: selectedCustomer.city || selectedCustomer.address || "-" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Building, { size: 12, className: "text-muted-foreground shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: selectedCustomer.company || "-" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { size: 12, className: "text-muted-foreground shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs h-4 px-1", children: translateGroupName(selectedCustomer.groupName) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs bg-muted/20 p-2 rounded-lg", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CreditCard, { size: 12, className: "text-muted-foreground shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "truncate", children: [
                t("customers.credit_limit", "Credit Limit"),
                ": ",
                t("common.etb"),
                " ",
                selectedCustomer.creditLimit.toLocaleString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => openEditCustomer(selectedCustomer), className: "h-8 text-xs font-bold uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { size: 12, className: "mr-1" }),
            " ",
            t("customers.edit_profile", "Edit Profile")
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { size: 12 }),
              " ",
              t("customers.communication_history", "Communication History")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 max-h-32 overflow-y-auto my-2", children: [
              customerNotes.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic", children: t("customers.no_notes", "No notes recorded") }),
              customerNotes.map((note) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 rounded-lg bg-muted/20 text-xs", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "leading-relaxed", children: note.note }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [
                  note.createdBy,
                  " · ",
                  formatDate(note.createdAt)
                ] })
              ] }, note.id))
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 items-end", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Textarea,
                {
                  placeholder: t("customers.add_note_placeholder", "Add a note..."),
                  value: newNote,
                  onChange: (e) => setNewNote(e.target.value),
                  rows: 2,
                  className: "text-sm flex-1"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleAddNote, disabled: !newNote.trim(), className: "h-9 w-9 p-0 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { size: 14 }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(History, { size: 12 }),
              " ",
              t("customers.debt_history")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg overflow-hidden mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/60 text-xs font-black uppercase tracking-widest", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5", children: t("inventory.product") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5", children: t("customers.outstanding") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5", children: t("common.date") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5", children: t("sales.dueDate") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-1.5 text-right", children: t("common.actions") })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "text-xs", children: [
                customerSales.filter((s) => s.paymentStatus === "Debt").map((sale) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border/40 hover:bg-muted/20", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-semibold", children: sale.itemName }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-destructive font-bold", children: [
                    t("common.etb"),
                    " ",
                    (sale.totalPrice - sale.paidAmount).toLocaleString()
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: formatDate(sale.createdAt) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-muted-foreground", children: formatDate(sale.dueDate) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 text-right flex justify-end gap-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        variant: "ghost",
                        size: "icon",
                        onClick: () => generateInvoicePDF(sale),
                        title: t("customers.generate_invoice"),
                        className: "h-6 w-6",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Printer, { size: 10 })
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: () => openPayment(sale), className: "h-6 text-xs font-bold uppercase tracking-widest px-2", children: t("customers.pay") })
                  ] })
                ] }, sale.id)),
                customerSales.filter((s) => s.paymentStatus === "Debt").length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-3 py-4 text-center text-muted-foreground text-xs", children: t("customers.no_outstanding_debts", "No outstanding debts") }) })
              ] })
            ] }) })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: showFormModal,
        onClose: () => setShowFormModal(false),
        title: isEditing ? t("customers.edit_customer", "Edit Customer") : t("customers.new_customer", "New Customer"),
        size: "md",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSaveCustomer, className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: [
                t("customers.customer_name", "Customer Name"),
                " *"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  required: true,
                  value: editingCustomer.customerName,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, customerName: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("customers.group", "Group") }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Select,
                {
                  value: editingCustomer.groupName,
                  onValueChange: (v) => setEditingCustomer({ ...editingCustomer, groupName: v }),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CUSTOMER_GROUPS.map((g) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: g, children: translateGroupName(g) }, g)) })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("common.phone", "Phone") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: editingCustomer.phone,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("customers.secondary_phone", "Secondary Phone") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: editingCustomer.secondaryPhone,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, secondaryPhone: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("common.email", "Email") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "email",
                  value: editingCustomer.email,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("customers.company", "Company") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: editingCustomer.company,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: [
                t("customers.credit_limit", "Credit Limit"),
                " (",
                t("common.etb"),
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  type: "number",
                  value: editingCustomer.creditLimit,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, creditLimit: parseFloat(e.target.value) || 0 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("customers.city", "City") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: editingCustomer.city,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("customers.address", "Address") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: editingCustomer.address,
                  onChange: (e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("customers.notes", "Notes") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                value: editingCustomer.notes,
                onChange: (e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value }),
                rows: 2
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
            isEditing && /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Button,
              {
                type: "button",
                variant: "destructive",
                size: "sm",
                onClick: () => handleDeleteCustomer(editingCustomer),
                className: "h-8 text-xs font-bold uppercase tracking-widest px-3",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 12, className: "mr-1" }),
                  " ",
                  t("customers.deactivate", "Deactivate")
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 ml-auto", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setShowFormModal(false), className: "h-8 text-xs font-bold uppercase tracking-widest px-3", children: t("common.cancel", "Cancel") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "h-8 text-xs font-bold uppercase tracking-widest px-3", children: isEditing ? t("customers.update_customer", "Update Customer") : t("customers.create_customer", "Create Customer") })
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        isOpen: showPaymentModal,
        onClose: () => setShowPaymentModal(false),
        title: t("customers.reconciliation"),
        size: "sm",
        children: selectedSale && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePayment, className: "space-y-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("customers.payment_amount") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                required: true,
                type: "number",
                max: selectedSale.totalPrice - selectedSale.paidAmount,
                value: paymentAmount,
                onChange: (e) => setPaymentAmount(e.target.value)
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
              t("common.max"),
              ": ",
              t("common.etb"),
              " ",
              selectedSale.totalPrice - selectedSale.paidAmount
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full h-9 text-xs font-bold uppercase tracking-widest", children: t("customers.confirm_payment") })
        ] })
      }
    )
  ] });
};
export {
  Customers as default
};

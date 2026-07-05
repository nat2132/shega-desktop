import { b as useSettings, r as reactExports, aw as Building2, m as Package, j as jsxRuntimeExports, g as Badge, e as Button, aB as Warehouse, a5 as User, n as Trash2, an as cn, a7 as Search, Q as Input, R as RefreshCw, M as Modal, t as toast } from "./index-BQyt5yx7.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-t3kFABSh.js";
import { A as ArrowRightLeft } from "./arrow-right-left-DQD90fw7.js";
import { H as History } from "./history-DXxmJqG5.js";
import { P as Plus } from "./plus-BQo0iacc.js";
import { P as Phone } from "./phone-51NhRrrw.js";
import { P as Pen } from "./pen-Coq68RJH.js";
const Warehouses = () => {
  const { t, formatDate, formatDateTime } = useSettings();
  const [activeTab, setActiveTab] = reactExports.useState("warehouses");
  const [warehouses, setWarehouses] = reactExports.useState([]);
  const [items, setItems] = reactExports.useState([]);
  const [inventory, setInventory] = reactExports.useState([]);
  const [transfers, setTransfers] = reactExports.useState([]);
  const [movements, setMovements] = reactExports.useState([]);
  const [allInventory, setAllInventory] = reactExports.useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = reactExports.useState(null);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showWarehouseModal, setShowWarehouseModal] = reactExports.useState(false);
  const [showTransferModal, setShowTransferModal] = reactExports.useState(false);
  const [showAdjustModal, setShowAdjustModal] = reactExports.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(false);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [editingWh, setEditingWh] = reactExports.useState(null);
  const [whForm, setWhForm] = reactExports.useState({ name: "", location: "", managerName: "", managerPhone: "", email: "" });
  const [transferForm, setTransferForm] = reactExports.useState({ fromWarehouseId: 0, toWarehouseId: 0, itemId: 0, quantity: 0, notes: "", transferredBy: "" });
  const [adjustForm, setAdjustForm] = reactExports.useState({ warehouseId: 0, itemId: 0, quantity: 0 });
  reactExports.useEffect(() => {
    loadData();
  }, []);
  reactExports.useEffect(() => {
    if (activeTab === "inventory" && selectedWarehouse) loadInventory(selectedWarehouse);
  }, [selectedWarehouse, activeTab]);
  reactExports.useEffect(() => {
    if (activeTab === "transfers") loadTransfers();
  }, [activeTab]);
  reactExports.useEffect(() => {
    if (activeTab === "movements") loadMovements();
  }, [activeTab]);
  reactExports.useEffect(() => {
    if (activeTab === "inventory") loadAllInventory();
  }, [activeTab]);
  const loadData = async () => {
    try {
      const [wh, inv, it] = await Promise.all([
        window.api.getWarehouses(),
        window.api.getAllWarehouseInventory(),
        window.api.getItems({ limit: 1e3 })
      ]);
      setWarehouses(wh || []);
      setAllInventory(inv || []);
      setItems(it || []);
      if (wh?.length && !selectedWarehouse) setSelectedWarehouse(wh[0].id);
    } catch (err) {
      console.error("Failed to load warehouse data:", err);
    }
  };
  const loadInventory = async (id) => {
    try {
      setInventory(await window.api.getWarehouseInventory(id) || []);
    } catch (err) {
      console.error(err);
    }
  };
  const loadTransfers = async () => {
    try {
      setTransfers(await window.api.getStockTransfers({ limit: 100 }) || []);
    } catch (err) {
      console.error(err);
    }
  };
  const loadMovements = async () => {
    try {
      const opts = { limit: 100 };
      if (selectedWarehouse) opts.warehouseId = selectedWarehouse;
      setMovements(await window.api.getStockMovements(opts) || []);
    } catch (err) {
      console.error(err);
    }
  };
  const loadAllInventory = async () => {
    try {
      setAllInventory(await window.api.getAllWarehouseInventory({ search: searchQuery || void 0 }) || []);
    } catch (err) {
      console.error(err);
    }
  };
  const kpiCards = reactExports.useMemo(() => {
    const totalWh = warehouses.length;
    const totalStock = allInventory.reduce((s, i) => s + (i.quantity || 0), 0);
    const totalValue = allInventory.reduce((s, i) => s + (i.quantity || 0) * (i.baseSellingPrice || 0), 0);
    const lowStock = allInventory.filter((i) => i.quantity > 0 && i.quantity < 10).length;
    return [
      { title: t("warehouses.total_warehouses"), value: totalWh, trend: "", trendType: "up", footerTitle: t("warehouses.active_locations"), footerSub: `${warehouses.filter((w) => w.isActive).length} ${t("warehouses.active")}` },
      { title: t("warehouses.total_items"), value: totalStock, trend: "", trendType: "up", footerTitle: t("warehouses.across_warehouses"), footerSub: `${allInventory.length} SKUs` },
      { title: t("warehouses.stock_value"), value: `ETB ${totalValue.toLocaleString()}`, trend: "", trendType: "up", footerTitle: t("warehouses.total_inventory_value"), footerSub: t("warehouses.at_cost") },
      { title: t("warehouses.low_stock_alerts"), value: lowStock, trend: "", trendType: lowStock > 0 ? "down" : "up", footerTitle: t("warehouses.items_below_threshold"), footerSub: "< 10 units" }
    ];
  }, [warehouses, allInventory]);
  const openCreateWh = () => {
    setEditingWh(null);
    setWhForm({ name: "", location: "", managerName: "", managerPhone: "", email: "" });
    setShowWarehouseModal(true);
  };
  const openEditWh = (wh) => {
    setEditingWh(wh);
    setWhForm({ name: wh.name, location: wh.location || "", managerName: wh.managerName || "", managerPhone: wh.managerPhone || "", email: wh.email || "" });
    setShowWarehouseModal(true);
  };
  const handleSaveWarehouse = async () => {
    if (!whForm.name.trim()) return toast.error(t("warehouses.wh_name_required"));
    try {
      if (editingWh) {
        await window.api.updateWarehouse(editingWh.id, whForm);
        toast.success(t("warehouses.wh_updated"));
      } else {
        await window.api.insertWarehouse(whForm);
        toast.success(t("warehouses.wh_created"));
      }
      setShowWarehouseModal(false);
      await window.api.getWarehouses().then(setWarehouses);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleDeleteWarehouse = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteWarehouse(deleteTarget.id);
      toast.success(t("warehouses.wh_deleted"));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      await window.api.getWarehouses().then(setWarehouses);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleTransfer = async () => {
    if (!transferForm.fromWarehouseId || !transferForm.toWarehouseId || !transferForm.itemId || transferForm.quantity <= 0) {
      return toast.error(t("warehouses.fill_required"));
    }
    if (transferForm.fromWarehouseId === transferForm.toWarehouseId) {
      return toast.error(t("warehouses.different_warehouses"));
    }
    try {
      await window.api.transferStock(transferForm);
      toast.success(t("warehouses.transfer_success"));
      setShowTransferModal(false);
      setTransferForm({ fromWarehouseId: 0, toWarehouseId: 0, itemId: 0, quantity: 0, notes: "", transferredBy: "" });
      loadTransfers();
      if (selectedWarehouse) loadInventory(selectedWarehouse);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleAdjustInventory = async () => {
    if (!adjustForm.warehouseId || !adjustForm.itemId || adjustForm.quantity < 0) {
      return toast.error(t("warehouses.fill_fields"));
    }
    try {
      await window.api.updateWarehouseInventory(adjustForm.warehouseId, adjustForm.itemId, adjustForm.quantity);
      toast.success(t("warehouses.inv_updated"));
      setShowAdjustModal(false);
      setAdjustForm({ warehouseId: 0, itemId: 0, quantity: 0 });
      loadInventory(adjustForm.warehouseId);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const tabs = [
    { id: "warehouses", label: t("warehouses.title"), icon: Building2 },
    { id: "inventory", label: t("warehouses.inventory"), icon: Package },
    { id: "transfers", label: t("warehouses.transfers"), icon: ArrowRightLeft },
    { id: "movements", label: t("warehouses.movements"), icon: History }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: kpiCards.map((card, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border bg-card/40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: card.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-2xl font-black tracking-tight mt-2", children: card.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: card.trendType === "up" ? "default" : "destructive", className: "text-[8px] font-black uppercase", children: card.trendType === "up" ? "+0%" : "0%" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-muted-foreground font-bold", children: card.footerTitle })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[8px] text-muted-foreground mt-1", children: card.footerSub })
    ] }, i)) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 rounded-xl bg-muted/30 border w-fit", children: tabs.map((tab) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        variant: activeTab === tab.id ? "default" : "ghost",
        size: "sm",
        onClick: () => setActiveTab(tab.id),
        className: "h-8 px-4 text-[10px] font-black uppercase tracking-widest rounded-lg",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(tab.icon, { size: 14, className: "mr-2" }),
          tab.label
        ]
      },
      tab.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      activeTab === "warehouses" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
            warehouses.length,
            " ",
            t("warehouses.title")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-9 px-5 text-[10px] font-black uppercase tracking-widest", onClick: openCreateWh, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14, className: "mr-2" }),
            " ",
            t("warehouses.add_warehouse")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: [
          warehouses.map((wh) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn(
            "p-5 rounded-2xl border-2 transition-all group",
            wh.isActive ? "bg-card/40 border-muted hover:border-muted-foreground/30" : "bg-muted/10 border-muted/30 opacity-60"
          ), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Warehouse, { size: 20 }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-tight", children: wh.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground font-bold uppercase mt-0.5", children: wh.location || t("warehouses.no_warehouse_location") })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: wh.isActive ? "default" : "secondary", className: "text-[7px] font-black uppercase", children: wh.isActive ? t("warehouses.active") : t("warehouses.inactive") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-1.5", children: [
              wh.managerName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-semibold text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 12 }),
                " ",
                wh.managerName
              ] }),
              wh.managerPhone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-semibold text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 12 }),
                " ",
                wh.managerPhone
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-4 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-[9px] font-black uppercase tracking-widest", onClick: () => openEditWh(wh), children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 11, className: "mr-1" }),
                " ",
                t("warehouses.edit_warehouse")
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-[9px] font-black uppercase tracking-widest text-destructive hover:text-destructive", onClick: () => {
                setDeleteTarget(wh);
                setShowDeleteConfirm(true);
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11, className: "mr-1" }),
                " ",
                t("warehouses.delete")
              ] })
            ] })
          ] }, wh.id)),
          warehouses.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full p-12 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Warehouse, { size: 32, className: "mx-auto mb-3 text-muted-foreground/30" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.no_warehouses") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "mt-4", onClick: openCreateWh, children: t("warehouses.create_first") })
          ] })
        ] })
      ] }),
      activeTab === "inventory" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: [
              t("warehouses.warehouse_name"),
              ":"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "select",
              {
                value: selectedWarehouse || "",
                onChange: (e) => setSelectedWarehouse(Number(e.target.value)),
                className: "h-9 px-3 rounded-xl border bg-background text-xs font-bold",
                children: warehouses.map((wh) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: wh.id, children: wh.name }, wh.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 max-w-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: t("warehouses.search_items"),
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                className: "h-9 pl-9 text-xs rounded-xl"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-[10px] font-black uppercase tracking-widest", onClick: () => {
            setAdjustForm({ warehouseId: selectedWarehouse || 0, itemId: 0, quantity: 0 });
            setShowAdjustModal(true);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 14, className: "mr-2" }),
            " ",
            t("warehouses.set_quantity")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-[10px] font-black uppercase tracking-widest", onClick: () => {
            loadInventory(selectedWarehouse);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "mr-2" }),
            " ",
            t("warehouses.refresh")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.item") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.item_category") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.quantity") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.unit") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.unit_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.total_value") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            (searchQuery ? inventory.filter(
              (i) => i.itemName?.toLowerCase().includes(searchQuery.toLowerCase()) || i.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
            ) : inventory).map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/20 hover:bg-muted/20 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-4", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-tight", children: inv.itemName }),
                inv.companyName && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-muted-foreground", children: inv.companyName })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-semibold", children: inv.categoryName || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: inv.quantity < 10 ? "destructive" : "default", className: "text-[10px] font-black", children: inv.quantity || 0 }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-semibold", children: inv.baseUnit || "pcs" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-4 text-[10px] font-semibold", children: [
                "ETB ",
                inv.baseSellingPrice?.toLocaleString() || 0
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-4 text-[10px] font-black", children: [
                "ETB ",
                ((inv.quantity || 0) * (inv.baseSellingPrice || 0)).toLocaleString()
              ] })
            ] }, inv.id)),
            inventory.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.no_inventory") }) }) })
          ] })
        ] }) }) })
      ] }),
      activeTab === "transfers" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.transfer_history") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-9 px-5 text-[10px] font-black uppercase tracking-widest", onClick: () => {
            setTransferForm({ fromWarehouseId: 0, toWarehouseId: 0, itemId: 0, quantity: 0, notes: "", transferredBy: "" });
            setShowTransferModal(true);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { size: 14, className: "mr-2" }),
            " ",
            t("warehouses.new_transfer")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.from") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.to") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.item") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.qty") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.status") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.notes") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            transfers.map((tr) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/20 hover:bg-muted/20 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-semibold", children: formatDate(tr.createdAt) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[9px] font-black", children: tr.fromWarehouseName }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", className: "text-[9px] font-black", children: tr.toWarehouseName }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-tight", children: tr.itemName }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-black", children: tr.quantity }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: tr.status === "completed" ? "default" : "secondary", className: "text-[9px] font-black uppercase", children: tr.status }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] text-muted-foreground", children: tr.notes || "-" })
            ] }, tr.id)),
            transfers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.no_transfers") }) }) })
          ] })
        ] }) }) })
      ] }),
      activeTab === "movements" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: [
              t("warehouses.warehouse_name"),
              ":"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "select",
              {
                value: selectedWarehouse || "",
                onChange: (e) => setSelectedWarehouse(Number(e.target.value)),
                className: "h-9 px-3 rounded-xl border bg-background text-xs font-bold",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("warehouses.all_warehouses") }),
                  warehouses.map((wh) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: wh.id, children: wh.name }, wh.id))
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-[10px] font-black uppercase tracking-widest", onClick: loadMovements, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "mr-2" }),
            " ",
            t("warehouses.refresh")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-2xl border bg-card/40 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50 text-[9px] font-black uppercase tracking-widest text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.title") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.item") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.type") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.quantity") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.reference") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4", children: t("warehouses.notes") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
            movements.map((mv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/20 hover:bg-muted/20 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] font-semibold", children: formatDateTime(mv.createdAt) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-[9px] font-black", children: mv.warehouseName }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-tight", children: mv.itemName }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: mv.type === "transfer_in" ? "default" : mv.type === "transfer_out" ? "secondary" : "outline", className: "text-[9px] font-black uppercase", children: mv.type.replace("_", " ") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-xs font-black", children: mv.quantity }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] text-muted-foreground", children: mv.referenceType || "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-[10px] text-muted-foreground max-w-[200px] truncate", title: mv.notes, children: mv.notes || "-" })
            ] }, mv.id)),
            movements.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.no_movements_recorded") }) }) })
          ] })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showWarehouseModal, onClose: () => setShowWarehouseModal(false), title: editingWh ? t("warehouses.edit_warehouse") : t("warehouses.new_warehouse"), size: "md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
          t("warehouses.warehouse_name"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: whForm.name, onChange: (e) => setWhForm({ ...whForm, name: e.target.value }), placeholder: "e.g. Main Warehouse" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.warehouse_location") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: whForm.location, onChange: (e) => setWhForm({ ...whForm, location: e.target.value }), placeholder: "e.g. Headquarters" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.manager_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: whForm.managerName, onChange: (e) => setWhForm({ ...whForm, managerName: e.target.value }), placeholder: "e.g. John Doe" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.manager_phone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: whForm.managerPhone, onChange: (e) => setWhForm({ ...whForm, managerPhone: e.target.value }), placeholder: "e.g. +251..." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: "Email" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: whForm.email, onChange: (e) => setWhForm({ ...whForm, email: e.target.value }), placeholder: "e.g. warehouse@shega.tech", type: "email" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-12 font-black uppercase text-[10px] tracking-widest", onClick: handleSaveWarehouse, children: editingWh ? t("warehouses.update_warehouse") : t("warehouses.create_warehouse") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-12 font-black uppercase text-[10px] tracking-widest", onClick: () => setShowWarehouseModal(false), children: t("common.cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showTransferModal, onClose: () => setShowTransferModal(false), title: t("warehouses.transfer_stock"), size: "md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
            t("warehouses.source"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: transferForm.fromWarehouseId,
              onChange: (e) => setTransferForm({ ...transferForm, fromWarehouseId: Number(e.target.value) }),
              className: "w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("warehouses.select_source") }),
                warehouses.filter((w) => w.isActive).map((wh) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: wh.id, children: wh.name }, wh.id))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
            t("warehouses.destination"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "select",
            {
              value: transferForm.toWarehouseId,
              onChange: (e) => setTransferForm({ ...transferForm, toWarehouseId: Number(e.target.value) }),
              className: "w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("warehouses.select_destination") }),
                warehouses.filter((w) => w.isActive).map((wh) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: wh.id, children: wh.name }, wh.id))
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
          t("warehouses.item"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: transferForm.itemId,
            onChange: (e) => setTransferForm({ ...transferForm, itemId: Number(e.target.value) }),
            className: "w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("warehouses.select_item") }),
              items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: item.id, children: [
                item.name,
                " ",
                item.companyName ? `(${item.companyName})` : ""
              ] }, item.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: [
          t("warehouses.quantity"),
          " *"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 1, value: transferForm.quantity || "", onChange: (e) => setTransferForm({ ...transferForm, quantity: Number(e.target.value) }), placeholder: "e.g. 50" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.transferred_by") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: transferForm.transferredBy, onChange: (e) => setTransferForm({ ...transferForm, transferredBy: e.target.value }), placeholder: "e.g. Operations Manager" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.notes") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: transferForm.notes,
            onChange: (e) => setTransferForm({ ...transferForm, notes: e.target.value }),
            className: "w-full h-20 px-3 py-2 rounded-xl border bg-background text-xs font-semibold resize-none",
            placeholder: t("warehouses.optional_notes")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 h-12 font-black uppercase text-[10px] tracking-widest", onClick: handleTransfer, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRightLeft, { size: 14, className: "mr-2" }),
          " ",
          t("warehouses.execute_transfer")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-12 font-black uppercase text-[10px] tracking-widest", onClick: () => setShowTransferModal(false), children: t("common.cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showAdjustModal, onClose: () => setShowAdjustModal(false), title: t("warehouses.set_inventory_qty"), size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: adjustForm.warehouseId,
            onChange: (e) => setAdjustForm({ ...adjustForm, warehouseId: Number(e.target.value) }),
            className: "w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("warehouses.select_warehouse") }),
              warehouses.map((wh) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: wh.id, children: wh.name }, wh.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.item") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "select",
          {
            value: adjustForm.itemId,
            onChange: (e) => setAdjustForm({ ...adjustForm, itemId: Number(e.target.value) }),
            className: "w-full h-10 px-3 rounded-xl border bg-background text-xs font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: 0, children: t("warehouses.select_item") }),
              items.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: item.id, children: item.name }, item.id))
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-black uppercase tracking-widest text-muted-foreground", children: t("warehouses.new_qty") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: 0, value: adjustForm.quantity || "", onChange: (e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) }), placeholder: "e.g. 100" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 h-12 font-black uppercase text-[10px] tracking-widest", onClick: handleAdjustInventory, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { size: 14, className: "mr-2" }),
          " ",
          t("warehouses.set_quantity")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-12 font-black uppercase text-[10px] tracking-widest", onClick: () => setShowAdjustModal(false), children: t("common.cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: showDeleteConfirm, onOpenChange: setShowDeleteConfirm, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { children: t("warehouses.delete_title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("warehouses.delete_desc").replace("{name}", deleteTarget?.name || "") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { onClick: () => setDeleteTarget(null), children: t("common.cancel") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogAction, { onClick: handleDeleteWarehouse, className: "bg-destructive text-destructive-foreground hover:bg-destructive/90", children: t("warehouses.delete") })
      ] })
    ] }) })
  ] });
};
export {
  Warehouses as default
};

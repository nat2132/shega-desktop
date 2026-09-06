import { b as useSettings, r as reactExports, j as jsxRuntimeExports, P as Package, e as Button, q as Eye, l as RotateCcw, s as Trash2, v as Sheet, w as SheetTrigger, F as Filter, i as Badge, x as SheetContent, y as SheetHeader, z as SheetTitle, A as SheetDescription, D as SheetFooter, G as SheetClose, H as FileText, M as Modal, J as Input, X, n as Truck, K as ShieldAlert, N as ShoppingCart, O as Download, Q as toast, U as playSound } from "./index-C0Jx5v6F.js";
import { e as exportCSV, a as exportPDF, E, b as addPdfHeader, c as autoTable } from "./export-utils-XuP3qsRX.js";
import { S as SectionCards } from "./section-cards-BaMZJRZ5.js";
import { D as DataTable } from "./data-table-OKNan3f8.js";
import { D as DatePicker } from "./DatePicker-Bu376zBZ.js";
import { c as computeTrend } from "./trend-utils-D_UP5BUt.js";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-Dx0ONkN1.js";
import { S as Switch } from "./switch-D4JwN50Z.js";
import { L as Label } from "./label-PBX5Yn39.js";
import { T as Textarea } from "./textarea-CY8EFjwR.js";
import { A as AlertDialog, a as AlertDialogContent, b as AlertDialogHeader, c as AlertDialogTitle, d as AlertDialogDescription, e as AlertDialogFooter, f as AlertDialogCancel, g as AlertDialogAction } from "./alert-dialog-BqNqq2Wo.js";
import { P as Plus } from "./plus-6p1sfnA0.js";
import { B as Boxes } from "./boxes-353KYFs5.js";
import { D as DollarSign } from "./dollar-sign-Bl7iAsRL.js";
import "./card-CjgAuJMU.js";
import "./trending-up-Dh0JhE0R.js";
import "./table-5J6R_qr8.js";
import "./tabs-Br1nI3Mr.js";
const Inventory = () => {
  const { t, formatDate, currentBusiness } = useSettings();
  const [items, setItems] = reactExports.useState([]);
  const [categories, setCategories] = reactExports.useState([]);
  const [suppliers, setSuppliers] = reactExports.useState([]);
  const [showModal, setShowModal] = reactExports.useState(false);
  const [showDetailsModal, setShowDetailsModal] = reactExports.useState(false);
  const [editingItem, setEditingItem] = reactExports.useState(null);
  const [viewingItem, setViewingItem] = reactExports.useState(null);
  const [searchQuery] = reactExports.useState("");
  const [deleteConfirmId, setDeleteConfirmId] = reactExports.useState(null);
  const [showPOModal, setShowPOModal] = reactExports.useState(false);
  const [poItems, setPOItems] = reactExports.useState([]);
  const [poSearchQuery, setPoSearchQuery] = reactExports.useState("");
  const [customItemName, setCustomItemName] = reactExports.useState("");
  const [customItemQty, setCustomItemQty] = reactExports.useState("1");
  const [customItemBrand, setCustomItemBrand] = reactExports.useState("");
  const [customItemSupplier, setCustomItemSupplier] = reactExports.useState("");
  const [filterStartDate, setFilterStartDate] = reactExports.useState("");
  const [filterEndDate, setFilterEndDate] = reactExports.useState("");
  const [filterCategory, setFilterCategory] = reactExports.useState("All");
  const [isFilterOpen, setIsFilterOpen] = reactExports.useState(false);
  const [showCreditOnly, setShowCreditOnly] = reactExports.useState(false);
  const [restockItem, setRestockItem] = reactExports.useState(null);
  const [restockQty, setRestockQty] = reactExports.useState("");
  const [expiryEnabled, setExpiryEnabled] = reactExports.useState(false);
  const [isNewCategory, setIsNewCategory] = reactExports.useState(false);
  const [newCategoryName, setNewCategoryName] = reactExports.useState("");
  const [formData, setFormData] = reactExports.useState({
    name: "",
    categoryId: "none",
    companyName: "",
    purchaseUnit: t("inventory.box"),
    baseUnit: t("inventory.piece"),
    unitsPerPack: "1",
    totalPackQuantity: "0",
    totalBaseQuantity: "0",
    packPurchasePrice: "0",
    basePurchasePrice: "0",
    baseSellingPrice: "",
    packSellingPrice: "0",
    allowSellByBaseUnit: true,
    allowSellByPackUnit: false,
    expiryDate: "",
    qualityGrade: "",
    notes: "",
    isCredit: false,
    supplierPhone: "",
    supplierId: "",
    reorderPoint: "10",
    reorderQty: "0",
    autoReorder: false
  });
  reactExports.useEffect(() => {
    loadData();
  }, [searchQuery, filterCategory, filterStartDate, filterEndDate]);
  reactExports.useEffect(() => {
    const packs = parseFloat(formData.totalPackQuantity) || 0;
    const upp = parseFloat(formData.unitsPerPack) || 1;
    setFormData((prev) => ({
      ...prev,
      totalBaseQuantity: String(packs * upp)
    }));
  }, [formData.totalPackQuantity, formData.unitsPerPack]);
  const loadData = async () => {
    const [itemsData, catsData, suppData] = await Promise.all([
      window.api?.getItems({ search: searchQuery, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate }) || Promise.resolve([]),
      window.api?.getCategories() || Promise.resolve([]),
      window.api?.getSuppliers({ limit: 500 }) || Promise.resolve({ rows: [] })
    ]);
    setItems(Array.isArray(itemsData) ? itemsData : []);
    setCategories(Array.isArray(catsData) ? catsData : []);
    setSuppliers(suppData?.rows || []);
  };
  const kpiCards = reactExports.useMemo(() => {
    const totalValue = items.reduce((sum, item) => sum + item.totalBaseQuantity * item.basePurchasePrice, 0);
    const lowStock = items.filter((i) => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10).length;
    const outOfStock = items.filter((i) => i.totalBaseQuantity <= 0).length;
    const valueTrend = computeTrend(items, "createdAt", (i) => i.totalBaseQuantity * i.basePurchasePrice);
    const lowTrend = computeTrend(items, "createdAt", (i) => i.totalBaseQuantity > 0 && i.totalBaseQuantity < 10 ? 1 : 0);
    const depletTrend = computeTrend(items, "createdAt", (i) => i.totalBaseQuantity <= 0 ? 1 : 0);
    const skuTrend = computeTrend(items, "createdAt", () => 1);
    return [
      {
        title: t("inventory.value"),
        value: `${t("common.etb")} ${totalValue.toLocaleString()}`,
        ...valueTrend,
        footerTitle: t("inventory.value_inc"),
        footerSub: t("customers.last_30")
      },
      {
        title: t("inventory.low"),
        value: lowStock,
        ...lowTrend,
        footerTitle: t("inventory.refill_needed"),
        footerSub: t("inventory.critical_priority")
      },
      {
        title: t("inventory.depleted"),
        value: outOfStock,
        ...depletTrend,
        footerTitle: t("inventory.immediate_action"),
        footerSub: t("inventory.lost_sales")
      },
      {
        title: t("inventory.total_skus"),
        value: items.length,
        ...skuTrend,
        footerTitle: t("inventory.catalog_growth"),
        footerSub: t("inventory.new_items")
      }
    ];
  }, [items]);
  const displayItems = reactExports.useMemo(() => {
    return showCreditOnly ? items.filter((i) => i.isCredit === 1) : items;
  }, [items, showCreditOnly]);
  const columns = [
    {
      accessorKey: "name",
      header: t("inventory.product_details"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-5 w-5 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: row.original.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground uppercase font-bold tracking-widest", children: [
            row.original.categoryName || t("inventory.general"),
            " • ",
            row.original.companyName || t("inventory.no_brand")
          ] })
        ] })
      ] })
    },
    {
      accessorKey: "totalBaseQuantity",
      header: t("inventory.stock_ledger"),
      cell: ({ row }) => {
        const baseQty = row.original.totalBaseQuantity;
        const packQty = row.original.totalPackQuantity;
        const fmt = (n) => n == null ? "0" : parseFloat(n.toFixed(2)).toString();
        const statusKey = baseQty <= 0 ? "inventory.depleted" : baseQty < 10 ? "inventory.low" : "inventory.healthy";
        const status = t(statusKey);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 w-40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs font-bold uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              fmt(baseQty),
              " ",
              row.original.baseUnit,
              " / ",
              fmt(packQty),
              " ",
              row.original.purchaseUnit
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: statusKey === "inventory.depleted" ? "text-destructive" : statusKey === "inventory.low" ? "text-yellow-500" : "text-green-500", children: status })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-full bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `h-full rounded-full ${statusKey === "inventory.depleted" ? "bg-destructive" : statusKey === "inventory.low" ? "bg-yellow-500" : "bg-primary"}`,
              style: { width: `${Math.min(100, baseQty / 50 * 100)}%` }
            }
          ) })
        ] });
      }
    },
    {
      accessorKey: "supplierName",
      header: t("suppliers.col_supplier"),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-sm", children: row.original.supplierName || "-" }),
        row.original.supplierName && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: t("inventory.supplier_lifecycle") })
      ] })
    },
    {
      accessorKey: "baseSellingPrice",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("inventory.valuation") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-sm", children: [
          t("common.etb"),
          " ",
          row.original.baseSellingPrice.toLocaleString(),
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            "/ ",
            row.original.baseUnit
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1", children: [
          t("inventory.margin"),
          ": ",
          row.original.baseSellingPrice > 0 ? ((Number(row.original.baseSellingPrice || 0) - Number(row.original.basePurchasePrice || 0)) / Number(row.original.baseSellingPrice || 0) * 100).toFixed(0) : 0,
          "%"
        ] })
      ] })
    },
    {
      id: "actions",
      header: () => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right", children: t("common.actions") }),
      cell: ({ row }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
          setViewingItem(row.original);
          setShowDetailsModal(true);
        }, title: t("common.view"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => openEdit(row.original), title: t("common.edit"), children: t("common.edit") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => {
          setRestockItem(row.original);
          setRestockQty("");
        }, title: t("inventory.restock", "Restock"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            className: "text-destructive hover:bg-destructive/10",
            onClick: () => setDeleteConfirmId(row.original.id),
            title: t("common.delete"),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
          }
        )
      ] })
    }
  ];
  const resetForm = () => {
    setFormData({
      name: "",
      categoryId: "none",
      companyName: "",
      purchaseUnit: t("inventory.box"),
      baseUnit: t("inventory.piece"),
      unitsPerPack: "1",
      totalPackQuantity: "0",
      totalBaseQuantity: "0",
      packPurchasePrice: "0",
      basePurchasePrice: "0",
      baseSellingPrice: "",
      packSellingPrice: "0",
      allowSellByBaseUnit: true,
      allowSellByPackUnit: false,
      expiryDate: "",
      qualityGrade: "",
      notes: "",
      isCredit: false,
      supplierPhone: "",
      supplierId: "",
      reorderPoint: "10",
      reorderQty: "0",
      autoReorder: false
    });
    setIsNewCategory(false);
    setNewCategoryName("");
    setExpiryEnabled(false);
  };
  const openEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryId: item.categoryId ? String(item.categoryId) : "none",
      companyName: item.companyName || "",
      purchaseUnit: item.purchaseUnit || t("inventory.box"),
      baseUnit: item.baseUnit || t("inventory.piece"),
      unitsPerPack: String(item.unitsPerPack || 1),
      totalPackQuantity: String(item.totalPackQuantity || 0),
      totalBaseQuantity: String(item.totalBaseQuantity || 0),
      packPurchasePrice: String(item.packPurchasePrice || 0),
      basePurchasePrice: String(item.basePurchasePrice || 0),
      baseSellingPrice: String(item.baseSellingPrice || 0),
      packSellingPrice: String(item.packSellingPrice || 0),
      allowSellByBaseUnit: !!item.allowSellByBaseUnit,
      allowSellByPackUnit: !!item.allowSellByPackUnit,
      expiryDate: item.expiryDate || "",
      qualityGrade: item.qualityGrade || "",
      notes: item.notes || "",
      isCredit: !!item.isCredit,
      supplierPhone: item.supplierPhone || "",
      supplierId: item.supplierId ? String(item.supplierId) : "",
      reorderPoint: String(item.reorderPoint ?? 10),
      reorderQty: String(item.reorderQty ?? 0),
      autoReorder: !!item.autoReorder
    });
    setExpiryEnabled(!!item.expiryDate);
    setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t("inventory.product_name_required", "Product name is required"));
      return;
    }
    const basePrice = parseFloat(formData.baseSellingPrice) || 0;
    if (basePrice <= 0 && parseFloat(formData.packSellingPrice) <= 0) {
      toast.error(t("inventory.selling_price_required", "At least one selling price is required"));
      return;
    }
    const baseCost = parseFloat(formData.basePurchasePrice) || 0;
    const packPrice = parseFloat(formData.packSellingPrice) || 0;
    const packCost = parseFloat(formData.packPurchasePrice) || 0;
    let finalCategoryId = formData.categoryId && formData.categoryId !== "none" && !isNaN(parseInt(formData.categoryId)) ? parseInt(formData.categoryId) : null;
    if (isNewCategory && newCategoryName.trim()) {
      const newCatId = await window.api?.insertCategory(newCategoryName.trim());
      if (newCatId) {
        finalCategoryId = newCatId;
      }
    }
    const item = {
      ...formData,
      categoryId: finalCategoryId,
      unitsPerPack: parseFloat(formData.unitsPerPack) || 1,
      totalPackQuantity: parseFloat(formData.totalPackQuantity) || 0,
      totalBaseQuantity: parseFloat(formData.totalBaseQuantity) || 0,
      packPurchasePrice: packCost,
      basePurchasePrice: baseCost,
      baseSellingPrice: basePrice,
      packSellingPrice: packPrice,
      allowSellByBaseUnit: formData.allowSellByBaseUnit ? 1 : 0,
      allowSellByPackUnit: formData.allowSellByPackUnit ? 1 : 0,
      isCredit: formData.isCredit ? 1 : 0,
      supplierId: formData.supplierId ? parseInt(formData.supplierId) : null
    };
    if (editingItem) {
      await window.api?.updateItem(editingItem.id, item);
    } else {
      await window.api?.insertItem(item);
    }
    playSound("nice");
    setShowModal(false);
    setEditingItem(null);
    resetForm();
    loadData();
  };
  const handleDelete = async () => {
    if (deleteConfirmId) {
      await window.api?.deleteItem(deleteConfirmId);
      setDeleteConfirmId(null);
      loadData();
    }
  };
  const handleRestock = async () => {
    if (!restockItem || !restockQty || parseInt(restockQty) <= 0) return;
    await window.api?.restockItem(restockItem.id, parseInt(restockQty));
    setRestockItem(null);
    setRestockQty("");
    loadData();
  };
  const baseProfit = (parseFloat(formData.baseSellingPrice) || 0) - (parseFloat(formData.basePurchasePrice) || 0);
  const packProfit = (parseFloat(formData.packSellingPrice) || 0) - (parseFloat(formData.packPurchasePrice) || 0);
  const baseMargin = (parseFloat(formData.baseSellingPrice) || 0) > 0 ? (baseProfit / parseFloat(formData.baseSellingPrice) * 100).toFixed(1) : "0";
  const packMargin = (parseFloat(formData.packSellingPrice) || 0) > 0 ? (packProfit / parseFloat(formData.packSellingPrice) * 100).toFixed(1) : "0";
  const openPOCreator = () => {
    const lowStockItems = items.filter((i) => i.totalBaseQuantity < 10);
    setPOItems(lowStockItems.map((i) => ({
      ...i,
      orderQty: i.unitsPerPack * 5
    })));
    setPoSearchQuery("");
    setShowPOModal(true);
  };
  const addToPO = (item) => {
    setPOItems((prev) => {
      if (prev.find((p) => p.id === item.id)) return prev;
      return [...prev, { ...item, orderQty: item.unitsPerPack * 5 }];
    });
  };
  const addCustomItemToPO = () => {
    if (!customItemName.trim()) return;
    const supplierMatch = suppliers.find(
      (s) => s.supplierName?.toLowerCase() === customItemSupplier.trim().toLowerCase()
    );
    const fakeItem = {
      id: -Date.now(),
      name: customItemName.trim(),
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      categoryId: 0,
      categoryName: "",
      companyName: customItemBrand.trim(),
      purchaseUnit: "pack",
      baseUnit: "unit",
      unitsPerPack: 1,
      totalPackQuantity: 0,
      totalBaseQuantity: 0,
      packPurchasePrice: 0,
      basePurchasePrice: 0,
      baseSellingPrice: 0,
      packSellingPrice: 0,
      allowSellByBaseUnit: 1,
      allowSellByPackUnit: 0,
      expiryDate: "",
      qualityGrade: "",
      notes: "",
      isCredit: 0,
      supplierPhone: "",
      supplierId: supplierMatch ? supplierMatch.id : 0,
      supplierName: customItemSupplier.trim(),
      lastPurchaseDate: "",
      lastPurchasePrice: 0,
      orderQty: parseInt(customItemQty) || 1
    };
    setPOItems((prev) => [...prev, fakeItem]);
    setCustomItemName("");
    setCustomItemQty("1");
    setCustomItemBrand("");
  };
  const updatePOSupplier = (id, supplierName) => {
    const trimmed = supplierName.trim();
    const match = suppliers.find((s) => s.supplierName?.toLowerCase() === trimmed.toLowerCase());
    setPOItems((prev) => prev.map(
      (item) => item.id === id ? { ...item, supplierName: trimmed, supplierId: match ? match.id : 0 } : item
    ));
  };
  const updatePOBrand = (id, brand) => {
    setPOItems((prev) => prev.map((item) => item.id === id ? { ...item, companyName: brand } : item));
  };
  const updatePOQty = (id, qty) => {
    setPOItems((prev) => prev.map(
      (item) => item.id === id ? { ...item, orderQty: Math.max(0, qty) } : item
    ));
  };
  const removeFromPO = (id) => {
    setPOItems((prev) => prev.filter((item) => item.id !== id));
  };
  const generatePOPDF = () => {
    const doc = new E();
    const y0 = addPdfHeader(doc, currentBusiness, 8);
    const date = formatDate(/* @__PURE__ */ new Date());
    let y = y0 + 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(t("inventory.po_title", "PURCHASE ORDER"), 105, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${t("inventory.po_date_label", "Date")}: ${date}`, 190, y, { align: "right" });
    y += 4;
    const tableData = poItems.map((item, index) => [
      index + 1,
      item.name,
      item.companyName || t("common.not_available"),
      item.supplierName || t("common.not_available"),
      `${item.orderQty} ${item.baseUnit}`
    ]);
    const totalCost = poItems.reduce((sum, item) => sum + item.orderQty * item.basePurchasePrice, 0);
    autoTable(doc, {
      startY: y,
      head: [[t("inventory.po_col_hash", "#"), t("inventory.po_col_product", "Product"), t("inventory.po_col_brand", "Brand"), t("inventory.po_col_supplier", "Supplier"), t("inventory.po_col_quantity", "Quantity")]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [0, 0, 0] }
    });
    const finalY = doc.lastAutoTable?.finalY ?? y + poItems.length * 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(`${t("inventory.po_total_cost", "TOTAL COST")}: ${t("common.etb")} ${totalCost.toLocaleString()}`, 190, finalY + 8, { align: "right" });
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(t("inventory.po_auto_generated", "This is an automatically generated purchase order by Shega Retail POS."), 105, 280, { align: "center" });
    doc.save(`${t("inventory.po_filename", "Purchase_Order")}_${date.replace(/\//g, "-")}.pdf`);
  };
  const exportInventoryCSV = () => {
    const h = [t("common.name", "Name"), t("common.category"), t("inventory.base_qty", "Base Qty"), t("inventory.base_unit"), t("inventory.selling_price", "Selling Price"), t("inventory.purchase_price", "Purchase Price")];
    const r = items.map((i) => [i.name, i.categoryName || "", i.totalBaseQuantity, i.baseUnit, i.baseSellingPrice, i.basePurchasePrice]);
    exportCSV(h, r, "inventory");
  };
  const exportInventoryPDF = () => {
    const h = [t("common.name", "Name"), t("common.category"), t("inventory.base_qty", "Base Qty"), t("inventory.base_unit"), t("inventory.selling_price", "Selling Price"), t("inventory.purchase_price", "Purchase Price")];
    const r = items.map((i) => [i.name, i.categoryName || "", String(i.totalBaseQuantity), i.baseUnit, String(i.baseSellingPrice), String(i.basePurchasePrice)]);
    exportPDF(t("data_transfer.inventory_report"), h, r, "inventory", void 0, void 0, currentBusiness);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SectionCards, { cards: kpiCards }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("inventory.terminal") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-2xl font-black tracking-tighter uppercase", children: t("inventory.header") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open: isFilterOpen, onOpenChange: setIsFilterOpen, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: `h-8 px-3 transition-all ${filterCategory !== "All" || filterStartDate || filterEndDate ? "border-primary text-primary bg-primary/5 shadow-sm" : "border-border/60 hover:bg-muted/50"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Filter, { className: "mr-1.5 h-3.5 w-3.5" }),
              t("inventory.filters"),
              " ",
              (filterCategory !== "All" || filterStartDate || filterEndDate) && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "ml-1.5 h-4 px-1 text-xs rounded-full", children: t("inventory.active") })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "right", className: "w-[400px] sm:w-[540px] border-l-border/40 p-0 flex flex-col", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "border-b border-border/50 p-6", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-2xl font-black uppercase tracking-tight", children: t("inventory.data_filters") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-xs font-bold text-muted-foreground uppercase tracking-widest", children: t("inventory.refine_view") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 p-6 flex-1 overflow-y-auto", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("inventory.classification") }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterCategory, onValueChange: setFilterCategory, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-12 bg-muted/30 border-border/50 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("inventory.all_categories") }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "All", children: t("inventory.all_categories") }),
                      categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.name, children: c.name }, c.id))
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("inventory.timeframe") }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("inventory.start_date") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterStartDate, onChange: setFilterStartDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: t("inventory.end_date") }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: filterEndDate, onChange: setFilterEndDate, className: "h-10 bg-muted/30 border-border/50 rounded-xl text-xs w-full" })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic mt-1 leading-tight", children: t("inventory.date_filter_note") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-black uppercase tracking-[0.3em] text-primary", children: t("inventory.credit_filter") || "Credit" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 rounded-xl border bg-muted/30", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "credit-filter", checked: showCreditOnly, onCheckedChange: setShowCreditOnly }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "credit-filter", className: "text-xs font-black uppercase tracking-widest", children: t("on_credit.title") })
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
                      setFilterCategory("All");
                      setFilterStartDate("");
                      setFilterEndDate("");
                    },
                    children: t("inventory.reset_all")
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 py-3 tracking-widest rounded-xl shadow-xl", children: t("inventory.apply_filters") }) })
              ] }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: openPOCreator, className: "border-primary/20 text-primary hover:bg-primary/5 h-8 px-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "mr-1.5 h-3.5 w-3.5" }),
            " ",
            t("inventory.create_po")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { "data-tutorial-section": "add-item-btn", size: "sm", onClick: () => {
            resetForm();
            setEditingItem(null);
            setShowModal(true);
          }, className: "h-8 px-4 shadow-md shadow-primary/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
            " ",
            t("inventory.add_product")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DataTable,
        {
          columns,
          data: displayItems,
          title: t("inventory.header")
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 justify-end mt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportInventoryCSV, className: "h-7 text-xs font-bold tracking-widest px-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11, className: "mr-1" }),
          " ",
          t("common.csv")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: exportInventoryPDF, className: "h-7 text-xs font-bold tracking-widest px-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { size: 11, className: "mr-1" }),
          " ",
          t("common.pdf")
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showModal, onClose: () => setShowModal(false), title: editingItem ? t("inventory.refine_ledger") : t("inventory.register_new"), size: "xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, className: "space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 pb-2.5 border-b border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase tracking-[0.2em] text-primary", children: t("inventory.primary_identity") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
            t("inventory.product_narrative"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: t("inventory.placeholder_product"), className: "h-11 text-sm font-semibold rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.brand") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.companyName, onChange: (e) => setFormData({ ...formData, companyName: e.target.value }), placeholder: t("inventory.placeholder_brand"), className: "h-11 text-sm rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.quality") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.qualityGrade, onChange: (e) => setFormData({ ...formData, qualityGrade: e.target.value }), placeholder: t("inventory.placeholder_quality"), className: "h-11 text-sm rounded-xl" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.reorder_point") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", value: formData.reorderPoint, onChange: (e) => setFormData({ ...formData, reorderPoint: e.target.value }), className: "h-11 text-sm rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.reorder_qty") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", value: formData.reorderQty, onChange: (e) => setFormData({ ...formData, reorderQty: e.target.value }), className: "h-11 text-sm rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 flex items-end pb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm font-semibold cursor-pointer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: formData.autoReorder, onChange: (e) => setFormData({ ...formData, autoReorder: e.target.checked }), className: "h-4 w-4 rounded border-input" }),
            t("inventory.auto_reorder")
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("common.category") }),
          isNewCategory ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { autoFocus: true, value: newCategoryName, onChange: (e) => setNewCategoryName(e.target.value), placeholder: t("inventory.placeholder_category"), className: "h-11 text-sm rounded-xl flex-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "h-11 w-11 shrink-0 rounded-xl", onClick: () => {
              setIsNewCategory(false);
              setNewCategoryName("");
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.categoryId, onValueChange: (val) => setFormData({ ...formData, categoryId: val }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-11 text-sm rounded-xl w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("inventory.classification") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-xl", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: t("inventory.uncategorized") }),
                categories.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(c.id), children: c.name }, c.id))
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", size: "icon", onClick: () => setIsNewCategory(true), title: t("common.add"), className: "h-11 w-11 shrink-0 rounded-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-5 w-5 text-muted-foreground" }) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 pb-2.5 border-b border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Boxes, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-black uppercase tracking-[0.2em] text-primary", children: [
            t("tabs.logistics"),
            " & ",
            t("inventory.stock_ledger")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
              t("inventory.base_unit"),
              " (Individual)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.baseUnit, onChange: (e) => setFormData({ ...formData, baseUnit: e.target.value }), placeholder: t("inventory.placeholder_base_unit", "Piece/Kg"), className: "h-11 text-sm rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
              t("inventory.purchase_unit"),
              " (Pack/Bulk)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: formData.purchaseUnit, onChange: (e) => setFormData({ ...formData, purchaseUnit: e.target.value }), placeholder: t("inventory.placeholder_purchase_unit", "Box/Crate"), className: "h-11 text-sm rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.qty_per_pack") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: formData.unitsPerPack, onChange: (e) => setFormData({ ...formData, unitsPerPack: e.target.value }), className: "h-11 text-sm font-bold rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.stock_packs") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: formData.totalPackQuantity, onChange: (e) => setFormData({ ...formData, totalPackQuantity: e.target.value }), className: "h-11 text-sm font-bold rounded-xl" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 pb-2.5 border-b border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase tracking-[0.2em] text-primary", children: t("inventory.fiscal_config") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center pb-2 border-b border-border/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black uppercase tracking-wider text-foreground", children: [
                "Base Unit (",
                formData.baseUnit || "Unit",
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: "Sell Base" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: formData.allowSellByBaseUnit, onCheckedChange: (c) => setFormData({ ...formData, allowSellByBaseUnit: c }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.base_cost") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: formData.basePurchasePrice, onChange: (e) => setFormData({ ...formData, basePurchasePrice: e.target.value }), className: "h-10 text-sm font-semibold rounded-xl bg-background" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.base_price") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: formData.baseSellingPrice, onChange: (e) => setFormData({ ...formData, baseSellingPrice: e.target.value }), className: "h-10 text-sm font-semibold rounded-xl bg-background" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-green-500/10 border border-green-500/20 flex justify-between items-center text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-green-700 dark:text-green-400", children: [
                t("inventory.base_profit"),
                ": ",
                t("common.etb"),
                " ",
                baseProfit.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-400 text-xs font-bold", children: [
                baseMargin,
                "%"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl bg-muted/20 border border-border/50 space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center pb-2 border-b border-border/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-black uppercase tracking-wider text-foreground", children: [
                "Pack Unit (",
                formData.purchaseUnit || "Pack",
                ")"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: "Sell Pack" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: formData.allowSellByPackUnit, onCheckedChange: (c) => setFormData({ ...formData, allowSellByPackUnit: c }) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.pack_cost") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: formData.packPurchasePrice, onChange: (e) => setFormData({ ...formData, packPurchasePrice: e.target.value }), disabled: !formData.allowSellByPackUnit, className: "h-10 text-sm font-semibold rounded-xl bg-background disabled:opacity-50 disabled:cursor-not-allowed" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.pack_price") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: formData.packSellingPrice, onChange: (e) => setFormData({ ...formData, packSellingPrice: e.target.value }), disabled: !formData.allowSellByPackUnit, className: "h-10 text-sm font-semibold rounded-xl bg-background disabled:opacity-50 disabled:cursor-not-allowed" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-3 rounded-xl border flex justify-between items-center text-xs ${formData.allowSellByPackUnit ? "bg-blue-500/10 border-blue-500/20" : "bg-muted/30 border-border/40 opacity-50"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `font-bold ${formData.allowSellByPackUnit ? "text-blue-700 dark:text-blue-400" : "text-muted-foreground"}`, children: [
                t("inventory.pack_profit"),
                ": ",
                t("common.etb"),
                " ",
                packProfit.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: `text-xs font-bold ${formData.allowSellByPackUnit ? "bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400" : "text-muted-foreground"}`, children: [
                packMargin,
                "%"
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 pb-2.5 border-b border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { className: "h-4 w-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-black uppercase tracking-[0.2em] text-primary", children: t("inventory.supplier_lifecycle") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("suppliers.field_name") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: formData.supplierId ? String(formData.supplierId) : "", onValueChange: (v) => setFormData({ ...formData, supplierId: v }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-11 text-sm rounded-xl w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: t("suppliers.select_supplier") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl", children: suppliers.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: String(s.id), children: s.supplierName }, s.id)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.expiry_date") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: expiryEnabled, onCheckedChange: (on) => {
                setExpiryEnabled(on);
                if (!on) setFormData({ ...formData, expiryDate: "" });
              } })
            ] }),
            expiryEnabled && /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: formData.expiryDate, onChange: (e) => setFormData({ ...formData, expiryDate: e }), className: "h-11 text-sm rounded-xl" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 rounded-xl border border-border/50 bg-muted/20 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-5 w-5 text-amber-500 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-bold uppercase tracking-wider", children: t("inventory.credit_purchase") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Mark this product stock as acquired under supplier credit terms" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: formData.isCredit, onCheckedChange: (c) => setFormData({ ...formData, isCredit: c }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("common.operational_notes") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), placeholder: t("common.notes_placeholder"), className: "h-24 text-sm rounded-xl resize-none" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky bottom-0 -mx-6 -mb-6 p-6 bg-background/95 backdrop-blur-md border-t border-border/50 flex gap-4 z-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "flex-1 h-12 text-sm font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20", children: t("inventory.commit_ledger") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setShowModal(false), className: "h-12 px-8 text-sm font-semibold rounded-xl", children: t("common.abort") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showDetailsModal, onClose: () => setShowDetailsModal(false), title: t("inventory.specifications"), size: "lg", children: viewingItem && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-6 p-5 rounded-2xl bg-muted/30 border border-border/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 w-16 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-8 w-8 text-primary/40" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold tracking-tight truncate", children: viewingItem.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground truncate", children: [
            viewingItem.categoryName || t("inventory.general"),
            " • ",
            viewingItem.companyName || t("inventory.no_brand")
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "py-0.5 px-2.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0", children: viewingItem.qualityGrade || t("inventory.standard") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.base_unit") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: viewingItem.baseUnit })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.purchase_unit") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: viewingItem.purchaseUnit })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.qty_per_pack") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: viewingItem.unitsPerPack })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.expiry_date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: viewingItem.expiryDate || t("common.not_available") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5", children: t("inventory.stock_inventory") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-3.5 rounded-xl bg-primary/5 border border-primary/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: t("inventory.individual_stock") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-bold", children: [
              viewingItem.totalBaseQuantity != null ? parseFloat(viewingItem.totalBaseQuantity.toFixed(2)) : 0,
              " ",
              viewingItem.baseUnit
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center p-3.5 rounded-xl bg-muted/50 border border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold uppercase tracking-wider", children: t("inventory.bulk_stock") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-base font-bold", children: [
              viewingItem.totalPackQuantity != null ? parseFloat(viewingItem.totalPackQuantity.toFixed(2)) : 0,
              " ",
              viewingItem.purchaseUnit
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5", children: t("inventory.valuation") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.individual_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-primary", children: [
              t("common.etb"),
              " ",
              viewingItem.baseSellingPrice.toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("inventory.bulk_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-lg font-bold text-primary", children: [
              t("common.etb"),
              " ",
              viewingItem.packSellingPrice.toLocaleString()
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5", children: t("inventory.supplier_lifecycle") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("suppliers.col_supplier") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: viewingItem.supplierName || t("common.not_available") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.last_purchase_date") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: viewingItem.lastPurchaseDate || t("common.not_available") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.last_cost_price") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold", children: [
              t("common.etb"),
              " ",
              (viewingItem.lastPurchasePrice || 0).toLocaleString()
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 rounded-xl border border-border/40 bg-card/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.total_purchased") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold", children: viewingItem.totalPurchasedQuantity || 0 })
          ] })
        ] }),
        viewingItem.lastPurchaseOrderRef && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-muted/30 border border-border/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1", children: t("inventory.last_po_ref") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-bold font-mono", children: [
            viewingItem.lastPurchaseOrderRef,
            " ",
            viewingItem.lastPurchaseOrderDate ? `(${formatDate(viewingItem.lastPurchaseOrderDate)})` : ""
          ] })
        ] }),
        viewingItem.supplierId && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "w-full h-10 rounded-xl text-xs font-bold tracking-widest", onClick: () => {
          setShowDetailsModal(false);
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "mr-2 h-4 w-4" }),
          " ",
          t("inventory.create_po")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-1.5", children: t("common.operational_notes") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground italic leading-relaxed", children: viewingItem.notes || t("inventory.no_notes") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setShowDetailsModal(false), className: "w-full h-9 rounded-xl font-bold tracking-widest mt-2 text-xs", children: t("inventory.close_specs") })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showPOModal, onClose: () => setShowPOModal(false), title: t("inventory.po_draft"), size: "xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-primary/5 border border-primary/20 rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-8 w-8" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-black uppercase tracking-tight", children: t("inventory.replenishment") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
              t("common.in_session"),
              " ",
              poItems.length,
              " SKUs"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground mb-1", children: t("inventory.est_total_cost") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-2xl font-black", children: [
            t("common.etb"),
            " ",
            poItems.reduce((sum, item) => sum + item.orderQty * item.basePurchasePrice, 0).toLocaleString()
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-[24px] overflow-hidden bg-card/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-96 overflow-y-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-muted border-b sticky top-0 z-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-xs font-black uppercase tracking-widest bg-muted", children: t("inventory.product") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-xs font-black uppercase tracking-widest bg-muted", children: t("inventory.po_col_brand") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-xs font-black uppercase tracking-widest bg-muted", children: t("suppliers.col_supplier") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-xs font-black uppercase tracking-widest bg-muted", children: t("inventory.order_qty") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-4 text-xs font-black uppercase tracking-widest text-right bg-muted", children: t("common.actions") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y", children: [
            poItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm", children: item.name }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  className: "w-36 h-9 text-xs font-medium",
                  placeholder: t("inventory.placeholder_brand", "Brand"),
                  value: item.companyName || "",
                  onChange: (e) => updatePOBrand(item.id, e.target.value)
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  className: "w-40 h-9 text-xs font-medium",
                  list: "po-supplier-options",
                  placeholder: t("inventory.po_supplier_placeholder", "Supplier"),
                  value: item.supplierName || "",
                  onChange: (e) => updatePOSupplier(item.id, e.target.value)
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input,
                  {
                    type: "number",
                    className: "w-24 h-9 font-bold text-center",
                    value: item.orderQty,
                    onChange: (e) => updatePOQty(item.id, parseInt(e.target.value) || 0)
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold uppercase text-muted-foreground", children: [
                  item.baseUnit,
                  "s"
                ] })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => removeFromPO(item.id), className: "text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
            ] }, item.id)),
            poItems.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "p-12 text-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold uppercase tracking-widest text-xs", children: t("inventory.no_draft_items") }) }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("datalist", { id: "po-supplier-options", children: suppliers.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s.supplierName }, s.id)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            "data-tutorial-section": "po-search",
            placeholder: t("inventory.search_placeholder") || "Search products...",
            value: poSearchQuery,
            onChange: (e) => setPoSearchQuery(e.target.value),
            className: "flex-1 h-10"
          }
        ) }),
        poSearchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-[24px] overflow-hidden bg-card/40 max-h-48 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left border-collapse", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "bg-muted/50 border-b", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-xs font-black uppercase tracking-widest", children: t("inventory.product") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-xs font-black uppercase tracking-widest", children: t("inventory.po_col_brand") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-3 text-xs font-black uppercase tracking-widest text-right", children: t("common.actions") })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y", children: [
            items.filter((i) => i.name.toLowerCase().includes(poSearchQuery.toLowerCase()) && !poItems.find((p) => p.id === i.id)).slice(0, 10).map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/30 transition-colors", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold text-sm", children: item.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground uppercase font-black tracking-widest", children: item.companyName || t("inventory.no_brand") })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-3 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => addToPO(item), className: "text-xs font-bold", children: "+ Add" }) })
            ] }, item.id)),
            items.filter((i) => i.name.toLowerCase().includes(poSearchQuery.toLowerCase()) && !poItems.find((p) => p.id === i.id)).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 2, className: "p-6 text-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-bold uppercase tracking-widest text-xs", children: t("inventory.no_results") || "No results" }) }) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border border-border/50 bg-muted/20 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-4 w-4 text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-black uppercase tracking-[0.2em] text-primary", children: "Custom Line Item" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("inventory.custom_item_name", "Custom item name..."), value: customItemName, onChange: (e) => setCustomItemName(e.target.value), className: "h-10 text-sm rounded-xl" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: t("inventory.placeholder_brand", "Brand"), value: customItemBrand, onChange: (e) => setCustomItemBrand(e.target.value), className: "h-10 text-sm rounded-xl" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: customItemSupplier,
                onChange: (e) => setCustomItemSupplier(e.target.value),
                list: "po-supplier-options",
                placeholder: t("inventory.po_supplier_placeholder", "Search supplier or type new"),
                className: "flex-1 h-10 text-sm rounded-xl w-full"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", placeholder: t("inventory.placeholder_qty", "Qty"), value: customItemQty, onChange: (e) => setCustomItemQty(e.target.value), className: "w-full sm:w-28 h-10 text-sm font-bold rounded-xl" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: addCustomItemToPO, disabled: !customItemName.trim(), className: "w-full sm:w-auto h-10 px-5 text-xs font-bold uppercase tracking-wider rounded-xl shrink-0", children: [
              "+ ",
              t("inventory.add") || "Add"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: t("inventory.po_supplier_hint", "Pick an existing supplier or type a new one — it will be created with the order.") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 pt-3 border-t sticky bottom-0 bg-background/80 backdrop-blur-md pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            className: "flex-1 py-2.5 text-xs font-bold uppercase tracking-widest shadow-none",
            disabled: poItems.length === 0,
            onClick: async () => {
              if (poItems.length === 0) return;
              const missing = poItems.filter((it) => !it.supplierName || !it.supplierName.trim());
              if (missing.length > 0) {
                alert(t("inventory.po_supplier_required", "Each item needs a supplier. Set a supplier for every line before placing the order."));
                return;
              }
              const groupedBySupplier = {};
              for (const item of poItems) {
                const key = item.supplierName.trim().toLowerCase();
                if (!groupedBySupplier[key]) {
                  groupedBySupplier[key] = { supplierName: item.supplierName.trim(), supplierId: item.supplierId || 0, items: [] };
                }
                groupedBySupplier[key].items.push(item);
              }
              for (const group of Object.values(groupedBySupplier)) {
                const itemsPayload = group.items.map((it) => ({
                  itemId: it.id && it.id > 0 ? it.id : null,
                  itemName: it.name,
                  quantity: it.orderQty,
                  unit: it.baseUnit,
                  unitPrice: it.basePurchasePrice || 0
                }));
                const totalAmount = itemsPayload.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
                try {
                  await window.api?.insertSupplierPurchase({
                    supplierId: group.supplierId,
                    supplierName: group.supplierName,
                    purchaseDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                    totalAmount,
                    items: itemsPayload
                  });
                } catch (err) {
                  console.error("Failed to save purchase:", err);
                }
              }
              setShowPOModal(false);
              loadData();
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "mr-2 h-4 w-4" }),
              " ",
              t("suppliers.col_purchases")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            className: "flex-1 py-2.5 text-xs font-bold uppercase tracking-widest shadow-sm shadow-primary/20",
            disabled: poItems.length === 0,
            onClick: generatePOPDF,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-2 h-4 w-4" }),
              " ",
              t("inventory.gen_pdf")
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setShowPOModal(false), className: "py-2.5 px-3 text-xs border-none shadow-none", children: t("inventory.dismiss") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!deleteConfirmId, onOpenChange: (open) => !open && setDeleteConfirmId(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] border-border bg-background shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black tracking-tight uppercase", children: t("inventory.confirm_deletion") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: t("inventory.delete_warning") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "mt-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-none bg-muted/50 hover:bg-muted font-bold py-2.5", children: t("common.abort") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          AlertDialogAction,
          {
            onClick: handleDelete,
            className: "rounded-xl bg-destructive hover:bg-destructive/90 text-white font-bold py-2.5",
            children: t("common.delete")
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialog, { open: !!restockItem, onOpenChange: (open) => {
      if (!open) {
        setRestockItem(null);
        setRestockQty("");
      }
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogContent, { className: "rounded-[32px] border-border bg-background shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogHeader, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogTitle, { className: "text-xl font-black tracking-tight uppercase", children: t("inventory.restock_title") || "Restock" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogDescription, { children: restockItem ? `${restockItem.name} — ${t("inventory.restock_description") || "Enter quantity to add to current stock"}` : "" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input,
        {
          type: "number",
          min: "1",
          placeholder: t("inventory.restock_quantity_placeholder") || "Quantity",
          value: restockQty,
          onChange: (e) => setRestockQty(e.target.value),
          className: "text-lg font-bold h-12"
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(AlertDialogFooter, { className: "mt-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AlertDialogCancel, { className: "rounded-xl border-none bg-muted/50 hover:bg-muted font-bold py-2.5", children: t("common.cancel") || "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          AlertDialogAction,
          {
            onClick: handleRestock,
            className: "rounded-xl bg-primary hover:bg-primary/90 text-white font-bold py-2.5",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-2 h-4 w-4" }),
              " ",
              t("inventory.restock_confirm") || "Restock"
            ]
          }
        )
      ] })
    ] }) })
  ] });
};
export {
  Inventory as default
};

import { c as createLucideIcon, b as useSettings, r as reactExports, j as jsxRuntimeExports, a3 as Search, J as Input, e as Button, R as RefreshCw, n as Truck, a1 as User, aX as ArrowRight, X, s as Trash2, M as Modal, k as Clock, i as Badge, Q as toast } from "./index-BcwudWUj.js";
import { D as DatePicker } from "./DatePicker-CMW7pRtV.js";
import { P as Phone } from "./phone-B5zkkflA.js";
import { C as CalendarDays } from "./calendar-days-Bkyrlr_G.js";
import { P as Pen } from "./pen-DqRF2dXH.js";
import { M as MapPin } from "./map-pin-s7i5Mbnb.js";
import { C as CircleCheckBig } from "./circle-check-big-B3bZDL0M.js";
import { C as CircleX } from "./circle-x-KCTg0aoK.js";
import "./select-BztXyn8Q.js";
/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Navigation = createLucideIcon("Navigation", [
  ["polygon", { points: "3 11 22 2 13 21 11 13 3 11", key: "1ltx0t" }]
]);
const STATUSES = ["pending", "in_transit", "delivered", "cancelled"];
const statusConfig = {
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  in_transit: { label: "In Transit", variant: "default", icon: Navigation },
  delivered: { label: "Delivered", variant: "default", icon: CircleCheckBig },
  cancelled: { label: "Cancelled", variant: "destructive", icon: CircleX }
};
const Shipments = () => {
  const { t, formatDate, formatDateTime } = useSettings();
  const [shipments, setShipments] = reactExports.useState([]);
  const [selectedShipment, setSelectedShipment] = reactExports.useState(null);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [statusFilter, setStatusFilter] = reactExports.useState("");
  const [showShipmentModal, setShowShipmentModal] = reactExports.useState(false);
  const [showDetailModal, setShowDetailModal] = reactExports.useState(false);
  const [deleteTarget, setDeleteTarget] = reactExports.useState(null);
  const [editingShipment, setEditingShipment] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    origin: "",
    destination: "",
    driverName: "",
    driverPhone: "",
    vehicleInfo: "",
    notes: "",
    scheduledDate: ""
  });
  reactExports.useEffect(() => {
    loadShipments();
  }, []);
  const loadShipments = async () => {
    try {
      const opts = {};
      if (searchQuery) opts.search = searchQuery;
      if (statusFilter) opts.status = statusFilter;
      setShipments(await window.api.getShipments(opts) || []);
    } catch (err) {
      console.error(err);
    }
  };
  const openCreate = () => {
    setEditingShipment(null);
    setForm({ origin: "", destination: "", driverName: "", driverPhone: "", vehicleInfo: "", notes: "", scheduledDate: "" });
    setShowShipmentModal(true);
  };
  const openEdit = (s) => {
    setEditingShipment(s);
    setForm({
      origin: s.origin || "",
      destination: s.destination,
      driverName: s.driverName || "",
      driverPhone: s.driverPhone || "",
      vehicleInfo: s.vehicleInfo || "",
      notes: s.notes || "",
      scheduledDate: s.scheduledDate || ""
    });
    setShowShipmentModal(true);
  };
  const openDetail = async (id) => {
    try {
      const detail = await window.api.getShipment(id);
      setSelectedShipment(detail);
      setShowDetailModal(true);
    } catch (err) {
      console.error(err);
    }
  };
  const handleSave = async () => {
    if (!form.destination.trim()) return toast.error(t("shipments.fill_required"));
    try {
      if (editingShipment) {
        await window.api.updateShipment(editingShipment.id, form);
        toast.success(t("shipments.shipment_updated"));
      } else {
        await window.api.insertShipment(form);
        toast.success(t("shipments.shipment_created"));
      }
      setShowShipmentModal(false);
      loadShipments();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleStatusChange = async (id, status) => {
    try {
      await window.api.updateShipmentStatus(id, status);
      toast.success(t("shipments.status_updated"));
      loadShipments();
      if (selectedShipment?.id === id) openDetail(id);
    } catch (err) {
      toast.error(err.message);
    }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await window.api.deleteShipment(deleteTarget.id);
      toast.success(t("shipments.shipment_deleted"));
      setDeleteTarget(null);
      loadShipments();
    } catch (err) {
      toast.error(err.message);
    }
  };
  const nextStatus = (current) => {
    if (current === "pending") return "in_transit";
    if (current === "in_transit") return "delivered";
    return null;
  };
  const StatusBadge = ({ status }) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: config.variant, className: "text-xs font-black uppercase gap-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { size: 10 }),
      " ",
      t(`shipments.status_${status}`)
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 py-4 md:gap-6 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 flex-wrap", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 max-w-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            placeholder: t("shipments.search"),
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            className: "h-9 pl-9 text-xs rounded-xl"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "select",
        {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          className: "h-9 px-3 rounded-xl border bg-background text-xs font-bold",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: t("shipments.all_statuses") }),
            STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: t(`shipments.status_${s}`) }, s))
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "h-9 text-xs font-black uppercase tracking-widest", onClick: loadShipments, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 14, className: "mr-2" }),
        " ",
        t("shipments.refresh")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-9 px-5 text-xs font-black uppercase tracking-widest", onClick: openCreate, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 14, className: "mr-2" }),
        " ",
        t("shipments.new_shipment")
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: [
      shipments.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-5 rounded-2xl border-2 bg-card/40 border-muted hover:border-muted-foreground/30 transition-all group cursor-pointer overflow-hidden", onClick: () => openDetail(s.id), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 20 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-tight", children: s.destination }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-bold uppercase mt-0.5", children: s.origin || t("shipments.no_origin") })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: s.status })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 space-y-1.5", children: [
          s.driverName && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 12 }),
            " ",
            s.driverName
          ] }),
          s.driverPhone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 12 }),
            " ",
            s.driverPhone
          ] }),
          s.vehicleInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 12 }),
            " ",
            s.vehicleInfo
          ] }),
          s.scheduledDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { size: 12 }),
            " ",
            formatDate(s.scheduledDate)
          ] })
        ] }),
        s.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-muted-foreground line-clamp-2", children: s.notes }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mt-4 pt-3 border-t border-border/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-bold", children: formatDate(s.createdAt) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity", onClick: (e) => e.stopPropagation(), children: [
            !["delivered", "cancelled"].includes(s.status) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest", onClick: () => {
              const next = nextStatus(s.status);
              if (next) handleStatusChange(s.id, next);
            }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 11, className: "mr-1" }),
              " ",
              s.status === "pending" ? t("shipments.mark_in_transit") : t("shipments.mark_delivered")
            ] }),
            s.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest text-destructive", onClick: () => handleStatusChange(s.id, "cancelled"), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 11, className: "mr-1" }),
              " ",
              t("shipments.cancel")
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest", onClick: () => openEdit(s), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pen, { size: 11 }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "h-7 text-xs font-black uppercase tracking-widest text-destructive", onClick: () => {
              setDeleteTarget(s);
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { size: 11 }) })
          ] })
        ] })
      ] }, s.id)),
      shipments.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-full p-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 32, className: "mx-auto mb-3 text-muted-foreground/30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.no_shipments") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "mt-4", onClick: openCreate, children: t("shipments.create_first") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showShipmentModal, onClose: () => setShowShipmentModal(false), title: editingShipment ? t("shipments.edit_shipment") : t("shipments.new_shipment"), size: "md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.origin") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.origin, onChange: (e) => setForm({ ...form, origin: e.target.value }), placeholder: t("shipments.origin_placeholder") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: [
            t("shipments.destination"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.destination, onChange: (e) => setForm({ ...form, destination: e.target.value }), placeholder: t("shipments.destination_placeholder") })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.driver_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.driverName, onChange: (e) => setForm({ ...form, driverName: e.target.value }), placeholder: t("shipments.driver_placeholder") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.driver_phone") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.driverPhone, onChange: (e) => setForm({ ...form, driverPhone: e.target.value }), placeholder: "e.g. +251..." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.vehicle") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.vehicleInfo, onChange: (e) => setForm({ ...form, vehicleInfo: e.target.value }), placeholder: t("shipments.vehicle_placeholder") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.scheduled_date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DatePicker, { value: form.scheduledDate, onChange: (v) => setForm({ ...form, scheduledDate: v }), className: "h-10" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.notes") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: form.notes,
            onChange: (e) => setForm({ ...form, notes: e.target.value }),
            className: "w-full h-20 px-3 py-2 rounded-xl border bg-background text-xs font-semibold resize-none",
            placeholder: t("shipments.notes_placeholder")
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: handleSave, children: editingShipment ? t("shipments.update") : t("shipments.create") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-12 font-black uppercase text-xs tracking-widest", onClick: () => setShowShipmentModal(false), children: t("common.cancel") })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Modal, { isOpen: showDetailModal, onClose: () => setShowDetailModal(false), title: t("shipments.shipment_details"), size: "lg", children: selectedShipment && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: selectedShipment.status }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          !["delivered", "cancelled"].includes(selectedShipment.status) && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "h-8 text-xs font-black uppercase tracking-widest", onClick: () => {
            const next = nextStatus(selectedShipment.status);
            if (next) handleStatusChange(selectedShipment.id, next);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 12, className: "mr-1" }),
            selectedShipment.status === "pending" ? t("shipments.mark_in_transit") : t("shipments.mark_delivered")
          ] }),
          selectedShipment.status === "pending" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "destructive", className: "h-8 text-xs font-black uppercase tracking-widest", onClick: () => handleStatusChange(selectedShipment.id, "cancelled"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(X, { size: 12, className: "mr-1" }),
            " ",
            t("shipments.cancel")
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 rounded-xl bg-muted/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.route") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-bold", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14, className: "text-primary" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: selectedShipment.origin || t("shipments.no_origin") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { size: 14, className: "text-muted-foreground mx-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { size: 14, className: "text-destructive" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: selectedShipment.destination })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 p-4 rounded-xl bg-muted/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.driver_info") }),
          selectedShipment.driverName ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(User, { size: 14 }),
              " ",
              selectedShipment.driverName
            ] }),
            selectedShipment.driverPhone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { size: 14 }),
              " ",
              selectedShipment.driverPhone
            ] }),
            selectedShipment.vehicleInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-bold text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Truck, { size: 14 }),
              " ",
              selectedShipment.vehicleInfo
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("shipments.no_driver") })
        ] })
      ] }),
      selectedShipment.scheduledDate && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { size: 14 }),
        " ",
        t("shipments.scheduled"),
        ": ",
        formatDate(selectedShipment.scheduledDate)
      ] }),
      selectedShipment.deliveredAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs font-semibold text-green-600", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { size: 14 }),
        " ",
        t("shipments.delivered_at"),
        ": ",
        formatDateTime(selectedShipment.deliveredAt)
      ] }),
      selectedShipment.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.notes") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: selectedShipment.notes })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-black uppercase tracking-widest text-muted-foreground", children: t("shipments.history") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          (selectedShipment.history || []).map((h) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 p-3 rounded-xl bg-muted/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: h.status }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: formatDateTime(h.createdAt) }),
            h.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "— ",
              h.notes
            ] })
          ] }, h.id)),
          (!selectedShipment.history || selectedShipment.history.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: t("shipments.no_history") })
        ] })
      ] })
    ] }) }),
    deleteTarget && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50", onClick: () => {
      setDeleteTarget(null);
    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 rounded-2xl bg-card border shadow-xl max-w-sm w-full mx-4", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-black uppercase tracking-widest", children: t("shipments.delete_title") }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-muted-foreground mt-3", children: t("shipments.delete_desc").replace("{destination}", deleteTarget.destination) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "destructive", className: "flex-1 h-11 text-xs font-black uppercase tracking-widest", onClick: handleDelete, children: t("shipments.delete") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "flex-1 h-11 text-xs font-black uppercase tracking-widest", onClick: () => {
          setDeleteTarget(null);
        }, children: t("common.cancel") })
      ] })
    ] }) })
  ] });
};
export {
  Shipments as default
};

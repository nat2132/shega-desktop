import { g as useSettings, j as jsxRuntimeExports, aq as Dialog, ar as DialogContent, aw as DialogClose, X, as as DialogHeader, at as DialogTitle, au as DialogDescription, av as DialogFooter, i as Button, ac as Download, w as ShoppingCart } from "./index-wvHtiMql.js";
import { E } from "./jspdf.es.min-BFulL-Sj.js";
import { C as CircleCheckBig } from "./circle-check-big-DXbkAgdY.js";
const SaleSuccessModal = ({ open, onClose, sale }) => {
  const { t, currentBusiness } = useSettings();
  const handleDownloadReceipt = () => {
    const doc = new E({ unit: "mm", format: [80, 200] });
    const pageWidth = 80;
    let y = 5;
    if (currentBusiness?.businessName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(currentBusiness.businessName, pageWidth / 2, y, { align: "center" });
      y += 5;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(t("pdf.receipt"), pageWidth / 2, y, { align: "center" });
    y += 7;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`#REC-${sale?.id || Date.now()}`, pageWidth / 2, y, { align: "center" });
    y += 5;
    doc.setDrawColor(0);
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFontSize(7);
    doc.text(`${t("pdf.date")}: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`, 3, y);
    y += 4;
    doc.text(`${t("pdf.customer")}: ${sale?.customerName || t("summary.walk_in")}`, 3, y);
    y += 4;
    doc.line(3, y, pageWidth - 3, y);
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.item"), 3, y);
    doc.text(t("pdf.qty"), 40, y);
    doc.text(t("pdf.price"), 55, y);
    doc.text(t("pdf.total"), 68, y, { align: "right" });
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    (sale?.items || []).forEach((item) => {
      const lineTotal = (item.price * item.quantity).toFixed(2);
      const name = item.name.length > 22 ? item.name.substring(0, 20) + ".." : item.name;
      doc.text(name, 3, y);
      doc.text(String(item.quantity), 40, y);
      doc.text(item.price.toFixed(2), 55, y);
      doc.text(lineTotal, 68, y, { align: "right" });
      y += 4;
    });
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${t("pdf.total")}: ${t("common.etb")} ${(sale?.totalPrice || 0).toFixed(2)}`, 3, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`${t("pdf.payment")}: ${sale?.paymentMethod || "-"}`, 3, y);
    y += 4;
    doc.text(`${t("pdf.paid")}: ${t("common.etb")} ${(sale?.paidAmount || sale?.totalPrice || 0).toFixed(2)}`, 3, y);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text(t("pdf.thanks"), pageWidth / 2, y, { align: "center" });
    doc.save(`receipt-${Date.now()}.pdf`);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: (open2) => !open2 && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "rounded-3xl bg-background border-border shadow-2xl max-w-sm p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogClose, { className: "absolute right-4 top-4 rounded-full opacity-70 hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center space-y-6 pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-16 w-16 text-green-500", strokeWidth: 1.5 }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { className: "text-center sm:text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "text-2xl font-black tracking-tight text-center", children: t("sale_success.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(DialogDescription, { className: "text-sm text-muted-foreground font-medium", children: t("sale_success.description") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full space-y-3 bg-muted/30 rounded-2xl p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: t("sale_success.items_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: sale?.itemCount ?? "-" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: t("sale_success.total_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-black text-lg", children: [
            t("common.etb"),
            " ",
            (sale?.totalPrice ?? 0).toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: t("sale_success.payment_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold capitalize", children: sale?.paymentMethod || "-" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-medium", children: t("sale_success.customer_label") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: sale?.customerName || t("summary.walk_in") })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "flex-col gap-3 sm:flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: handleDownloadReceipt,
          className: "w-full py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "w-4 h-4 mr-2" }),
            " ",
            t("sale_success.download_receipt")
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          onClick: onClose,
          variant: "outline",
          className: "w-full py-6 text-xs font-black uppercase tracking-[0.2em] rounded-2xl border-border",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }),
            " ",
            t("sale_success.new_sale")
          ]
        }
      )
    ] })
  ] }) });
};
export {
  SaleSuccessModal as S
};

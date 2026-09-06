import { b as useSettings, r as reactExports, j as jsxRuntimeExports, e as Button, a3 as Search, J as Input, R as RefreshCw, i as Badge, q as Eye, l as RotateCcw, Q as toast } from "./index-BcwudWUj.js";
import { L as Label } from "./label-CKZ6ezue.js";
import { C as Card, c as CardContent, a as CardHeader, b as CardTitle, d as CardDescription } from "./card-9E0A8T1M.js";
import { T as Table, a as TableHeader, b as TableRow, c as TableHead, d as TableBody, e as TableCell } from "./table-D9Fbg3F6.js";
import { P as Plus } from "./plus-D_60Nm0z.js";
import { C as CircleDollarSign } from "./circle-dollar-sign-Ba0btWj2.js";
import { G as Gift } from "./gift-CuzLKxUo.js";
import { B as Ban } from "./ban-EAHR1hHj.js";
import { W as Wallet } from "./wallet-DmTaMWjz.js";
const GiftCards = () => {
  const { t, formatDate } = useSettings();
  const [cards, setCards] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(false);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [showIssue, setShowIssue] = reactExports.useState(false);
  const [issueForm, setIssueForm] = reactExports.useState({ code: "", cardName: "", balance: "", issuedTo: "", expiryDate: "", notes: "" });
  const [saving, setSaving] = reactExports.useState(false);
  const [selectedCard, setSelectedCard] = reactExports.useState(null);
  const [txns, setTxns] = reactExports.useState([]);
  const [topupAmount, setTopupAmount] = reactExports.useState("");
  const [redeemAmount, setRedeemAmount] = reactExports.useState("");
  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await window.api.getGiftCards();
      setCards(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error(e.message || t("gift_cards.load_failed"));
    } finally {
      setLoading(false);
    }
  };
  reactExports.useEffect(() => {
    loadCards();
  }, []);
  const openCard = async (card) => {
    setSelectedCard(card);
    setTopupAmount("");
    setRedeemAmount("");
    try {
      const data = await window.api.getGiftCardTransactions(card.id);
      setTxns(Array.isArray(data) ? data : []);
    } catch {
      setTxns([]);
    }
  };
  const issueCard = async () => {
    if (!issueForm.balance || Number(issueForm.balance) <= 0) {
      toast.error(t("gift_cards.balance_required"));
      return;
    }
    setSaving(true);
    try {
      await window.api.issueGiftCard({
        code: issueForm.code,
        cardName: issueForm.cardName,
        balance: Number(issueForm.balance),
        issuedTo: issueForm.issuedTo,
        expiryDate: issueForm.expiryDate || null,
        notes: issueForm.notes
      });
      toast.success(t("gift_cards.issued"));
      setIssueForm({ code: "", cardName: "", balance: "", issuedTo: "", expiryDate: "", notes: "" });
      setShowIssue(false);
      loadCards();
    } catch (e) {
      toast.error(e.message || t("gift_cards.issue_failed"));
    } finally {
      setSaving(false);
    }
  };
  const doTopup = async () => {
    if (!selectedCard || !topupAmount || Number(topupAmount) <= 0) return;
    try {
      const r = await window.api.topupGiftCard({ id: selectedCard.id, amount: Number(topupAmount) });
      toast.success(t("gift_cards.topup_done"));
      setSelectedCard({ ...selectedCard, balance: r.balance });
      openCard(selectedCard);
      loadCards();
    } catch (e) {
      toast.error(e.message || t("gift_cards.topup_failed"));
    }
  };
  const doRedeem = async () => {
    if (!selectedCard || !redeemAmount || Number(redeemAmount) <= 0) return;
    try {
      const r = await window.api.redeemGiftCard({ code: selectedCard.code, amount: Number(redeemAmount) });
      toast.success(t("gift_cards.redeem_done"));
      setSelectedCard({ ...selectedCard, balance: r.balance });
      openCard(selectedCard);
      loadCards();
    } catch (e) {
      toast.error(e.message || t("gift_cards.redeem_failed"));
    }
  };
  const voidCard = async (card) => {
    try {
      await window.api.voidGiftCard(card.id);
      toast.success(t("gift_cards.void_done"));
      if (selectedCard?.id === card.id) setSelectedCard(null);
      loadCards();
    } catch (e) {
      toast.error(e.message || t("gift_cards.void_failed"));
    }
  };
  const filtered = cards.filter(
    (c) => !searchQuery || (c.code || "").toLowerCase().includes(searchQuery.toLowerCase()) || (c.issuedTo || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-6 py-4 md:py-6 fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl md:text-3xl font-black tracking-tight uppercase", children: t("gift_cards.title") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: t("gift_cards.subtitle") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setShowIssue(true), className: "h-10 px-5 text-xs font-bold uppercase tracking-widest shadow-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { size: 14, className: "mr-1" }),
        " ",
        t("gift_cards.issue")
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-2xl border-border bg-card shadow-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "p-3 flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-[220px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { size: 14, className: "text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: searchQuery,
            onChange: (e) => setSearchQuery(e.target.value),
            placeholder: t("gift_cards.search"),
            className: "h-9 text-sm rounded-xl"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: loadCards, className: "text-xs font-bold uppercase tracking-widest", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { size: 13, className: "mr-1" }),
        " ",
        t("common.refresh")
      ] })
    ] }) }) }),
    showIssue && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border shadow-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: t("gift_cards.issue_title") }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("gift_cards.card_name") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: issueForm.cardName, onChange: (e) => setIssueForm({ ...issueForm, cardName: e.target.value }), className: "h-10 text-sm rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("gift_cards.code") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: issueForm.code, onChange: (e) => setIssueForm({ ...issueForm, code: e.target.value }), placeholder: t("gift_cards.code_auto"), className: "h-10 text-sm rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
            t("gift_cards.balance"),
            " *"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", value: issueForm.balance, onChange: (e) => setIssueForm({ ...issueForm, balance: e.target.value }), className: "h-10 text-sm rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("gift_cards.issued_to") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: issueForm.issuedTo, onChange: (e) => setIssueForm({ ...issueForm, issuedTo: e.target.value }), className: "h-10 text-sm rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("gift_cards.expiry") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: issueForm.expiryDate, onChange: (e) => setIssueForm({ ...issueForm, expiryDate: e.target.value }), className: "h-10 text-sm rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("gift_cards.notes") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: issueForm.notes, onChange: (e) => setIssueForm({ ...issueForm, notes: e.target.value }), className: "h-10 text-sm rounded-xl" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-3 flex justify-end gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => setShowIssue(false), className: "text-xs font-bold uppercase tracking-widest", children: t("common.cancel") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: issueCard, disabled: saving, className: "text-xs font-bold uppercase tracking-widest", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleDollarSign, { size: 13, className: "mr-1" }),
            " ",
            saving ? t("common.saving") : t("gift_cards.issue")
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 lg:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.code") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.card_name") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.issued_to") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("gift_cards.balance") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.status") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.expiry") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("common.actions") })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TableBody, { children: [
        filtered.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { colSpan: 7, className: "text-center py-10 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { size: 24, className: "mx-auto mb-2 opacity-30" }),
          t("gift_cards.none")
        ] }) }),
        filtered.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "font-mono font-bold text-xs", children: c.code }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-sm font-semibold", children: c.cardName || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: c.issuedTo || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold text-emerald-500", children: [
            t("common.etb"),
            " ",
            Number(c.balance || 0).toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: c.status === "active" ? "default" : c.status === "void" ? "destructive" : "secondary", className: "text-xs font-bold uppercase tracking-wider", children: c.status }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: c.expiryDate ? formatDate(c.expiryDate) : "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8", onClick: () => openCard(c), title: t("common.view"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 14 }) }),
            c.status === "active" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-destructive", onClick: () => voidCard(c), title: t("gift_cards.void"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Ban, { size: 14 }) })
          ] }) })
        ] }, c.id))
      ] })
    ] }) }) }) }),
    selectedCard && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 lg:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-3xl border-border shadow-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-sm font-black uppercase tracking-widest", children: [
            t("gift_cards.details"),
            " — ",
            selectedCard.code
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
            t("gift_cards.balance"),
            ": ",
            t("common.etb"),
            " ",
            Number(selectedCard.balance || 0).toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("gift_cards.topup") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", value: topupAmount, onChange: (e) => setTopupAmount(e.target.value), className: "h-10 text-sm rounded-xl" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: doTopup, className: "h-10 text-xs font-bold uppercase tracking-widest shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { size: 13, className: "mr-1" }),
                " ",
                t("gift_cards.topup")
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: t("gift_cards.redeem") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", value: redeemAmount, onChange: (e) => setRedeemAmount(e.target.value), className: "h-10 text-sm rounded-xl" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: doRedeem, className: "h-10 text-xs font-bold uppercase tracking-widest shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { size: 13, className: "mr-1" }),
                " ",
                t("gift_cards.redeem")
              ] })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-3xl border-border overflow-hidden mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Table, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TableHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.txn_date") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.txn_type") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest text-right", children: t("gift_cards.txn_amount") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TableHead, { className: "text-xs font-black uppercase tracking-widest", children: t("gift_cards.txn_note") })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TableBody, { children: [
          txns.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(TableRow, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { colSpan: 4, className: "text-center py-8 text-muted-foreground", children: t("gift_cards.no_txns") }) }),
          txns.map((tx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(TableRow, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: formatDate(tx.createdAt) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: tx.type === "redeem" ? "secondary" : tx.type === "void" ? "destructive" : "default", className: "text-xs font-bold uppercase tracking-wider", children: tx.type }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(TableCell, { className: "text-right font-bold", children: [
              t("common.etb"),
              " ",
              Number(tx.amount || 0).toLocaleString()
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TableCell, { className: "text-xs text-muted-foreground", children: tx.note || "-" })
          ] }, tx.id))
        ] })
      ] }) }) })
    ] })
  ] });
};
export {
  GiftCards as default
};

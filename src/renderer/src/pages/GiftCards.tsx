import React, { useState, useEffect } from 'react';
import {
  Gift, RefreshCw, Plus, Search, Eye, RotateCcw, Ban, Wallet, CircleDollarSign
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';

const GiftCards: React.FC = () => {
  const { t, formatDate } = useSettings();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [showIssue, setShowIssue] = useState(false);
  const [issueForm, setIssueForm] = useState({ code: '', cardName: '', balance: '', issuedTo: '', expiryDate: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [topupAmount, setTopupAmount] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await window.api.getGiftCards();
      setCards(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast.error(e.message || t('gift_cards.load_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCards(); }, []);

  const openCard = async (card: any) => {
    setSelectedCard(card);
    setTopupAmount('');
    setRedeemAmount('');
    try {
      const data = await window.api.getGiftCardTransactions(card.id);
      setTxns(Array.isArray(data) ? data : []);
    } catch { setTxns([]); }
  };

  const issueCard = async () => {
    if (!issueForm.balance || Number(issueForm.balance) <= 0) {
      toast.error(t('gift_cards.balance_required'));
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
        notes: issueForm.notes,
      });
      toast.success(t('gift_cards.issued'));
      setIssueForm({ code: '', cardName: '', balance: '', issuedTo: '', expiryDate: '', notes: '' });
      setShowIssue(false);
      loadCards();
    } catch (e: any) {
      toast.error(e.message || t('gift_cards.issue_failed'));
    } finally {
      setSaving(false);
    }
  };

  const doTopup = async () => {
    if (!selectedCard || !topupAmount || Number(topupAmount) <= 0) return;
    try {
      const r = await window.api.topupGiftCard({ id: selectedCard.id, amount: Number(topupAmount) });
      toast.success(t('gift_cards.topup_done'));
      setSelectedCard({ ...selectedCard, balance: r.balance });
      openCard(selectedCard);
      loadCards();
    } catch (e: any) {
      toast.error(e.message || t('gift_cards.topup_failed'));
    }
  };

  const doRedeem = async () => {
    if (!selectedCard || !redeemAmount || Number(redeemAmount) <= 0) return;
    try {
      const r = await window.api.redeemGiftCard({ code: selectedCard.code, amount: Number(redeemAmount) });
      toast.success(t('gift_cards.redeem_done'));
      setSelectedCard({ ...selectedCard, balance: r.balance });
      openCard(selectedCard);
      loadCards();
    } catch (e: any) {
      toast.error(e.message || t('gift_cards.redeem_failed'));
    }
  };

  const voidCard = async (card: any) => {
    try {
      await window.api.voidGiftCard(card.id);
      toast.success(t('gift_cards.void_done'));
      if (selectedCard?.id === card.id) setSelectedCard(null);
      loadCards();
    } catch (e: any) {
      toast.error(e.message || t('gift_cards.void_failed'));
    }
  };

  const filtered = cards.filter((c: any) =>
    !searchQuery || (c.code || '').toLowerCase().includes(searchQuery.toLowerCase()) || (c.issuedTo || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 py-4 md:py-6 fade-in">
      <div className="px-4 lg:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight uppercase">{t('gift_cards.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('gift_cards.subtitle')}</p>
        </div>
        <Button onClick={() => setShowIssue(true)} className="h-10 px-5 text-xs font-bold uppercase tracking-widest shadow-xs">
          <Plus size={14} className="mr-1" /> {t('gift_cards.issue')}
        </Button>
      </div>

      <div className="px-4 lg:px-6">
        <Card className="rounded-2xl border-border bg-card shadow-xs">
          <CardContent className="p-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <Search size={14} className="text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('gift_cards.search')}
                className="h-9 text-sm rounded-xl"
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadCards} className="text-xs font-bold uppercase tracking-widest">
              <RefreshCw size={13} className="mr-1" /> {t('common.refresh')}
            </Button>
          </CardContent>
        </Card>
      </div>

      {showIssue && (
        <div className="px-4 lg:px-6">
          <Card className="rounded-3xl border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t('gift_cards.issue_title')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.card_name')}</Label>
                <Input value={issueForm.cardName} onChange={(e) => setIssueForm({ ...issueForm, cardName: e.target.value })} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.code')}</Label>
                <Input value={issueForm.code} onChange={(e) => setIssueForm({ ...issueForm, code: e.target.value })} placeholder={t('gift_cards.code_auto')} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.balance')} *</Label>
                <Input type="number" min="0" value={issueForm.balance} onChange={(e) => setIssueForm({ ...issueForm, balance: e.target.value })} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.issued_to')}</Label>
                <Input value={issueForm.issuedTo} onChange={(e) => setIssueForm({ ...issueForm, issuedTo: e.target.value })} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.expiry')}</Label>
                <Input type="date" value={issueForm.expiryDate} onChange={(e) => setIssueForm({ ...issueForm, expiryDate: e.target.value })} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.notes')}</Label>
                <Input value={issueForm.notes} onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })} className="h-10 text-sm rounded-xl" />
              </div>
              <div className="md:col-span-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowIssue(false)} className="text-xs font-bold uppercase tracking-widest">{t('common.cancel')}</Button>
                <Button size="sm" onClick={issueCard} disabled={saving} className="text-xs font-bold uppercase tracking-widest">
                  <CircleDollarSign size={13} className="mr-1" /> {saving ? t('common.saving') : t('gift_cards.issue')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="px-4 lg:px-6">
        <Card className="rounded-3xl border-border overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.code')}</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.card_name')}</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.issued_to')}</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('gift_cards.balance')}</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.status')}</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.expiry')}</TableHead>
                  <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      <Gift size={24} className="mx-auto mb-2 opacity-30" />
                      {t('gift_cards.none')}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-xs">{c.code}</TableCell>
                    <TableCell className="text-sm font-semibold">{c.cardName || '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.issuedTo || '-'}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-500">{t('common.etb')} {Number(c.balance || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'active' ? 'default' : c.status === 'void' ? 'destructive' : 'secondary'} className="text-xs font-bold uppercase tracking-wider">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.expiryDate ? formatDate(c.expiryDate) : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCard(c)} title={t('common.view')}>
                          <Eye size={14} />
                        </Button>
                        {c.status === 'active' && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => voidCard(c)} title={t('gift_cards.void')}>
                            <Ban size={14} />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {selectedCard && (
        <div className="px-4 lg:px-6">
          <Card className="rounded-3xl border-border shadow-xs">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest">
                {t('gift_cards.details')} — {selectedCard.code}
              </CardTitle>
              <CardDescription className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t('gift_cards.balance')}: {t('common.etb')} {Number(selectedCard.balance || 0).toLocaleString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.topup')}</Label>
                <div className="flex gap-2">
                  <Input type="number" min="0" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} className="h-10 text-sm rounded-xl" />
                  <Button size="sm" onClick={doTopup} className="h-10 text-xs font-bold uppercase tracking-widest shrink-0">
                    <Wallet size={13} className="mr-1" /> {t('gift_cards.topup')}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('gift_cards.redeem')}</Label>
                <div className="flex gap-2">
                  <Input type="number" min="0" value={redeemAmount} onChange={(e) => setRedeemAmount(e.target.value)} className="h-10 text-sm rounded-xl" />
                  <Button size="sm" variant="outline" onClick={doRedeem} className="h-10 text-xs font-bold uppercase tracking-widest shrink-0">
                    <RotateCcw size={13} className="mr-1" /> {t('gift_cards.redeem')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border overflow-hidden mt-4">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.txn_date')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.txn_type')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest text-right">{t('gift_cards.txn_amount')}</TableHead>
                    <TableHead className="text-xs font-black uppercase tracking-widest">{t('gift_cards.txn_note')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txns.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">{t('gift_cards.no_txns')}</TableCell>
                    </TableRow>
                  )}
                  {txns.map((tx: any) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={tx.type === 'redeem' ? 'secondary' : tx.type === 'void' ? 'destructive' : 'default'} className="text-xs font-bold uppercase tracking-wider">
                          {tx.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold">{t('common.etb')} {Number(tx.amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{tx.note || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GiftCards;
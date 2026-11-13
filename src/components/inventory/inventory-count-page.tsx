"use client";

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Check, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Loader2, Package, Search, UserRound } from 'lucide-react';
import { API_CONFIG } from '@/lib/api-config';
import { InventoryCountError, readInventoryCountSession, searchInventoryCountProducts, submitInventoryCount } from '@/lib/inventory-count-api';
import type { InventoryCountProduct, InventoryCountSession } from '@/lib/inventory-count-api';
import { countIntentFor, normalizeCountName, normalizeCountQuantity } from '@/lib/inventory-count-form';
import type { CountIntent } from '@/lib/inventory-count-form';

type SavedCount = { id: number; item: InventoryCountProduct; name: string; quantity: number; at: Date };
const quantityLabel = (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 3 });
const timeLabel = (date: Date) => date.toLocaleTimeString('fr-FR', { timeZone: 'Africa/Casablanca', hour: '2-digit', minute: '2-digit' });
const inputStyle = 'w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition focus:border-foreground focus:ring-2 focus:ring-primary/40 disabled:opacity-50';
const buttonStyle = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:cursor-not-allowed disabled:opacity-50';
function messageOf(error: unknown) { return error instanceof Error ? error.message : 'Connexion impossible. Réessayez.'; }
function isUnavailable(error: unknown) { return error instanceof InventoryCountError && [404, 410].includes(error.status); }
function itemTitle(item: InventoryCountProduct) { return item.variant_id ? item.variant_name || `Variante #${item.variant_id}` : item.designation; }
function itemImage(item: InventoryCountProduct) {
  const image = item.image_url;
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  return image.startsWith('/') ? `${API_CONFIG.BASE_URL}${image}` : undefined;
}
function ProductImage({ item }: { item: InventoryCountProduct }) {
  const image = itemImage(item);
  return <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted text-muted-foreground"><Package size={22} aria-hidden="true" />{image && <img src={image} alt="" referrerPolicy="no-referrer" loading="lazy" className="absolute inset-0 h-full w-full object-contain bg-card" onError={event => { event.currentTarget.hidden = true; }} />}</span>;
}

export default function InventoryCountPage({ token }: { token: string }) {
  const [session, setSession] = useState<InventoryCountSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [draftName, setDraftName] = useState('');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<InventoryCountProduct[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 30, total: 0 });
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [selected, setSelected] = useState<InventoryCountProduct | null>(null);
  const [quantity, setQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const [history, setHistory] = useState<SavedCount[]>([]);
  const intent = useRef<CountIntent | null>(null);
  const savingGuard = useRef(false);
  const quantityInput = useRef<HTMLInputElement>(null);
  const countForm = useRef<HTMLFormElement>(null);
  const activeToken = useRef(token);
  activeToken.current = token;

  useEffect(() => {
    setDraftName(''); setName(''); setNameError(''); setQuery(''); setPage(1);
    setItems([]); setPagination({ page: 1, limit: 30, total: 0 }); setSelected(null);
    setQuantity(''); setHistory([]); setSuccess(''); setSaveError(''); setSearchError('');
    setSaving(false); savingGuard.current = false; intent.current = null;
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    setSession(null); setSessionError(''); setUnavailable(false);
    void readInventoryCountSession(token, controller.signal).then(result => {
      if (!controller.signal.aborted) {
        if (!result.session?.id || !result.session.title) throw new Error('Le comptage est indisponible. Réessayez.');
        setSession(result.session);
      }
    }).catch(error => {
      if (!controller.signal.aborted) { setSessionError(messageOf(error)); setUnavailable(isUnavailable(error)); }
    });
    return () => controller.abort();
  }, [token, sessionAttempt]);

  useEffect(() => {
    if (!session || !name || unavailable) return;
    const controller = new AbortController();
    setSearching(true); setSearchError('');
    const timer = window.setTimeout(() => {
      void searchInventoryCountProducts(token, query.trim(), page, controller.signal).then(result => {
        if (!controller.signal.aborted) {
          if (!Array.isArray(result.items) || !result.pagination) throw new Error('La recherche est indisponible. Réessayez.');
          setItems(result.items); setPagination(result.pagination); setSearching(false);
        }
      }).catch(error => {
        if (!controller.signal.aborted) { setSearchError(messageOf(error)); setSearching(false); if (isUnavailable(error)) { setSessionError(messageOf(error)); setUnavailable(true); } }
      });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [token, session, name, query, page, unavailable, searchAttempt]);

  const enterName = (event: FormEvent) => {
    event.preventDefault();
    try { const normalized = normalizeCountName(draftName); setDraftName(normalized); setName(normalized); setNameError(''); intent.current = null; }
    catch (error) { setNameError(messageOf(error)); }
  };
  const selectItem = (item: InventoryCountProduct) => {
    if (savingGuard.current) return;
    setSelected(item); setQuantity(''); setSaveError(''); setSuccess(''); intent.current = null;
    window.requestAnimationFrame(() => {
      if (window.matchMedia('(max-width: 1023px)').matches) countForm.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
      quantityInput.current?.focus({ preventScroll: true });
    });
  };
  const saveCount = async (event: FormEvent) => {
    event.preventDefault();
    if (savingGuard.current || !selected || unavailable) return;
    setSaveError(''); setSuccess('');
    let normalized: string;
    try { normalized = normalizeCountQuantity(quantity); } catch (error) { setSaveError(messageOf(error)); return; }
    const payload = { name: normalizeCountName(name), product_id: selected.product_id, variant_id: selected.variant_id, quantity: normalized };
    intent.current = countIntentFor(intent.current, payload);
    const tokenAtSubmit = token;
    savingGuard.current = true; setSaving(true);
    try {
      const result = await submitInventoryCount(token, { ...payload, request_key: intent.current.requestKey });
      if (activeToken.current !== tokenAtSubmit) return;
      setHistory(previous => [{ id: result.id, item: selected, name, quantity: result.quantity, at: new Date() }, ...previous.filter(row => row.id !== result.id)]);
      setSuccess(`${quantityLabel(result.quantity)} enregistré${result.quantity > 1 ? 's' : ''} pour ${itemTitle(selected)}.`);
      setQuantity(''); intent.current = null;
      window.requestAnimationFrame(() => quantityInput.current?.focus({ preventScroll: true }));
    } catch (error) {
      if (activeToken.current !== tokenAtSubmit) return;
      setSaveError(messageOf(error));
      if (isUnavailable(error)) { setSessionError(messageOf(error)); setUnavailable(true); }
    } finally { if (activeToken.current === tokenAtSubmit) { savingGuard.current = false; setSaving(false); } }
  };

  return <main className="min-h-screen border-t-4 border-primary bg-background text-foreground" dir="ltr">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 sm:px-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ClipboardList size={23} aria-hidden="true" /></span><div><p className="text-xs font-extrabold tracking-[0.18em]">BOUKIR DIAMOND</p><p className="mt-1 text-sm text-muted-foreground">Comptage inventaire</p></div></div>{session && <span className="max-w-full truncate rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs font-medium">{session.title}</span>}</div></header>
    <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10">
      {!session && !sessionError ? <div role="status" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-6"><Loader2 size={20} className="animate-spin" /> Ouverture du comptage…</div> : sessionError && (!session || unavailable) ? <section className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6 sm:p-8"><ClipboardList size={28} className="text-muted-foreground" /><h1 className="mt-4 text-2xl font-bold">{unavailable ? 'Comptage indisponible' : 'Connexion interrompue'}</h1><p role="alert" className="mt-3 text-sm leading-6 text-muted-foreground">{sessionError}</p>{!unavailable && <button type="button" onClick={() => setSessionAttempt(value => value + 1)} className={`${buttonStyle} mt-5`}>Réessayer</button>}{unavailable && <p className="mt-4 text-sm text-muted-foreground">Demandez un lien de comptage actif au responsable.</p>}</section> : session && !name ? <section className="mx-auto max-w-lg"><div className="mb-5 flex items-center gap-2 text-xs font-medium text-muted-foreground"><span className="rounded-md bg-primary px-2 py-1 text-primary-foreground">01 · Votre nom</span><ArrowRight size={14} /><span>02 · Vos comptages</span></div><form onSubmit={enterName} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"><UserRound size={30} aria-hidden="true" /><h1 className="mt-5 text-3xl font-bold tracking-tight">Qui compte aujourd’hui ?</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Indiquez votre nom pour identifier les quantités que vous allez enregistrer.</p><label htmlFor="counter-name" className="mt-6 block text-sm font-semibold">Votre nom complet</label><input id="counter-name" name="name" type="text" autoComplete="name" autoFocus maxLength={100} value={draftName} onChange={event => { setDraftName(event.target.value); setNameError(''); }} className={`${inputStyle} mt-2`} placeholder="Ex. Amine El…" aria-describedby={nameError ? 'counter-name-error' : undefined} />{nameError && <p id="counter-name-error" role="alert" className="mt-2 text-sm text-destructive">{nameError}</p>}<button className={`${buttonStyle} mt-5 w-full`} type="submit">Commencer le comptage <ArrowRight size={17} /></button></form></section> : session && <>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">02 · Vos comptages</p><h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Rechercher, compter, enregistrer.</h1></div><div className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"><UserRound size={18} aria-hidden="true" /><span className="max-w-44 truncate text-sm font-semibold" title={name}>{name}</span><button type="button" disabled={saving} onClick={() => { setDraftName(name); setName(''); intent.current = null; setSaveError(''); setSuccess(''); }} className="min-h-9 text-xs font-semibold underline underline-offset-4 disabled:opacity-50">Changer</button></div></div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm" aria-labelledby="catalog-title"><div className="border-b border-border p-4 sm:p-5"><h2 id="catalog-title" className="text-base font-bold">Produits et variantes</h2><label htmlFor="count-search" className="sr-only">Rechercher un produit ou une variante</label><div className="relative mt-3"><Search size={19} className="pointer-events-none absolute left-4 top-3.5 text-muted-foreground" /><input id="count-search" type="search" autoComplete="off" value={query} onChange={event => { setQuery(event.target.value); setPage(1); setSearching(true); }} placeholder="Nom, référence ou numéro…" className={`${inputStyle} pl-11`} /></div><p className="mt-2 text-xs leading-5 text-muted-foreground">Sélectionnez le produit ou la variante que vous comptez.</p></div>
        {searching ? <p role="status" className="flex items-center gap-2 p-5 text-sm text-muted-foreground"><Loader2 size={17} className="animate-spin" /> Recherche des articles…</p> : searchError ? <div role="alert" className="p-5 text-sm"><p className="text-destructive">{searchError}</p><button type="button" onClick={() => setSearchAttempt(value => value + 1)} className="mt-3 font-semibold underline">Réessayer la recherche</button></div> : !items.length ? <div className="p-8 text-center"><Package size={28} className="mx-auto text-muted-foreground" /><p className="mt-3 font-semibold">Aucun article trouvé</p><p className="mt-2 text-sm text-muted-foreground">Essayez un autre nom ou une référence.</p></div> : <ul className="divide-y divide-border">{items.map(item => <li key={item.entity_key}><button type="button" disabled={saving} onClick={() => selectItem(item)} aria-pressed={selected?.entity_key === item.entity_key} className={`flex w-full items-center gap-3 p-4 text-left transition focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-foreground disabled:opacity-50 sm:px-5 ${selected?.entity_key === item.entity_key ? 'bg-primary/15 ring-1 ring-inset ring-primary' : 'hover:bg-muted/50'}`}><ProductImage item={item} /><span className="min-w-0 flex-1"><span className="mb-1 inline-flex rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">{item.kind === 'variant' ? 'Variante' : 'Produit'}</span><span className="block break-words text-sm font-semibold leading-5">{itemTitle(item)}</span>{item.variant_id && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{item.designation}</span>}<span className="mt-1 block text-xs text-muted-foreground">Réf. {item.reference || item.product_id}</span></span>{selected?.entity_key === item.entity_key ? <Check size={19} className="shrink-0" aria-label="Article sélectionné" /> : <ArrowRight size={17} className="shrink-0 text-muted-foreground" aria-hidden="true" />}</button></li>)}</ul>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3 text-xs"><span>{pagination.total} article{pagination.total > 1 ? 's' : ''} · Page {page} / {Math.max(1, Math.ceil(pagination.total / pagination.limit))}</span><div className="flex gap-2"><button type="button" aria-label="Page précédente des articles" disabled={page <= 1 || searching || saving} onClick={() => setPage(value => value - 1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-35"><ChevronLeft size={17} /></button><button type="button" aria-label="Page suivante des articles" disabled={page * pagination.limit >= pagination.total || searching || saving} onClick={() => setPage(value => value + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card disabled:opacity-35"><ChevronRight size={17} /></button></div></div></section>
        <aside className="space-y-5 lg:sticky lg:top-6"><form ref={countForm} onSubmit={saveCount} className="scroll-mt-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6" aria-labelledby="quantity-title"><div className="flex items-center justify-between gap-2"><h2 id="quantity-title" className="text-lg font-bold">Votre comptage</h2><span className="rounded-md bg-primary/25 px-2 py-1 text-[10px] font-bold uppercase tracking-wide">{selected?.kind === 'variant' ? 'Variante' : 'Produit'}</span></div>{selected ? <><div className="mt-4 rounded-xl border border-border bg-muted/25 p-4"><p className="text-base font-bold leading-6">{itemTitle(selected)}</p>{selected.variant_id && <p className="mt-1 text-sm text-muted-foreground">{selected.designation}</p>}<p className="mt-2 text-xs text-muted-foreground">Réf. {selected.reference || selected.product_id}</p></div><label htmlFor="count-quantity" className="mt-5 block text-sm font-semibold">Quantité comptée</label><input ref={quantityInput} id="count-quantity" name="quantity" type="text" inputMode="decimal" autoComplete="off" maxLength={13} value={quantity} disabled={saving} onChange={event => { setQuantity(event.target.value); setSaveError(''); setSuccess(''); intent.current = null; }} placeholder="0" className={`${inputStyle} mt-2 py-4 text-3xl font-bold tabular-nums`} aria-describedby="count-quantity-help" /><p id="count-quantity-help" className="mt-2 text-xs leading-5 text-muted-foreground">Zéro est accepté. Jusqu’à 3 décimales, par exemple 2,5.</p><button type="submit" disabled={saving || !quantity.trim()} className={`${buttonStyle} mt-5 w-full`} aria-busy={saving}>{saving ? <><Loader2 size={18} className="animate-spin" /> Enregistrement…</> : <><Check size={18} /> Enregistrer la quantité</>}</button></> : <div className="mt-5 rounded-xl border border-dashed border-border px-4 py-7 text-center"><Package size={27} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-medium">Choisissez d’abord un article dans la liste.</p></div>}{saveError && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm leading-5 text-destructive">{saveError} Vous pouvez réessayer.</p>}{success && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm leading-5 text-emerald-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{success}</p>}<p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">Chaque enregistrement ajoute un comptage. Le même article peut être enregistré plusieurs fois.</p></form>
        {history.length > 0 && <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="recent-counts"><div className="flex items-start justify-between gap-3"><h2 id="recent-counts" className="text-sm font-bold">Dernières saisies sur cet écran</h2><span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold">{history.length}</span></div><ul className="mt-3 divide-y divide-border">{history.slice(0, 5).map(row => <li key={row.id} className="flex gap-3 py-3"><span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium">{itemTitle(row.item)}</span><span className="mt-1 block text-xs text-muted-foreground">{row.name} · {timeLabel(row.at)}</span></span><span className="text-sm font-bold tabular-nums">{quantityLabel(row.quantity)}</span></li>)}</ul></section>}</aside>
      </div></>}
    </div>
  </main>;
}

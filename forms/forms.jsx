/* Formulaires de création : Devis / Facture, Rendez-vous, Règle de relance.
   Les créations sont poussées dans window.CRM pour apparaître dans les listes. */

let __idSeq = 1000;
const newId = (p) => `${p}${++__idSeq}`;

function nextRef(prefix, list) {
  const nums = list.map((x) => parseInt((x.ref || "").split("-").pop(), 10)).filter((n) => !isNaN(n));
  const n = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-2026-${String(n).padStart(3, "0")}`;
}

// ---------- Modal de confirmation d'envoi (email) ----------
function SendDocModal({ kind, docRef, client, total, onClose, onConfirm }) {
  const { company } = window.CRM;
  const noEmail = !client || !client.email;
  const [email, setEmail] = React.useState(client && client.email ? client.email : "");
  const [sendMode, setSendMode] = React.useState("mail"); // mail | esign
  const isDevis = kind === "devis";
  const docLabel = isDevis ? "devis" : "facture";
  const [subject, setSubject] = React.useState(`Votre ${docLabel} ${docRef} — ${company.name}`);
  const [body, setBody] = React.useState(
    `Bonjour ${client ? client.name : ""},\n\nVeuillez trouver ci-joint votre ${docLabel} ${docRef} d'un montant de ${eur(total)}.${sendMode === "esign" ? "\n\nMerci de le signer électroniquement via le lien ci-dessous." : ""}\n\nN'hésitez pas à me contacter pour toute question.\n\nCordialement,\n${company.owner} — ${company.name}\n${company.phone}`
  );
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  React.useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card send-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>Envoyer le {docLabel}</h3>
            <span className="cc-meta">{docRef} · {eur(total)}</span>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Mode d'envoi */}
          {isDevis && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[["mail", "Mail seul"], ["esign", "Mail + e-signature"]].map(([val, label]) => (
                <button key={val} onClick={() => setSendMode(val)} style={{
                  flex: 1, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${sendMode === val ? "var(--accent)" : "var(--line)"}`,
                  background: sendMode === val ? "var(--accent-soft)" : "var(--surface)",
                  color: sendMode === val ? "var(--accent-strong)" : "var(--ink-2)",
                  fontWeight: 600, fontSize: 12.5, cursor: "pointer", transition: "all .14s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {val === "mail"
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  }
                  {label}
                </button>
              ))}
            </div>
          )}
          {sendMode === "esign" && (
            <div style={{ padding: "9px 12px", borderRadius: 10, background: "var(--water-soft)", color: "var(--water)", fontSize: 12, fontWeight: 500, marginBottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Le client recevra un lien pour signer électroniquement le devis.
            </div>
          )}

          {noEmail && (
            <div className="send-warn">
              <Icon name="mail" size={16} />
              <span>Aucun mail associé à <b>{client ? client.name : "ce client"}</b>. Saisissez une adresse pour l'envoi (elle ne sera pas enregistrée sur la fiche).</span>
            </div>
          )}

          <div className="field">
            <label>Destinataire</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.fr" autoFocus={noEmail} />
            {!emailValid && email.length > 0 && <span className="field-hint" style={{ color: "var(--danger)" }}>Adresse email invalide.</span>}
            {!noEmail && <span className="field-hint">Issu de la fiche client — modifiable pour cet envoi.</span>}
          </div>

          <div className="field">
            <label>Objet</label>
            <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <div className="field">
            <label>Message</label>
            <textarea className="textarea" style={{ minHeight: 150 }} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div className="send-attach">
            <Icon name="invoices" size={16} />
            <span>{isDevis ? "Devis" : "Facture"} {docRef}.pdf</span>
            <span className="send-attach-size">PDF · pièce jointe</span>
          </div>
        </div>

        <div className="modal-foot">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button icon="send" onClick={() => onConfirm(sendMode)} className={emailValid ? "" : "btn-disabled"}>
            {sendMode === "esign" ? "Envoyer + demander signature" : "Envoyer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------- Sélecteur de client ----------
function ClientSelect({ value, onChange, typeFilter, nav, returnTo }) {
  const { clients } = window.CRM;
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const wrapRef = React.useRef(null);

  const selected = clients.find((c) => c.id === value);
  const pool = typeFilter ? clients.filter((c) => c.type === typeFilter) : clients;
  const results = query ?
  pool.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(query.toLowerCase())) :
  pool;

  // Close on outside click
  React.useEffect(() => {
    const h = (e) => {if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);};
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const pick = (c) => {onChange(c.id);setQuery("");setOpen(false);};

  return (
    <div className="cs-wrap" ref={wrapRef}>
      <div className={`cs-input-row ${open ? "focused" : ""}`} onClick={() => setOpen(true)}>
        <Icon name="search" size={16} className="cs-ico" />
        <input
          className="cs-input"
          placeholder={selected ? selected.name : "Rechercher par nom ou téléphone…"}
          value={query}
          onChange={(e) => {setQuery(e.target.value);setOpen(true);}}
          onFocus={() => setOpen(true)} style={{ opacity: "1" }} />
        
        {selected && !query && <span className="cs-chosen"><Avatar name={selected.name} type={selected.type} clientId={selected.id} size={22} /></span>}
        {selected && <button className="cs-clear" onClick={(e) => {e.stopPropagation();onChange("");setQuery("");}}>
          <Icon name="x" size={13} />
        </button>}
      </div>
      {open &&
      <div className="cs-drop">
        {results.length === 0 && query.trim().length > 0 && (
          <div className="cs-empty cs-create" onMouseDown={(e) => { e.preventDefault(); setOpen(false); nav && nav("clientNew", { prefill: query.trim(), returnTo: returnTo || { view: "quoteNew", params: {} } }); }}>
            <span className="cs-create-icon"><Icon name="plus" size={14} /></span>
            <span>Créer <b>« {query} »</b> comme nouveau client</span>
          </div>
        )}
        {results.length === 0 && query.trim().length === 0 && <div className="cs-empty">Saisissez un nom pour rechercher</div>}
          {results.map((c) =>
        <div key={c.id} className={`cs-opt ${c.id === value ? "sel" : ""}`} onMouseDown={() => pick(c)}>
              <Avatar name={c.name} type={c.type} clientId={c.id} size={28} />
              <div className="col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
                <span className="cs-name">{c.name}</span>
                <span className="cs-phone">{c.phone}</span>
              </div>
              {c.id === value && <Icon name="check" size={15} className="cs-chk" />}
            </div>
        )}
        </div>
      }
    </div>);

}

// ---------- FORMULAIRE DEVIS / FACTURE ----------
function DocFormView({ nav, params }) {
  const kind = params && params.kind || "devis"; // devis | facture
  const { quotes, invoices, appointments, today, clientById } = window.CRM;
  const [clientId, setClientId] = React.useState(params && params.clientId || "");
  const [clientType, setDocClientType] = React.useState(() => {
    if (params && params.clientType) return params.clientType;
    if (params && params.clientId) { const c = clientById(params.clientId); if (c) return c.type; }
    return "";
  });
  const [items, setItems] = React.useState(() => {
    if (params && params.items) return params.items;
    // Facture créée depuis une intervention : pré-remplir depuis le devis lié, sinon depuis l'intervention
    if (params && params.kind === "facture" && params.apptId) {
      const ap = window.CRM.appointments.find((a) => a.id === params.apptId);
      if (ap) {
        if (ap.linkedQuoteId) {
          const q = window.CRM.quotes.find((q) => q.id === ap.linkedQuoteId);
          if (q && q.items && q.items.length) return q.items.map((it) => ({ label: it.label, qty: it.qty, unit: it.unit, price: it.price }));
        }
        return [{ label: ap.title || "", qty: 1, unit: "vitre", price: Number(ap.price) || 0 }];
      }
    }
    if (params && params.prefillPrice) {
      return [{ label: "", qty: 1, unit: "vitre", price: Number(params.prefillPrice) || 0 }];
    }
    return [{ label: "", qty: 1, unit: "vitre", price: 0 }];
  });
  const [note, setNote] = React.useState(() => (params && params.note != null) ? params.note : ((params && params.prefillTitle) ? params.prefillTitle : ""));
  const [validity, setValidity] = React.useState(() => (params && params.validity) ? params.validity : "2026-07-03");
  // Durée estimée de l'intervention (devis uniquement) — stockée en minutes
  const DUR_PRESETS = [30, 60, 90, 120];
  const initDur = (params && params.durationEstimateMin != null) ? params.durationEstimateMin : 60;
  const [durEstMin, setDurEstMin] = React.useState(initDur);
  const [durEstCustom, setDurEstCustom] = React.useState(() => !DUR_PRESETS.includes(initDur));
  const [durEstStr, setDurEstStr] = React.useState(() => !DUR_PRESETS.includes(initDur) ? `${Math.floor(initDur / 60)}:${String(initDur % 60).padStart(2, "0")}` : "");
  const fmtDur = (min) => { const h = Math.floor(min / 60), m = min % 60; if (h && m) return `${h} h ${String(m).padStart(2, "0")}`; if (h) return `${h} h`; return `${m} min`; };
  const [sendModal, setSendModal] = React.useState(false);

  const total = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const ref = kind === "devis" ? nextRef("DEV", quotes) : nextRef("FAC", invoices);

  const updateItem = (i, key, val) => setItems((arr) => arr.map((it, idx) => idx === i ? { ...it, [key]: val } : it));
  const addItem = () => setItems((arr) => [...arr, { label: "", qty: 1, unit: "vitre", price: 0 }]);
  const removeItem = (i) => setItems((arr) => arr.length > 1 ? arr.filter((_, idx) => idx !== i) : arr);

  const canSave = !!clientId && items.some((it) => it.label.trim().length > 0);

  const returnTo = params && params.returnTo;
  const save = (status) => {
    const clean = items.
    filter((it) => it.label).
    map((it) => ({ label: it.label, qty: Number(it.qty) || 1, unit: it.unit, price: Number(it.price) || 0 }));
    if (kind === "devis") {
      // Lien dossier : devis créé depuis un RDV « devis » → réutilise/propage un dossierId commun
      const srcApptId = (params && params.sourceApptId) || null;
      let dossierId = null;
      const src = srcApptId ? appointments.find((a) => a.id === srcApptId) : null;
      if (src && src.dossierId) dossierId = src.dossierId;
      if (!dossierId) dossierId = newId("dos");
      if (src) src.dossierId = dossierId; // le RDV devis d'origine rejoint le dossier
      quotes.unshift({ id: newId("q"), ref, clientId, date: today, validUntil: validity, status, items: clean, note, durationEstimateMin: durEstMin, sourceApptId: srcApptId, dossierId });
      nav(returnTo || "quotes");
    } else {
      // Lien dossier : facture créée depuis une intervention → récupère appt/devis/dossier
      const apptId = (params && params.apptId) || null;
      let linkedApptId = null, linkedQuoteId = null, dossierId = null;
      const ap = apptId ? appointments.find((a) => a.id === apptId) : null;
      if (ap) {
        linkedApptId = ap.id;
        linkedQuoteId = ap.linkedQuoteId || null;
        dossierId = ap.dossierId || null;
      }
      if (!dossierId && linkedQuoteId) { const q = quotes.find((q) => q.id === linkedQuoteId); if (q) dossierId = q.dossierId || null; }
      invoices.unshift({ id: newId("f"), ref, clientId, date: today, dueDate: validity, status, paidDate: null, items: clean, payments: [], linkedApptId, linkedQuoteId, dossierId });
      nav("invoices");
    }
  };

  const isDevis = kind === "devis";
  // Devis associé à la facture (via l'intervention facturée)
  const linkedQuoteForInvoice = (() => {
    if (kind !== "facture") return null;
    const apId = params && params.apptId;
    if (apId) {
      const ap = window.CRM.appointments.find((a) => a.id === apId);
      if (ap && ap.linkedQuoteId) return window.CRM.quotes.find((q) => q.id === ap.linkedQuoteId) || null;
    }
    if (params && params.linkedQuoteId) return window.CRM.quotes.find((q) => q.id === params.linkedQuoteId) || null;
    return null;
  })();

  return (
    <div className="view content-narrow">
      <button className="back-link" onClick={() => nav(isDevis ? "quotes" : "invoices")}><Icon name="chevronLeft" size={16} /> {isDevis ? "Devis" : "Factures"}</button>
      <SectionTitle title={isDevis ? "Nouveau devis" : "Nouvelle facture"} subtitle={ref} />

      {!isDevis && linkedQuoteForInvoice && (
        <div className="linked-quote-banner">
          <span className="lqb-ic"><Icon name="quotes" size={16} /></span>
          <div className="lqb-main">
            <span className="lqb-label">Devis associé</span>
            <span className="lqb-val">{linkedQuoteForInvoice.ref} · {eur(window.CRM.quoteTotal(linkedQuoteForInvoice))}</span>
          </div>
          <span className="lqb-hint">Lignes pré-remplies depuis ce devis — modifiables.</span>
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", alignItems: "flex-start" }}>
        <Card className="pad">
          <div className="grid grid-2" style={{ gap: 14, marginBottom: 16 }}>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Type de client</label>
              <div className="pills">
                {[["", "Tous"], ["particulier", "Particulier"], ["pro", "Professionnel"]].map(([k, l]) =>
                <button key={k} type="button" className={`pill ${clientType === k ? "active" : ""}`}
                onClick={() => {setDocClientType(k);setClientId("");}}>
                    {l}
                  </button>
                )}
              </div>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}><label>Client</label><ClientSelect value={clientId} onChange={(cid) => { setClientId(cid); const c = clientById(cid); if (c) setDocClientType(c.type); }} typeFilter={clientType || null} nav={nav} returnTo={{ view: isDevis ? "quoteNew" : "invoiceNew", params: { kind, clientType, items, note, validity, durationEstimateMin: durEstMin, sourceApptId: params && params.sourceApptId, apptId: params && params.apptId, returnTo } }} /></div>
            <div className="field"><label>Date</label><input className="input" type="date" defaultValue={today} /></div>
            <div className="field"><label>{isDevis ? "Valable jusqu'au" : "Échéance"}</label><input className="input" type="date" value={validity} onChange={(e) => setValidity(e.target.value)} /></div>
          </div>

          <label className="field-label-strong">Prestations</label>
          <div className="lineitems">
            {items.map((it, i) =>
            <div className="lineitem" key={i}>
                <input className="input li-label" placeholder="Désignation (ex : Nettoyage vitres)" value={it.label} onChange={(e) => updateItem(i, "label", e.target.value)} />
                <input className="input li-qty" type="number" min="1" value={it.qty} onChange={(e) => updateItem(i, "qty", e.target.value)} />
                <select className="select li-unit" value={it.unit} onChange={(e) => updateItem(i, "unit", e.target.value)}>
                  <option value="vitre">vitre</option><option value="baie">baie</option><option value="forfait">forfait</option><option value="m²">m²</option><option value="h">heure</option>
                </select>
                <div className="li-price-wrap"><input className="input li-price" type="number" min="0" step="0.5" value={it.price} onChange={(e) => updateItem(i, "price", e.target.value)} /><span className="li-eur">€</span></div>
                <div className="li-total t-mono">{eur((Number(it.qty) || 0) * (Number(it.price) || 0))}</div>
                <button className="li-del" onClick={() => removeItem(i)} title="Supprimer" disabled={items.length === 1}><Icon name="trash" size={16} /></button>
              </div>
            )}
          </div>
          <button className="add-line" onClick={addItem}><Icon name="plus" size={15} /> Ajouter une ligne</button>

          <div className="field" style={{ marginTop: 16 }}><label>Note (optionnel)</label><textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Conditions, remarques…" /></div>

          {isDevis && (
            <div className="field" style={{ marginTop: 16 }}>
              <label>Durée estimée de l'intervention</label>
              <div className="pills">
                {[[30, "30 min"], [60, "1 h"], [90, "1 h 30"], [120, "2 h"]].map(([v, l]) => (
                  <button key={v} type="button" className={`pill ${(!durEstCustom && durEstMin === v) ? "active" : ""}`}
                    onClick={() => { setDurEstCustom(false); setDurEstMin(v); }}>{l}</button>
                ))}
                <button type="button" className={`pill ${durEstCustom ? "active" : ""}`} onClick={() => setDurEstCustom(true)}>Personnaliser</button>
              </div>
              {durEstCustom && (
                <div style={{ marginTop: 10 }}>
                  <input className="input" style={{ maxWidth: 130 }} placeholder="H:MM (ex 1:30)" value={durEstStr}
                    onChange={(e) => {
                      const v = e.target.value; setDurEstStr(v);
                      const m = v.match(/^(\d+):([0-5]?\d)$/);
                      if (m) setDurEstMin(parseInt(m[1], 10) * 60 + parseInt(m[2], 10));
                      else { const j = v.match(/^(\d+)$/); if (j) setDurEstMin(parseInt(j[1], 10)); }
                    }} />
                  <span className="field-hint">Format H:MM — ex : 0:45 = 45 min · 2:30 = 2 h 30</span>
                </div>
              )}
              <span className="field-hint" style={{ marginTop: 8 }}>Servira à pré-remplir la durée du RDV lors de la programmation.</span>
            </div>
          )}
        </Card>

        <Card className="pad form-aside">
          <h3 className="card-h">Récapitulatif</h3>
          <div className="recap-row"><span>Total HT</span><span className="t-mono">{eur(total)}</span></div>
          {isDevis && <div className="recap-row" style={{ color: "var(--muted)" }}><span>Durée estimée</span><span className="t-mono" style={{ whiteSpace: "nowrap", flexShrink: 0 }}>{fmtDur(durEstMin)}</span></div>}
          <div className="recap-tva">TVA non applicable, art. 293 B du CGI</div>
          <div className="recap-grand"><span>Net à payer</span><span className="t-mono">{eur(total)}</span></div>

          <div className="col" style={{ gap: 9, marginTop: 18 }}>
            {returnTo === "maJournee" ? (
              <>
                <Button icon="send" onClick={() => canSave && setSendModal(true)} className={canSave ? "" : "btn-disabled"}>
                  Créer et envoyer
                </Button>
                <Button variant="outline" onClick={() => canSave && save("accepte")} className={canSave ? "" : "btn-disabled"}>Devis accepté (sans envoi)</Button>
                <Button variant="ghost" onClick={() => nav("maJournee")}>Annuler</Button>
              </>
            ) : (
              <>
                <Button icon="send" onClick={() => canSave && setSendModal(true)} className={canSave ? "" : "btn-disabled"}>
                  Créer et envoyer
                </Button>
                <Button variant="outline" onClick={() => save("brouillon")} className={canSave ? "" : "btn-disabled"}>Enregistrer comme créé</Button>
                <Button variant="outline" icon="download" onClick={() => { if (canSave) { save("brouillon"); setTimeout(() => window.print(), 300); } }} className={canSave ? "" : "btn-disabled"}>Télécharger PDF</Button>
                <Button variant="ghost" onClick={() => nav(isDevis ? "quotes" : "invoices")}>Annuler</Button>
              </>
            )}
          </div>
          {!canSave && <p className="form-hint">Sélectionnez un client et ajoutez au moins une prestation.</p>}
        </Card>
      </div>

      {sendModal && (
        <SendDocModal
          kind={kind}
          docRef={ref}
          client={clientById(clientId)}
          total={total}
          onClose={() => setSendModal(false)}
          onConfirm={(mode) => { setSendModal(false); save(isDevis ? "envoye" : "envoyee"); }}
        />
      )}
    </div>);

}

// ---------- SÉLECTEUR DE CRÉNEAU (mini-agenda cliquable) ----------
function SlotPicker({ date, setDate, today, start, setStart, spanMin, computedEnd, appointments, clientById, rdvType }) {
  const META = window.AG_TYPE_META || {};
  const START_H = 7, END_H = 19, ROW = 46, GUTTER = 56;
  const hours = []; for (let h = START_H; h < END_H; h++) hours.push(h);
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

  const dayAppts = appointments.filter((a) => a.date === date);
  const selStart = toMin(start);
  const selEnd = selStart + spanMin;
  const dayMax = END_H * 60;

  const shiftDay = (n) => {
    setDate((prev) => { const d = new Date(prev + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); });
  };
  const fmtFull = (ds) => {
    const d = new Date(ds + "T00:00:00");
    const s = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const isFree = (s, e) => !dayAppts.some((a) => toMin(a.start) < e && toMin(a.end) > s);
  const meta = META[rdvType] || { color: "var(--accent)", soft: "var(--accent-soft)", strong: "var(--accent-strong)" };

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden", background: "var(--surface)" }}>
      {/* Navigation jour */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <button type="button" className="icon-btn" onClick={() => shiftDay(-1)} title="Jour précédent"><Icon name="chevronLeft" size={16} /></button>
        <button type="button" className="icon-btn" onClick={() => shiftDay(1)} title="Jour suivant"><Icon name="chevronRight" size={16} /></button>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{fmtFull(date)}</span>
        {date !== today && <button type="button" className="btn btn-outline btn-sm" onClick={() => setDate(today)} style={{ marginLeft: "auto" }}>Aujourd'hui</button>}
      </div>

      {/* Grille horaire */}
      <div style={{ position: "relative", maxHeight: 340, overflowY: "auto" }}>
        <div style={{ position: "relative", height: hours.length * ROW }}>
          {/* Lignes cliquables */}
          {hours.map((h) => {
            const rowStart = h * 60;
            const tentEnd = rowStart + spanMin;
            const fits = tentEnd <= dayMax;
            const free = isFree(rowStart, tentEnd);
            const selectable = fits && free;
            return (
              <div key={h} style={{ display: "flex", height: ROW, borderTop: "1px solid var(--line)" }}>
                <div style={{ width: GUTTER, flexShrink: 0, fontSize: 11.5, color: "var(--muted)", padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{h}:00</div>
                <button type="button" disabled={!selectable} onClick={() => setStart(`${String(h).padStart(2, '0')}:00`)}
                  style={{
                    flex: 1, border: "none", borderLeft: "1px solid var(--line)", background: "transparent",
                    cursor: selectable ? "pointer" : "default", margin: 0, padding: 0,
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) => { if (selectable) e.currentTarget.style.background = "color-mix(in oklch, var(--accent) 8%, transparent)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  title={selectable ? `Programmer ${h}:00 – ${fmt(tentEnd)}` : "Indisponible"} />
              </div>
            );
          })}

          {/* Calque : RDV existants + créneau sélectionné */}
          <div style={{ position: "absolute", top: 0, left: GUTTER, right: 0, bottom: 0, pointerEvents: "none" }}>
            {dayAppts.map((a) => {
              const top = (toMin(a.start) - START_H * 60) / 60 * ROW;
              const height = Math.max(20, (toMin(a.end) - toMin(a.start)) / 60 * ROW);
              const m = META[a.rdvType] || {};
              const c = clientById(a.clientId);
              return (
                <div key={a.id} style={{
                  position: "absolute", top, height, left: 6, right: 6, borderRadius: 8,
                  background: m.soft || "var(--surface-2)", borderLeft: `3px solid ${m.color || "var(--line-2)"}`,
                  padding: "4px 8px", overflow: "hidden", boxSizing: "border-box",
                }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: m.strong || "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c ? c.name : (a.title || "RDV")}
                  </div>
                  <div style={{ fontSize: 10.5, color: "var(--muted)" }}>{a.start}–{a.end}</div>
                </div>
              );
            })}

            {/* Créneau sélectionné */}
            {selEnd <= dayMax && (
              <div style={{
                position: "absolute", top: (selStart - START_H * 60) / 60 * ROW, height: Math.max(20, spanMin / 60 * ROW),
                left: 6, right: 6, borderRadius: 8, boxSizing: "border-box",
                background: "color-mix(in oklch, " + (meta.color) + " 14%, var(--surface))",
                border: `2px dashed ${meta.color}`, padding: "3px 8px", display: "flex", flexDirection: "column", justifyContent: "center",
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: meta.strong || meta.color }}>Ce RDV · {start}–{computedEnd}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- FORMULAIRE RENDEZ-VOUS ----------
function ApptFormView({ nav, params }) {
  const { appointments, quotes, clientById, quoteTotal, today } = window.CRM;
  const P = params || {};
  const [rdvType, setRdvType] = React.useState(P.rdvType || "intervention");
  const [clientId, setApptClientId] = React.useState(P.clientId || "");
  const [clientType, setApptClientType] = React.useState(() => {
    if (P.clientType) return P.clientType;
    if (P.clientId) { const c = clientById(P.clientId); if (c) return c.type; }
    return "";
  });
  const [linkedQuoteId, setLinkedQuoteId] = React.useState(P.quoteId || P.linkedQuoteId || "");
  const [price, setPrice] = React.useState(P.price != null && P.price !== "" ? String(P.price) : "");
  const [title, setTitle] = React.useState(P.title || "");
  const [date, setDate] = React.useState(P.date || today);
  const [start, setStart] = React.useState(P.start || "09:00");
  const [duration, setDuration] = React.useState(P.duration || 5);   // appel / devis (minutes)
  const [durMin, setDurMin] = React.useState(P.durMin || 60);         // intervention / autre (minutes)
  const [customMode, setCustomMode] = React.useState(() => !!(P.durMin && ![15, 30, 60].includes(P.durMin)));
  const [customStr, setCustomStr] = React.useState(() => (P.durMin && ![15, 30, 60].includes(P.durMin)) ? `${Math.floor(P.durMin / 60)}:${String(P.durMin % 60).padStart(2, '0')}` : "");
  const [recurring, setRecurring] = React.useState(P.recurring || "");
  const [slotPicked, setSlotPicked] = React.useState(!!P.slotPicked);
  const [saveError, setSaveError] = React.useState(null);

  // Pré-remplissage depuis un devis — uniquement à l'entrée initiale, pas au retour de l'agenda
  React.useEffect(() => {
    if (!P.slotReturn && P.quoteId) {
      const q = quotes.find((q) => q.id === P.quoteId);
      if (q) {
        setApptClientId(q.clientId);
        setPrice(String(quoteTotal(q)));
        setTitle(q.items[0]?.label || "");
        if (q.durationEstimateMin && (P.durMin == null)) {
          const est = q.durationEstimateMin;
          setDurMin(est);
          if (![15, 30, 60].includes(est)) { setCustomMode(true); setCustomStr(`${Math.floor(est / 60)}:${String(est % 60).padStart(2, "0")}`); }
        }
      }
    }
  }, []);

  // Client → pré-remplit les devis disponibles pour ce client
  const clientQuotes = clientId ?
  quotes.filter((q) => q.clientId === clientId && q.status === "accepte") :
  quotes.filter((q) => q.status === "accepte");

  // Quand on choisit un devis → pré-remplit client + tarif + description + durée estimée
  const pickQuote = (qid) => {
    setLinkedQuoteId(qid);
    if (qid) {
      const q = quotes.find((q) => q.id === qid);
      if (q) {
        setApptClientId(q.clientId);
        setPrice(String(quoteTotal(q)));
        if (!title) setTitle(q.items[0]?.label || "");
        if (q.durationEstimateMin) {
          const est = q.durationEstimateMin;
          if ([15, 30, 60].includes(est)) { setCustomMode(false); setDurMin(est); }
          else { setCustomMode(true); setDurMin(est); setCustomStr(`${Math.floor(est / 60)}:${String(est % 60).padStart(2, "0")}`); }
        }
      }
    }
  };

  // Quand on choisit un client → refiltre les devis, reset si devis lié ne correspond plus
  const pickClient = (cid) => {
    setApptClientId(cid);
    const c = clientById(cid);
    if (c) setApptClientType(c.type);
    if (linkedQuoteId) {
      const q = quotes.find((q) => q.id === linkedQuoteId);
      if (q && q.clientId !== cid) {setLinkedQuoteId("");setPrice("");}
    }
  };

  const spanMin = (rdvType === 'appel' || rdvType === 'devis') ? duration : durMin;
  const computedEnd = React.useMemo(() => {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + spanMin;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }, [start, spanMin]);

  const slotDateLabel = (() => {
    const d = new Date(date + "T00:00:00");
    const s = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  // Brouillon complet du formulaire — sérialisé avant toute navigation secondaire (agenda, création client)
  const buildDraft = () => ({ rdvType, clientId, clientType, quoteId: linkedQuoteId, linkedQuoteId, price, title, date, start, duration, durMin, recurring, returnTo: P.returnTo || "appointments", slotPicked });

  // Va choisir un créneau dans l'agenda semaine — en emportant tout le brouillon du formulaire
  const goToAgendaPick = () => {
    nav("appointments", { pickSlot: true, draft: buildDraft(), spanMin, rdvType });
  };

  const canSave = (rdvType === 'autre' ? true : !!clientId) && !!title && !!date;
  const returnTo = (params && params.returnTo) || "appointments";
  const save = () => {
    const gap = window.getMinGap ? window.getMinGap() : 10;
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const sMin = toMin(start), eMin = toMin(computedEnd);
    const conflict = appointments.find((a) => a.date === date && a.status !== 'annule' && (eMin + gap > toMin(a.start)) && (sMin < toMin(a.end) + gap));
    if (conflict) {
      const overlap = (toMin(conflict.start) < eMin) && (toMin(conflict.end) > sMin);
      setSaveError(overlap
        ? `Ce créneau chevauche un autre rendez-vous (${conflict.start}–${conflict.end}). Choisissez un autre horaire.`
        : `Ce créneau est trop proche d'un autre rendez-vous (${conflict.start}–${conflict.end}). Un délai minimum de ${gap} minutes est requis entre deux rendez-vous.`);
      return;
    }
    const effLinkedQuoteId = (rdvType === 'intervention' && linkedQuoteId) ? linkedQuoteId : null;
    // Lien dossier : l'intervention hérite du dossierId du devis lié
    let dossierId = null;
    if (effLinkedQuoteId) { const q = quotes.find((q) => q.id === effLinkedQuoteId); if (q) dossierId = q.dossierId || null; }
    appointments.push({ id: newId('a'), clientId, date, start, end: computedEnd, title, rdvType, linkedQuoteId: effLinkedQuoteId, dossierId, status: 'planifie', price: (rdvType === 'appel' || rdvType === 'devis') ? 0 : Number(price) || 0, recurring: recurring || null });
    nav(returnTo);
  };

  return (
    <div className="view content-narrow">
      <button className="back-link" onClick={() => nav(returnTo)}><Icon name="chevronLeft" size={16} /> {returnTo === "maJournee" ? "Ma journée" : "Agenda"}</button>
      <SectionTitle title="Nouveau rendez-vous" />

      {/* Type — centré, hors carte */}
      <div style={{ display: "flex", justifyContent: "center", margin: "18px 0" }}>
        <div className="pills">
          {[["devis", "Devis 📋"], ["intervention", "Intervention 🪣"], ["appel", "Appel téléphonique 📞"], ["autre", "Autre 🗓"]].map(([k, l]) =>
          <button key={k} type="button" className={`pill ${rdvType === k ? "active" : ""}`} onClick={() => setRdvType(k)}>{l}</button>
          )}
        </div>
      </div>

      <Card className="pad" style={{ maxWidth: 680 }}>
        <div className="grid grid-2" style={{ gap: 14 }}>

          {/* Filtre type client + Client — masqué pour Autre */}
          {rdvType !== 'autre' && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Filtrer par type</label>
            <div className="pills">
              {[["", "Tous"], ["particulier", "Particulier"], ["pro", "Professionnel"]].map(([k, l]) =>
              <button key={k} type="button" className={`pill ${clientType === k ? "active" : ""}`}
              onClick={() => {setApptClientType(k);setApptClientId("");setLinkedQuoteId("");setPrice("");}}>
                  {l}
                </button>
              )}
            </div>
          </div>
          )}

          {rdvType !== 'autre' && (
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Client</label>
            <ClientSelect value={clientId} onChange={pickClient} typeFilter={clientType || null} nav={nav} returnTo={{ view: "apptNew", params: { ...buildDraft(), slotReturn: true } }} />
          </div>
          )}

          {/* Devis associé — uniquement pour Intervention */}
          {rdvType === 'intervention' && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Devis associé <span className="t-muted" style={{ fontWeight: 400 }}>(optionnel)</span></label>
              <select className="select" value={linkedQuoteId} onChange={(e) => pickQuote(e.target.value)}>
                <option value="">— Aucun devis lié —</option>
                {clientQuotes.map((q) => <option key={q.id} value={q.id}>{q.ref} — {clientById(q.clientId).name} · {eur(quoteTotal(q))}</option>)}
              </select>
            </div>
          )}

          {/* Tarif — uniquement pour Intervention */}
          {rdvType === 'intervention' && (
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Tarif (€){linkedQuoteId && <span className="field-hint" style={{ marginLeft: 8 }}>Issu du devis — modifiable</span>}</label>
              <input className="input" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
          )}

          {/* Description */}
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Description</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={rdvType === "devis" ? "Objet du devis…" : rdvType === "appel" ? "Sujet de l'appel…" : rdvType === "autre" ? "Ex : Médecin, courses, réunion…" : "Ex : Nettoyage vitrine + véranda"} />
          </div>

          {/* Récurrence — intervention seulement */}
          {rdvType === 'intervention' && <div className="field" style={{ gridColumn: '1 / -1' }}><label>Récurrence</label>
            <select className="select" value={recurring} onChange={(e) => setRecurring(e.target.value)}>
              <option value="">Ponctuel</option><option value="mensuel">Mensuel</option><option value="bimestriel">Bimestriel</option><option value="trimestriel">Trimestriel</option><option value="semestriel">Semestriel</option>
            </select>
          </div>}

          {/* Durée du RDV */}
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Durée</label>
            {(rdvType === 'appel' || rdvType === 'devis') ? (
              <div className="pills">
                {[[5, '5 min'], [10, '10 min'], [15, '15 min'], [20, '20 min']].map(([v, l]) => (
                  <button key={v} type="button" className={`pill ${duration === v ? 'active' : ''}`} onClick={() => setDuration(v)}>{l}</button>
                ))}
              </div>
            ) : (
              <div>
                <div className="pills">
                  {[[15, '15 min'], [30, '30 min'], [60, '1 h']].map(([v, l]) => (
                    <button key={v} type="button" className={`pill ${(!customMode && durMin === v) ? 'active' : ''}`}
                      onClick={() => { setCustomMode(false); setDurMin(v); }}>{l}</button>
                  ))}
                  <button type="button" className={`pill ${customMode ? 'active' : ''}`} onClick={() => setCustomMode(true)}>Personnaliser</button>
                </div>
                {customMode && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <input className="input" style={{ maxWidth: 110, fontVariantNumeric: 'tabular-nums' }} placeholder="1:45" value={customStr}
                      onChange={(e) => {
                        const v = e.target.value; setCustomStr(v);
                        const m = v.match(/^(\d+):([0-5]?\d)$/);
                        if (m) setDurMin(parseInt(m[1], 10) * 60 + parseInt(m[2], 10));
                        else { const j = v.match(/^(\d+)$/); if (j) setDurMin(parseInt(j[1], 10)); }
                      }} />
                    <span className="field-hint">Format H:MM — ex : 0:30 = 30 min · 1:45 = 1 h 45</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Choix du créneau via l'agenda semaine */}
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label>Créneau</label>
            {slotPicked ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12,
                background: "color-mix(in oklch, var(--accent) 8%, var(--surface))", border: "1.5px solid var(--accent)" }}>
                <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name="calendar" size={18} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)", textTransform: "capitalize" }}>{slotDateLabel}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 1 }}>{start} – {computedEnd}</div>
                </div>
                <Button variant="outline" size="sm" icon="calendar" onClick={goToAgendaPick}>Modifier</Button>
              </div>
            ) : (
              <button type="button" onClick={goToAgendaPick}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: "16px", borderRadius: 12, border: "1.5px dashed var(--line-2)", background: "var(--surface-2)",
                  cursor: "pointer", color: "var(--ink-2)", fontWeight: 700, fontSize: 14.5, fontFamily: "var(--font-body)" }}>
                <Icon name="calendar" size={18} /> Choisir un créneau dans l'agenda
              </button>
            )}
          </div>
        </div>

        {saveError && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", marginTop: 16, borderRadius: 12,
            background: "color-mix(in oklch, oklch(0.62 0.18 25) 10%, var(--surface))", border: "1.5px solid oklch(0.62 0.18 25)" }}>
            <span style={{ color: "oklch(0.55 0.2 25)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="clock" size={18} /></span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{saveError}</span>
            <Button variant="outline" size="sm" icon="calendar" onClick={goToAgendaPick}>Choisir un créneau</Button>
          </div>
        )}
        <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <Button variant="ghost" onClick={() => nav("appointments")}>Annuler</Button>
          <Button icon="check" onClick={save} className={canSave ? "" : "btn-disabled"}>Planifier</Button>
        </div>
      </Card>
    </div>);

}

// ---------- FORMULAIRE RÈGLE DE RELANCE ----------
function RuleFormView({ nav }) {
  const { reminderRules } = window.CRM;
  const [name, setName] = React.useState("");
  const [channel, setChannel] = React.useState("sms");
  const [trigger, setTrigger] = React.useState("");
  const [template, setTemplate] = React.useState("");

  const canSave = name && trigger;
  const save = () => {
    reminderRules.push({ id: newId("r"), name, trigger, channel, active: true, template: template || "—" });
    nav("reminders");
  };

  return (
    <div className="view content-narrow">
      <button className="back-link" onClick={() => nav("reminders")}><Icon name="chevronLeft" size={16} /> Relances</button>
      <SectionTitle title="Nouvelle règle de relance" subtitle="Automatisez un rappel" />

      <Card className="pad" style={{ maxWidth: 640 }}>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Nom de la règle</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Rappel passage trimestriel" /></div>
          <div className="field"><label>Canal</label>
            <div className="pills">
              {[["sms", "SMS"], ["email", "Email"]].map(([k, l]) =>
              <button key={k} className={`pill ${channel === k ? "active" : ""}`} onClick={() => setChannel(k)}>{l}</button>
              )}
            </div>
          </div>
          <div className="field"><label>Déclencheur</label><input className="input" value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="Ex : 24h avant le RDV" /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Message</label><textarea className="textarea" value={template} onChange={(e) => setTemplate(e.target.value)} placeholder="Bonjour {prenom}, …  (variables : {prenom}, {heure}, {ref}, {montant})" /></div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <Button variant="ghost" onClick={() => nav("reminders")}>Annuler</Button>
          <Button icon="check" onClick={save} className={canSave ? "" : "btn-disabled"}>Activer la règle</Button>
        </div>
      </Card>
    </div>);

}

// ---------- DÉTAIL INTERVENTION ----------
function ApptDetailView({ nav, params }) {
  const { appointments, clientById, quotes, invoices, quoteTotal, invoiceTotal, today } = window.CRM;
  const a = appointments.find((x) => x.id === (params && params.id));
  if (!a) return <div className="view"><button className="back-link" onClick={() => nav("maJournee")}><Icon name="chevronLeft" size={16} /> Retour</button><p>Intervention introuvable.</p></div>;

  const c = clientById(a.clientId);
  const linkedQ = a.linkedQuoteId ? quotes.find((q) => q.id === a.linkedQuoteId) : null;
  // Facture liée : priorité aux liens fiables (linkedApptId → dossierId → linkedQuoteId),
  // repli client + date uniquement pour les anciennes données sans liens.
  const relatedInv = (() => {
    const byAppt = invoices.find((f) => f.linkedApptId === a.id);
    if (byAppt) return byAppt;
    if (a.dossierId) { const byDos = invoices.find((f) => f.dossierId === a.dossierId); if (byDos) return byDos; }
    if (a.linkedQuoteId) { const byQuote = invoices.find((f) => f.linkedQuoteId === a.linkedQuoteId); if (byQuote) return byQuote; }
    // Repli legacy : aucune facture porteuse de lien → on évite de rattacher par hasard
    const hasAnyLink = invoices.some((f) => f.linkedApptId || f.linkedQuoteId || f.dossierId);
    if (hasAnyLink) return null;
    return invoices.filter((f) => f.clientId === a.clientId && f.date >= a.date).sort((x, y) => y.date.localeCompare(x.date))[0] || null;
  })();
  const [status, setStatus] = React.useState(a.status);
  const COLORS = { planifie: "var(--water)", termine: "var(--success)", annule: "var(--danger)" };
  const RDV_TYPE_LABEL = { devis: "📋 Devis", intervention: "🪣 Intervention", appel: "📞 Appel téléphonique", autre: "🗓 Autre" };

  const validate = () => {setStatus("termine");a.status = "termine";};
  const cancel = () => {setStatus("annule");a.status = "annule";};

  return (
    <div className="view content-narrow">
      <button className="back-link" onClick={() => nav("maJournee")}><Icon name="chevronLeft" size={16} /> Ma journée</button>

      {/* En-tête */}
      <div className="apdt-head">
        <div className="apdt-dot" style={{ background: COLORS[status] || "var(--accent)" }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 22 }}>{c.name}</h1>
            <Badge status={status} />
            {a.rdvType && <Badge tone="neutral">{RDV_TYPE_LABEL[a.rdvType] || a.rdvType}</Badge>}
          </div>
          <div className="client-contacts" style={{ marginTop: 6 }}>
            <span className="row" style={{ gap: 5 }}><Icon name="calendar" size={14} />{fmtDate(a.date, true)}</span>
            <span className="row" style={{ gap: 5 }}><Icon name="clock" size={14} />{a.start} → {a.end}</span>
            <span className="row" style={{ gap: 5 }}><Icon name="euro" size={14} />{eur(a.price)}</span>
          </div>
        </div>
        {status !== "termine" && status !== "annule" &&
        <div className="row" style={{ gap: 8 }}>
            <Button variant="outline" size="sm" icon="edit" onClick={() => nav("apptNew", { editId: a.id })}>Modifier</Button>
          </div>
        }
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 18, gap: 16 }}>
        {/* Infos client */}
        <Card className="pad">
          <h3 className="card-h">Client</h3>
          <dl className="deflist">
            <div><dt>Nom</dt><dd><button className="apdt-link" onClick={() => nav("clientDetail", { id: c.id })}>{c.name} <Icon name="arrowUpRight" size={13} /></button></dd></div>
            <div><dt>Téléphone</dt><dd><a href={"tel:" + c.phone} className="apdt-link">{c.phone}</a></dd></div>
            <div><dt>Adresse</dt><dd>{c.address}</dd></div>
            {c.notes && <div><dt>Notes</dt><dd style={{ color: "var(--ink-2)", fontStyle: "italic" }}>{c.notes}</dd></div>}
          </dl>
        </Card>

        {/* Prestation */}
        {(a.rdvType === "appel" || a.rdvType === "autre") ? (
          <Card className="pad">
            <h3 className="card-h">Détails</h3>
            <dl className="deflist">
              <div><dt>{a.rdvType === "appel" ? "Sujet" : "Objet"}</dt><dd>{a.title}</dd></div>
              <div><dt>Type</dt><dd>{RDV_TYPE_LABEL[a.rdvType]}</dd></div>
              <div><dt>Horaire</dt><dd>{a.start} → {a.end}</dd></div>
            </dl>
          </Card>
        ) : (
          <Card className="pad">
            <h3 className="card-h">Prestation</h3>
            <dl className="deflist">
              <div><dt>Description</dt><dd>{a.title}</dd></div>
              {a.price > 0 && <div><dt>Tarif</dt><dd style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{eur(a.price)}</dd></div>}
              {a.recurring && <div><dt>Rythme</dt><dd><Badge tone="neutral">{a.recurring}</Badge></dd></div>}
              {a.rdvType && <div><dt>Type</dt><dd>{RDV_TYPE_LABEL[a.rdvType]}</dd></div>}
            </dl>
          </Card>
        )}
      </div>

      {/* Devis lié */}
      {linkedQ &&
      <Card className="pad" style={{ marginTop: 16, borderColor: "var(--water)", cursor: "pointer" }} onClick={() => nav("quotes")}>
          <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <h3 className="card-h" style={{ marginBottom: 4 }}>Devis associé</h3>
              <div className="row" style={{ gap: 8 }}>
                <span className="t-strong">{linkedQ.ref}</span>
                <Badge status={linkedQ.status} />
              </div>
              <div className="cc-meta" style={{ marginTop: 4 }}>{linkedQ.items[0]?.label}</div>
            </div>
            <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, color: "var(--water)", fontVariantNumeric: "tabular-nums" }}>{eur(quoteTotal(linkedQ))}</span>
              <Icon name="arrowUpRight" size={16} className="t-muted" />
            </div>
          </div>
        </Card>
      }

      {/* Actions */}
      {(status === "termine" || status === "annule") &&
      <Card className="pad" style={{ marginTop: 16 }}>
          <h3 className="card-h">Actions</h3>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            {status === "termine" && a.rdvType === "devis" &&
          <Button icon="quotes" onClick={() => nav("quoteNew", { clientId: a.clientId, prefillTitle: a.title, prefillPrice: a.price, sourceApptId: a.id, returnTo: "maJournee" })}>Créer le devis</Button>
          }
            {status === "termine" && !relatedInv && a.rdvType !== "appel" && a.rdvType !== "autre" && a.rdvType !== "devis" && a.price > 0 &&
          <Button icon="invoices" onClick={() => nav("invoiceNew", { clientId: a.clientId, apptId: a.id })}>Créer la facture</Button>
          }
            {status === "termine" && (a.rdvType === "appel" || a.rdvType === "autre" || a.price === 0) && !relatedInv &&
          <span className="badge badge-success">✓ {a.rdvType === "appel" ? "Appel effectué" : a.rdvType === "autre" ? "Terminé" : "Terminé"}</span>
          }
            {status === "termine" && relatedInv &&
          <div className="row" style={{ gap: 8 }}>
                <span className="badge badge-success">✓ Facturé — {relatedInv.ref}</span>
                <Button variant="ghost" size="sm" icon="invoices" onClick={() => nav("invoices")}>Voir</Button>
              </div>
          }
            {status === "annule" &&
          <Button variant="outline" icon="calendar" onClick={() => nav("apptNew", { clientId: a.clientId })}>Replanifier</Button>
          }
          </div>
        </Card>
      }

      {/* Supprimer / annuler */}
      {status !== "annule" && status !== "termine" &&
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <Button variant="danger" size="sm" onClick={cancel}>Annuler {a.rdvType === "appel" ? "l'appel" : a.rdvType === "autre" ? "le RDV" : "l'intervention"}</Button>
        </div>
      }
    </div>);

}

// ---------- FORMULAIRE CLIENT ----------
function ClientFormView({ nav, params }) {
  const { clientById, clients, newId } = window.CRM;
  const editing = params && params.id ? clientById(params.id) : null;
  const prefill = params && params.prefill ? params.prefill : "";
  const returnTo = params && params.returnTo ? params.returnTo : null;
  const [type, setType] = React.useState(editing ? editing.type : "particulier");
  const [name, setName] = React.useState(editing ? editing.name : prefill);
  const [contact, setContact] = React.useState(editing ? (editing.contact || "") : "");
  const [siret, setSiret] = React.useState(editing ? editing.siret || "" : "");
  const [phone, setPhone] = React.useState(editing ? (editing.phone || "") : "");
  const [email, setEmail] = React.useState(editing ? (editing.email || "") : "");
  const [address, setAddress] = React.useState(editing ? (editing.address || "") : "");
  const [zone, setZone] = React.useState(editing ? (editing.zone || "") : "");
  const [notes, setNotes] = React.useState(editing ? (editing.notes || "") : "");
  const defaultRythme = editing ? (editing.tags.includes("hebdomadaire") ? "hebdomadaire" : editing.tags.includes("mensuel") ? "mensuel" : editing.tags.includes("ponctuel") ? "ponctuel" : "personnaliser") : "mensuel";
  const defaultCustom = editing ? (editing.tags.find(t => !["hebdomadaire","mensuel"].includes(t) && ["bimestriel","trimestriel","semestriel","ponctuel"].includes(t)) || "") : "";
  const [rythme, setRythme] = React.useState(defaultRythme);
  const [customRythme, setCustomRythme] = React.useState(defaultCustom);

  const saveClient = () => {
    const rythmeTag = rythme === "personnaliser" ? (customRythme.trim() || "personnalisé") : rythme;
    const tags = [...(type === "pro" ? ["pro"] : []), rythmeTag].filter(Boolean);
    if (editing) {
      Object.assign(editing, { type, name: name.trim() || editing.name, contact: type === "pro" ? contact.trim() : name.trim(), siret: type === "pro" ? siret.trim() : "", phone: phone.trim(), email: email.trim(), address: address.trim(), zone: zone.trim(), notes: notes.trim(), tags });
      nav("clientDetail", { id: editing.id });
    } else {
      const finalName = name.trim() || prefill || "Nouveau client";
      const newClient = { id: newId("c"), type, name: finalName, contact: type === "pro" ? (contact.trim() || finalName) : finalName, siret: type === "pro" ? siret.trim() : "", phone: phone.trim(), email: email.trim(), address: address.trim(), zone: zone.trim(), notes: notes.trim(), tags, vitres: 0, rating: 5, since: window.CRM.today };
      clients.push(newClient);
      if (returnTo) { nav(returnTo.view, { ...returnTo.params, clientId: newClient.id, clientType: newClient.type }); }
      else { nav("clientDetail", { id: newClient.id }); }
    }
  };

  return (
    <div className="view content-narrow">
      <button className="back-link" onClick={() => nav(editing ? "clientDetail" : "clients", editing ? { id: editing.id } : null)}><Icon name="chevronLeft" size={16} /> Retour</button>
      <SectionTitle title={editing ? "Modifier le client" : "Nouveau client"} subtitle={editing ? editing.name : "Ajouter un client à votre carnet"} />

      <Card className="pad" style={{ maxWidth: 720 }}>
        <div className="field" style={{ marginBottom: 16 }}>
          <label>Type de client</label>
          <div className="pills">
            {[["particulier", "Particulier"], ["pro", "Professionnel"]].map(([k, l]) =>
            <button key={k} className={`pill ${type === k ? "active" : ""}`} onClick={() => setType(k)}>{l}</button>
            )}
          </div>
        </div>
        <div className="grid grid-2" style={{ gap: 14 }}>
          <div className="field"><label>{type === "pro" ? "Raison sociale" : "Nom complet"}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "pro" ? "Boulangerie Léon" : "Camille Rousseau"} autoFocus={!!prefill} /></div>
          {type === "pro" && <div className="field"><label>Contact</label><input className="input" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Marc Léon" /></div>}
          {type === "pro" &&
          <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>SIRET / SIREN</label>
              <input className="input" value={siret} onChange={(e) => setSiret(e.target.value)}
            placeholder="812 456 789 00021" maxLength={17}
            style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }} />
              <span className="field-hint"></span>
            </div>
          }
          <div className="field"><label>Téléphone</label><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 12 34 56 78" /></div>
          <div className="field"><label>Email</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.fr" /></div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Adresse</label><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="14 rue des Lavandières, 69007 Lyon" /></div>
          <div className="field"><label>Zone</label><input className="input" value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Vieux Lyon" /></div>
          <div className="field">
            <label>Rythme de passage</label>
            <div className="pills" style={{ marginBottom: rythme === "personnaliser" ? 8 : 0 }}>
              {[["hebdomadaire","Hebdomadaire"],["mensuel","Mensuel"],["ponctuel","Ponctuel"],["personnaliser","Personnaliser"]].map(([k,l]) => (
                <button key={k} type="button" className={`pill ${rythme===k?"active":""}`} onClick={() => setRythme(k)}>{l}</button>
              ))}
            </div>
            {rythme === "personnaliser" && (
              <input className="input" value={customRythme} onChange={(e) => setCustomRythme(e.target.value)}
                placeholder="Ex : toutes les 6 semaines, trimestriel, etc." />
            )}
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}><label>Notes terrain</label><textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Code portail, accès, préférences horaires…" /></div>
        </div>
        <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
          <Button variant="ghost" onClick={() => nav(editing ? "clientDetail" : "clients", editing ? { id: editing.id } : null)}>Annuler</Button>
          <Button icon="check" onClick={saveClient}>{editing ? "Enregistrer" : "Créer le client"}</Button>
        </div>
      </Card>
    </div>);

}

Object.assign(window, { DocFormView, ApptFormView, ApptDetailView, RuleFormView, ClientSelect, SendDocModal, ClientFormView });
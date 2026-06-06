/* Vues principales : Dashboard, Clients (liste + fiche) */

// ---------- Mini graphique en barres (CSS) ----------
function BarChart({ data, valueKey = "ca", labelKey = "month", format = (v) => v, height = 150 }) {
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="barchart" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(6, (d[valueKey] / max) * 100);
        const isLast = i === data.length - 1;
        return (
          <div className="bar-col" key={i}>
            <div className="bar-val">{format(d[valueKey])}</div>
            <div className={`bar ${isLast ? "bar-current" : ""}`} style={{ height: `${h}%` }} />
            <div className="bar-label">{d[labelKey]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- DASHBOARD ----------
function DashboardView({ nav }) {
  const { appointments, invoices, quotes, clientById, revenueByMonth, today, invoiceTotal, invoicePaid, quoteTotal } = window.CRM;

  const todayAppts = appointments.filter((a) => a.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const caMonth = invoices.filter((f) => f.status === "payee" && f.paidDate && f.paidDate.startsWith("2026-05")).reduce((s, f) => s + invoicePaid(f), 0);
  const outstanding = invoices.filter((f) => f.status === "envoyee" || f.status === "en_retard");
  const outstandingTotal = outstanding.reduce((s, f) => s + invoiceTotal(f) - invoicePaid(f), 0);
  const overdue = invoices.filter((f) => f.status === "en_retard");
  const pendingQuotes = quotes.filter((q) => q.status === "envoye");

  // ── Valeurs dynamiques de l'en-tête (plus aucune donnée figée) ──
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const todayLabel = cap(new Date(today + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }));
  const interventionsToday = todayAppts.filter((a) => a.rdvType === "intervention");
  const dayRange = todayAppts.length ? `${todayAppts[0].start} → ${todayAppts[todayAppts.length - 1].end}` : "Aucun RDV";
  const ym = today.slice(0, 7);
  const monthName = new Date(today + "T00:00:00").toLocaleDateString("fr-FR", { month: "long" });
  const caMonthDyn = invoices.filter((f) => f.status === "payee" && f.paidDate && f.paidDate.startsWith(ym)).reduce((s, f) => s + invoicePaid(f), 0);
  const caMonthCount = invoices.filter((f) => f.status === "payee" && f.paidDate && f.paidDate.startsWith(ym)).length;
  const scheduledIds = new Set(appointments.filter(a => a.linkedQuoteId).map(a => a.linkedQuoteId));
  const devisAProg = quotes.filter(q => q.status === "accepte" && !scheduledIds.has(q.id));
  // Interventions réalisées (terminées) sans facture émise → à facturer
  const apptHasInvoice = (a) => invoices.some((f) =>
    f.linkedApptId === a.id ||
    (a.dossierId && f.dossierId === a.dossierId) ||
    (a.linkedQuoteId && f.linkedQuoteId === a.linkedQuoteId));
  const interventionsAFacturer = appointments.filter((a) =>
    a.rdvType === "intervention" && a.status === "termine" && a.price > 0 && !apptHasInvoice(a));

  // ── Notifications (Accueil) : vert = accepté/payé · rouge = devis +7j / facture +20j ──
  const daysSince = (d) => Math.floor((new Date(today + "T00:00:00") - new Date(d + "T00:00:00")) / 86400000);
  const notifsRed = [
    ...quotes.filter(q => q.status === "envoye" && daysSince(q.date) > 7).map(q => ({ kind: "devis", title: "Devis en attente · +7 jours", ref: q.ref, client: (clientById(q.clientId) || {}).name, date: q.date, status: "Sans réponse", btn: "Voir le devis", go: () => nav("quotes") })),
    ...invoices.filter(f => (f.status === "envoyee" || f.status === "en_retard") && daysSince(f.date) > 20).map(f => ({ kind: "facture", title: "Facture impayée · +20 jours", ref: f.ref, client: (clientById(f.clientId) || {}).name, date: f.date, status: "En retard", btn: "Voir la facture", go: () => nav("invoices") })),
  ].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  const notifsGreen = [
    ...quotes.filter(q => q.status === "accepte" && !scheduledIds.has(q.id)).map(q => ({ kind: "devis", title: "Devis accepté", ref: q.ref, client: (clientById(q.clientId) || {}).name, date: q.date, status: "Accepté", btn: "Voir le devis", go: () => nav("quotes") })),
    ...invoices.filter(f => f.status === "payee" && f.paidDate && daysSince(f.paidDate) <= 2).map(f => ({ kind: "facture", title: "Facture payée", ref: f.ref, client: (clientById(f.clientId) || {}).name, date: f.paidDate || f.date, status: "Payée", btn: "Voir la facture", go: () => nav("invoices") })),
  ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const notifIcon = (n) => n.kind === "devis" ? (n.status === "Accepté" ? "check" : "clock") : (n.status === "Payée" ? "euro" : "invoices");

  const alerts = [
    ...interventionsAFacturer.map((a) => ({ tone: "warning", icon: "invoices", text: `Intervention à facturer`, sub: `${clientById(a.clientId).name} · ${a.title} · ${eur(a.price)}`, go: () => nav("invoiceNew", { clientId: a.clientId, apptId: a.id }) })),
    ...devisAProg.map((q) => ({ tone: "success", icon: "calendar", text: `Devis ${q.ref} à programmer`, sub: `${clientById(q.clientId).name} · ${eur(quoteTotal(q))}`, go: () => nav("apptNew", { clientId: q.clientId, quoteId: q.id, returnTo: "dashboard" }) })),
    ...overdue.map((f) => ({ tone: "danger", icon: "invoices", text: `Facture ${f.ref} en retard`, sub: `${clientById(f.clientId).name} · ${eur(invoiceTotal(f))}`, go: () => nav("invoices") })),
    ...pendingQuotes.map((q) => ({ tone: "water", icon: "quotes", text: `Devis ${q.ref} sans réponse`, sub: `${clientById(q.clientId).name} · envoyé le ${fmtDateShort(q.date)}`, go: () => nav("quotes") })),
  ].slice(0, 6);

  return (
    <div className="view content-narrow">
      <div className="dash-hero">
        <div>
          <p className="dash-greet">Bonjour Julien 👋</p>
          <h1 className="dash-title">{todayLabel} — {todayAppts.length} rendez-vous prévu{todayAppts.length > 1 ? "s" : ""}</h1>
        </div>
        <Button variant="outline" size="sm" icon="plus" onClick={() => nav("apptNew")}>Nouveau RDV</Button>
      </div>



      <div className="grid grid-4 stats-grid" style={{ marginTop: 22 }}>
        <Stat label={`CA du mois (${monthName})`} value={eur(caMonthDyn)} delta={caMonthCount > 0 ? `${caMonthCount} facture${caMonthCount > 1 ? "s" : ""} réglée${caMonthCount > 1 ? "s" : ""}` : "encaissé ce mois"} deltaTone={caMonthCount > 0 ? "up" : "neutral"} icon="euro" />
        <Stat label="En attente de paiement" value={eur(outstandingTotal)} delta={`${outstanding.length} facture${outstanding.length > 1 ? "s" : ""}`} deltaTone="neutral" icon="invoices" />
        <Stat label="RDV aujourd'hui" value={todayAppts.length} delta={dayRange} deltaTone="neutral" icon="calendar" />
        <Stat label="Devis en cours" value={pendingQuotes.length} delta={eur(pendingQuotes.reduce((s, q) => s + quoteTotal(q), 0))} deltaTone="neutral" icon="quotes" />
      </div>

      {/* Notifications */}
      <Card className="pad" style={{ marginTop: 18 }}>
        <SectionTitle compact title="Notifications" subtitle={`${notifsRed.length} à surveiller · ${notifsGreen.length} validé${notifsGreen.length > 1 ? "s" : ""}`} />
        {(notifsRed.length === 0 && notifsGreen.length === 0) ? (
          <div className="v2-empty-zone" style={{ marginTop: 4 }}><Icon name="check" size={18} /><span>Aucune notification</span></div>
        ) : (
          <div style={{ marginTop: 4 }}>
            {notifsRed.length > 0 && (
              <>
                <div className="dn-sec-h"><span className="dn-dot" style={{ background: "var(--danger)" }} /> À surveiller <span className="dn-count" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{notifsRed.length}</span></div>
                {notifsRed.map((n, i) => (
                  <div className="dn-item dn-red" key={"r" + i}>
                    <span className="dn-ic"><Icon name={notifIcon(n)} size={18} /></span>
                    <div className="dn-main">
                      <div className="dn-title">{n.title}</div>
                      <div className="dn-desc">{n.ref} — <b>{n.client}</b></div>
                      <div className="dn-meta"><span>envoyé le {fmtDateShort(n.date)}</span><span className="dn-chip" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{n.status}</span></div>
                    </div>
                    <Button variant="outline" size="sm" className="dn-btn" onClick={n.go}>{n.btn}</Button>
                  </div>
                ))}
              </>
            )}
            {notifsGreen.length > 0 && (
              <>
                <div className="dn-sec-h" style={{ marginTop: notifsRed.length > 0 ? 20 : 4 }}><span className="dn-dot" style={{ background: "var(--success)" }} /> Validé / Payé <span className="dn-count" style={{ background: "var(--success-soft)", color: "var(--success)" }}>{notifsGreen.length}</span></div>
                {notifsGreen.map((n, i) => (
                  <div className="dn-item dn-green" key={"g" + i}>
                    <span className="dn-ic"><Icon name={notifIcon(n)} size={18} /></span>
                    <div className="dn-main">
                      <div className="dn-title">{n.title}</div>
                      <div className="dn-desc">{n.ref} — <b>{n.client}</b></div>
                      <div className="dn-meta"><span>{fmtDateShort(n.date)}</span><span className="dn-chip" style={{ background: "var(--success-soft)", color: "var(--success)" }}>{n.status}</span></div>
                    </div>
                    <Button variant="outline" size="sm" className="dn-btn" onClick={n.go}>{n.btn}</Button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Tournée + alertes */}
      <div className="grid" style={{ gridTemplateColumns: "1fr", marginTop: 18, alignItems: "stretch", minHeight: "calc(100vh - 320px)" }}>

        <Card className="pad" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <SectionTitle compact title="À traiter" subtitle={`${alerts.length} éléments`} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            {alerts.map((al, i) => (
              <div className="alert-item" key={i} onClick={al.go}>
                <span className={`alert-ic alert-${al.tone}`}><Icon name={al.icon} size={17} /></span>
                <div className="col" style={{ gap: 1, flex: 1, minWidth: 0 }}>
                  <span className="ai-text">{al.text}</span>
                  <span className="ai-sub">{al.sub}</span>
                </div>
                <Icon name="chevronRight" size={16} className="ai-chev" />
              </div>
            ))}
            <div className="v2-empty-zone">
              <Icon name="check" size={18} />
              <span>Tout est à jour</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- CLIENTS (liste) ----------
function ClientsView({ nav }) {
  const { clients, appointments, invoices, invoiceTotal } = window.CRM;
  const [filter, setFilter] = React.useState("tous");
  const [q, setQ] = React.useState("");

  const filtered = clients.filter((c) => {
    if (filter === "pro" && c.type !== "pro") return false;
    if (filter === "particulier" && c.type !== "particulier") return false;
    if (q && !(`${c.name} ${c.zone} ${c.address} ${c.phone}`.toLowerCase().includes(q.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  const lastVisit = (id) => {
    const past = appointments.filter((a) => a.clientId === id && a.status === "termine").sort((a, b) => b.date.localeCompare(a.date));
    return past[0] ? past[0].date : null;
  };

  return (
    <div className="view">
      <SectionTitle
        title="Clients"
        subtitle=""
        action={<Button icon="plus" onClick={() => nav("clientNew")}>Nouveau client</Button>}
      />

      {clients.length === 0 ? (
        <Card style={{ marginTop: 16 }}>
          <EmptyState
            icon="clients"
            title="Aucun client pour le moment"
            text="Ajoutez votre premier client pour créer des rendez-vous, devis et factures."
            actionLabel="Créer un client"
            onAction={() => nav("clientNew")}
          />
        </Card>
      ) : (
      <>
      <div className="toolbar">
        <div className="search-box" style={{ width: 260 }}>
          <Icon name="search" size={17} />
          <input placeholder="Nom, zone, adresse, téléphone…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="pills">
          {[["tous", "Tous"], ["particulier", "Particuliers"], ["pro", "Professionnels"]].map(([k, l]) => (
            <button key={k} className={`pill ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      </div>

      <Card style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Client</th>
                <th className="hide-mobile">Zone</th>
                <th className="hide-mobile">Dernier passage</th>
                <th className="hide-mobile">Rythme</th>
                <th className="num">Vitres</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const lv = lastVisit(c.id);
                // Rythme = le 1er tag qui n'est pas « pro » (robuste : couvre hebdomadaire + rythmes personnalisés)
                const rhythm = (c.tags || []).find((t) => t !== "pro") || "—";
                return (
                  <tr key={c.id} className="clickable" onClick={() => nav("clientDetail", { id: c.id })}>
                    <td>
                      <div className="cell-client">
                        <Avatar name={c.name} type={c.type} clientId={c.id} />
                        <div>
                          <div className="cc-name">{c.name}</div>
                          <div className="cc-meta">{c.type === "pro" ? c.contact : c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hide-mobile t-muted">{c.zone}</td>
                    <td className="hide-mobile t-muted">{lv ? fmtDateShort(lv) : "—"}</td>
                    <td className="hide-mobile"><Badge tone="neutral">{rhythm}</Badge></td>
                    <td className="num t-mono">{c.vitres}</td>
                    <td className="num"><Icon name="chevronRight" size={16} className="t-muted" /></td>
                    <td className="num">
                      <button style={{ fontSize: 20, lineHeight: 1, padding: "4px 8px", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", borderRadius: 8 }}
                        title="Supprimer"
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Supprimer ${c.name} ?`)) { window.CRM.clients.splice(window.CRM.clients.findIndex(x=>x.id===c.id),1); if (window.CRM.save) window.CRM.save(); setFilter(f=>f); } }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan="7" className="t-muted" style={{ textAlign: "center", padding: 28 }}>Aucun client ne correspond à votre recherche.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}
    </div>
  );
}

// ---------- FICHE CLIENT ----------
// libellés de statut par type
const HIST_QUOTE_ST = { brouillon: "créé", envoye: "envoyé", accepte: "accepté", refuse: "refusé", expire: "expiré" };
const HIST_APPT_ST = { planifie: "programmée", termine: "réalisée", annule: "annulée" };
const HIST_CALL_ST = { planifie: "à rappeler", termine: "effectué", annule: "annulé" };
const HIST_INV_ST = { brouillon: "créée", creee: "créée", envoyee: "envoyée", payee: "payée", en_retard: "en retard" };
const HIST_TONE = { accepte: "success", payee: "success", termine: "success", envoye: "water", envoyee: "water", planifie: "warning", en_retard: "danger", refuse: "danger", annule: "danger", brouillon: "muted", creee: "muted", expire: "warning" };

function HistPill({ label, color, soft }) {
  return <span className="htl-type" style={{ background: soft, color }}><span className="htl-tdot" style={{ background: color }} />{label}</span>;
}
function HistChip({ text, tone }) {
  const map = { success: ["var(--success-soft)", "var(--success)"], water: ["var(--water-soft)", "var(--water)"], warning: ["var(--warning-soft)", "var(--warning)"], danger: ["var(--danger-soft, #f7dcd8)", "var(--danger, #c0492f)"], muted: ["var(--surface-2)", "var(--muted)"] };
  const [bg, fg] = map[tone] || map.muted;
  return <span className="htl-chip" style={{ background: bg, color: fg }}>{text}</span>;
}

function ClientDossiers({ entries, allAppts, nav, quoteTotal, invoiceTotal }) {
  const META = window.AG_TYPE_META || {};
  const fmtDur = (min) => { if (!min) return null; const h = Math.floor(min / 60), m = min % 60; if (h && m) return `${h} h ${String(m).padStart(2, "0")}`; if (h) return `${h} h`; return `${m} min`; };
  const apptDur = (a) => { if (!a || !a.start || !a.end) return null; const [h, m] = a.start.split(":").map(Number); const [h2, m2] = a.end.split(":").map(Number); return (h2 * 60 + m2) - (h * 60 + m); };

  const QUOTE_ST = { brouillon: "créé", envoye: "envoyé", accepte: "accepté", refuse: "refusé", expire: "expiré" };
  const APPT_ST = { planifie: "planifiée", termine: "réalisée", annule: "annulée" };
  const INV_ST = { brouillon: "créée", creee: "créée", envoyee: "envoyée", payee: "payée", en_retard: "en retard" };

  // Statut global du dossier
  const globalStatus = (q, interv, facture) => {
    if (facture) {
      if (facture.status === "payee") return { label: "Payé", tone: "success" };
      if (facture.status === "en_retard") return { label: "Paiement en retard", tone: "danger" };
      return { label: "Paiement en attente", tone: "water" };
    }
    if (interv && interv.status === "termine") return { label: "À facturer", tone: "warning" };
    if (interv && interv.status === "planifie") return { label: "Intervention prévue", tone: "water" };
    if (q.status === "accepte") return { label: "À programmer", tone: "success" };
    const map = { brouillon: { label: "Devis créé", tone: "neutral" }, envoye: { label: "Devis envoyé", tone: "water" }, refuse: { label: "Devis refusé", tone: "danger" }, expire: { label: "Devis expiré", tone: "warning" } };
    return map[q.status] || { label: q.status, tone: "neutral" };
  };

  const chipBg = { success: ["var(--success-soft)", "var(--success)"], water: ["var(--water-soft)", "var(--water)"], warning: ["var(--warning-soft)", "var(--warning)"], danger: ["var(--danger-soft, #f7dcd8)", "var(--danger, #c0492f)"], neutral: ["var(--surface-2)", "var(--muted)"] };
  const Chip = ({ tone, children }) => { const [bg, fg] = chipBg[tone] || chipBg.neutral; return <span className="dos-chip" style={{ background: bg, color: fg }}>{children}</span>; };

  // Étape : pastille colorée + libellé + valeur
  const Step = ({ icon, color, label, value, sub, muted, action }) => (
    <div className={`dos-step ${muted ? "dos-step-muted" : ""}`}>
      <span className="dos-step-dot" style={{ background: muted ? "var(--line-2)" : color }}>
        {icon && <Icon name={icon} size={11} />}
      </span>
      <div className="dos-step-main">
        <span className="dos-step-label">{label}</span>
        <span className="dos-step-val">{value}{sub && <span className="dos-step-sub"> · {sub}</span>}</span>
      </div>
      {action}
    </div>
  );

  const dossiers = [];
  const apptDossiers = [];
  const standalone = [];
  entries.forEach((e) => {
    if (e.kind === "dossier") {
      const q = e.quote;
      const rdvDevis = (e.appts || []).find((a) => a.rdvType === "devis")
        || (q.sourceApptId ? allAppts.find((a) => a.id === q.sourceApptId) : null);
      const interv = (e.appts || []).filter((a) => a.rdvType === "intervention").sort((a, b) => b.date.localeCompare(a.date))[0] || null;
      const facture = (e.invoices || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null;
      dossiers.push({ q, rdvDevis, interv, facture });
    } else if (e.kind === "apptDossier") {
      const interv = e.appt;
      const facture = (e.invoices || []).slice().sort((a, b) => b.date.localeCompare(a.date))[0] || null;
      apptDossiers.push({ interv, facture });
    } else if (e.kind === "facture") {
      standalone.push({ type: "facture", invoice: e.invoice });
    } else if (e.kind === "appt") {
      standalone.push({ type: "appt", appt: e.appt });
    }
  });

  // Statut global d'une intervention indépendante (sans devis)
  const apptGlobalStatus = (interv, facture) => {
    if (facture) {
      if (facture.status === "payee") return { label: "Payé", tone: "success" };
      if (facture.status === "en_retard") return { label: "Paiement en retard", tone: "danger" };
      return { label: "Paiement en attente", tone: "water" };
    }
    if (interv.status === "termine") return { label: "À facturer", tone: "warning" };
    if (interv.status === "planifie") return { label: "Intervention prévue", tone: "water" };
    return { label: APPT_ST[interv.status] || interv.status, tone: "neutral" };
  };

  if (dossiers.length === 0 && apptDossiers.length === 0 && standalone.length === 0) {
    return <Card className="pad" style={{ marginTop: 16 }}><div className="t-muted" style={{ textAlign: "center", padding: 28 }}>Aucun dossier pour ce client.</div></Card>;
  }

  return (
    <div className="dos-list" style={{ marginTop: 16 }}>
      {dossiers.map(({ q, rdvDevis, interv, facture }) => {
        const gs = globalStatus(q, interv, facture);
        const paid = facture && facture.status === "payee";
        const paidDate = paid ? (facture.paidDate || (facture.payments && facture.payments[0] && facture.payments[0].date)) : null;
        const dCol = (META.devis || {}).color, iCol = (META.intervention || {}).color;
        // actions cohérentes
        const canProgram = q.status === "accepte" && (!interv || interv.status === "annule");
        const canInvoice = interv && interv.status === "termine" && !facture;
        const canRelance = facture && (facture.status === "envoyee" || facture.status === "en_retard");
        const canPay = facture && facture.status !== "payee";
        return (
          <Card key={q.id} className="pad dos-card">
            <div className="dos-head">
              <div className="dos-head-l">
                <span className="dos-ref">Dossier · {q.ref}</span>
                <span className="dos-title">{q.items[0]?.label || "Prestation"}</span>
              </div>
              <Chip tone={gs.tone}>{gs.label}</Chip>
            </div>

            <div className="dos-steps">
              <Step icon="calendar" color={(META.devis || {}).color} label="RDV devis"
                value={rdvDevis ? `${fmtDateShort(rdvDevis.date)}${rdvDevis.start ? ` à ${rdvDevis.start}` : ""}` : "Aucun RDV devis"}
                sub={rdvDevis ? (APPT_ST[rdvDevis.status] || rdvDevis.status) : null}
                muted={!rdvDevis} />

              <Step icon="quotes" color={dCol} label="Devis"
                value={`${q.ref} · ${eur(quoteTotal(q))}`}
                sub={`${QUOTE_ST[q.status] || q.status} · ${fmtDateShort(q.date)}`} />

              <Step icon="briefcase" color={iCol} label="Intervention"
                value={interv ? `${fmtDateShort(interv.date)}${interv.start ? ` à ${interv.start}` : ""}` : "À programmer"}
                sub={interv ? `${APPT_ST[interv.status] || interv.status}${apptDur(interv) ? ` · ${fmtDur(apptDur(interv))}` : ""}` : null}
                muted={!interv}
                action={canProgram ? <button className="btn btn-soft btn-sm dos-act" onClick={() => nav("apptNew", { clientId: q.clientId, quoteId: q.id, returnTo: "clients" })}><Icon name="calendar" size={13} /><span>Programmer</span></button> : null} />

              <Step icon="invoices" color="var(--accent)" label="Facture"
                value={facture ? `${facture.ref} · ${eur(invoiceTotal(facture))}` : "À créer"}
                sub={facture ? (INV_ST[facture.status] || facture.status) : null}
                muted={!facture}
                action={canInvoice ? <button className="btn btn-soft btn-sm dos-act" onClick={() => nav("invoiceNew", { clientId: q.clientId, apptId: interv.id })}><Icon name="invoices" size={13} /><span>Créer facture</span></button> : null} />

              <Step icon="euro" color="var(--success)" label="Paiement"
                value={paid ? `Payé le ${fmtDateShort(paidDate)}` : "En attente"}
                muted={!paid} />
            </div>

            {(canRelance || canPay) && (
              <div className="dos-actions">
                {canRelance && <button className="btn btn-outline btn-sm" onClick={() => nav("invoices")}><Icon name="reminders" size={13} /><span>Relancer</span></button>}
                {canPay && <button className="btn btn-primary btn-sm" onClick={() => nav("invoices")}><Icon name="euro" size={13} /><span>Enregistrer paiement</span></button>}
              </div>
            )}
          </Card>
        );
      })}

      {apptDossiers.map(({ interv, facture }) => {
        const gs = apptGlobalStatus(interv, facture);
        const paid = facture && facture.status === "payee";
        const paidDate = paid ? (facture.paidDate || (facture.payments && facture.payments[0] && facture.payments[0].date)) : null;
        const iCol = (META.intervention || {}).color;
        const canInvoice = interv.status === "termine" && !facture;
        const canRelance = facture && (facture.status === "envoyee" || facture.status === "en_retard");
        const canPay = facture && facture.status !== "payee";
        return (
          <Card key={"ad" + interv.id} className="pad dos-card">
            <div className="dos-head">
              <div className="dos-head-l">
                <span className="dos-ref" style={{ color: iCol }}><span className="dos-tdot" style={{ background: iCol }} />Intervention directe</span>
                <span className="dos-title">{interv.title || "Intervention"}</span>
              </div>
              <Chip tone={gs.tone}>{gs.label}</Chip>
            </div>
            <div className="dos-steps">
              <Step icon="briefcase" color={iCol} label="Intervention"
                value={`${fmtDateShort(interv.date)}${interv.start ? ` à ${interv.start}` : ""}`}
                sub={`${APPT_ST[interv.status] || interv.status}${apptDur(interv) ? ` · ${fmtDur(apptDur(interv))}` : ""}${interv.price > 0 ? ` · ${eur(interv.price)}` : ""}`} />
              <Step icon="invoices" color="var(--accent)" label="Facture"
                value={facture ? `${facture.ref} · ${eur(invoiceTotal(facture))}` : "À créer"}
                sub={facture ? (INV_ST[facture.status] || facture.status) : null}
                muted={!facture}
                action={canInvoice ? <button className="btn btn-soft btn-sm dos-act" onClick={() => nav("invoiceNew", { clientId: interv.clientId, apptId: interv.id })}><Icon name="invoices" size={13} /><span>Créer facture</span></button> : null} />
              <Step icon="euro" color="var(--success)" label="Paiement"
                value={paid ? `Payé le ${fmtDateShort(paidDate)}` : "En attente"}
                muted={!paid} />
            </div>
            {(canRelance || canPay) && (
              <div className="dos-actions">
                {canRelance && <button className="btn btn-outline btn-sm" onClick={() => nav("invoices")}><Icon name="reminders" size={13} /><span>Relancer</span></button>}
                {canPay && <button className="btn btn-primary btn-sm" onClick={() => nav("invoices")}><Icon name="euro" size={13} /><span>Enregistrer paiement</span></button>}
              </div>
            )}
          </Card>
        );
      })}

      {standalone.map((s, i) => {
        if (s.type === "facture") {
          const f = s.invoice;
          return (
            <Card key={"sf" + f.id} className="pad dos-card dos-card-mini">
              <div className="dos-head">
                <div className="dos-head-l">
                  <span className="dos-ref" style={{ color: "var(--accent-strong)" }}>Facture directe · {f.ref}</span>
                  <span className="dos-title">{f.items[0]?.label || "Facture"}</span>
                </div>
                <Badge status={f.status} />
              </div>
              <div className="dos-mini-foot">
                <span className="dos-amount">{eur(invoiceTotal(f))}</span>
                <button className="btn btn-outline btn-sm" onClick={() => nav("invoices")}>Voir la facture</button>
              </div>
            </Card>
          );
        }
        const a = s.appt; const m = META[a.rdvType] || {};
        const typeName = { intervention: "Intervention indépendante", appel: "Appel téléphonique", autre: "Autre rendez-vous", devis: "RDV devis (sans devis)" }[a.rdvType] || "Rendez-vous";
        return (
          <Card key={"sa" + a.id} className="pad dos-card dos-card-mini">
            <div className="dos-head">
              <div className="dos-head-l">
                <span className="dos-ref" style={{ color: m.strong }}><span className="dos-tdot" style={{ background: m.color }} />{typeName}</span>
                <span className="dos-title">{a.title || typeName}</span>
              </div>
              <Badge status={a.status} />
            </div>
            <div className="dos-mini-foot">
              <span className="t-muted" style={{ fontSize: 12.5 }}>{fmtDateShort(a.date)}{a.start ? ` à ${a.start}` : ""}</span>
              <button className="btn btn-outline btn-sm" onClick={() => nav("apptDetail", { id: a.id })}>Voir le détail</button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ClientDetailView({ nav, params }) {
  const { clientById, appointments, quotes, invoices, invoiceTotal, quoteTotal, invoicePaid } = window.CRM;
  const c = clientById(params.id);
  const [tab, setTab] = React.useState("dossiers");
  if (!c) return <div className="view">Client introuvable.</div>;

  const appts = appointments.filter((a) => a.clientId === c.id).sort((a, b) => b.date.localeCompare(a.date));
  const cQuotes = quotes.filter((q) => q.clientId === c.id);
  const cInvoices = invoices.filter((f) => f.clientId === c.id);
  const totalBilled = cInvoices.reduce((s, f) => s + invoiceTotal(f), 0);
  const upcoming = appts.filter((a) => a.date >= window.CRM.today && a.status !== "termine");

  // Regroupement fiable : dossierId en priorité, linkedQuoteId en secours, sinon élément indépendant.
  // Un dossier = devis + interventions + factures partageant le même dossierId (ou reliés par linkedQuoteId).
  const histEntries = (() => {
    const entries = []; const usedA = new Set(); const usedF = new Set(); const usedQ = new Set();
    const quoteById = (id) => cQuotes.find((q) => q.id === id) || null;
    const apptById = (id) => appts.find((a) => a.id === id) || null;

    // dossierId effectif d'un élément (résolu via ses liens)
    const dosOfQuote = (q) => q.dossierId || null;
    const dosOfAppt = (a) => a.dossierId || (a.linkedQuoteId && quoteById(a.linkedQuoteId) ? quoteById(a.linkedQuoteId).dossierId : null) || null;
    const dosOfInv = (f) => f.dossierId
      || (f.linkedQuoteId && quoteById(f.linkedQuoteId) ? quoteById(f.linkedQuoteId).dossierId : null)
      || (f.linkedApptId && apptById(f.linkedApptId) ? dosOfAppt(apptById(f.linkedApptId)) : null)
      || null;

    // 1) Dossiers ancrés sur un devis
    cQuotes.forEach((q) => {
      if (usedQ.has(q.id)) return;
      const did = dosOfQuote(q);
      // interventions/RDV liés : même dossierId, ou linkedQuoteId pointant sur ce devis
      const linkedA = appts.filter((a) => !usedA.has(a.id) && (
        (did && dosOfAppt(a) === did) || a.linkedQuoteId === q.id));
      linkedA.forEach((a) => usedA.add(a.id));
      const linkedF = cInvoices.filter((f) => !usedF.has(f.id) && (
        (did && dosOfInv(f) === did) || f.linkedQuoteId === q.id));
      linkedF.forEach((f) => usedF.add(f.id));
      usedQ.add(q.id);
      entries.push({ kind: "dossier", date: q.date, quote: q, appts: linkedA, invoices: linkedF });
    });

    // 1.5) Interventions indépendantes (sans devis) + leur facture liée → un même dossier
    appts.forEach((a) => {
      if (usedA.has(a.id) || a.rdvType !== "intervention") return;
      const linkedF = cInvoices.filter((f) => !usedF.has(f.id) && (
        f.linkedApptId === a.id || (a.dossierId && dosOfInv(f) === a.dossierId)));
      if (linkedF.length === 0) return; // pas de facture → reste un appt simple
      linkedF.forEach((f) => usedF.add(f.id));
      usedA.add(a.id);
      entries.push({ kind: "apptDossier", date: a.date, appt: a, invoices: linkedF });
    });

    // 2) Éléments indépendants restants
    appts.forEach((a) => { if (!usedA.has(a.id)) entries.push({ kind: "appt", date: a.date, appt: a }); });
    cInvoices.forEach((f) => { if (!usedF.has(f.id)) entries.push({ kind: "facture", date: f.date, invoice: f }); });
    return entries.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  })();

  return (
    <div className="view content-narrow">
      <button className="back-link" onClick={() => nav("clients")}><Icon name="chevronLeft" size={16} /> Clients</button>

      <div className="client-head">
        <EditableAvatar client={c} size={62} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 25 }}>{c.name}</h1>
            <Badge tone={c.type === "pro" ? "water" : "accent"}>{c.type === "pro" ? "Professionnel" : "Particulier"}</Badge>
          </div>
          <div className="row client-contacts">
            <a href={`tel:${c.phone}`} className="row" style={{ gap: 5 }}><Icon name="phone" size={14} />{c.phone}</a>
            <a href={`mailto:${c.email}`} className="row hide-mobile" style={{ gap: 5 }}><Icon name="mail" size={14} />{c.email}</a>
            <span className="row" style={{ gap: 5 }}><Icon name="mapPin" size={14} />{c.zone}</span>
          </div>
        </div>
        <div className="row hide-mobile" style={{ gap: 8 }}>
          <Button variant="outline" icon="edit" onClick={() => nav("clientNew", { id: c.id })}>Modifier</Button>
          <Button variant="danger" onClick={() => { if (window.confirm(`Supprimer ${c.name} définitivement ?`)) { window.CRM.clients.splice(window.CRM.clients.findIndex(x=>x.id===c.id),1); nav("clients"); } }}>🗑 Supprimer</Button>
          <Button icon="plus" onClick={() => nav("quoteNew", { clientId: c.id })}>Devis</Button>
        </div>
      </div>

      <div className="grid grid-4 stats-grid" style={{ marginTop: 20 }}>
        <Stat label="Total facturé" value={eur(totalBilled)} deltaTone="neutral" delta={`depuis ${fmtDateShort(c.since)}`} />
        <Stat label="Interventions" value={appts.length} delta={`${appts.filter((a) => a.status === "termine").length} terminées`} deltaTone="neutral" />
        <Stat label="Prochain passage" value={upcoming[0] ? fmtDateShort(upcoming.sort((a, b) => a.date.localeCompare(b.date))[0].date) : "—"} delta={upcoming[0] ? upcoming[0].title : "à planifier"} deltaTone="neutral" />
        <Stat label="Satisfaction" value={"★".repeat(c.rating) + "☆".repeat(5 - c.rating)} delta={`${c.vitres} vitres`} deltaTone="neutral" />
      </div>

      <div className="tabs" style={{ marginTop: 20 }}>
        {[["dossiers", "Dossiers"], ["apercu", "Aperçu"]].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "apercu" && (
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 16 }}>
          <Card className="pad">
            <h3 className="card-h">Coordonnées</h3>
            <dl className="deflist">
              <div><dt>Contact</dt><dd>{c.contact}</dd></div>
              <div><dt>Téléphone</dt><dd>{c.phone}</dd></div>
              <div><dt>Email</dt><dd>{c.email}</dd></div>
              <div><dt>Adresse</dt><dd>{c.address}</dd></div>
              <div><dt>Client depuis</dt><dd>{fmtDate(c.since)}</dd></div>
            </dl>
          </Card>
          <Card className="pad">
            <h3 className="card-h">Notes terrain</h3>
            <p className="note-box">{c.notes}</p>
            <div className="row" style={{ gap: 6, flexWrap: "wrap", marginTop: 12 }}>
              {c.tags.map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
            </div>
          </Card>
        </div>
      )}

      {tab === "dossiers" && (
        <ClientDossiers entries={histEntries} allAppts={appts} nav={nav} quoteTotal={quoteTotal} invoiceTotal={invoiceTotal} />
      )}
    </div>
  );
}

// ---------- MA JOURNÉE — Liste chronologique (style B) ----------

function DayTimeline({ appts, quotes, clientById, getStatus, setApptStatus, quoteTotal, nav, eur, COLORS }) {
  if (appts.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
      {appts.map((a, i) => {
        const c = clientById(a.clientId);
        if (!c) return null;
        const st = getStatus(a.id);
        const isDone = st === "termine";
        const isAnnule = st === "annule";
        const meta = (window.AG_TYPE_META && window.AG_TYPE_META[a.rdvType]) || { color: COLORS[i % COLORS.length], soft: "var(--surface-2)", label: a.rdvType };
        const color = meta.color;
        const effectiveColor = (isDone || isAnnule) ? "var(--muted)" : color;

        return (
          <div key={a.id}
            onClick={(e) => { if (!e.target.closest(".btn")) nav("apptDetail", { id: a.id }); }}
            style={{
              display: "flex",
              borderRadius: 14,
              border: `1px solid ${(isDone || isAnnule) ? "var(--line)" : color}`,
              overflow: "hidden",
              cursor: "pointer",
              opacity: (isDone || isAnnule) ? 0.68 : 1,
              boxShadow: "0 1px 4px hsl(var(--shadow-color)/.06)",
              transition: "box-shadow .15s, transform .15s",
              background: "var(--surface)",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 14px hsl(var(--shadow-color)/.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px hsl(var(--shadow-color)/.06)"; e.currentTarget.style.transform = ""; }}
          >
            {/* Bande colorée gauche */}
            <div style={{ width: 5, background: effectiveColor, flexShrink: 0 }} />

            {/* Contenu */}
            <div style={{ flex: 1, padding: "11px 13px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                {/* Info gauche */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: (isDone || isAnnule) ? "var(--muted)" : "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{a.title}</div>
                  {c.address && <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.address}</div>}
                </div>
                {/* Info droite */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  {a.price > 0 && (
                    <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: effectiveColor }}>{eur(a.price)}</span>
                  )}
                  <Badge status={st} />
                </div>
              </div>

              {/* Pied : heure + actions */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 9, paddingTop: 9, borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-2)" }}>
                  <Icon name="clock" size={13} />
                  <span style={{ fontSize: 12, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{a.start} → {a.end}</span>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {!isDone && !isAnnule && a.rdvType === "devis" && (
                    <button className="btn btn-soft btn-sm" style={{ fontSize: 11, padding: "3px 9px" }}
                      onClick={(e) => { e.stopPropagation(); setApptStatus(a.id, "termine"); nav("quoteNew", { clientId: a.clientId, prefillTitle: a.title, prefillPrice: a.price, sourceApptId: a.id, returnTo: "maJournee" }); }}>
                      <Icon name="quotes" size={12} /><span>Créer devis</span>
                    </button>
                  )}
                  {!isDone && !isAnnule && a.rdvType !== "devis" && (
                    <button className="btn btn-soft btn-sm" style={{ fontSize: 11, padding: "3px 9px" }}
                      onClick={(e) => { e.stopPropagation(); setApptStatus(a.id, "termine"); }}>
                      <Icon name="check" size={12} /><span>Valider</span>
                    </button>
                  )}
                  {isDone && <span style={{ fontSize: 11.5, color: "var(--success)", fontWeight: 700 }}>✓ Validée</span>}
                  {isAnnule && <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 600 }}>Annulée</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MaJourneeView({ nav }) {
  const { appointments, clientById, invoices, quotes, invoiceTotal, quoteTotal, today } = window.CRM;

  const [selectedDate, setSelectedDate] = React.useState(today);
  const shiftDay = (n) => {
    setSelectedDate(prev => {
      const d = new Date(prev + "T00:00:00");
      d.setDate(d.getDate() + n);
      return d.toISOString().slice(0, 10);
    });
  };
  const fmtFull = (ds) => {
    const d = new Date(ds + "T00:00:00");
    const s = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const isToday = selectedDate === today;

  const todayAppts = appointments.filter(a => a.date === selectedDate).sort((a,b) => a.start.localeCompare(b.start));
  const [statuses, setStatuses] = React.useState(() =>
    Object.fromEntries(appointments.map(a => [a.id, a.status]))
  );
  const getStatus = (id) => statuses[id] || "planifie";
  const setApptStatus = (id, s) => {
    setStatuses(prev => ({...prev, [id]: s}));
    const a = appointments.find(x => x.id === id);
    if (a) a.status = s;
    if (window.CRM.save) window.CRM.save();
  };

  const nonVal = todayAppts.filter(a => getStatus(a.id) !== "termine" && getStatus(a.id) !== "annule");
  const aFact = todayAppts.filter(a => {
    if (getStatus(a.id) !== "termine") return false;
    if (a.rdvType === "devis") return false;
    if (a.price <= 0) return false;
    // Détection fiable : facturée si une facture porte son linkedApptId / dossierId / linkedQuoteId
    const facturee = invoices.some(f =>
      f.linkedApptId === a.id ||
      (a.dossierId && f.dossierId === a.dossierId) ||
      (a.linkedQuoteId && f.linkedQuoteId === a.linkedQuoteId));
    return !facturee;
  });
  const devisApptDone = [];
  const clientHasIntervention = (clientId, afterDate) =>
    appointments.some(a => a.clientId === clientId && a.rdvType === "intervention" && (a.status === "planifie" || a.status === "en_cours") && a.date >= afterDate);
  const scheduledIds = new Set(appointments.filter(a => a.linkedQuoteId).map(a => a.linkedQuoteId));
  const devisAProg = quotes.filter(q => (q.status === "accepte" || q.status === "envoye") && !scheduledIds.has(q.id));
  const overdueInv = invoices.filter(f => f.status === "en_retard");
  const totalDay = todayAppts.reduce((s,a) => s + a.price, 0);
  const doneCount = todayAppts.filter(a => getStatus(a.id) === "termine").length;
  const COLORS = ["var(--accent)", "var(--water)", "var(--success)"];

  return (
    <div className="view content-narrow">
      {/* Header */}
      <div style={{ marginBottom:0 }}>
        <h1 style={{ fontSize: 26 }}>Ma journée</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button className="icon-btn" onClick={() => shiftDay(-1)} title="Jour précédent"><Icon name="chevronLeft" size={18} /></button>
            <button className="icon-btn" onClick={() => shiftDay(1)} title="Jour suivant"><Icon name="chevronRight" size={18} /></button>
          </div>
          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{fmtFull(selectedDate)}</span>
          {!isToday && <button className="btn btn-outline btn-sm" onClick={() => setSelectedDate(today)}>Aujourd'hui</button>}
        </div>
        <p className="dash-greet" style={{ marginTop: 6 }}>
          {todayAppts.length} intervention{todayAppts.length !== 1 ? "s" : ""} · {eur(totalDay)} prévu
        </p>
      </div>

      {/* Corps 62/38 */}
      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", marginTop: 18, gap: 16, alignItems: "start" }}>

        {/* Gauche — Calendrier horaire fixe */}
        <Card className="pad" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            {Object.entries(window.AG_TYPE_META || {}).map(([k, m]) => (
              <span key={k} style={{
                display: "flex", alignItems: "center", gap: 5,
                fontSize: 11.5, fontWeight: 700, padding: "4px 10px", borderRadius: 99,
                background: m.soft, color: m.strong, letterSpacing: "0.02em",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
                {m.label}
              </span>
            ))}
          </div>
          <SectionTitle compact title="Interventions du jour"
            action={<Button variant="ghost" size="sm" icon="calendar" onClick={() => nav("appointments")}>Agenda</Button>} />
          {todayAppts.length === 0 && (
            <EmptyState
              compact
              icon="sun"
              title="Rien de prévu aujourd'hui"
              text="Ajoutez un rendez-vous ou utilisez les flèches pour consulter un autre jour."
            />
          )}
          <DayTimeline appts={todayAppts} quotes={quotes} clientById={clientById} getStatus={getStatus} setApptStatus={setApptStatus} quoteTotal={quoteTotal} nav={nav} eur={eur} COLORS={COLORS} />
          <button className="btn btn-outline btn-sm" style={{ marginTop: 12, alignSelf: "flex-start" }} onClick={() => nav("apptNew", { returnTo: "maJournee" })}>
            <Icon name="plus" size={14} /><span>Ajouter un RDV</span>
          </button>
        </Card>

        {/* Droite — blocs avec mini-contenu */}
        <div className="col" style={{ gap: 12 }}>

          {/* À valider */}
          <div className="card mj-bloc-right">
            <div className="mj-bloc-head">
              <div className="row" style={{ gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-strong)" strokeWidth="2.5"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>
                </div>
                <span className="mj-bloc-title">À valider</span>
              </div>
              <span className="mj-bloc-count" style={{ color: "var(--accent-strong)" }}>{nonVal.length}</span>
            </div>
            {nonVal.length === 0 && <div className="mj-bloc-empty">Tout est validé ✓</div>}
            {nonVal.map(a => (
              <div key={a.id} className="mj-bloc-row">
                <div className="col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
                  <span className="t-strong" style={{ fontSize: 13.5 }}>{clientById(a.clientId).name}</span>
                  <span className="cc-meta">{a.start}–{a.end}</span>
                </div>
                <div className="row" style={{ gap: 5 }}>
                  {a.rdvType === "devis"
                    ? <button className="btn btn-soft btn-sm" onClick={() => { setApptStatus(a.id, "termine"); nav("quoteNew", { clientId: a.clientId, prefillTitle: a.title, prefillPrice: a.price, sourceApptId: a.id, returnTo: "maJournee" }); }}><Icon name="quotes" size={13} /><span>Créer devis</span></button>
                    : <button className="btn btn-soft btn-sm" onClick={() => setApptStatus(a.id, "termine")}><Icon name="check" size={13} /><span>Valider</span></button>
                  }
                  <button className="btn btn-outline btn-sm" onClick={() => setApptStatus(a.id, "annule")}><Icon name="x" size={13} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* À facturer */}
          <div className="card mj-bloc-right" style={{ cursor: "pointer" }} onClick={() => nav("invoiceNew")}>
            <div className="mj-bloc-head">
              <div className="row" style={{ gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--water-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--water)" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <span className="mj-bloc-title">À facturer</span>
              </div>
              <span className="mj-bloc-count" style={{ color: "var(--water)" }}>{aFact.length}</span>
            </div>
            {aFact.length === 0 && <div className="mj-bloc-empty">Rien à facturer ✓</div>}
            {aFact.map(a => (
              <div key={a.id} className="mj-bloc-row">
                <div className="col" style={{ flex: 1, minWidth: 0, gap: 1 }}>
                  <span className="t-strong" style={{ fontSize: 13.5 }}>{clientById(a.clientId).name}</span>
                  <span className="cc-meta" style={{ color: "var(--water)", fontWeight: 600 }}>{eur(a.price)}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); nav("invoiceNew", { clientId: a.clientId, apptId: a.id }); }}>
                  <Icon name="invoices" size={13} /><span>Facturer</span>
                </button>
              </div>
            ))}
          </div>

          {/* Alertes */}
          {overdueInv.length > 0 && (
            <div className="card mj-bloc-right" style={{ cursor: "pointer" }} onClick={() => nav("invoices")}>
              <div className="mj-bloc-head">
                <div className="row" style={{ gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--danger-soft)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <span className="mj-bloc-title">Factures en retard</span>
                </div>
                <span className="mj-bloc-count" style={{ color: "var(--danger)" }}>{overdueInv.length}</span>
              </div>
              <div className="mj-bloc-empty" style={{ color: "var(--danger)" }}>{eur(overdueInv.reduce((s,f) => s + invoiceTotal(f), 0))} à récupérer →</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


Object.assign(window, { MaJourneeView, BarChart, DashboardView, ClientsView, ClientDetailView });

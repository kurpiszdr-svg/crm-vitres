/* Vues opérations : Agenda/Calendrier, Devis, Factures */

// ---------- Overlay document (devis / facture) ----------
function DocOverlay({ open, onClose, children, actions }) {
  React.useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onClick={onClose}>
      <div className="overlay-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-bar">
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
          <div className="spacer" />
          {actions}
        </div>
        <div className="overlay-scroll">{children}</div>
      </div>
    </div>
  );
}

// ---------- Document papier (devis & facture partagent la mise en page) ----------
function PaperDoc({ kind, doc }) {
  const { company, clientById, quoteTotal, invoiceTotal } = window.CRM;
  const legal = useLegal();
  const c = clientById(doc.clientId);
  const total = kind === "devis" ? quoteTotal(doc) : invoiceTotal(doc);
  return (
    <div className="paper">
      <div className="paper-head">
        <div className="row" style={{ gap: 12 }}>
          <BrandMark size={46} iconSize={22} />
          <div>
            <div className="paper-co">{company.name}</div>
            <div className="paper-co-sub">{company.trade}</div>
          </div>
        </div>
        <div className="paper-doc-meta">
          <div className="paper-kind">{kind === "devis" ? "DEVIS" : "FACTURE"}</div>
          <div className="paper-ref">{doc.ref}</div>
          <div className="paper-date">{fmtDate(doc.date)}</div>
        </div>
      </div>

      <div className="paper-parties">
        <div>
          <div className="paper-label">Émis par</div>
          <div className="paper-strong">{company.name}</div>
          <div className="paper-mut">{company.address}</div>
          <div className="paper-mut">SIRET {company.siret}</div>
          <div className="paper-mut">{company.phone}</div>
        </div>
        <div>
          <div className="paper-label">{kind === "devis" ? "Devis pour" : "Facturé à"}</div>
          <div className="paper-strong">{c.name}</div>
          <div className="paper-mut">{c.address}</div>
          {c.type === "pro" && c.contact && <div className="paper-mut">{c.contact}</div>}
          {c.type === "pro" && c.siret && <div className="paper-mut" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>SIRET {c.siret}</div>}
          {kind === "devis" && <div className="paper-mut">Valable jusqu'au {fmtDate(doc.validUntil)}</div>}
          {kind === "facture" && <div className="paper-mut">Échéance : {fmtDate(doc.dueDate)}</div>}
        </div>
      </div>

      <table className="paper-table">
        <thead><tr><th>Prestation</th><th className="num">Qté</th><th className="num">P.U.</th><th className="num">Total</th></tr></thead>
        <tbody>
          {doc.items.map((it, i) => (
            <tr key={i}>
              <td>{it.label}</td>
              <td className="num">{it.qty} {it.unit}</td>
              <td className="num">{eur(it.price)}</td>
              <td className="num t-strong">{eur(it.qty * it.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="paper-total-block">
        <div className="paper-total-row"><span>Total</span><span className="t-mono">{eur(total)}</span></div>
        <div className="paper-tva">TVA non applicable, art. 293 B du CGI</div>
        <div className="paper-total-grand"><span>Net à payer</span><span className="t-mono">{eur(total)}</span></div>
      </div>

      {doc.note && <div className="paper-note"><span className="paper-label">Note</span>{doc.note}</div>}
      {kind === "facture" && doc.payments && doc.payments.length > 0 && (
        <div className="paper-note"><span className="paper-label">Règlements</span>{doc.payments.map((p, i) => <div key={i}>{fmtDate(p.date)} — {eur(p.amount)} ({p.method})</div>)}</div>
      )}
      {legal && <div className="paper-legal">{legal}</div>}
      <div className="paper-foot">{company.name} · {company.email} · IBAN {company.iban}</div>
    </div>
  );
}

// ---------- AGENDA — Vue semaine horaire ----------
const AG_TYPE_META = {
  intervention: { label: "Intervention", color: "var(--accent)",  soft: "var(--accent-soft)",  strong: "var(--accent-strong)", emoji: "🪣" },
  devis:        { label: "Devis",        color: "var(--water)",   soft: "var(--water-soft)",   strong: "var(--water)",         emoji: "📋" },
  appel:        { label: "Appel",        color: "var(--success)", soft: "var(--success-soft)", strong: "var(--success)",       emoji: "📞" },
  autre:        { label: "Autre",        color: "var(--warning)", soft: "var(--warning-soft)", strong: "var(--warning)",       emoji: "🗓" },
};
window.AG_TYPE_META = AG_TYPE_META;
const AG_DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const AG_MONTHS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const AG_START_H = 7, AG_END_H = 19, AG_SLOT = 52;

function isoOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function mondayOf(iso) {
  const d = new Date(iso + "T00:00:00");
  const off = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - off);
  return d;
}

function CalendarView({ nav, params }) {
  const { appointments, clientById, today } = window.CRM;
  const [weekStart, setWeekStart] = React.useState(() => mondayOf(today));

  // --- Mode sélection de créneau (depuis le formulaire RDV) ---
  const pickMode = !!(params && params.pickSlot);
  const draft = (params && params.draft) || null;
  const pickSpan = (params && params.spanMin) || 60;
  const pickType = (params && params.rdvType) || (draft && draft.rdvType) || "intervention";
  const [confirmSlot, setConfirmSlot] = React.useState(null);
  const [slotError, setSlotError] = React.useState(null);
  const minGap = window.useMinGap();
  const toMinV = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const fmtV = (mins) => `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
  const STEP = 15;
  const [hoverSlot, setHoverSlot] = React.useState(null);
  const nextFreeFrom = (fromMin, span, dayEvs) => {
    for (let s = fromMin; s + span <= AG_END_H * 60; s += STEP) {
      const e = s + span;
      const bad = dayEvs.some((a) => a.status !== "annule" && (e + minGap > toMinV(a.start)) && (s < toMinV(a.end) + minGap));
      if (!bad) return s;
    }
    return null;
  };
  const TYPE_LABELS = { devis: "un devis", intervention: "une intervention", appel: "un RDV téléphonique", autre: "un autre rendez-vous" };
  const TYPE_CONFIRM = { devis: "ce devis", intervention: "cette intervention", appel: "ce RDV téléphonique", autre: "cet autre rendez-vous" };
  const frFull = (iso) => { const d = new Date(iso + "T00:00:00"); const s = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); return s.charAt(0).toUpperCase() + s.slice(1); };
  const cancelPick = () => nav("apptNew", { ...(draft || {}), slotReturn: true });
  const confirmPick = () => {
    if (!confirmSlot) return;
    nav("apptNew", { ...(draft || {}), date: confirmSlot.date, start: confirmSlot.start, slotReturn: true, slotPicked: true });
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const hours = Array.from({ length: AG_END_H - AG_START_H }, (_, i) => AG_START_H + i);
  const toY = (t) => { const [h, m] = t.split(":").map(Number); return ((h*60+m) - AG_START_H*60)/60*AG_SLOT; };
  const toH = (s, e) => { const a = s.split(":").map(Number), b = e.split(":").map(Number); return Math.max(24, ((b[0]*60+b[1])-(a[0]*60+a[1]))/60*AG_SLOT); };

  const apptsByDay = {};
  appointments.forEach((a) => { (apptsByDay[a.date] = apptsByDay[a.date] || []).push(a); });

  const weekEnd = days[6];
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const rangeLabel = sameMonth
    ? `${weekStart.getDate()} – ${weekEnd.getDate()} ${AG_MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${weekStart.getDate()} ${AG_MONTHS[weekStart.getMonth()]} – ${weekEnd.getDate()} ${AG_MONTHS[weekEnd.getMonth()]}`;
  const weekTotal = days.reduce((s, d) => s + (apptsByDay[isoOf(d)] || []).reduce((t, a) => t + a.price, 0), 0);
  const weekCount = days.reduce((s, d) => s + (apptsByDay[isoOf(d)] || []).length, 0);

  const [viewMode, setViewMode] = React.useState("semaine");
  const [monthRef, setMonthRef] = React.useState(() => { const d = new Date(today + "T00:00:00"); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const monthAppts = appointments.filter((a) => { const d = new Date(a.date + "T00:00:00"); return d.getMonth() === monthRef.getMonth() && d.getFullYear() === monthRef.getFullYear(); });
  const monthTotal = monthAppts.reduce((s, a) => s + a.price, 0);

  const shiftWeek = (dir) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + dir * 7); setWeekStart(d); };
  const shiftMonth = (dir) => setMonthRef((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1));
  const goPrev = () => (viewMode === "mois" ? shiftMonth(-1) : shiftWeek(-1));
  const goNext = () => (viewMode === "mois" ? shiftMonth(1) : shiftWeek(1));
  const goToday = () => { setWeekStart(mondayOf(today)); const d = new Date(today + "T00:00:00"); setMonthRef(new Date(d.getFullYear(), d.getMonth(), 1)); };

  const renderMonth = () => {
    const gridStart = mondayOf(isoOf(monthRef));
    const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });
    const openDay = (iso) => { setWeekStart(mondayOf(iso)); setViewMode("semaine"); };
    return (
      <Card className="pad" style={{ marginTop: 16 }}>
        <div className="ag-month">
          <div className="ag-m-head">
            {AG_DOW.map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="ag-m-grid">
            {cells.map((d) => {
              const iso = isoOf(d);
              const inMonth = d.getMonth() === monthRef.getMonth();
              const isToday = iso === today;
              const evs = (apptsByDay[iso] || []).slice().sort((a, b) => a.start.localeCompare(b.start));
              return (
                <div key={iso} className={`ag-m-cell ${inMonth ? "" : "out"} ${isToday ? "today" : ""}`} onClick={() => openDay(iso)}>
                  <span className="ag-m-daynum">{d.getDate()}</span>
                  {evs.slice(0, 3).map((a) => {
                    const meta = AG_TYPE_META[a.rdvType] || AG_TYPE_META.intervention;
                    const c = clientById(a.clientId);
                    const off = a.status === "annule" || a.status === "termine";
                    return (
                      <div key={a.id} className="ag-m-ev"
                        style={{ background: off ? "var(--surface-2)" : meta.soft, borderLeftColor: off ? "var(--muted)" : meta.color, color: off ? "var(--muted)" : meta.strong }}
                        onClick={(e) => { e.stopPropagation(); pickMode ? openDay(iso) : nav("apptDetail", { id: a.id }); }}>
                        {a.start} {c ? c.name : a.title}
                      </div>
                    );
                  })}
                  {evs.length > 3 && <span className="ag-m-more">+{evs.length - 3} autre{evs.length - 3 > 1 ? "s" : ""}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="view">
      {pickMode && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 14, borderRadius: 12,
          background: "color-mix(in oklch, var(--accent) 10%, var(--surface))", border: "1.5px solid var(--accent)" }}>
          <span style={{ color: "var(--accent-strong)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="calendar" size={20} /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: "var(--ink)" }}>Choisissez un créneau pour {TYPE_LABELS[pickType]}</div>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>Cliquez sur une plage libre · durée {pickSpan >= 60 ? (pickSpan % 60 === 0 ? (pickSpan / 60) + " h" : Math.floor(pickSpan / 60) + " h " + (pickSpan % 60)) : pickSpan + " min"}</div>
          </div>
          <Button variant="ghost" onClick={cancelPick}>Annuler</Button>
        </div>
      )}
      {pickMode && slotError && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", marginBottom: 14, borderRadius: 12,
          background: "var(--danger-soft, color-mix(in oklch, oklch(0.6 0.18 25) 12%, var(--surface)))", border: "1.5px solid oklch(0.62 0.18 25)" }}>
          <span style={{ color: "oklch(0.55 0.2 25)", display: "grid", placeItems: "center", flexShrink: 0 }}><Icon name="clock" size={18} /></span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{slotError}</span>
          <button onClick={() => setSlotError(null)} style={{ border: "none", background: "transparent", cursor: "pointer", color: "var(--muted)", display: "grid", placeItems: "center", padding: 2 }}><Icon name="x" size={16} /></button>
        </div>
      )}
      {/* En-tête agenda */}
      <div className="ag-topbar2">
        <div className="ag-title-block">
          <h2 style={{ textTransform: "capitalize" }}>{AG_MONTHS[(viewMode === "mois" ? monthRef : weekStart).getMonth()]} {(viewMode === "mois" ? monthRef : weekStart).getFullYear()}</h2>
          <span className="ag-sub">{viewMode === "mois" ? `${monthAppts.length} RDV · ${eur(monthTotal)}` : `${rangeLabel} · ${weekCount} RDV · ${eur(weekTotal)}`}</span>
        </div>
        <div className="ag-topbar-right">
          <div className="ag-seg">
            <button className={viewMode === "semaine" ? "active" : ""} onClick={() => setViewMode("semaine")}>Semaine</button>
            <button className={viewMode === "mois" ? "active" : ""} onClick={() => setViewMode("mois")}>Mois</button>
          </div>
          <div className="ag-nav">
            <button className="ag-iconbtn" onClick={goPrev}><Icon name="chevronLeft" size={16} /></button>
            <button className="ag-today" onClick={goToday}>Aujourd'hui</button>
            <button className="ag-iconbtn" onClick={goNext}><Icon name="chevronRight" size={16} /></button>
          </div>
          {viewMode === "semaine" && (
          <div className="ag-legend hide-mobile">
            {Object.entries(AG_TYPE_META).map(([k, m]) => (
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
          )}
          <Button variant="outline" size="sm" icon="plus" onClick={() => nav("apptNew")}>Nouveau RDV</Button>
        </div>
      </div>

      {!pickMode && appointments.length === 0 && (
        <Card style={{ marginTop: 16 }}>
          <EmptyState
            compact
            icon="calendar"
            title="Aucun rendez-vous prévu"
            text="Planifiez un devis, une intervention, un appel ou un autre rendez-vous."
            actionLabel="Créer un RDV"
            onAction={() => nav("apptNew")}
          />
        </Card>
      )}

      {/* Grille semaine */}
      {viewMode === "semaine" && (
      <Card className="pad" style={{ marginTop: 16, overflow: "hidden" }}>
        <div className="ag-week-wrap2">
          <div className="ag-week-head2">
            <div className="ag-wh-gutter" />
            {days.map((d) => {
              const iso = isoOf(d);
              const isToday = iso === today;
              return (
                <div key={iso} className={`ag-wh-day ${isToday ? "today" : ""}`}>
                  <span className="ag-wh-dow">{AG_DOW[(d.getDay()+6)%7]}</span>
                  <span className="ag-wh-date">{d.getDate()}</span>
                </div>
              );
            })}
          </div>
          <div className="ag-week-scroll">
            <div className="ag-week-grid2" style={{ height: hours.length * AG_SLOT }}>
              <div className="ag-wg-gutter">
                {hours.map((h) => <div key={h} className="ag-wg-hour" style={{ height: AG_SLOT }}><span>{h}</span></div>)}
              </div>
              {days.map((d) => {
                const iso = isoOf(d);
                const isToday = iso === today;
                const evs = (apptsByDay[iso] || []);
                return (
                  <div key={iso} className={`ag-wg-col ${isToday ? "today" : ""}`}>
                    {hours.map((h) => <div key={h} className="ag-wg-line" style={{ height: AG_SLOT }} />)}
                    {pickMode && (() => {
                      const active = (a) => a.status !== "annule";
                      const starts = [];
                      for (let m = AG_START_H * 60; m < AG_END_H * 60; m += STEP) starts.push(m);
                      return (
                        <>
                          {starts.map((sMin) => {
                            const eMin = sMin + pickSpan;
                            const fits = eMin <= AG_END_H * 60;
                            const overlap = evs.some((a) => active(a) && toMinV(a.start) < eMin && toMinV(a.end) > sMin);
                            const tooClose = evs.some((a) => active(a) && (eMin + minGap > toMinV(a.start)) && (sMin < toMinV(a.end) + minGap));
                            const ok = fits && !tooClose;
                            return (
                              <button key={"slot" + sMin} type="button"
                                onClick={() => {
                                  if (ok) { setSlotError(null); setConfirmSlot({ date: iso, start: fmtV(sMin), end: fmtV(eMin) }); }
                                  else if (fits && !overlap) {
                                    const nf = nextFreeFrom(sMin, pickSpan, evs);
                                    setSlotError(nf != null
                                      ? `Ce créneau est trop proche d'un autre rendez-vous. Le prochain créneau disponible est à ${fmtV(nf)}.`
                                      : `Ce créneau est trop proche d'un autre rendez-vous. Un délai minimum de ${minGap} minutes est requis entre deux rendez-vous.`);
                                  }
                                }}
                                onMouseEnter={() => setHoverSlot({ iso, sMin, ok })}
                                onMouseLeave={() => setHoverSlot((h) => (h && h.sMin === sMin && h.iso === iso ? null : h))}
                                title={ok ? `Programmer ${fmtV(sMin)} – ${fmtV(eMin)}` : (overlap ? "Créneau occupé" : "Trop proche d'un autre RDV")}
                                style={{ position: "absolute", top: (sMin - AG_START_H * 60) / 60 * AG_SLOT, height: STEP / 60 * AG_SLOT, left: 2, right: 2,
                                  border: "none", borderTop: (sMin % 60 !== 0) ? "1px dashed color-mix(in oklch, var(--line) 55%, transparent)" : "none",
                                  padding: 0, margin: 0, zIndex: 1, background: "transparent", cursor: ok ? "pointer" : "not-allowed" }} />
                            );
                          })}
                          {hoverSlot && hoverSlot.iso === iso && hoverSlot.sMin + pickSpan <= AG_END_H * 60 && (
                            <div style={{ position: "absolute", top: (hoverSlot.sMin - AG_START_H * 60) / 60 * AG_SLOT, height: pickSpan / 60 * AG_SLOT, left: 2, right: 2,
                              borderRadius: 6, zIndex: 1, pointerEvents: "none", boxSizing: "border-box",
                              background: hoverSlot.ok ? "color-mix(in oklch, var(--accent) 16%, transparent)" : "color-mix(in oklch, oklch(0.62 0.18 25) 14%, transparent)",
                              border: `1.5px dashed ${hoverSlot.ok ? "var(--accent)" : "oklch(0.62 0.18 25)"}` }} />
                          )}
                        </>
                      );
                    })()}
                    {evs.map((a) => {
                      const c = clientById(a.clientId);
                      const meta = AG_TYPE_META[a.rdvType] || AG_TYPE_META.intervention;
                      const done = a.status === "termine";
                      const annule = a.status === "annule";
                      return (
                        <div key={a.id} className="ag-wg-event2"
                          onClick={pickMode ? undefined : () => nav("apptDetail", { id: a.id })}
                          style={{
                            top: toY(a.start), height: toH(a.start, a.end),
                            zIndex: 2, cursor: pickMode ? "default" : "pointer",
                            background: (annule || done) ? "var(--surface-2)" : meta.soft,
                            borderColor: (annule || done) ? "var(--line-2)" : meta.color,
                            borderLeftColor: (annule || done) ? "var(--muted)" : meta.color,
                            opacity: (annule || done) ? 0.6 : 1,
                            textDecoration: (annule || done) ? "line-through" : "none",
                          }}>
                          <div className="ag-wg-ev-time" style={{ color: (annule || done) ? "var(--muted)" : meta.strong }}>
                            {done && "✓ "}{a.start}
                          </div>
                          <div className="ag-wg-ev-name">{c ? c.name : a.title}</div>
                          {toH(a.start, a.end) > 48 && <div className="ag-wg-ev-sub">{a.title}</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      )}

      {viewMode === "mois" && renderMonth()}

      {confirmSlot && (
        <div onClick={() => setConfirmSlot(null)} style={{ position: "fixed", inset: 0, background: "rgba(25,18,12,0.42)", display: "grid", placeItems: "center", zIndex: 1000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: 18, padding: 24, maxWidth: 390, width: "100%", boxShadow: "0 24px 64px rgba(0,0,0,0.28)" }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "var(--accent-soft)", color: "var(--accent-strong)", display: "grid", placeItems: "center", marginBottom: 14 }}>
              <Icon name="calendar" size={22} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 700, lineHeight: 1.3, marginBottom: 8 }}>
              Valider {TYPE_CONFIRM[pickType]} pour la date : {frFull(confirmSlot.date)} à {confirmSlot.start} ?
            </h3>
            <p style={{ fontSize: 13.5, color: "var(--muted)", marginBottom: 20 }}>Créneau : {confirmSlot.start} – {confirmSlot.end}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setConfirmSlot(null)}>Annuler</Button>
              <Button icon="check" onClick={confirmPick}>Confirmer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- DEVIS ----------
function QuotesView({ nav }) {
  const { quotes, clientById, quoteTotal, appointments, invoices, invoicePaid } = window.CRM;
  const [filter, setFilter] = React.useState("tous");
  const [openDoc, setOpenDoc] = React.useState(null);
  const [sendDoc, setSendDoc] = React.useState(null);
  const [statuses, setStatuses] = React.useState(() => Object.fromEntries(quotes.map(q=>[q.id,q.status])));
  const getStatus = (q) => statuses[q.id] || q.status;

  const markAccepted = (q) => {
    q.status = "accepte";
    setStatuses(prev => ({...prev, [q.id]:"accepte"}));
    setOpenDoc(null);
    if (window.CRM.save) window.CRM.save();
  };

  const markSent = (q) => {
    q.status = "envoye";
    setStatuses(prev => ({...prev, [q.id]:"envoye"}));
    setSendDoc(null);
    setOpenDoc(null);
    if (window.CRM.save) window.CRM.save();
  };

  // Devis qui ont déjà une intervention planifiée
  const scheduledQuoteIds = new Set(appointments.filter(a => a.linkedQuoteId).map(a => a.linkedQuoteId));

  const filtered = quotes.filter((q) => filter === "tous" || getStatus(q) === filter).sort((a, b) => b.date.localeCompare(a.date));
  const sumByStatus = (s) => quotes.filter((q) => getStatus(q) === s).reduce((acc, q) => acc + quoteTotal(q), 0);
  const sumEnCours  = sumByStatus("envoye");
  const sumAccepte  = sumByStatus("accepte");
  const sumEncaisse = invoices.filter((f) => f.status === "payee").reduce((s, f) => s + invoicePaid(f), 0);

  return (
    <div className="view">
      <SectionTitle title="Devis" subtitle="Créé → Envoyé → Accepté, puis programmez l'intervention ou facturez." action={<Button icon="plus" onClick={() => nav("quoteNew")}>Nouveau devis</Button>} />

      <div className="grid grid-3 stats-grid" style={{ marginBottom: 18 }}>
        <Stat label="En cours d'acceptation" value={eur(sumEnCours)} delta="en attente de réponse" deltaTone="neutral" icon="clock" />
        <Stat label="Acceptés" value={eur(sumAccepte)} delta="à programmer / facturer" deltaTone="up" icon="check" />
        <Stat label="Encaissés" value={eur(sumEncaisse)} delta="factures réglées" deltaTone="up" icon="euro" />
      </div>

      {quotes.length === 0 ? (
        <Card>
          <EmptyState
            icon="quotes"
            title="Aucun devis"
            text="Créez un devis depuis une fiche client ou après un rendez-vous de type devis."
            actionLabel="Créer un devis"
            onAction={() => nav("quoteNew")}
          />
        </Card>
      ) : (
      <>
      <div className="pills" style={{ marginBottom: 16 }}>
        {[["tous", "Tous"], ["brouillon", "Créé"], ["envoye", "Envoyés"], ["accepte", "Acceptés"], ["expire", "Expirés"]].map(([k, l]) => (
          <button key={k} className={`pill ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <Card style={{ overflow: "hidden", minHeight: "calc(100vh - 220px)" }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Référence</th><th>Client</th><th className="hide-mobile">Date</th><th className="hide-mobile">Validité</th><th>Statut</th><th className="num">Montant</th><th style={{width:130}}></th></tr></thead>
            <tbody>
              {filtered.map((q) => {
                const c = clientById(q.clientId);
                return (
                  <tr key={q.id} className="clickable" onClick={() => setOpenDoc(q)}>
                    <td className="t-strong">{q.ref}</td>
                    <td><div className="cell-client"><Avatar name={c.name} type={c.type} clientId={c.id} size={30} /><span className="cc-name">{c.name}</span></div></td>
                    <td className="hide-mobile t-muted">{fmtDateShort(q.date)}</td>
                    <td className="hide-mobile t-muted">{fmtDateShort(q.validUntil)}</td>
                    <td><Badge status={getStatus(q)} /></td>
                    <td className="num t-mono t-strong">{eur(quoteTotal(q))}</td>
                    <td className="num" style={{ width: 150 }}>
                      {getStatus(q) === "accepte" && (
                        scheduledQuoteIds.has(q.id)
                          ? <span className="prog-done"><Icon name="check" size={14} />Programmé</span>
                          : <button className="btn btn-soft btn-sm prog-btn"
                              onClick={(e) => { e.stopPropagation(); nav("apptNew", { clientId: q.clientId, quoteId: q.id }); }}>
                              <Icon name="calendar" size={14} /><span>Programmer</span>
                            </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan="7" className="t-muted" style={{ textAlign: "center", padding: 28 }}>Aucun devis ne correspond à ce filtre.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}

      <DocOverlay
        open={!!openDoc}
        onClose={() => setOpenDoc(null)}
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Button variant="outline" size="sm" icon="download">PDF</Button>
            {openDoc && getStatus(openDoc) !== "accepte" && <Button size="sm" icon="send" onClick={() => setSendDoc(openDoc)}>Envoyer</Button>}
            {openDoc && getStatus(openDoc) === "envoye" && <Button size="sm" variant="soft" icon="check" onClick={() => markAccepted(openDoc)}>Marquer accepté</Button>}
          </div>
        }
      >
        {openDoc && <PaperDoc kind="devis" doc={openDoc} />}
      </DocOverlay>

      {sendDoc && window.SendDocModal && (
        <window.SendDocModal
          kind="devis"
          docRef={sendDoc.ref}
          client={clientById(sendDoc.clientId)}
          total={quoteTotal(sendDoc)}
          onClose={() => setSendDoc(null)}
          onConfirm={() => markSent(sendDoc)}
        />
      )}
    </div>
  );
}

// ---------- FACTURES ----------
function InvoicesView({ nav }) {
  const { invoices, clientById, invoiceTotal, invoicePaid } = window.CRM;
  const [filter, setFilter] = React.useState("tous");
  const [openDoc, setOpenDoc] = React.useState(null);
  const [payModal, setPayModal] = React.useState(null); // facture en cours de paiement
  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState("Virement");
  const [payDate, setPayDate] = React.useState(window.CRM.today);
  const [sendDoc, setSendDoc] = React.useState(null);
  const [, forceUpdate] = React.useReducer(x => x+1, 0);

  const markSent = (f) => {
    f.status = "envoyee";
    setSendDoc(null);
    setOpenDoc(null);
    if (window.CRM.save) window.CRM.save();
    forceUpdate();
  };

  const enregistrerPaiement = () => {
    if (!payModal || !payAmount) return;
    payModal.payments = payModal.payments || [];
    payModal.payments.push({ date: payDate, amount: Number(payAmount), method: payMethod });
    const total = invoiceTotal(payModal);
    const paid = payModal.payments.reduce((s,p)=>s+p.amount,0);
    if (paid >= total) { payModal.status = "payee"; payModal.paidDate = payDate; }
    setPayModal(null);
    setOpenDoc(null);
    if (window.CRM.save) window.CRM.save();
    forceUpdate();
  };

  const filtered = invoices.filter((f) => {
    if (filter === "tous") return f.status !== "payee";
    return f.status === filter;
  }).sort((a, b) => b.date.localeCompare(a.date));
  const outstanding = invoices.filter((f) => f.status === "envoyee" || f.status === "en_retard").reduce((s, f) => s + invoiceTotal(f) - invoicePaid(f), 0);
  const overdueSum = invoices.filter((f) => f.status === "en_retard").reduce((s, f) => s + invoiceTotal(f), 0);
  const paidThisMonth = invoices.filter((f) => f.status === "payee").reduce((s, f) => s + invoicePaid(f), 0);

  return (
    <div className="view">
      <SectionTitle title="Factures" subtitle="Créée → Envoyée → Payée. Une facture « En retard » est à relancer." action={<Button icon="plus" onClick={() => nav("invoiceNew")}>Nouvelle facture</Button>} />

      <div className="grid grid-3 stats-grid" style={{ marginBottom: 18 }}>
        <Stat label="Encaissé" value={eur(paidThisMonth)} delta="réglées" deltaTone="up" icon="euro" />
        <Stat label="En attente" value={eur(outstanding)} delta="à recevoir" deltaTone="neutral" icon="clock" />
        <Stat label="En retard" value={eur(overdueSum)} delta={`${invoices.filter((f) => f.status === "en_retard").length} factures`} deltaTone="down" icon="reminders" />
      </div>

      {invoices.length === 0 ? (
        <Card>
          <EmptyState
            icon="invoices"
            title="Aucune facture"
            text="Une facture peut être créée après une intervention terminée ou directement depuis cet écran."
            actionLabel="Créer une facture"
            onAction={() => nav("invoiceNew")}
          />
        </Card>
      ) : (
      <>
      <div className="pills" style={{ marginBottom: 16 }}>
        {[["tous", "En cours"], ["brouillon", "Créé"], ["envoyee", "Envoyées"], ["en_retard", "En retard"], ["payee", "Payées"]].map(([k, l]) => (
          <button key={k} className={`pill ${filter === k ? "active" : ""}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>

      <Card style={{ overflow: "hidden", minHeight: "calc(100vh - 280px)" }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Référence</th><th>Client</th><th className="hide-mobile">Émise</th><th>Échéance</th><th>Statut</th><th className="num">Montant</th></tr></thead>
            <tbody>
              {filtered.map((f) => {
                const c = clientById(f.clientId);
                const late = f.status === "en_retard";
                return (
                  <tr key={f.id} className="clickable" onClick={() => setOpenDoc(f)}>
                    <td className="t-strong">{f.ref}</td>
                    <td><div className="cell-client"><Avatar name={c.name} type={c.type} clientId={c.id} size={30} /><span className="cc-name">{c.name}</span></div></td>
                    <td className="hide-mobile t-muted">{fmtDateShort(f.date)}</td>
                    <td className={late ? "t-mono" : "t-muted t-mono"} style={late ? { color: "var(--danger)", fontWeight: 600 } : {}}>{fmtDateShort(f.dueDate)}</td>
                    <td><Badge status={f.status} /></td>
                    <td className="num t-mono t-strong">{eur(invoiceTotal(f))}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan="6" className="t-muted" style={{ textAlign: "center", padding: 28 }}>Aucune facture ne correspond à ce filtre.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
      </>
      )}


      {/* Modal enregistrer paiement */}
      {payModal && (
        <div className="overlay" onClick={() => setPayModal(null)}>
          <div className="pay-modal-backdrop" onClick={() => setPayModal(null)} />
        <div className="pay-modal" onClick={e => e.stopPropagation()}>
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
              <h3 style={{ fontSize: 17 }}>Enregistrer un paiement</h3>
              <button className="icon-btn" onClick={() => setPayModal(null)}><Icon name="x" size={17} /></button>
            </div>
            <div className="col" style={{ gap: 12 }}>
              <div className="field">
                <label>Montant (€)</label>
                <input className="input" type="number" min="0" value={payAmount} onChange={e => setPayAmount(e.target.value)} autoFocus />
              </div>
              <div className="field">
                <label>Mode de paiement</label>
                <select className="select" value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  <option>Virement</option><option>Esp\u00e8ces</option><option>Ch\u00e8que</option><option>Carte bancaire</option><option>PayPal</option>
                </select>
              </div>
              <div className="field">
                <label>Date du paiement</label>
                <input className="input" type="date" value={payDate} onChange={e => setPayDate(e.target.value)} />
              </div>
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <Button variant="ghost" onClick={() => setPayModal(null)}>Annuler</Button>
              <Button icon="check" onClick={enregistrerPaiement} className={payAmount ? "" : "btn-disabled"}>Confirmer</Button>
            </div>
          </div>
        </div>
      )}

      <DocOverlay
        open={!!openDoc}
        onClose={() => setOpenDoc(null)}
        actions={
          <div className="row" style={{ gap: 8 }}>
            <Button variant="outline" size="sm" icon="download">PDF</Button>
            {openDoc && (openDoc.status === "brouillon" || openDoc.status === "creee") && (
              <Button size="sm" icon="send" onClick={() => setSendDoc(openDoc)}>Envoyer</Button>
            )}
            {openDoc && openDoc.status !== "payee" && (
              <Button size="sm" variant="soft" icon="check" onClick={() => {
                setPayAmount(String(invoiceTotal(openDoc) - invoicePaid(openDoc)));
                setPayDate(window.CRM.today);
                setPayModal(openDoc);
                setOpenDoc(null);
              }}>Enregistrer paiement</Button>
            )}
            {openDoc && (openDoc.status === "en_retard" || openDoc.status === "envoyee") && <Button size="sm" icon="reminders">Relancer</Button>}
          </div>
        }
      >
        {openDoc && <PaperDoc kind="facture" doc={openDoc} />}
      </DocOverlay>

      {sendDoc && window.SendDocModal && (
        <window.SendDocModal
          kind="facture"
          docRef={sendDoc.ref}
          client={clientById(sendDoc.clientId)}
          total={invoiceTotal(sendDoc)}
          onClose={() => setSendDoc(null)}
          onConfirm={() => markSent(sendDoc)}
        />
      )}
    </div>
  );
}

Object.assign(window, { DocOverlay, PaperDoc, CalendarView, QuotesView, InvoicesView });

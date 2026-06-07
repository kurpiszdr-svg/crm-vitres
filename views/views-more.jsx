/* Vues : Relances, Rapports, Réglages, Formulaire client */

// ---------- RELANCES AUTOMATIQUES ----------
function RemindersView({ nav, embedded }) {
  const { reminderRules, reminderLog, clientById } = window.CRM;
  const [rules, setRules] = React.useState(reminderRules);
  const toggle = (id) => {
    // Mute la source (window.CRM) pour que l'état soit sauvegardé…
    const src = window.CRM.reminderRules.find((r) => r.id === id);
    if (src) src.active = !src.active;
    if (window.CRM.save) window.CRM.save();
    // …puis rafraîchit l'affichage.
    setRules((rs) => rs.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  const channelMeta = { sms: { icon: "message", label: "SMS" }, email: { icon: "mail", label: "Email" } };

  return (
    <div className={embedded ? "" : "view content-narrow"}>
      {!embedded && <SectionTitle title="Relances automatiques" subtitle="Vos rappels partent tout seuls — vous gardez la main." action={<Button icon="plus" onClick={() => nav("ruleNew")}>Nouvelle règle</Button>} />}

      <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", marginTop: 4 }}>
        <div className="col" style={{ gap: 14 }}>
          {rules.map((r) => {
            const ch = channelMeta[r.channel];
            return (
              <Card className="pad rule-card" key={r.id} data-on={r.active}>
                <div className="row" style={{ alignItems: "flex-start", gap: 12 }}>
                  <span className={`rule-ic ${r.active ? "on" : ""}`}><Icon name={ch.icon} size={18} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <span className="rule-name">{r.name}</span>
                      <Badge tone={r.channel === "sms" ? "accent" : "water"}>{ch.label}</Badge>
                    </div>
                    <div className="rule-trigger"><Icon name="bolt" size={13} /> {r.trigger}</div>
                    <p className="rule-template">{r.template}</p>
                  </div>
                  <button className={`switch ${r.active ? "on" : ""}`} onClick={() => toggle(r.id)} aria-label="Activer"><span className="switch-knob" /></button>
                </div>
              </Card>);

          })}
        </div>

        <Card className="pad" style={{ alignSelf: "flex-start" }}>
          <SectionTitle compact title="Derniers envois" subtitle="Journal automatique" />
          <div className="log-list">
            {reminderLog.length === 0 && (
              <EmptyState
                compact
                icon="mail"
                title="Aucun envoi pour le moment"
                text="Le journal listera ici les relances envoyées automatiquement à vos clients."
              />
            )}
            {reminderLog.map((l) => {
              const c = clientById(l.clientId) || { id: null, name: "Client supprimé", type: "particulier" };
              return (
                <div className="log-item" key={l.id}>
                  <span className={`log-ic ${l.channel}`}><Icon name={l.channel === "sms" ? "message" : "mail"} size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="cc-name" style={{ fontSize: 13 }}>{c.name}</div>
                    <div className="cc-meta">{l.ref} · {l.date.slice(11)}</div>
                  </div>
                  <Badge tone="success">{l.status}</Badge>
                </div>);

            })}
          </div>
        </Card>
      </div>
    </div>);

}

// ---------- RAPPORTS ----------
function ReportsView() {
  const { revenueByMonth, clients, invoices, appointments, clientById, invoicePaid, invoiceTotal } = window.CRM;
  const ytd = revenueByMonth.reduce((s, m) => s + m.ca, 0);
  const avgTicket = appointments.filter((a) => a.status === "termine").reduce((s, a, _, arr) => s + a.price / arr.length, 0);

  // CA par client (top)
  const caByClient = {};
  invoices.forEach((f) => {caByClient[f.clientId] = (caByClient[f.clientId] || 0) + invoiceTotal(f);});
  const top = Object.entries(caByClient).map(([id, v]) => ({ c: clientById(id) || { id, name: "Client supprimé", type: "particulier" }, v })).sort((a, b) => b.v - a.v).slice(0, 5);
  const maxTop = Math.max(...top.map((t) => t.v));

  const proCount = clients.filter((c) => c.type === "pro").length;
  const partCount = clients.length - proCount;

  const noData = clients.length === 0 && invoices.length === 0 && appointments.length === 0;
  if (noData) {
    return (
      <div className="view content-narrow">
        <SectionTitle title="Rapports" subtitle="Vue d'ensemble de l'activité" />
        <Card style={{ marginTop: 4 }}>
          <EmptyState
            icon="reports"
            title="Pas encore de données"
            text="Vos statistiques de chiffre d'affaires, vos meilleurs clients et la répartition de votre clientèle apparaîtront ici dès vos premières interventions et factures."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="view content-narrow">
      <SectionTitle title="Rapports" subtitle="Vue d'ensemble de l'activité 2026" action={<Button variant="outline" icon="download">Exporter</Button>} />

      <div className="grid grid-4 stats-grid">
        <Stat label="CA cumulé 2026" value={eur(ytd)} delta="▲ 12 % vs 2025" deltaTone="up" icon="euro" />
        <Stat label="Panier moyen" value={eur(Math.round(avgTicket))} delta="par intervention" deltaTone="neutral" icon="briefcase" />
        <Stat label="Interventions" value={appointments.length} delta="planifiées + faites" deltaTone="neutral" icon="calendar" />
        <Stat label="Taux d'encaissement" value="86 %" delta="des factures réglées" deltaTone="up" icon="invoices" />
      </div>

      <Card className="pad" style={{ marginTop: 18 }}>
        <SectionTitle compact title="Chiffre d'affaires mensuel" subtitle="Janvier → juin 2026" />
        <BarChart data={revenueByMonth} format={(v) => `${(v / 1000).toFixed(1)}k`} height={180} />
      </Card>

      <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", marginTop: 18 }}>
        <Card className="pad">
          <SectionTitle compact title="Meilleurs clients" subtitle="Par chiffre d'affaires" />
          <div className="col" style={{ gap: 13 }}>
            {top.map((t) =>
            <div key={t.c.id} className="topclient">
                <Avatar name={t.c.name} type={t.c.type} clientId={t.c.id} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <span className="cc-name">{t.c.name}</span>
                    <span className="t-mono t-strong">{eur(t.v)}</span>
                  </div>
                  <div className="tc-bar"><span style={{ width: `${t.v / maxTop * 100}%` }} /></div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card className="pad">
          <SectionTitle compact title="Répartition clientèle" />
          <div className="donut-wrap">
            <div className="donut" style={{ "--pro": `${proCount / clients.length * 100}%` }}>
              <div className="donut-hole"><span className="t-strong" style={{ fontSize: 22, fontFamily: "var(--font-display)" }}>{clients.length}</span><span className="cc-meta">clients</span></div>
            </div>
            <div className="col" style={{ gap: 10 }}>
              <div className="legend"><span className="lg-dot" style={{ background: "var(--water)" }} /> Professionnels <b>{proCount}</b></div>
              <div className="legend"><span className="lg-dot" style={{ background: "var(--accent)" }} /> Particuliers <b>{partCount}</b></div>
            </div>
          </div>
        </Card>
      </div>
    </div>);

}

// ---------- Règles (sous-onglets) ----------
const REGLES_DATA = {
  clients: [
    { id:"rc1", on:true,  name:"Alerte client inactif",        desc:"Notifier si aucun passage depuis plus de 90 jours.",        config:true },
    { id:"rc2", on:true,  name:"Email de bienvenue",           desc:"Envoyer un email de bienvenue à la création d'un client.",  config:false },
    { id:"rc3", on:false, name:"Archivage automatique",        desc:"Archiver les clients sans activité depuis 18 mois.",        config:true },
    { id:"rc4", on:true,  name:"Regroupement par zone",        desc:"Suggérer les clients d'une même zone lors d'un nouveau RDV.", config:false },
    { id:"rc5", on:false, name:"Devis automatique périodique", desc:"Proposer un devis après X mois sans intervention.",         config:true },
  ],
  agenda: [
    { id:"ra1", on:true,  name:"Rappel SMS 24h avant",          desc:"Envoyer un SMS de rappel la veille de l'intervention.",     config:true },
    { id:"ra2", on:false, name:"Rappel SMS 2h avant",           desc:"Second rappel 2 heures avant le rendez-vous.",              config:true },
    { id:"ra3", on:true,  name:"Confirmation automatique (pro)",desc:"Confirmer le RDV automatiquement pour les clients pro.",    config:false },
    { id:"ra4", on:true,  name:"Blocage créneaux dimanche",     desc:"Empêcher la planification le dimanche.",                    config:false },
    { id:"ra5", on:false, name:"Durée tampon entre RDV",        desc:"Réserver un créneau minimum entre deux interventions.",     config:true },
  ],
  devis: [
    { id:"rd1", on:true,  name:"Expiration automatique",        desc:"Marquer expiré après 30 jours sans réponse.",               config:true },
    { id:"rd2", on:true,  name:"Relance J+5",                   desc:"Envoyer une relance si pas de réponse après 5 jours.",      config:true },
    { id:"rd3", on:false, name:"Conversion en facture auto",    desc:"Créer une facture brouillon dès l'acceptation du devis.",   config:false },
    { id:"rd4", on:true,  name:"Numérotation automatique",      desc:"Format DEV-AAAA-NNN, incrémenté à chaque création.",        config:true },
    { id:"rd5", on:false, name:"Envoi par email à la création", desc:"Envoyer le devis par email dès validation.",                config:false },
  ],
  factures: [
    { id:"rf1", on:false, name:"Génération après RDV terminé",  desc:"Créer une facture brouillon à la fin de chaque RDV.",       config:false },
    { id:"rf2", on:true,  name:"Relance J+3 après échéance",    desc:"Envoyer une relance 3 jours après la date d'échéance.",     config:true },
    { id:"rf3", on:true,  name:"Relance renforcée J+15",        desc:"Deuxième relance plus ferme à J+15 si impayée.",            config:true },
    { id:"rf4", on:true,  name:"Archivage après paiement",      desc:"Déplacer dans les archives dès réception du paiement.",     config:false },
    { id:"rf5", on:true,  name:"Numérotation automatique",      desc:"Format FAC-AAAA-NNN, incrémenté à chaque création.",        config:true },
  ],
  relance: [
    { id:"rr1", on:true,  name:"Maximum 3 relances",            desc:"Ne pas envoyer plus de 3 relances par document.",           config:true },
    { id:"rr2", on:true,  name:"Délai minimum entre relances",  desc:"Attendre au moins 7 jours entre deux relances.",            config:true },
    { id:"rr3", on:false, name:"Escalade après 2 relances",     desc:"Suggérer un appel téléphonique après 2 emails ignorés.",   config:false },
    { id:"rr4", on:true,  name:"Blocage week-end",              desc:"Ne pas envoyer de relances le samedi ou le dimanche.",      config:false },
    { id:"rr5", on:false, name:"Alerte gestionnaire J+30",      desc:"Notifier si aucun paiement reçu 30 jours après relance.",  config:true },
  ],
};

function RuleRow({ rule }) {
  const [on, setOn] = React.useState(rule.on);
  return (
    <div className="rule-row" data-off={!on}>
      <div className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="rr-name">{rule.name}</span>
          {rule.config && <span className="rr-config"><Icon name="settings" size={13} /> Configurer</span>}
        </div>
        <span className="rr-desc">{rule.desc}</span>
      </div>
      <button className={`switch ${on ? "on" : ""}`} onClick={() => setOn(!on)}><span className="switch-knob" /></button>
    </div>
  );
}

function ReglesSectionView() {
  const CATS = [["clients","Clients"],["agenda","Agenda"],["devis","Devis"],["factures","Factures"],["relance","Relances"]];
  const [cat, setCat] = React.useState("clients");
  const minGap = useMinGap();
  const [rulesMap, setRulesMap] = React.useState(REGLES_DATA);
  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState(null);
  const [editName, setEditName] = React.useState("");
  const [editDesc, setEditDesc] = React.useState("");
  const [newName, setNewName] = React.useState("");
  const [newDesc, setNewDesc] = React.useState("");

  const rules = rulesMap[cat] || [];
  const activeCount = rules.filter(r => r.on).length;
  const catLabel = CATS.find(c => c[0] === cat)[1];

  const addRule = () => {
    if (!newName.trim()) return;
    const rule = { id: `custom-${Date.now()}`, on: true, name: newName.trim(), desc: newDesc.trim(), config: false };
    setRulesMap(prev => ({ ...prev, [cat]: [...(prev[cat]||[]), rule] }));
    setNewName(""); setNewDesc(""); setAdding(false);
  };

  const startEdit = (r) => { setEditingId(r.id); setEditName(r.name); setEditDesc(r.desc); };
  const saveEdit = () => {
    setRulesMap(prev => ({ ...prev, [cat]: prev[cat].map(r => r.id===editingId ? {...r, name: editName.trim(), desc: editDesc.trim()} : r) }));
    setEditingId(null);
  };

  const toggleRule = (id) => {
    setRulesMap(prev => ({ ...prev, [cat]: prev[cat].map(r => r.id === id ? {...r, on: !r.on} : r) }));
  };

  return (
    <div>
      <div className="tabs" style={{ marginBottom: 16 }}>
        {CATS.map(([k,l]) => (
          <button key={k} className={`tab ${cat===k?"active":""}`} onClick={()=>{setCat(k); setAdding(false); setEditingId(null);}}>{l}</button>
        ))}
      </div>
      <Card className="pad">
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h3 className="card-h" style={{ marginBottom: 2 }}>Règles — {catLabel}</h3>
            <span className="cc-meta">{activeCount} règle{activeCount!==1?"s":""} active{activeCount!==1?"s":""} sur {rules.length}</span>
          </div>
          <Button variant="outline" size="sm" icon="plus" onClick={()=>setAdding(a=>!a)}>Nouvelle règle</Button>
        </div>

        {cat === "agenda" && (
          <div className="rule-row" style={{ alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div className="col" style={{ flex: 1, minWidth: 180, gap: 2 }}>
              <div className="row" style={{ gap: 8 }}>
                <span className="rr-name">Laps de temps minimum entre deux RDV</span>
                <span className="rr-config"><Icon name="clock" size={13} /> Automatique</span>
              </div>
              <span className="rr-desc">Délai de transition respecté automatiquement entre deux rendez-vous (trajet, préparation…). S'applique à tous les types de RDV, en vue semaine et mois.</span>
            </div>
            <select className="select" style={{ maxWidth: 160 }} value={minGap} onChange={(e) => setMinGap(Number(e.target.value))}>
              {[0, 5, 10, 15, 20, 30, 45, 60].map((v) => <option key={v} value={v}>{v === 0 ? "Aucun délai" : v + " minutes"}</option>)}
            </select>
          </div>
        )}

        {adding && (
          <div className="new-rule-form">
            <div className="field"><label>Nom de la règle</label>
              <input className="input" value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Ex : Rappel avant passage" autoFocus />
            </div>
            <div className="field"><label>Description</label>
              <input className="input" value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="Ce que fait cette règle…" />
            </div>
            <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
              <Button variant="ghost" size="sm" onClick={()=>{setAdding(false);setNewName("");setNewDesc("");}}>Annuler</Button>
              <Button size="sm" icon="check" onClick={addRule} className={newName.trim()?"":"btn-disabled"}>Ajouter</Button>
            </div>
          </div>
        )}

        {rules.map(r => (
          <div key={r.id} className="rule-row" data-off={!r.on}>
            {editingId === r.id ? (
              <div className="new-rule-form" style={{ flex: 1, margin: "4px 0" }}>
                <div className="field"><label>Nom</label><input className="input" value={editName} onChange={e=>setEditName(e.target.value)} autoFocus /></div>
                <div className="field"><label>Description</label><input className="input" value={editDesc} onChange={e=>setEditDesc(e.target.value)} /></div>
                <div className="row" style={{ justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <Button variant="ghost" size="sm" onClick={()=>setEditingId(null)}>Annuler</Button>
                  <Button size="sm" icon="check" onClick={saveEdit}>Enregistrer</Button>
                </div>
              </div>
            ) : (
              <>
                <div className="col" style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="rr-name">{r.name}</span>
                    <button className="rr-edit" onClick={()=>startEdit(r)}><Icon name="edit" size={13} /> Modifier</button>
                    <button className="rr-edit rr-del" onClick={()=>setRulesMap(prev=>({...prev,[cat]:prev[cat].filter(x=>x.id!==r.id)}))}><Icon name="trash" size={13} /> Supprimer</button>
                  </div>
                  {r.desc && <span className="rr-desc">{r.desc}</span>}
                </div>
                <button className={`switch ${r.on?"on":""}`} onClick={()=>toggleRule(r.id)}><span className="switch-knob"/></button>
              </>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ---------- RÉGLAGES ----------
function SettingsView() {
  const { company } = window.CRM;
  const [section, setSection] = React.useState("entreprise");
  const [legal, setLegalState] = React.useState(getLegal);
  const [biz, setBiz] = React.useState(() => ({
    name: company.name, owner: company.owner, siret: company.siret,
    phone: company.phone, address: company.address, email: company.email, iban: company.iban,
  }));
  const [bizSaved, setBizSaved] = React.useState(false);
  const setField = (k) => (e) => setBiz((b) => ({ ...b, [k]: e.target.value }));
  const saveBiz = () => {
    Object.assign(company, biz);
    if (window.CRM.save) window.CRM.save();
    setBizSaved(true);
    setTimeout(() => setBizSaved(false), 2200);
  };
  const sections = [["entreprise", "Entreprise", "briefcase"], ["facturation", "Facturation", "invoices"], ["notifications", "Notifications", "reminders"], ["règles", "Règles", "bolt"], ["apparence", "Apparence", "sparkle"], ["donnees", "Données de test", "clients"]];

  return (
    <div className="view content-narrow">
      <SectionTitle title="Réglages" subtitle="Configurez votre entreprise et votre CRM" />
      <div className="grid" style={{ gridTemplateColumns: "200px 1fr", marginTop: 4 }}>
        <div className="settings-nav">
          {sections.map(([k, l, ic]) =>
          <button key={k} className={`snav ${section === k ? "active" : ""}`} onClick={() => setSection(k)}><Icon name={ic} size={17} />{l}</button>
          )}
        </div>

        <div>
          {section === "entreprise" &&
          <Card className="pad">
              <h3 className="card-h">Profil de l'entreprise</h3>
              <div className="logo-setting">
                <EditableLogo size={64} />
                <div>
                  <div className="t-strong" style={{ fontSize: 13.5 }}>Logo de l'entreprise</div>
                  <div className="cc-meta">Cliquez ou glissez une image (PNG, JPG). Il apparaît dans la barre, sur les devis et les factures.</div>
                </div>
              </div>
              <div className="grid grid-2" style={{ gap: 14 }}>
                <div className="field"><label>Nom commercial</label><input className="input" value={biz.name} onChange={setField("name")} /></div>
                <div className="field"><label>Gérant</label><input className="input" value={biz.owner} onChange={setField("owner")} /></div>
                <div className="field"><label>SIRET</label><input className="input" value={biz.siret} onChange={setField("siret")} /></div>
                <div className="field"><label>Téléphone</label><input className="input" value={biz.phone} onChange={setField("phone")} /></div>
                <div className="field" style={{ gridColumn: "1 / -1" }}><label>Adresse</label><input className="input" value={biz.address} onChange={setField("address")} /></div>
                <div className="field" style={{ gridColumn: "1 / -1" }}><label>Email</label><input className="input" value={biz.email} onChange={setField("email")} /></div>
              </div>
              <div className="row" style={{ justifyContent: "flex-end", alignItems: "center", gap: 12, marginTop: 16 }}>
                {bizSaved && <span className="cc-meta" style={{ color: "var(--success)" }}>✓ Enregistré</span>}
                <Button icon="check" onClick={saveBiz}>Enregistrer</Button>
              </div>
            </Card>
          }

          {section === "facturation" &&
          <Card className="pad">
              <h3 className="card-h">Facturation</h3>
              <div className="grid grid-2" style={{ gap: 14 }}>
                <div className="field" style={{ gridColumn: "1 / -1" }}><label>IBAN</label><input className="input" value={biz.iban} onChange={(e) => { const v = e.target.value; setBiz((b) => ({ ...b, iban: v })); company.iban = v; if (window.CRM.save) window.CRM.save(); }} /></div>
                <div className="field"><label>Préfixe facture</label><input className="input" defaultValue="FAC-2026-" /></div>
                <div className="field"><label>Délai de paiement</label><select className="select" defaultValue="15"><option value="0">À réception</option><option value="15">15 jours</option><option value="30">30 jours</option></select></div>
              </div>
              <label className="toggle-row" style={{ marginTop: 16 }}>
                <span><b>Micro-entreprise</b><br /><span className="cc-meta">Mention « TVA non applicable, art. 293 B du CGI »</span></span>
                <span className="switch on"><span className="switch-knob" /></span>
              </label>
              <div className="field" style={{ marginTop: 16 }}>
                <label>Mentions légales</label>
                <textarea className="textarea" value={legal} onChange={(e) => { setLegalState(e.target.value); setLegal(e.target.value); }}
                  placeholder="Ex : pénalités de retard, conditions…" style={{ minHeight: 90 }} />
                <span className="field-hint">Apparaît en pied de chaque facture et devis.</span>
              </div>
            </Card>
          }

          {section === "notifications" &&
          <Card className="pad">
              <h3 className="card-h">Notifications</h3>
              {[["Rappels de RDV par SMS", true], ["Alertes factures en retard", true], ["Résumé hebdomadaire par email", false], ["Devis acceptés", true]].map(([l, on], i) =>
            <label className="toggle-row" key={i}><span>{l}</span><span className={`switch ${on ? "on" : ""}`}><span className="switch-knob" /></span></label>
            )}
            </Card>
          }

          {section === "règles" && <ReglesSectionView />}

          {section === "apparence" &&
          <Card className="pad">
              <h3 className="card-h">Apparence</h3>
              <p className="cc-meta" style={{ marginBottom: 8 }}>
                Activez le mode Tweaks dans la barre d'outils pour personnaliser le thème (clair/sombre), la police, la couleur d'accent et la densité d'affichage. Vos réglages sont mémorisés.
              </p>
              <div className="appearance-hint"><Icon name="sparkle" size={18} /> Thème, police, accent & densité se règlent dans le panneau Tweaks.</div>
            </Card>
          }

          {section === "donnees" &&
          <Card className="pad">
              <h3 className="card-h">Données de test</h3>
              <p className="cc-meta" style={{ marginBottom: 16 }}>
                Pour essayer l'application, remplissez-la d'un jeu de clients fictifs dans des situations variées (devis en attente, interventions planifiées, factures payées ou en retard, RDV du jour…). À supprimer avant une utilisation réelle.
              </p>
              <div className="grid grid-2" style={{ gap: 12 }}>
                <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)" }}>
                  <div className="t-strong" style={{ fontSize: 13.5 }}>Charger des données de démo</div>
                  <div className="cc-meta" style={{ marginTop: 4, marginBottom: 12 }}>≈ 24 clients, devis, RDV et factures dans tous les états.</div>
                  <Button icon="plus" onClick={() => { if (window.confirm("Charger les données de démo ? Cela remplacera vos données actuelles.")) window.CRM.seedDemo(); }}>Charger la démo</Button>
                </div>
                <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)" }}>
                  <div className="t-strong" style={{ fontSize: 13.5 }}>Tout réinitialiser</div>
                  <div className="cc-meta" style={{ marginTop: 4, marginBottom: 12 }}>Efface l'intégralité des données et repart d'une app vierge.</div>
                  <Button variant="danger" icon="trash" onClick={() => { if (window.confirm("Effacer TOUTES les données ? Cette action est irréversible.")) window.CRM.resetAll(); }}>Tout effacer</Button>
                </div>
              </div>
            </Card>
          }
        </div>
      </div>
    </div>);

}

Object.assign(window, { RemindersView, ReportsView, SettingsView, ArchivesView });

// ---------- ARCHIVES ----------
function ArchivesView({ nav }) {
  const { appointments, invoices, quotes, clientById, invoiceTotal, quoteTotal } = window.CRM;
  const [tab, setTab] = React.useState("rdv");

  const doneAppts = appointments.filter(a => a.status === "termine").sort((a,b) => b.date.localeCompare(a.date));
  const paidInvoices = invoices.filter(f => f.status === "payee").sort((a,b) => b.date.localeCompare(a.date));
  const doneQuotes = quotes.filter(q => q.status === "accepte" || q.status === "expire" || q.status === "refuse").sort((a,b) => b.date.localeCompare(a.date));

  const allEmpty = doneAppts.length === 0 && paidInvoices.length === 0 && doneQuotes.length === 0;

  return (
    <div className="view">
      <SectionTitle title="Archives" action={<Button variant="outline" size="sm" icon="download">Exporter</Button>} />

      {allEmpty ? (
        <Card style={{ marginTop: 4 }}>
          <EmptyState
            icon="archive"
            title="Aucune archive"
            text="Les interventions terminées, factures payées et devis clôturés apparaîtront ici."
          />
        </Card>
      ) : (
      <>
      <div className="tabs" style={{ marginBottom: 18 }}>
        {[["rdv",`Interventions (${doneAppts.length})`],["invoices",`Factures (${paidInvoices.length})`],["quotes",`Devis (${doneQuotes.length})`]].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?"active":""}`} onClick={()=>setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "rdv" && (
        <Card style={{ overflow: "hidden", minHeight: "calc(100vh - 220px)" }}>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Date</th><th>Client</th><th>Prestation</th><th className="num">Montant</th></tr></thead>
              <tbody>
                {doneAppts.map(a => {
                  const c = clientById(a.clientId) || { id: null, name: "Client supprimé", type: "particulier" };
                  return (
                    <tr key={a.id} className="clickable" onClick={()=> c.id && nav("clientDetail",{id:c.id})}>
                      <td className="t-strong t-mono">{fmtDateFull(a.date)}</td>
                      <td><div className="cell-client"><Avatar name={c.name} type={c.type} clientId={c.id} size={28}/><span className="cc-name">{c.name}</span></div></td>
                      <td className="t-muted">{a.title}<div className="cc-meta">{a.start} – {a.end}</div></td>
                      <td className="num t-mono t-strong">{eur(a.price)}</td>
                    </tr>
                  );
                })}
                {doneAppts.length === 0 && <tr><td colSpan="4" className="t-muted" style={{ textAlign: "center", padding: 28 }}>Aucune intervention terminée pour le moment.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "invoices" && (
        <Card style={{ overflow: "hidden", minHeight: "calc(100vh - 220px)" }}>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Référence</th><th>Client</th><th>Date</th><th>Statut</th><th className="num">Montant</th></tr></thead>
              <tbody>
                {paidInvoices.map(f => {
                  const c = clientById(f.clientId) || { id: null, name: "Client supprimé", type: "particulier" };
                  return (
                    <tr key={f.id}>
                      <td className="t-strong">{f.ref}</td>
                      <td><div className="cell-client"><Avatar name={c.name} type={c.type} clientId={c.id} size={28}/><span className="cc-name">{c.name}</span></div></td>
                      <td className="t-muted">{fmtDateFull(f.paidDate || f.date)}</td>
                      <td><Badge status={f.status}/></td>
                      <td className="num t-mono t-strong">{eur(invoiceTotal(f))}</td>
                    </tr>
                  );
                })}
                {paidInvoices.length === 0 && <tr><td colSpan="5" className="t-muted" style={{ textAlign: "center", padding: 28 }}>Aucune facture payée archivée.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "quotes" && (
        <Card style={{ overflow: "hidden", minHeight: "calc(100vh - 220px)" }}>
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Référence</th><th>Client</th><th>Date</th><th>Statut</th><th className="num">Montant</th></tr></thead>
              <tbody>
                {doneQuotes.map(q => {
                  const c = clientById(q.clientId) || { id: null, name: "Client supprimé", type: "particulier" };
                  return (
                    <tr key={q.id}>
                      <td className="t-strong">{q.ref}</td>
                      <td><div className="cell-client"><Avatar name={c.name} type={c.type} clientId={c.id} size={28}/><span className="cc-name">{c.name}</span></div></td>
                      <td className="t-muted">{fmtDateFull(q.date)}</td>
                      <td><Badge status={q.status}/></td>
                      <td className="num t-mono t-strong">{eur(quoteTotal(q))}</td>
                    </tr>
                  );
                })}
                {doneQuotes.length === 0 && <tr><td colSpan="5" className="t-muted" style={{ textAlign: "center", padding: 28 }}>Aucun devis clôturé archivé.</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      </>
      )}
    </div>
  );
}
/* Shell application : navigation, routage, Tweaks */

const NAV = [
  { key: "dashboard", label: "Accueil", icon: "dashboard" },
  { key: "maJournee", label: "Ma journée", icon: "sun" },
  { key: "clients", label: "Clients", icon: "clients" },
  { key: "appointments", label: "Agenda", icon: "calendar" },
  { key: "quotes", label: "Devis", icon: "quotes" },
  { key: "invoices", label: "Factures", icon: "invoices" },
  { key: "reminders", label: "Relances", icon: "reminders" },
  { key: "reports", label: "Rapports", icon: "reports" },
  { key: "settings", label: "Réglages", icon: "settings" },
  { key: "archives", label: "Archives", icon: "archive" },
];
const BOTTOM_NAV = ["dashboard", "clients", "appointments", "invoices", "reports"];

const PAGE_TITLES = {
  maJournee: ["Ma journée", ""],
  dashboard: ["Accueil", "Mardi 3 juin 2026"],
  clients: ["Clients", "Votre carnet d'adresses"],
  clientDetail: ["Fiche client", ""],
  clientNew: ["Client", ""],
  appointments: ["Agenda", "Vos interventions"],
  quotes: ["Devis", "Propositions commerciales"],
  invoices: ["Factures", "Facturation & encaissements"],
  reminders: ["Relances", "Rappels automatiques"],
  reports: ["Rapports", "Activité & revenus"],
  settings: ["Réglages", ""],
  archives: ["Archives", ""],
  quoteNew: ["Devis", ""],
  invoiceNew: ["Facture", ""],
  apptNew: ["Agenda", ""],
  apptDetail: ["Intervention", ""],
  ruleNew: ["Relances", ""],
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "font": "artisanal",
  "accent": 42,
  "density": "regular"
}/*EDITMODE-END*/;

const FONT_SETS = {
  artisanal: { display: '"Bricolage Grotesque", Georgia, serif', body: '"Hanken Grotesk", system-ui, sans-serif' },
  classique: { display: '"Newsreader", Georgia, serif', body: '"Mulish", system-ui, sans-serif' },
  net: { display: '"Hanken Grotesk", system-ui, sans-serif', body: '"Hanken Grotesk", system-ui, sans-serif' },
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = React.useState(() => {
    const h = location.hash.replace("#", "");
    return h && PAGE_TITLES[h] ? { view: h, params: null } : { view: "dashboard", params: null };
  });

  const nav = React.useCallback((view, params = null) => {
    if (window.CRM && window.CRM.save) window.CRM.save();
    setRoute({ view, params });
    if (PAGE_TITLES[view]) location.hash = view;
    const sc = document.querySelector(".content");
    if (sc) sc.scrollTop = 0;
  }, []);

  // Appliquer les Tweaks au :root
  React.useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", t.theme === "dark" ? "dark" : "light");
    const fs = FONT_SETS[t.font] || FONT_SETS.artisanal;
    root.style.setProperty("--font-display", fs.display);
    root.style.setProperty("--font-body", fs.body);
    root.style.setProperty("--accent-h", t.accent);
    root.style.setProperty("--density", t.density === "compact" ? 0.8 : t.density === "comfy" ? 1.25 : 1);
  }, [t.theme, t.font, t.accent, t.density]);

  // Accessibilité : relie chaque <label> de .field à son champ via aria-label,
  // puisque le markup utilise des <label> visuels non associés (sans for/id).
  // Un MutationObserver garantit que tout champ ajouté est traité, quel que soit le timing de rendu.
  React.useEffect(() => {
    const link = () => {
      document.querySelectorAll(".field").forEach((f) => {
        const label = f.querySelector(":scope > label");
        const ctrl = f.querySelector("input, select, textarea");
        if (label && ctrl && !ctrl.getAttribute("aria-label")) {
          const txt = label.textContent.trim();
          if (txt) ctrl.setAttribute("aria-label", txt);
        }
      });
    };
    link();
    const obs = new MutationObserver(() => link());
    obs.observe(document.body, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, []);

  const renderView = () => {
    switch (route.view) {
      case "maJournee": return <MaJourneeView nav={nav} />;
      case "dashboard": return <DashboardView nav={nav} />;
      case "clients": return <ClientsView nav={nav} />;
      case "clientDetail": return <ClientDetailView nav={nav} params={route.params || {}} />;
      case "clientNew": return <ClientFormView nav={nav} params={route.params} />;
      case "appointments": return <CalendarView nav={nav} params={route.params} />;
      case "quotes": return <QuotesView nav={nav} />;
      case "invoices": return <InvoicesView nav={nav} />;
      case "reminders": return <RemindersView nav={nav} />;
      case "quoteNew": return <DocFormView nav={nav} params={{ ...(route.params || {}), kind: "devis" }} />;
      case "invoiceNew": return <DocFormView nav={nav} params={{ ...(route.params || {}), kind: "facture" }} />;
      case "apptDetail": return <ApptDetailView nav={nav} params={route.params} />;
      case "apptNew": return <ApptFormView nav={nav} params={route.params} />;
      case "ruleNew": return <RuleFormView nav={nav} />;
      case "reports": return <ReportsView nav={nav} />;
      case "archives": return <ArchivesView nav={nav} />;
      case "settings": return <SettingsView nav={nav} />;
      default: return <DashboardView nav={nav} />;
    }
  };

  const NAV_PARENT = { clientDetail: "clients", clientNew: "clients", quoteNew: "quotes", invoiceNew: "invoices", apptNew: "appointments", apptDetail: "appointments", ruleNew: "reminders" };
  const activeNav = NAV_PARENT[route.view] || route.view;
  const [title, sub] = PAGE_TITLES[route.view] || ["", ""];

  const overdueCount = window.CRM.invoices.filter((f) => f.status === "en_retard").length;

  return (
    <div className="app app-topnav">
      {/* ---- Barre de navigation en haut (desktop) ---- */}
      <header className="appnav">
        <div className="appnav-brand">
          <EditableLogo size={38} />
          <span className="appnav-name">Vitres &amp; Cie</span>
        </div>

        <nav className="appnav-nav">
          {NAV.map((n) => (
            <button type="button" key={n.key} className={`appnav-item ${activeNav === n.key ? "active" : ""}`} onClick={() => nav(n.key)} aria-current={activeNav === n.key ? "page" : undefined}>
              <span>{n.key === "dashboard" ? "Accueil" : n.label}</span>
              {n.key === "invoices" && overdueCount > 0 && <span className="appnav-count">{overdueCount}</span>}
            </button>
          ))}
        </nav>

        <div className="appnav-actions">
          <button className="btn btn-outline btn-sm" title="Rechercher" aria-label="Rechercher"><Icon name="search" size={15} /><span className="hide-narrow">Rechercher</span></button>
          <button className="icon-btn" onClick={() => nav("reminders")} title="Notifications" aria-label="Notifications">
            <Icon name="reminders" size={18} />
            {overdueCount > 0 && <span className="ib-dot" />}
          </button>
          <Avatar name="Julien Mercier" type="particulier" size={36} />
        </div>
      </header>

      {/* ---- Topbar mobile ---- */}
      <header className="mobile-topbar">
        <BrandMark size={34} iconSize={18} />
        <div className="mt-title">{title}</div>
        <div className="spacer" />
        <button className="icon-btn" onClick={() => nav("reminders")} aria-label="Notifications">
          <Icon name="reminders" size={18} />
          {overdueCount > 0 && <span className="ib-dot" />}
        </button>
      </header>

      <main className="content">{renderView()}</main>

      {/* ---- Bottom nav mobile ---- */}
      <nav className="bottom-nav">
        {BOTTOM_NAV.map((k) => {
          const n = NAV.find((x) => x.key === k);
          return (
            <button key={k} className={`bn-item ${activeNav === k ? "active" : ""}`} onClick={() => nav(k)}>
              <Icon name={n.icon} size={21} />
              {k === "invoices" && overdueCount > 0 && <span className="bn-dot" />}
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ---- Tweaks ---- */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Thème" />
        <TweakRadio label="Apparence" value={t.theme} options={[{ value: "light", label: "Clair" }, { value: "dark", label: "Sombre" }]} onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="Typographie" />
        <TweakRadio label="Police" value={t.font} options={[{ value: "artisanal", label: "Artisanale" }, { value: "classique", label: "Classique" }, { value: "net", label: "Net" }]} onChange={(v) => setTweak("font", v)} />
        <TweakSection label="Couleur d'accent" />
        <TweakColor label="Accent" value={accentToHex(t.accent)} options={ACCENT_SWATCHES} onChange={(hex) => setTweak("accent", HEX_TO_HUE[hex] ?? 42)} />
        <TweakSection label="Densité" />
        <TweakRadio label="Affichage" value={t.density} options={[{ value: "compact", label: "Compact" }, { value: "regular", label: "Normal" }, { value: "comfy", label: "Aéré" }]} onChange={(v) => setTweak("density", v)} />
      </TweaksPanel>
    </div>
  );
}

// Swatches d'accent → on stocke une teinte (hue) mais on affiche des hex
const HUE_SWATCHES = [
  { hue: 42, hex: "#c2703f" }, // terre cuite
  { hue: 28, hex: "#bd5a45" }, // brique
  { hue: 145, hex: "#5a8a5f" }, // sauge
  { hue: 232, hex: "#5f7fa8" }, // bleu eau
  { hue: 300, hex: "#9a6a9a" }, // prune
];
const ACCENT_SWATCHES = HUE_SWATCHES.map((s) => s.hex);
const HEX_TO_HUE = Object.fromEntries(HUE_SWATCHES.map((s) => [s.hex, s.hue]));
const accentToHex = (hue) => (HUE_SWATCHES.find((s) => s.hue === hue) || HUE_SWATCHES[0]).hex;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

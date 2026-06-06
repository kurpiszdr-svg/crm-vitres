/* Composants UI partagés — exportés sur window pour les autres scripts Babel */

// ---------- Icônes (stroke, simples) ----------
const ICON_PATHS = {
  dashboard: '<path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z"/>',
  clients: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c0-3 2.6-5 5.5-5s5.5 2 5.5 5"/><path d="M16 5.5a3 3 0 0 1 0 5.8"/><path d="M17.5 19c0-2.2-1-3.6-2.4-4.4"/>',
  calendar: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9h17M8 2.5v4M16 2.5v4"/>',
  quotes: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  invoices: '<path d="M6 2.5h12v19l-3-2-3 2-3-2-3 2v-19Z"/><path d="M9 8h6M9 12h6"/>',
  reminders: '<path d="M18 8a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 14 18 8Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  reports: '<path d="M4 20V4M4 20h16"/><rect x="7" y="11" width="3" height="6"/><rect x="12.5" y="7" width="3" height="10"/><rect x="18" y="13" width="3" height="4" transform="translate(-1 0)"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 6.7 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 12a2 2 0 1 1 0-4 1.6 1.6 0 0 0 1.1-2.7L4 5.2a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 9.6 3 2 2 0 1 1 13.6 3a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 .3 2.7 2 2 0 1 1 0 4Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-3.6-3.6"/>',
  phone: '<path d="M5 3.5h3.2l1.4 4-2 1.4a12 12 0 0 0 5.3 5.3l1.4-2 4 1.4V20a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 3.5 5 1.5 1.5 0 0 1 5 3.5Z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/>',
  mapPin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  chevronLeft: '<path d="M15 6l-6 6 6 6"/>',
  chevronDown: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5 10 17l9-10"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5 6.5 6.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  edit: '<path d="M5 19h14M7 15l9-9 3 3-9 9H7v-3Z"/>',
  trash: '<path d="M4 6h16M9 6V4h6v2M6 6l1 14h10l1-14"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17l-5.2 2.6 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"/>',
  arrowUpRight: '<path d="M7 17 17 7M9 7h8v8"/>',
  send: '<path d="M21 4 3 11l7 2.5L13 21l8-17Z"/><path d="m10 13.5 4-4"/>',
  download: '<path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14"/>',
  euro: '<path d="M16 7a6 6 0 1 0 0 10M5 10h7M5 14h6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  home: '<path d="M4 11 12 4l8 7M6 10v10h12V10"/>',
  sparkle: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
  message: '<path d="M4 5h16v11H8l-4 3V5Z"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"/>',
  bolt: '<path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z"/>',
  camera: '<path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.4-2h7.2L17 7h2.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9Z"/><circle cx="12" cy="12.5" r="3.3"/>',
  archive: '<rect x="3" y="4" width="18" height="5" rx="1.5"/><path d="M5 9v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4"/>'
};

function Icon({ name, size = 20, className = "", style = {} }) {
  const d = ICON_PATHS[name];
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      dangerouslySetInnerHTML={{ __html: d }} />);


}

// ---------- Badge / Pastille de statut ----------
const STATUS_META = {
  // RDV
  planifie: { label: "Planifié", tone: "water", icon: "calendar", hint: "Rendez-vous prévu" },
  termine: { label: "Terminé", tone: "success", icon: "check", hint: "Rendez-vous réalisé" },
  annule: { label: "Annulé", tone: "danger", icon: "x", hint: "N'aura pas lieu" },
  // Devis
  brouillon: { label: "Créé", tone: "neutral", icon: "edit", hint: "Pas encore envoyé" },
  envoye: { label: "Envoyé", tone: "water", icon: "send", hint: "En attente de réponse" },
  accepte: { label: "Accepté", tone: "success", icon: "check", hint: "À programmer ou facturer" },
  refuse: { label: "Refusé", tone: "danger", icon: "x", hint: "Le client n'a pas donné suite" },
  expire: { label: "Expiré", tone: "warning", icon: "clock", hint: "Devis plus valable" },
  // Factures
  creee: { label: "Créée", tone: "neutral", icon: "edit", hint: "Pas encore envoyée" },
  payee: { label: "Payée", tone: "success", icon: "check", hint: "Paiement reçu" },
  envoyee: { label: "Envoyée", tone: "water", icon: "send", hint: "En attente de paiement" },
  en_retard: { label: "En retard", tone: "danger", icon: "reminders", hint: "Facture à relancer" }
};

function Badge({ status, children, tone, className = "", icon, showIcon = true }) {
  const meta = status ? STATUS_META[status] : null;
  const t = tone || (meta ? meta.tone : "neutral");
  const label = children || (meta ? meta.label : status);
  const iconName = icon || (meta && showIcon ? meta.icon : null);
  return (
    <span className={`badge badge-${t} ${iconName ? "badge-has-icon" : ""} ${className}`} title={meta ? meta.hint : undefined}>
      {iconName && <Icon name={iconName} size={12} />}
      {label}
    </span>);

}

// ---------- Bouton ----------
function Button({ children, variant = "primary", size = "md", icon, onClick, className = "", type = "button", title }) {
  return (
    <button type={type} title={title} onClick={onClick} className={`btn btn-${variant} btn-${size} ${className}`} style={{ fontSize: "20px" }}>
      {icon && <Icon name={icon} size={size === "sm" ? 16 : 18} />}
      {children && <span>{children}</span>}
    </button>);

}

// ---------- Carte ----------
function Card({ children, className = "", onClick, as = "div" }) {
  const El = as;
  return (
    <El className={`card ${onClick ? "card-click" : ""} ${className}`} onClick={onClick}>
      {children}
    </El>);

}

// ---------- État vide (réutilisable) ----------
function EmptyState({ icon = "sparkle", title, text, actionLabel, onAction, compact = false }) {
  return (
    <div className={`empty-state ${compact ? "empty-state-compact" : ""}`}>
      <span className="empty-state-ic"><Icon name={icon} size={compact ? 22 : 26} /></span>
      <div className="empty-state-title">{title}</div>
      {text && <div className="empty-state-text">{text}</div>}
      {actionLabel && onAction && (
        <div className="empty-state-action">
          <Button variant="primary" size="sm" icon="plus" onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>);

}

// ---------- Photos clients (persistées) ----------
const PHOTO_KEY = "crmClientPhotos";
function loadPhotos() {
  try {return JSON.parse(localStorage.getItem(PHOTO_KEY) || "{}");} catch (e) {return {};}
}
let __photos = loadPhotos();
function getPhoto(id) {return id ? __photos[id] || null : null;}
function setPhoto(id, dataUrl) {
  __photos = { ...__photos, [id]: dataUrl };
  try {localStorage.setItem(PHOTO_KEY, JSON.stringify(__photos));} catch (e) {}
  window.dispatchEvent(new CustomEvent("crm-photo", { detail: { id } }));
}
function removePhoto(id) {
  __photos = { ...__photos };
  delete __photos[id];
  try {localStorage.setItem(PHOTO_KEY, JSON.stringify(__photos));} catch (e) {}
  window.dispatchEvent(new CustomEvent("crm-photo", { detail: { id } }));
}

// ---------- Avatar (initiales ou photo) ----------
function Avatar({ name, type, size = 40, clientId }) {
  const [photo, setP] = React.useState(() => getPhoto(clientId));
  React.useEffect(() => {
    setP(getPhoto(clientId));
    const h = (e) => {if (!clientId || e.detail.id === clientId) setP(getPhoto(clientId));};
    window.addEventListener("crm-photo", h);
    return () => window.removeEventListener("crm-photo", h);
  }, [clientId]);

  const initials = name.
  split(" ").
  slice(0, 2).
  map((w) => w[0]).
  join("").
  toUpperCase();

  if (photo) {
    return (
      <div className={`avatar avatar-photo avatar-${type || "particulier"}`} style={{ width: size, height: size }}>
        <img src={photo} alt={name} />
      </div>);

  }
  return (
    <div className={`avatar avatar-${type || "particulier"}`} style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>);

}

// ---------- Avatar éditable (photo client) ----------
function EditableAvatar({ client, size = 62 }) {
  const inputRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const [hasPhoto, setHasPhoto] = React.useState(() => !!getPhoto(client.id));
  React.useEffect(() => {
    setHasPhoto(!!getPhoto(client.id));
    const h = (e) => {if (e.detail.id === client.id) setHasPhoto(!!getPhoto(client.id));};
    window.addEventListener("crm-photo", h);
    return () => window.removeEventListener("crm-photo", h);
  }, [client.id]);

  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => setPhoto(client.id, r.result);
    r.readAsDataURL(file);
  };

  return (
    <div
      className={`editable-avatar ${drag ? "dragover" : ""}`}
      style={{ width: size, height: size }}
      onClick={() => inputRef.current && inputRef.current.click()}
      onDragOver={(e) => {e.preventDefault();setDrag(true);}}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {e.preventDefault();setDrag(false);readFile(e.dataTransfer.files[0]);}}
      title="Ajouter / changer la photo">
      
      <Avatar name={client.name} type={client.type} clientId={client.id} size={size} />
      <span className="ea-cam"><Icon name="camera" size={14} /></span>
      {hasPhoto &&
      <button className="ea-remove" title="Retirer la photo" onClick={(e) => {e.stopPropagation();removePhoto(client.id);}}>
          <Icon name="x" size={12} />
        </button>
      }
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => readFile(e.target.files[0])} />
    </div>);

}

// ---------- Mentions légales (persistées) ----------
const LEGAL_KEY = "crmLegalMention";
const DEFAULT_LEGAL = "TVA non applicable, art. 293 B du CGI. En cas de retard de paiement, une pénalité de 3× le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de recouvrement de 40 €.";
function getLegal() {try {return localStorage.getItem(LEGAL_KEY) || DEFAULT_LEGAL;} catch (e) {return DEFAULT_LEGAL;}}
function setLegal(v) {try {localStorage.setItem(LEGAL_KEY, v);} catch (e) {}window.dispatchEvent(new CustomEvent("crm-legal"));}
function useLegal() {
  const [v, setV] = React.useState(getLegal);
  React.useEffect(() => {const h = () => setV(getLegal());window.addEventListener("crm-legal", h);return () => window.removeEventListener("crm-legal", h);}, []);
  return v;
}

// ---------- Délai minimum entre deux RDV (persisté) ----------
const MINGAP_KEY = "crmMinGapMin";
const DEFAULT_MINGAP = 10;
function getMinGap() {try {const v = localStorage.getItem(MINGAP_KEY);return v == null ? DEFAULT_MINGAP : Number(v);} catch (e) {return DEFAULT_MINGAP;}}
function setMinGap(v) {try {localStorage.setItem(MINGAP_KEY, String(v));} catch (e) {}window.dispatchEvent(new CustomEvent("crm-mingap"));}
function useMinGap() {
  const [v, setV] = React.useState(getMinGap);
  React.useEffect(() => {const h = () => setV(getMinGap());window.addEventListener("crm-mingap", h);return () => window.removeEventListener("crm-mingap", h);}, []);
  return v;
}

// ---------- Logo entreprise (persisté) ----------
const LOGO_KEY = "crmCompanyLogo";
let __logo = (() => {try {return localStorage.getItem(LOGO_KEY) || null;} catch (e) {return null;}})();
function getLogo() {return __logo;}
function setLogo(d) {__logo = d;try {localStorage.setItem(LOGO_KEY, d);} catch (e) {}window.dispatchEvent(new CustomEvent("crm-logo"));}
function removeLogo() {__logo = null;try {localStorage.removeItem(LOGO_KEY);} catch (e) {}window.dispatchEvent(new CustomEvent("crm-logo"));}
function useLogo() {
  const [logo, setL] = React.useState(() => getLogo());
  React.useEffect(() => {
    const h = () => setL(getLogo());
    window.addEventListener("crm-logo", h);
    return () => window.removeEventListener("crm-logo", h);
  }, []);
  return logo;
}

// Marque (logo ou icône) — lecture seule
function BrandMark({ size = 38, iconSize }) {
  const logo = useLogo();
  const is = iconSize || Math.round(size * 0.55);
  return (
    <div className={`brand-mark ${logo ? "has-logo" : ""}`} style={{ width: size, height: size }}>
      {logo ? <img className="brand-logo-img" src={logo} alt="Logo" /> : <Icon name="sparkle" size={is} />}
    </div>);

}

// Logo éditable (clic / glisser-déposer)
function EditableLogo({ size = 38 }) {
  const logo = useLogo();
  const inputRef = React.useRef(null);
  const [drag, setDrag] = React.useState(false);
  const readFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => setLogo(r.result);
    r.readAsDataURL(file);
  };
  return (
    <div
      className={`editable-logo ${drag ? "dragover" : ""}`}
      style={{ width: size, height: size }}
      onClick={() => inputRef.current && inputRef.current.click()}
      onDragOver={(e) => {e.preventDefault();setDrag(true);}}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {e.preventDefault();setDrag(false);readFile(e.dataTransfer.files[0]);}}
      title="Ajouter / changer le logo">
      
      <BrandMark size={size} />
      <span className="ea-cam"><Icon name="camera" size={12} /></span>
      {logo &&
      <button className="ea-remove" title="Retirer le logo" onClick={(e) => {e.stopPropagation();removeLogo();}}>
          <Icon name="x" size={11} />
        </button>
      }
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => readFile(e.target.files[0])} />
    </div>);

}

// ---------- Helpers format ----------
const eur = (n) =>
new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 === 0 ? 0 : 2 }).format(n);

const MONTHS_FR = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const DAYS_FR = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const DAYS_FULL = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

function fmtDate(iso, long) {
  const d = new Date(iso + "T00:00:00");
  if (long) return `${DAYS_FULL[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtDateFull(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function fmtDateShort(iso) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}
function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000);
}

// ---------- Section header ----------
function SectionTitle({ title, subtitle, action, compact }) {
  return (
    <div className={"section-title" + (compact ? " section-title-compact" : "")}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>);

}

// ---------- Empty / Stat ----------
function Stat({ label, value, delta, deltaTone, icon }) {
  return (
    <div className="stat">
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        {icon &&
        <span className="stat-icon">
            <Icon name={icon} size={18} />
          </span>
        }
      </div>
      <div className="stat-value">{value}</div>
      {delta && <div className={`stat-delta delta-${deltaTone || "neutral"}`}>{delta}</div>}
    </div>);

}

Object.assign(window, {
  Icon,
  Badge,
  Button,
  Card,
  Avatar,
  EditableAvatar,
  EmptyState,
  BrandMark,
  EditableLogo,
  getLogo,
  setLogo,
  removeLogo,
  useLogo,
  getLegal,
  setLegal,
  useLegal,
  getMinGap,
  setMinGap,
  useMinGap,
  getPhoto,
  setPhoto,
  removePhoto,
  SectionTitle,
  Stat,
  STATUS_META,
  eur,
  fmtDate,
  fmtDateFull,
  fmtDateShort,
  daysBetween,
  MONTHS_FR,
  DAYS_FR,
  DAYS_FULL
});
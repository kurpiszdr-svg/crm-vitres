/* CRM Laveur de Vitres — données
   Toutes les listes sont vides — prêtes à être remplies en production.
   Les fonctions helpers et la structure restent intactes. */
(function () {
  "use strict";

  // ---- Profil entreprise ----
  const company = {
    name: "Vitres & Compagnie",
    owner: "Julien Mercier",
    trade: "Nettoyage de vitres",
    siret: "812 456 789 00021",
    phone: "06 14 82 73 19",
    email: "julien@vitres-cie.fr",
    address: "14 rue des Lavandières, 69007 Lyon",
    tvaApplicable: false,
    iban: "FR76 3000 4000 0312 3456 7890 143",
    mentionLegale: "",
  };

  // ---- Données vides ----
  const clients      = [];
  const appointments = [];
  const quotes       = [];
  const invoices     = [];
  const reminderLog  = [];

  const reminderRules = [
    { id: "r1", name: "Rappel de rendez-vous",           trigger: "24h avant le RDV",                  channel: "sms",   active: true,  template: "Bonjour {prenom}, petit rappel : intervention vitres demain à {heure}. Vitres & Cie — Julien." },
    { id: "r2", name: "Devis sans réponse",              trigger: "5 jours après envoi du devis",       channel: "email", active: true,  template: "Bonjour {prenom}, avez-vous pu consulter le devis {ref} ? Je reste à votre disposition." },
    { id: "r3", name: "Facture en retard",               trigger: "3 jours après échéance",             channel: "email", active: true,  template: "Bonjour {prenom}, la facture {ref} ({montant}) reste en attente de règlement. Merci !" },
    { id: "r4", name: "Passage trimestriel à reprogrammer", trigger: "85 jours après dernier passage", channel: "sms",   active: false, template: "Bonjour {prenom}, vos vitres sont dues pour un nouveau passage. On planifie ?" },
  ];

  const revenueByMonth = [
    { month: "Janv.", ca: 0 },
    { month: "Févr.", ca: 0 },
    { month: "Mars",  ca: 0 },
    { month: "Avr.",  ca: 0 },
    { month: "Mai",   ca: 0 },
    { month: "Juin",  ca: 0 },
  ];

  // ---- Helpers ----
  const clientById  = (id) => clients.find((c) => c.id === id) || null;
  // Bug #6 : nom sûr pour références orphelines (client supprimé) ou RDV sans client.
  const clientName  = (id) => { if (!id) return "Sans client"; const c = clients.find((x) => x.id === id); return c ? c.name : "Client supprimé"; };

  // Bug #8 : génération des occurrences d'une série récurrente.
  //  - intervalle selon le rythme ; horizon 3 mois, minimum 3 occurrences au total ;
  //  - tout créneau en conflit (règle des écarts) est SAUTÉ, jamais chevauché.
  const RECUR_MONTHS = { hebdomadaire: 0, mensuel: 1, bimestriel: 2, trimestriel: 3, semestriel: 6 };
  const addMonthsISO = (iso, n) => {
    const d = new Date(iso + "T00:00:00"); const day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, dim));
    return d.toISOString().slice(0, 10);
  };
  const addDaysISO = (iso, n) => { const d = new Date(iso + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  // Décale la date de la k-ième occurrence depuis une date d'ancrage
  const occurrenceDate = (anchorISO, rhythm, k) =>
    rhythm === "hebdomadaire" ? addDaysISO(anchorISO, 7 * k) : addMonthsISO(anchorISO, (RECUR_MONTHS[rhythm] || 1) * k);
  const slotConflicts = (dateISO, startMin, endMin, gap, ignoreSeriesId) =>
    appointments.some((a) => a.date === dateISO && a.status !== "annule"
      && a.seriesId !== ignoreSeriesId // n'entre pas en conflit avec sa propre série en cours de génération
      && (endMin + gap > toMinutes(a.start)) && (startMin < toMinutes(a.end) + gap));
  // Génère depuis `base` (déjà inséré). Retourne { created, skipped }.
  const generateSeries = (base, rhythm, seriesId, gap = 10, anchorISO = base.date, horizonMonths = 3, minCount = 3) => {
    if (!RECUR_MONTHS.hasOwnProperty(rhythm)) return { created: 0, skipped: 0 };
    const startMin = toMinutes(base.start), endMin = toMinutes(base.end);
    const horizon = addMonthsISO(anchorISO, horizonMonths);
    let created = 0, skipped = 0, k = 1;
    while (k <= 24) {
      const d = occurrenceDate(anchorISO, rhythm, k);
      if (d > horizon && created >= (minCount - 1)) break;
      if (k >= 24) break;
      // conflit : on saute (mais on ignore les occurrences de la même série)
      if (slotConflicts(d, startMin, endMin, gap, seriesId)) { skipped++; }
      else {
        appointments.push({ ...base, id: newId("a"), date: d, status: "planifie", seriesId, recurring: rhythm });
        created++;
      }
      k++;
    }
    if (created || skipped) save();
    return { created, skipped };
  };
  // Prolonge une série existante de `horizonMonths` à partir de sa dernière occurrence.
  const extendSeries = (seriesId, rhythm, gap = 10, horizonMonths = 3) => {
    const members = appointments.filter((a) => a.seriesId === seriesId);
    if (!members.length) return { created: 0, skipped: 0 };
    const last = members.reduce((mx, a) => (a.date > mx.date ? a : mx), members[0]);
    return generateSeries(last, rhythm, seriesId, gap, last.date, horizonMonths, 1);
  };
  // Supprime les occurrences FUTURES (planifiées) d'une série ; conserve le passé/terminé.
  const deleteFutureSeries = (seriesId, fromISO) => {
    let removed = 0;
    for (let i = appointments.length - 1; i >= 0; i--) {
      const a = appointments[i];
      if (a.seriesId === seriesId && a.status === "planifie" && a.date >= fromISO) { appointments.splice(i, 1); removed++; }
    }
    if (removed) save();
    return removed;
  };

  // Suppression client avec garde-fou : compte les documents liés, demande confirmation
  // graduée, puis supprime le client. Renvoie true si supprimé.
  const deleteClient = (id) => {
    const c = clients.find((x) => x.id === id);
    if (!c) return false;
    const nQ = quotes.filter((q) => q.clientId === id).length;
    const nF = invoices.filter((f) => f.clientId === id).length;
    const nA = appointments.filter((a) => a.clientId === id).length;
    const parts = [];
    if (nQ) parts.push(`${nQ} devis`);
    if (nF) parts.push(`${nF} facture${nF > 1 ? "s" : ""}`);
    if (nA) parts.push(`${nA} rendez-vous`);
    let msg;
    if (parts.length) {
      msg = `${c.name} est lié à ${parts.join(", ")}.\n\nSi vous supprimez ce client, ces documents seront conservés mais affichés comme « Client supprimé ».\n\nConfirmer la suppression définitive ?`;
    } else {
      msg = `Supprimer ${c.name} définitivement ? Cette action est irréversible.`;
    }
    if (!window.confirm(msg)) return false;
    clients.splice(clients.findIndex((x) => x.id === id), 1);
    save();
    return true;
  };
  const quoteTotal  = (q)  => (q.items || []).reduce((s, it) => s + it.qty * it.price, 0);
  const invoiceTotal= (inv)=> (inv.items || []).reduce((s, it) => s + it.qty * it.price, 0);
  const invoicePaid = (inv)=> (inv.payments || []).reduce((s, p) => s + p.amount, 0);

  // ---- Compteur d'IDs ----
  let __seq = 1000;
  const newId = (p) => `${p}${++__seq}`;

  // ====================================================================
  //  PERSISTANCE — sauvegarde automatique dans le navigateur
  //  Tout ce que l'utilisateur crée (clients, RDV, devis, factures,
  //  règlements…) survit désormais à un rafraîchissement de la page.
  // ====================================================================
  const STORAGE_KEY = "vitres-cie-crm-v1";

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        v: 1,
        seq: __seq,
        company,
        clients,
        appointments,
        quotes,
        invoices,
        reminderRules,
        reminderLog,
        revenueByMonth,
      }));
    } catch (e) { /* quota / mode privé : on ignore silencieusement */ }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || typeof d !== "object") return;
      // Remplace le contenu des tableaux EN PLACE (les vues gardent
      // leurs références) plutôt que de réassigner les variables.
      const repl = (arr, val) => {
        if (Array.isArray(val)) { arr.length = 0; val.forEach((x) => arr.push(x)); }
      };
      repl(clients, d.clients);
      repl(appointments, d.appointments);
      repl(quotes, d.quotes);
      repl(invoices, d.invoices);
      repl(reminderRules, d.reminderRules);
      repl(reminderLog, d.reminderLog);
      repl(revenueByMonth, d.revenueByMonth);
      if (d.company && typeof d.company === "object") Object.assign(company, d.company);
      if (typeof d.seq === "number" && d.seq > __seq) __seq = d.seq;
    } catch (e) { /* données corrompues : on repart des valeurs par défaut */ }
  }

  // Hydratation AVANT le premier rendu de React (data.js est chargé avant app.jsx)
  load();

  // Filets de sécurité : sauvegarde périodique + à la fermeture / refresh
  setInterval(save, 1500);
  window.addEventListener("beforeunload", save);
  window.addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });

  // Réinitialisation manuelle (utile pour repartir de zéro)
  function resetAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    location.reload();
  }

  // ====================================================================
  //  DONNÉES DE DÉMONSTRATION — pour tester l'app avec des cas variés.
  //  Remplace tout le contenu existant puis recharge la page.
  // ====================================================================
  function seedDemo() {
    const TODAY = "2026-06-03";
    const dShift = (n) => { const d = new Date(TODAY + "T00:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    clients.length = 0; appointments.length = 0; quotes.length = 0; invoices.length = 0; reminderLog.length = 0;
    __seq = 1000;

    const prenoms = ["Camille","Lucas","Marie","Hugo","Léa","Thomas","Emma","Nathan","Chloé","Louis","Sarah","Paul","Inès","Jules","Anna","Yanis","Manon","Adam","Zoé","Noah","Élise","Marc","Sofia","Tom"];
    const noms = ["Rousseau","Martin","Bernard","Dubois","Moreau","Laurent","Simon","Michel","Garcia","Roux","Fontaine","Girard","Lefèvre","Mercier","Blanc","Guérin","Boyer","Henry","Roy","Gauthier","Perrin","Morel","Faure","André"];
    const pros = ["Boulangerie Léon","Café des Halles","Pharmacie du Parc","Hôtel Bellecour","Restaurant L'Olive","Cabinet Dentaire Sud"];
    const zones = ["Vieux Lyon","Croix-Rousse","Part-Dieu","Confluence","Guillotière","Monplaisir","Vaise","Gerland"];
    const rythmes = ["hebdomadaire","mensuel","trimestriel","ponctuel"];
    let pp = 0;
    for (let i = 0; i < 24; i++) {
      const isPro = i % 4 === 0;
      let name, type, contact, siret;
      if (isPro) { name = pros[pp % pros.length]; type = "pro"; contact = prenoms[i % 24] + " " + noms[i % 24]; siret = "812 456 " + (700 + i) + " 000" + (10 + i); pp++; }
      else { name = prenoms[i % 24] + " " + noms[(i + 3) % 24]; type = "particulier"; contact = name; siret = ""; }
      clients.push({ id: newId("c"), type, name, contact, siret,
        phone: "06 " + (10 + i) + " " + (20 + i % 50) + " " + (30 + i % 40) + " " + (40 + i % 30),
        email: name.toLowerCase().replace(/[^a-z]/g, "") + "@email.fr",
        address: (10 + i) + " rue de la Vitre, 6900" + (i % 9) + " Lyon",
        zone: zones[i % zones.length], notes: i % 5 === 0 ? "Code portail 1234." : "",
        tags: [...(isPro ? ["pro"] : []), rythmes[i % 4]], vitres: (i * 7) % 60, rating: 3 + (i % 3), since: dShift(-(30 + i * 9)) });
    }
    const cl = clients;
    const presta = [["Nettoyage vitrine",2,"baie",45],["Vitres + véranda",1,"forfait",180],["Nettoyage complet",12,"vitre",8],["Devanture commerce",1,"forfait",120],["Baies vitrées étage",4,"baie",35]];
    const mkItems = (i) => { const p = presta[i % presta.length]; return [{ label: p[0], qty: p[1], unit: p[2], price: p[3] }]; };
    let qn = 0, fn = 0;
    const addQuote = (cid, st, off, dos, items) => { const q = { id: newId("q"), ref: "DEV-2026-" + String(++qn).padStart(3, "0"), clientId: cid, date: dShift(off), validUntil: dShift(off + 30), status: st, items: items || mkItems(qn), note: "", durationEstimateMin: 60, sourceApptId: null, dossierId: dos }; quotes.unshift(q); return q; };
    const addAppt = (cid, rt, st, off, o = {}) => { const a = { id: newId("a"), clientId: cid, date: dShift(off), start: o.start || "09:00", end: o.end || "10:00", title: o.title || "Intervention vitres", rdvType: rt, linkedQuoteId: o.linkedQuoteId || null, dossierId: o.dossierId || null, status: st, price: (rt === "appel" || rt === "devis") ? 0 : (o.price != null ? o.price : 120), recurring: o.recurring || null }; appointments.push(a); return a; };
    const addInv = (cid, st, off, o = {}) => { const items = o.items || mkItems(fn); const tot = items.reduce((s, it) => s + it.qty * it.price, 0); let payments = [], paidDate = null; if (st === "payee") { payments = [{ amount: tot, date: dShift(off + 5), method: "Virement" }]; paidDate = dShift(off + 5); } const f = { id: newId("f"), ref: "FAC-2026-" + String(++fn).padStart(3, "0"), clientId: cid, date: dShift(off), dueDate: dShift(off + 15), status: st, paidDate, items, payments, linkedApptId: o.linkedApptId || null, linkedQuoteId: o.linkedQuoteId || null, dossierId: o.dossierId || null }; invoices.unshift(f); return f; };

    // Cycles de vie variés sur les 16 premiers clients
    for (let i = 0; i < 16; i++) {
      const c = cl[i]; const dos = newId("dos"); const items = mkItems(i);
      if (i % 5 === 0) { addQuote(c.id, "envoye", -3, dos, items); addAppt(c.id, "devis", "termine", -4, { dossierId: dos, title: "Visite devis" }); }
      else if (i % 5 === 1) { addQuote(c.id, "accepte", -10, dos, items); }
      else if (i % 5 === 2) { const q = addQuote(c.id, "accepte", -12, dos, items); addAppt(c.id, "intervention", "planifie", 2, { linkedQuoteId: q.id, dossierId: dos, price: items[0].qty * items[0].price, title: items[0].label }); }
      else if (i % 5 === 3) { const q = addQuote(c.id, "accepte", -25, dos, items); const a = addAppt(c.id, "intervention", "termine", -15, { linkedQuoteId: q.id, dossierId: dos, price: items[0].qty * items[0].price, title: items[0].label }); addInv(c.id, "payee", -14, { linkedApptId: a.id, linkedQuoteId: q.id, dossierId: dos, items }); }
      else { const q = addQuote(c.id, "accepte", -40, dos, items); const a = addAppt(c.id, "intervention", "termine", -30, { linkedQuoteId: q.id, dossierId: dos, price: items[0].qty * items[0].price, title: items[0].label }); addInv(c.id, i % 2 ? "en_retard" : "envoyee", -28, { linkedApptId: a.id, linkedQuoteId: q.id, dossierId: dos, items }); }
    }
    // RDV du jour (Accueil / Ma journée)
    addAppt(cl[0].id, "intervention", "planifie", 0, { start: "07:30", end: "09:00", price: 90, title: "Vitrine boulangerie" });
    addAppt(cl[2].id, "intervention", "planifie", 0, { start: "10:00", end: "11:30", price: 140, title: "Véranda + baies" });
    addAppt(cl[5].id, "appel", "planifie", 0, { start: "14:00", end: "14:15", title: "Rappel client" });
    addAppt(cl[7].id, "devis", "planifie", 0, { start: "16:00", end: "16:30", title: "Visite devis" });
    addAppt(cl[8].id, "autre", "planifie", 1, { start: "12:00", end: "13:00", title: "Rendez-vous médecin" });
    addAppt(cl[9].id, "intervention", "annule", -2, { price: 75, title: "Annulé (pluie)" });
    quotes.unshift({ id: newId("q"), ref: "DEV-2026-099", clientId: cl[11].id, date: dShift(-8), validUntil: dShift(22), status: "refuse", items: mkItems(3), note: "", durationEstimateMin: 90, sourceApptId: null, dossierId: newId("dos") });

    save();
    location.reload();
  }

  window.CRM = {
    company,
    clients,
    clientById,
    clientName,
    generateSeries,
    extendSeries,
    deleteFutureSeries,
    deleteClient,
    appointments,
    quotes,
    invoices,
    reminderRules,
    reminderLog,
    revenueByMonth,
    quoteTotal,
    invoiceTotal,
    invoicePaid,
    newId,
    save,
    resetAll,
    seedDemo,
    today: "2026-06-03",
  };
})();

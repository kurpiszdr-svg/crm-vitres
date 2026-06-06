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

  window.CRM = {
    company,
    clients,
    clientById,
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
    today: "2026-06-03",
  };
})();

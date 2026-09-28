/* ============================================================
   EW Assistant — basic, rule-based helper (no external AI API).
   Matches the visitor's question against the company's real
   information and hands off to WhatsApp with a pre-filled message.
   Replies in Spanish when the visitor writes in Spanish.
   ============================================================ */
(() => {
  "use strict";

  const WA_NUMBER = "19543268806"; // business line (954) 326-8806
  const PHONE = "(954) 326-8806";
  const EMAIL = "info@ecowoodworkdesigns.com";
  const ADDRESS = "3761 NE 4th Ave, Oakland Park, FL 33334";
  const IG = "https://www.instagram.com/eco_woodworkanddesign?stkn=aGJlZHVjdGlmcG9m";

  const waLink = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ---------- Knowledge base ----------
     Each service: keywords (accent-free, lowercase) in EN + ES, answers in both,
     and the WhatsApp message it pre-fills. */
  const SERVICES = [
    {
      id: "kitchens",
      keys: ["kitchen", "cocina", "island", "isla", "pantry", "pantri", "despensa", "alacena"],
      en: { name: "Custom Kitchens", text: "We design and build custom kitchen cabinetry to the exact layout of your kitchen — islands, tall pantry walls and walk-in pantries — in solid wood, MDF, metal or laminates, with the finish and hardware you choose." },
      es: { name: "Cocinas a medida", text: "Diseñamos y fabricamos gabinetes de cocina a la medida exacta de tu espacio — islas, paredes de despensa y walk-in pantries — en madera sólida, MDF, metal o laminados, con el acabado y los herrajes que elijas." },
      link: "/services/#kitchens",
    },
    {
      id: "closets",
      keys: ["closet", "closets", "walk-in", "walk in", "wardrobe", "vestidor", "armario", "ropero", "zapatera", "shoe"],
      en: { name: "Closets & Storage", text: "Walk-in and reach-in closets with shelves, rods and drawers organized around your wardrobe — including lit shelving and shoe walls." },
      es: { name: "Closets y almacenamiento", text: "Closets walk-in y empotrados con repisas, tubos y cajones organizados según tu ropa — incluso con repisas iluminadas y zapateras." },
      link: "/services/#closets",
    },
    {
      id: "vanities",
      keys: ["vanity", "vanities", "bathroom", "bath", "bano", "lavamanos", "tocador"],
      en: { name: "Bathroom Vanities", text: "Custom vanities sized to your bathroom — floating or floor-standing, with drawers, organizers and under-cabinet lighting." },
      es: { name: "Vanities de baño", text: "Vanities a la medida de tu baño — flotantes o de piso, con cajones, organizadores y luz inferior." },
      link: "/services/#vanities",
    },
    {
      id: "bars",
      keys: ["bar", "bars", "bares", "wine", "vino", "coffee", "cafe", "espresso", "wet bar", "barra"],
      en: { name: "Bars & Coffee Stations", text: "Home and commercial bars, wine walls and coffee stations — with lighting, wine racks, refrigerators or built-in coffee machines." },
      es: { name: "Bares y estaciones de café", text: "Bares para casa o negocio, paredes de vino y estaciones de café — con iluminación, vineras, refrigeradores o cafeteras empotradas." },
      link: "/services/#bars",
    },
    {
      id: "garage",
      keys: ["garage", "garaje", "tools", "herramientas"],
      en: { name: "Garage Cabinets", text: "Sturdy garage cabinets in wood, metal or both — designed around posts and HVAC units, using wall space and high ceilings for tools and equipment." },
      es: { name: "Gabinetes de garaje", text: "Gabinetes resistentes para garaje en madera, metal o ambos — diseñados alrededor de columnas y equipos de aire, aprovechando paredes y techos altos." },
      link: "/services/#garages",
    },
    {
      id: "wallunits",
      keys: ["wall unit", "media wall", "tv", "television", "entertainment", "library", "biblioteca", "librero", "estanteria", "mueble de tv", "shelving", "repisa"],
      en: { name: "Wall Units & Interior Woodwork", text: "Media walls, built-in libraries and feature walls — open shelving, closed storage and display niches built to the room." },
      es: { name: "Wall units y carpintería interior", text: "Muebles de TV, bibliotecas empotradas y paredes decorativas — repisas abiertas, almacenamiento cerrado y nichos hechos a la medida." },
      link: "/services/#interior",
    },
    {
      id: "office",
      keys: ["office", "oficina", "desk", "escritorio", "study", "estudio"],
      en: { name: "Office Cabinets", text: "Custom desks, filing storage and shelving sized to your home office or business." },
      es: { name: "Muebles de oficina", text: "Escritorios, archivadores y repisas a la medida de tu oficina en casa o negocio." },
      link: "/services/#cabinetry",
    },
    {
      id: "furniture",
      keys: ["furniture", "mueble", "muebles", "table", "mesa", "chair", "silla", "bench", "banco", "restore", "restaurar", "remodel", "remodelar", "refinish"],
      en: { name: "Custom Furniture & Remodeling", text: "One-of-a-kind furniture built to your vision — plus wood remodeling and restoration to give new life to tables, chairs and older pieces." },
      es: { name: "Muebles a medida y restauración", text: "Muebles únicos hechos según tu idea — y remodelación o restauración de madera para darle nueva vida a mesas, sillas y piezas antiguas." },
      link: "/services/#furniture",
    },
    {
      id: "laundry",
      keys: ["laundry", "lavanderia", "mudroom", "lockers", "playroom", "game room", "juegos", "ninos"],
      en: { name: "Laundry, Mudroom & Playroom", text: "Laundry and mudroom cabinetry, lockers and benches, plus playroom and game-room storage for toys, books and games." },
      es: { name: "Lavandería, mudroom y cuarto de juegos", text: "Gabinetes para lavandería y mudroom, lockers y bancos, y almacenamiento para cuartos de juegos." },
      link: "/services/#cabinetry",
    },
  ];

  const TOPICS = [
    {
      id: "estimate",
      keys: ["estimate", "quote", "price", "pricing", "cost", "how much", "budget", "cotiz", "presupuesto", "precio", "cuanto", "costo", "vale", "estimado"],
      en: "Every project is custom, so pricing depends on size, materials and finishes. The estimate is free — send us your idea, measurements or photos on WhatsApp and we'll get back to you.",
      es: "Cada proyecto es a medida, así que el precio depende del tamaño, los materiales y los acabados. El estimado es gratis — envíanos tu idea, medidas o fotos por WhatsApp y te respondemos.",
      wa: { en: "Hi! I'd like a free estimate for a custom project.", es: "¡Hola! Quisiera un estimado gratis para un proyecto a medida." },
    },
    {
      id: "process",
      keys: ["process", "proceso", "how does it work", "como funciona", "steps", "pasos", "install", "instal", "timeline", "tiempo", "how long", "cuanto tarda", "demora"],
      en: "Our process: 1) Consultation & measurements · 2) Design, materials and finishes · 3) Our team builds it · 4) Installation on site · 5) Final details. Timing depends on the project — ask us on WhatsApp for yours.",
      es: "Nuestro proceso: 1) Consulta y medidas · 2) Diseño, materiales y acabados · 3) Fabricación · 4) Instalación en sitio · 5) Detalles finales. El tiempo depende del proyecto — pregúntanos por WhatsApp el tuyo.",
      wa: { en: "Hi! I'd like to know how the process and timing would work for my project.", es: "¡Hola! Quisiera saber cómo sería el proceso y el tiempo para mi proyecto." },
    },
    {
      id: "materials",
      keys: ["material", "wood", "madera", "mdf", "plywood", "laminate", "laminado", "oak", "roble", "walnut", "nogal", "stone", "piedra", "glass", "vidrio", "finish", "acabado", "color"],
      en: "We work with solid wood, plywood, MDF, laminates, metal, glass and stone — chosen for your budget, durability and maintenance, with a wide range of finishes, colors and hardware.",
      es: "Trabajamos con madera sólida, plywood, MDF, laminados, metal, vidrio y piedra — elegidos según tu presupuesto, durabilidad y mantenimiento, con muchos acabados, colores y herrajes.",
    },
    {
      id: "location",
      keys: ["where", "location", "address", "area", "donde", "ubicacion", "direccion", "zona", "florida", "miami", "broward", "fort lauderdale", "oakland", "visit", "visitar"],
      en: `We're at ${ADDRESS}, and we build and install projects across South Florida.`,
      es: `Estamos en ${ADDRESS} y fabricamos e instalamos proyectos en todo el sur de Florida.`,
    },
    {
      id: "contact",
      keys: ["contact", "contacto", "phone", "telefono", "call", "llamar", "email", "correo", "instagram", "whatsapp", "hablar", "talk", "human", "persona", "agent"],
      en: `You can reach our team on WhatsApp, call ${PHONE}, or email ${EMAIL}. We also share our latest projects on Instagram @eco_woodworkanddesign.`,
      es: `Puedes escribirnos por WhatsApp, llamar al ${PHONE} o enviar un correo a ${EMAIL}. También compartimos proyectos en Instagram @eco_woodworkanddesign.`,
    },
    {
      id: "about",
      keys: ["about", "experience", "experiencia", "years", "anos", "who are", "quienes", "company", "empresa", "trust", "confiar"],
      en: "Eco Woodwork & Design has over 35 years of woodworking experience building custom kitchens, closets and home and office furniture — designed, built and installed by our own team.",
      es: "Eco Woodwork & Design tiene más de 35 años de experiencia en carpintería, fabricando cocinas, closets y muebles para casa y oficina — diseñados, fabricados e instalados por nuestro propio equipo.",
    },
    {
      id: "services",
      keys: ["service", "servicio", "what do you", "que hacen", "que ofrecen", "offer", "ofrecen", "do you make", "hacen"],
      en: "We build: custom kitchens, closets & storage, bathroom vanities, bars & coffee stations, garage cabinets, wall units & libraries, office cabinets, laundry/mudroom/playroom storage, and custom furniture & restoration. Which one are you interested in?",
      es: "Hacemos: cocinas a medida, closets, vanities de baño, bares y estaciones de café, gabinetes de garaje, muebles de TV y bibliotecas, oficinas, lavandería/mudroom/cuarto de juegos, y muebles a medida y restauración. ¿Cuál te interesa?",
      chips: true,
    },
    {
      id: "greeting",
      keys: ["hello", "hi", "hey", "good morning", "good afternoon", "hola", "buenas", "buenos dias", "buenas tardes"],
      en: "Hi! How can I help you today? You can ask about our services, a free estimate, our process or how to reach us.",
      es: "¡Hola! ¿En qué te puedo ayudar? Puedes preguntarme por nuestros servicios, un estimado gratis, el proceso o cómo contactarnos.",
    },
    {
      id: "thanks",
      keys: ["thank", "thanks", "gracias", "perfect", "perfecto", "great", "genial", "ok"],
      en: "You're welcome! Whenever you're ready, our team is one tap away on WhatsApp.",
      es: "¡Con gusto! Cuando quieras, nuestro equipo está a un toque en WhatsApp.",
    },
  ];

  const UI = {
    en: {
      title: "EW Assistant",
      status: "Eco Woodwork & Design",
      hello: "Hi! I'm the Eco Woodwork & Design assistant. Ask me about our services, a free estimate or our process — or talk to our team on WhatsApp. ¿Prefieres español? Escríbeme en español.",
      placeholder: "Type your question…",
      send: "Send",
      wa: "Chat on WhatsApp",
      waAbout: (s) => `Ask about ${s} on WhatsApp`,
      waMsg: (s) => `Hi! I'm interested in ${s}. Could you give me more information?`,
      waGeneric: "Hi! I'd like information about your custom woodwork services.",
      more: "See details",
      fallback: "I'm a basic assistant, so I may not have that answer. Our team can help you directly on WhatsApp.",
      chips: [["services", "Services"], ["estimate", "Free estimate"], ["process", "Our process"], ["location", "Location"]],
      note: "Basic automated assistant · replies from our website info",
    },
    es: {
      title: "Asistente EW",
      status: "Eco Woodwork & Design",
      hello: "¡Hola! Soy el asistente de Eco Woodwork & Design. Pregúntame por servicios, un estimado gratis o el proceso — o habla con nuestro equipo por WhatsApp.",
      placeholder: "Escribe tu pregunta…",
      send: "Enviar",
      wa: "Escribir por WhatsApp",
      waAbout: (s) => `Consultar ${s} por WhatsApp`,
      waMsg: (s) => `¡Hola! Me interesa: ${s}. ¿Me pueden dar más información?`,
      waGeneric: "¡Hola! Quisiera información sobre sus servicios de carpintería a medida.",
      more: "Ver detalles",
      fallback: "Soy un asistente básico, así que puede que no tenga esa respuesta. Nuestro equipo te ayuda directamente por WhatsApp.",
      chips: [["services", "Servicios"], ["estimate", "Estimado gratis"], ["process", "Proceso"], ["location", "Ubicación"]],
      note: "Asistente automático básico · responde con la información del sitio",
    },
  };

  /* ---------- Helpers ---------- */
  const norm = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ\s-]/g, " ").replace(/\s+/g, " ").trim();

  const SPANISH_HINTS = /\b(hola|quiero|quisiera|cuanto|cuesta|precio|cocina|necesito|tienen|hacen|donde|como|gracias|buenas|para|mi|una|unos|puedo|cotizacion|presupuesto|closet de|bano|muebles?|servicios?|estimado|por favor)\b/;
  const detectLang = (raw) => (/[áéíóúñ¿¡]/i.test(raw) || SPANISH_HINTS.test(norm(raw)) ? "es" : "en");

  const hit = (text, key) => {
    if (key.includes(" ")) return text.includes(key);
    // Short keys must be whole words ("bar" ≠ "barato"); longer ones match as prefixes ("cotiz" → "cotizacion").
    if (key.length <= 3) return new RegExp(`(^|\\s)${key}(\\s|$)`).test(text);
    return new RegExp(`(^|\\s)${key}`).test(text);
  };

  const match = (raw) => {
    const text = ` ${norm(raw)} `;
    const service = SERVICES.find((s) => s.keys.some((k) => hit(text, k)));
    // Price/estimate or process questions about a specific service keep the service context.
    const topic = TOPICS.find((t) => t.keys.some((k) => hit(text, k)));
    return { service, topic };
  };

  /* ---------- DOM ---------- */
  const waIcon =
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74 2.07.9 2.49.72 2.94.67.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z"/></svg>';

  let lang = (document.documentElement.lang || "en").startsWith("es") ? "es" : "en";
  let lastService = null;

  const root = document.createElement("div");
  root.className = "ew-chat";
  root.innerHTML = `
    <button type="button" class="ew-fab" aria-expanded="false" aria-controls="ew-panel" aria-label="Open the Eco Woodwork assistant">
      <span class="ew-fab-mark" aria-hidden="true">EW</span>
      <span class="ew-fab-close" aria-hidden="true"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 2l10 10M12 2L2 12"/></svg></span>
      <span class="ew-fab-dot" aria-hidden="true"></span>
    </button>
    <section class="ew-panel" id="ew-panel" role="dialog" aria-modal="false" aria-labelledby="ew-title" hidden>
      <header class="ew-head">
        <span class="ew-avatar" aria-hidden="true">EW</span>
        <div class="ew-head-text"><strong id="ew-title"></strong><small class="ew-status"></small></div>
        <a class="ew-head-wa" target="_blank" rel="noopener noreferrer">${waIcon}<span class="sr-only"></span></a>
        <button type="button" class="ew-close" aria-label="Close assistant"><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 2l10 10M12 2L2 12"/></svg></button>
      </header>
      <div class="ew-log" role="log" aria-live="polite"></div>
      <div class="ew-chips"></div>
      <form class="ew-form" autocomplete="off">
        <label class="sr-only" for="ew-input">Message</label>
        <input id="ew-input" class="ew-input" type="text" maxlength="300" />
        <button type="submit" class="ew-send"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5"/></svg><span class="sr-only"></span></button>
      </form>
      <p class="ew-note"></p>
    </section>`;
  document.body.appendChild(root);

  const fab = root.querySelector(".ew-fab");
  const panel = root.querySelector(".ew-panel");
  const log = root.querySelector(".ew-log");
  const chipsEl = root.querySelector(".ew-chips");
  const form = root.querySelector(".ew-form");
  const input = root.querySelector(".ew-input");
  const headWa = root.querySelector(".ew-head-wa");

  const applyLang = () => {
    const t = UI[lang];
    root.querySelector("#ew-title").textContent = t.title;
    root.querySelector(".ew-status").textContent = t.status;
    root.querySelector(".ew-note").textContent = t.note;
    input.placeholder = t.placeholder;
    root.querySelector(".ew-send .sr-only").textContent = t.send;
    headWa.href = waLink(lastService ? t.waMsg(lastService[lang].name) : t.waGeneric);
    headWa.setAttribute("aria-label", `${t.wa} (opens in a new tab)`);
    headWa.querySelector(".sr-only").textContent = t.wa;
    renderChips();
  };

  const renderChips = (serviceChips = false) => {
    chipsEl.innerHTML = "";
    const items = serviceChips
      ? SERVICES.slice(0, 6).map((s) => [`svc:${s.id}`, s[lang].name])
      : UI[lang].chips;
    items.forEach(([id, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ew-chip";
      b.textContent = label;
      b.addEventListener("click", () => ask(label, id));
      chipsEl.appendChild(b);
    });
  };

  const scrollDown = () => {
    log.scrollTop = log.scrollHeight;
  };

  const addMsg = (who, text, actions = []) => {
    const row = document.createElement("div");
    row.className = `ew-msg ew-${who}`;
    const bubble = document.createElement("div");
    bubble.className = "ew-bubble";
    bubble.textContent = text;
    row.appendChild(bubble);
    if (actions.length) {
      const acts = document.createElement("div");
      acts.className = "ew-actions";
      actions.forEach((a) => {
        const el = document.createElement("a");
        el.className = a.primary ? "ew-action ew-action-wa" : "ew-action";
        el.href = a.href;
        if (a.external) {
          el.target = "_blank";
          el.rel = "noopener noreferrer";
        }
        el.innerHTML = (a.primary ? waIcon : "") + `<span></span>`;
        el.querySelector("span").textContent = a.label;
        acts.appendChild(el);
      });
      row.appendChild(acts);
    }
    log.appendChild(row);
    scrollDown();
  };

  const typing = () => {
    const row = document.createElement("div");
    row.className = "ew-msg ew-bot ew-typing";
    row.innerHTML = '<div class="ew-bubble"><i></i><i></i><i></i></div>';
    log.appendChild(row);
    scrollDown();
    return row;
  };

  const reply = (raw, forcedId) => {
    const t = UI[lang];
    let service = null;
    let topic = null;
    if (forcedId && forcedId.startsWith("svc:")) service = SERVICES.find((s) => "svc:" + s.id === forcedId);
    else if (forcedId) topic = TOPICS.find((x) => x.id === forcedId);
    else ({ service, topic } = match(raw));

    if (service) {
      lastService = service;
      const s = service[lang];
      let text = s.text;
      if (topic && (topic.id === "estimate" || topic.id === "process")) text += " " + topic[lang];
      addMsg("bot", text, [
        { primary: true, external: true, label: t.waAbout(s.name), href: waLink(t.waMsg(s.name)) },
        { label: t.more, href: service.link },
      ]);
      renderChips();
    } else if (topic) {
      const waText = topic.wa ? topic.wa[lang] : lastService ? t.waMsg(lastService[lang].name) : t.waGeneric;
      const actions = [{ primary: true, external: true, label: t.wa, href: waLink(waText) }];
      if (topic.id === "contact") actions.push({ label: "Instagram", href: IG, external: true });
      if (topic.id === "location") actions.push({ label: "Google Maps", href: `https://www.google.com/maps?q=${encodeURIComponent(ADDRESS)}`, external: true });
      addMsg("bot", topic[lang], topic.id === "greeting" || topic.id === "services" ? [] : actions);
      renderChips(!!topic.chips);
    } else {
      addMsg("bot", t.fallback, [{ primary: true, external: true, label: t.wa, href: waLink(t.waGeneric) }]);
      renderChips();
    }
    applyLang();
  };

  const ask = (text, forcedId) => {
    const clean = text.trim();
    if (!clean) return;
    if (!forcedId) {
      const detected = detectLang(clean);
      if (detected !== lang) {
        lang = detected;
        applyLang();
      }
    }
    addMsg("user", clean);
    const dots = typing();
    setTimeout(() => {
      dots.remove();
      reply(clean, forcedId);
    }, 450 + Math.min(600, clean.length * 12));
  };

  let greeted = false;
  const setOpen = (open) => {
    panel.hidden = !open;
    root.classList.toggle("is-open", open);
    fab.setAttribute("aria-expanded", String(open));
    fab.setAttribute("aria-label", open ? "Close the assistant" : "Open the Eco Woodwork assistant");
    if (open) {
      if (!greeted) {
        greeted = true;
        addMsg("bot", UI[lang].hello);
      }
      if (window.matchMedia("(min-width: 641px)").matches) input.focus();
    }
  };

  fab.addEventListener("click", () => setOpen(panel.hidden));
  root.querySelector(".ew-close").addEventListener("click", () => {
    setOpen(false);
    fab.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) {
      setOpen(false);
      fab.focus();
    }
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    ask(input.value);
    input.value = "";
  });

  /* ---------- Show the button only after the visitor scrolls ----------
     Home: once the scroll-driven hero video has played through.
     Other pages: after scrolling past ~60% of the first screen. */
  const heroScroll = document.querySelector("[data-hero-scroll]");
  const threshold = () => {
    if (heroScroll && !heroScroll.classList.contains("is-static")) {
      return heroScroll.offsetTop + heroScroll.offsetHeight - window.innerHeight * 1.2;
    }
    return window.innerHeight * 0.6;
  };
  let ticking = false;
  const updateVisibility = () => {
    ticking = false;
    const show = window.scrollY > threshold();
    if (show) root.classList.add("is-visible");
    else if (panel.hidden) root.classList.remove("is-visible");
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateVisibility);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", updateVisibility, { passive: true });

  applyLang();
  updateVisibility();
})();

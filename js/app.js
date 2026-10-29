(() => {
  const C = window.CATEGORIES, A = window.ARTICLES;
  const page = document.body.dataset.page;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = d => new Date(d).toLocaleDateString("en-JM", { month: "short", day: "numeric", year: "numeric" });
  const art = a => C[a.cat].g;
  const bg = a => `background:linear-gradient(135deg,${art(a)[0]},${art(a)[1]})`;
  const link = a => `article.html?id=${a.id}`;

  const card = a => `
    <article class="card">
      <a href="${link(a)}" class="thumb" style="${bg(a)}"><span class="tag">${C[a.cat].name}</span></a>
      <div class="card-body">
        <h3><a href="${link(a)}">${a.title}</a></h3>
        <p>${a.excerpt}</p>
        <div class="meta">${a.author} · ${fmt(a.date)} · ${a.read} min read</div>
      </div>
    </article>`;

  const nav = Object.entries(C).map(([k, v]) =>
    `<a href="${k}.html" class="${page === k ? "active" : ""}">${v.name}</a>`).join("");

  $("#site-header").innerHTML = `
    <div class="topbar"><div class="wrap"><span>${new Date().toLocaleDateString("en-JM", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span><span class="top-links"><a href="marketplace.html">Online Marketplace</a><a href="directory.html">Directory Listings</a><span>Kingston 29°C · Sunny</span></span></div></div>
    <div class="wrap masthead">
      <a href="index.html" class="logo"><span class="dot"></span>Island <em>Pulse</em></a>
      <button class="menu-btn" aria-label="Menu" aria-expanded="false">☰</button>
      <nav class="nav"><a href="index.html" class="${page === "home" ? "active" : ""}">Home</a>${nav}<a href="about.html" class="${page === "about" ? "active" : ""}">About</a></nav>
    </div>
    <div class="ticker"><span class="ticker-label">Breaking</span><div class="ticker-track"><div class="ticker-move">${[0, 1].map(() => `<span class="ticker-set">${[...A].sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id).slice(0, 8).map(a => `<a href="article.html?id=${a.id}">${a.title}</a>`).join("")}</span>`).join("")}</div></div></div>`;
  $(".menu-btn").onclick = e => {
    const open = $(".nav").classList.toggle("open");
    e.currentTarget.setAttribute("aria-expanded", open);
  };

  $("#site-footer").innerHTML = `
    <div class="wrap foot">
      <div><div class="logo"><span class="dot"></span>Island <em>Pulse</em></div><p>Independent news for Jamaica and the wider Caribbean.</p></div>
      <div><h4>Sections</h4>${Object.entries(C).map(([k, v]) => `<a href="${k}.html">${v.name}</a>`).join("")}</div>
      <div><h4>Company</h4><a href="about.html">About us</a><a href="about.html#contact">Contact</a></div>
    </div>
    <div class="copy">© ${new Date().getFullYear()} Island Pulse. One love, one Caribbean.</div>`;

  const sorted = [...A].sort((a, b) => b.date.localeCompare(a.date) || a.id - b.id);

  const sidebar = list => `
    <aside class="side">
      <h3 class="sec">Most Read</h3>
      <ol class="rank">${list.map(a => `<li><a href="${link(a)}">${a.title}</a><small>${C[a.cat].name}</small></li>`).join("")}</ol>
      <div class="newsletter"><h3>Daily briefing</h3><p>The day's top Caribbean stories in your inbox.</p>
        <form onsubmit="event.preventDefault();this.innerHTML='<p>Thanks for subscribing!</p>'"><input type="email" required placeholder="Email address" aria-label="Email"><button>Subscribe</button></form></div>
    </aside>`;
  const popular = [...A].sort((a, b) => b.read - a.read).slice(0, 5);

  if (page === "home") {
    const slides = sorted.slice(0, 5);
    $("#slider").innerHTML = `
      <div class="slides">${slides.map((a, i) => `
        <div class="slide ${i ? "" : "on"}" style="background:url(images/photos/${a.cat}.jpg) center/cover,url(images/${a.cat}.svg) center/cover,linear-gradient(135deg,${art(a)[0]},${art(a)[1]})">
          <div class="wrap"><span class="tag">${C[a.cat].name}</span><h2><a href="${link(a)}">${a.title}</a></h2>
          <p>${a.excerpt}</p><div class="meta">${a.author} · ${fmt(a.date)}</div></div>
        </div>`).join("")}</div>
      <button class="arrow prev" aria-label="Previous">‹</button><button class="arrow next" aria-label="Next">›</button>
      <div class="dots">${slides.map((_, i) => `<button aria-label="Slide ${i + 1}" class="${i ? "" : "on"}"></button>`).join("")}</div>`;
    const els = document.querySelectorAll(".slide"), dots = document.querySelectorAll(".dots button");
    let i = 0, t;
    const go = n => {
      els[i].classList.remove("on"); dots[i].classList.remove("on");
      i = (n + els.length) % els.length;
      els[i].classList.add("on"); dots[i].classList.add("on");
    };
    const start = () => { clearInterval(t); t = setInterval(() => go(i + 1), 6000); };
    $(".next").onclick = () => { go(i + 1); start(); };
    $(".prev").onclick = () => { go(i - 1); start(); };
    dots.forEach((d, n) => d.onclick = () => { go(n); start(); });
    $("#slider").onmouseenter = () => clearInterval(t);
    $("#slider").onmouseleave = start;
    start();

    $("#latest").innerHTML = sorted.slice(5, 11).map(card).join("");
    $("#sidebar").innerHTML = sidebar(popular);
    $("#sections").innerHTML = Object.entries(C).map(([k, v]) => `
      <a class="sec-tile" href="${k}.html" style="background:linear-gradient(to top,${v.g[1]}f2,${v.g[1]}55 60%,transparent),url(images/photos/${k}.jpg) center/cover,url(images/${k}.svg) center/cover,${v.g[0]}">
        <span class="sec-count">${A.filter(a => a.cat === k).length} stories</span>
        <div><h3>${v.name}</h3><p>${v.tagline}</p></div><span class="sec-go">\u2192</span>
      </a>`).join("");
  }

  if (C[page]) {
    document.title = `${C[page].name} News · Island Pulse`;
    const list = sorted.filter(a => a.cat === page);
    const [top, ...rest] = list;
    const side2 = list.slice(1, 3);
    $("#cat-hero").innerHTML = `
      <div class="wrap">
        <div class="hero-head"><h1>${C[page].name}</h1><p>${C[page].tagline}</p></div>
        <div class="hero-grid">
          <a class="hero-main" href="${link(top)}" style="${bg(top)}"><span class="tag">Top story</span><h2>${top.title}</h2><p>${top.excerpt}</p><div class="meta">${top.author} · ${fmt(top.date)}</div></a>
          <div class="hero-side">${side2.map(a => `<a href="${link(a)}" style="${bg(a)}"><h3>${a.title}</h3><div class="meta">${fmt(a.date)}</div></a>`).join("")}</div>
        </div>
      </div>`;
    $("#cat-hero").style.setProperty("--c1", C[page].g[0]);
    $("#list").innerHTML = rest.slice(2).map(card).join("") || "<p>More stories coming soon.</p>";
    $("#sidebar").innerHTML = sidebar(popular);
  }

  if (page === "marketplace") {
    const P = window.PRODUCTS;
    const cats = [...new Set(P.map(p => p.cat))].sort();
    let cat = "", cart = 0;
    const chips = () => $("#chips").innerHTML = ["", ...cats].map(c =>
      `<button class="chip ${c === cat ? "on" : ""}" data-c="${c}">${c || "All"}<small>${c ? P.filter(p => p.cat === c).length : P.length}</small></button>`).join("");
    const draw = () => {
      const q = $("#search").value.toLowerCase(), s = $("#sort").value;
      const rows = P.filter(p => (!cat || p.cat === cat) && (p.name + p.seller).toLowerCase().includes(q))
        .sort((a, b) => s === "low" ? a.price - b.price : s === "high" ? b.price - a.price : b.rating - a.rating);
      $("#count").textContent = `${rows.length} product${rows.length === 1 ? "" : "s"}`;
      $("#products").innerHTML = rows.map(p => `
        <article class="product">
          <div class="p-img" style="background:linear-gradient(135deg,${p.g[0]},${p.g[1]})"><span class="p-letter">${p.name[0]}</span>${p.badge ? `<span class="p-badge">${p.badge}</span>` : ""}</div>
          <div class="p-body"><div class="p-cat">${p.cat}</div><h3>${p.name}</h3>
            <div class="p-seller">${p.seller} \u00b7 ${p.from}</div>
            <div class="p-foot"><div><div class="price">US$${p.price}</div><div class="p-rate">\u2605 ${p.rating.toFixed(1)}</div></div><button class="btn add">Add to cart</button></div></div>
        </article>`).join("") || '<p class="empty">No products match your search.</p>';
    };
    $("#chips").onclick = e => { const b = e.target.closest(".chip"); if (!b) return; cat = b.dataset.c; chips(); draw(); };
    $("#products").onclick = e => { if (e.target.closest(".add")) { $("#cart-count").textContent = ++cart; e.target.textContent = "Added \u2713"; } };
    $("#search").oninput = draw; $("#sort").onchange = draw;
    chips(); draw();
  }

  if (page === "directory") {
    const L = window.LISTINGS;
    const types = [...new Set(L.map(l => l.type))].sort();
    const countries = [...new Set(L.map(l => l.country))].sort();
    let type = "";
    $("#country").innerHTML = `<option value="">All countries</option>` + countries.map(c => `<option>${c}</option>`).join("");
    const chips = () => $("#chips").innerHTML = ["", ...types].map(t =>
      `<button class="chip ${t === type ? "on" : ""}" data-t="${t}">${t || "All"}<small>${t ? L.filter(l => l.type === t).length : L.length}</small></button>`).join("");
    const initials = n => n.split(" ").slice(0, 2).map(w => w[0]).join("");
    const draw = () => {
      const c = $("#country").value, q = $("#search").value.toLowerCase();
      const rows = L.filter(l => (!type || l.type === type) && (!c || l.country === c) && (l.name + l.place + l.desc).toLowerCase().includes(q))
        .sort((a, b) => !!b.featured - !!a.featured || b.rating - a.rating);
      $("#count").textContent = `${rows.length} listing${rows.length === 1 ? "" : "s"}`;
      $("#listings").innerHTML = rows.map(l => `
        <article class="listing ${l.featured ? "featured" : ""}">
          <div class="l-top"><div class="avatar">${initials(l.name)}</div>
            <div><h3>${l.name}</h3><div class="l-type">${l.type}${l.featured ? ' <span class="badge">Featured</span>' : ""}</div></div>
            <div class="rating">★ ${l.rating.toFixed(1)}</div></div>
          <p class="l-desc">${l.desc}</p>
          <div class="l-loc">${l.place}, ${l.country}</div>
          <div class="l-actions"><a class="btn" href="tel:${l.phone.replace(/\s/g, "")}">Call ${l.phone}</a><a class="btn ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.name + " " + l.place)}" target="_blank" rel="noopener">Map</a></div>
        </article>`).join("") || '<p class="empty">No listings match your search.</p>';
    };
    $("#chips").onclick = e => { const b = e.target.closest(".chip"); if (!b) return; type = b.dataset.t; chips(); draw(); };
    $("#country").onchange = draw; $("#search").oninput = draw;
    chips(); draw();
  }

  if (page === "article") {
    const a = A.find(x => x.id === +new URLSearchParams(location.search).get("id")) || A[0];
    document.title = `${a.title} · Island Pulse`;
    $("#article").innerHTML = `
      <header class="art-head" style="${bg(a)}"><div class="wrap narrow"><a class="tag" href="${a.cat}.html">${C[a.cat].name}</a><h1>${a.title}</h1>
      <div class="meta">By ${a.author} · ${fmt(a.date)} · ${a.read} min read</div></div></header>
      <div class="wrap narrow body"><p class="lead">${a.excerpt}</p>${window.ARTICLE_BODY.map(p => `<p>${p}</p>`).join("")}</div>`;
    $("#related").innerHTML = sorted.filter(x => x.cat === a.cat && x.id !== a.id).slice(0, 3).map(card).join("");
  }
})();

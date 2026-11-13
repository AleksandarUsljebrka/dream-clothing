(() => {
  const { instagram, designs } = window.DREAM;
  const dmUrl = `https://ig.me/m/${instagram}`;
  const igUrl = `https://www.instagram.com/${instagram}/`;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const quoteOf = d => d.lines.join(' ');
  const src = (slug, n, w) => `img/${slug}-${n}-${w}.webp`;
  const srcset = (slug, n) => `${src(slug, n, 640)} 640w, ${src(slug, n, 1280)} 1280w`;

  // Sve fotografije u jednom nizu (za lookbook i lightbox)
  const photos = designs.flatMap(d =>
    Array.from({ length: d.photos }, (_, i) => ({ design: d, n: i + 1 }))
  );
  const alt = (d, n) => `Crna majica „${quoteOf(d)}", fotografija ${n}`;

  /* ---------- Linkovi ka Instagramu ---------- */
  $$('.js-ig').forEach(a => {
    a.href = a.closest('.header') ? dmUrl : igUrl;
  });
  $('.js-year').textContent = new Date().getFullYear();

  /* ---------- Traka sa porukama ---------- */
  const tapeItems = designs.map(d => `<span class="tape__item">${esc(quoteOf(d))}<span class="tape__x">✕</span></span>`).join('');
  $$('.js-tape').forEach(t => { t.innerHTML = tapeItems + tapeItems + tapeItems + tapeItems; });
  $$('.js-ig-dm').forEach(a => { a.href = dmUrl; });

  /* ---------- Hero: trag slika ---------- */
  (() => {
    const root = $('.js-trail');
    if (!root || document.documentElement.dataset.hero !== 'trail') return;
    const layer = $('.js-trail-imgs', root);

    // Po dve fotografije iz svakog dizajna, izmešane da se iste majice ne nižu jedna za drugom
    const picks = [];
    for (let n = 1; n <= 2; n++) designs.forEach(d => { if (n <= d.photos) picks.push(src(d.slug, n, 640)); });
    const imgs = picks.map(s => {
      const img = new Image();
      img.src = s; img.alt = ''; img.className = 'trail__img'; img.decoding = 'async';
      layer.appendChild(img);
      return img;
    });

    // Mirna verzija: par slika oko natpisa, bez kretanja
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      [[.2, .3, -6], [.8, .28, 5], [.3, .74, 4], [.72, .72, -4]].forEach(([x, y, r], i) => {
        const el = imgs[i * 3 % imgs.length];
        el.style.left = `calc(${x * 100}% - ${el.offsetWidth / 2 || 100}px)`;
        el.style.top = `calc(${y * 100}% - ${el.offsetHeight / 2 || 150}px)`;
        el.style.setProperty('--r', `${r}deg`);
        el.classList.add('still');
      });
      return;
    }

    let k = 0, z = 1, last = null, lastMove = 0, t = 0, raf = 0;
    const spawn = (x, y) => {
      const gap = Math.max(70, Math.min(130, root.clientWidth * 0.075));
      if (last && Math.hypot(x - last.x, y - last.y) < gap) return;
      last = { x, y };
      const el = imgs[k++ % imgs.length];
      const w = el.offsetWidth || 200, h = el.offsetHeight || 300;
      el.style.left = `${x - w / 2}px`;
      el.style.top = `${y - h / 2}px`;
      el.style.zIndex = String(++z);
      el.style.setProperty('--r', `${((Math.random() - 0.5) * 10).toFixed(1)}deg`);
      el.classList.remove('go');
      void el.offsetWidth; // restart animacije
      el.classList.add('go');
    };

    root.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      lastMove = performance.now();
      const r = root.getBoundingClientRect();
      spawn(e.clientX - r.left, e.clientY - r.top);
    });

    // Kad miš miruje (ili na telefonu), slike same idu po talasastoj putanji
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (performance.now() - lastMove < 1800) return;
      t += 0.012;
      const w = root.clientWidth, h = root.clientHeight;
      spawn(w * (0.5 + 0.36 * Math.sin(t * 1.3)), h * (0.5 + 0.3 * Math.sin(t * 2.1 + 0.6)));
    };

    // Animacija radi samo dok je hero na ekranu
    new IntersectionObserver(([en]) => {
      cancelAnimationFrame(raf);
      if (en.isIntersecting) raf = requestAnimationFrame(tick);
    }).observe(root);
  })();
  /* ---------- Kolekcija ---------- */
  const total = designs.length;
  $$('.js-designs').forEach(list => {
    const mood = list.dataset.mood;
    list.innerHTML = designs
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => d.mood === mood)
      .map(({ d, i }) => {
        const thumbs = d.photos > 1
          ? `<div class="thumbs" role="group" aria-label="Fotografije dizajna">${Array.from({ length: d.photos }, (_, k) => `
              <button type="button" class="thumb${k === 0 ? ' is-active' : ''}" data-n="${k + 1}" aria-label="Fotografija ${k + 1}">
                <img src="${src(d.slug, k + 1, 640)}" alt="" loading="lazy">
              </button>`).join('')}</div>`
          : '';
        return `
        <article class="design" data-slug="${d.slug}">
          <div class="design__text">
            <p class="design__num mono">${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
            <h3 class="design__quote display">${d.lines.map(l => `<span class="line"><span>${esc(l)}</span></span>`).join('')}</h3>
            <p class="design__meaning">${esc(d.meaning)}</p>
            <p class="design__meta mono">Crna majica — beli print — print on demand</p>
            <div class="design__actions">
              <a class="btn js-want" href="${dmUrl}" target="_blank" rel="noopener" data-quote="${esc(quoteOf(d))}">Naruči <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div class="design__media">
            <div class="viewer" data-n="1" role="button" tabindex="0" aria-label="Uvećaj fotografiju">
              ${d.photos > 1 ? `<span class="viewer__count mono"><span class="js-cur">1</span> / ${d.photos}</span>` : ''}
              <img src="${src(d.slug, 1, 1280)}" srcset="${srcset(d.slug, 1)}" sizes="(max-width: 760px) 100vw, 55vw" alt="${esc(alt(d, 1))}" loading="lazy">
            </div>
            ${thumbs}
          </div>
        </article>`;
      }).join('');
  });

  // Promena glavne slike klikom na thumbnail
  $$('.design').forEach(el => {
    const d = designs.find(x => x.slug === el.dataset.slug);
    const viewer = $('.viewer', el);
    const show = n => {
      if (+viewer.dataset.n === n) return;
      const old = $('img', viewer);
      const img = new Image();
      img.src = src(d.slug, n, 1280);
      img.srcset = srcset(d.slug, n);
      img.sizes = old.sizes;
      img.alt = alt(d, n);
      img.style.opacity = '0';
      const swap = () => {
        viewer.appendChild(img);
        requestAnimationFrame(() => { img.style.opacity = ''; old.classList.add('is-leaving'); });
        setTimeout(() => old.remove(), 650);
      };
      img.decode ? img.decode().then(swap, swap) : (img.onload = swap);
      viewer.dataset.n = n;
      const cur = $('.js-cur', viewer); if (cur) cur.textContent = n;
      $$('.thumb', el).forEach(t => t.classList.toggle('is-active', +t.dataset.n === n));
    };
    $$('.thumb', el).forEach(t => t.addEventListener('click', () => show(+t.dataset.n)));
    const open = () => openLightbox(photos.findIndex(p => p.design === d && p.n === +viewer.dataset.n));
    viewer.addEventListener('click', open);
    viewer.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });

  /* ---------- Toast + clipboard ---------- */
  const toast = $('.js-toast');
  let toastTimer;
  const say = msg => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3800);
  };
  const copy = async text => {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  };

  $$('.js-want').forEach(a => a.addEventListener('click', async () => {
    const ok = await copy(`Zdravo! Zanima me majica „${a.dataset.quote}". Veličina: `);
    if (ok) say('Poruka je kopirana — samo je nalepi u DM');
  }));

  /* ---------- Lookbook ---------- */
  const book = $('.js-lookbook');
  // Redosled u arhivi: dizajni naizmenično dan/noć, pa po jedna fotografija iz svakog,
  // da dve slike iste majice ne stoje jedna do druge
  const day = designs.filter(d => d.mood === 'day');
  const night = designs.filter(d => d.mood === 'night');
  const mixed = [];
  for (let i = 0; i < Math.max(day.length, night.length); i++) {
    if (day[i]) mixed.push(day[i]);
    if (night[i]) mixed.push(night[i]);
  }
  const order = [];
  const maxPhotos = Math.max(...designs.map(d => d.photos));
  for (let n = 1; n <= maxPhotos; n++) {
    mixed.forEach(d => {
      if (n <= d.photos) order.push(photos.findIndex(p => p.design === d && p.n === n));
    });
  }
  book.innerHTML = order.map((i, k) => {
    const p = photos[i];
    return `<button type="button" class="shot${k % 9 === 0 ? ' is-big' : ''}" data-i="${i}" data-mood="${p.design.mood}" aria-label="Uvećaj: ${esc(quoteOf(p.design))}">
      <img src="${src(p.design.slug, p.n, 640)}" srcset="${srcset(p.design.slug, p.n)}" sizes="(max-width: 760px) 50vw, 25vw" alt="${esc(alt(p.design, p.n))}" loading="lazy">
      <span class="shot__cap mono">${esc(quoteOf(p.design))}</span>
    </button>`;
  }).join('');
  $('.js-count-all').textContent = photos.length;
  $('.js-design-count').textContent = designs.length;

  book.addEventListener('click', e => {
    const s = e.target.closest('.shot');
    if (s) openLightbox(+s.dataset.i);
  });

  /* ---------- Lightbox ---------- */
  const lb = $('.js-lightbox');
  const lbImg = $('.js-lb-img');
  const lbCap = $('.js-lb-cap');
  let lbIndex = 0;
  // Strelice u pregledu idu redom kao slike u lookbooku
  function renderLb() {
    const p = photos[lbIndex];
    lbImg.src = src(p.design.slug, p.n, 1280);
    lbImg.alt = alt(p.design, p.n);
    lbCap.textContent = quoteOf(p.design);
  }
  function openLightbox(i) {
    lbIndex = i;
    renderLb();
    if (!lb.open) lb.showModal();
  }
  const step = dir => {
    const pos = order.indexOf(lbIndex);
    lbIndex = order[(pos + dir + order.length) % order.length];
    renderLb();
  };
  $('.js-lb-prev').addEventListener('click', () => step(-1));
  $('.js-lb-next').addEventListener('click', () => step(1));
  $('.js-lb-close').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb || e.target.tagName === 'FIGURE') lb.close(); });
  lb.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  /* ---------- Tvoja rečenica ---------- */
  const form = $('.js-line-form');
  const ta = $('#line');
  const count = $('.js-line-count');
  ta.addEventListener('input', () => { count.textContent = `${ta.value.length} / 60`; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const line = ta.value.trim();
    if (!line) { ta.focus(); say('Prvo upiši svoju rečenicu'); return; }
    // Kopiranje krece dok je stranica jos u fokusu, pa se odmah otvara DM (u okviru klika, da ga browser ne blokira)
    const copying = copy(`Predlog za novu Dream majicu: „${line}"`);
    const win = window.open(dmUrl, '_blank');
    if (win) win.opener = null;
    const ok = await copying;
    say(ok ? 'Kopirano — nalepi u Instagram poruku' : 'Otvori DM i pošalji nam svoju rečenicu');
  });

  /* ---------- Dan → Noć: boja pozadine prati sekciju ---------- */
  const themed = $$('[data-theme]').filter(el => el !== document.body);
  const themeObs = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) document.body.dataset.theme = en.target.dataset.theme; });
  }, { rootMargin: '-50% 0px -50% 0px' });
  themed.forEach(el => themeObs.observe(el));

  /* ---------- Reveal pri skrolovanju ---------- */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); revealObs.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('.reveal, .design').forEach(el => revealObs.observe(el));
})();

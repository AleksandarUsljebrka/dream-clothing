(() => {
  const { instagram, designs } = window.DREAM;
  // Svi Instagram linkovi vode na profil. Kratki DM link (ig.me) se na nekim mrežama uopšte ne otvara,
  // a instagram.com radi svuda i na telefonu otvara aplikaciju, odakle je jedan dodir do poruke.
  const igUrl = `https://www.instagram.com/${instagram}/`;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const quoteOf = d => d.lines.join(' ');
  const src = (slug, n, w) => `img/${slug}-${n}-${w}.webp`;
  const srcset = (slug, n) => `${src(slug, n, 640)} 640w, ${src(slug, n, 1280)} 1280w`;

  // Sve fotografije svih majica (kolekcija ih koristi za lightbox)
  const photos = designs.flatMap(d =>
    Array.from({ length: d.photos }, (_, i) => ({ design: d, n: i + 1 }))
  );
  const alt = (d, n) => `Crna majica „${quoteOf(d)}", fotografija ${n}`;

  /* ---------- Linkovi ka Instagramu ---------- */
  $$('.js-ig').forEach(a => {
    a.href = igUrl;
  });
  $('.js-year').textContent = new Date().getFullYear();

  /* ---------- Traka sa citatima ---------- */
  const tapeItems = designs.map(d => `<span class="tape__item">${esc(quoteOf(d))}<span class="tape__x">✕</span></span>`).join('');
  $$('.js-tape').forEach(t => { t.innerHTML = tapeItems + tapeItems + tapeItems + tapeItems; });
  $$('.js-ig-dm').forEach(a => { a.href = igUrl; });

  /* ---------- Hamburger meni (do 1024px) ---------- */
  (() => {
    const burger = $('.js-burger');
    const menu = $('.js-menu');
    if (!burger || !menu) return;
    const setMenu = open => {
      document.documentElement.classList.toggle('menu-open', open); // zaključa skrol stranice
      menu.classList.toggle('is-open', open);
      menu.inert = !open; // zatvoren meni ne može da dobije fokus ni klik
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    };
    burger.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      setMenu(open);
      if (open) $('a', menu).focus({ preventScroll: true });
    });
    // Klik na stavku zatvori meni, a link odvede na sekciju
    $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); }
    });
    // Ako se ekran raširi preko 1024px dok je meni otvoren, zatvori ga
    matchMedia('(min-width: 1025px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
  })();

  /* ---------- Hero: trag slika ---------- */
  (() => {
    const root = $('.js-trail');
    if (!root || document.documentElement.dataset.hero !== 'trail') return;
    const layer = $('.js-trail-imgs', root);

    // Po dve fotografije iz svakog dizajna, izmešane da se iste majice ne nižu jedna za drugom
    const picks = [];
    for (let n = 1; n <= 2; n++) designs.forEach(d => { if (n <= d.photos) picks.push(src(d.slug, n, 640)); });
    const imgs = picks.map((s, i) => {
      const img = new Image();
      // Prve 4 slike imaju prednost pri učitavanju, da trag krene odmah po otvaranju stranice
      if (i < 4) img.fetchPriority = 'high';
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

    // -Infinity: niko još nije pomerio miš i nijedna slika nije iskočila, pa trag kreće odmah
    let k = 0, z = 1, last = null, lastMove = -Infinity, lastSpawn = -Infinity, t = 0, raf = 0;
    const touch = matchMedia('(pointer: coarse)').matches;
    // 1,3 sekunde pauze posle otvaranja stranice: prvo se pojavi natpis DREAM, pa tek onda slike
    const autoStartAt = performance.now() + 1300;
    // Nova slika iskače tek kad se miš pomeri dovoljno daleko (gap)
    // i kad prođe dovoljno vremena od prethodne (minDelay), da ih ne bude previše odjednom
    const spawn = (x, y, minDelay) => {
      const now = performance.now();
      const gap = Math.max(touch ? 110 : 150, Math.min(280, root.clientWidth * 0.16));
      if (last && Math.hypot(x - last.x, y - last.y) < gap) return;
      if (now - lastSpawn < minDelay) return;
      // Sledeća slika koja je već učitana (prazan okvir nikad ne iskače)
      let el = null;
      for (let s = 0; s < imgs.length; s++) {
        const c = imgs[(k + s) % imgs.length];
        if (c.complete && c.naturalWidth) { el = c; k += s + 1; break; }
      }
      if (!el) return;
      last = { x, y };
      lastSpawn = now;
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
      spawn(e.clientX - r.left, e.clientY - r.top, 180);
    });

    // Kad miš miruje (ili na telefonu), slike same idu po talasastoj putanji
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (performance.now() < autoStartAt) return;
      if (performance.now() - lastMove < 2500) return;
      t += 0.006;
      const w = root.clientWidth, h = root.clientHeight;
      // Na telefonu (nema miša) slike se smenjuju malo češće
      spawn(w * (0.5 + 0.36 * Math.sin(t * 1.3)), h * (0.5 + 0.3 * Math.sin(t * 2.1 + 0.6)), touch ? 550 : 700);
    };

    // Animacija radi samo dok je hero na ekranu
    new IntersectionObserver(([en]) => {
      cancelAnimationFrame(raf);
      if (en.isIntersecting) raf = requestAnimationFrame(tick);
    }).observe(root);
  })();
  /* ---------- Kolekcija ---------- */
  $$('.js-designs').forEach(list => {
    const mood = list.dataset.mood;
    list.innerHTML = designs
      .filter(d => d.mood === mood)
      .map(d => {
        const nums = Array.from({ length: d.photos }, (_, k) => k + 1);
        const slides = nums.map(n => `
              <figure class="slide">
                <img src="${src(d.slug, n, 1280)}" srcset="${srcset(d.slug, n)}" sizes="(max-width: 760px) 86vw, 50vw" alt="${esc(alt(d, n))}" loading="lazy" draggable="false">
              </figure>`).join('');
        const ui = d.photos > 1 ? `
            <div class="slider__ui">
              <div class="slider__bars">${nums.map(n => `<button type="button" class="bar${n === 1 ? ' is-on' : ''}" aria-label="Fotografija ${n}"></button>`).join('')}</div>
              <div class="slider__arrows">
                <button type="button" class="slider__arrow js-prev" aria-label="Prethodna fotografija" disabled>←</button>
                <button type="button" class="slider__arrow js-next" aria-label="Sledeća fotografija">→</button>
              </div>
            </div>` : '';
        return `
        <article class="design" data-slug="${d.slug}">
          <div class="design__text">            <h3 class="design__quote display">${d.lines.map(l => `<span class="line"><span>${esc(l)}</span></span>`).join('')}</h3>
            <p class="design__meaning">${esc(d.meaning)}</p>
            <p class="design__meta mono"><span class="nb">Crna majica</span> - <span class="nb">beli print</span> - <span class="nb">štampa po porudžbini</span></p>
            <div class="design__actions">
              <a class="btn js-want" href="${igUrl}" target="_blank" rel="noopener" data-quote="${esc(quoteOf(d))}">Naruči <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div class="design__media">
            <div class="slider">
              <div class="slider__track" tabindex="0" role="region" aria-label="Fotografije: ${esc(quoteOf(d))}">${slides}
              </div>${ui}
            </div>
          </div>
        </article>`;
      }).join('');
  });

  /* Slajder: slike stoje u nizu sa scroll-snap-om.
     Telefon: prevlačenje prstom (radi sam browser). Računar: prevlačenje mišem, strelice, crtice, tastatura.
     Klik bez prevlačenja otvara sliku preko celog ekrana. */
  $$('.design').forEach(el => {
    const d = designs.find(x => x.slug === el.dataset.slug);
    const track = $('.slider__track', el);
    const slides = $$('.slide', track);
    const bars = $$('.bar', el);
    const prev = $('.js-prev', el), next = $('.js-next', el);
    const step = () => (slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth);
    const current = () => Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / step())));
    // instant: tastatura i isključene animacije pomeraju odmah, bez animacije
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const go = (i, instant = false) => track.scrollTo({
      left: Math.max(0, Math.min(slides.length - 1, i)) * step(),
      behavior: instant || reduce.matches ? 'instant' : 'smooth'
    });

    let shown = -1;
    const update = () => {
      const i = current();
      if (i === shown) return;
      shown = i;
      bars.forEach((b, k) => { b.classList.toggle('is-on', k <= i); b.setAttribute('aria-current', k === i ? 'true' : 'false'); });
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    };
    track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    if (prev) prev.addEventListener('click', () => go(current() - 1));
    if (next) next.addEventListener('click', () => go(current() + 1));
    bars.forEach((b, k) => b.addEventListener('click', () => go(k)));
    update();

    // Prevlačenje mišem (dodir i trackpad već rade sami)
    let drag = null, moved = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0 || slides.length < 2) return;
      drag = { x: e.clientX, left: track.scrollLeft, start: current(), t: performance.now() };
      moved = false;
    });
    window.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = drag.left - dx;
    });
    window.addEventListener('pointerup', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const { start, t } = drag;
      drag = null;
      if (!moved) return;
      track.classList.remove('is-dragging');
      // Prelazi na sledeću sliku ako je povučeno bar 60px ILI ako je potez bio brz (flick),
      // pa je dovoljan i kratak, brz pokret
      const velocity = Math.abs(dx) / Math.max(1, performance.now() - t);
      const flick = Math.abs(dx) > 60 || velocity > 0.11;
      go(flick ? start + (dx < 0 ? 1 : -1) : start);
    });

    const designPhotos = photos.filter(p => p.design === d);
    const open = () => openLightbox(designPhotos, current());
    track.addEventListener('click', () => { if (moved) { moved = false; return; } open(); });
    track.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); open(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(current() + 1, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(current() - 1, true); }
    });
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
    const ok = await copy(`Zdravo, zanima me majica „${a.dataset.quote}". Veličina: `);
    if (ok) say('Poruka je kopirana. Na Instagramu otvori poruku i nalepi je.');
  }));

  $('.js-design-count').textContent = designs.length;

  /* ---------- Galerija: dve trake ---------- */
  const bySlug = Object.fromEntries(designs.map(d => [d.slug, d]));
  // 12 fotografija galerije, redom: prvo gornji red, pa donji. Lightbox iz galerije ide samo kroz njih.
  const galleryPhotos = ['day', 'night'].flatMap(row =>
    window.DREAM.gallery[row].map(g => ({ ...g, design: bySlug[g.slug], row }))
  );

  // Širina kartice = visina reda × oblik. Po tome browser bira dovoljno veliku sliku (640 ili 1280).
  const arNum = ar => { const [w, h] = ar.split('/').map(Number); return w / h; };
  const card = (p, i, copy) => `
    <button type="button" class="gcard" style="--ar: ${p.ar}" data-i="${i}"${copy ? ' tabindex="-1"' : ''}
      aria-label="Otvori fotografiju: ${esc(quoteOf(p.design))}">
      <img src="${src(p.slug, p.n, 640)}" srcset="${srcset(p.slug, p.n)}"
        sizes="(max-width: 760px) calc(30vh * ${arNum(p.ar).toFixed(3)}), calc(38vh * ${arNum(p.ar).toFixed(3)})"
        alt="${copy ? '' : esc(alt(p.design, p.n))}" style="object-position: ${p.pos}" loading="lazy" draggable="false">
      <span class="gcard__cap mono">${esc(quoteOf(p.design))}</span>
    </button>`;

  $$('.js-gallery-row').forEach(row => {
    const items = galleryPhotos.map((p, i) => ({ p, i })).filter(({ p }) => p.row === row.dataset.row);
    const group = copy => `<div class="gallery__group"${copy ? ' aria-hidden="true"' : ''}>${items.map(({ p, i }) => card(p, i, copy)).join('')}</div>`;
    // Original + kopija: kopija služi samo da petlja nema šav, pa je skrivena od čitača ekrana i tastature
    row.innerHTML = `<div class="gallery__track">${group(false)}${group(true)}</div>`;

    // Miš preko reda: traka uspori na 25% brzine, postepeno (bez naglog zaustavljanja)
    const track = $('.gallery__track', row);
    let raf = 0;
    const easeTo = target => {
      const anim = track.getAnimations()[0];
      if (!anim) return; // nema animacije (dodir ili isključene animacije)
      cancelAnimationFrame(raf);
      const from = anim.playbackRate, t0 = performance.now(), dur = 600;
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3); // ease-out
        anim.updatePlaybackRate(from + (target - from) * eased);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    row.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') easeTo(0.25); });
    row.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') easeTo(1); });

    row.addEventListener('click', e => {
      const c = e.target.closest('.gcard');
      if (c) openLightbox(galleryPhotos, +c.dataset.i);
    });
  });

  /* ---------- Lightbox ----------
     openLightbox(lista, indeks): strelice idu samo kroz datu listu
     (galerija = njenih 12 fotografija, kolekcija = fotografije te majice) */
  const lb = $('.js-lightbox');
  const lbImg = $('.js-lb-img');
  const lbCap = $('.js-lb-cap');
  let lbList = [], lbIndex = 0;
  function renderLb() {
    const p = lbList[lbIndex];
    lbImg.src = src(p.design.slug, p.n, 1280);
    lbImg.alt = alt(p.design, p.n);
    lbCap.textContent = quoteOf(p.design);
  }
  function openLightbox(list, i) {
    lbList = list;
    lbIndex = i;
    renderLb();
    if (!lb.open) lb.showModal();
  }
  const step = dir => {
    lbIndex = (lbIndex + dir + lbList.length) % lbList.length;
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

  /* ---------- Tvoj citat ---------- */
  const form = $('.js-line-form');
  const ta = $('#line');
  const count = $('.js-line-count');
  ta.addEventListener('input', () => { count.textContent = `${ta.value.length} / 60`; });
  // Dva koraka: 1) kopiraj citat i reci to na sajtu, 2) korisnik sam otvori Instagram i nalepi ga.
  // Instagram ne dozvoljava da sajt unapred upiše tekst u poruku, pa nalepljivanje mora da uradi korisnik.
  const next = $('.js-line-next');
  const msg = $('.js-line-msg');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const line = ta.value.trim();
    if (!line) { ta.focus(); say('Prvo upiši svoj citat.'); return; }
    const text = `Predlog za novu Dream majicu: „${line}"`;
    const ok = await copy(text);
    if (ok) {
      msg.textContent = 'Kopirano. Otvori Instagram, klikni na poruku i nalepi citat.';
    } else {
      // Kopiranje nije dozvoljeno (stariji browser ili podešavanja): označi tekst da ga korisnik kopira sam
      ta.focus(); ta.select();
      msg.textContent = 'Nismo uspeli da kopiramo. Citat je označen, kopiraj ga pa otvori Instagram.';
    }
    next.hidden = false;
  });
  // Kad se citat promeni, drugi korak nestaje dok se ponovo ne kopira
  ta.addEventListener('input', () => { next.hidden = true; });

  /* ---------- Prelamanje srpskog teksta ----------
     Kratke reči (u, i, a, s, da, se, ti, na...) ne ostaju same na kraju reda:
     vežu se za sledeću reč nevidljivim razmakom (non-breaking space).
     Citati sa majica su na engleskom i ne diraju se. */
  (() => {
    const short = /(^|[\s(„])(a|i|o|u|s|k|da|se|ti|je|na|za|po|od|do|iz|sa|ne|ni|mi|ih|kad|što) (?=\S)/gi;
    const skip = '.design__quote, .tape, .gcard__cap, .trail__word, .footer__claim, textarea, script';
    $$('p, h1, h2, h3, summary, li, .chapter__desc').forEach(el => {
      if (el.closest(skip)) return;
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = tw.nextNode())) {
        if (n.parentElement.closest(skip)) continue;
        // dva prolaza, za nizove kratkih reči („i ne skreći")
        n.data = n.data.replace(short, '$1$2 ').replace(short, '$1$2 ');
      }
    });
    // Poslednje dve reči pasusa idu zajedno, da jedna reč nikad ne ostane sama u poslednjem redu
    $$('p, summary, h2.serif').forEach(el => {
      if (el.closest(skip)) return;
      const texts = [];
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = tw.nextNode())) if (n.data.trim()) texts.push(n);
      const last = texts[texts.length - 1];
      if (!last) return;
      const trimmed = last.data.replace(/\s+$/, '');
      const i = trimmed.lastIndexOf(' ');
      if (i > 0 && trimmed.length - i < 18) last.data = trimmed.slice(0, i) + ' ' + trimmed.slice(i + 1) + last.data.slice(trimmed.length);
    });
  })();

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

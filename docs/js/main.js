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

  /* ---------- Hero: citat na leđima ----------
     Skrol kroz sekciju (3 ekrana) daje napredak p od 0 do 1:
     - p:  okvir slike raste od uokvirene fotografije do celog ekrana, tekst nestaje
     - p2: (od 25% skrola) zum na print, najviše 1,6x (1,35x na telefonu), da slika ostane oštra
     - p3: (od 78% skrola) zatamnjenje odozdo i citat sa majice */
  (() => {
    const root = $('.js-back');
    if (!root) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; // CSS prikazuje mirnu verziju
    const stage = root.firstElementChild;
    const frame = $('.js-back-frame', root), img = $('.js-back-img', root), shade = $('.js-back-shade', root);
    const copy = $('.js-back-copy', root), badge = $('.js-back-badge', root);
    const end = $('.js-back-end', root), hint = $('.js-back-hint', root);
    // ISTI UPIT kao u style.css (hero preko celog ekrana): uski ekrani, tablet uspravno, niski ekrani
    const mobile = matchMedia('(max-width: 760px), (max-width: 1024px) and (orientation: portrait), (max-height: 560px)');
    const clamp = v => Math.max(0, Math.min(1, v));
    let start = null, raf = 0;

    // Početni položaj okvira čita se iz CSS-a (posle svake promene veličine prozora)
    const measure = () => {
      ['top', 'right', 'bottom', 'width', 'height', 'borderRadius'].forEach(k => { frame.style[k] = ''; });
      const s = stage.getBoundingClientRect(), f = frame.getBoundingClientRect();
      start = { top: f.top - s.top, right: s.right - f.right, bottom: s.bottom - f.bottom, width: f.width, radius: mobile.matches ? 0 : 6 };
      update();
    };

    const update = () => {
      raf = 0;
      const total = root.offsetHeight - stage.offsetHeight;
      const p = total > 0 ? clamp(-root.getBoundingClientRect().top / total) : 0;
      const p2 = clamp((p - 0.25) / 0.75);
      const p3 = clamp((p - 0.78) / 0.2);
      const k = 1 - p;
      frame.style.height = 'auto'; // visinu određuju top i bottom
      frame.style.top = `${start.top * k}px`;
      frame.style.right = `${start.right * k}px`;
      frame.style.bottom = `${start.bottom * k}px`;
      frame.style.width = `${start.width + (stage.clientWidth - start.width) * p}px`;
      frame.style.borderRadius = `${start.radius * k}px`;
      const maxZoom = mobile.matches ? 1.35 : 1.6;
      img.style.transform = `scale(${(1.02 + (maxZoom - 1.02) * p2).toFixed(4)})`;
      shade.style.opacity = mobile.matches ? (0.85 + 0.15 * p3).toFixed(3) : p3.toFixed(3);
      copy.style.opacity = Math.max(0, 1 - p * 2.4).toFixed(3);
      copy.style.transform = `translateY(${(-90 * p).toFixed(1)}px)`;
      copy.style.pointerEvents = p > 0.35 ? 'none' : '';
      badge.style.opacity = Math.max(0, 1 - p * 3).toFixed(3);
      end.style.opacity = p3.toFixed(3);
      end.style.transform = `translateY(${((1 - p3) * 40).toFixed(1)}px)`;
      end.style.pointerEvents = p3 > 0.5 ? 'auto' : 'none';
      hint.style.opacity = Math.max(0, 1 - p * 5).toFixed(3);
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measure);
    mobile.addEventListener('change', measure);
    measure();
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
    const skip = '.design__quote, .tape, .gcard__cap, .footer__claim, textarea, script';
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

/* Fairline demo — спільна логіка вітрини. Без фреймворків і збірки. */
(function () {
  'use strict';
  const FL = window.FL;

  /* ---------- утиліти ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Єдиний формат ціни: «4 540 ₴» — цілі гривні, вузький нерозривний пробіл.
  FL.price = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₴';

  FL.byId = (id) => FL.products.find((p) => p.id === Number(id));
  FL.cat = (id) => FL.categories.find((c) => c.id === id);

  FL.totalStock = (p) => (p.sizes ? Object.values(p.sizes).reduce((a, b) => a + b, 0) : p.stock || 0);
  FL.stockState = (p) => {
    const n = FL.totalStock(p);
    if (n > 3) return { cls: 'in', text: 'В наявності' };
    if (n > 0) return { cls: 'in', text: 'Закінчується' };
    if (p.expected) return { cls: 'wait', text: 'Очікується' };
    return { cls: 'out', text: 'Немає в наявності' };
  };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* приватний режим */ } },
  };
  let memCart = store.get('fl-cart', []);
  FL.cart = {
    items: () => memCart,
    count: () => memCart.reduce((a, i) => a + i.qty, 0),
    add(id, size, qty) {
      const hit = memCart.find((i) => i.id === id && i.size === size);
      if (hit) hit.qty += qty; else memCart.push({ id, size, qty });
      store.set('fl-cart', memCart);
      renderCartCount();
    },
  };

  FL.toast = (msg) => {
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  /* ---------- ілюстрації товарів (замість фото в демо) ---------- */
  const ICON = {
    tents: '<path d="M10 82 L50 18 L90 82 Z"/><path d="M50 18 L50 82"/><path d="M40 82 L50 56 L60 82"/><path d="M4 82 H96"/>',
    sleeping: '<rect x="22" y="10" width="56" height="80" rx="26"/><path d="M30 30 Q50 20 70 30"/><path d="M50 30 V84"/>',
    backpacks: '<rect x="24" y="22" width="52" height="66" rx="12"/><path d="M38 22 V14 Q50 6 62 14 V22"/><rect x="34" y="52" width="32" height="22" rx="4"/><path d="M24 40 H76"/>',
    lights: '<rect x="40" y="38" width="20" height="52" rx="5"/><path d="M34 38 H66 L62 22 H38 Z"/><path d="M50 4 V12 M30 10 L36 18 M70 10 L64 18"/>',
    cookware: '<rect x="30" y="18" width="40" height="70" rx="10"/><rect x="34" y="8" width="32" height="12" rx="4"/><path d="M30 36 H70"/>',
    jackets: '<path d="M36 12 L50 20 L64 12 L84 24 L80 50 L72 48 L72 90 H28 L28 48 L20 50 L16 24 Z"/><path d="M50 20 V90"/>',
  };
  FL.art = (cat, variant = 0) => {
    const rot = [0, -8, 8][variant % 3];
    return `<svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#1f4a38" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"><g transform="rotate(${rot} 50 50)">${ICON[cat] || ICON.tents}</g></svg>`;
  };

  /* ---------- шапка й підвал ---------- */
  function renderCartCount() {
    const el = $('#cart-count');
    if (!el) return;
    const n = FL.cart.count();
    // Порожній лічильник не показуємо — жодного «0» на вітрині.
    el.hidden = n === 0;
    el.textContent = n;
  }

  function renderChrome() {
    const page = document.body.dataset.page;
    const header = $('#site-header');
    if (header) {
      const q = new URLSearchParams(location.search).get('q') || '';
      header.innerHTML = `
        <div class="demo-note"><div class="wrap">Демо-прототип оновленого Fairline. Товари, бренди й ціни вигадані — показуємо логіку, а не асортимент.</div></div>
        <div class="topbar"><div class="wrap">
          <span>Кривий Ріг · доставка по Україні</span>
          <span class="topbar__extra"><a href="tel:+380000000000">+38 (000) 000-00-00</a></span>
        </div></div>
        <header class="header">
          <div class="wrap header__row">
            <a class="logo" href="index.html" aria-label="Fairline — на головну">
              <span class="logo__marks"><i class="mark mark--red"></i><i class="mark mark--blue"></i><i class="mark mark--green"></i></span>
              <span class="logo__text">Fairline</span>
            </a>
            <form class="search" role="search" action="catalog.html">
              <label class="vh" for="q">Пошук</label>
              <input id="q" name="q" type="search" value="${esc(q)}" placeholder="Назва, бренд або артикул" autocomplete="off">
              <button type="submit">Знайти</button>
            </form>
            <a class="cart-link" href="#" id="cart-link"><span>Кошик</span>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 4h2l2.4 11h11.2L21 8H7"/><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/></svg>
              <span class="cart-link__count" id="cart-count" hidden></span>
            </a>
            ${page === 'admin' ? '' : '<a class="btn btn--ghost" href="admin.html" style="height:40px;padding:0 14px">Адмінка</a>'}
          </div>
          <nav class="nav" aria-label="Розділи каталогу"><div class="wrap"><ul>
            ${FL.topSections.map((s, i) => `<li><a href="catalog.html${i === 0 ? '?sale=1' : ''}" class="${i === 0 ? 'is-sale' : ''}">${s}</a></li>`).join('')}
          </ul></div></nav>
        </header>`;
      $('#cart-link').addEventListener('click', (e) => {
        e.preventDefault();
        const n = FL.cart.count();
        FL.toast(n ? `У кошику ${n} шт. — оформлення в демо вимкнено` : 'Кошик порожній');
      });
      renderCartCount();
    }
    const footer = $('#site-footer');
    if (footer) {
      footer.innerHTML = `
        <footer class="footer"><div class="wrap">
          <div><b>Fairline</b>Спорядження для туризму, спорту, саду й дому.</div>
          <div><b>Покупцям</b><a href="#">Доставка і оплата</a><br><a href="#">Обмін і повернення</a><br><a href="catalog.html?sale=1">Акції</a></div>
          <div><b>Контакти</b>Кривий Ріг<br><a href="#">Instagram</a></div>
        </div></footer>`;
    }
  }

  /* ---------- картка товару в лістингу ---------- */
  FL.card = (p, opts = {}) => {
    const st = FL.stockState(p);
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    return `
      <a class="card" href="product.html?id=${p.id}">
        ${off ? `<span class="discount">−${off}%</span>` : ''}
        ${opts.pinned ? '<span class="card__pin mark mark--yellow" title="Закріплено в добірці"></span>' : ''}
        <div class="card__img">${FL.art(p.cat)}</div>
        <div class="card__body">
          <span class="card__brand">${esc(p.brand)}</span>
          <span class="card__name">${esc(p.name)}</span>
          <div class="card__foot">
            <span><span class="price ${off ? 'price--sale' : ''}">${FL.price(p.price)}</span>${off ? `<span class="price-old">${FL.price(p.old)}</span>` : ''}</span>
            <span class="stock stock--${st.cls}">${st.text}</span>
          </div>
        </div>
      </a>`;
  };

  /* ---------- модуль рекомендацій ---------- */
  const md = (d) => (d.getMonth() + 1) * 100 + d.getDate();
  const parseMD = (s) => { const [m, d] = s.split('-').map(Number); return m * 100 + d; };
  FL.isActive = (c, today = new Date()) => {
    const t = md(today), a = parseMD(c.from), b = parseMD(c.to);
    return a <= b ? t >= a && t <= b : t >= a || t <= b; // діапазон через Новий рік
  };
  FL.recommend = (c, today = new Date()) => {
    const ok = (p) => FL.totalStock(p) > 0 && p.price > 0 && !p.excluded; // лише в наявності, з ціною
    const pinned = c.pinned.map(FL.byId).filter((p) => p && ok(p));
    const seed = today.getFullYear() * 1000 + md(today);
    const pool = FL.products
      .filter((p) => ok(p) && p.tags.includes(c.tag) && !pinned.includes(p))
      .map((p) => ({ p, k: ((p.id * 9301 + seed * 49297) % 233280) / 233280 })) // щоденна ротація незакріпленої частини
      .sort((a, b) => a.k - b.k)
      .map((x) => x.p);
    return { pinned, items: [...pinned, ...pool].slice(0, c.count) };
  };

  /* ---------- сторінки ---------- */
  const pages = {};

  pages.home = () => {
    const active = FL.collections.filter((c) => FL.isActive(c));
    const [hero, ...rest] = active.length ? active : FL.collections;
    const r = FL.recommend(hero);
    $('#season').innerHTML = `
      <div class="wrap season__inner">
        <div class="season__head">
          <h1>${esc(hero.title)}</h1>
          <p>Добірка оновлюється сама: товари без залишку зникають після кожної синхронізації з постачальниками, а сезон змінюється за календарем.</p>
          <span class="season__note">Жовта позначка — товар, закріплений менеджером.</span>
          <a class="btn btn--ghost" style="background:#fff;border-color:#fff;align-self:start" href="catalog.html?cat=tents">До каталогу</a>
        </div>
        <div class="grid">${r.items.map((p) => FL.card(p, { pinned: r.pinned.includes(p) })).join('')}</div>
      </div>`;

    $('#cats').innerHTML = FL.categories.map((c) => {
      const n = FL.products.filter((p) => p.cat === c.id).length;
      return `<a class="cat-tile" href="catalog.html?cat=${c.id}"><i class="mark mark--${c.mark}"></i><span>${c.name}<small>${n} товарів</small></span></a>`;
    }).join('');

    $('#collections').innerHTML = rest.map((c) => {
      const items = FL.recommend(c).items;
      if (!items.length) return '';
      return `<section class="section"><div class="section__head"><h2>${esc(c.title)}</h2></div><div class="grid">${items.map((p) => FL.card(p)).join('')}</div></section>`;
    }).join('');
  };

  pages.catalog = () => {
    const params = new URLSearchParams(location.search);
    const q = (params.get('q') || '').trim().toLowerCase();
    const sale = params.get('sale') === '1';
    const catId = !q && !sale ? (params.get('cat') || 'tents') : null;
    const cat = catId ? FL.cat(catId) : null;

    let base = FL.products;
    if (cat) base = base.filter((p) => p.cat === cat.id);
    if (sale) base = base.filter((p) => p.old && p.old > p.price && FL.totalStock(p) > 0); // лише реальні активні знижки
    if (q) {
      const norm = (s) => s.toLowerCase().replace(/[\s\-–]/g, '');
      const nq = norm(q);
      base = base.filter((p) => [p.name, p.brand, p.sku].some((f) => norm(f).includes(nq)));
    }

    const groups = cat ? cat.filters : ['brand', 'price'];
    const state = {}; // група -> Set значень
    groups.forEach((g) => { state[g] = new Set(); });
    let pmin = null, pmax = null;

    const valuesOf = (p, g) => {
      if (g === 'brand') return [p.brand];
      if (g === 'size') return p.sizes ? Object.keys(p.sizes).filter((s) => p.sizes[s] > 0) : [];
      return p.attrs[g] ? [p.attrs[g]] : [];
    };
    const passes = (p, skip) => {
      for (const g of groups) {
        if (g === 'price' || g === skip || !state[g].size) continue;
        if (!valuesOf(p, g).some((v) => state[g].has(v))) return false; // OR усередині групи
      }
      if (skip !== 'price') {
        if (pmin != null && p.price < pmin) return false;
        if (pmax != null && p.price > pmax) return false;
      }
      return true; // AND між групами
    };

    // Шапка
    const title = cat ? cat.name : sale ? 'Акції' : `Пошук: «${params.get('q')}»`;
    $('#crumbs').innerHTML = `<a href="index.html">Головна</a><span>/</span>${cat ? `<span>${esc(cat.parent)}</span><span>/</span>` : ''}<span>${esc(title)}</span>`;
    $('#cat-head').innerHTML = `<div class="cat-title">${cat ? `<i class="mark mark--${cat.mark}"></i>` : ''}<h1>${esc(title)}</h1></div>`;
    if (cat) {
      const siblings = FL.categories.filter((c) => c.parent === cat.parent);
      $('#subcats').innerHTML = siblings.map((c) => `<a href="catalog.html?cat=${c.id}" ${c.id === cat.id ? 'aria-current="page"' : ''}><i class="mark mark--${c.mark}"></i>${c.name}</a>`).join('');
    }
    document.title = `${title} — Fairline`;

    const filtersEl = $('#filters');
    const listEl = $('#list');

    function renderFilters() {
      const html = groups.map((g) => {
        if (g === 'price') {
          return `<details class="fgroup" open><summary>Ціна, ₴</summary>
            <div class="prange"><label class="vh" for="pmin">від</label><input id="pmin" inputmode="numeric" placeholder="від" value="${pmin ?? ''}">
            <label class="vh" for="pmax">до</label><input id="pmax" inputmode="numeric" placeholder="до" value="${pmax ?? ''}"></div></details>`;
        }
        const counts = new Map();
        base.filter((p) => passes(p, g)).forEach((p) => valuesOf(p, g).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1)));
        state[g].forEach((v) => { if (!counts.has(v)) counts.set(v, 0); });
        const opts = [...counts.entries()]
          .filter(([v, n]) => n > 0 || state[g].has(v)) // значення з 0 товарів не показуємо
          .sort((a, b) => g === 'size' ? SIZES.indexOf(a[0]) - SIZES.indexOf(b[0]) : a[0].localeCompare(b[0], 'uk', { numeric: true }));
        if (!opts.length) return '';
        return `<details class="fgroup" open><summary>${FL.filterLabels[g]}</summary><ul>
          ${opts.map(([v, n]) => `<li><label class="fopt"><input type="checkbox" data-g="${g}" value="${esc(v)}" ${state[g].has(v) ? 'checked' : ''}><span>${esc(v)}</span><span class="n">${n}</span></label></li>`).join('')}
        </ul></details>`;
      }).join('');
      filtersEl.innerHTML = `
        <div class="filters__head"><h3>Фільтри</h3><button class="linkbtn" id="reset">Скинути все</button>
          <button class="linkbtn filters__close" id="fclose">Закрити</button></div>
        ${html}
        <div class="filters__apply"><button class="btn" id="fapply">Показати ${countResults()} ${plural(countResults())}</button></div>`;
    }

    function countResults() { return base.filter((p) => passes(p)).length; }

    function renderList() {
      const sort = $('#sort').value;
      let items = base.filter((p) => passes(p));
      const inStock = (p) => (FL.totalStock(p) > 0 ? 0 : 1);
      items.sort((a, b) => inStock(a) - inStock(b) || (sort === 'cheap' ? a.price - b.price : sort === 'dear' ? b.price - a.price : 0));
      $('#found').textContent = `${items.length} ${plural(items.length)}`;
      listEl.innerHTML = items.length
        ? `<div class="grid">${items.map((p) => FL.card(p)).join('')}</div>`
        : `<div class="empty"><p>За цими фільтрами товарів немає. Приберіть один із фільтрів або скиньте всі.</p><button class="btn btn--ghost" id="reset2">Скинути фільтри</button></div>`;
      const chips = [];
      groups.forEach((g) => state[g].forEach((v) => chips.push(`<button class="chip" data-g="${g}" data-v="${esc(v)}" aria-label="Прибрати фільтр ${esc(v)}">${esc(v)}</button>`)));
      if (pmin != null || pmax != null) chips.push(`<button class="chip" data-g="price">${pmin ?? 0}–${pmax ?? '∞'} ₴</button>`);
      $('#chips').innerHTML = chips.join('');
      // Стан фільтрів у URL — щоб посиланням можна було поділитися; такі URL закриваються від індексації (noindex).
      const qs = new URLSearchParams(location.search);
      groups.forEach((g) => { if (g !== 'price') { qs.delete(g); if (state[g].size) qs.set(g, [...state[g]].join('|')); } });
      history.replaceState(null, '', '?' + qs.toString());
    }

    function update() { renderFilters(); renderList(); }
    function resetAll() { groups.forEach((g) => state[g].clear()); pmin = pmax = null; update(); }

    // Стан з URL
    groups.forEach((g) => { const v = params.get(g); if (v && g !== 'price') v.split('|').forEach((x) => state[g].add(x)); });

    filtersEl.addEventListener('change', (e) => {
      const t = e.target;
      if (t.dataset.g) { t.checked ? state[t.dataset.g].add(t.value) : state[t.dataset.g].delete(t.value); update(); }
      if (t.id === 'pmin' || t.id === 'pmax') {
        const v = parseInt(t.value.replace(/\D/g, ''), 10);
        if (t.id === 'pmin') pmin = Number.isFinite(v) ? v : null; else pmax = Number.isFinite(v) ? v : null;
        update();
      }
    });
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (t.id === 'reset' || t.id === 'reset2') resetAll();
      if (t.classList.contains('chip')) {
        if (t.dataset.g === 'price') { pmin = pmax = null; } else state[t.dataset.g].delete(t.dataset.v);
        update();
      }
      if (t.id === 'fopen') openDrawer(true);
      if (t.id === 'fclose' || t.id === 'fapply' || t.classList.contains('scrim')) openDrawer(false);
    });
    $('#sort').addEventListener('change', renderList);

    function openDrawer(on) {
      filtersEl.classList.toggle('is-open', on);
      $('.scrim')?.remove();
      if (on) { const s = document.createElement('div'); s.className = 'scrim'; document.body.appendChild(s); filtersEl.querySelector('input,button')?.focus(); }
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openDrawer(false); });

    update();
  };

  const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const plural = (n) => {
    const a = n % 10, b = n % 100;
    if (a === 1 && b !== 11) return 'товар';
    if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return 'товари';
    return 'товарів';
  };

  pages.product = () => {
    const p = FL.byId(new URLSearchParams(location.search).get('id')) || FL.products[0];
    const cat = FL.cat(p.cat);
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    document.title = `${p.name} — Fairline`;
    $('#crumbs').innerHTML = `<a href="index.html">Головна</a><span>/</span><span>${esc(cat.parent)}</span><span>/</span><a href="catalog.html?cat=${cat.id}">${esc(cat.name)}</a>`;

    let size = null;
    const sizes = p.sizes ? Object.entries(p.sizes) : null;

    $('#product').innerHTML = `
      <div class="gallery">
        <div class="gallery__main" id="gmain">${FL.art(p.cat, 0)}</div>
        <div class="thumbs">${[0, 1, 2].map((i) => `<button aria-label="Фото ${i + 1}" aria-pressed="${i === 0}" data-i="${i}">${FL.art(p.cat, i)}</button>`).join('')}</div>
      </div>
      <div class="buy">
        <div>
          <span class="card__brand">${esc(p.brand)}</span>
          <h1>${esc(p.name)}</h1>
        </div>
        <div class="buy__meta"><span>Артикул: ${esc(p.sku)}</span><span class="stock stock--${FL.stockState(p).cls}" id="pstock">${FL.stockState(p).text}</span></div>
        <div class="buy__price">
          <span class="price ${off ? 'price--sale' : ''}">${FL.price(p.price)}</span>
          ${off ? `<span class="price-old">${FL.price(p.old)}</span><span class="save">−${off}% · економія ${FL.price(p.old - p.price)}</span>` : ''}
        </div>
        ${sizes ? `
          <div>
            <p class="hint" id="size-hint">Оберіть розмір. Закреслені — немає в наявності.</p>
            <div class="sizes" role="group" aria-label="Розмір">
              ${sizes.map(([s, n]) => `<button class="size" data-s="${s}" aria-pressed="false" ${n ? '' : 'disabled'} title="${n ? `В наявності: ${n} шт.` : 'Немає в наявності'}">${s}</button>`).join('')}
            </div>
          </div>` : ''}
        <div class="qty-row">
          <div class="qty"><button type="button" data-d="-1" aria-label="Менше">−</button><input id="qty" value="1" inputmode="numeric" aria-label="Кількість"><button type="button" data-d="1" aria-label="Більше">+</button></div>
          <button class="btn" id="add" ${FL.totalStock(p) ? '' : 'disabled'}>${FL.totalStock(p) ? 'Додати в кошик' : 'Немає в наявності'}</button>
        </div>
        <div class="panel desc"><h3>Опис</h3><p>${esc(p.desc)}</p></div>
        <div class="panel"><h3 style="margin-bottom:6px">Характеристики</h3>
          <table class="specs"><tbody>
            ${Object.entries(p.specs).map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
            ${Object.entries(p.attrs).filter(([k]) => FL.filterLabels[k] && !p.specs[FL.filterLabels[k]]).map(([k, v]) => `<tr><th scope="row">${FL.filterLabels[k]}</th><td>${esc(v)}</td></tr>`).join('')}
          </tbody></table>
        </div>
      </div>`;

    $('.thumbs').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      $$('.thumbs button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      $('#gmain').innerHTML = FL.art(p.cat, Number(b.dataset.i));
    });
    $('.qty').addEventListener('click', (e) => {
      const d = Number(e.target.dataset.d); if (!d) return;
      const i = $('#qty'); i.value = Math.max(1, (parseInt(i.value, 10) || 1) + d);
    });
    $$('.size').forEach((b) => b.addEventListener('click', () => {
      size = b.dataset.s;
      $$('.size').forEach((x) => x.setAttribute('aria-pressed', x === b));
      const n = p.sizes[size];
      $('#size-hint').className = 'hint';
      $('#size-hint').textContent = `Розмір ${size}: ${n > 3 ? 'в наявності' : `залишилось ${n} шт.`}`;
    }));
    $('#add').addEventListener('click', () => {
      if (sizes && !size) {
        $('#size-hint').className = 'hint hint--warn';
        $('#size-hint').textContent = 'Спершу оберіть розмір';
        $('.size:not(:disabled)')?.focus();
        return;
      }
      const qty = Math.max(1, parseInt($('#qty').value, 10) || 1);
      const max = sizes ? p.sizes[size] : FL.totalStock(p);
      if (qty > max) { FL.toast(`Можна замовити не більше ${max} шт.`); return; }
      FL.cart.add(p.id, size, qty);
      FL.toast(`Додано в кошик: ${p.name}${size ? `, ${size}` : ''}`);
    });

    const similar = FL.products.filter((x) => x.cat === p.cat && x.id !== p.id && FL.totalStock(x) > 0).slice(0, 4);
    $('#similar').innerHTML = similar.length ? `<section class="section"><div class="section__head"><h2>Схожі товари</h2></div><div class="grid">${similar.map((x) => FL.card(x)).join('')}</div></section>` : '';
  };

  document.addEventListener('DOMContentLoaded', () => {
    renderChrome();
    const fn = pages[document.body.dataset.page];
    if (fn) fn();
  });
})();

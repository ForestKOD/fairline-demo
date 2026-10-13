/* Демо панелі синхронізації постачальників (адмінка). Дані імітуються в браузері. */
(function () {
  'use strict';
  const FL = window.FL;
  const $ = (s, r = document) => r.querySelector(s);

  const now = () => new Date();
  const fmt = (d) => d.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  const ago = (min) => new Date(Date.now() - min * 60000);

  const suppliers = [
    { id: 'ideal', name: 'Ideal Sport', source: 'XML, відкритий фід', every: 2, last: ago(37), added: 4, updated: 212, disabled: 1, errors: 0, state: 'ok' },
    { id: 'gorgany', name: 'Gorgany', source: 'XML, B2B-кабінет', every: 2, last: ago(52), added: 0, updated: 148, disabled: 0, errors: 2, state: 'ok' },
  ];

  const log = [
    { t: ago(37), sup: 'Ideal Sport', lvl: 'ok', msg: 'Синхронізація завершена: +4 нових, 212 оновлено, 1 вимкнено (немає у фіді 3 рази поспіль)' },
    { t: ago(52), sup: 'Gorgany', lvl: 'warn', msg: '2 товари без ціни у фіді — пропущено, попередні ціни збережено' },
    { t: ago(160), sup: 'Ideal Sport', lvl: 'ok', msg: 'Синхронізація завершена: 0 нових, 205 оновлено' },
    { t: ago(170), sup: 'Gorgany', lvl: 'err', msg: 'Фід порожній (0 товарів) — імпорт перервано, дані на сайті не змінено' },
  ];

  const unmapped = [
    { sup: 'Ideal Sport', cat: 'Кемпінгові меблі / Стільці', n: 14 },
    { sup: 'Gorgany', cat: 'Туристичне спорядження > Гамаки', n: 6 },
    { sup: 'Ideal Sport', cat: 'Аксесуари для наметів', n: 9 },
  ];

  const locks = { name: true, desc: false, images: false, price: false, category: true, seo: true, specs: false };
  const lockLabels = { name: 'Назва', desc: 'Опис', images: 'Зображення', price: 'Ціна', category: 'Категорія', seo: 'SEO', specs: 'Характеристики' };

  function render() {
    const fairlineCats = FL.categories.map((c) => `<option>${c.parent} › ${c.name}</option>`).join('');
    $('#admin').innerHTML = `
      <div class="admin__head">
        <div><h1>Постачальники</h1>
          <p>Ціни й залишки оновлюються автоматично кожні 2 години, описи й фото — раз на добу. Якщо фід порожній або пошкоджений, імпорт зупиняється і нічого на сайті не змінює.</p></div>
        <a class="btn btn--ghost" href="index.html">На сайт</a>
      </div>

      <div class="suppliers">
        ${suppliers.map((s) => `
          <section class="panel sup" aria-labelledby="s-${s.id}">
            <div class="sup__top">
              <div><h2 id="s-${s.id}" style="font-size:20px">${s.name}</h2><span class="hint">${s.source} · кожні ${s.every} год</span></div>
              <button class="btn" data-sync="${s.id}" ${s.state === 'run' ? 'disabled' : ''}>${s.state === 'run' ? 'Синхронізуємо…' : 'Синхронізувати зараз'}</button>
            </div>
            <span class="status status--${s.state === 'run' ? 'run' : s.errors ? 'warn' : 'ok'}" aria-live="polite">
              ${s.state === 'run' ? 'Іде синхронізація — повторний запуск заблоковано' : `Остання успішна: ${fmt(s.last)}${s.errors ? ` · попереджень: ${s.errors}` : ''}`}
            </span>
            <div class="sup__stats">
              <div><b>${s.added}</b><span>додано</span></div>
              <div><b>${s.updated}</b><span>оновлено</span></div>
              <div><b>${s.disabled}</b><span>вимкнено</span></div>
            </div>
          </section>`).join('')}
      </div>

      <section class="panel">
        <h2 style="font-size:20px">Потребує зіставлення</h2>
        <p class="hint" style="margin:6px 0 10px">Нові категорії з фідів не публікуються самі. Призначте категорію Fairline — і всі товари з неї імпортуються туди.</p>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Постачальник</th><th>Категорія у фіді</th><th>Товарів</th><th>Категорія Fairline</th><th></th></tr></thead>
          <tbody>${unmapped.map((u, i) => `<tr><td>${u.sup}</td><td>${u.cat}</td><td>${u.n}</td>
            <td><select aria-label="Категорія Fairline для ${u.cat}" data-map="${i}"><option value="">— оберіть —</option>${fairlineCats}</select></td>
            <td><button class="linkbtn" data-save="${i}">Зберегти</button></td></tr>`).join('') || '<tr><td colspan="5">Усі категорії зіставлено.</td></tr>'}</tbody>
        </table></div>
      </section>

      <section class="panel">
        <h2 style="font-size:20px">Захист ручних правок</h2>
        <p class="hint" style="margin:6px 0 10px">Товар «Намет Smereka Trek 2» (джерело: Ideal Sport). Позначені поля фід не перезаписує; залишки оновлюються завжди.</p>
        <div style="display:flex;flex-wrap:wrap;gap:8px 20px">
          ${Object.keys(locks).map((k) => `<label class="fopt"><input type="checkbox" data-lock="${k}" ${locks[k] ? 'checked' : ''}>${lockLabels[k]}</label>`).join('')}
        </div>
      </section>

      <section class="panel">
        <h2 style="font-size:20px">Журнал синхронізацій</h2>
        <div class="tbl-wrap"><table class="tbl" style="margin-top:8px">
          <thead><tr><th>Час</th><th>Постачальник</th><th>Статус</th><th>Подія</th></tr></thead>
          <tbody>${log.slice(0, 8).map((l) => `<tr><td>${fmt(l.t)}</td><td>${l.sup}</td>
            <td class="lvl lvl--${l.lvl}">${{ ok: 'Успішно', warn: 'Попередження', err: 'Помилка' }[l.lvl]}</td><td>${l.msg}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>`;
  }

  document.addEventListener('click', (e) => {
    const id = e.target.dataset.sync;
    if (id) {
      const s = suppliers.find((x) => x.id === id);
      if (s.state === 'run') return;
      s.state = 'run'; render();
      setTimeout(() => {
        const upd = 140 + Math.floor(Math.random() * 90), add = Math.floor(Math.random() * 4);
        Object.assign(s, { state: 'ok', last: now(), added: add, updated: upd, disabled: 0, errors: 0 });
        log.unshift({ t: now(), sup: s.name, lvl: 'ok', msg: `Ручний запуск: +${add} нових, ${upd} оновлено. Рекомендації перераховано.` });
        render();
        FL.toast(`${s.name}: синхронізовано`);
      }, 2200);
    }
    const save = e.target.dataset.save;
    if (save !== undefined) {
      const sel = document.querySelector(`[data-map="${save}"]`);
      if (!sel.value) { FL.toast('Спершу оберіть категорію Fairline'); sel.focus(); return; }
      const u = unmapped.splice(Number(save), 1)[0];
      log.unshift({ t: now(), sup: u.sup, lvl: 'ok', msg: `Зіставлено «${u.cat}» → ${sel.value}. ${u.n} товарів буде імпортовано під час наступної синхронізації.` });
      render();
      FL.toast('Зіставлення збережено');
    }
  });

  document.addEventListener('change', (e) => {
    const k = e.target.dataset.lock;
    if (k) { locks[k] = e.target.checked; FL.toast(`${lockLabels[k]}: ${e.target.checked ? 'фід не перезаписує' : 'оновлюється з фіду'}`); }
  });

  document.addEventListener('DOMContentLoaded', render);
})();

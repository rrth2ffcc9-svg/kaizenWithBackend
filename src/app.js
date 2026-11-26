import { api } from './api.js';

const COLUMNS = [
  { id: 'new',      title: 'Новые идеи',      color: 'blue',   drop: 'Переместить сюда' },
  { id: 'review',   title: 'На рассмотрении', color: 'orange', drop: 'Переместить сюда' },
  { id: 'progress', title: 'В работе',        color: 'purple', drop: 'Переместить сюда' },
  { id: 'done',     title: 'Внедрено',        color: 'green',  drop: 'Переместить сюда' },
];
const STATUS = Object.fromEntries(COLUMNS.map(c => [c.id, c]));
const CATEGORIES = {
  '5s':      { label: '5S',          cls: 'green',  icon: 'check' },
  savings:   { label: 'Экономия',    cls: 'orange', icon: 'check' },
  safety:    { label: 'Безопасность', cls: 'red',    icon: 'check' },
  quality:   { label: 'Качество',    cls: 'blue',   icon: 'check' },
};
const DEPARTMENTS = ['Цех №1', 'Цех №2', 'Склад', 'ОТК', 'Офис'];
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const YEAR = new Date().getFullYear();
const PERIODS = [
  { id: `q4-${YEAR}`, label: `Q4 ${YEAR}`, long: `Q4 ${YEAR} (октябрь-декабрь)`, from: new Date(YEAR, 9, 1), to: new Date(YEAR + 1, 0, 1) },
  { id: `q3-${YEAR}`, label: `Q3 ${YEAR}`, long: `Q3 ${YEAR} (июль-сентябрь)`, from: new Date(YEAR, 6, 1), to: new Date(YEAR, 9, 1) },
  { id: `y-${YEAR}`,  label: `${YEAR} год`, long: `${YEAR} год`, from: new Date(YEAR, 0, 1), to: new Date(YEAR + 1, 0, 1) },
  { id: 'all',        label: 'Все время',  long: 'Все время', from: null, to: null },
];

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const initials = (n) => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
const fmtDate = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const fmtDateFull = (iso) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
const fmtDateTime = (iso) => new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const daysAgo = (iso) => (Date.now() - new Date(iso).getTime()) / 864e5;
const fmtMoney = (rub) => rub >= 1000 ? `${Math.round(rub / 100) / 10} тыс. ₽`.replace('.', ',') : `${rub} ₽`;
const icons = {
  check: '<svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  dots: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  doc: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12 3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  ok: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m8 12 3 3 5-6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  rub: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 20V4h5.5a4 4 0 0 1 0 8H8 M6 16h8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  up: '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path d="m3 17 6-6 4 4 8-8 M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const state = {
  items: [], loading: true, error: null,
  filters: { dept: 'all', cat: 'all', period: PERIODS[0].id, q: '' },
  view: 'board',
  moving: null,        
  dragId: null,
};

const inPeriod = (p, period) => {
  if (!period.from) return true;
  const t = new Date(p.createdAt);
  return t >= period.from && t < period.to;
};
const visible = () => {
  const { dept, cat, period, q } = state.filters;
  const per = PERIODS.find(x => x.id === period);
  const s = q.trim().toLowerCase();
  return state.items.filter(p =>
    (dept === 'all' || p.department === dept) &&
    (cat === 'all' || p.category === cat) &&
    inPeriod(p, per) &&
    (!s || [p.id, p.title, p.author, p.department].some(v => v.toLowerCase().includes(s))));
};

function renderFilters() {
  const opt = (arr, cur) => arr.map(([v, l]) => `<option value="${esc(v)}"${v === cur ? ' selected' : ''}>${esc(l)}</option>`).join('');
  $('#f-dept').innerHTML = opt([['all', 'Все'], ...DEPARTMENTS.map(d => [d, d])], state.filters.dept);
  $('#f-cat').innerHTML = opt([['all', 'Все'], ...Object.entries(CATEGORIES).map(([k, v]) => [k, v.label])], state.filters.cat);
  $('#f-period').innerHTML = opt(PERIODS.map(p => [p.id, p.label]), state.filters.period);
  $('#period-chip-text').textContent = 'Период: ' + PERIODS.find(p => p.id === state.filters.period).long;
}

function renderKpis() {
  const list = visible();
  const inWork = list.filter(p => p.status === 'progress');
  const done = list.filter(p => p.status === 'done');
  const saved = done.reduce((s, p) => s + (p.savingRub || 0), 0);
  const kpis = [
    { cls: 'blue',   icon: icons.doc,  value: list.length, label: 'Всего предложений', delta: list.filter(p => daysAgo(p.createdAt) <= 30).length, per: 'за месяц' },
    { cls: 'yellow', icon: icons.gear, value: inWork.length, label: 'На стадии внедрения', delta: inWork.filter(p => daysAgo(p.statusChangedAt) <= 7).length, per: 'за неделю' },
    { cls: 'green',  icon: icons.ok,   value: done.length, label: 'Успешно завершено', delta: done.filter(p => daysAgo(p.doneAt || p.statusChangedAt) <= 30).length, per: 'за месяц' },
    { cls: 'purple', icon: icons.rub,  value: Math.round(saved / 1000), unit: 'тыс. ₽', label: 'Суммарная экономия', delta: Math.round(done.filter(p => daysAgo(p.doneAt || p.statusChangedAt) <= 30).reduce((s, p) => s + (p.savingRub || 0), 0) / 1000), per: 'тыс. ₽ за месяц' },
  ];
  $('#kpis').innerHTML = kpis.map(k => `
    <article class="kpi">
      <span class="kpi__icon kpi__icon--${k.cls}">${k.icon}</span>
      <div class="kpi__body">
        <div class="kpi__value"><b>${k.value}</b>${k.unit ? ` <span>${esc(k.unit)}</span>` : ''}</div>
        <div class="kpi__label">${esc(k.label)}</div>
        <div class="kpi__delta">${icons.up} +${k.delta} ${esc(k.per)}</div>
      </div>
    </article>`).join('');
}

function cardHtml(p) {
  const cat = CATEGORIES[p.category] || CATEGORIES['5s'];
  const showProgress = p.status === 'progress';
  const isDone = p.status === 'done';
  const dd = new Date(p.doneAt || p.statusChangedAt);
  const ddmm = `${String(dd.getDate()).padStart(2, '0')}.${String(dd.getMonth() + 1).padStart(2, '0')}`;
  const tag = isDone
    ? `<span class="tag tag--green">${icons.check} Внедрено ${ddmm}</span>`
    : `<span class="tag tag--${cat.cls}">${icons.check} ${esc(cat.label)}</span>`;
  const moving = state.moving === p.id;
  return `
  <article class="card card--${STATUS[p.status].color}${moving ? ' is-moving' : ''}" draggable="true" tabindex="0"
           data-id="${esc(p.id)}" aria-label="${esc(p.id + ': ' + p.title)}">
    <div class="card__id">${esc(p.id)}</div>
    <h3 class="card__title">${esc(p.title)}</h3>
    ${tag}
    <div class="effect">
      <div class="effect__head"><span>ОЖИДАЕМЫЙ ЭФФЕКТ</span>
        <button class="icon-btn" type="button" data-act="menu" aria-label="Действия с карточкой" aria-haspopup="true">${icons.dots}</button>
      </div>
      <div class="effect__val"><b>${esc(p.effectValue)}</b> <i>${esc(p.effectNote)}</i></div>
    </div>
    ${showProgress ? `<div class="progress"><div class="progress__row"><span>Готовность</span><b>${p.progress}%</b></div>
      <div class="progress__bar" role="progressbar" aria-valuenow="${p.progress}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.progress}%"></i></div></div>` : ''}
    <footer class="card__foot">
      <span class="avatar">${esc(initials(p.author))}</span>
      <span class="who"><b>${esc(p.author)}</b><small>${esc(p.position)}</small></span>
      <time class="date" datetime="${esc(p.createdAt)}">${icons.clock} ${fmtDate(p.createdAt)}</time>
    </footer>
  </article>`;
}

function renderBoard() {
  const list = visible();
  $('#view').innerHTML = `<div class="board">${COLUMNS.map(c => {
    const items = list.filter(p => p.status === c.id);
    const isNew = c.id === 'new';
    const canDrop = state.moving && state.items.find(p => p.id === state.moving)?.status !== c.id;
    return `
    <section class="col col--${c.color}" data-col="${c.id}" aria-label="${esc(c.title)}">
      <header class="col__head"><h2><i class="dot"></i>${esc(c.title)}:</h2><span class="count">${items.length}</span></header>
      <div class="col__list">
        ${state.loading ? '<div class="skeleton"></div><div class="skeleton"></div>' : items.map(cardHtml).join('') || '<p class="empty">Нет предложений</p>'}
      </div>
      <button class="drop${canDrop ? ' is-ready' : ''}" type="button" data-act="${isNew && !state.moving ? 'add' : 'drop'}" data-col="${c.id}">
        <span class="plus">+</span> ${isNew && !state.moving ? 'Добавить идею' : c.drop}
      </button>
    </section>`;
  }).join('')}</div>`;
}

function renderList() {
  const list = visible().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  $('#view').innerHTML = `
  <div class="table-wrap"><table class="table">
    <thead><tr><th>ID</th><th>Предложение</th><th>Категория</th><th>Статус</th><th>Эффект</th><th>Автор</th><th>Дата</th></tr></thead>
    <tbody>${list.map(p => {
      const cat = CATEGORIES[p.category];
      return `<tr data-id="${esc(p.id)}" tabindex="0">
        <td class="mono">${esc(p.id)}</td><td class="t-title">${esc(p.title)}</td>
        <td><span class="tag tag--${cat.cls}">${icons.check} ${esc(cat.label)}</span></td>
        <td><span class="status status--${STATUS[p.status].color}"><i class="dot"></i>${esc(STATUS[p.status].title)}${p.status === 'progress' ? ` · ${p.progress}%` : ''}</span></td>
        <td>${esc(p.effectValue)} <small>${esc(p.effectNote)}</small></td>
        <td>${esc(p.author)}<small class="block">${esc(p.department)}</small></td><td>${fmtDate(p.createdAt)}</td></tr>`;
    }).join('') || '<tr><td colspan="7" class="empty">Нет предложений</td></tr>'}</tbody>
  </table></div>`;
}

function render() {
  renderFilters();
  renderKpis();
  state.view === 'board' ? renderBoard() : renderList();
  $('#v-board').classList.toggle('is-active', state.view === 'board');
  $('#v-list').classList.toggle('is-active', state.view === 'list');
  $('#v-board').setAttribute('aria-pressed', state.view === 'board');
  $('#v-list').setAttribute('aria-pressed', state.view === 'list');
  const hint = $('#move-hint');
  const mv = state.items.find(p => p.id === state.moving);
  hint.hidden = !mv;
  if (mv) hint.innerHTML = `Перемещение <b>${esc(mv.id)}</b>: выберите колонку и нажмите «Переместить сюда». <button type="button" class="link" data-act="cancel-move">Отмена</button>`;
}

function toast(msg, undo) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button type="button" class="link">Отменить</button>' : ''}`;
  $('#toasts').append(el);
  const kill = () => el.remove();
  if (undo) $('button', el).onclick = () => { undo(); kill(); };
  setTimeout(kill, 5000);
}

async function load() {
  state.loading = true; state.error = null; render();
  try { state.items = await api.list(); }
  catch (e) { state.error = e; toast('Не удалось загрузить данные. Проверьте подключение к серверу.'); state.items = []; }
  state.loading = false; render();
}

async function moveTo(id, status) {
  const p = state.items.find(x => x.id === id);
  if (!p || p.status === status) return;
  const prev = { status: p.status, progress: p.progress, doneAt: p.doneAt, statusChangedAt: p.statusChangedAt };
  Object.assign(p, { status, statusChangedAt: new Date().toISOString() });
  if (status === 'done') { p.progress = 100; p.doneAt = new Date().toISOString(); }
  else if (status === 'new' || status === 'review') p.progress = 0;
  state.moving = null; render();
  try {
    await api.move(id, status);
    toast(`${id} → «${STATUS[status].title}»`, async () => {
      Object.assign(p, prev); render();
      try { await api.update(id, { ...prev }); } catch { load(); }
    });
  } catch {
    Object.assign(p, prev); render();
    toast('Не удалось переместить карточку');
  }
}

const modalRoot = () => $('#modal-root');
let lastFocus = null;
function openModal(html, onMount) {
  lastFocus = document.activeElement;
  modalRoot().innerHTML = `<div class="overlay" data-close><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
  document.body.classList.add('no-scroll');
  const first = $('.modal input, .modal textarea, .modal select, .modal button', modalRoot());
  first?.focus();
  onMount?.($('.modal', modalRoot()));
}
function closeModal() {
  modalRoot().innerHTML = '';
  document.body.classList.remove('no-scroll');
  lastFocus?.focus?.();
}

function openCreate(status = 'new') {
  const dOpts = DEPARTMENTS.map(d => `<option>${esc(d)}</option>`).join('');
  const cOpts = Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');
  openModal(`
    <form id="f-create" novalidate>
      <header class="modal__head"><h2>Новое предложение</h2><button type="button" class="icon-btn" data-close aria-label="Закрыть">✕</button></header>
      <div class="modal__body grid2">
        <label class="span2">Название идеи *<input name="title" maxlength="140" required placeholder="Коротко: что улучшаем"><em class="err" hidden></em></label>
        <label>Категория *<select name="category">${cOpts}</select></label>
        <label>Отдел *<select name="department">${dOpts}</select></label>
        <label class="span2">Текущая проблема *<textarea name="problem" rows="3" required placeholder="Что сейчас не так?"></textarea><em class="err" hidden></em></label>
        <label class="span2">Предлагаемое решение *<textarea name="solution" rows="3" required placeholder="Что предлагаете сделать?"></textarea><em class="err" hidden></em></label>
        <label>Ожидаемый эффект *<input name="effectValue" required placeholder="−15 мин"><em class="err" hidden></em></label>
        <label>Пояснение к эффекту<input name="effectNote" placeholder="/смена на поиск"></label>
        <label>Экономия, ₽ (если есть)<input name="savingRub" type="number" min="0" step="1000" placeholder="0"></label>
        <label>Автор *<input name="author" required value="Сергей Морозов"><em class="err" hidden></em></label>
        <label class="span2">Должность<input name="position" value="Цех №1, оператор"></label>
      </div>
      <footer class="modal__foot"><button type="button" class="btn btn--ghost" data-close>Отмена</button><button class="btn btn--primary" type="submit">Отправить предложение</button></footer>
    </form>`, (m) => {
    $('[name=department]', m).value = state.filters.dept !== 'all' ? state.filters.dept : DEPARTMENTS[0];
    $('#f-create', m).addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target; let ok = true;
      f.querySelectorAll('[required]').forEach(el => {
        const bad = !el.value.trim();
        const err = el.parentElement.querySelector('.err');
        if (err) { err.hidden = !bad; err.textContent = bad ? 'Заполните поле' : ''; }
        el.classList.toggle('invalid', bad); if (bad) ok = false;
      });
      if (!ok) { f.querySelector('.invalid')?.focus(); return; }
      const v = Object.fromEntries(new FormData(f));
      const btn = $('[type=submit]', f); btn.disabled = true; btn.textContent = 'Отправка…';
      try {
        const created = await api.create({
          title: v.title.trim(), category: v.category, department: v.department,
          problem: v.problem.trim(), solution: v.solution.trim(),
          effectValue: v.effectValue.trim(), effectNote: v.effectNote.trim(),
          savingRub: Number(v.savingRub) || 0, author: v.author.trim(), position: v.position.trim() || v.department,
        });
        if (status !== 'new') await api.move(created.id, status);
        closeModal(); toast(`Предложение ${created.id} создано`); await reload();
      } catch { btn.disabled = false; btn.textContent = 'Отправить предложение'; toast('Не удалось создать предложение'); }
    });
  });
}

async function reload() { try { state.items = await api.list(); } catch { toast('Не удалось обновить данные'); } render(); }

function openDetails(id) {
  const p = state.items.find(x => x.id === id); if (!p) return;
  const cat = CATEGORIES[p.category];
  const stOpts = COLUMNS.map(c => `<option value="${c.id}"${c.id === p.status ? ' selected' : ''}>${esc(c.title)}</option>`).join('');
  openModal(`
    <header class="modal__head"><div><div class="card__id">${esc(p.id)}</div><h2>${esc(p.title)}</h2></div><button type="button" class="icon-btn" data-close aria-label="Закрыть">✕</button></header>
    <div class="modal__body">
      <div class="chips"><span class="tag tag--${cat.cls}">${icons.check} ${esc(cat.label)}</span>
        <span class="status status--${STATUS[p.status].color}"><i class="dot"></i>${esc(STATUS[p.status].title)}</span></div>
      <dl class="dl">
        <dt>Проблема</dt><dd>${esc(p.problem)}</dd>
        <dt>Решение</dt><dd>${esc(p.solution)}</dd>
        <dt>Ожидаемый эффект</dt><dd><b>${esc(p.effectValue)}</b> ${esc(p.effectNote)}${p.savingRub ? ` · экономия ${esc(fmtMoney(p.savingRub))}` : ''}</dd>
        <dt>Автор</dt><dd>${esc(p.author)}, ${esc(p.position)}</dd>
        <dt>Отдел</dt><dd>${esc(p.department)}</dd>
        <dt>Подано</dt><dd>${fmtDateFull(p.createdAt)}</dd>
        ${p.doneAt ? `<dt>Внедрено</dt><dd>${fmtDateFull(p.doneAt)}</dd>` : ''}
      </dl>
      <div class="ctl">
        <label>Статус<select id="d-status">${stOpts}</select></label>
        <label id="d-prog-wrap"${p.status === 'progress' ? '' : ' hidden'}>Готовность: <b id="d-prog-val">${p.progress}%</b>
          <input id="d-prog" type="range" min="0" max="100" step="1" value="${p.progress}"></label>
      </div>
      <section class="comments"><h3>Обсуждение</h3>
        <ul id="d-comments">${(p.comments || []).map(commentHtml).join('')}</ul>
        <form id="d-cform"><input name="text" placeholder="Написать комментарий…" maxlength="500" aria-label="Комментарий"><button class="btn btn--primary" type="submit">Отправить</button></form>
      </section>
    </div>
    <footer class="modal__foot"><button type="button" class="btn btn--danger" id="d-del">Удалить</button><button type="button" class="btn btn--ghost" data-close>Закрыть</button></footer>`,
  (m) => {
    $('#d-status', m).onchange = async (e) => {
      await moveTo(id, e.target.value); closeModal(); openDetails(id);
    };
    const pr = $('#d-prog', m);
    pr.oninput = () => { $('#d-prog-val', m).textContent = pr.value + '%'; };
    pr.onchange = async () => {
      p.progress = Number(pr.value);
      try { await api.update(id, { progress: p.progress }); render(); } catch { toast('Не удалось сохранить готовность'); }
    };
    $('#d-cform', m).onsubmit = async (e) => {
      e.preventDefault();
      const text = e.target.text.value.trim(); if (!text) return;
      try {
        const c = await api.addComment(id, text);
        (p.comments ||= []).push(c);
        $('#d-comments', m).insertAdjacentHTML('beforeend', commentHtml(c)); e.target.reset();
      } catch { toast('Не удалось отправить комментарий'); }
    };
    $('#d-del', m).onclick = async () => {
      if (!confirm(`Удалить предложение ${p.id}?`)) return;
      try { await api.remove(id); closeModal(); toast(`Предложение ${p.id} удалено`); await reload(); }
      catch { toast('Не удалось удалить'); }
    };
  });
}
const commentHtml = (c) => `<li><span class="avatar avatar--sm">${esc(initials(c.author))}</span><div><b>${esc(c.author)}</b> <small>${fmtDateTime(c.createdAt)}</small><p>${esc(c.text)}</p></div></li>`;

function openCardMenu(btn, id) {
  document.querySelector('.menu')?.remove();
  const p = state.items.find(x => x.id === id);
  const m = document.createElement('div');
  m.className = 'menu'; m.setAttribute('role', 'menu');
  m.innerHTML = `<button role="menuitem" data-m="open">Открыть</button><button role="menuitem" data-m="move">Переместить…</button>
    ${COLUMNS.filter(c => c.id !== p.status).map(c => `<button role="menuitem" data-m="to" data-to="${c.id}">→ ${esc(c.title)}</button>`).join('')}`;
  document.body.append(m);
  const r = btn.getBoundingClientRect();
  m.style.top = `${r.bottom + window.scrollY + 4}px`;
  m.style.left = `${Math.min(r.right + window.scrollX - m.offsetWidth, window.innerWidth - m.offsetWidth - 8)}px`;
  m.onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    m.remove();
    if (b.dataset.m === 'open') openDetails(id);
    if (b.dataset.m === 'move') { state.moving = id; render(); }
    if (b.dataset.m === 'to') moveTo(id, b.dataset.to);
  };
  $('button', m).focus();
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu') && !e.target.closest('[data-act=menu]')) document.querySelector('.menu')?.remove();

  if (e.target.closest('[data-close]') && (e.target.matches('[data-close]') || e.target.closest('button[data-close]'))) { closeModal(); return; }

  const act = e.target.closest('[data-act]');
  if (act) {
    const card = act.closest('.card');
    switch (act.dataset.act) {
      case 'menu': e.stopPropagation(); openCardMenu(act, card.dataset.id); return;
      case 'add': openCreate('new'); return;
      case 'drop': if (state.moving) moveTo(state.moving, act.dataset.col); return;
      case 'cancel-move': state.moving = null; render(); return;
    }
  }
  const card = e.target.closest('.card, tr[data-id]');
  if (card && !e.target.closest('.modal')) openDetails(card.dataset.id);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalRoot().firstChild) closeModal();
    else if (state.moving) { state.moving = null; render(); }
    document.querySelector('.menu')?.remove();
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.card, tr[data-id]')) {
    e.preventDefault(); openDetails(e.target.dataset.id);
  }

  if (e.key === 'Tab' && modalRoot().firstChild) {
    const f = [...modalRoot().querySelectorAll('button, input, select, textarea, [tabindex="0"]')].filter(x => !x.disabled && x.offsetParent);
    if (!f.length) return;
    const [a, z] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
    else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  }
});

document.addEventListener('dragstart', (e) => {
  const c = e.target.closest?.('.card'); if (!c) return;
  state.dragId = c.dataset.id; c.classList.add('is-drag');
  e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', c.dataset.id);
});
document.addEventListener('dragend', () => {
  state.dragId = null;
  document.querySelectorAll('.is-drag, .is-over').forEach(el => el.classList.remove('is-drag', 'is-over'));
});
document.addEventListener('dragover', (e) => {
  const col = e.target.closest?.('.col'); if (!col || !state.dragId) return;
  e.preventDefault(); e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.col.is-over').forEach(c => c !== col && c.classList.remove('is-over'));
  col.classList.add('is-over');
});
document.addEventListener('drop', (e) => {
  const col = e.target.closest?.('.col'); if (!col || !state.dragId) return;
  e.preventDefault(); const id = state.dragId; state.dragId = null;
  moveTo(id, col.dataset.col);
});


$('#f-dept').onchange = (e) => { state.filters.dept = e.target.value; render(); };
$('#f-cat').onchange = (e) => { state.filters.cat = e.target.value; render(); };
$('#f-period').onchange = (e) => { state.filters.period = e.target.value; render(); };
let st; $('#search').oninput = (e) => { clearTimeout(st); st = setTimeout(() => { state.filters.q = e.target.value; render(); }, 150); };
$('#v-board').onclick = () => { state.view = 'board'; render(); };
$('#v-list').onclick = () => { state.view = 'list'; render(); };
$('#btn-new').onclick = () => openCreate('new');

load();

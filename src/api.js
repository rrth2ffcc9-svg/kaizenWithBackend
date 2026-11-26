import { seed } from './seed.js';

const KEY = 'kaizen.proposals.v1';
const delay = (ms = 120) => new Promise(r => setTimeout(r, ms));
const now = () => new Date().toISOString();

class MockApi {
  #read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return seed();
  }
  #write(items) {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
    this._mem = items;
  }
  #items() { return this._mem ?? (this._mem = this.#read()); }

  async list() { await delay(); return structuredClone(this.#items()); }

  async create(data) {
    await delay();
    const items = this.#items();
    const year = new Date().getFullYear();
    const max = items.reduce((m, p) => Math.max(m, Number(p.id.split('-')[2]) || 0), 199);
    const p = {
      id: `KZ-${year}-${max + 1}`, status: 'new', progress: 0, comments: [],
      createdAt: now(), statusChangedAt: now(), ...data,
    };
    this.#write([p, ...items]);
    return structuredClone(p);
  }

  async update(id, patch) {
    await delay(60);
    const items = this.#items().map(p => p.id === id ? { ...p, ...patch } : p);
    this.#write(items);
    return structuredClone(items.find(p => p.id === id));
  }

  async move(id, status, progress) {
    await delay(60);
    const items = this.#items().map(p => {
      if (p.id !== id) return p;
      const n = { ...p, status, statusChangedAt: now() };
      if (status === 'done') { n.progress = 100; n.doneAt = now(); }
      else { n.doneAt = null; if (status === 'new' || status === 'review') n.progress = 0; }
      if (progress != null) n.progress = progress;
      return n;
    });
    this.#write(items);
    return structuredClone(items.find(p => p.id === id));
  }

  async remove(id) { await delay(60); this.#write(this.#items().filter(p => p.id !== id)); }

  async addComment(id, text) {
    await delay(60);
    const c = { id: crypto.randomUUID(), author: 'Администратор интерфейса', text, createdAt: now() };
    const items = this.#items().map(p => p.id === id ? { ...p, comments: [...(p.comments || []), c] } : p);
    this.#write(items);
    return c;
  }
}

class HttpApi {
  constructor(base) { this.base = base.replace(/\/$/, ''); }
  async #req(path, opt = {}) {
    const res = await fetch(this.base + path, {
      headers: { 'Content-Type': 'application/json' }, ...opt,
      body: opt.body ? JSON.stringify(opt.body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.status === 204 ? null : res.json();
  }
  list() { return this.#req('/proposals'); }
  create(d) { return this.#req('/proposals', { method: 'POST', body: d }); }
  update(id, d) { return this.#req(`/proposals/${id}`, { method: 'PATCH', body: d }); }
  move(id, status, progress) { return this.#req(`/proposals/${id}/status`, { method: 'PATCH', body: { status, progress } }); }
  remove(id) { return this.#req(`/proposals/${id}`, { method: 'DELETE' }); }
  addComment(id, text) { return this.#req(`/proposals/${id}/comments`, { method: 'POST', body: { text } }); }
}

const cfg = window.KAIZEN_CONFIG || { mode: 'mock' };
export const api = cfg.mode === 'http' ? new HttpApi(cfg.baseUrl) : new MockApi();

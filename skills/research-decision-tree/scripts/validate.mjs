#!/usr/bin/env node
// Validate a research decision tree page built from assets/template.html.
// Usage: node validate.mjs path/to/page.html
// Checks: JS syntax, data integrity (ids, stages, tags, edges, routes), and a smoke run of the engine against a stub DOM.
import fs from "node:fs";
import vm from "node:vm";

const file = process.argv[2];
if (!file) { console.error("usage: node validate.mjs page.html"); process.exit(2); }
const html = fs.readFileSync(file, "utf8");
const errors = [], warnings = [];
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 1) errors.push(`expected exactly 1 inline <script>, found ${scripts.length}`);
const code = scripts[0] || "";

// 1. Syntax
try { new vm.Script(code, { filename: "page-script.js" }); }
catch (e) { console.error("SYNTAX ERROR:", e.message); process.exit(1); }

// 2. Data integrity
const end = code.indexOf("/* =================== END DATA");
if (end < 0) errors.push("END DATA marker not found");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code.slice(0, end) + "\n;globalThis.__D={PROJECT,TAGTXT,STAGES,N,E,ROUTES,DECISIONS,WEEKS};", ctx);
const { PROJECT, TAGTXT, STAGES, N, E, ROUTES, DECISIONS, WEEKS } = ctx.__D;
const ids = new Set(Object.keys(N));
const stageIds = new Set();
STAGES.forEach(([k], i) => { if (stageIds.has(k)) errors.push(`duplicate stage id ${k}`); stageIds.add(k); });
for (const [id, n] of Object.entries(N)) {
  if (!Number.isInteger(n.st) || n.st < 0 || n.st >= STAGES.length) errors.push(`node ${id}: st=${n.st} out of range`);
  for (const f of ["t", "s", "what", "need", "risk", "src"]) if (!n[f] || !String(n[f]).trim()) errors.push(`node ${id}: empty field ${f}`);
  if (!Array.isArray(n.tags) || !n.tags.length) warnings.push(`node ${id}: no scope tag`);
  for (const t of n.tags || []) if (!(t in TAGTXT)) errors.push(`node ${id}: tag ${t} not in TAGTXT`);
  if (n.t && n.t.length > 32) warnings.push(`node ${id}: title longer than 32 chars`);
}
STAGES.forEach(([k], i) => { if (!Object.values(N).some(n => n.st === i)) warnings.push(`stage ${k} has no options`); });
const seen = new Set(), touched = new Set();
for (const [a, b] of E) {
  if (!ids.has(a)) errors.push(`edge ${a}->${b}: unknown node ${a}`);
  if (!ids.has(b)) errors.push(`edge ${a}->${b}: unknown node ${b}`);
  if (ids.has(a) && ids.has(b) && N[a].st >= N[b].st) errors.push(`edge ${a}->${b}: must go left to right (stage ${N[a].st} -> ${N[b].st})`);
  const key = a + ">" + b; if (seen.has(key)) warnings.push(`duplicate edge ${key}`); seen.add(key);
  touched.add(a); touched.add(b);
}
for (const id of ids) if (!touched.has(id)) warnings.push(`node ${id} has no edges`);
const rids = new Set();
for (const r of ROUTES) {
  if (rids.has(r.id)) errors.push(`duplicate route id ${r.id}`); rids.add(r.id);
  if (!r.name || !r.note) errors.push(`route ${r.id}: needs name and note`);
  for (const id of r.nodes) if (!ids.has(id)) errors.push(`route ${r.id}: unknown node ${id}`);
  const inR = new Set(r.nodes);
  const lit = E.filter(([a, b]) => inR.has(a) && inR.has(b)).length;
  if (r.nodes.length > 1 && lit === 0) warnings.push(`route ${r.id}: no edges lit`);
  for (const id of r.nodes) if (ids.has(id) && !E.some(([a, b]) => (a === id && inR.has(b)) || (b === id && inR.has(a))))
    warnings.push(`route ${r.id}: node ${id} is not connected to any other node of the route`);
}
const rec = ROUTES.filter(r => r.rec).length;
if (rec !== 1) errors.push(`expected exactly 1 recommended route, found ${rec}`);
if (ROUTES.length < 2 || ROUTES.length > 6) warnings.push(`${ROUTES.length} routes (aim for 3-6)`);
if (PROJECT.defaultRoute !== "none" && !rids.has(PROJECT.defaultRoute)) errors.push(`defaultRoute ${PROJECT.defaultRoute} not a route id`);
if (!ids.has(PROJECT.defaultNode)) errors.push(`defaultNode ${PROJECT.defaultNode} not a node id`);
if (isNaN(new Date(PROJECT.deadline + "T00:00:00"))) errors.push(`deadline ${PROJECT.deadline} is not yyyy-mm-dd`);
if (!WEEKS.some(w => w.dl)) warnings.push("no calendar row marked dl:true (deadline week)");
if (!DECISIONS || !Array.isArray(DECISIONS.items)) errors.push("DECISIONS.items missing");

// 3. Smoke run against a stub DOM
function fakeEl(id) {
  const e = { id, children: [], dataset: {}, style: { setProperty() {} }, attrs: {}, _cls: new Set(), innerHTML: "", textContent: "",
    classList: { toggle(c, on) { on ? e._cls.add(c) : e._cls.delete(c); }, add(c) { e._cls.add(c); } },
    set className(v) { e._cls = new Set(v.split(/\s+/)); }, get className() { return [...e._cls].join(" "); },
    setAttribute(k, v) { e.attrs[k] = v; }, getAttribute(k) { return e.attrs[k]; },
    appendChild(c) { e.children.push(c); return c; }, addEventListener(t, f) { e["on" + t] = f; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 170, bottom: 60, width: 170, height: 60 }; },
    scrollWidth: 1200, scrollHeight: 800 };
  return e;
}
const byId = {};
const doc = { documentElement: fakeEl("html"), getElementById: k => (byId[k] ||= fakeEl(k)), createElement: () => fakeEl(),
  fonts: { ready: Promise.resolve() } };
const store = {};
const run = { document: doc, window: { addEventListener() {}, ResizeObserver: class { observe() {} } },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } }, console: { log() {}, warn() {}, error() {} }, Date, Promise, Math, Set, Object, String, Array, isNaN };
run.window.ResizeObserver = run.ResizeObserver = class { observe() {} };
try {
  vm.createContext(run); vm.runInContext(code, run);
  const chips = byId.chips.children;
  if (chips.length !== ROUTES.length + 1) errors.push(`smoke: ${chips.length} chips rendered`);
  for (const c of chips) c.onclick();                      // every route renders
  for (const id of ids) vm.runInContext(`select(${JSON.stringify(id)})`, run); // every node detail renders
  const paths = (byId.edges.innerHTML.match(/<path /g) || []).length;
  if (paths !== E.length) errors.push(`smoke: ${paths} edges drawn, expected ${E.length}`);
} catch (e) { errors.push("smoke run threw: " + e.message); }

console.log(`${file}\n  stages=${STAGES.length} nodes=${ids.size} edges=${E.length} routes=${ROUTES.length} weeks=${WEEKS.length} decisions=${DECISIONS.items.length}`);
for (const w of warnings) console.log("  WARN  " + w);
for (const e of errors) console.log("  ERROR " + e);
console.log(errors.length ? `  FAILED (${errors.length} errors)` : "  OK");
process.exit(errors.length ? 1 : 0);

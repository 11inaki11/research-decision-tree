#!/usr/bin/env node
// Validate a research decision tree page built from assets/template.html.
// Usage: node validate.mjs path/to/page.html
// Checks: JS syntax; data integrity (PROJECT and its ui strings, PIPELINE, TAGS, stages, nodes, edges, routes,
// decisions, calendar); that the static HTML is a text-free skeleton; and a smoke run of the engine against a stub DOM.
import fs from "node:fs";
import vm from "node:vm";

const file = process.argv[2];
if (!file) { console.error("usage: node validate.mjs page.html"); process.exit(2); }
const html = fs.readFileSync(file, "utf8");
const errors = [], warnings = [];
const err = m => errors.push(m), warn = m => warnings.push(m);
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length !== 1) err(`expected exactly 1 inline <script>, found ${scripts.length}`);
const code = scripts[0] || "";
const blank = v => v === undefined || v === null || !String(v).trim();

// 1. Syntax
try { new vm.Script(code, { filename: "page-script.js" }); }
catch (e) { console.error(`${file}\n  SYNTAX ERROR: ${e.message}\n  FAILED`); process.exit(1); }

// 2. Data
const end = code.indexOf("/* =================== END DATA");
if (end < 0) { console.error(`${file}\n  ERROR END DATA marker not found\n  FAILED`); process.exit(1); }
const ctx = {};
vm.createContext(ctx);
try {
  vm.runInContext(code.slice(0, end) + "\n;globalThis.__D={PROJECT,PIPELINE,TAGS,STAGES,N,E,ROUTES,DECISIONS,WEEKS,SOURCES};", ctx);
} catch (e) {
  const old = /TAGTXT/.test(code) ? " (this looks like the old schema with TAGTXT: copy the current template and port the data)" : "";
  console.error(`${file}\n  ERROR data section: ${e.message}${old}\n  FAILED`); process.exit(1);
}
const { PROJECT, PIPELINE, TAGS, STAGES, N, E, ROUTES, DECISIONS, WEEKS, SOURCES } = ctx.__D;
const U = PROJECT.ui || {};

// 2a. PROJECT and UI strings
for (const f of ["lang", "tabTitle", "eyebrow", "title", "lede", "deadline", "deadlineLabel", "storeKey", "defaultRoute", "defaultNode"])
  if (blank(PROJECT[f])) err(`PROJECT.${f} is empty`);
if (PROJECT.lang && !/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(PROJECT.lang)) err(`PROJECT.lang "${PROJECT.lang}" is not a BCP-47 code`);
if (!Array.isArray(PROJECT.meta)) err("PROJECT.meta must be an array of {k,v}");
else PROJECT.meta.forEach((m, i) => { if (blank(m.k) || blank(m.v)) err(`PROJECT.meta[${i}] needs k and v`); });
if (PROJECT.deadlineEstimated !== undefined && typeof PROJECT.deadlineEstimated !== "boolean") err("PROJECT.deadlineEstimated must be true or false");
if (isNaN(new Date(PROJECT.deadline + "T00:00:00"))) err(`deadline ${PROJECT.deadline} is not yyyy-mm-dd`);
const UI_KEYS = ["routes", "wholeTree", "wholeTreeNote", "recommended", "pipeline", "decisions", "calendar", "deadline", "daysLeft",
  "dayLeft", "deadlinePassed", "estimated", "fields.what", "fields.need", "fields.risk", "fields.src", "kinds.decision", "kinds.pending",
  "kinds.assumption", "kinds.fact", "milestone", "gate", "deadlineRow", "sources"];
for (const k of UI_KEYS) { const v = k.split(".").reduce((o, p) => (o || {})[p], U); if (blank(v)) err(`PROJECT.ui.${k} is missing or empty`); }
if (U.daysLeft && !U.daysLeft.includes("{n}")) err("PROJECT.ui.daysLeft must contain {n}");
if (U.decisions && !U.decisions.includes("{date}")) warn("PROJECT.ui.decisions has no {date}: the log will not show when it was updated");

// 2b. Head and skeleton: no project text outside DATA
const head = html.replace(/<!--[\s\S]*?-->/g, "");
const title = (head.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
if (title === undefined) err("missing <title>");
else if (title.trim() !== String(PROJECT.tabTitle).trim()) err(`<title> "${title.trim()}" differs from PROJECT.tabTitle "${PROJECT.tabTitle}"`);
const lang = (head.match(/<html[^>]*\slang="([^"]*)"/) || [])[1];
if (lang !== PROJECT.lang) err(`<html lang="${lang}"> differs from PROJECT.lang "${PROJECT.lang}"`);
const bodyStatic = (html.split(/<body[^>]*>/)[1] || "").split(/<script/)[0];
const stray = bodyStatic.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ").replace(/[\s·]+/g, " ").trim();
if (stray) warn(`static text in the HTML skeleton (should come from DATA): "${stray.slice(0, 80)}"`);
if (/aria-label="/.test(bodyStatic)) warn("static aria-label in the skeleton: use aria-labelledby or set it from PROJECT.ui");

// 2c. Pipeline and tags
if (!Array.isArray(PIPELINE)) err("PIPELINE must be an array (use [] to hide the strip)");
else if (PIPELINE.length) {
  PIPELINE.forEach((p, i) => { for (const f of ["k", "v", "d"]) if (blank(p[f])) err(`PIPELINE[${i}].${f} is empty`); });
  if (!PIPELINE.some(p => p.hot)) warn("PIPELINE has no hot step (the contribution)");
  if (PIPELINE.length < 3 || PIPELINE.length > 7) warn(`PIPELINE has ${PIPELINE.length} steps (aim for 4-7)`);
}
const TONES = new Set(["accent", "warn", "muted", "dashed", "done"]);
for (const [k, t] of Object.entries(TAGS)) {
  if (!t || blank(t.label)) err(`TAGS.${k} needs a label`);
  if (!TONES.has(t && t.tone)) err(`TAGS.${k}.tone "${t && t.tone}" is not one of ${[...TONES].join(", ")}`);
}

// 2d. Stages, nodes, edges
const ids = new Set(Object.keys(N));
const stageIds = new Set();
STAGES.forEach(([k, l]) => { if (stageIds.has(k)) err(`duplicate stage id ${k}`); stageIds.add(k); if (blank(l)) err(`stage ${k} has no label`); });
for (const [id, n] of Object.entries(N)) {
  if (!Number.isInteger(n.st) || n.st < 0 || n.st >= STAGES.length) err(`node ${id}: st=${n.st} out of range`);
  for (const f of ["t", "s", "what", "need", "risk", "src"]) if (blank(n[f])) err(`node ${id}: empty field ${f}`);
  if (!Array.isArray(n.tags) || !n.tags.length) warn(`node ${id}: no scope tag`);
  for (const t of n.tags || []) if (!(t in TAGS)) err(`node ${id}: tag ${t} not in TAGS`);
  if (n.t && n.t.length > 32) warn(`node ${id}: title longer than 32 chars`);
}
STAGES.forEach(([k], i) => { if (!Object.values(N).some(n => n.st === i)) warn(`stage ${k} has no options`); });
const seen = new Set(), touched = new Set();
for (const [a, b] of E) {
  if (!ids.has(a)) err(`edge ${a}->${b}: unknown node ${a}`);
  if (!ids.has(b)) err(`edge ${a}->${b}: unknown node ${b}`);
  if (ids.has(a) && ids.has(b) && N[a].st >= N[b].st) err(`edge ${a}->${b}: must go left to right (stage ${N[a].st} -> ${N[b].st})`);
  const key = a + ">" + b; if (seen.has(key)) warn(`duplicate edge ${key}`); seen.add(key);
  touched.add(a); touched.add(b);
}
for (const id of ids) if (!touched.has(id)) warn(`node ${id} has no edges`);

// 2e. Routes
const rids = new Set();
for (const r of ROUTES) {
  if (rids.has(r.id)) err(`duplicate route id ${r.id}`); rids.add(r.id);
  if (blank(r.name) || blank(r.note)) err(`route ${r.id}: needs name and note`);
  for (const id of r.nodes) if (!ids.has(id)) err(`route ${r.id}: unknown node ${id}`);
  const inR = new Set(r.nodes);
  if (r.nodes.length > 1 && !E.some(([a, b]) => inR.has(a) && inR.has(b))) warn(`route ${r.id}: no edges lit`);
  for (const id of r.nodes) if (ids.has(id) && !E.some(([a, b]) => (a === id && inR.has(b)) || (b === id && inR.has(a))))
    warn(`route ${r.id}: node ${id} is not connected to any other node of the route`);
}
const rec = ROUTES.filter(r => r.rec).length;
if (rec !== 1) err(`expected exactly 1 recommended route, found ${rec}`);
for (const r of ROUTES.filter(r => r.rec)) for (const id of r.nodes) {
  const tg = (N[id] && N[id].tags) || [];
  if (tg.length && tg.every(t => t === "later" || t === "extra")) warn(`recommended route ${r.id}: node ${id} is tagged only ${tg.join("/")} (out of scope); remove it from the route or re-tag it`);
}
if (ROUTES.length < 2 || ROUTES.length > 6) warn(`${ROUTES.length} routes (aim for 3-6)`);
if (PROJECT.defaultRoute !== "none" && !rids.has(PROJECT.defaultRoute)) err(`defaultRoute ${PROJECT.defaultRoute} not a route id`);
if (!ids.has(PROJECT.defaultNode)) err(`defaultNode ${PROJECT.defaultNode} not a node id`);

// 2f. Decisions log and calendar
const KINDS = new Set(["decision", "pending", "assumption", "fact"]);
if (!DECISIONS || !Array.isArray(DECISIONS.items)) err("DECISIONS.items missing");
else {
  if (blank(DECISIONS.updated)) err("DECISIONS.updated is empty");
  DECISIONS.items.forEach((it, i) => {
    if (!KINDS.has(it.kind)) err(`decision ${i}: kind "${it.kind}" is not decision|pending|assumption|fact`);
    if (blank(it.title)) err(`decision ${i}: empty title`);
    if (it.kind === "decision" && blank(it.date)) warn(`decision ${i} ("${it.title}"): no date`);
    if (/^\s*(pending|pendiente)\s*:/i.test(it.title || "")) warn(`decision ${i}: title starts with "Pending:"; use kind:"pending" instead`);
  });
}
if (!Array.isArray(WEEKS) || !WEEKS.length) err("WEEKS is empty");
else {
  WEEKS.forEach((w, i) => { if (blank(w.d) || blank(w.w)) err(`WEEKS[${i}] needs d and w`); if (w.dl && w.milestone) warn(`WEEKS[${i}]: both dl and milestone`); });
  const dl = WEEKS.filter(w => w.dl).length;
  if (dl !== 1) warn(`${dl} calendar rows marked dl:true (expected exactly 1, the final deadline)`);
  else if (!WEEKS[WEEKS.length - 1].dl) warn("the dl:true row is not the last calendar row");
}
if (blank(SOURCES)) err("SOURCES is empty");

// 3. Smoke run against a stub DOM
function fakeEl(id) {
  const e = { id, children: [], dataset: {}, style: { setProperty() {} }, attrs: {}, _cls: new Set(), innerHTML: "", textContent: "", hidden: false,
    classList: { toggle(c, on) { on ? e._cls.add(c) : e._cls.delete(c); }, add(c) { e._cls.add(c); } },
    set className(v) { e._cls = new Set(v.split(/\s+/)); }, get className() { return [...e._cls].join(" "); },
    setAttribute(k, v) { e.attrs[k] = v; }, getAttribute(k) { return e.attrs[k]; },
    appendChild(c) { e.children.push(c); return c; }, addEventListener(t, f) { e["on" + t] = f; },
    getBoundingClientRect() { return { left: 0, top: 0, right: 170, bottom: 60, width: 170, height: 60 }; },
    scrollWidth: 1200, scrollHeight: 800 };
  return e;
}
const byId = {}, created = [];
const doc = { title: "", documentElement: fakeEl("html"), getElementById: k => (byId[k] ||= fakeEl(k)),
  createElement: () => { const e = fakeEl(); created.push(e); return e; }, fonts: { ready: Promise.resolve() } };
const store = {};
const run = { document: doc, window: { addEventListener() {} },
  localStorage: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v; } }, console: { log() {}, warn() {}, error() {} },
  Date, Promise, Math, Set, Object, String, Array, isNaN };
run.window.ResizeObserver = run.ResizeObserver = class { observe() {} };
const rendered = () => [...Object.values(byId), ...created].map(e => e.innerHTML + " " + e.textContent).join(" ");
try {
  vm.createContext(run); vm.runInContext(code, run);
  if (doc.documentElement.lang !== PROJECT.lang) err("smoke: engine did not set document lang");
  if (doc.title !== PROJECT.tabTitle) err("smoke: engine did not set document.title");
  for (const k of ["eyebrow", "title", "lede", "meta", "routesH", "decH", "calH", "sources"]) if (blank(byId[k] && (byId[k].innerHTML || byId[k].textContent))) err(`smoke: #${k} rendered empty`);
  if (PIPELINE.length && (byId.pipeline.innerHTML.match(/<div/g) || []).length !== PIPELINE.length) err("smoke: pipeline steps not rendered");
  const chips = byId.chips.children;
  if (chips.length !== ROUTES.length + 1) err(`smoke: ${chips.length} chips rendered`);
  for (const c of chips) c.onclick();                                          // every route renders
  for (const id of ids) vm.runInContext(`select(${JSON.stringify(id)})`, run); // every node detail renders
  const paths = (byId.edges.innerHTML.match(/<path /g) || []).length;
  if (paths !== E.length) err(`smoke: ${paths} edges drawn, expected ${E.length}`);
  if ((byId.decisions.innerHTML.match(/<li/g) || []).length !== DECISIONS.items.length) err("smoke: decisions not all rendered");
  if ((byId.weeks.innerHTML.match(/class="wk/g) || []).length !== WEEKS.length) err("smoke: calendar rows not all rendered");
  if (/undefined|\{n\}|\{date\}/.test(rendered())) err("smoke: rendered text contains 'undefined' or an unfilled {placeholder}");
} catch (e) { err("smoke run threw: " + e.message); }

const ms = WEEKS.filter(w => w.milestone).length, gates = WEEKS.filter(w => w.gate).length;
const kinds = [...KINDS].map(k => `${k}=${DECISIONS.items.filter(i => i.kind === k).length}`).join(" ");
console.log(`${file}\n  lang=${PROJECT.lang} stages=${STAGES.length} nodes=${ids.size} edges=${E.length} routes=${ROUTES.length} pipeline=${PIPELINE.length} tags=${Object.keys(TAGS).length}`);
console.log(`  calendar rows=${WEEKS.length} milestones=${ms} gates=${gates} deadlineEstimated=${!!PROJECT.deadlineEstimated}  log: ${kinds}`);
for (const w of warnings) console.log("  WARN  " + w);
for (const e of errors) console.log("  ERROR " + e);
console.log(errors.length ? `  FAILED (${errors.length} errors)` : "  OK");
process.exit(errors.length ? 1 : 0);

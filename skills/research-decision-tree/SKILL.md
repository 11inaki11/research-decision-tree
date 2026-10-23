---
name: research-decision-tree
description: Build or update an interactive research decision tree: a self-contained HTML page mapping the design options of a paper, thesis (PhD or master's/TFM), grant or research plan, with one column per design decision, one card per option (what it is, what it needs, risk, source), edges between options that chain, named routes with one recommended for the deadline, a dated decisions log and a calendar back-planned to the deadline. Use when the user weighs methods, datasets, baselines, study designs or evaluations against a submission or defence deadline; plans thesis chapters; scopes a conference vs a journal version or decides after reviews (camera-ready, resubmission); asks for a "decision tree", "options tree" or "roadmap of approaches" of a paper or thesis ("árbol de decisión de mi paper/tesis/TFM"); or reports a decision to record in an existing tree. Not for decision-tree ML models, flowcharts of software/ops pipelines, personal or financial decisions (e.g. "elegir hipoteca"), or reading-order lists.
---

# Research decision tree

One self-contained HTML page that turns notes, roadmap drafts and paper annotations into a map a researcher can decide with. The page is the easy part; **the value is the method**: honest options, honest sources, an explicit scope cut, and a recommended route that fits the deadline.

Files:
- `assets/template.html` - the page. **Everything visible** (header, pipeline strip, section headings, UI strings, nodes, log, calendar, sources) lives in the `DATA` section of its one script; the HTML body is an empty skeleton and the engine below `END DATA` renders it. Edit only `DATA`, plus `<title>` and `<html lang>`, which must equal `PROJECT.tabTitle` and `PROJECT.lang`.
- `assets/example_greenhouse.html` - the template filled with a fictional project.
- `references/example_walkthrough.md` - the fictional example step by step, a Spanish `ui` block, and an update. Read it before the first tree.
- `scripts/validate.mjs` - `node scripts/validate.mjs page.html` checks syntax, schema, ids, edges, routes, UI strings and the skeleton, and smoke-runs the engine against a stub DOM.

## The method

Steps 1-5 are thinking; open the template only once you have columns and options.

### 1. Gather sources, or draft on stated assumptions
Every option will cite a source, so collect them first: the user's messages and notes (first-class: "your message", "your note on X"), roadmap/proposal/meeting notes, papers the user annotated (with the section or table they pointed at), their prior papers or code, and what the data folder really contains (count files and check formats; do not guess).

If the inputs are thin (a one-line idea), **ask once** for these sources in one short message. If the user wants a draft now, or cannot answer, build a **draft on stated assumptions** instead of waiting: say so in the lede, record each assumption in the log as `kind:"assumption"`, and source every option the user did not give as `suggestion (Claude)`. Do not ask twice before drafting.

**Web lookups.** If you search (venue dates, datasets, licences), cite as `web search (Claude), unverified: <page title or id>`. A number read in a search summary is not a fact: put it under risk ("reported as X; check the official call") unless you opened and verified the primary page. Label numbers you derived as calculations ("calculation: 46 weeks from today").

### 2. Identify the decisions (columns)
A column is a design decision whose options are *alternatives* a paper could compare, ordered along the pipeline from inputs to the reported result. Typically 4-8. Domain examples:
- ML/systems: data, labels, features or signal, model, deployment, evaluation.
- User studies: participants, conditions/intervention, study type (interview, lab, field), design (within/between), measures, analysis.
- Theses: data/resources, one column per content chapter (its candidate topics or methods), evaluation.

Tests: could two options in the column sit in one results table or be argued against each other? Does choosing here constrain the next column? Project-level structural choices that are not comparable options (chapter order, thesis format, which venue each paper targets) are **not columns**: put them in the pipeline strip or ask them as pending forks. "Related work" or "Writing" are not decisions either; they belong in the calendar.

### 3. Enumerate the options (nodes)
2-5 per column, always including:
- **the baseline** (`base`): the simplest thing a reviewer would ask for;
- **the minimum acceptable option** for the venue and deadline (`core`);
- **the out-of-scope options** the user mentioned or that obviously come next (`later` for the journal or follow-up, `extra` for side studies). On the map, the scope cut is explicit instead of silent.
Rename tag labels in `TAGS` to the user's venues. Add custom tags when useful (e.g. `done:{label:"Accepted",tone:"done"}` for finished work such as a published chapter); the tones `accent|warn|muted|dashed|done` need no CSS.

Fill four fields for **every** option, honestly:
- **What it is** - one or two concrete sentences.
- **What it needs** - data, labels, participants, compute, code, people, access; what exists and what does not.
- **Risk** - what could make it fail or not fit. **Unknowns go here** ("not confirmed that X exists - check first"); never fill an unknown with an invented fact.
- **Source** - the paper (and section), note, meeting or person. The user's own idea: "your idea". Yours: "suggestion (Claude)". "Standard baseline" is fine for textbook baselines.

### 4. Draw the edges
`[a,b]` means option `a` genuinely feeds or is compatible with option `b`. Left to right only. A missing edge is information (a method needing paired ground truth gets no edge from a source that has none). Edges may skip a column when the middle decision does not apply.

### 5. Define the routes (3-6)
A route is a coherent set of nodes forming a paper (or thesis). Name it and give a one-line note on why it exists and what it depends on. Usually: minimum acceptable (recommended), main comparison, ambitious/journal, extras (each only if a named precondition holds). A route's nodes should be connected among themselves.

**The recommended route** (`rec:true`, exactly one) is the minimum route that would be *acceptable at the target venue by the deadline*, not merely the smallest: include its baseline and whatever reviewers there would require (e.g. a real-user evaluation at an HCI venue). If every route rests on an unverified precondition (data access, ethics approval, hardware), recommend the one whose precondition can be checked soonest, and say in its note what to check and by when.

### 6. Ask the forks only the user can decide
After drafting, list 1-4 forks you could not resolve (scope, venue, whose data, thesis format). Ask them concisely in chat, **each with a default**, and record each in the log as `kind:"pending"` with the default in its detail. Do not ask what you can look up or what the tree already shows as alternatives.

### 7. Decisions log and calendar
- **Log** (`DECISIONS.items`, oldest first): each item `{date, kind, title, detail}` with kind `decision` (taken, with the reasoning or source), `pending` (an open fork with its default), `assumption` (what a draft rests on) or `fact` (a checked fact that shapes the plan). `DECISIONS.updated` is the date of the last edit.
- **Calendar** (`WEEKS`): back-plan from the deadline; data and access work first, the final row is the deadline (`dl:true`) for final runs and writing. Granularity: by week up to ~3 months, by 2-4-week blocks up to ~1 year, by month or quarter beyond. Mark intermediate deadlines (ethics approval, abstract registration, each paper submission, thesis deposit) with `milestone:true`. A conditional row is allowed only as a go/no-go point (`gate:true`) whose text states the condition and both outcomes. Plan only `core`/`base` work of the recommended route; say so in `calNote`.
- If the date is a guess (call not out yet, "early October"), set `deadlineEstimated:true`: the page shows "~" and "estimated" and still counts days. Log the guess as an assumption.

## Data model (`DATA` section)

```js
PROJECT  = {lang, tabTitle, eyebrow, title, lede, meta:[{k,v}], deadline:"yyyy-mm-dd", deadlineEstimated, deadlineLabel,
            storeKey:"rdt-<slug>-route", defaultRoute:"<route id>"|"none", defaultNode, calNote,
            ui:{routes, wholeTree, wholeTreeNote, recommended, pipeline, decisions:"... {date}", calendar, deadline,
                daysLeft:"{n} days left", dayLeft, deadlinePassed, estimated, fields:{what,need,risk,src},
                kinds:{decision,pending,assumption,fact}, milestone, gate, deadlineRow, sources}}
PIPELINE = [{k:"Step", v:"Value", d:"Description", hot:true}]       // [] hides the strip
TAGS     = {core:{label:"<venue>", tone:"accent"}, base:{...,"warn"}, extra:{...,"dashed"}, later:{...,"muted"}}
STAGES   = [["data","Data"], ...]                                    // columns in pipeline order
N        = {id:{st:<stage index>, t, s, tags:[...], what, need, risk, src}}
E        = [["fromId","toId"], ...]
ROUTES   = [{id, name, rec:true|undefined, nodes:[ids], note}]
DECISIONS= {updated, items:[{date, kind, title, detail}]}
WEEKS    = [{d:"7-13 Dec", w:"What happens", dl|milestone|gate:true}]
SOURCES  = "every source the tree draws on"
```
- **Language.** Write all content and the whole `ui` block in the user's language and set `lang`; the walkthrough has a Spanish `ui` block. No English UI string may remain on a non-English page.
- Strings are inserted as HTML (`<b>`, `<sub>` work); escape a literal `<` or `&`.
- Node ids: short camelCase, never changed once published (routes, edges and saved state reference them). Unique `storeKey` per project.

## Page contract (the template satisfies it; keep it that way)
Header (eyebrow, title, lede explaining how to read the page, meta with deadline and days left); pipeline strip with the contribution marked; route chips ("whole tree" + one per route, recommended flagged, remembered in `localStorage` inside try/catch); tree with one lane per column, nodes as `<button>`s, SVG edges redrawn on resize, font load and ResizeObserver; detail panel (`aria-live="polite"`); decisions log with kind badges; calendar with milestone, go/no-go and deadline badges; sources. Theming: tokens on `:root`, dark mode under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and again under `:root[data-theme="dark"]`, explicit body background. Phone: 16px gutter, the tree scrolls horizontally inside its own box, no page-level horizontal scroll, detail panel stacks below 1000px. Accessibility: real buttons, `aria-pressed`, visible `:focus-visible`, reduced motion respected. One file; only Google Fonts external; works from disk.

## Build workflow
1. Do method steps 1-5 (if the user wants to review first, sketch columns and options in chat).
2. Copy `assets/template.html`. Place it in the project repo (e.g. `docs/<slug>_tree.html`); with no repo, save it next to the user's input files or in the current working directory as `<slug>_tree.html`, and tell the user where. Replace the **whole** `DATA` section (never leave template values: a page must not show another project's header), set `<title>` and `<html lang>`.
3. Run `node <skill>/scripts/validate.mjs <page.html>`; fix every ERROR, read every WARN. Without node, check by hand that ids in edges and routes exist and edges go to a higher `st`.
4. Show the page (open it, or publish it as a link if the environment supports that and the user wants one), then ask the pending forks (step 6).

## Update workflow (the tree is a living document)
- **A fork is decided**: change that item's kind from `pending` to `decision`, set its date, keep its position; append new items at the end; update `DECISIONS.updated`.
- **A fact is learned**: move it from risk to need in the affected nodes, rewrite resolved risks, add the source; log it as `fact` if it shapes the plan.
- **Scope changes**: re-tag (`core` to `later` etc.) instead of deleting, so the scope history stays visible. Delete an option only if it was never viable Moving an option out of scope also removes it from the recommended route; add it to the journal/follow-up route and fix route notes that counted it. Tags say where an option fits (venue); routes say what you will do.
- **An option is added**: fill all four fields, source and tag; draw only honest edges; add it to the routes it belongs to. Whether it joins the recommended route is a pending fork unless the user said so. New node if it is a separate alternative or resource; edit the existing node if it is the same thing with new facts. Never change ids.
- **Re-planning**: re-plan the calendar from today, then update every text that mentions weeks or dates (route notes, gate rows, `meta`, `calNote`, sources, log details).
- Pages built with an older template (e.g. a `TAGTXT` constant, header text in the HTML): copy the current template and port the data into the new schema.
- Re-run the validator, then show or open the page as for a new tree and summarise what changed.

## Pitfalls
- **Fabrication.** Never invent numbers (dataset sizes, accuracies, sample sizes, dates), citations, sections or page numbers. "About 800 runs" from the user stays "about 800 runs (your note)"; if nobody said, write "not counted yet" under risk. A wrong number in a planning tool propagates into the paper.
- **Uncredited ideas.** Do not present the user's idea as a literature idea, or yours as theirs.
- **Long labels.** Titles at most ~4 words (validator warns above 32 characters); detail goes in the four fields.
- **Everything connected.** Edges that do not reflect real compatibility make routes meaningless.
- **No scope cut.** If nothing is tagged `later`/`extra`, the tree is not helping the user say no.
- **Recommended route that does not fit** the calendar, or that a reviewer at the venue would reject. Check both; cut or add, and say what changed.
- **Mixed languages or leftover template text.** Every visible string comes from `DATA`; translate `ui` too.
- **Privacy.** The page may describe unpublished work: keep it local unless the user asks for a link.

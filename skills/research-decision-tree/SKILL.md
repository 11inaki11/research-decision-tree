---
name: research-decision-tree
description: Build an interactive "research decision tree" HTML page mapping every design option of a paper or research project - one column per design decision, one card per option (what it is, what it needs, risk, source of the idea), edges showing which options chain, named routes with one recommended for the deadline, a dated decisions log and a week-by-week calendar. Use whenever the user wants to map the options, paths or design space of a paper, thesis, grant or research plan; asks for a "decision tree", "options tree", "roadmap of approaches" or "árbol de decisión" of methods; is choosing between methods, datasets, baselines or evaluations for a project; wants to scope a paper to a submission deadline or split a conference from a journal version; or shares notes, a roadmap and annotated papers asking "what are my options?" or "what should I do first?". Also use it to update an existing tree when a decision is taken. Trigger even without the word "tree" when research alternatives are weighed against a deadline.
---

# Research decision tree

A single self-contained HTML page that turns a messy pile of notes, roadmap drafts and paper annotations into a map a researcher can actually decide with. The page is the easy part; **the value is the method**: honest options, honest sources, an explicit scope cut, and a recommended route that fits the deadline.

Files in this skill:
- `assets/template.html` - the page. All content lives in the header HTML and the `DATA` section of the one script. Do not touch the engine below `END DATA`.
- `references/example_walkthrough.md` - a worked example (fictional): sources to columns to nodes to routes. Read it before the first tree you build.
- `scripts/validate.mjs` - `node scripts/validate.mjs page.html` checks syntax, ids, edges, routes and smoke-runs the engine against a stub DOM.

## The method

Work through these steps in order. Steps 1-3 are thinking; do not open the template until you have the columns and options.

### 1. Gather the sources
Collect everything the user has that bears on the project, and keep a list - every option will cite one of them:
- the user's own messages and notes in this conversation (these are first-class sources: "your message", "your note on X");
- roadmap / proposal / meeting notes;
- related papers the user annotated (cite the paper and, if given, the section or table the user pointed at);
- the user's prior papers or code the project builds on;
- what the repo or data folder actually contains, if you can look (count files, check sizes and formats rather than guessing).
If the user gave only a one-line idea, ask for these before building; a tree built from nothing is decoration.

### 2. Identify the decisions (the columns)
A column is a design decision whose options are *alternatives* (pick one or several to compare). Order them along the pipeline, from data to the final output, e.g. data, labels, features, model, deployment, evaluation. Typically 4-8 columns. Tests:
- Could two options in the column be compared in a paper table? If yes, they belong together.
- Does choosing in this column constrain the next one? If not, consider merging or dropping it.

### 3. Enumerate the options (the nodes)
For each column list 2-5 options, and always include:
- **the baseline** (tag `base`): the simplest thing a reviewer would ask for (a fixed threshold, a classic statistical test, an off-the-shelf model with no tuning, etc.);
- **the minimum viable option** that fits the deadline (tag `core`);
- **the out-of-scope options** the user mentioned or that obviously come next (tag `later` for the journal / follow-up version, `extra` for nice-to-have side studies). Putting them on the map makes the scope cut explicit instead of silent.
Rename the tag texts in `TAGTXT` to the user's venues (e.g. `core:"NeurIPS"`, `later:"Journal"`).

For **every** option fill four fields, honestly:
- **What it is** - one or two sentences, concrete.
- **What it needs** - data, labels, compute, code, people, access. State what exists and what does not.
- **Risk** - what could make it fail or not fit. **Unknowns go here as risks** ("not confirmed that X exists - check before planning on it"); never fill an unknown with an invented fact.
- **Source** - where the idea came from: the paper (and section), the note, the meeting, or the person. If the idea is the user's own, say so ("your idea", "your note in ..."). If it is yours (Claude's), say "suggestion (Claude)" so the user can weigh it. "Standard baseline" is acceptable for textbook baselines.

### 4. Draw the edges
An edge `[a,b]` means option `a` genuinely feeds or is compatible with option `b` in the next decisions. Edges go left to right only. Do not connect everything to everything: a missing edge is information (e.g. a method that needs paired ground-truth measurements has no edge from a data source that has none). Long edges that skip a column are fine when the intermediate decision does not apply.

### 5. Define the routes (3-6)
A route is a coherent set of nodes forming a paper. Give each a short name and a one-line note saying why it exists and what it depends on. Usually:
1. **Minimum viable for the deadline** - `rec:true`, exactly one. Includes its baseline.
2. **The main experimental comparison** - what the paper's central table compares.
3. **Ambitious / journal version** - the `later` nodes.
4. **Extras** - side studies, each only if a named precondition holds.
A route's nodes should be connected by edges among themselves; the validator warns otherwise.

### 6. Ask the forks only the user can decide
List 1-4 forks you could not resolve from the sources (scope, venue, which setup to study, whose data). Ask them in the chat, concisely, with your default. Put them in the decisions log as `Pending: ...` items until answered. Do not ask about things you can look up or that the tree already shows as alternatives.

### 7. Decisions log and calendar
- **Decisions taken (date)**: one item per decision already made, bold lead sentence + one line of detail, newest last. Include the reasoning or source if it came from a paper (section/page).
- **Calendar**: back-plan from the deadline in weeks. The last row is the deadline week (`dl:true`) and is for final runs and writing; data work goes first. Only `core`/`base` nodes of the recommended route go in the calendar; say so in `calNote`.

## Data model (the `DATA` section of `template.html`)

```js
PROJECT = {deadline:"yyyy-mm-dd", deadlineLabel, storeKey:"rdt-<slug>-route", defaultRoute:"<route id>", defaultNode:"<node id>",
           allLabel, allNote, recLabel, fields:["What it is","What it needs","Risk","Source"], calNote}
TAGTXT  = {core:"<venue>", later:"Journal", extra:"Extra", base:"Baseline"}   // keys are CSS classes
STAGES  = [["data","Data"], ["label","Labels"], ...]                          // columns, pipeline order
N       = {id:{st:<stage index>, t:"Title", s:"Subtitle", tags:["core"], what, need, risk, src}}
E       = [["fromId","toId"], ...]                                             // left to right only
ROUTES  = [{id, name, rec:true|undefined, nodes:[ids], note}]
DECISIONS = {date:"<date>", items:[{b:"Lead sentence.", d:"Detail."}]}
WEEKS   = [{d:"7-13 Dec", w:"What happens", dl:true|undefined}]
```
- Node ids: short camelCase, stable across updates (routes and edges reference them).
- Strings are inserted as HTML, so `<sub>`, `<b>` work; escape a literal `<` or `&` as `&lt;` / `&amp;`.
- Header (eyebrow, h1, lede, meta line), the pipeline strip and the sources footnote are plain HTML above the script; edit them in place. The days-left counter is computed from `PROJECT.deadline`.
- Give `storeKey` a unique slug per project so two trees do not share the remembered route.

## Page contract (already satisfied by the template - keep it that way)
- Header: eyebrow, title, lede that explains how to read the page, meta line (deadline + days left, system, compute).
- Pipeline strip: 4-7 steps showing where the proposed system fits, the contribution marked `class="hot"`. Delete it if the project has no pipeline.
- Route chips: "Whole tree" + one per route, recommended flagged; a note per route. Selecting a route dims non-route nodes and lights edges whose both ends are in the route. Remembered in `localStorage` inside try/catch.
- Tree: one lane per stage, nodes are `<button>`s with title, subtitle, scope tags; SVG cubic-bezier edges redrawn on resize, font load and ResizeObserver.
- Detail panel (`aria-live="polite"`) with the four fields for the clicked node.
- Decisions log, calendar, sources footnote.
- Theming: tokens on `:root`, dark mode via `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])` and again `:root[data-theme="dark"]`; explicit body background.
- Phone width: 16px gutter, the tree scrolls horizontally inside its own box, no page-level horizontal scroll; the detail panel stacks under the tree below 1000px.
- Accessibility: real buttons, `aria-pressed` on chips and nodes, visible `:focus-visible` outline, reduced-motion respected.
- Self-contained: one file, only Google Fonts as external resource. Works opened from disk.

## Build workflow
1. Do steps 1-6 of the method; draft columns and options in your head or in chat if the user wants to review first.
2. Copy `assets/template.html` to the project (e.g. `docs/<slug>_tree.html`). Replace the header text, pipeline strip, sources footnote and the whole `DATA` section. Delete every `<!-- EDIT: ... -->` comment.
3. Run `node <skill>/scripts/validate.mjs <page.html>`; fix every ERROR, read every WARN. If node is unavailable, check by hand that every edge and route id exists in `N` and that edges go to a higher `st`.
4. Show the user the page (open it, or publish it as an artifact if the environment supports that and the user wants a link) and ask the pending forks.
5. Write the page and labels in the user's language if they write in another language; the `fields`, `allLabel`, `recLabel` strings exist for that.

## Update workflow (the tree is a living document)
When the user takes a decision, learns a fact, or the plan changes:
- Add a dated item to `DECISIONS` (update `DECISIONS.date`); turn the matching `Pending:` item into a decision.
- Update the affected nodes: move facts from **risk** to **need** once confirmed, rewrite risks that were resolved, add the new source.
- Re-tag options that moved in or out of scope (`core` to `later` etc.) instead of deleting them, so the scope history stays visible. Delete an option only if it was never viable.
- Adjust routes (the recommended one especially) and re-plan the remaining calendar weeks from today to the deadline.
- Keep node ids stable. Re-run the validator.

## Pitfalls
- **Fabrication.** Never invent numbers (dataset sizes, accuracies, latencies), citations, sections or page numbers. If the user said "about 800 runs", write that and cite them; if nobody said, write "not counted yet" under risk. A wrong number in a planning tool propagates into the paper.
- **Uncredited ideas.** Every option carries a source. Do not present the user's idea as a literature idea or yours as theirs.
- **Labels too long.** Titles at most ~4 words (validator warns above 32 characters), subtitles one short line. Detail goes in the four fields.
- **Everything connected.** Edges that do not reflect real compatibility make routes meaningless.
- **No scope cut.** If nothing is tagged `later`/`extra`, the tree is not helping the user say no.
- **Recommended route that does not fit.** Sanity-check it against the calendar weeks; if it does not fit, cut it further and say what you cut.
- **Columns that are not decisions** (e.g. "Related work", "Writing"). Those belong in the calendar.
- **Privacy.** The page may describe unpublished work under review: keep it local unless the user asks for a link; do not put it in public places.

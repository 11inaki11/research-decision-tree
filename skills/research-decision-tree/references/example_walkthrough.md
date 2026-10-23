# Worked example (fictional): drift detection in a greenhouse irrigation controller

Everything below is invented to illustrate the method. The filled page is `assets/example_greenhouse.html` in this skill (same data as this walkthrough).

## 1. Sources the user shared

| Label used in the tree | What it is |
|---|---|
| Your project notes | A message: "the drip controller logs 24 soil-moisture probes every 10 min, about a season of data; technicians recalibrate probes when readings look wrong and write it in a book; I'd like a residual from a water-balance model" |
| Lab roadmap draft | Two paragraphs: conference paper by 26 Feb, journal version later with other farms and a live trial |
| Lab meeting suggestion (fictional co-author) | "Put a few probes in weighed pots on the bench, then you know the truth" |
| Related paper P1 (your annotation) | User highlighted: injecting synthetic drift with known onset; autoencoder baseline |
| Related paper P2 (your annotation) | User highlighted: cross-sensor consistency; online recalibration |

Note what is **not** known: exact months of complete logs, whether every bed has two probes, whether a public dataset exists. These become risks, not facts. Had the user sent only "drift detection for greenhouse probes, paper in February", the right move is one message asking for notes, roadmap and papers; if they say "just draft it", build the page with the lede starting "Draft on stated assumptions", log each assumption as `kind:"assumption"`, and source every option as `suggestion (Claude)`.

## 2. Columns (decisions, data to output)

`Data -> Drift labels -> Signal -> Detector -> Response -> Evaluation`

Rejected column: "Related work" (not a decision; goes in the calendar as writing time). For contrast, a user study would have columns like `Participants -> Conditions -> Study type -> Design -> Measures`, and a thesis `Data -> Chapter 2 -> Chapter 3 -> Chapter 4 -> Evaluation`; a thesis's format (monograph or compendium) is a pending fork, not a column.

## 3. Options per column, with scope tags

| Column | Options (tag) |
|---|---|
| Data | Controller logs (core), Bench drift rig (core), Public sensor data (later) |
| Drift labels | Maintenance log (core), Injected drift (core + base), Reference probe (core) |
| Signal | Raw readings (base), Water-balance residual (core), Cross-probe consistency (extra) |
| Detector | CUSUM (base), Gaussian-process residual (core), Small autoencoder (core), Pre-trained time-series model (later) |
| Response | Flag to grower (core + base), Fallback estimate (extra), Online recalibration (later) |
| Evaluation | Log replay (core), Bench accuracy (core), Live season trial (later) |

One node filled honestly:

```js
lMaint:{st:1,t:"Maintenance log",s:"Recalibration dates",tags:["core"],
  what:"Each time a technician recalibrated or replaced a probe, the days before it count as drifted.",
  need:"The paper maintenance book, transcribed. Ask who kept it.",
  risk:"Onset of drift is unknown: only the repair date is recorded. Labels are late and coarse.",
  src:"Your project notes"}
```

The user said "about a season"; the Controller logs node repeats "about a season" and puts "count the gaps" under risk instead of writing a made-up number of months. If Claude had looked up a public dataset on the web, the node would read `src:"web search (Claude), unverified: <dataset page title>"` and any size quoted from a search snippet would sit under risk until the dataset page itself was checked.

## 4. Edges (only real compatibility)

- `Reference probe` feeds `Water-balance residual` and `Raw readings`, but not `Cross-probe consistency` (the bench has no beds).
- `Raw readings` feeds `Small autoencoder`; `Water-balance residual` feeds `Gaussian-process residual`. No edge from residual to autoencoder: nobody proposed it, and adding it would invent a design.
- `Online recalibration` feeds `Bench accuracy` and `Live season trial` but not `Log replay` (replaying old logs cannot test a live correction).

## 5. Routes

| Route | Nodes (short) | Why |
|---|---|---|
| Minimum conference paper (recommended) | logs, maintenance + injected labels, residual, CUSUM vs GP, flag, replay | Smallest version a reviewer at this venue would accept (learned detector vs classic baseline, on real labels); fits with margin |
| Detector comparison | + bench rig, reference probe, raw signal, autoencoder, bench accuracy | The main results table; only if the rig runs by the go/no-go point |
| Cross-probe extra | + cross-probe signal, fallback estimate | Depends on two probes per bed (unconfirmed) |
| Journal version | + public data, pre-trained model, recalibration, live season | Months of work |

"Injected drift only" would be smaller, but a reviewer would reject a detector never tested on real drift, so it is not the recommended route.

## 6. Forks asked to the user, and the log

```js
const DECISIONS={updated:"4 Dec 2026",items:[
 {date:"4 Dec",kind:"fact",title:"Logs cover about a season.",detail:"Your project notes. Gaps not counted yet."},
 {date:"4 Dec",kind:"decision",title:"Flag only for the conference.",detail:"No control changes on the real greenhouse before the deadline (your answer)."},
 {date:"4 Dec",kind:"pending",title:"One site or two?",detail:"A second site adds about a month of cleaning (your estimate). Default: one site."}
]};
```

## 7. Calendar, back-planned

About 12 weeks to the deadline, so rows are weeks or two-week blocks. Data export, gap counting and the maintenance book go first (7-20 Dec), because every later column depends on them. A go/no-go row on 18 Jan decides whether the bench rig joins; a milestone row marks the (fictional) abstract registration on 19 Feb; the last row is the deadline week.

```js
{d:"18 Jan",gate:true,w:"Is the bench rig running? If yes, the detector comparison route is on; if not, bench work moves to the journal version."},
{d:"19 Feb",milestone:true,w:"Abstract and title registration."},
{d:"20-26 Feb",dl:true,w:"Final read, submit on the 26th."}
```

## 8. Localisation: a Spanish `ui` block

For a user writing in Spanish, set `lang:"es"`, `<html lang="es">`, write all content in Spanish and replace the `ui` block:

```js
ui:{
  routes:"Rutas", wholeTree:"Árbol completo", wholeTreeNote:"Todas las opciones y todas las conexiones posibles, sin ninguna ruta resaltada.",
  recommended:"recomendada", pipeline:"Dónde encaja el trabajo",
  decisions:"Registro de decisiones (actualizado {date})", calendar:"Calendario hasta la fecha límite",
  deadline:"Fecha límite", daysLeft:"quedan {n} días", dayLeft:"queda 1 día", deadlinePassed:"fecha límite pasada", estimated:"estimada",
  fields:{what:"Qué es", need:"Qué necesita", risk:"Riesgo", src:"Fuente"},
  kinds:{decision:"Decisión", pending:"Pendiente", assumption:"Supuesto", fact:"Hecho"},
  milestone:"Hito", gate:"Seguir / parar", deadlineRow:"Entrega", sources:"Fuentes"
}
```

Tag labels (`TAGS`), stage labels, `meta` keys, the eyebrow and `calNote` are content and are translated too.

## 9. An update, two weeks later (how the tree evolves)

User: "Checked: only 9 of 14 beds have two probes. We'll use the second greenhouse. And my co-author suggests a Kalman filter."
- `sCross.need` becomes "Two probes in 9 of 14 beds (your check, 18 Dec)"; risk rewritten to "Results limited to 9 beds". Appended `{date:"18 Dec",kind:"fact",title:"Two probes in 9 of 14 beds.",...}`.
- The pending "One site or two?" item stays in place, becomes `kind:"decision"`, `date:"18 Dec"`, with the reason in its detail.
- New node `mKalman` in the Detector column (a separate alternative, so a new node, not an edit of CUSUM): four fields, `src:"Co-author suggestion (18 Dec)"`, tag `core`, edges from the residual signal and to Flag. It joins the detector comparison route; joining the recommended route is logged as `pending` because the user did not say.
- Calendar re-planned from today with the second site's cleaning; route notes and the gate row that mention dates are rewritten to match. Validator re-run.

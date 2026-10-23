# Worked example (fictional): drift detection in a greenhouse irrigation controller

Everything below is invented to illustrate the method. The filled page is `examples/greenhouse_example.html` in the repository (same data as this walkthrough).

## 1. Sources the user shared

| Label used in the tree | What it is |
|---|---|
| Your project notes | A message: "the drip controller logs 24 soil-moisture probes every 10 min, about a season of data; technicians recalibrate probes when readings look wrong and write it in a book; I'd like a residual from a water-balance model" |
| Lab roadmap draft | Two paragraphs: conference paper by 26 Feb, journal version later with other farms and a live trial |
| Lab meeting suggestion (fictional co-author) | "Put a few probes in weighed pots on the bench, then you know the truth" |
| Related paper P1 (your annotation) | User highlighted: injecting synthetic drift with known onset; autoencoder baseline |
| Related paper P2 (your annotation) | User highlighted: cross-sensor consistency; online recalibration |

Note what is **not** known: exact months of complete logs, whether every bed has two probes, whether a public dataset exists. These become risks, not facts.

## 2. Columns (decisions, data to output)

`Data -> Drift labels -> Signal -> Detector -> Response -> Evaluation`

Rejected column: "Related work" (not a decision; goes in the calendar as writing time).

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

The user said "about a season"; the Controller logs node repeats "about a season" and puts "count the gaps" under risk instead of writing a made-up number of months.

## 4. Edges (only real compatibility)

- `Reference probe` feeds `Water-balance residual` and `Raw readings`, but not `Cross-probe consistency` (the bench has no beds).
- `Raw readings` feeds `Small autoencoder`; `Water-balance residual` feeds `Gaussian-process residual`. No edge from residual to autoencoder: nobody proposed it, and adding it would invent a design.
- `Online recalibration` feeds `Bench accuracy` and `Live season trial` but not `Log replay` (replaying old logs cannot test a live correction).

## 5. Routes

| Route | Nodes (short) | Why |
|---|---|---|
| Minimum conference paper (recommended) | logs, maintenance + injected labels, residual, CUSUM vs GP, flag, replay | Fits the deadline with margin; includes its baseline |
| Detector comparison | + bench rig, reference probe, raw signal, autoencoder, bench accuracy | The main results table; only if the rig runs by week 3 |
| Cross-probe extra | + cross-probe signal, fallback estimate | Depends on two probes per bed (unconfirmed) |
| Journal version | + public data, pre-trained model, recalibration, live season | Months of work |

## 6. Forks asked to the user

- "One greenhouse or two? A second strengthens the paper but costs about a month of cleaning (your estimate?)." -> logged as `Pending: one site or two?`
- "Is changing the real controller allowed before the deadline?" -> answered no, logged as decision "Flag only for the conference".

## 7. Calendar, back-planned

Deadline week (20-26 Feb) = final read and submit. The week before = figures and writing. Data export, gap counting and the maintenance book go first (7-20 Dec), because every later column depends on them.

## 8. An update, two weeks later (how the tree evolves)

User: "Checked: only 9 of 14 beds have two probes." Then:
- `sCross.need` becomes "Two probes in 9 of 14 beds (your check, date)"; risk rewritten to "Results limited to 9 beds".
- New decision item: "Cross-probe stays extra" with the date.
- Recommended route unchanged; calendar re-planned from today.

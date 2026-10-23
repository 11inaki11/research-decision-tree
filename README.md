# research-decision-tree

A Claude skill ([Agent Skills](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview) format) that turns your research notes, roadmap and annotated papers into an interactive **decision tree page** for a paper or project:

- one column per design decision, from data to final output;
- one card per option: **what it is, what it needs, its risk, and where the idea came from**;
- edges showing which options genuinely chain;
- named **routes** through the tree (minimum viable, main comparison, journal version, extras), one recommended for your deadline;
- a dated **decisions log** and a week-by-week **calendar** back-planned from the deadline.

The page is a single self-contained HTML file (light and dark mode, works on a phone, keyboard accessible). The skill's real content is the method: cite the source of every idea, mark unknowns as risks instead of inventing facts, make the scope cut explicit, and keep the tree updated as decisions get taken.

![Fictional example: a decision tree for a greenhouse probe-drift paper](docs/screenshot.png)

## Contents

```
skills/research-decision-tree/
  SKILL.md                        method, data model, page contract, update workflow, pitfalls
  assets/template.html            data-driven page; Claude edits only the header and DATA section
  references/example_walkthrough.md  worked fictional example: sources -> columns -> nodes -> routes
  scripts/validate.mjs            node validator: syntax, ids, edges, routes, stub-DOM smoke run
examples/greenhouse_example.html  the template filled with a fictional project
```

## Install

**Claude Code**: copy the skill folder into your skills directory.

```bash
cp -r skills/research-decision-tree ~/.claude/skills/
```

(or into `.claude/skills/` of a single project).

**claude.ai**: zip the folder (`dist/research-decision-tree.zip` if you built it, or `cd skills && zip -r research-decision-tree.zip research-decision-tree`) and upload it under Settings > Capabilities > Skills.

## Use

Example prompts:

- "Here are my notes and the roadmap for the paper. Build me a decision tree of the options, with a recommended route for the 15 March deadline."
- "I'm choosing between three labelling strategies and two models for this project. Map the design space."
- "Which parts of this plan fit the conference version and which go to the journal version?"
- "We decided to drop the second dataset. Update the tree."

Claude will gather the sources, ask you the few forks only you can decide, fill the template, validate it and give you the HTML file.

Validate a page by hand:

```bash
node skills/research-decision-tree/scripts/validate.mjs examples/greenhouse_example.html
```

## License

MIT, see [LICENSE](LICENSE). The example project is fictional.

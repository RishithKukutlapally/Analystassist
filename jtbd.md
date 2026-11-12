Jobs to be done

Primary job (analyst): When I receive a 50-page corporate document, I want the ownership and control facts pulled out with citations, so I can confirm who the beneficial owners are in minutes instead of hours.

Supporting jobs, in priority order:

1. When a holding chain spans several layers, I want the effective percentage calculated and shown with each layer's source, so I can verify the arithmetic without redoing it by hand.
2. When a value has low confidence or conflicts across documents, I want it flagged for a person and shown beside the conflicting citations, so I never accept a doubtful value by default.
3. When I check a value, I want one click to jump from the field to the exact page and line in the source, so I can verify it before I accept, edit, or reject it.
4. When control rests on something other than capital, such as a managing partner clause or voting rights, I want that control surfaced separately, so I do not miss a controller who holds a minority stake.
5. When I finish a file, I want to set the risk rating myself and sign with a complete, read-only audit trail, so the decision stays mine and passes audit.
6. When I work through a file, I want to see the guardrail status and the remaining steps, so I know when the file is ready to sign.
7. As a team lead or pilot owner, I want to see minutes per file, correction rate, and citation click-through, so I can prove the tool saves time and is used responsibly.

Screens that fulfill the jobs

┌──────────┬───────────────┬─────────────────────────────────────┐
│   Job    │    Screen     │         Must-have elements          │
├──────────┼───────────────┼─────────────────────────────────────┤
│          │               │ Split view: source viewer on the    │
│ Primary, │ Case review   │ left, field review on the right,    │
│  3, 6    │ workspace     │ progress bar, guardrail badge,      │
│          │               │ Accept/Edit/Reject per field        │
├──────────┼───────────────┼─────────────────────────────────────┤
│          │ Ownership     │ Holding-chain diagram with          │
│ 1        │ structure     │ percentages on each link and the    │
│          │               │ effective-percentage calculation    │
├──────────┼───────────────┼─────────────────────────────────────┤
│          │ Exception     │ Flagged field, reason, conflicting  │
│ 2        │ review        │ citations side by side, decision    │
│          │               │ controls                            │
├──────────┼───────────────┼─────────────────────────────────────┤
│          │ Source viewer │ Page and line headers, highlighted  │
│ 3        │  (inside      │ cited lines, flash on jump          │
│          │ workspace)    │                                     │
├──────────┼───────────────┼─────────────────────────────────────┤
│          │ Control panel │ Separate block for non-capital      │
│ 4        │  (inside      │ control with the clause cited       │
│          │ workspace)    │                                     │
├──────────┼───────────────┼─────────────────────────────────────┤
│          │ Sign-off and  │ Risk rating left empty, sign button │
│ 5        │ audit log     │  disabled until all fields and the  │
│          │               │ rating are set, read-only log       │
├──────────┼───────────────┼─────────────────────────────────────┤
│          │ Pilot value   │ Three measures against targets,     │
│ 7        │ dashboard     │ with the 180-minute baseline marked │
│          │               │  as an assumption                   │
└──────────┴───────────────┴─────────────────────────────────────┘

The Governance tab in the file is a memo for the Chief Risk Officer rather than a product screen, so I left it out of the Stitch prompt.
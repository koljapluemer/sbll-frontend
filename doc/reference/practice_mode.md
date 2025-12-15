
# Input Data

Practice is per situation.
That means we get a `jsonl` where each line is a gloss, covering all glosses we may need.
We also get a `json` with a high-level overview of the goals of the situation, like:

```json
{
  "procedural-paraphrase-expression-goals": [
    "eng:ask in which direction gate six is",
    "eng:ask when the flight from Paris will arrive"
  ],
  "understand-expression-goals": [
    "arb:الرحلة المتجهة إلى برلين ستتأخر ثلاثين دقيقة",
    "arb:رحلة لوين؟",
    "arb:يرجى التوجه إلى منطقة التفتيش الأمني"
  ],
}
```

For now, we randomly pick a goal from the situation and then design our lesson.

## Finding out what actually to practice

At the beginning, our job is to parse/traverse the "tree" of relationship from this goals along certain rules:
In this process, a given gloss may be given exactly one state:
- `VOCAB-BLOCKED`
- `VOCAB-TO-INTRODUCE`
- `VOCAB-TO-PRACTICE`
- `FINAL-CHALLENGE`
- `SENTENCE-TO-GUESS` (not yet used)
- `DONE`

### procedural-paraphrase-expression-goals

- recursively parse the `parts` (and the `parts` of the `parts`) of the core goal. 
    - if a given gloss has no `parts` itself, set to `VOCAB-TO-INTRODUCE`
    - if a given gloss has `parts`, set it to `VOCAB-BLOCKED` (it will be unblocked in the lesson when all `parts` are set to `VOCAB-TO-PRACTICE`)
- check for `translations` of the root goal gloss. if exists:
    - recursively resolve the `parts` of these translations
    - apply same state logic as above

### understand-expression-goals

- recursively parse the `parts` of the root goal gloss; apply same logic as above

## Actual Practice

- glosses tagged with `VOCAB-TO-INTRODUCE` can (if they fulfill conditions; check the `utils` of each task, e.g. [here](src/pages/situation-practice/tasks/ChallengeTryToExpress/utils.ts)) be practiced with the following tasks (doing any of these moves the vocab from `VOCAB-TO-INTRODUCE` to `VOCAB-TO-PRACTICE`):
    - `MemorizeFromNative` 
    - `UnderstandNativeFromSentence` 
    - `MemorizeFromTarget`
    - `UnderstandTargetFromSentence`
- glosses tagged with `VOCAB-TO-PRACTICE` can practiced with the following tasks:
    - `FormSentence` (no state change)
    - `RecallFromNative` (if done correctly (see emit), move to `DONE`)
    - `UnderstandSentenceAroundTargetGloss` (no state change)
    - `RecallFromTarget` (if done correctly, move to `DONE`)

- The practice logic works as follows:
    - make a combined list of all glosses that are either `VOCAB-TO-PRACTICE` or `VOCAB-TO-INTRODUCE`
        - if list is not empty, pick one randomly and run appropriate task
            - never allow picking the same gloss twice in a row; if only one task is left and that would be the same as just was practiced, end the mode
            - if a given gloss task results in a gloss's state change, see if that unblocks glosses currently set `VOCAB-BLOCKED`
        - if list is empty, show the final challenge(s) in random order with appropritate tasks


## Notes

### Current Architecture

- Entry point: `PracticeRouter.vue` (page `situation-practice`). It loads a situation’s goals from `/data/situations/<native>/<target>/<id>.json` and the gloss repo from the matching `.jsonl`.
- Modes: For now two modes are supported—procedural paraphrase vs understand expression. `PracticeRouter` randomly chooses a goal from the available mode buckets and renders the matching mode component.
- Queue: Each goal feeds its `needToBeLearned` refs into `useQueue`. `useQueue` tracks a per-goal state map: `blocked`, `novel`, `practicing`, `done`, plus `lastGlossRef`.
- Blocking: A gloss is initially `blocked` if any of its `parts` are also in the goal and are not in `practicing`/`done`. Unblock happens automatically when those parts advance.
- Selection: `getDueGloss` returns a random gloss from `{novel, practicing}` excluding the immediate last one. If none exist, the mode enters the final challenge stage.
- Progression: Mode components render a task for the gloss. When a task emits `taskDone`, the mode calls `handleGlossScore`, which promotes `novel -> practicing` (regardless of correctness) or `practicing -> done` when `rememberedCorrectly === true`.
- Completion: When the queue is exhausted (or filtered out by the last-gloss rule), the mode shows the final challenge task and emits `completed`, which routes back to situations with a toast.

*We may need to change this architecture, especially we may need to CLEANLY split up logic of the goal-type specific tree resolve logic*
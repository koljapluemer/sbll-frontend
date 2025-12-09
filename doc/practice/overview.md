# Situation Practice Overview (Explanation)

This is a high-level explanation of the situation practice feature so new contributors can orient themselves quickly.

- Entry point: `PracticeRouter.vue` (page `situation-practice`). It loads a situation’s goals from `/data/situations/<native>/<target>/<id>.json` and the gloss repo from the matching `.jsonl`.
- Modes: For now two modes are supported—procedural paraphrase vs understand expression. `PracticeRouter` randomly chooses a goal from the available mode buckets and renders the matching mode component.
- Queue: Each goal feeds its `needToBeLearned` refs into `useQueue`. `useQueue` tracks a per-goal state map: `blocked`, `novel`, `practicing`, `done`, plus `lastGlossRef`.
- Blocking: A gloss is initially `blocked` if any of its `parts` are also in the goal and are not in `practicing`/`done`. Unblock happens automatically when those parts advance.
- Selection: `getDueGloss` returns a random gloss from `{novel, practicing}` excluding the immediate last one. If none exist, the mode enters the final challenge stage.
- Progression: Mode components render a task for the gloss. When a task emits `taskDone`, the mode calls `handleGlossScore`, which promotes `novel -> practicing` (regardless of correctness) or `practicing -> done` when `rememberedCorrectly === true`.
- Completion: When the queue is exhausted (or filtered out by the last-gloss rule), the mode shows the final challenge task and emits `completed`, which routes back to situations with a toast.

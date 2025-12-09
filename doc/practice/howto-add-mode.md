# How To Add a New Practice Mode

Goal: introduce another mode (e.g., listening) while reusing the existing router and queue.

1) **Define goal shape**: Extend `PracticeMode` and ensure your situation JSON includes a new array (e.g., `listening-goals`) with `needToBeLearned` and `finalChallenge`.
2) **Create mode component** under `src/pages/situation-practice/modes/YourMode.vue`:
   - Import `useQueue`, `getTaskDefinition`, and `TaskContext`.
   - Provide your `novel`/`practicing` task lists and a final challenge task.
   - Implement `requestNextTask` the same way the existing modes do: `getDueGloss` → pick task → `setGlossInvalid` on failure → final stage when queue empty.
   - Handle `task-done` by forwarding to `handleGlossScore` and then fetching the next task.
3) **Wire router choice** in `PracticeRouter.vue`:
   - Parse your goal array from the situation JSON.
   - Add the new mode to `availableModes` when data exists.
   - Render your mode component when selected and pass `goal` + `glossIndex`.
4) **Map tasks**: Add any new tasks to `tasks/registry.ts` and reference their types in your mode’s `novel`/`practicing` lists.
5) **Test selection**: Verify that `getDueGloss` cycles through your states and that final challenge triggers when queue is exhausted.

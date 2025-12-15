# How To Add a Task Type

Follow this when adding a task folder under `src/pages/situation-practice/tasks/<NewTask>/`.

1) **Scaffold files**
   - `interface.ts`: Define the task data shape the component consumes.
   - `utils.ts`: Export `isPossibleToMake(glossRef, repo, context)` and `makeTask(glossRef, repo, context): TaskInterface | undefined`.
   - `Task.vue`: Render the task UI and emit `taskDone(doneCorrectly?: boolean)` when complete.

2) **Implement utils**
   - Resolve gloss data via helpers in `tasks/taskUtils.ts` (translations, usage examples, parts).
   - Keep `isPossibleToMake` fast and pure; only check prerequisites.
   - `makeTask` should return `undefined` when data is insufficient; the mode will try another task or mark the gloss invalid.

3) **Emit completion**
   - Always emit `taskDone`. Include a boolean when correctness should advance practicing → done; omit/undefined when the task is ungraded.

4) **Register the task**
   - Add an entry to `tasks/registry.ts` with the component and utility functions.
   - Add the task type to the appropriate mode lists (novel/practicing) in the mode components.

5) **Keep styling consistent**
   - Use shared elements: `IndexCard`, `InteractionButtonRow`, `ShowInstruction`.
   - Respect the minimalist design from `002_rework_practice_flow.md`.

6) **Test**
   - Create a situation data case that satisfies `isPossibleToMake`.
   - Run through the mode to ensure `taskDone` fires and `useQueue` transitions as expected.

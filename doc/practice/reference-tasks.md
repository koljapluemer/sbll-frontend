# Task Catalogue (Reference)

Each task folder lives under `src/pages/situation-practice/tasks/<TaskName>/` with `interface.ts`, `utils.ts`, `Task.vue`. All tasks emit `taskDone(doneCorrectly?: boolean)`; absence of the flag is treated as “no correctness judgment.”

## Novel-phase tasks
- **MemorizeFromNative**: Countdown, then recall → reveal. `isPossibleToMake`: native gloss with translations into target.
- **MemorizeFromTarget**: Mirror above for target gloss with translations into native.
- **UnderstandNativeFromSentence**: Native gloss with a target translation that has ≥2 usage examples translated back to native. Two-step flip + example swipe.
- **UnderstandTargetFromSentence**: Target gloss with ≥2 usage examples translated to native and a native translation. Two-step flip + example swipe.

## Practicing-phase tasks
- **FormSentence**: Native gloss + translations, modal textarea, no correctness flag (advances novel→practicing but not practicing→done).
- **RecallFromNative**: Recall target translations from native prompt; emits correctness.
- **RecallFromTarget**: Recall native translations from target prompt; emits correctness.
- **UnderstandSentenceAroundTargetGloss**: Target gloss with a usage example whose parts all translate to native; two-step flip + part cards; emits correctness.

## Final challenges
- **ChallengeTryToExpress**: Prompt on gloss content, reveal translations, finishes flow.
- **ChallengeTryToUnderstand**: Mirror above for understanding.

## Task selection utilities
- `tasks/registry.ts` exposes the task definitions (component, `isPossibleToMake`, `makeTask`).
- `tasks/taskUtils.ts` contains shared helpers for resolving glosses, translations, usage examples, and parts.

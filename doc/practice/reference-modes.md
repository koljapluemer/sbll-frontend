# Practice Modes (Reference)

## Procedural Paraphrase Expression
- Component: `src/pages/situation-practice/modes/PracticeProceduralParaphraseExpression.vue`
- Input goal fields: `needToBeLearned`, `finalChallenge`
- Queue mapping:
  - `novel`: `MemorizeFromNative`, `UnderstandNativeFromSentence`
  - `practicing`: `FormSentence`, `RecallFromNative`
- Final challenge: `ChallengeTryToExpress`

## Understand Expression
- Component: `src/pages/situation-practice/modes/PracticeUnderstandExpression.vue`
- Input goal fields: `needToBeLearned`, `finalChallenge`
- Queue mapping:
  - `novel`: `MemorizeFromTarget`, `UnderstandTargetFromSentence`
  - `practicing`: `UnderstandSentenceAroundTargetGloss`, `RecallFromTarget`
- Final challenge: `ChallengeTryToUnderstand`

## Shared Flow
- Mode requests a due gloss via `useQueue.getDueGloss`.
- Picks a task type based on gloss state, shuffles the allowed list, calls the task definition’s `isPossibleToMake` and `makeTask`.
- If no task is possible, `setGlossInvalid` is called and the mode retries with a new gloss.
- When `taskDone` fires, the mode calls `handleGlossScore` and fetches the next task; when `getDueGloss` returns `undefined`, the mode shows the final challenge and emits `completed` afterward.

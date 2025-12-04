- let's build a basic situation practice page [here](src/pages/situation-practice/SituationPracticePage.vue).
- Note: A situation has as data source the following two files, matching in name, differing in ending: `public/data/situations/eng/arb/at the airport.json`+`public/data/target_languages.jsonl`

For now, let's do a proof of concept: Allow clicking "Practice" on `src/pages/situations/SituationsPage.vue` and simply show some core data about the gloss matching a randomly chosen `procedural-paraphrase-expression-goals` entry's `finalChallenge`. Have a "done" button leading back to the situations page.

Parse gloss with [this schema](gloss.schema.json).

Let's mock a minimal flow:
Maintain two pools:
- `glossesToIntroduce` starts as list of all references from need to be learned in the situation JSON such as `public/data/situations/eng/arb/at the airport.json`
- `glossesToPractice` starts as empty list

Then, loop as follows:
- Randomly pick a random element from either of the two lists (if one is empty, choose from the other of course). Yes, actual random picking.
- If both are empty, the "practice mode" is over and we move on to `src/pages/situation-practice/tasks/native-to-target/FinalChallengeTryToExpress.vue`
- If the randomly picked element is from `glossesToIntroduce`, get the needed elements from the JSONL and run through `src/pages/situation-practice/tasks/native-to-target/MemorizeWithTimer.vue`
  - no matter what's emitted, after emit, remove the gloss reference from `glossesToIntroduce` and add it to `glossesToPractice`
- If the picked gloss came from `glossesToPractice`, flow through `src/pages/situation-practice/tasks/native-to-target/NativeToTargetSR.vue` instead
    - decide on emit: if user remembered, remove from glossesToPractice. if not, leave it in
- Under no circumstance may the same gloss come up twice in a row (e.g. when there is only one gloss left and it's done wrong by the user, still move on to final practice). Track this.
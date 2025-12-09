Let's rework the practice flow.
There is some implementation in `src/pages/situation-practice/_legacy/IndexCard.vue` and `src/pages/situation-practice/_legacy/SituationPracticePage.vue`, but it's architecturally rotten.

Here is the target file structure:

`src/pages/situation-practice/`
|- `PracticeRouter.vue`
|- modes/
| |- `PracticeProceduralParaphraseExpression.vue`
| |- `PracticeUnderstandExpression.vue`
|- tasks/
| |- `MemorizeFromNative/` // all of these folders always contain `Task.vue`, `interface.ts` and `utils.ts`
| |- `MemorizeFromTarget/`
| |- `RecallFromTarget/`
| |- `RecallFromNative/`
| |- `FormSentence/`
| |- `UnderstandNativeFromSentence/`
| |- `UnderstandTargetFromSentence/`
| |- `UnderstandSentenceAroundTargetGloss/`
| |- `ChallengeTryToExpress/`
| |- `ChallengeTryToUnderstand/`
|- elements/
| |- `IndexCard.vue`
| |- `ShowInstruction.vue`
| |- `InteractionButtonRow.vue`
|- utils/
  |- `useQueue.ts`


Here is what each file should do:

## Practice Router

This is the component that is triggered from `src/pages/situations/SituationsPage.vue`.
It should randomly select randomly either a random `understand-expression-goals` entry or a random `procedural-paraphrase-expression-goals` entry.
Should be robust against one of the arrays not existing or being empty.
(see `public/data/situations/eng/arb/at the airport.json` for data structure example).

Should then, accordingly pass the goal object to `PracticeProceduralParaphraseExpression.vue` or `PracticeUnderstandExpression.vue`.
Design a solid pattern for this.

Note that this is for now a binary choice, but we will add more such practice modes later

## PracticeProceduralParaphraseExpression.vue

The point of this practice mode is to practice the `needToBeLearned`, then present the `finalChallenge` with appropriate component.
These are two modes: First, we practice until done (described later), then we show the final challenge once.

The practice is logically handled by `useQueue`. 
This component simply requests a valid due gloss item and then chooses randomly from appropriate components depending on the practice state of the gloss.

- for `novel` state glosses, choose from:
    - `MemorizeFromNative`
    - `UnderstandNativeFromSentence`
- for `practicing` state glosses, choose from:
    - `FormSentence`
    - `RecallFromNative`

Follows this flow to get a task:
1. randomly choose an appropriate task type
2. `tasks/$TaskFolder/utils.ts` must expose a function `isPossibleToMake` that takes a gloss reference, a readonly repo of all situation glosses and return a bool (think of a clean pattern for this, feel free to extend the folder structure)
3. If fn returns `true`, go ahead, render task
4. If `false`, try another task type
5. If none works, the data for a gloss is broken. Call a special `setGlossInvalid()` in `useQueue`, basically skip and get a new gloss via `useQueue` `getDueGloss`

As soon as it gets `undefined` on `getDueGloss`, consider the practice mode done and render `ChallengeTryToExpress`.

## PracticeUnderstandExpression.vue

The point of this practice mode is also to practice the `needToBeLearned`, then present the `finalChallenge` with appropriate component `ChallengeTryToUnderstand`.
Work generally similar to the one above. The task to component mapping works as follows:

- for `novel` state glosses, choose from:
    - `MemorizeFromTarget`
    - `UnderstandTargetFromSentence`
- for `practicing` state glosses, choose from:
    - `UnderstandSentenceAroundTargetGloss`
    - `RecallFromTarget`

## utils/useQueue

A composable managing a pool of gloss references that need to be learned. There are the following dynamics at play here:

1) glosses are learnt differently on first exposure than on later exposures
2) we first want to learn the `parts` of a gloss before bringing it up, therefore glosses may block each other
3) Under certain circumstances, we want to repeat a gloss (that was remembered wrong for example)
4) We never want to see the same gloss twice in a row, that's boring and/or confusing

So, the rough logical flow is like this:

- We keep track of the following pools:
    - `blockedGlosses`
    - `novelGlosses`
    - `practicingGlosses`

However, this is only a mental model. A given gloss can only be in one of the 3 pools, so the actual data structure should be a dict with
the gloss ref as key and a state enum as value.

On initialization, all pools are empty.
We then check which glosses are not blocked on virtue of having `parts` also mentioned in the repo. We put those in `novelGlosses`. We put blocked glosses in `blockedGlosses`.

Components using this composable can call a function `handleGlossScore(glossref:string, rememberedCorrectly? : bool) {}`.
It can also call `getDueGloss(): StatefulGloss | undefined`. (`StatefulGloss` returns the gloss ref str and an indicator if it's novel or practicing)

`getDueGloss` is simple: We simply return random (btw, random means *truly random*) from a combined pool of `novel`- and `practicingGlosses`.
The only additional rule is that we track the last practiced gloss and always exclude that.

For `handleGlossScore`:
- if it's currently novel, ignore `rememberedCorrectly` and set it to practicing
- if it's currently practicing and `rememberedCorrectly`, set it to state `done` (it will never be returned from now on)
- if it's currently practicing and not `rememberedCorrectly`, do not change the state
- as soon as a gloss is practicing (as opposed to novel), it does not longer "block" glosses where it is mentioned in `parts`. Therefore, when this transition happens, check if anything is now unblocked.

## Tasks

Every task type has a folder.
There should probably be a map somewhere defining the possible tasks and where to find their files for easy access.

Every task folder must contain:

### `interface.ts`

A bespoke data interface describing everything needed for this specific task type.
This may be fairly simple, like `nativeGlossContent` and `translationsContent[]` for a simple recall-this-word task,
but also fairly complex for stuff where we show examples, their translations, and so on.

### `utils.ts`

Two functions:

- `isPossibleToMake(glossRef, repo): bool`
- `makeTask(glossRef, repo): $TaskInterface | undefined` // referring to the custom interface defined in `interface.ts`

### `Task.vue`

The actual component rendering the task. 
Can be fairly dumb thanks to the interface.
Emit is standardized, I think for now we mostly need `taskDone(doneCorrectly?: bool)` to pass up to the practice page.

We are also going to use `elements/` as much as possible, described below.

### Task Types

Stick to the design and logic instructions described here.
We want a MINIMALISTIC!!!!!!! design.
Refrain from adding cards, labels, extra descriptions and other slob.
Stick EXACTLY to what's asked.
Read also `developer-guidelines.md`

#### `MemorizeFromNative/`

- instruction: "Try to memorize this"
- indexcard: show native meaning (`content` of gloss) (large text), separator, then each possible target lang gloss's content as rows, also lg text. Do NOT!!!!!!!!!! show any other properties, labels or "helpful text", JUST THIS! If several translations exist, randomize order and limit to only the first 3.

Below the flashcard, we have a unique loading bar element, counting down from 5 seconds.
Again, JUST!!!!!!!!!!!!!!!! the loading bar, with no labels, titles, markers or second label. Simply visually "un-progressing" a loading bar.

No buttons.

When at 0, do a visual 3D flip animation (standardize this, different stuff needs to trigger a "flip" of the index card) of the index card,
and then:

- instruction: "Do you remember how to express this?"
- indexcard: show just the native meaning as large text
- button: show a flip button. when clicked:

- triggers another flip animation 
- again shows the full card, just like at the beginning
- no instruction
- single button with a checkmark, ending the task.

`isPossibleToMake` is true for a given gloss when
- the gloss is in the native lang
- it has at least one `translations` elem into the target lang of the situation


#### `MemorizeFromTarget/`

- exactly like above, only we show the *target* lang gloss at top of index card
- instruction "Do you remember how to express this?" should become "Do you remember what this means?"
 
#### `RecallFromTarget/`

Works exactly like `MemorizeFromTarget`, only we start not by giving away the solution, but with the "middle state" of only showing the target gloss content on the card  and the flip button.

At the end, we show two buttons: checkmark and cross, and accordingly emit `doneCorrectly`.

#### `RecallFromNative/`

Works as expected.

#### `FormSentence/`

- instruction: "Form a sentence that includes this word"
- index card: show the given gloss (native first) and (<=3) translations, in the same format as for the `MemorizeFromNative` task in the beginning.
- show a single button which triggers a modal with a textarea where the user can type the sentence their forming. On confirm, end the task (no rating) 

#### `UnderstandNativeFromSentence/`

- can be created for a native lang gloss that has a target lang translation that in turn has at least two `usage_examples` which in turn have each at least one translation into the native lang.

Flow is at follows:

##### Screen 1

- instruction: "How do you think this is expressed?"
- one indexcard with *just* the (native) gloss `content` on it
- then, *separate* index cards for each of the usage examples, always with the following rows: (randomly chosen if multiple exist) native translation of the usage example (text normal), separator, target language `content` of the given usage example
- below that, a simple flip button

##### Screen 2

When flip button pressed, do the classic 3d flip on the top card with the core gloss, but for the rest, do another standardized animation that just "swipes them off the screen"

After that, show:
- no instruction
- the core gloss with up to 3 translations in the usual format, just as when doing `MemorizeFromNative`
- single checkmark button ending the task

#### `UnderstandTargetFromSentence/`

- can be created for a target lang gloss that has at least two `usage_examples` which in turn have each at least one translation into the native lang. Also must have a translation into the native lang.

Apart from that, works just like `UnderstandNativeFromSentence`, just mirrored in the appropriate places


#### `UnderstandSentenceAroundTargetGloss/`

- can be created for a target lang gloss where
    - a usage example exists
    - this usage example has > 0 `parts`
    - each of these parts has a translation into the native lang
    - one of the parts is the target lang gloss

##### Screen 1

- instruction: "Try to understand the meaning of this sentence"
- below that, an index card with just the picked example sentence (it's `content`)
- below that, an index card each for the `parts` of the example sentence, with translation(s) to native (normal text `content`, separator, translation(s) (one row each, if multiple, usually shuffle-and-limit-to-3 logic))
- button: single "flip button"

##### Screen 2

similar to `UnderstandNativeFromSentence`, when flip is pressed, flip only the top-most card, swipe the rest "off the screen". Then show:

- the index card with the picked example sentence now with translation
- another index card for the gloss that the whole exercise was build around (the one excluded in the `parts` list before) with translations
- single checkmark button ending the task



#### `ChallengeTryToExpress/`

Special final challenge.
- instruction "try to express this"
- index card with just the `content` of the challenge gloss
- flip button
- usual flip animation, after that show also separator and example translations in target language (usual shuffle+max 3 limit)
- double checkmark (or something) button ending the lesson run 

#### `ChallengeTryToUnderstand/`

as above, only with instruction "Can you understand this?"

## Elements

Reusable UI elems to standardize how tasks look.

### IndexCard.vue

The existing `src/pages/situation-practice/_legacy/IndexCard.vue` is pretty alright but it tries some hacks with classes and what not.
We're *eventually* going to add audio players here or what not, so simply do a case-by-case match depending on the type of row element 
instead of trying to make cool class/HTML separations.

Essential concept with texts and divider stands for now.
One change: For big text, count the letters; less than 3, real big `text-7xl`, less than 20, `text-5xl`, otherwise 2xl

### InteractionButtonRow

Simple dumb component standardizing a row of icon-only, always-the-same-looking buttons emitting when they're pressed by their icon name.
Nothing in the props but an array of lucide icon names to be made buttons; no further customization

### ShowInstruction

An extremely simple component taking only a `str` "content" prop.
Point is to standardize how instructions are rendered.
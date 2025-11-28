aight, let's start generating interactive lessons; first also on a data/debug level. 

Add a heading "Lesson Generation" to `src/pages/situation-debug/SituationDebugPage.vue` and a button "Generate Example".
Generation itself should be build in [this meta feature](src/meta/generate-lesson/generateLesson.ts).

Some general facts about lessons:

- target is simply a list of gloss references (`exerciseGlosses[]`).
- lessons have 16 exercises (or less), and a `finalChallengeGloss`
- collections (`content` of gloss is wrapped in "-", detect [here](src/entities/gloss/isCollection.ts)) are excluded from exercises


Gen should work like this:


1. Randomly pick one of the valid challenges (understanding or expression challenges). This becomes the final challenge. Also, this gloss cannot be picked from now on.
2. Recursively loop the picked goals `contains`. Add all those glosses to `exerciseGlosses`
3. Find all glosses referenced in `translations` of all of the so-far-added glosses and save them to a list
4. Find all glosses in the situation gloss list that reference any of the so far picked glosses in *their* `contains` and save them to a list
5. Combine these two lists
6. Randomly pick from this list until we have 16 exercises
7. If still not 16, fill up from completely random glosses of the situation which are so far not included
8. Shuffle the list

Show the result in a card (`finalChallengeGloss`, and table with the glosses in `exerciseGlosses`)
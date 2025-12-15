If in [situation practice](src/pages/situation-practice/SituationPracticePage.vue) we actually do the final challenge(s), let's log this in localstorage dict in the following way:

{
    "$identifier_of_goal_gloss": "$counter_separate days:$datetime_last_practiced"
}

So, for example:

{
    "eng:say hello": "3:25-12-16T12:31",
    "deu:Hallo": "1:25-12-17T:14:53",
}

Do the same for the situation gloss itself, in the same format

The point is that the counter counts on how many *different* days the user has practiced the goal. So that's why we also track yy-mm-ddT-hh-mm; if goal was already practiced today, don't iterate the counter.

What we do with this information:
- When a situation is picked for practice [from here](src/pages/situations/SituationsPage.vue), instead of picking a goal within this situation completely randomly, we try to pick randomly from the set of goals not yet practiced today, and only if all goals within this situation were already practiced today, we pick any. We also don't pick the goal of the set that was most recently practiced, unless there is only one goal within the situation
- On [the overview](src/pages/situations/SituationsPage.vue), *if* the situation was practiced before, use the `date-fns` library (install) and its `formatDistanceToNow` to display a badge like "last practiced 3 days ago" on the situation card
- Also on [the overview](src/pages/situations/SituationsPage.vue), *if* the situation was practiced before, give the situation card one extra grid row, and in it add an element that's a row of 7 colored circles (always)
    - count the percentages of goals within this goal that
        - were practiced on more than 10 days (platin color)
        - were practiced on more than 3 days (gold color)
        - were practiced at least once (green color)
        - were never practiced (grey)
    - do a "friendly rounding up" so that even if only if 0.01% of goals were ever pratcied at least one circle is green
Build out some very basic first features.
Always adhere to `developer-guidelines.md`, completely, line by line. You are a professional and caring software architect and designer.

This will be a language learning app.
We will need to know the user's native language, and which language they want to learn.
Display both in a global footer in `src/app/App.vue`.
Persist both via pinia in local storage.
Use iso 3 letter codes (yes, actual ISO, actual 3 letters).

For now, set native to `eng` and don't allow changing it.
When app is loading and no target lang is found, popup a modal (`features/` feature) to set the target lang.
Parse the options from `public/data/target_languages.jsonl`.
For this display, use `short` + `name` for display and persist `iso`.

Then, based on this pair of languages (yes, dynamically, not "I hardcode this for now lmao", no, dynamically) find the correct file in `public/data` with the path `situations_$iso-of-target_$iso-of-native.jsonl` and make a route (for now auto-redirect there) displaying each available situation as a daisy card (showing both native, and smaller, target lang description, and ofc using the image).

Make sure to correctly engineer according to `developer-guidelines.md`.
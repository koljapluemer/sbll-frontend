# Language Management

## Overview

Language selection is URL-driven. No aggressive prompts or forced selections. Users navigate through language choices via clean URL paths.

## Data Sources

- **`/data/situations/languages.json`** - Central language registry mapping ISO codes to display names and symbols
- **`/data/situations/available_native_languages.json`** - Array of native language ISO codes with available content
- **`/data/situations/{nativeIso}/available_target_languages.json`** - Array of target language ISO codes for a given native language

## URL Structure

```
/learn                           → Select native language
/learn/{nativeIso}               → Select target language
/learn/{nativeIso}/{targetIso}   → View situations
```

Language params cascade through subsequent routes (practice, debug, etc.).

## Language Entity

**`@/entities/language`** exports:
- `getLanguageInfo(iso)` - Fetches and caches language details (displayName, symbol, iso)
- `LanguageInfo` type
- `useLanguageStore()` - Pinia store (legacy, currently unused for display)

Cache is shared module-level to avoid repeated fetches.

## Display Rules

- **URLs**: Use ISO codes (`eng`, `arb`)
- **UI**: Always use full display names ("English", "Levantine Arabic")
- **Never** show ISO codes to users except in URLs

## Navigation Pattern

Pages use `useRoute()` to read language params from URL. When params change, watchers reload data (components are reused by Vue Router).

Breadcrumb links on situations page allow users to navigate back up the language selection hierarchy.

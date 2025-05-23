# Terminologies

## 1. `app/`
- Here we have files that define what "screens" the app has and what exists in each screen, i.e. `index.tsx` (home screen), `profile.tsx` (profile screen), etc, and each screen can have different "components" i.e. search bar, movie card, etc. 

## 2. `_layout.tsx`
- Defines the layout (text, icon, colour, fontsize, etc) for each screen
- Note: `_layout.tsx` files in subfolders override the layout of their parent folders
- `app/_layout.tsx` defines the layout for all files in the `app/` folder.
- `app/(tabs)/_layout.tsx` defines the layout for files in the `(tabs)` folder (overwrites the `_layout.tsx` in parent `app/` folder)

## 3. `(tabs)`
- Screens here will automatically show up as tabs / exist in the form of tabs. To switch between the screens defined in this folder tap on the respective tabs.
# YOW MVP QA Checklist

Run these in order. Tick each box as you go. Report any failure back to engineering immediately — do not skip ahead.

---

## Priority 1 — Autosave (do this first, highest data-loss risk)

### Immediate refresh
- [ ] Open a project and type several paragraphs in a scene
- [ ] Hard-refresh the tab immediately (Ctrl+Shift+R / Cmd+Shift+R) without waiting
- [ ] **Pass:** typed content is still there after refresh
- [ ] **Fail:** content is gone or partially missing

### Scene switching
- [ ] Type content in Scene A
- [ ] Click a different scene in the sidebar (Scene B)
- [ ] Click back to Scene A
- [ ] **Pass:** Scene A content is exactly as you left it
- [ ] **Fail:** Scene A content is blank or partially lost

### Tab close and reopen
- [ ] Type content in a scene
- [ ] Close the browser tab completely (not just refresh)
- [ ] Reopen the app and navigate back to the same scene
- [ ] **Pass:** content survived the tab close
- [ ] **Fail:** content is gone

### Logged-in cloud round-trip
- [ ] Sign in to an account
- [ ] Write something in a scene
- [ ] Log out
- [ ] Log back in
- [ ] **Pass:** content is there from Firestore
- [ ] **Fail:** content is gone after login

### Rapid typing
- [ ] Type quickly and continuously for 30 seconds in a scene
- [ ] Hard-refresh immediately when you stop
- [ ] **Pass:** all typed content is present
- [ ] **Fail:** last few seconds of typing are missing

---

## Priority 2 — Project Types

### Enabled types are selectable
- [ ] Click "New Project" in the library
- [ ] Verify **Novel** is clickable and selectable
- [ ] Verify **Novella** is clickable and selectable
- [ ] Verify **Short Story** is clickable and selectable
- [ ] Verify **D&D Campaign** is clickable and selectable
- [ ] Verify **TTRPG Campaign** is clickable and selectable

### Disabled types show "Soon" and cannot be selected
- [ ] Verify **Play** shows "Soon" badge and cannot be clicked
- [ ] Verify **Screenplay** shows "Soon" badge and cannot be clicked
- [ ] Verify **TV Series** shows "Soon" badge and cannot be clicked
- [ ] Verify **Comic / Graphic Novel** shows "Soon" badge and cannot be clicked
- [ ] Verify **Video Game** shows "Soon" badge and cannot be clicked

### Novella structure labels
- [ ] Create a new **Novella** project
- [ ] Open the project and go to the manuscript
- [ ] **Pass:** structure sidebar shows Part / Chapter / Scene (not Act / Chapter / Scene)
- [ ] **Fail:** shows Act or wrong labels

### Short Story structure labels
- [ ] Create a new **Short Story** project
- [ ] Open the manuscript structure sidebar
- [ ] **Pass:** shows Part / Section / Scene
- [ ] **Fail:** shows wrong labels

### D&D Campaign structure labels
- [ ] Create a new **D&D Campaign** project
- [ ] Open the manuscript/sessions view
- [ ] **Pass:** shows Story Arc / Session / Encounter
- [ ] **Fail:** shows wrong labels

### TTRPG Campaign structure labels
- [ ] Create a new **TTRPG Campaign** project
- [ ] Open the manuscript/sessions view
- [ ] **Pass:** shows Story Arc / Session / Encounter
- [ ] **Fail:** shows wrong labels

### Type persists after edit
- [ ] Create a Novella project
- [ ] Open project settings/edit modal
- [ ] **Pass:** type still shows as Novella (not reset to Novel)
- [ ] **Fail:** type has been reset

---

## Priority 3 — Restore from Backup ZIP

### Export
- [ ] Open any project that has scenes, characters, and lore
- [ ] Open the project export menu
- [ ] Export as **Backup zip**
- [ ] **Pass:** a `.zip` file downloads successfully
- [ ] **Fail:** export fails or produces an empty file

### Restore
- [ ] From the library, click the **Restore** button in the top bar
- [ ] Select the `.zip` file you just exported
- [ ] **Pass:** a new copy of the project appears in the library
- [ ] **Fail:** nothing happens, error appears, or the app crashes

### Restored content integrity
- [ ] Open the restored project
- [ ] Check **chapters and scenes** — all present and readable
- [ ] Check **characters** — all present with correct fields
- [ ] Check **lore entries** — all present
- [ ] Check **timeline events** — all present
- [ ] Check **locations** — all present
- [ ] **Pass:** all content matches the original
- [ ] **Fail:** any section is empty or missing entries

### Restored project is independent
- [ ] Edit a scene in the **restored** project
- [ ] Verify the **original** project is unchanged
- [ ] **Pass:** original is untouched
- [ ] **Fail:** original data was modified

---

## Priority 4 — Authentication

### Fresh sign-up
- [ ] Open the app in an incognito/private window
- [ ] Click "Get started" and sign up with a new account
- [ ] **Pass:** you land in the app with an empty library and can create a project
- [ ] **Fail:** error on sign-up, blank screen, or redirect loop

### Returning user sign-in
- [ ] Sign in with an existing account that has projects
- [ ] **Pass:** existing projects load correctly
- [ ] **Fail:** projects are missing or the page is broken

### Invalid credentials
- [ ] Attempt to sign in with a wrong password
- [ ] **Pass:** a clear error message appears without crashing
- [ ] **Fail:** white screen, unhandled error, or silent failure

### Sign out
- [ ] Sign out from the user menu
- [ ] **Pass:** you are returned to the landing or login screen cleanly
- [ ] **Fail:** app breaks, shows a logged-in state, or errors

### Session restore
- [ ] Sign in and then close the browser completely
- [ ] Reopen the app
- [ ] **Pass:** you are still signed in with your projects visible
- [ ] **Fail:** you are signed out or the session is broken

---

## Priority 5 — Dashboard

### Empty account state
- [ ] Sign in to a fresh account with no projects
- [ ] **Pass:** empty state is shown with a clear prompt to create a project
- [ ] **Fail:** blank page, error, or broken layout

### Create and open a project
- [ ] Create a new project from the dashboard
- [ ] Click the project tile to open it
- [ ] **Pass:** project opens correctly
- [ ] **Fail:** click does nothing or navigates to wrong place

### Rename a project
- [ ] Open project settings (edit modal)
- [ ] Change the title and save
- [ ] **Pass:** new title appears on the dashboard card
- [ ] **Fail:** title reverts or save fails silently

### Delete a project
- [ ] Delete a project from the settings modal
- [ ] **Pass:** project is removed from the library; no orphan data visible
- [ ] **Fail:** project remains, error appears, or other projects are affected

### Many projects
- [ ] Create or load an account with 5+ projects
- [ ] **Pass:** all cards render correctly without layout breaks
- [ ] **Fail:** cards overlap, missing, or dashboard scrolls incorrectly

---

## Priority 6 — Manuscript Editor

### Write and save
- [ ] Open a scene and write at least 3 paragraphs
- [ ] Navigate away and return
- [ ] **Pass:** content is intact
- [ ] **Fail:** content is lost or partially missing

### Add / rename / delete a chapter
- [ ] Add a new chapter
- [ ] Rename it
- [ ] Delete it
- [ ] **Pass:** all operations succeed; structure updates immediately and persists on refresh
- [ ] **Fail:** any operation fails or doesn't persist

### Add / rename / delete a scene
- [ ] Add a scene to a chapter
- [ ] Rename it
- [ ] Move it to a different chapter
- [ ] Delete it
- [ ] **Pass:** all operations succeed and persist on refresh
- [ ] **Fail:** any step fails or doesn't persist

### Long scene performance
- [ ] Paste or write 5,000+ words into a single scene
- [ ] Continue typing at the end
- [ ] **Pass:** no noticeable lag, cursor stays stable
- [ ] **Fail:** typing lags more than ~0.5s, cursor jumps, or the editor freezes

### Word count accuracy
- [ ] Write a known number of words in a scene (e.g. paste 100 words)
- [ ] **Pass:** word count shown for the scene/chapter/project matches within ±5 words
- [ ] **Fail:** count is significantly wrong or missing

---

## Priority 7 — Worldbuilding

### Characters
- [ ] Create a character with name, description, and relationships
- [ ] Hard-refresh
- [ ] **Pass:** character and all fields are intact
- [ ] Edit the character, save, refresh — changes persist
- [ ] Delete the character — it is removed from lore links and timeline links
- [ ] **Fail:** any of the above fails

### Locations
- [ ] Create a location, hard-refresh — location persists
- [ ] Edit the location — changes persist on refresh
- [ ] Delete the location — removed from lore/timeline links
- [ ] **Pass/Fail:** as above

### Lore
- [ ] Create a lore entry, hard-refresh — entry persists
- [ ] Edit — changes persist
- [ ] Delete — entry is gone
- [ ] Search/filter — entries are found correctly by name and category
- [ ] **Pass/Fail:** as above

### Timeline and World History
- [ ] Create a timeline event, hard-refresh — event persists
- [ ] Link an event to a world history entry
- [ ] Unlink it
- [ ] Delete the event
- [ ] **Pass:** all operations persist on immediate refresh
- [ ] **Fail:** any step fails or reverts

---

## Priority 8 — Exports

### Project ZIP export
- [ ] Export a project with characters, lore, and scenes as a backup zip
- [ ] Open the ZIP and verify it contains `project-data.json`, `data/characters.json`, `data/scenes.json`, etc.
- [ ] **Pass:** ZIP is valid and contains all data files
- [ ] **Fail:** ZIP is empty, corrupt, or missing sections

### Manuscript DOCX export
- [ ] Export the manuscript as a Word document (.docx)
- [ ] Open the file in Word or Google Docs
- [ ] **Pass:** chapters and scenes are in the correct order; text is readable
- [ ] **Fail:** file won't open, content is out of order, or scenes are missing

### PDF export
- [ ] Export the project as a Visual PDF (try at least one theme)
- [ ] Open the PDF
- [ ] **Pass:** PDF opens, content is readable, ordering is correct
- [ ] **Fail:** export fails, PDF is blank, or content is garbled

---

## Priority 9 — Responsive Layout

### Mobile (375px width)
- [ ] Open the app at 375px viewport width (DevTools → responsive mode)
- [ ] Verify the library/dashboard is usable
- [ ] Navigate into a project and verify the manuscript Write button is visible and tappable
- [ ] Verify the bottom tab bar appears in the manuscript view
- [ ] Verify no buttons overlap or are cut off
- [ ] **Pass:** all core actions are reachable
- [ ] **Fail:** any key button is hidden, overlapping, or unreachable

### Tablet (768px width)
- [ ] Open the app at 768px viewport width
- [ ] Verify dashboard project cards are usable
- [ ] Verify the manuscript editor fills the available space correctly
- [ ] Verify modals are fully visible and dismissable
- [ ] **Pass:** layout is usable without horizontal scrolling or hidden controls
- [ ] **Fail:** layout breaks, overlaps, or key controls disappear

### Desktop wide (1440px+)
- [ ] Verify the dashboard and manuscript don't stretch to an unusable width
- [ ] **Pass:** content is centred or capped at a readable max-width
- [ ] **Fail:** content stretches edge to edge on very wide screens

---

## Priority 10 — Save and Close Behaviour

### Manuscript flush on navigate away
- [ ] Type in a scene
- [ ] Click to a different section (e.g. Characters) immediately
- [ ] Return to the manuscript
- [ ] **Pass:** content is there
- [ ] **Fail:** content is gone

### "Discard changes?" prompt on dirty modals
- [ ] Open the project edit modal and change the title (do not save)
- [ ] Click Cancel or the X button
- [ ] **Pass:** a "Discard changes?" confirmation appears
- [ ] **Fail:** modal closes silently and the change is lost

### Click-outside closes modals
- [ ] Open any modal
- [ ] Click outside the modal area
- [ ] **Pass:** modal closes without saving unintended changes
- [ ] **Fail:** modal stays open, crashes, or saves without confirmation

---

## Priority 11 — Large Project Performance

### Stress project load
- [ ] Create or load a project with: 10+ characters, 50+ scenes, 5+ lore entries, 10+ timeline events
- [ ] Open the dashboard — verify it loads in under 3 seconds
- [ ] Open the manuscript — verify the scene list renders without lag
- [ ] Run a search/filter in Characters — results appear quickly
- [ ] Export the project as ZIP — export completes without timing out
- [ ] **Pass:** all operations are usable with no significant lag
- [ ] **Fail:** any operation is noticeably slow or crashes

---

## Sign-off

| Area | Tester | Date | Result |
|---|---|---|---|
| Autosave | | | |
| Project types | | | |
| Restore from ZIP | | | |
| Authentication | | | |
| Dashboard | | | |
| Manuscript editor | | | |
| Worldbuilding | | | |
| Exports | | | |
| Responsive layout | | | |
| Save and close | | | |
| Large project performance | | | |

**Launch gate:** All Priority 1–4 items must pass. Priority 5–11 failures must be triaged against the Launch Blocker Policy before any item is allowed to block launch.

# Sandhu XP

My portfolio as a Windows XP-style desktop: boot screen → login → desktop with folders, a Start menu and taskbar.
The old scrolling site lives in `classic/` (the **Classic Mode** button on the login screen and in the Start menu).

## Adding or changing content

All content lives in `content/`. You never need to touch the code.

1. Drop photos, videos, PDFs, Word docs or MP3s into the matching folder (see `content/PLAN.md` for what goes where).
2. Fill in that folder's `info.txt` (copy `content/_INFO-TEMPLATE.txt`). Lines starting with `#` are ignored.
3. Rebuild the site data:

   ```
   node tools/build-content.js
   ```

4. Preview locally:

   ```
   node tools/serve.js
   ```

   Then open http://localhost:5173

**Tips**
- Files show in name order: prefix them `01_`, `02_`… Name the main photo `cover.jpg`.
- Descriptive filenames become captions automatically (`MirrorSelfieWithDrone.jpg` → "Mirror Selfie with Drone"). Override any caption under `PHOTO CAPTIONS:` in `info.txt`.
- A folder whose name starts with a number inside a project (like Happy Plug's `01_idea-and-sketches`) becomes a step on the **Build Timeline**. Add a `notes.txt` to describe the step.
- YouTube links in a project's `LINKS:` field show up in its **Videos** tab.
- Keep videos under ~25 MB (GitHub rejects files over 100 MB). Put long videos on YouTube instead.
- Files or folders starting with `_` are hidden.

## Deep links

Every window has its own link, which is handy for sending a recruiter straight to something:
`/#/p/happy-plug` (a project), `/#/f/work-experience/construction` (a folder), `/#/about`, `/#/music`, `/#/socials`, `/#/ideas`.

## Deploying (GitHub + Render)

1. Push this folder to a GitHub repo.
2. In Render: **New → Blueprint**, then pick the repo. `render.yaml` sets it up as a static site that runs `node tools/build-content.js` on every push.

## Structure

```
index.html            XP shell
xp/xp.css             styles (window chrome comes from XP.css via CDN)
xp/os.js              window manager, boot/login, desktop, taskbar, start menu
xp/apps.js            Explorer, project viewer, picture viewer, music, Messenger, Outlook, WordPad, About
xp/icons.js           original SVG icon set
xp/data/tao.js        Tao Te Ching, James Legge translation (public domain)
xp/data/content.js    generated from content/ (don't edit by hand)
tools/                build + local server scripts
classic/              the old site
```

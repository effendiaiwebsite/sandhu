# SandhuXP: Build Plan & Content Checklist

## 1. The experience (what a visitor sees)

1. **Boot screen (2–3 s):** black screen with a "Sandhu XP" logo and the XP loading bar. You can skip it with a click.
2. **Login screen:** the blue XP "To begin, click your user name" screen. It has one user tile with your photo, **Satinder Sandhu**, and a subtitle ("Engineer · Builder · Cybersecurity"). Click it → XP startup sound (muted by default, with a toggle) → the desktop.
3. **Desktop:**
   - **Wallpaper:** a Bliss-style hill at golden hour, with the **Tao Te Ching verse of the day** overlaid in the corner, the way BGInfo shows text on a desktop. There are 81 chapters and they rotate by day of the year. Clicking the verse opens it in Notepad with the full chapter.
   - **Taskbar:** a green Start button, a button for each open window, and a system tray with a working clock, a volume icon (the music player), and a "network" icon that links to your socials.
   - **A balloon tip** pops up once: *"Welcome! Start with My Projects or open About Me."* It points new visitors to the right place.
4. **Windows** can be dragged, minimized, maximized and closed, and several can be open at once, like real XP. Folders open in an **Explorer window** with a blue left sidebar ("File and Folder Tasks") and icon view.
5. **On a phone**, the site switches to a "Pocket PC" mode: the same icons in a grid, and each window opens full screen with a back button. Dragging windows on a phone is miserable, so we skip it there.

## 2. How the information is organized (desktop stays clean: 8 icons)

The rule is that every item is **at most 2 clicks from the desktop**, and every desktop icon is also in the Start menu.

| Desktop icon | XP look | What's inside |
|---|---|---|
| **About Me** | "My Computer" → *System Properties* window | Tabs: General (photo, bio, degrees), Hardware (skills as "installed devices"), Certificates, a Resume.pdf button |
| **My Projects** | Explorer folder | Drone · Happy Plug · Aeroponics (India) · Aeroponics: Frieden Electric, Chile · Cybersecurity (subfolder) |
| **Work Experience** | Explorer folder | Construction (3 subfolders: Labourer → Traffic Control → Safety Officer, shown as a promotion path) · Sales · Freelance Web Developer |
| **Software** | "Program Files"-style folder | One icon per app. Opening it shows screenshots, a description and a "Launch" button |
| **My Documents** | Explorer folder | Writing: School · LinkedIn · Facebook · Other. Each piece opens in a **Word/WordPad-style** reader |
| **My Music** | **Winamp / Windows Media Player** window | Playlist, play/pause, visualizer |
| **MSN Messenger** | Messenger buddy list | Socials: each contact is a platform (LinkedIn, GitHub, Instagram…) with a status line |
| **Ideas & Collabs** | **Outlook Express** window | An "Inbox" of your open ideas (each one an email you can read) and a **Compose** button that sends you a message |
| Recycle Bin *(optional, fun)* | Recycle Bin | Drone crashes, failed prototypes, bloopers. It shows you're human, and recruiters love this |

**How a project opens.** Clicking *Happy Plug* opens a project window with:
- left: a cover photo, dates, role, tech tags, links
- right: tabs for **Overview · Development Timeline · Gallery · Videos**
- The **Development Timeline** for Happy Plug follows the stage folders (Idea → Prototype → Hardware → App → Testing → Final), with photos at each step.
- Photos open in the **Windows Picture and Fax Viewer** (next/previous arrows). Videos open in a **Windows Media Player** window.

**Freelance websites:** each site is an icon showing its screenshot. Selecting it shows a description in the side panel, and double-clicking opens the live site in a new tab.

## 3. How it will be built

- **Plain HTML + CSS + JavaScript, no build step.** It runs anywhere: GitHub Pages, Netlify, or your current host.
- **XP.css** (open-source library) for authentic window chrome, buttons and tabs, with custom CSS for the login screen, desktop and taskbar.
- **All content lives in one data file (`content.js`).** To add a project later, you add a block of text and drop the photos in a folder, and no layout code changes. This is the most important design decision. It keeps the site easy for you to maintain.
- **Images** get auto-resized to ≤1600 px and compressed (WebP) so the site loads fast.
- **Videos:** short clips (<30 s) are compressed to small MP4s and hosted on the site. Longer videos go on YouTube (unlisted is fine) and get embedded in the Media Player window.
- **Tao Te Ching quotes** come from the **James Legge translation (1891, public domain)**. Popular translations like Stephen Mitchell's are copyrighted and can't legally be put on the site.
- **Accessibility/SEO:** a hidden plain-text version of all content, so Google and recruiters' screen readers can still read everything. Double-click works, and so does a single tap/Enter.
- **Your old site** lives in `classic/`, reachable from the **Classic Mode** button on the login screen and in the Start menu.
- **Hosting:** GitHub + Render (see `README.md`). Startup sound is **off** by default, with a speaker toggle in the tray.

**Build order:** (1) shell: boot, login, desktop, taskbar, Start menu, window manager → (2) Explorer, project window, picture viewer, IE window → (3) Media Player, Messenger, Outlook, Word reader, wallpaper quotes → (4) load your content → (5) mobile mode, performance, polish.

## 4. What you need to collect (put it in the matching `content/` folder)

**General rules for every folder**
- Copy `_INFO-TEMPLATE.txt` into the folder as `info.txt` and fill it in. Rough notes are fine.
- Name photos in the order you want them shown: `01.jpg`, `02.jpg`… Put captions in `info.txt`.
- Pick your best photo for each item and name it `cover.jpg`.
- Any phone photo is fine; I'll compress them. Landscape works better than portrait.
- **Blur faces of other people and licence plates**, especially on construction sites, unless you have permission.

### 00_about-me
- [ ] 1 square headshot (login screen avatar) *(you already have `Satinder San (1).png`, so it can be reused)*
- [ ] Short bio, 3–5 sentences, written casually
- [ ] Skills list (grouped: Engineering / Software / Cybersecurity / Trades / Soft skills)
- [ ] Certificates *(A+ and B.Tech already exist, add Network+, first aid, TCP, CSO tickets, etc.)*
- [ ] Latest resume PDF *(confirm which of the two existing PDFs is current)*

### 01_projects/01_drone
- [ ] `info.txt`: frame, motors, flight controller, purpose, flight time, what broke
- [ ] Photos: parts laid out, build in progress, wiring close-up, finished drone
- [ ] `videos/`: test flights. Clips under 30 s here, longer ones as YouTube links in `info.txt`
- [ ] Crash footage → `10_recycle-bin-bloopers` 😄

### 01_projects/02_happy-plug (the showcase, show the whole development cycle)
For **each** of the 6 stage subfolders, add photos plus a short `notes.txt` (2–4 lines: what happened at this stage, what problem you solved):
- [ ] `01_idea-and-sketches`: notebook sketches, whiteboard, early diagrams
- [ ] `02_first-prototype`: breadboard, first working version
- [ ] `03_hardware-and-circuits`: PCB designs, soldering, schematics, enclosure
- [ ] `04_app-and-software`: app screenshots, code snippets, architecture diagram
- [ ] `05_testing`: test rigs, failures, measurements
- [ ] `06_final-product`: polished product photos, installed in a home, any demo video
- [ ] Main `info.txt`: overall summary, customers/users, sales, awards

### 01_projects/03_aeroponics-india and 04_aeroponics-chile
- [ ] `info.txt` for each (Chile = Frieden Electric, Startup Chile, the $15k grant, Santiago, *already partly written on your current site*)
- [ ] Photos: system build, plants/root growth over time, sensors/electronics, before/after
- [ ] Tribune news article link *(already have it)* and any other press
- [ ] Yield or growth numbers if you have them (people remember numbers)

### 02_cybersecurity
One subfolder per project (rename `project-1-name-here`):
- [ ] `info.txt` (tools: Wireshark, Kali, Autopsy, etc.; what you found or learned)
- [ ] Screenshots of tools/results. **Remove any real IPs, passwords, names or client data.**
- [ ] Links to GitHub repos / write-ups / CTF profiles (TryHackMe, HackTheBox)
- [ ] BCIT lab work you're allowed to share

### 03_work-experience/construction
- [ ] `01_labourer` / `02_traffic-control` / `03_safety-officer`: photos plus a short `info.txt` each (dates, company or "Confidential", responsibilities)
- [ ] Safety Officer: anything showing responsibility (toolbox talks, inspection checklists **with company names blurred**, tickets/certs)
- *(labour1/labor2/labor3.jpg already exist; tell me which job they belong to)*

### 03_work-experience/sales
- [ ] `opinions/`: 2–4 short essays (Word, Google Doc or plain text), e.g. "What I learned making 100 cold calls", "Why most pitches fail"
- [ ] `sample-pitches/`: 2–4 pitches (script, email or slide deck PDF)
- [ ] `info.txt`: where you sold, what, any numbers (quota hit %, revenue)

### 04_freelance-websites
One subfolder per site:
- [ ] Live URL in `info.txt`, plus client type, what you built, stack, year
- [ ] A screenshot of the homepage (`cover.png`) plus 1–3 inner pages
- [ ] A small logo/favicon of each site if you have one (becomes the desktop icon)
- *(Already have: Gator Bookkeeping, Houses in BC, IJT. Are there more?)*

### 05_software
One subfolder per app:
- [ ] `info.txt`: what it does, who it's for, launch link, GitHub link, demo login (**demo account only**)
- [ ] 3–5 screenshots showing the main flow
- *(Already have: Sales CRM. IJT may belong here too since it's also Android/iOS.)*

### 06_writing
- [ ] Each piece as `.docx`, `.pdf`, `.txt`, or a screenshot of the post
- [ ] For each: title, date, and where it was published (one line in `info.txt` is enough)
- [ ] For LinkedIn/Facebook, the post link is enough if the post is public. I'll copy the text in.

### 07_music
- [ ] Your own tracks as `.mp3` (or `.mp4`), named in play order: `01_song-name.mp3`
- [ ] Optional: `cover.jpg` and track captions in `info.txt`

### 08_socials
- [ ] `links.txt`: one line per platform (LinkedIn, GitHub, Instagram, YouTube, Facebook…) with the URL and a funny MSN-style status message, e.g. *"LinkedIn: (Busy) networking 🤝"*
- [ ] Your contact email (current site uses satindersandhu138@gmail.com, still right?)

### 09_ideas-and-collabs
- [ ] 3–8 ideas, each as a few lines: name, the problem, what help you're looking for (co-founder, funding, a developer, a farmer to test with…)
- [ ] How people should reach you (email only, or should the Compose button send a form message? A form needs a free Formspree account)

### 10_recycle-bin-bloopers (optional)
- [ ] Crashes, burnt boards, failed builds, with a one-line funny caption each

## 5. Decisions made
1. Music: my own music. Drop the files in `07_music` (MP3 or MP4; MP4s also get a "Watch video" button).
2. Hosting: GitHub + Render.
3. Old site: kept as Classic Mode.
4. Startup sound: off by default.

# Bag of Holding — Development Plan

## Context
Bag of Holding is a D&D 5e character-sheet app (React 18 + Vite frontend, Flask + SQLAlchemy + JWT backend, Postgres, dnd5eapi.co for game data), built by a 4Geeks bootcamp team. The goal is to turn it into a secure, polished public/portfolio app that the user maintains. The Phase 1 audit (findings from reading the code, not yet tested) found working core flows (auth, character create/select, character sheet, spells, dice) but critical security holes: no endpoint checks the JWT, so anyone can read or edit any character; `/admin` and `GET /api/user` are open; the signing secret is the committed placeholder "any key works". It also found sheet bugs, stale dependency/deploy config, and no tests.

**User decisions (recorded):**
- Base: `finalize-project` branch.
- Repo: fork to the user's GitHub account.
- Audience: public / portfolio.
- Launch scope (in order): security + bug fixes → character management → mobile layout.
- Inventory is the first feature after launch; password reset by email also comes after launch.
- Design: keep the current dark/accent look and polish it, removing the 4Geeks branding.

**Working rules:**
- One task per feature branch, merged to `main`.
- Explain significant changes before making them.
- Ask before adding dependencies or making architectural changes.
- Never claim something works without running it.
- No public deploy, purchases, or force-pushes without explicit approval.

---

## Step 0 — Setup (first actions after approval)
1. **Fork:** done — `origin` = github.com/RicardoLeidenz/Bag-Of-Holding, `upstream` = 4GeeksAcademy. Local `main` = `finalize-project` + fork README commits (not yet pushed).
   - Re-point `origin` to the fork and keep `upstream` pointing at the original.
   - Merge `origin/finalize-project` into `main`, fast-forwarding if possible.
2. **Write the roadmap:** save it as `DEVELOPMENT_PLAN.md` at the repo root and commit it on branch `docs/development-plan`.
3. **Run locally on SQLite:**
   - Create `.env` with `VITE_BACKEND_URL=http://localhost:3001/` and no `DATABASE_URL`.
   - Run `pipenv install`, `npm install`, `pipenv run upgrade`, `pipenv run start`, and `npm run dev`.
   - Manually walk through signup → login → create character → edit sheet → spells.
   - Mark each audit finding as **verified** or **not reproduced** in `DEVELOPMENT_PLAN.md`.
4. **Glance at the other branches:** check `stable-branch` (login styling) and `verify-functionality-…` (routes rewrite) for anything worth cherry-picking. Ask before merging either.

---

## Priority 1 — Critical (required to function safely)

**Progress:** 1.1 ✅ · 1.2 ✅ · 1.3 ✅ · 1.4 ✅ · 1.5 ✅ · 1.6 ✅ · 1.7 ✅ (51 pytest tests + 50 headless-Chrome checks, part of 1.9)

| # | Task | Why | Files | Size | Verify |
|---|---|---|---|---|---|
| 1.1 | **Dependency/config cleanup:** delete the stale `requirements.txt`, align Python 3.13 in `render.yaml` and the README, remove the broken `Dockerfile.render`, `public/bundle.js` and the babel block in `package.json`, fix the invalid `.eslintrc`, review `npm audit`, add `JWT_SECRET_KEY` to `.env.example` | Today's Render build would fail; stale files mislead | `requirements.txt`, `render.yaml`, `package.json`, `Dockerfile.render`, `public/`, `.env.example`, `README.md` | S | Fresh `pipenv install` and `npm run build` succeed |
| 1.2 | **Auth on the API:** `JWT_SECRET_KEY` from env (refuse to start in prod without it), identity `str(user.id)`, `@jwt_required()` on all data routes, user taken from the token instead of the request body, ownership checks for character → stat/skill/consumable. Replace `GET /api/user` and the broken `/verify_token` with `GET /api/me`. Add `GET /api/character/<id>` | Anyone can currently read, edit or delete anyone's data | `src/app.py`, `src/api/routes.py` | M | pytest: 401 without a token; 404 for another user's character |
| 1.3 | **Lock `/admin`:** register it only when `FLASK_DEBUG=1` | Gives full DB write access publicly | `src/api/admin.py`, `src/app.py` | S | Prod mode `/admin` → SPA/404; dev still works |
| 1.4 | **Validation and errors:** shared body-validation helper, consistent `{"error": ...}` JSON, length/type checks that match column limits, email format, password minimum length, duplicate email → 409, JSON 500 handler, JSON 404 for unknown `/api/*` paths (they currently fall through to the SPA with 200). Add login rate limiting via **Flask-Limiter (new dependency, will ask)** | Bad input currently causes 500s; public sites need brute-force protection | `src/api/routes.py`, `src/api/utils.py` | M | pytest cases for missing/oversized fields |
| 1.5 | **Frontend API client:** one `src/front/api.js` wrapper (base URL normalization, same-origin default in prod, `Authorization` header, 401 → logout) used everywhere. Remove the `BackendURL` gate | 7 copies of raw `fetch`; deploys break on a missing trailing slash | `src/front/api.js` (new), `main.jsx`, the pages and components that call `fetch` | M | Build passes; all flows work in the browser |
| 1.6 | **Session and routing:** store loads the token from localStorage; `ProtectedRoute`; character page at `/character/:id` loads from the API (fixes data loss on refresh); 404 element | Refresh loses or crashes the sheet; logged-out users can open pages | `store.js`, `routes.jsx`, `pages/Character.jsx`, `pages/CharacterSelection.jsx`, `Navbar.jsx` | M | Refresh on the sheet keeps the data; logged out → redirect to login |
| 1.7 | **Sheet bug fixes:** see the list below this table | Wrong game numbers and duplicate data | `characterSite/*`, `store.js`, `pages/Character.jsx`, `characterCreation/SubclassSelector.jsx` | M | Manual check against hand-computed modifiers; no duplicate consumables |
| 1.8 | **Migrations and commands:** confirm the squashed migration builds a fresh SQLite and Postgres DB; fix `insert-test-users` (hash passwords) | Deploy runs `flask db upgrade` | `migrations/`, `src/api/commands.py` | S | `pipenv run upgrade` on an empty DB |
| 1.9 | **Backend test suite:** pytest + Flask test client on in-memory SQLite, `conftest.py` fixtures, a `pipenv run test` script. Covers auth, character CRUD, ownership, stats, consumables | Safety net for every later change | `tests/` (new), `Pipfile` | M | `pipenv run test` passes |

**Task 1.7 bug list** (all reproduced in headless Chrome before fixing, re-checked after):
- ~~`SkillsTable.jsx:47` uses the wrong ability (`pair[0]` should be `pair[1]`).~~ Fixed.
- ~~`Character.jsx:43` passes HP into the Hit Dice field.~~ Fixed early in 1.4 (validation would otherwise reject saves).
- ~~The `state` → `store` typos in `store.js`.~~ Fixed.
- ~~Props copied into local state go stale; fix by keying components on the character id.~~ Done in 1.6 (sheet keyed on character id, only rendered once loaded).
- ~~`ConsumablesTable` makes POST calls inside a setState updater and drops the new consumable's id.~~ Fixed (was creating 2 rows per add in dev).
- ~~`StatBlock` saves on every keystroke; switch to saving on blur, with NaN guards.~~ Fixed.
- ~~The subclass list isn't filtered by class; use `/classes/{index}/subclasses`.~~ Fixed.
- Found during 1.7, also fixed: sheet edits were lost unless Enter was pressed before Save; Passive Perception always added proficiency; saving throws concatenated text ("3"+"2"); Save gave no feedback; `<thead>` markup invalid.

## Priority 2 — Important (also required for the public launch)

| # | Task | Why | Files | Size | Verify |
|---|---|---|---|---|---|
| 2.1 | **Character management:** delete with confirmation, rename, editable skill proficient/expert and saving-throw proficiency. Backend routes `PUT /api/skill`, stat `proficient` field, character `name` | Your launch priority #1 | `routes.py`, `CharacterSelection.jsx`, `SkillsTable.jsx`, `StatBlock.jsx`, `CharacterInfoBlock.jsx` | M | pytest plus a manual end-to-end check |
| 2.2 | **Mobile-friendly layout:** responsive grid (`col-12 col-md-*`), collapsible navbar, stacked spell levels, touch-sized inputs | Your launch priority #2 | `pages/*.jsx`, `src/styles/*.css`, `Navbar.jsx` | M | Browser devtools at 375px, 768px and 1280px |
| 2.3 | **UX polish:** loading and error states, inline form errors instead of `alert()`, empty states, remove `console.log` | Public users need feedback | Pages and components | S–M | Manual: offline backend, bad login, empty lists |
| 2.4 | **Branding:** own favicon and title, remove 4Geeks pages and assets, local default portrait (no Pinterest hotlink), footer credits, README setup section corrected (project description already rewritten in the fork) | Portfolio quality | `index.html`, `public/`, `docs/`, `Footer.jsx`, `CharacterInfoBlock.jsx`, `README.md` | S | Visual check |
| 2.5 | **Quality gates:** `npm run lint` clean, GitHub Actions CI running pytest + `npm run build` on each push or PR | Catches regressions automatically | `.github/workflows/ci.yml` (new) | S | Green CI run on the fork |
| 2.6 | **Production hardening and deploy (Phase 6):** confirm rate limiting sees real client IPs behind Render's proxy (`ProxyFix x_for=1` is an assumption), gunicorn start, build script, prod env vars, CORS limited to the app origin, `FLASK_DEBUG=0`. Hosting: compare Render free web service + Render Postgres (free tier time limits) against Neon free Postgres, confirm current limits, recommend, then **get approval before going public**. Auto-deploy from `main` | Launch | `render.yaml`, `render_build.sh`, `src/app.py` | M | Live smoke test of the full flow plus a mobile check |

**Launch = Priority 1 + Priority 2.**

## Priority 3 — Post-launch
1. **Inventory (first):** Item/CharacterItem API, item catalog (dnd5eapi equipment plus custom items), quantity and equip toggle, a real UI replacing `item.js`. Remove the dead `Inventory.jsx`/`Bag.jsx`.
2. **Password reset by email** (e.g. Resend free tier).
3. **Spells per character:** known and prepared spells.
4. **Tooling upgrades:** Vite 4→latest (clears the dev-server-only esbuild advisory), React Router 6→7 (clears 2 moderate advisories that don't apply to this app: open redirect needs user-supplied link targets, the other is SSR-only), ESLint 9; frontend unit tests with Vitest.
5. **Character portrait upload** (Cloudinary is already in the Pipfile).
6. **Token hardening:** httpOnly cookie sessions or refresh tokens.

## Verification approach (every task)
- **Backend:** `pipenv run test`. **Frontend:** `npm run build` and `npm run lint`. Then a manual browser walk-through of the affected flow with both servers running.
- Each task's notes say which parts were **tested** and which are **assumed**.

---

## Audit verification status
Findings from the Phase 1 audit, updated as they are reproduced locally.

Checked 2026-10-28 on `finalize-project` (Python 3.13.5, Node 24, SQLite), by calling the API with curl and running build/lint. The UI has **not** been clicked through in a browser yet, so the frontend bugs are still unverified.

| Finding | Status |
|---|---|
| Squashed migration builds a fresh DB | **Verified** on SQLite (Postgres still to check) |
| `GET /api/user` lists all users + characters with no token | **Verified** → fixed in 1.2 (route removed) |
| Any user's characters readable/editable with no token (`/user/<id>/characters`, `PUT /character`, `PUT /stat`) | **Verified** → fixed in 1.2 (tests in `tests/test_authorization.py`) |
| `/admin/` open | **Verified** (HTTP 200) → fixed in 1.3 (development only) |
| Missing field on signup → 500 `KeyError` | **Verified** → fixed in 1.4 (400 with message) |
| `/api/verify_token` → 500 `NameError` | **Verified** → fixed in 1.2 (replaced by `GET /api/me`) |
| Integer JWT identity can't be decoded (jwt-extended 4.7.1) | **Verified** → fixed in 1.2 (identity is `str(user.id)`) |
| Duplicate signup rejected | Verified, returned 401 → fixed in 1.4 (409) |
| Over-length names → DB error | **Not reproduced** on SQLite (doesn't enforce lengths); expected on Postgres |
| `npm run build` | **Passes** |
| `npm run lint` | Was broken (invalid `.eslintrc`). Fixed in 1.1 → now reports 77 problems (18 errors, 59 warnings), cleaned up in 2.5 |
| `npm audit` | 17 → 4 after `npm audit fix` in 1.1 (no major upgrades). Remaining 4 need major upgrades → P3.4 |
| `store.js` undefined `state` | **Verified** by ESLint (8 × `no-undef`) |
| Character page loses data on refresh | **Verified** fixed in 1.6 (headless Chrome: reload keeps the sheet) |
| Access tokens expired after 15 min (library default) | Found in 1.6 → now 12 h (`JWT_ACCESS_TOKEN_EXPIRES`) |
| Other frontend bugs (task 1.7 list) | From code reading; verify in browser during 1.7 |

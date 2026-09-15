# Implementation Plan

## Phase 1: Environment & Database Scaffolding
1. **Initialize Monorepo:** Setup Node.js backend and Vite-React frontend in a unified folder structure (`/server` and `/client`).
2. **Prisma Setup:** Define the `Team`, `Order`, and `Mail` models in `schema.prisma` targeting SQLite.
3. **Database Seed:** Write a script to instantiate the Admin account and default Admin Standing Orders.

## Phase 2: Server & Real-time Engine
1. **Express & Socket.IO:** Configure the Express server to serve the React `dist` folder and establish Socket.IO connections.
2. **Authentication Flow:** Create the Admin login `.env` check and the Team ID/Password JWT generation.
3. **Order Engine Logic:**
   * Write the escrow validation function (locking resources when an order is created).
   * Write the execution function (swapping assets atomically, unlocking escrow, generating Mail).
   * Emit broadcast events (`ledger_update`, `team_hud_update`, `new_mail`).

## Phase 3: Admin UI Development
1. **Layout:** Build the sidebar navigation.
2. **Onboarding Page:** Implement CSV parsing and the Region dropdown assignment table. Generate credentials and bulk-insert to DB.
3. **Leaderboard Page:** Build the live grid. Add inline editing inputs to allow the Admin to modify Food/Material/Gold.
4. **God Mode Ledger:** Build the order table with Read/Update/Delete buttons.

## Phase 4: Participant UI Development (COMPLETE)
1. **The HUD:** Built the navbar with resource icons. Implemented Socket listeners for real-time updates and the floating `+x/-x` CSS animations.
2. **Mailbox:** Built the popup/sidebar view to display completed trades.
3. **Order Ledger:**
   * Implemented sticky rows for Admin and Private orders.
   * Implemented multi-toggle filters (Resource, Type, Price sort).
   * Built the inline "Create new order" row at the bottom with dropdowns and escrow validation feedback.

## Phase 5: UI/UX Theme Implementation (COMPLETE)
* **Theme Clause:** Applied Shatranj's thematic identity (The Empire of the Sun) to the UI. Replaced generic UI elements with an imperial, desert aesthetic (parchment, heavy stone grays, and bright gold accents).
* **Aligning with Official Docs:** Integrated the actual official 10 regions (e.g., *The Eastern Granite Quarries*, *Delta Basin*, *Fayum Oasis*, etc.) directly from `geography.MD` and `Regions.txt`. "The Citadel" has been formally renamed to **The Imperial Citadel**.

## Phase 6: Testing & Deployment (COMPLETE)
* **Load Test:** Connect 10 browser tabs simultaneously, spamming orders to verify the in-memory escrow lock prevents double-spending.
* **Network Test:** Run the server, connect a phone via local Wi-Fi router, and test the IP accessibility (`192.168.x.x:3000`).

## Phase 7: State Persistence, Backup & Save/Load System
1. **Atomic Backup Daemon:**
   * Automated 60-second periodic backup writing to a temporary file (`saves/.tmp.json`) and renaming atomically to `saves/backup.json`. Active strictly when game is running (`gameState === 'RUNNING'`).
   * Manual backup trigger (`POST /api/game/backup`) updating `backup.json` immediately on demand (disabled when game is `NOT_STARTED` or `PAUSED`).
2. **Discrete Save System:**
   * "Save Game" functionality creating discrete timestamped snapshot files (`saves/save_YYYY-MM-DD_HH-mm-ss.json`).
3. **Restoration / Load System:**
   * "Load Game" endpoint (`POST /api/game/load`) that atomically restores database state (Teams, Orders, Escrows, Mails) inside a single Prisma `$transaction` and **strictly forces `gameState = 'PAUSED'`** on load for Game Master safety.
   * Dropdown selector in the Admin Dashboard listing all discrete files in `/saves` alongside the live `backup.json`.
4. **Admin UI Controls (Strictly Admin-Only):**
   * `<Manual Backup>` button in Admin sidebar navigation:
     - Disabled/greyed out when `gameState === 'NOT_STARTED'` or `gameState === 'PAUSED'` with tag displaying `Backup Engine Inactive`.
     - Enabled when `gameState === 'RUNNING'`. Initially displays `No backup taken` upon game start until a backup is taken, then displays `Last Backup: [timestamp]`.
   * `Save Game` button and `Load Game` selector in Admin Dashboard.
   * `Reset Game` completely purges all onboarded teams, player orders, and mail, resetting the realm back to a clean slate with default Admin Standing Orders and resetting session backup timestamps.





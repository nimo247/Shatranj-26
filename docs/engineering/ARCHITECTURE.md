# Architectural Blueprint

## 1. Top-Level Design
To guarantee sub-millisecond latency, 100% offline capability, and rapid deployment at a live event, Shatranj uses a **Single-Port Monorepo Architecture** hosted on a local network (e.g., `192.168.1.100:3000`).

The Node.js (Express) server simultaneously handles Socket.IO events, REST APIs, and serves the compiled React (Vite) static files. This eliminates CORS issues and dual-server setup on the event floor.

## 2. Tech Stack
* **Backend:** Node.js, Express.js.
* **Real-time Engine:** Socket.IO (for tick-less instant ledger updates, order execution, and HUD changes).
* **Database & ORM:** SQLite with Prisma ORM. SQLite is configured with WAL (Write-Ahead Logging) for atomic, concurrent reads/writes.
* **Frontend:** React 19, TypeScript, Vite, TailwindCSS (for the imperial Shatranj theme), Lucide React (for resource icons).

## 3. Core Mechanisms (Aarohan '26 Inspired)
* **In-Memory Order Engine:** To prevent race conditions (two teams clicking "Accept" simultaneously), the Node.js event loop acts as a single-threaded queue. The first socket event executes the trade, updates memory, flushes to SQLite, and broadcasts a ledger update. The second event instantly receives an "Order already taken" rejection.
* **Strict Escrow Locking:** When a team places a sell order for 100 Food, that amount is immediately moved from `available_food` to `escrow_food`. This mathematically prevents double-spending.
* **Session Persistence:** JWTs or Team Tokens are stored in the client's `localStorage`. If a tablet goes to sleep or is refreshed, the React app automatically re-authenticates and joins the Socket.IO room without forcing a manual re-login.

## 4. Data Model Overview
* `Team`: Core participant object holding balances (Food, Material, Gold) and escrow limits.
* `Order`: P2P or Admin market trades (Buy/Sell, Amount, Price).
* `Card`: Assignable infrastructure (Standard/Elite, Build Costs, Sustain Costs, Returns). Features `isBuilt`, `isActive`, and `isDisabled` states.
* `ActiveDebuff` / `CustomDisaster`: Live modifiers affecting production.
* `RoundSnapshot`: Stringified JSON blob of game state per round for replayability.
* `Transaction / Mail`: Receipts.

## 5. Game Engines

### The Round Engine (`rounds.ts`)
- Computes aggregate resource deltas per team based on Active cards.
- **Isolates Elite Cards**: The engine splits `normalFoodReturn` from `eliteFoodReturn` when applying percentage-based disaster modifiers. This mathematically guarantees Elite Cards are immune to disasters while still producing resources.
- Commits atomic transactions bumping round numbers, deducting sustains, and adding returns.

### The Disaster Engine (`disasters.ts`)
- Applies both one-off "Flat Losses" (e.g. -400 Gold) and prolonged "Percentage Modifiers" (e.g. -50% Food Yield).
- **Max Cap Safety**: Flat losses are strictly capped at a percentage of a team's total inventory using `Math.min(flatLoss, inventory * maxCap)`. This acts as an anti-wipe safety net, but can also be manipulated by Admins (via massive flat limits) to enact precise percentage wealth wipes (e.g., King's Wrath).

### The Card Engine
- Enforces strict UI locking. Cards must be "Built" to be "Active".
- Admin disable overrides (`isDisabled`) automatically force `isActive: false` instantly.
- Un-building a card automatically drops it out of the active production array.

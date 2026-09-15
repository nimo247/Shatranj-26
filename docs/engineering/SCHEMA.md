# Shatranj Database Schema (SQLite & Prisma)

## Overview
The Shatranj application models a spot-market economy with atomic ledger transactions. There are three core entities: `Team`, `Order`, and `Mail`. 

## Models

### 1. Team
Represents a participating unit or the central Imperial Citadel (`ADMIN`).
- **Identity**: `id` (UUID), `teamId` (Unique String), `teamName`, `password`.
- **Classification**: `role` (TEAM | ADMIN), `region` (String).
- **Resources**: `food`, `material`, `gold` (all Int).
- **Escrow**: `escrowFood`, `escrowMaterial`, `escrowGold` (Int) - These track resources locked in OPEN orders to prevent double-spending.

### 2. Order
Represents a spot-market trade intent on the global or private ledger.
- **Identity**: `id` (Auto-increment).
- **Relations**: `creatorId` (Team), `targetTeamId` (Team, optional for private trades).
- **Trade Params**: `resourceType` (FOOD | MATERIAL), `orderType` (BUY | SELL).
- **Financials**: `amount` (Int, quantity of resource), `price` (Int, gold *per unit*).
- **State**: `status` (OPEN | FILLED | CANCELLED), `isAdminOrder` (Boolean).

### 3. Mail
Represents an in-game notification or message.
- **Identity**: `id` (Auto-increment).
- **Relations**: `teamId` (Team).
- **Content**: `title`, `body`.
- **State**: `isRead` (Boolean).

### 4. Card
Represents assignable infrastructure for teams.
- **Identity**: `id`, `name`, `type` (FOOD | MATERIAL | LUXURY).
- **Stats**: `buildCost`, `sustainCost`, `return`, `nav`.
- **Classification**: `isElite`.
- **State**: `isBuilt`, `isActive`, `isDisabled`.
- **Relations**: `teamId`.

### 5. RoundSnapshot
Atomic JSON dumps of round-by-round game states.
- **Identity**: `id`, `roundNum`.
- **Data**: `data` (Stringified JSON blob).

### 6. ActiveDebuff & CustomDisaster
Live and saved disaster rules and modifiers.
- **CustomDisaster**: `name`, `data` (Saved templates).
- **ActiveDebuff**: `disasterName`, `regions`, `maxCap`, and all percentage modifiers (`foodReturn`, `foodSustain`, etc.).

## State and Escrow Rules
When a Team creates a `SELL FOOD` order, `escrowFood` increases.
When a Team creates a `BUY MATERIAL` order, `escrowGold` increases (calculated by `amount * price`).
When an order is `FILLED`, the escrow is resolved and balances adjust permanently.
When an order is `CANCELLED`, the escrow is reverted to the active balance.

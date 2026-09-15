# Shatranj: Administrator Manual

As the Admin, you control the overarching game state and serve as the central bank (The Imperial Citadel).

## URL and Login
- Access the dashboard at `/admin`.
- Log in using Team ID: `ADMIN` and the password defined by the `ADMIN_KEYWORD` environment variable.

## The Dashboard Panels

### 1. Game State Control
- **NOT STARTED**: Wipes the database, removes all teams, and resets Imperial Orders. 
- **PAUSED**: Halts trading logic. Participants can see the dashboard but cannot place or accept orders.
- **RUNNING**: Trading is active. Triggers the 1-minute automated backup daemon.

### 2. Team Management
- View all active teams, their Regions, and their current balances.
- Use the quick edit tools to instantly manipulate a team's Food, Material, or Gold balances (useful for resolving disputes or injecting stimulus).

### 3. Market Oversight
- View all pending orders across the network.
- As the Admin, you have the unilateral right to delete/cancel any active order on the ledger. This instantly refunds the creator's escrow.

### 4. Manage Imperial Rates
- The Citadel maintains standing orders for Food and Material.
- By default, the citadel BUYS at 2 Gold/unit and SELLS at 1 Gold/unit.
- You can dynamically update these rates.
- You can completely Disable/Enable the Citadel trade via the toggle button, which grays out the option for participants.

### 5. Realm Save/Load (Backups)
- **Automatic Backups**: While the game is `RUNNING`, the server writes an atomic `.json` snapshot of the database to `server/saves/backup.json` every 60 seconds.
- **Manual Save**: You can trigger a named backup at any time.
### 6. Card Engine Oversight
- View all 150+ cards (Standard and Elite).
- Manually assign cards to teams.
- **Toggle Build**: Force a card to be built or un-built (un-building automatically deactivates the card).
- **Toggle Disable**: Force lock a card. If a card is disabled, its active state is shut down. Re-enabling a card keeps it inactive until the player manually re-activates it.

### 7. Round Execution
- **Step Clock**: Use the Log Round button to increment the game state round-by-round.
- Advancing a round calculates the net production and maintenance costs for all teams based on their Active cards and applied Disasters.
- Generates historical Snapshots that can be restored.

### 8. Disaster Execution
- Launch pre-built or Custom Disasters.
- Disasters can inflict flat resource losses (capped by a `maxCap` percentage) or percentage-based debuffs on total production.
- **Elite Cards**: Explicitly shielded from all flat loss and percentage modifier math in the engine.

## Offline / Meta Mechanics (Admin Managed)
- **King's Pity**: Use Custom Disasters with *positive* modifiers or *negative* upkeep to inject buffs/lifelines to struggling teams.
- **King's Wrath**: To wipe a precise percentage of wealth (e.g., exactly 30% of gold), launch a custom disaster with an impossibly high flat loss (e.g., 100,000) and set `maxCap` to `0.30`. The math engine will automatically cap the loss at exactly 30%.
- **Temple Mechanic**: A manual table-top feature. Admins track who pays temple offerings offline and use the Custom Disaster "Region/Team Target" feature to manually grant them immunity or buffs.

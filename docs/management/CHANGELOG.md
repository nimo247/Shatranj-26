# Shatranj Development Changelog

## [Unreleased]
### Added
- Live Ticker on Participant Cards HUD showing exact Net Yield for Next Round.
- Custom Disasters UI and DB schemas.
- Round Engine Logging and Snapshots.
- Admin Control Panel for overriding and bypassing cards/disasters.
- Offline mechanics support (King's Pity, King's Wrath, Temple Mechanic) tracked via manual Admin input and clever maxCap manipulation.

### Fixed
- **Custom Disaster Deletion Crash**: Replaced undefined 	eam_hud_update socket emission with disaster_refresh to safely clear debuffs from client screens without crashing.
- **Player Float Price Escrow Leak**: Enforced Math.round() on player order cancellation refunds, preventing Prisma database crashes (and permanent escrow locks) when floats are injected.
- **Elite Cards Penetrated by Disasters**: Separated 
ormalFoodReturn from eliteFoodReturn in ounds.ts to ensure percentage modifiers mathematically ignore Elite yields while still adding them to the final total.
- **Admin Enable Exploit**: Admin 'Toggle Disable' logic now explicitly defaults to isActive: false upon re-enabling, preventing players from skipping the 'Build' cost requirement.
- **Admin Un-Build Exploit**: Un-building an active card via the Admin panel now synchronously forces the card to deactivate.
- **Misleading Percentage Disasters UI**: Stripped incorrect 'per active card' text from the Participant UI when rendering global percentage modifiers.
# Loot Populater NPC 5E

This module allows you to enable automatic population of loot on placed tokens in D&D5e.

The module was inspired by [LootSheetNPC5e](https://github.com/jopeek/fvtt-loot-sheet-npc-5e) and also is only really useful when using this in tandem. LootSheetNPC5e adds the capability and permission handling for players to actually loot items from tokens/actors.

Also recommended is the use of [better rolltables](https://github.com/ultrakorne/better-rolltables), it will greatly improve you experience when working with rolltables.

### Settings
![image](https://github.com/DanielBoettner/fvtt-loot-populator-npc-5e/blob/master/LP_001.png)
![image](https://github.com/DanielBoettner/fvtt-loot-populator-npc-5e/blob/master/LP_002.png)
![image](https://github.com/DanielBoettner/fvtt-loot-populator-npc-5e/blob/master/LP_003.png)

### Example of filled inventory
On the left is the sheet of a token that was droped on the scene.
The right hand sheet is directly from the actor.

![image](https://github.com/DanielBoettner/fvtt-loot-populator-npc-5e/blob/master/SheetExample.png)

### Features

Allows you to have automated random loot on NPCs when dropping them on the scene.
If installed and activated, it can make use of better rolltables.

When the modules functionality is activated it picks the according rolltable with the following priority:

1. If an actor has a rolltable assigned (via lootsheetNPC5e) this table will be used.
2. If a creature type specific table should be used and is set - this table will be used
3. If a general default fallback table is set - this table will be used

### Compatibility:
- FoundryVTT v0.7.10
- FoundryVTT v0.8.6+
- Tested with DnD5e system only.

### Installation Instructions

To install a module, follow these instructions:

1. Start FVTT and browse to the Game Modules tab in the Configuration and Setup menu
2. Select the Install Module button and enter the following URL: https://raw.githubusercontent.com/DanielBoettner/fvtt-loot-populator-npc-5e/master/module.json
3. Click Install and wait for installation to complete

### Feedback

If you have any suggestions or feedback, please submit an issue on GitHub or contact me on Discord (JackPrince#0494).

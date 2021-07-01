# Loot Populater NPC 5e
## Introduction

The main purpose of this module is to allow the DM of a TTRPG game run with the _D&D 5e_ system via FoundryVTT to have "random" loot on tokens when added on a scene.

## Prerequisites

### This module is
* created for [FoundryVTT](https://foundryvtt.com/)
* it is developed and tested with the _[D&D 5e](https://foundryvtt.com/packages/dnd5e)_
* while it will work without [Loot Sheet NPC 5E](https://github.com/jopeek/fvtt-loot-sheet-npc-5e), the module is highly recommended
  *  it adds specific sheets that allow an NPC to be looted (e.g. after an encounter) or interacted with (npc is a merchant)
  *  it allows the DM to set the permissions for the npc token very fast (so players can actually interact)

## Configuration

<img src="https://user-images.githubusercontent.com/21986545/124087195-14702780-da52-11eb-89f3-4f03dce36718.png" width="30%"/>

### Advanced Settings

#### Module Defaults (world scope)

* Pick the _main_ fallback/default roll table to be used
* Set/change default roll formulas to be used when populating
* Enable currency generation and set the formula
<img src="https://user-images.githubusercontent.com/21986545/124087805-abd57a80-da52-11eb-9257-89e588631754.png" width="30%"/>

#### Creature Type Default 
The module allows to set rolltables to be used by creature type. The creature types are the ones that come with the D&D5e system.
**If enabled and no actor specific rolltables was set via _Loot Sheet NPC 5E_**, the module will check if a creature specific rolltable is set and populate with that table.

<img src="https://user-images.githubusercontent.com/21986545/124088941-bc3a2500-da53-11eb-8037-2cb7427189b8.png" width="30%"/>

#### Skiplist

If enabled the module will check if a creature type is checked on the skiplist. No matter what the rest of the configuration is, any creature of that type will be skipped when populating tokens.

<img src="https://user-images.githubusercontent.com/21986545/124089398-2783f700-da54-11eb-88ef-1ef56c15d089.png" width="30%"/>

## Troubleshooting

If population does not work as intended please check your configuration with the following things in mind.

### Skiplist has the highest priority
In other words if a certain tokens cretaure type is on the skiplist the module won't care for any rolltable configuration.

### More specific configuration has higher priority
The module will check for rolltables in the following order and work with the table it will find first.

* Check the actor for a rolltable
  * this can be set via _Loot Sheet NPC 5E_
    1. set the sheet to NPC lootsheet
    2. switch the type in the lootsheet to merchant
    3. pick the rolltable to be used and configure formulas if you whish
    4. (optional) switch the the sheet back to a normal NPC sheet
* (if enabled) check for a rolltable to be used for the creature type
* check for a world default rolltable to be used

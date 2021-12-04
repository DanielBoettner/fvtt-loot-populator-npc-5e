import { LootPopulatorSettingsConfig} from './apps/settingsConfig.js';
import { MODULE } from './moduleConfig.js';

const WORLD = 'world';
const GROUP_DEFAULT = 'defaults';
const GROUP_CF = 'custom_fallbacks';
const GROUP_SKIPLIST = 'skiplist';
const GROUP_CREATURE = 'creature_defaults';

export class Settings {
    constructor() {

        this.availableRolltables = {};
        this.hasBetterRolltables = (typeof game.betterTables !== "undefined");
        this.creatureTypes = this._getCreatureTypes();
        this.customFallbackDefaults = this.getCustomFallbackDefaults();
        this.setRolltables();

        this.gs = game.settings;
        //add empty default to rolltable dropdown

        return this;
    }

    /**
     * Get the systems creature types.
     * 
     * @returns {Array} creatureTypes
     */
    _getCreatureTypes() {
        if (game.system.id == 'dnd5e') return Object.keys(CONFIG.DND5E.creatureTypes);
    }

    /**
     * set all available rolltables
     */
    async setRolltables() {
        await this._getGameWorldRolltables();
    }

    registerSettings() {
        this.gs.register(MODULE.ns, "autoPopulateTokens", {
            name: "Auto populate tokens with loot",
            hint: "If an actor has a rolltable assigned to it, should the token be populated with the Loot?",
            scope: WORLD,
            config: true,
            default: false,
            type: Boolean
        });

        this.gs.registerMenu(MODULE.ns, "advancedOptions", {
            name: game.i18n.format("Advanced Options"),
            label: game.i18n.format("Advanced Options & Defaults"),
            icon: "fas fa-user-cog",
            type: LootPopulatorSettingsConfig,
            restricted: true
        });

        if (this.hasBetterRolltables) {
            this.gs.register(MODULE.ns, "useBetterRolltables", {
                name: "Use better rolltables",
                hint: "If installed make use of better rolltables?",
                scope: WORLD,
                config: true,
                default: false,
                type: Boolean
            });
        }

        this._registerDefaultFallbacks();
        this._registerCurrencySettings();
        this._registerCustomFallbacks();
        this._registerCreatureTypeFallbacks();
        this._registerSkiplistSettings();

        this.gs.register(MODULE.ns, "reduceUpdateVerbosity", {
            name: "Reduce Update Shop Verbosity",
            hint: "If enabled, no notifications will be created every time an item is added.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: true,
            type: Boolean
        });
    }

    /**
     * 
     * @return void
     */
    async _getGameWorldRolltables() {
        const rollTablePacks = game.packs.filter(
            (e) => e.documentName === "RollTable"
        );

        this.availableRolltables = {};
        if (game.tables.size > 0) this.availableRolltables["World"] = [];
        for (const table of game.tables) {
            this.availableRolltables["World"].push({
                name: table.name,
                uuid: `RollTable.${table.id}`,
            });
        }
        for (const pack of rollTablePacks) {
            const idx = await pack.getIndex();
            this.availableRolltables[pack.metadata.label] = [];
            const tableString = `Compendium.${pack.collection}.`;
            for (let table of idx) {
                this.availableRolltables[pack.metadata.label].push({
                    name: table.name,
                    uuid: tableString + table._id,
                });
            }
        }

        console.debug("LootPopulator | Rollable Tables found", this.availableRolltables);
    }

    /**
       * General default settings of the module
       */
    _registerDefaultFallbacks() {
        this.gs.register(MODULE.ns, "fallbackRolltable", {
            name: "fallbackRolltable",
            hint: "If no lootsheet rolltable is assigned to an actor, this will be used as a fallback table.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: 0,
            type: String,
            choices: this.availableRolltables
        });

        this.gs.register(MODULE.ns, "fallbackShopQty", {
            name: "Shop quantity",
            hint: "If no lootsheet shop quantity is assigned to an actor, this will be used as a fallback shop quantity.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: '1d2',
            type: String
        });

        this.gs.register(MODULE.ns, "fallbackItemQty", {
            name: "Item quantity",
            hint: "If no lootsheet item quantity is assigned to an actor, this will be used as a fallback item quantity.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: '1d2',
            type: String
        });

        this.gs.register(MODULE.ns, "fallbackItemQtyLimit", {
            name: "Item quantity limit",
            hint: "If no lootsheet item quantity limit is assigned to an actor, this will be used as a fallback item quantity limit.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: '1d2',
            type: String
        });
    }

    _registerCreatureTypeFallbacks() {
        if (this.creatureTypes && this.creatureTypes.length > 0) {
            this.gs.register(MODULE.ns, "creatureTypeFallbacks", {
                name: "Fallback per creature type",
                hint: "Assign default/fallback rolltable per creatureType?",
                scope: WORLD,
                group: GROUP_CREATURE,
                config: false,
                default: true,
                type: Boolean
            });

            this.creatureTypes.forEach((creaturType, i) => {
                this.gs.register(MODULE.ns, "creaturetype_default_" + creaturType + '_table', {
                    name: creaturType + 's',
                    scope: WORLD,
                    group: GROUP_CREATURE,
                    config: false,
                    default: 0,
                    type: String,
                    choices: this.availableRolltables
                });
            });
        }
    }

    _registerCustomFallbacks() {
        this.gs.register(MODULE.ns, "customFallbackSwitch", {
            name: "Use custom rules",
            hint: 'Custom rules to test against a token and populate.',
            scope: WORLD,
            group: GROUP_CF,
            config: false,
            default: true,
            type: Boolean
        });

        this.gs.register(MODULE.ns, "customFallbacks", {
            name: "Fallback based on challenge rating",
            hint: "Assign default/fallback rolltable per CR?",
            scope: WORLD,
            group: GROUP_CF,
            config: false,
            actions: {                
                new: {
                    data: this.availableRolltables
                }
            },
            default: this.customFallbackDefaults,
            type: Object
        });
    }

    _registerCurrencySettings() {
        this.gs.register(MODULE.ns, "generateCurrency", {
            name: "Add currency?",
            hint: "Generate and add currency when populating a token?",
            scope: WORLD,
            config: true,
            default: false,
            type: Boolean
        });

        this.gs.register(MODULE.ns, "adjustCurrencyWithCR", {
            name: "Adjust added currency with CR",
            hint: "If enabled added currency will be slightly adjusted by the CR (rollFormula + rounden up CR).",
            scope: WORLD,
            config: true,
            default: false,
            type: Boolean
        });

        this.gs.register(MODULE.ns, "lootCurrencyDefault", {
            name: "Default loot currency",
            hint: "The default formula for loot currency generation.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: "1d4[gp], 1d20[sp], 1d50[cp]",
            type: String
        });
    }

    _registerSkiplistSettings() {
        this.gs.register(MODULE.ns, "useSkiplist", {
            name: game.i18n.format("Use Skiplist"),
            hint: game.i18n.format("Use skiplist to ignore monster types during population?"),
            scope: WORLD,
            group: GROUP_SKIPLIST,
            config: false,
            default: false,
            type: Boolean
        });

        this.creatureTypes.forEach((item, i) => {
            let setting = "skiplist_" + item;

            this.gs.register(MODULE.ns, setting, {
                name: game.i18n.format(item),
                label: game.i18n.format("Skiplist"),
                group: GROUP_SKIPLIST,
                config: false,
                default: false,
                scope: WORLD,
                type: Boolean
            });
        });
    }

    getCustomFallbackDefaults(){
        return {
            'data.data.details.cr_<=_1' : 
                {
                    name: 'CR1',
                    filters: [
                            {
                                path: 'data.data.details.cr',
                                comparison: '<=',
                                value: 1
                            }
                    ],
                    rolltable: 'A CR1 Rolltable',
                    rolltableName: 'A Rolltable',
                    tags: 'lorem, ipsum',
                    active: false   
                },
            'data.data.details.cr_>=_4' : 
                {
                    name: 'CR1',
                    filters: [
                            {
                                path: 'actor.labels.name',
                                comparison: '!=',
                                value: 'Lorem'
                            }
                    ],
                    rolltable: 'rolltableId',
                    rolltableName: 'A Rolltable',
                    tags: 'lorem, ipsum',
                    active: false   
                },
        }
    }
}
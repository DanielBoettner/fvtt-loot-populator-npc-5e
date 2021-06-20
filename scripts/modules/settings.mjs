import { LootPopulatorSettingsConfig, PATH, MODULE } from './config.mjs';

const WORLD = 'world';
const GROUP_DEFAULT = 'defaults';
const GROUP_SKIPLIST = 'skiplist';
const GROUP_CREATURE = 'creature_defaults';

export class Settings {
    constructor() {
        this.availableRolltables = Object.assign(...game.tables.entities.map(table => ({ [table.name]: table.name })));
        this.hasBetterRolltables = (typeof game.betterTables !== "undefined");
        this.dndCreatureTypes = Object.keys(CONFIG.DND5E.creatureTypes);

        this.gs = game.settings;
        //add empty default to rolltable dropdown
        this.availableRolltables[0] = '';
    }

    registerSettings() {
        this.gs.register(MODULE, "autoPopulateTokens", {
            name: "Auto populate tokens with loot",
            hint: "If an actor has a rolltable assigned to it, should the token be populated with the Loot?",
            scope: WORLD,
            config: true,
            default: false,
            type: Boolean
        });

        this.gs.registerMenu(MODULE, "helpersOptions", {
            name: game.i18n.format("Advanced Options"),
            label: game.i18n.format("Advanced Options & Defaults"),
            icon: "fas fa-user-cog",
            type: LootPopulatorSettingsConfig,
            restricted: true
        });

        if (this.hasBetterRolltables) {
            this.gs.register(MODULE, "useBetterRolltables", {
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
        this._registerCreatureTypeFallbacks();
        this._registerSkiplistSettings();

        this.gs.register(MODULE, "reduceUpdateVerbosity", {
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
     * General default settings of the module
     */

    _registerDefaultFallbacks() {
        this.gs.register(MODULE, "fallbackRolltable", {
            name: "fallbackRolltable",
            hint: "If no lootsheet rolltable is assigned to an actor, this will be used as a fallback table.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: '',
            type: String,
            choices: this.availableRolltables
        });

        this.gs.register(MODULE, "fallbackShopQty", {
            name: "Shop quantity",
            hint: "If no lootsheet shop quantity is assigned to an actor, this will be used as a fallback shop quantity.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: '1d2',
            type: String
        });

        this.gs.register(MODULE, "fallbackItemQty", {
            name: "Item quantity",
            hint: "If no lootsheet item quantity is assigned to an actor, this will be used as a fallback item quantity.",
            scope: WORLD,
            group: GROUP_DEFAULT,
            config: false,
            default: '1d2',
            type: String
        });

        this.gs.register(MODULE, "fallbackItemQtyLimit", {
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
        this.gs.register(MODULE, "creatureTypeFallbacks", {
            name: "Fallback per creature type",
            hint: "Assign default/fallback rolltable per creatureType?",
            scope: WORLD,
            group: GROUP_CREATURE,
            config: false,
            default: true,
            type: Boolean
        });

        this.dndCreatureTypes.forEach((item, i) => {
            let creatureTable = "creaturetype_default_" + item + '_table';

            this.gs.register(MODULE, creatureTable, {
                name: item + ' table',
                scope: WORLD,
                group: GROUP_CREATURE,
                config: false,
                default: null,
                type: String,
                choices: this.availableRolltables
            });
        });
    }

    _registerCurrencySettings() {
        this.gs.register(MODULE, "generateCurrency", {
            name: "Add currency?",
            hint: "Generate and add currency when populating a token?",
            scope: WORLD,
            config: true,
            default: false,
            type: Boolean
        });

        this.gs.register(MODULE, "adjustCurrencyWithCR", {
            name: "Adjust added currency with CR",
            hint: "If enabled added currency will be slightly adjusted by the CR (rollFormula + rounden up CR).",
            scope: WORLD,
            config: true,
            default: false,
            type: Boolean
        });

        this.gs.register(MODULE, "lootCurrencyDefault", {
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
        this.gs.register(MODULE, "useSkiplist", {
            name: game.i18n.format("Use Skiplist"),
            hint: game.i18n.format("Use skiplist to ignore monster types during population?"),
            scope: WORLD,
            group: GROUP_SKIPLIST,
            config: false,
            default: false,
            type: Boolean
        });

        this.dndCreatureTypes.forEach((item, i) => {
            let setting = "skiplist_" + item;

            this.gs.register(MODULE, setting, {
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
}
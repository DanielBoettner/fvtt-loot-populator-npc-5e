import {initHooks} from './hooks/onCreateToken.js';
import {LootPopulatorSettingsConfig, PATH, MODULE} from './scripts/modules/config.mjs'

Hooks.once('init', () => {
      initHooks();
});

Hooks.once('ready', () => {
  game.settings.register(MODULE, "autoPopulateTokens", {
      name: "Auto populate tokens with loot",
      hint: "If an actor has a rolltable assigned to it, should the token be populated with the Loot?",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
  });

  if (typeof game.betterTables !== "undefined") {
    game.settings.register(MODULE, "useBetterRolltables", {
        name: "Use better rolltables",
        hint: "If installed make use of better rolltables?",
        scope: "world",
        config: true,
        default: false,
        type: Boolean
    });
  }

  let MyRolltables = Object.assign(...game.tables.entities.map(table => ({[table.name]: table.name})));
  game.settings.register(MODULE, "fallbackRolltable", {
      name: "fallbackRolltable",
      hint: "If no lootsheet rolltable is assigned to an actor, this will be used as a fallback table.",
      scope: "world",
      group: 'defaults',
      config: false,
      default: '',
      type: String,
      choices: MyRolltables
  });

  game.settings.register(MODULE, "fallbackShopQty", {
      name: "Shop quantity",
      hint: "If no lootsheet shop quantity is assigned to an actor, this will be used as a fallback shop quantity.",
      scope: "world",
      group: 'defaults',
      config: false,
      default: '1d2',
      type: String
  });

  game.settings.register(MODULE, "fallbackItemQty", {
      name: "Item quantity",
      hint: "If no lootsheet item quantity is assigned to an actor, this will be used as a fallback item quantity.",
      scope: "world",
      group: 'defaults',
      config: false,
      default: '1d2',
      type: String
  });

  game.settings.register(MODULE, "fallbackItemQtyLimit", {
      name: "Item quantity limit",
      hint: "If no lootsheet item quantity limit is assigned to an actor, this will be used as a fallback item quantity limit.",
      scope: "world",
      group: 'defaults',
      config: false,
      default: '1d2',
      type: String
  });

  game.settings.register(MODULE, "generateCurrency", {
      name: "Add currency?",
      hint: "Generate and add currency when populating a token?",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
  });

  game.settings.register(MODULE, "adjustCurrencyWithCR", {
      name: "Adjust added currency with CR",
      hint: "If enabled added currency will be slightly adjusted by the CR (rollFormula + rounden up CR).",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
  });

  game.settings.register(MODULE, "lootCurrencyDefault", {
      name: "Default loot currency",
      hint: "The default formula for loot currency generation.",
      scope: "world",
      group: 'defaults',
      config: false,
      default: "1d4[gp], 1d20[sp], 1d50[cp]",
      type: String
  });

  game.settings.register(MODULE, "reduceUpdateVerbosity", {
      name: "Reduce Update Shop Verbosity",
      hint: "If enabled, no notifications will be created every time an item is added.",
      scope: "world",
      group: 'defaults',
      config: false,
      default: true,
      type: Boolean
  });

  game.settings.register(MODULE, "useBlacklist", {
      name: game.i18n.format("Use Blacklist"),
      hint: game.i18n.format("Use blacklist to block monsters from beeing populated?"),
      scope: "world",
      group: 'blacklist',
      config: false,
      default: false,
      type: Boolean
  });

  let creatureTypes = Object.keys(CONFIG.DND5E.creatureTypes);

  creatureTypes.forEach((item, i) => {
    let setting = "blacklist_" + item;
    game.settings.register(MODULE, setting, {
        name: game.i18n.format(item),
        label: game.i18n.format("Blacklist"),
        group: 'blacklist',
        config: false,
        default: false,
        scope: "world",
        type: Boolean
    });
  });

  game.settings.registerMenu(MODULE, "helpersOptions", {
   name: game.i18n.format("Advanced Options"),
   label: game.i18n.format("Advanced Options & Defaults"),
   icon: "fas fa-user-cog",
   type: LootPopulatorSettingsConfig,
   restricted: true
 });
});

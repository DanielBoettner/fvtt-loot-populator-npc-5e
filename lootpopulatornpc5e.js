import {initHooks} from './hooks/onCreateToken.js';

Hooks.once('init', () => {
      initHooks();
});

Hooks.once('ready', () => {
  game.settings.register("lootpopulatornpc5e", "autoPopulateTokens", {
      name: "Auto populate tokens with loot",
      hint: "If an actor has a rolltable assigned to it, should the token be populated with the Loot?",
      scope: "world",
      config: true,
      default: false,
      type: Boolean
  });

  let MyRolltables = Object.assign(...game.tables.entities.map(table => ({[table.name]: table.name})));
  game.settings.register("lootpopulatornpc5e", "fallbackRolltable", {
      name: "fallbackRolltable",
      hint: "If no lootsheet rolltable is assigned to an actor, this will be used as a fallback table.",
      scope: "world",
      config: true,
      default: '',
      type: String,
      choices: MyRolltables
  });

  game.settings.register("lootpopulatornpc5e", "fallbackShopQty", {
      name: "Shop quantity",
      hint: "If no lootsheet shop quantity is assigned to an actor, this will be used as a fallback shop quantity.",
      scope: "world",
      config: true,
      default: '1d2',
      type: String
  });

  game.settings.register("lootpopulatornpc5e", "fallbackItemQty", {
      name: "Item quantity",
      hint: "If no lootsheet item quantity is assigned to an actor, this will be used as a fallback item quantity.",
      scope: "world",
      config: true,
      default: '1d2',
      type: String
  });

  game.settings.register("lootpopulatornpc5e", "fallbackItemQtyLimit", {
      name: "Item quantity limit",
      hint: "If no lootsheet item quantity limit is assigned to an actor, this will be used as a fallback item quantity limit.",
      scope: "world",
      config: true,
      default: '1d2',
      type: String
  });

  game.settings.register("lootpopulatornpc5e", "reduceUpdateVerbosity", {
      name: "Reduce Update Shop Verbosity",
      hint: "If enabled, no notifications will be created every time an item is added.",
      scope: "world",
      config: true,
      default: true,
      type: Boolean
  });
});

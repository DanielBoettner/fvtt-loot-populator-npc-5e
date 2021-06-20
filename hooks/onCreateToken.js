import { LootPopulator } from '../scripts/populateLoot.js';

export let initHooks = () => {
  Hooks.on('createToken', (token, createData, options, userId) => {

    // only act on tokens dropped by the GM
    if (!game.user.isGM) return token;
    if (!game.settings.get("lootpopulatornpc5e", "autoPopulateTokens")) return token;

    // ignore linked tokens
    if (!token.actor || token.data.actorLink) return token;

    // skip if monster's creaturType is on the skiplist
    let creatureType = token.actor.data.data.details.type.value;
    if (
      game.settings.get("lootpopulatornpc5e", "useSkiplist") &&
      game.settings.get("lootpopulatornpc5e", "skiplist_" + creatureType)
    ) {
      return token;
    }

    let lootPopulator = new LootPopulator(token);
    lootPopulator.populateToken();
  });
};

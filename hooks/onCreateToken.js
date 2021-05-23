import {LootPopulator} from '../scripts/populateLoot.js';

export let initHooks = () => {
    Hooks.on('createToken', (token, createData, options, userId) => {

      if(! game.settings.get("lootpopulatornpc5e","autoPopulateTokens"))
        return;

      const actor = token.actor;

      if (!token.actor || (token.data.actorLink)) // Don't for linked token
        return token;

      let lootPopulator = new LootPopulator();
      lootPopulator.generateLoot(token);
    });
}

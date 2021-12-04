import { MODULE } from "./moduleConfig.js";
import { LootPopulatorRule } from "./classes/LootPopulatorRule";
import { LootPopulator } from "./LootPopulator.js";
class API {
    getRegisteredCustomRules (){
        return game.settings.get(MODULE.ns,'customFallbacks');
    }

    /**
     * Update the lootpopulator custom rules
     * Expects a {LootPopulatorRule} object
     * 
     * @param {LootPopulatorRule} rule
     */
    addCustomRule(rule: LootPopulatorRule){    
        let currentRules = game.settings.get(MODULE.ns, 'customFallbacks');
        game.settings.set(MODULE.ns, 'customFallbacks', {...currentRules, rule});
    }

    switchPopulatorState(state: boolean){
        game.settings.set(MODULE.ns, 'autoPopulateTokens', state);
    }

    /**
     * Populate a token with given options
     * @param {Token} token
     * @param {object} options
     */
    populateTokenWithOptions(token: Token|null, options: {}){
        let populator = new LootPopulator();
        populator.populate(token, options);
    }
}

export { API };
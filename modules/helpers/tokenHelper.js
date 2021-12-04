import Helper_DND5E from "./system/dnd5e.js";

class tokenHelper {
    /**
     * 
     * @param {Token} token 
     * @returns {String|false} a RollTable.id
     */
    static getLinkedRolltable(token) {
        return token.actor.getFlag("lootsheetnpc5e", "rolltable") || false;
    }

    /**
     * 
     * @param {String} creatureType 
     * @returns {String|false} a RollTable.id
     */
    static getLinkedRolltableByCreatureType(creatureType) {
        let fallback = game.settings.get(MODULE_NS, "creaturetype_default_" + creatureType + '_table');
        if (fallback != 0) {
            return fallback || false;
        }

        return false;        
    }

    static getDefaultFallbackRolltable() {
        return game.settings.get(MODULE_NS, "fallbackRolltable") || false;
    }

    /**
     * 
     * @param {Token} token 
     * @returns {Array<String>|false}
     */
    static getLinkedRolltableByFilters(token) {
        const filterRules = game.settings.get(MODULE_NS, "customFallbacks") || false;
        let rolltable = false;

        for (const key in filterRules) {
            if (
                tokenHelper.passesFilter(token.actor, filterRules[key].filters)
                ) {
                if (!rolltable) rolltable = [];
                
                rolltable.push(filterRules[key].rolltable);
            }
        }

        return rolltable;
    }

    /**
     * 
     * @param {any} subject 
     * @param {any} filters 
     * 
     * @returns {boolean}
     */
    static passesFilter(subject, filters) {
        for (let filter of Object.values(filters)) {
            let prop = getProperty(subject, `data.${filter.filterpath}`) || getProperty(subject, filter.filterpath);
            if (prop === undefined) return false;
            switch (filter.comparison) {
                case '==': if (prop == filter.value) { return true; } break;
                case '<=': if (prop <= filter.value) { return true; } break;
                case '>=': if (prop >= filter.value) { return true; } break;
                case 'includes': if (prop.includes(filter.value)) { return true; } break;
            }
            continue;
        }

        return false;
    }
}
export default tokenHelper;
export const MODULE_NS = "lootpopulatornpc5e";
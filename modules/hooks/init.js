import { Settings } from '../settings.js';
import { LootPopulator } from '../LootPopulator.js';
import { API } from '../API.js';
import { MODULE } from '../moduleConfig.js';

class LootPopulatorHooks {
  /**
 * Hooks on game hooks and attaches methods 
 */
  static init() {
    Hooks.once("init", LootPopulatorHooks.foundryInit);
    Hooks.once("ready", LootPopulatorHooks.foundryReady);
    Hooks.once('aipSetup',LootPopulatorHooks.onAIPSetup);
    Hooks.once('devModeReady',LootPopulatorHooks.onDevModeReady);
    Hooks.once('setup', LootPopulatorHooks.foundrySetup);

    Hooks.on('createToken', LootPopulatorHooks.onCreateToken);
  }

  static foundrySetup() {
        const moduleData = game.modules.get(MODULE.ns);

        /**
         * @type {API}
         */
        moduleData.public = {
            API
        };

        // Freeze the public API so it can't be modified.
        Object.freeze(moduleData.public);
  }

  static foundryReady() {
    let moduleSettings = new Settings();
    moduleSettings.registerSettings();

    Handlebars.registerHelper('ifeq', function (a, b, options) {
      return (a == b) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('uneq', function (arg1, arg2, options) {
      return (arg1 != arg2) ? options.fn(this) : options.inverse(this);
    });

    Handlebars.registerHelper('lootsheetweight', function (weight) {
      return (Math.round(weight * 1e5) / 1e5).toString();
    });
  }

  static foundryInit(){
    game.LootPopulator = new LootPopulator();
  }

  static async onCreateToken (token, createData, options, userId) {
    // only act on tokens dropped by the GM
    if (!game.user.isGM) return token;
    if (!game.settings.get(MODULE.ns, "autoPopulateTokens")) return token;

    // ignore linked tokens
    if (!token.actor || token.data.actorLink) return token;

    // skip if monster's creaturType is on the skiplist
    let creatureType = token.actor.data.data.details.type.value;
    if (
      game.settings.get(MODULE.ns, "useSkiplist") &&
      game.settings.get(MODULE.ns, "skiplist_" + creatureType)
    ) {
      return token;
    }

    game.LootPopulator.populate(token);
  }

  /**
   * Register with AIP
   */
  static async onAIPSetup() {
    const api = game.modules.get("autocomplete-inline-properties").API;
    const DATA_MODE = api.CONST.DATA_MODE;

    // AIP
    // Define the config for our package
    const config = {
      packageName: MODULE.ns,
      sheetClasses: [
        {
          name: "LootPopulatorSettingsConfig", // this _must_ be the class name of the `Application` you want it to apply to
          fieldConfigs: [
            {
              selector: `.data-path-input`,
              showButton: true,
              allowHotkey: true,
              dataMode: DATA_MODE.OWNING_ACTOR_DATA,
            },
          ]
        },
      ]
    };

    // Add our config
    api.PACKAGE_CONFIG.push(config);
  }

  static onDevModeReady ({ registerPackageDebugFlag }) {
    registerPackageDebugFlag(MODULE.ns);
  }
}

export { LootPopulatorHooks };
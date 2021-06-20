import { initHooks } from './hooks/onCreateToken.js';
import { Settings } from './scripts/modules/settings.mjs';

Hooks.once('init', () => {
    initHooks();
});

Hooks.once('ready', () => {
    let moduleSettings = new Settings();
    moduleSettings.registerSettings();
});

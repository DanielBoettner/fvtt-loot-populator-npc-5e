import Item5e from "../../../systems/dnd5e/module/item/entity.js";
import Currency from "./modules/currency.mjs";
import tableHelper from "./modules/tableHelper.mjs";

const moduleNamespace = "lootpopulatornpc5e";

export class LootPopulator {
	/**
	 * Populate given token(s) with items from rolltables.
	 * 
	 * @returns 
	 */
	async populate(token = null) {
		//support for LootSheetNPC5e
		const ls5e_moduleNamespace = "lootsheetnpc5e",
			reducedVerbosity = this._getSetting("reduceUpdateVerbosity") || true,
			tokenstack = (token) ? (token.length >= 0) ? token : [token] : canvas.tokens.controlled;
		
		for (const currentToken of tokenstack) {
			const tokenActor = currentToken.actor,
				creatureType = tokenActor.data.data.details.type.value;			
			let rolltableName = null;

			//skip linked tokens
			if (!currentToken.actor || currentToken.data.actorLink) continue;
			
			if (this._getSetting("creatureTypeFallbacks") && (this._getSetting("creaturetype_default_" + creatureType + '_table') != 0)) {
				rolltableName = tokenActor.getFlag(ls5e_moduleNamespace, "rolltable") || this._getSetting("creaturetype_default_" + creatureType + '_table');
			} else {
				rolltableName = tokenActor.getFlag(ls5e_moduleNamespace, "rolltable") || this._getSetting("fallbackRolltable");
			}

			if (!rolltableName) return ui.notifications.error(moduleNamespace + `: No Rolltable name was found on the actor or in the module defaults.`);

			let rolltable = await tableHelper._getRolltable(rolltableName);
	
			if (!rolltable) {
				return ui.notifications.error(moduleNamespace + `: No Rollable Table found with name "${rolltableName}".`);
			}
	
			// if we use betterRolltables, let it handle the loot
			if (this._getSetting("useBetterRolltables") && rolltable.getFlag('better-rolltables', 'table-type')) {
				game.betterTables.addLootToSelectedToken(rolltable, currentToken);
			} else {
				await this._populateToken(rolltable, currentToken, reducedVerbosity);
			}
	
			let currencyFlags = {
				"generateCurrency": this._getSetting('generateCurrency'),
				"lootCurrencyDefault": this._getSetting('lootCurrencyDefault'),
				"useBetterRolltables": this._getSetting("useBetterRolltables"),
				"brt_rt_tcs": rolltable.getFlag('better-rolltables', 'table-currency-string'),
				"adjustCurrency": this._getSetting("adjustCurrencyWithCR")
			};
	
			await Currency._handleCurrency(currentToken,currencyFlags);
		}		
	}

	/**
	 * 
	 * @param {RollTableDocument} rolltable 
	 * @param {TokenDocument} token
	 *  
	 * @returns 
	 */
	async _populateToken(rolltable, token, reducedVerbosity) {
		const ls5e_moduleNamespace = "lootsheetnpc5e",
			tokenActor = token.actor,
			shopQtyFormula = tokenActor.getFlag(ls5e_moduleNamespace, "shopQty") || this._getSetting("fallbackShopQty") || "1",
			itemQtyFormula = tokenActor.getFlag(ls5e_moduleNamespace, "itemQty") || this._getSetting("fallbackItemQty") || "1",
			itemQtyLimit = tokenActor.getFlag(ls5e_moduleNamespace, "itemQtyLimit") || this._getSetting("fallbackItemQtyLimit") || "0",
			itemOnlyOnce = tokenActor.getFlag(ls5e_moduleNamespace, "itemOnlyOnce") || false;
			
			let shopQtyRoll = new Roll(shopQtyFormula);
		
			shopQtyRoll.roll();
	
			if (itemOnlyOnce) {
				if (rolltable.results.length < shopQtyRoll.total) {
					return ui.notifications.error(moduleNamespace + `: Cannot create loot with ${shopQtyRoll.total} unqiue entries if the rolltable only contains ${rolltable.results.length} items`);
				}
			}
	
			if (!itemOnlyOnce) {
				for (let i = 0; i < shopQtyRoll.total; i++) {
					const rollResult =  await rolltable.roll();
					let newItem = null;
	
					if (rollResult.results[0].collection === "Item") {
						newItem = game.items.get(rollResult.results[0].data.resultId);
					} else {
						const items = game.packs.get(rollResult.results[0].data.collection);
						newItem = await items.getDocument(rollResult.results[0].data.resultId);
					}
	
					newItem = await tableHelper._rollSubTables(newItem);
	
					if (!newItem || newItem === null) {
						return;
					}
	
					if (newItem.type === "spell") {
						newItem = await Item5e.createScrollFromSpell(newItem);
					}
	
					let itemQtyRoll = new Roll(itemQtyFormula);
					itemQtyRoll.roll();
	
					if (!reducedVerbosity) console.log(moduleNamespace + `: Adding ${itemQtyRoll.total} x ${newItem.name}`);
	
					let existingItem = tokenActor.items.find(item => item.data.name == newItem.name);
	
					if (existingItem === undefined) {
						await tokenActor.createEmbeddedDocuments("Item", [newItem.toObject()]);
						//console.log(moduleNamespace + `: ${newItem.name} does not exist.`);
						existingItem = await tokenActor.items.find(item => item.data.name == newItem.name);
	
						if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(itemQtyRoll.total)) {
							await existingItem.update({ "data.quantity": itemQtyLimit });
							if (!reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${itemQtyLimit} x ${newItem.name}.`);
						} else {
							await existingItem.update({ "data.quantity": itemQtyRoll.total });
							if (!reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
						}
					} else {
						if (!reducedVerbosity) console.log(moduleNamespace + `:  Item ${newItem.name} exists.`);
	
						let newQty = Number(existingItem.data.data.quantity) + Number(itemQtyRoll.total);
	
						if (itemQtyLimit > 0 && Number(itemQtyLimit) === Number(existingItem.data.data.quantity)) {
							if (!reducedVerbosity) ui.notifications.info(moduleNamespace + `: ${newItem.name} already at maximum quantity (${itemQtyLimit}).`);
						}
						else if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(newQty)) {
							//console.log("Exceeds existing quantity, limiting");
							await existingItem.update({ "data.quantity": itemQtyLimit });
	
							if (!reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added additional quantity to ${newItem.name} to the specified maximum of ${itemQtyLimit}.`);
						} else {
							await existingItem.update({ "data.quantity": newQty });
							if (!reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added additional ${itemQtyRoll.total} quantity to ${newItem.name}.`);
						}
					}
				}
			} else {
				// Get a list which contains indexes of all possible results
				const rolltableIndexes = [];
	
				// Add one entry for each weight an item has
				for (let index in [...Array(rolltable.results.length).keys()]) {
					let numberOfEntries = rolltable.data.results[index].weight;
					for (let i = 0; i < numberOfEntries; i++) {
						rolltableIndexes.push(index);
					}
				}
	
				// Shuffle the list of indexes
				var currentIndex = rolltableIndexes.length, temporaryValue, randomIndex;
	
				// While there remain elements to shuffle...
				while (0 !== currentIndex) {
	
					// Pick a remaining element...
					randomIndex = Math.floor(Math.random() * currentIndex);
					currentIndex -= 1;
	
					// And swap it with the current element.
					temporaryValue = rolltableIndexes[currentIndex];
					rolltableIndexes[currentIndex] = rolltableIndexes[randomIndex];
					rolltableIndexes[randomIndex] = temporaryValue;
				}
	
				// console.log(`Rollables: ${rolltableIndexes}`)
	
				let indexesToUse = [];
				let numberOfAdditionalItems = 0;
				// Get the first N entries from our shuffled list. Those are the indexes of the items in the roll table we want to add
				// But because we added multiple entries per index to account for weighting, we need to increase our list length until we got enough unique items
				while (true) {
					let usedEntries = rolltableIndexes.slice(0, shopQtyRoll.total + numberOfAdditionalItems);
					// console.log(`Distinct: ${usedEntries}`);
					let distinctEntries = [...new Set(usedEntries)];
	
					if (distinctEntries.length < shopQtyRoll.total) {
						numberOfAdditionalItems++;
						continue;
					}
	
					indexesToUse = distinctEntries;
					break;
				}
	
				for (const index of indexesToUse) {
					let itemQtyRoll = new Roll(itemQtyFormula);
					itemQtyRoll.roll();
	
					let newItem = null;
	
					if (rolltable.results[index].collection === "Item") {
						newItem = game.items.get(rolltable.results[index].resultId);
					} else {
						//Try to find it in the compendium
						const items = game.packs.get(rolltable.results[index].data.collection);
						newItem = await items.getDocument(rollResult.results[0].data.resultId);
					}
	
					newItem = await tableHelper._rollSubTables(newItem, index);
	
					if (!newItem || newItem === null) {
						return ui.notifications.error(moduleNamespace + `: No item found "${rolltable.results[index].resultId}".`);
					}
	
					if (newItem.type === "spell") {
						newItem = await Item5e.createScrollFromSpell(newItem);
					}
	
					await item.createEmbeddedDocuments("Item", [newItem.toObject()]);
					let existingItem = tokenActor.items.find(item => item.data.name == newItem.name);
	
					if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(itemQtyRoll.total)) {
						await existingItem.update({ "data.quantity": itemQtyLimit });
						if (!reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${itemQtyLimit} x ${newItem.name}.`);
					} else {
						await existingItem.update({ "data.quantity": itemQtyRoll.total });
						if (!reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
					}
				}
			}
	}

	/**
	 * 
	 * @param {string} setting 
	 * 
	 * @returns {*} Setting
	 */
	_getSetting(setting) {
		return game.settings.get(moduleNamespace, setting);
	}
}

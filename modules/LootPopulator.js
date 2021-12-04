import Item5e from "../../../systems/dnd5e/module/item/entity.js";
import Currency from "./currency.js";
import tableHelper from "./helpers/tableHelper.js";
import tokenHelper from "./helpers/tokenHelper.js";
import { MODULE } from "./moduleConfig.js";

export class LootPopulator {
	constructor(){
		return this;
	}
	/**
	 * 
	 *  
	 */
	/**
	 * Populate given token(s) with items from rolltables.
	 * @module lootpopulatornpc5e.populate
	 * 
	 * @param {Token|null} token 
	 * @param {object} options 
	 * @returns 
	 */
	async populate(token = null, options = {}) {
		const reducedVerbosity = game.settings.get(MODULE.ns,"reduceUpdateVerbosity") || true,
			tokenstack = (token) ? (token.length >= 0) ? token : [token] : canvas.tokens.controlled;
		
		for (const currentToken of tokenstack) {
			const	tokenActor = currentToken.actor,
					creatureType = tokenActor.data.data.details.type.value,
					rolltableFromActor = tokenHelper.getLinkedRolltable(currentToken),
				  	rolltableByCreature = tokenHelper.getLinkedRolltableByCreatureType(creatureType),
				  	rolltableByFilters = tokenHelper.getLinkedRolltableByFilters(currentToken),
				  	rolltableDefault = tokenHelper.getDefaultFallbackRolltable();

			/** 
			* Todo: Method to detect how many rolltables by filter we have an if we want to use them all.
			* if we use more than one how do we prioratise? Does a rule terminate?
			
			* Config can hold more switches to detect if we want more than the first table.
			*/
			let rolltableReference = rolltableFromActor || rolltableByFilters || rolltableByCreature || rolltableDefault;

			//skip linked tokens
			if (!tokenActor || currentToken.data.actorLink) continue;
			if (!rolltableReference) return ui.notifications.error(MODULE.ns + `: No Rolltable was found on the actor or in the module defaults.`);

			let brt_currencyString = '';

			if(Array.isArray(rolltableReference)){
				for (let reference of rolltableReference) {
					let rolltable = await tableHelper._getRolltable(reference);

					// if we use betterRolltables and the table is of a brt type, let it handle the loot
					if (game.settings.get(MODULE.ns,"useBetterRolltables") && rolltable.getFlag('better-rolltables', 'table-type')) {
						game.betterTables.addLootToSelectedToken(rolltable, currentToken);
						// override brt_currencyString if empty
						// better solution could be to take the currency string with the highest prio - that is if we add prio
						brt_currencyString = brt_currencyString || rolltable.getFlag('better-rolltables', 'table-currency-string');
					} else {
						await game.LootPopulator._populateToken(rolltable, currentToken, reducedVerbosity);
					}
				}
			} else{
				let rolltable = await tableHelper._getRolltable(rolltableReference);

				if (!rolltable) {
					return ui.notifications.error(MODULE.ns + `: No Rollable Table found with id "${rolltableReference}".`);
				}
		
				// if we use betterRolltables and the table is of a brt type, let it handle the loot
				if (game.settings.get(MODULE.ns,"useBetterRolltables") && rolltable.getFlag('better-rolltables', 'table-type')) {
					game.betterTables.addLootToSelectedToken(rolltable, currentToken);
				} else {
					await game.LootPopulator._populateToken(rolltable, currentToken, reducedVerbosity);
					brt_currencyString = rolltable.getFlag('better-rolltables', 'table-currency-string');
				}
			}

			let currencyFlags = {
				"generateCurrency": game.settings.get(MODULE.ns,'generateCurrency'),
				"lootCurrencyDefault": game.settings.get(MODULE.ns,'lootCurrencyDefault'),
				"useBetterRolltables": game.settings.get(MODULE.ns,"useBetterRolltables"),
				"brt_rt_tcs": brt_currencyString,
				"adjustCurrency": game.settings.get(MODULE.ns,"adjustCurrencyWithCR")
			};
	
			await Currency._handleCurrency(currentToken,currencyFlags);
		}		
	}

	/**
	 * 
	 * @param {RollTableDocument} rolltable 
	 * @param {TokenDocument} token
	 *  
	 */
	async _populateToken(rolltable, token, reducedVerbosity) {
		const ls5ens = "lootsheetnpc5e",
			tokenActor = token.actor,
			shopQtyFormula = tokenActor.getFlag(MODULE.ls5ens, "shopQty") || game.settings.get(MODULE.ns,"fallbackShopQty") || "1",
			itemQtyFormula = tokenActor.getFlag(MODULE.ls5ens, "itemQty") || game.settings.get(MODULE.ns,"fallbackItemQty") || "1",
			itemQtyLimit = tokenActor.getFlag(MODULE.ls5ens, "itemQtyLimit") || game.settings.get(MODULE.ns,"fallbackItemQtyLimit") || "0",
			itemOnlyOnce = tokenActor.getFlag(MODULE.ls5ens, "itemOnlyOnce") || false;
			
			let shopQtyRoll = new Roll(shopQtyFormula);
		
			shopQtyRoll.roll();
	
			if (itemOnlyOnce) {
				if (rolltable.results.length < shopQtyRoll.total) {
					return ui.notifications.error(MODULE.ns + `: Cannot create loot with ${shopQtyRoll.total} unqiue entries if the rolltable only contains ${rolltable.results.length} items`);
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
	
					if (!reducedVerbosity) console.log(MODULE.ns + `: Adding ${itemQtyRoll.total} x ${newItem.name}`);
	
					let existingItem = tokenActor.items.find(item => item.data.name == newItem.name);
	
					if (existingItem === undefined) {
						await tokenActor.createEmbeddedDocuments("Item", [newItem.toObject()]);
						//console.log(MODULE.ns + `: ${newItem.name} does not exist.`);
						existingItem = await tokenActor.items.find(item => item.data.name == newItem.name);
	
						if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(itemQtyRoll.total)) {
							await existingItem.update({ "data.quantity": itemQtyLimit });
							if (!reducedVerbosity) ui.notifications.info(MODULE.ns + `: Added new ${itemQtyLimit} x ${newItem.name}.`);
						} else {
							await existingItem.update({ "data.quantity": itemQtyRoll.total });
							if (!reducedVerbosity) ui.notifications.info(MODULE.ns + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
						}
					} else {
						if (!reducedVerbosity) console.log(MODULE.ns + `:  Item ${newItem.name} exists.`);
	
						let newQty = Number(existingItem.data.data.quantity) + Number(itemQtyRoll.total);
	
						if (itemQtyLimit > 0 && Number(itemQtyLimit) === Number(existingItem.data.data.quantity)) {
							if (!reducedVerbosity) ui.notifications.info(MODULE.ns + `: ${newItem.name} already at maximum quantity (${itemQtyLimit}).`);
						}
						else if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(newQty)) {
							//console.log("Exceeds existing quantity, limiting");
							await existingItem.update({ "data.quantity": itemQtyLimit });
	
							if (!reducedVerbosity) ui.notifications.info(MODULE.ns + `: Added additional quantity to ${newItem.name} to the specified maximum of ${itemQtyLimit}.`);
						} else {
							await existingItem.update({ "data.quantity": newQty });
							if (!reducedVerbosity) ui.notifications.info(MODULE.ns + `: Added additional ${itemQtyRoll.total} quantity to ${newItem.name}.`);
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
						return ui.notifications.error(MODULE.ns + `: No item found "${rolltable.results[index].resultId}".`);
					}
	
					if (newItem.type === "spell") {
						newItem = await Item5e.createScrollFromSpell(newItem);
					}
	
					await item.createEmbeddedDocuments("Item", [newItem.toObject()]);
					let existingItem = tokenActor.items.find(item => item.data.name == newItem.name);
	
					if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(itemQtyRoll.total)) {
						await existingItem.update({ "data.quantity": itemQtyLimit });
						if (!reducedVerbosity) ui.notifications.info(MODULE.ns + `: Added new ${itemQtyLimit} x ${newItem.name}.`);
					} else {
						await existingItem.update({ "data.quantity": itemQtyRoll.total });
						if (!reducedVerbosity) ui.notifications.info(MODULE.ns + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
					}
				}
			}
	}

	/**
	 * 
	 * @param {String} setting 
	 * 
	 * @returns {*} Setting
	 */
	_getSetting(setting) {
		return game.settings.get(MODULE.ns, setting);
	}
}

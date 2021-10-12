import Item5e from "../../../systems/dnd5e/module/item/entity.js";
import Currency from "./modules/currency.mjs";
import tableHelper from "./modules/tableHelper.mjs";

const moduleNamespace = "lootpopulatornpc5e";

export class LootPopulator {
	constructor(token) {
		//support for LootSheetNPC5e
		let ls5e_moduleNamespace = "lootsheetnpc5e";
		let creatureType = token.actor.data.data.details.type.value;

		this.token = token;
		this.actor = this.token.actor;

		if (this._getSetting("creatureTypeFallbacks") && (this._getSetting("creaturetype_default_" + creatureType + '_table') != 0)) {
			this.rolltableName = this.actor.getFlag(ls5e_moduleNamespace, "rolltable") || this._getSetting("creaturetype_default_" + creatureType + '_table');
		} else {
			this.rolltableName = this.actor.getFlag(ls5e_moduleNamespace, "rolltable") || this._getSetting("fallbackRolltable");
		}

			this.shopQtyFormula = this.actor.getFlag(ls5e_moduleNamespace, "shopQty") || this._getSetting("fallbackShopQty") || "1";
			this.itemQtyFormula = this.actor.getFlag(ls5e_moduleNamespace, "itemQty") || this._getSetting("fallbackItemQty") || "1";
			this.itemQtyLimit = this.actor.getFlag(ls5e_moduleNamespace, "itemQtyLimit") || this._getSetting("fallbackItemQtyLimit") || "0";
			this.itemOnlyOnce = this.actor.getFlag(ls5e_moduleNamespace, "itemOnlyOnce") || false;
			this.reducedVerbosity = this._getSetting("reduceUpdateVerbosity") || true;

		return this;
	}

	/**
	 * Populate given token with items from rolltables.
	 * 
	 * @returns 
	 */
	async populateToken() {

		if (!this.rolltableName) return;
		let rolltable = await tableHelper._getRolltable(this.rolltableName);

		if (!rolltable) {
			return ui.notifications.error(moduleNamespace + `: No Rollable Table found with name "${this.rolltableName}".`);
		}

		if (this._getSetting("useBetterRolltables") && rolltable.getFlag('better-rolltables', 'table-type')) {
			game.betterTables.addLootToSelectedToken(rolltable, this.token);
			return;
		}
		
		let shopQtyRoll = new Roll(this.shopQtyFormula);
		
		shopQtyRoll.roll();

		if (this.itemOnlyOnce) {
			if (rolltable.results.length < shopQtyRoll.total) {
				return ui.notifications.error(moduleNamespace + `: Cannot create a loot with ${shopQtyRoll.total} unqiue entries if the rolltable only contains ${rolltable.results.length} items`);
			}
		}

		if (!this.itemOnlyOnce) {
			for (let i = 0; i < shopQtyRoll.total; i++) {
				const rollResult = await rolltable.roll();
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

				let itemQtyRoll = new Roll(this.itemQtyFormula);
				itemQtyRoll.roll();

				console.log(moduleNamespace + `: Adding ${itemQtyRoll.total} x ${newItem.name}`);

				let existingItem = this.actor.items.find(item => item.data.name == newItem.name);

				if (existingItem === undefined) {
					await this.actor.createEmbeddedDocuments("Item", [newItem.toObject()]);
					//console.log(moduleNamespace + `: ${newItem.name} does not exist.`);
					existingItem = await this.actor.items.find(item => item.data.name == newItem.name);

					if (this.itemQtyLimit > 0 && Number(this.itemQtyLimit) < Number(itemQtyRoll.total)) {
						await existingItem.update({ "data.quantity": this.itemQtyLimit });
						if (!this.reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${this.itemQtyLimit} x ${newItem.name}.`);
					} else {
						await existingItem.update({ "data.quantity": itemQtyRoll.total });
						if (!this.reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
					}
				} else {
					console.log(moduleNamespace + `:  Item ${newItem.name} exists.`);

					let newQty = Number(existingItem.data.data.quantity) + Number(itemQtyRoll.total);

					if (itemQtyLimit > 0 && Number(itemQtyLimit) === Number(existingItem.data.data.quantity)) {
						if (!this.reducedVerbosity) ui.notifications.info(moduleNamespace + `: ${newItem.name} already at maximum quantity (${this.itemQtyLimit}).`);
					}
					else if (this.itemQtyLimit > 0 && Number(this.itemQtyLimit) < Number(newQty)) {
						//console.log("Exceeds existing quantity, limiting");
						await existingItem.update({ "data.quantity": this.itemQtyLimit });

						if (!this.reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added additional quantity to ${newItem.name} to the specified maximum of ${this.itemQtyLimit}.`);
					} else {
						await existingItem.update({ "data.quantity": newQty });
						if (!this.reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added additional ${itemQtyRoll.total} quantity to ${newItem.name}.`);
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
				let itemQtyRoll = new Roll(this.itemQtyFormula);
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
				let existingItem = this.actor.items.find(item => item.data.name == newItem.name);

				if (this.itemQtyLimit > 0 && Number(this.itemQtyLimit) < Number(itemQtyRoll.total)) {
					await existingItem.update({ "data.quantity": this.itemQtyLimit });
					if (!this.reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${this.itemQtyLimit} x ${newItem.name}.`);
				} else {
					await existingItem.update({ "data.quantity": itemQtyRoll.total });
					if (!this.reducedVerbosity) ui.notifications.info(moduleNamespace + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
				}
			}
		}

		let currencyFlags = {
			"generateCurrency": this._getSetting('generateCurrency'),
			"lootCurrencyDefault": this._getSetting('lootCurrencyDefault'),
			"useBetterRolltables": this._getSetting("useBetterRolltables"),
			"brt_rt_tcs": rolltable.getFlag('better-rolltables', 'table-currency-string'),
			"adjustCurrency": this._getSetting("adjustCurrencyWithCR")
		};

		await Currency._handleCurrency(this.actor,currencyFlags);
	}

	_getSetting(setting) {
		return game.settings.get(moduleNamespace, setting);
	}
}

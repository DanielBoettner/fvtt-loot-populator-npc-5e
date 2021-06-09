import Item5e from "../../../systems/dnd5e/module/item/entity.js";

export class LootPopulator {
	constructor() {
		this.moduleNamespace = "lootpopulatornpc5e";
    return this;
  }

	async generateLoot(scene, data) {
        //instead of the main actor we want/need the actor of the token.
				const tokenId = data._id;
        const token = canvas.tokens.get(tokenId);
        const actor = token.actor;

        const ls5e_moduleNamespace = "lootsheetnpc5e";
				const rolltableName = actor.getFlag(ls5e_moduleNamespace, "rolltable") || this._getSetting("fallbackRolltable");
        const shopQtyFormula = actor.getFlag(ls5e_moduleNamespace, "shopQty") || this._getSetting("fallbackShopQty") || "1";
				const itemQtyFormula = actor.getFlag(ls5e_moduleNamespace, "itemQty") || this._getSetting("fallbackItemQty") || "1";
				const itemQtyLimit = actor.getFlag(ls5e_moduleNamespace, "itemQtyLimit") || this._getSetting("fallbackItemQtyLimit") || "0";
				const itemOnlyOnce = actor.getFlag(ls5e_moduleNamespace, "itemOnlyOnce") || false;
				const reducedVerbosity = this._getSetting("reduceUpdateVerbosity") || true;
        let shopQtyRoll = new Roll(shopQtyFormula);

        shopQtyRoll.roll();

        if (!rolltableName) {
          return;
        }

				let rolltable = game.tables.getName(rolltableName);

        if (!rolltable) {
            return ui.notifications.error(this.moduleNamespace + `: No Rollable Table found with name "${rolltableName}".`);
        }

        if (itemOnlyOnce) {
            if (rolltable.results.length < shopQtyRoll.total)  {
                return ui.notifications.error(this.moduleNamespace + `: Cannot create a loot with ${shopQtyRoll.total} unqiue entries if the rolltable only contains ${rolltable.results.length} items`);
            }
        }

        if (!itemOnlyOnce) {
            for (let i = 0; i < shopQtyRoll.total; i++) {
                const rollResult = rolltable.roll();
                let newItem = null;

								if (rollResult.results[0].collection === "Item") {
                  newItem = game.items.get(rollResult.results[0].resultId);
                } else {
                  let itemCollection = game.packs.get(rollResult.results[0].collection);
                  newItem = await itemCollection.getEntity(rollResult.results[0].resultId);
                }

                if (newItem instanceof RollTable){
                   let subTableResults  = newItem.roll();

                   if(subTableResults.results[0].collection === "Item"){
                        newItem = game.items.get(subTableResults.results[0].resultId);
                   } else {
                        let itemCollection = game.packs.get(subTableResults.results[0].collection);
                        newItem = await itemCollection.getEntity(subTableResults.results[0].resultId);
                   }
                }

                if (!newItem || newItem === null) {
                    return;
                }

                if (newItem.type === "spell") {
                    newItem = await Item5e.createScrollFromSpell(newItem)
                }

                let itemQtyRoll = new Roll(itemQtyFormula);
                itemQtyRoll.roll();

                console.log(this.moduleNamespace + `: Adding ${itemQtyRoll.total} x ${newItem.name}`)

                let existingItem = actor.items.find(item => item.data.name == newItem.name);

                if (existingItem === null) {
                    await actor.createEmbeddedEntity("OwnedItem", newItem);
                    console.log(this.moduleNamespace + `: ${newItem.name} does not exist.`);
                    existingItem = await actor.items.find(item => item.data.name == newItem.name);

                    if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(itemQtyRoll.total)) {
                        await existingItem.update({ "data.quantity": itemQtyLimit });
                        if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `: Added new ${itemQtyLimit} x ${newItem.name}.`);
                    } else {
                        await existingItem.update({ "data.quantity": itemQtyRoll.total });
                        if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
                    }
                } else {
                    console.log(this.moduleNamespace + `:  Item ${newItem.name} exists.`);

                    let newQty = Number(existingItem.data.data.quantity) + Number(itemQtyRoll.total);

                    if (itemQtyLimit > 0 && Number(itemQtyLimit) === Number(existingItem.data.data.quantity)) {
                      if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `: ${newItem.name} already at maximum quantity (${itemQtyLimit}).`);
                    }
                    else if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(newQty)) {
                    //console.log("Exceeds existing quantity, limiting");
                      await existingItem.update({ "data.quantity": itemQtyLimit });

                      if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `: Added additional quantity to ${newItem.name} to the specified maximum of ${itemQtyLimit}.`);
                    } else {
                      await existingItem.update({ "data.quantity": newQty });
                      if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `: Added additional ${itemQtyRoll.total} quantity to ${newItem.name}.`);
                    }
                }
            }
        } else {
            // Get a list which contains indexes of all possible results

            const rolltableIndexes = []

            // Add one entry for each weight an item has
            for (let index in [...Array(rolltable.results.length).keys()]) {
                let numberOfEntries = rolltable.data.results[index].weight
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
            while (true)
            {
                let usedEntries = rolltableIndexes.slice(0, shopQtyRoll.total + numberOfAdditionalItems);
                // console.log(`Distinct: ${usedEntries}`);
                let distinctEntris = [...new Set(usedEntries)];

                if (distinctEntris.length < shopQtyRoll.total) {
                    numberOfAdditionalItems++;
                    // console.log(`numberOfAdditionalItems: ${numberOfAdditionalItems}`);
                    continue;
                }

                indexesToUse = distinctEntris
                // console.log(`indexesToUse: ${indexesToUse}`)
                break;
            }

            for (const index of indexesToUse)
            {
                let itemQtyRoll = new Roll(itemQtyFormula);
                itemQtyRoll.roll();

								let newItem = null

								if (rolltable.results[index].collection === "Item") {
									newItem = game.items.get(rolltable.results[index].resultId);
								} else {
								//Try to find it in the compendium
									const items = game.packs.get(rolltable.results[index].collection);
									newItem = await items.getEntity(rolltable.results[index].resultId);
								}

								if (newItem instanceof RollTable){
									let subTableResults  = newItem.roll();

									if(subTableResults.results[index].collection === "Item"){
										newItem = game.items.get(subTableResults.results[index].resultId);
									} else {
									  let itemCollection = game.packs.get(subTableResults.results[index].collection);
									  newItem = await itemCollection.getEntity(subTableResults.results[index].resultId);
									}
								}

								if (!newItem || newItem === null) {
									return ui.notifications.error(this.moduleNamespace + `: No item found "${rolltable.results[index].resultId}".`);
								}

                if (newItem.type === "spell") {
                    newItem = await Item5e.createScrollFromSpell(newItem)
                }

                await item.createEmbeddedEntity("OwnedItem", newItem);
                let existingItem = actor.items.find(item => item.data.name == newItem.name);

                if (itemQtyLimit > 0 && Number(itemQtyLimit) < Number(itemQtyRoll.total)) {
                    await existingItem.update({ "data.quantity": itemQtyLimit });
                    if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `: Added new ${itemQtyLimit} x ${newItem.name}.`);
                } else {
                    await existingItem.update({ "data.quantity": itemQtyRoll.total });
                    if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `: Added new ${itemQtyRoll.total} x ${newItem.name}.`);
                }
            }
        }

				if (this._getSetting('useBetterRolltables')){
					if (!reducedVerbosity) ui.notifications.info(this.moduleNamespace + `:	using BetterRolltables`);

					let lootCurrencyString = rolltable.getFlag('better-rolltables','table-currency-string');
					if(lootCurrencyString){
						await this.addCurrenciesToActor(actor, this._generateCurrency(lootCurrencyString));
					}
				}

    }

		async addCurrenciesToActor(actor, lootCurrency) {
			let currencyData = duplicate(actor.data.data.currency),
					cr = actor.data.data.details.cr || 0,
					amount = 0;

			for (var key in lootCurrency) {
				if (currencyData.hasOwnProperty(key)) {
					 if(this._getSetting('adjustCurrencyWithCR')){
						 amount = Number(currencyData[key].value || 0) + Math.ceil(cr) + Number(lootCurrency[key]);
					 } else {
						 amount = Number(currencyData[key].value || 0) + Number(lootCurrency[key]);
					 }

					 currencyData[key] = {"value": amount.toString()};
				}
			}

			await actor.update({"data.currency": currencyData});
		}

		_generateCurrency(currencyString) {
			const currenciesToAdd = {};
			if (currencyString) {
					const currenciesPieces = currencyString.split(",");
					for (const currency of currenciesPieces) {
							const match = /(.*)\[(.*?)\]/g.exec(currency); //capturing 2 groups, the formula and then the currency symbol in brakets []
							if (!match || match.length < 3) {
									ui.notifications.warn(this.moduleNamespace + `: Currency loot field contain wrong formatting, currencies need to be define as "diceFormula[currencyType]" => "1d100[gp]" but was ${currency}`);
									continue;
							}
							const rollFormula = match[1];
							const currencyString = match[2];
							const amount = this._tryRoll(rollFormula);

							if (!this._getSetting("reduceUpdateVerbosity")) ui.notifications.info(this.moduleNamespace + `:	Adding `+amount+currencyString+` to the actor.`);
							currenciesToAdd[currencyString] = (currenciesToAdd[currencyString] || 0) + amount;
					}
			}
			return currenciesToAdd;
		}

		_tryRoll(rollFormula){
			try {
				return new Roll(rollFormula).roll().total || 1;
			} catch (error) {
				return 1;
			}
		}

		_getSetting(setting){
			return game.settings.get(this.moduleNamespace,setting);
		}
}

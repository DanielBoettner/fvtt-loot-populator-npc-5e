class Currency {

    /**
     * 
     * @param actor 
     * @param rolltable 
     * @param flags
     * @param generateCurrency 
     * @param lootCurrencyDefault 
     * @param useBTR 
     */
    static async _handleCurrency(
        actor,
        flags
        ) {
		if (flags.generateCurrency && flags.lootCurrencyDefault) {
			let lootCurrencyString = flags.lootCurrencyDefault;

			if (flags.useBetterRolltables) {
				lootCurrencyString = flags.brt_rt_tcs || lootCurrencyString;
			}
			
			await Currency.addCurrenciesToActor(
				actor,
				Currency._generateCurrency(lootCurrencyString),
				flags.adjustCurrency
			);
		}
	}

    /**
     *  @param {String} currencyString 
     *  @returns 
     */
    static _generateCurrency(currencyString, moduleNamespace = "lootpopulatornpc5e") {
        const currenciesToAdd = {};

        if (currencyString) {
            const currenciesPieces = currencyString.split(",");

            for (const currency of currenciesPieces) {
                const match = /(.*)\[(.*?)\]/g.exec(currency); //capturing 2 groups, the formula and then the currency symbol in brakets []

                if (!match || match.length < 3) {
                    ui.notifications.warn(moduleNamespace + `: Currency loot field contain wrong formatting, currencies need to be define as "diceFormula[currencyType]" => "1d100[gp]" but was ${currency}`);
                    continue;
                }

                const rollFormula = match[1];
                const currencyString = match[2];
                const amount = Currency._tryRoll(rollFormula);
                currenciesToAdd[currencyString] = (currenciesToAdd[currencyString] || 0) + amount;
            }
        }

        return currenciesToAdd;
    }

    /**
	 * Expects and actor and an array
	 * @param {Actor} actor 
	 * @param {Array|string} lootCurrency 
     * @param {boolean} adjutsByCR
	 */
	static async addCurrenciesToActor(actor, lootCurrency, adjutsByCR = false) {
		let currencyData = duplicate(actor.data.data.currency),
		cr = actor.data.data.details.cr || 0,
		amount = 0;

		for (var key in lootCurrency) {
			if (currencyData.hasOwnProperty(key)) {
				if(adjutsByCR){
					amount = Number(currencyData[key].value || 0) + Math.ceil(cr) + Number(lootCurrency[key]);
				} else {
					amount = Number(currencyData[key].value || 0) + Number(lootCurrency[key]);
				}

				currencyData[key] = {"value": amount.toString()};
			}
		}

		await actor.update({"data.currency": currencyData});
	}
    
    /**
     * 
     * @param {String} rollFormula 
     * @returns 
     */
    static _tryRoll(rollFormula){
		try {
			return new Roll(rollFormula).roll().total || 1;
		} catch (error) {
			return 1;
		}
	}
}
export default Currency;
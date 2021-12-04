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
        token,
        flags
        ) {
		if (flags.generateCurrency && flags.lootCurrencyDefault) {
			let lootCurrencyString = flags.lootCurrencyDefault;

            /**
            * If we use betterRolltable and the currencyString of BRT is not empty
            * the currency was already populated.
            */
			if (
                flags.useBetterRolltables &&
                (flags.brt_rt_tcs !== undefined || flags.brt_rt_tcs?.length > 0 )
                ){
				    return;
			    }
			
			await Currency.addCurrenciesToToken(
				token,
				Currency._generateCurrency(lootCurrencyString),
				flags.adjustCurrency
			);
		}
	}

    /**
     *  @param {String} currencyString 
     *  @returns {Array}
     */
    static _generateCurrency(currencyString, moduleNamespace = "lootpopulatornpc5e") {
        const currenciesToAdd = {};

        if (currencyString) {
            const currenciesPieces = currencyString.split(",");

            for (const currency of currenciesPieces) {
                const match = /(.*)\[(.*?)\]/g.exec(currency); //capturing 2 groups, the formula and then the currency symbol in brakets []

                if (!match || match.length < 3) {
                    ui.notifications.warn(moduleNamespace + ` | Currency loot field contain wrong formatting, currencies need to be define as "diceFormula[currencyType]" => "1d100[gp]" but was ${currency}`);
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
	 * @param {Actor} token 
	 * @param {Array<string>} lootCurrency 
     * @param {boolean} adjutsByCR
	 */
	static async addCurrenciesToToken(token, lootCurrency, adjutsByCR = false) {
        const currencyDataInitial = {cp: 0, ep: 0, gp: 0, pp: 0,sp: 0};
        let currencyData = currencyDataInitial,
            amount = 0;
    
        if (token.data.actorData.data?.currency) {
          currencyData = duplicate(token.data.actorData.data.currency);
        }

		for (let key in lootCurrency) {
			if (currencyData.hasOwnProperty(key)) {
				if(adjutsByCR){
                    let cr = game.actors.find(actor => actor._id === token.data.actorId).data.data.details.cr || 0;
					amount = Number(currencyData[key] || 0) +  Number(Math.ceil(cr * lootCurrency[key]));
				} else {
					amount = Number(currencyData[key] || 0) + Number(lootCurrency[key]);
				}

				currencyData[key] = amount;
			}
		}

		await token.update({ 'actorData.data.currency': currencyData });
	}
    
    /**
     * 
     * @param {String} rollFormula 
     * @returns {number}
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
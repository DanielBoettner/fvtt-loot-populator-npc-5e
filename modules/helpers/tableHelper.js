
/**
 * @description {Rolltable} related helper functions
 * 
 * @version 1.0.0
 */
class tableHelper {

	/**
	 * Returns a rolltable 
	 * 
	 * Returns a rolltable either from a {Pack} ('compendium')
	 * or from the {Game} world.
	 * 
	 * In general its assumed that returning from {Pack} is preferable,
	 * as the returned {Rolltable} entity doesnt have to be in memory before
	 * accessing it. 
	 * 
	 * @param {string} rolltableReference 
	 * @returns {RollTable}
	 * 
	 * @version 1.0.0
	 */
	static async _getRolltable(rolltableReference){
		const [type, source, category, packReference] = rolltableReference.split('.');
		if(packReference){
			return await game.packs.get(source + '.' + category).getDocument(packReference);
		}


		return game.tables.get(source);
	}

	/**
	 * 
	 * @param {Item} item 
	 * @param {string|number} index 
	 * 
	 * @returns {Document}
	 */
    static async _rollSubTables(item, index = 0) {
		if (item instanceof RollTable) {
			const subTableResults = await item.roll(),
				  collection = subTableResults.results[index].data.collection;

			if (collection === "Item") {
				item = game.items.get(subTableResults.results[index].data.resultId);
			} else {
				let itemCollection = game.packs.get(subTableResults.results[index].data.collection);
				item = await itemCollection.getDocument(subTableResults.results[index].data.resultId);
			}

			if (item instanceof RollTable) {
				item = await tableHelper._rollSubTables(item, index);
			}
		}

		return item;
	}
}
export default tableHelper;

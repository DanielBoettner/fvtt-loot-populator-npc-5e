class tableHelper {
	static async _getRolltable(name){
		if(name.includes('_')){
			let comp_table = name.split('_');
			return await game.packs.get(comp_table[2]).getDocument(comp_table[3]);
		} 
		
		return game.tables.getName(name);
	}

    static async _rollSubTables(item, index = 0) {
		if (item instanceof RollTable) {
			let subTableResults = await item.roll();

			if (subTableResults.results[index].data.collection === "Item") {
				item = game.items.get(subTableResults.results[index].data.resultId);
			} else {
				let itemCollection = game.packs.get(subTableResults.results[index].data.collection);
				item = await itemCollection.getDocument(subTableResults.results[index].data.resultId);
			}

			if (item instanceof RollTable) {
				item = await this._rollSubTables(item, index);
			}
		}

		return item;
	}
}
export default tableHelper;

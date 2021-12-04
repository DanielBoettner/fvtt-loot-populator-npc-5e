/**
 * @module lootpopulatornpc5e.classes.LootPopulatorRule
 * @class LootPopulatorRule
 */
export class LootPopulatorRule {
    public name: string = '';
    public filters: Array<RuleFilter> = [];
    public rolltable: RollTable["uuid"] = '';
    public rolltableName: string = '';
    public tags: string = '';
    public active: boolean = false;    
}

/**
 * @module lootpopulatornpc5e.classes.RuleFilter
 * @class RuleFilter
 */
class RuleFilter{
    public path: string = '';
    public comparison: string = '';
    public value: string = '';
}

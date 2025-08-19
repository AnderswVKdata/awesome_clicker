import { Reactive } from "@web/core/utils/reactive";
import { EventBus } from "@odoo/owl";
import { rewards } from "../click_rewards";
import { choose } from "../utils";

export class ClickerModel extends Reactive {
    constructor() {
        super();
        this.clicks = 0;
        this.level = 0;
        this.bus = new EventBus();
        this.bots = {
            clickbot: {
                price: 100,
                level: 1,
                increment: 10,
                purchased: 0,
            },
            bigbot: {
                price: 500,
                level: 2,
                increment: 100,
                purchased: 0,
            },
            haxBot:{
                price: 1,
                level: 1,
                increment: 10000,
                purchased: 0,
            }
        };
        this.trees = {
            pearTree: {
                price: 1000000,
                level: 4,
                produce: "pear",
                purchased: 0,
            },
            cherryTree: {
                price: 1000000,
                level: 4,
                produce: "cherry",
                purchased: 0,
            },
        }
        this.fruits = {
            pear: 0,
            cherry: 0,
        },
        this.multiplier = 1
        this.ticks = 0;
    }

    addClick() {
        this.increment(1);
    }

    tick() {
        this.ticks++;
        for (const bot in this.bots) {
            this.clicks += this.bots[bot].increment * this.bots[bot].purchased * this.multiplier;
        }
        if (this.ticks % 3 === 0) {
            for (const tree in this.trees) {
                this.fruits[this.trees[tree].produce] += this.trees[tree].purchased;
            }
        }
    }
    buyMultiplier() {
        if (this.clicks < 1000) {
            return false;
        }
        this.clicks -= 1000;
        this.multiplier++;
    }
    buyMaxMultiplier() {
        let number = Math.floor(this.clicks / 1000); 
        number = number - (number % 2); // ensure it's even

        if (number <= 0) return;

        this.clicks -= number * 1000;
        this.multiplier += number;
    }

    buyTree(name) {
        if (!Object.keys(this.trees).includes(name)) {
            throw new Error(`Invalid tree name ${name}`);
        }
        if (this.clicks < this.trees[name].price) {
            return false;
        }
        this.clicks -= this.trees[name].price;
        this.trees[name].purchased += 1;
    }
    buyMaxTree(name){
        const tree = this.trees[name];
        if(!tree){
            throw new Error(`invalid tree name: ${name}`);
        }
        let number = Math.floor(this.clicks / tree.price);
        number -= number % 2;
        if(number <= 0) return false;
        this.clicks -= number * tree.price
        tree.purchased += number;
    }

    increment(inc) {
        this.clicks += inc;
        if (
            this.milestones[this.level] &&
            this.clicks >= this.milestones[this.level].clicks
        ) {
            this.bus.trigger("MILESTONE", this.milestones[this.level]);
            this.level += 1;
        }
    }

   buyBot(name) {
        if (!Object.keys(this.bots).includes(name)) {
            throw new Error(`Invalid bot name ${name}`);
        }
        if (this.clicks < this.bots[name].price) {
            return false;
        }

        this.clicks -= this.bots[name].price;
        this.bots[name].purchased += 1;
    }
    buyMaxBot(name) {
        const bot = this.bots[name];

        if (!bot) {
            throw new Error(`Invalid bot name: ${name}`);
        }

        let number = Math.floor(this.clicks / bot.price);

        number -= number % 2;

        if (number <= 0) return false;

        this.clicks -= number * bot.price;
        bot.purchased += number;
    }
     giveReward() {
        const availableReward = [];
        for (const reward of rewards) {
            if (reward.minLevel <= this.level || !reward.minLevel) {
                if (reward.maxLevel >= this.level || !reward.maxLevel) {
                    availableReward.push(reward);
                }
            }
        }
        const reward = choose(availableReward);
        this.bus.trigger("REWARD", reward);
        return choose(availableReward);
    }

    get milestones() {
        return [
            { clicks: 100, unlock: "clickBot" },
            { clicks: 500, unlock: "bigBot" },
            { clicks: 1000, unlock: "power multiplier" },
            { clicks: 1, unlocks: "haxBot" },
            { clicks: 1000000, unlock: "pear tree & cherry tree" },
        ];
    }
     toJSON() {
        const json = Object.assign({}, this);
        delete json["bus"];
        return json;

    }

    static fromJSON(json) {
        const clicker = new ClickerModel();
        const clickerInstance = Object.assign(clicker, json);
        return clickerInstance;
    }
}
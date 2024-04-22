"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// implementations
class PublishSubscribeService {
    constructor() {
        //This map is used to keep track of which subscribers are interested in which events.
        this.subscribers = new Map();
    }
    //method that "subscribes" a subscriber to an event
    subscribe(type, subscriber) {
        var _a;
        //check if there are subscribers for the given type of event
        if (!this.subscribers.has(type)) {
            //if not initializes an empty array for said type
            this.subscribers.set(type, []);
        }
        //adds subscriber to that list of subscribers for that event
        (_a = this.subscribers.get(type)) === null || _a === void 0 ? void 0 : _a.push(subscriber);
    }
    //when an event occurs, notifies all subscribers of that event type
    publish(event) {
        //retrieves the list of subscribers of this event type
        const subscribers = this.subscribers.get(event.type());
        if (subscribers) {
            //if list isn't empty, calls handle method on every subscriber, passing them the event
            subscribers.forEach(subscriber => subscriber.handle(event));
        }
    }
}
class MachineSaleEvent {
    constructor(_sold, _machineId) {
        this._sold = _sold;
        this._machineId = _machineId;
    }
    machineId() {
        return this._machineId;
    }
    getSoldQuantity() {
        return this._sold;
    }
    type() {
        return 'sale';
    }
}
class MachineRefillEvent {
    constructor(_refill, _machineId) {
        this._refill = _refill;
        this._machineId = _machineId;
    }
    machineId() {
        throw new Error("Method not implemented.");
    }
    type() {
        throw new Error("Method not implemented.");
    }
}
class MachineSaleSubscriber {
    constructor(machines) {
        this.machines = machines;
    }
    handle(event) {
        this.machines[2].stockLevel -= event.getSoldQuantity();
    }
}
class MachineRefillSubscriber {
    handle(event) {
        throw new Error("Method not implemented.");
    }
}
// objects
class Machine {
    constructor(id) {
        this.stockLevel = 10;
        this.id = id;
    }
}
// helpers
const randomMachine = () => {
    const random = Math.random() * 3;
    if (random < 1) {
        return '001';
    }
    else if (random < 2) {
        return '002';
    }
    return '003';
};
const eventGenerator = () => {
    const random = Math.random();
    if (random < 0.5) {
        const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
        return new MachineSaleEvent(saleQty, randomMachine());
    }
    const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
    return new MachineRefillEvent(refillQty, randomMachine());
};
// program
(() => __awaiter(void 0, void 0, void 0, function* () {
    // create 3 machines with a quantity of 10 stock
    const machines = [new Machine('001'), new Machine('002'), new Machine('003')];
    // create a machine sale event subscriber. inject the machines (all subscribers should do this)
    const saleSubscriber = new MachineSaleSubscriber(machines);
    // create the PubSub service
    const pubSubService = null; // implement and fix this
    // create 5 random events
    const events = [1, 2, 3, 4, 5].map(i => eventGenerator());
    // publish the events
    events.map(pubSubService.publish);
}))();

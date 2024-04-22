// interfaces

interface IEvent {
  type(): string;
  machineId(): string;
}

interface ISubscriber {
  handle(event: IEvent): void;
}

interface IPublishSubscribeService {
  publish (event: IEvent): void;
  subscribe (type: string, handler: ISubscriber): void;
  // unsubscribe ( /* Question 2 - build this feature */ );
  unsubscribe(type:string, handler:ISubscriber): void;
}

// implementations
class PublishSubscribeService implements IPublishSubscribeService{
  
  //This map is used to keep track of which subscribers are interested in which events.
  private subscribers: Map<string, ISubscriber[]> = new Map(); 
  private eventQueue: IEvent[] = []; //Queue to hold events so that subscribers should be notified in the order that events occur
  private processingEvent = false; 

  //method that "subscribes" a subscriber to an event
  subscribe(type:string, subscriber: ISubscriber): void { 
    //check if there are subscribers for the given type of event
    if(!this.subscribers.has(type)){ 
      //if not initializes an empty array for said type
      this.subscribers.set(type, []);
    }
    //adds subscriber to that list of subscribers for that event
    this.subscribers.get(type)?.push(subscriber);
  }
  
  //when an event occurs, notifies all subscribers of that event type
    publish(event: IEvent): void {
        this.eventQueue.push(event);  // Add new event to the queue
        if (!this.processingEvent) {
            this.processEvents();  // Process events if not already doing so
        }
    }

    private processEvents(): void {
        this.processingEvent = true;
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();  // Remove the first event from the queue
            if (event) { 
              const subscribers = this.subscribers.get(event.type());
              if (subscribers) {
                subscribers.forEach(subscriber => subscriber.handle(event));
              }
            }
        }
        this.processingEvent = false;
    }

  //unsubscribes a subscriber from an event 
  unsubscribe(type: string, handler: ISubscriber): void {
    //retrieves the list of handlers for this specific event
      const handlers = this.subscribers.get(type); 
      //check if this list is empty
      if(handlers) { 
        const idx =  handlers.indexOf(handler); 
        //if the index of the handler is found, then remove it from 
        if(idx > -1) { 
          handlers.splice(idx, 1); 
        }
      }

  }
}

class MachineSaleEvent implements IEvent {
  constructor(private readonly _sold: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  getSoldQuantity(): number {
    return this._sold
  }

  type(): string {
    return 'sale';
  }
}

class MachineRefillEvent implements IEvent {
  constructor(private readonly _refill: number, private readonly _machineId: string) {}

  machineId(): string {
    return this._machineId;
  }

  type(): string {
    return "refill"; 
  }

  getRefillQuantity(): number{
    return this._refill; 
  }
}

class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor (machines: Machine[]) {
    this.machines = machines; 
  }
  handle(event: MachineSaleEvent): void {
    const machine = this.machines.find(m => m.id === event.machineId());
    if (machine) {
      machine.stockLevel -= event.getSoldQuantity();
      console.log(`Machine ${machine.id} sold ${event.getSoldQuantity()} units. Remaining stock: ${machine.stockLevel}`);
    } else {
      console.log('Machine not found for ID:', event.machineId());
    }
}
}

class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(machines:Machine[]) { 
    this.machines = machines; 
  }
  handle(event: IEvent): void {
    //check if event type is refill and if the event is an instance of MachineRefillEvent
    if(event.type() == "refill" && event instanceof MachineRefillEvent){ 
      //finds the corresponding machine using machineID
      const machine = this.machines.find(m => m.id == event.machineId()); 
      if(machine) { 
        machine.stockLevel += event.getRefillQuantity(); 
        console.log(`Machine ${machine.id} has been refilled. Updated Stock Level is ${machine.stockLevel}`);
      }
    }
  }
}

class StockWarningSubscriber implements ISubscriber { 
  private machines:Machine[]
  private pubSubService: IPublishSubscribeService;

  constructor(machines:Machine[], pubSubService: IPublishSubscribeService) { 
    this.machines = machines; 
    this.pubSubService = pubSubService; 
  }
  
  handle(event: IEvent): void {
   const machine = this.machines.find(m => m.id === event.machineId());

    // Add a check to ensure 'machine' is not undefined
    if (machine && machine.stockLevel < 3 && !machine.lowStockIssued) {
        console.log(`Machine ${machine.id} currently has low stock. Please refill as soon as possible!`);
        this.pubSubService.publish(new LowStockWarningEvent(machine.id)); 
        machine.lowStockIssued = true;
        machine.oKStockIssued = false;
    }
  }
}

//an event for when a machine has low stock
class LowStockWarningEvent implements IEvent {
    constructor(private _machineId: string) {}

    type(): string {
        return "lowStockWarning";
    }

    machineId(): string {
        return this._machineId;
    }
}

//an event for when a machine has "ok" stock 
class StockLevelOkEvent implements IEvent {
    constructor(private _machineId: string) {}

    type(): string {
        return "stockLevelOk";
    }

    machineId(): string {
        return this._machineId;
    }
}



class oKStatusSubscriber implements ISubscriber { 
  private machines:Machine[]
  private pubSubService: IPublishSubscribeService;

  constructor(machines:Machine[], pubSubService: IPublishSubscribeService) { 
    this.machines = machines; 
    this.pubSubService = pubSubService; 
  }
  
  handle(event: IEvent): void {
    const machine = this.machines.find(m => m.id == event.machineId()); 
    if (!machine) return; 
    if(machine.stockLevel >= 3 && !machine.oKStockIssued){ 
      this.pubSubService.publish(new StockLevelOkEvent(machine.id)); 
      console.log(`Machine ${machine.id} currently has OK stock. No refill currently needed!`);
      machine.oKStockIssued = true; // OK status has been issued 
      machine.lowStockIssued = false; //resets the low stock status 
    }
  }
}


// objects
class Machine {
  public stockLevel = 10;
  public id: string;
  public lowStockIssued: boolean = false; 
  public oKStockIssued: boolean = false; 
  

  constructor (id: string) {
    this.id = id;
  }
}

// helpers
const randomMachine = (): string => {
  const random = Math.random() * 3;
  if (random < 1) {
    return '001';
  } else if (random < 2) {
    return '002';
  }
  return '003';

}

const eventGenerator = (): IEvent => {
  const random = Math.random();
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine());
  } 
  const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine());
}



// program
(async () => {
  // Create 3 machines with a quantity of 10 stock each
  const machines: Machine[] = [new Machine('001'), new Machine('002'), new Machine('003')];

  // Create the Publish Subscribe service
  const pubSubService: IPublishSubscribeService = new PublishSubscribeService();

  // Create a machine sale event subscriber and inject the machines
  const saleSubscriber = new MachineSaleSubscriber(machines);
  const refillSubscriber = new MachineRefillSubscriber(machines);
  const stockWarningSubscriber = new StockWarningSubscriber(machines, pubSubService);


  // Register subscribers
  pubSubService.subscribe('sale', saleSubscriber);
  pubSubService.subscribe('refill', refillSubscriber);
  pubSubService.subscribe('lowStockWarning', stockWarningSubscriber);

  // // Generate and publish events
  const events = [1, 2, 3, 4, 5].map(i => eventGenerator());
  events.forEach(event => pubSubService.publish(event));

   // Trigger a sale event that would decrease the stock below 3
   pubSubService.publish(new MachineSaleEvent(8, '002')); //
   // Assuming the stock was initially low and is now being refilled above the threshold
   pubSubService.publish(new MachineRefillEvent(5, '003'));
})();

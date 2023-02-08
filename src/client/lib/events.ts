type CustomEventHandler = (...args: any[]) => void;

export class CustomEventEmitter {
  eventMap: Record<string, CustomEventHandler[]>
  constructor() {
    this.eventMap = {};
  }

  on(eventName: string, handler: CustomEventHandler) {
    if(!this.eventMap[eventName]) {
      this.eventMap[eventName] = [];
    }

    this.eventMap[eventName].push(handler);
  }

  emit(...args: any[]) {
    const eventName = args.unshift();
    if(this.eventMap[eventName]) {
      this.eventMap[eventName].forEach(handler => {
        handler(...args);
      });
    }
  }
}

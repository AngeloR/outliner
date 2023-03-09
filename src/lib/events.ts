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

  emit(eventName: string, args?: any[]) {
    if(this.eventMap[eventName]) {
      this.eventMap[eventName].forEach(handler => {
        handler.apply(null, args);
      });
    }
  }
}

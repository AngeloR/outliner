import {isVisible} from "./dom";

export class Cursor {
  constructor() {

  }

  resetCursor() {
    this.set('.node');
  }

  get() {
    return document.querySelector('.cursor');
  }

  getIdOfNode(): string {
    return this.get().getAttribute('data-id');
  }

  unset() {
    const el = this.get();
    if(el) {
      el.classList.remove('cursor');
    }
  }

  set(elementId: string) {
    this.unset();
    const el = document.querySelector(elementId) as HTMLElement;

    if(el) {
      el.classList.add('cursor');
      if(!isVisible(el)) {
        el.scrollIntoView(true);
      }
    }
  }

  collapse() {
    this.get().classList.remove('expanded');
    this.get().classList.add('collapsed');
  }

  expand() {
    this.get().classList.remove('collapsed');
    this.get().classList.add('expanded');
  }

  isNodeCollapsed(): boolean {
    return this.get().classList.contains('collapsed');
  }
  
  isNodeExpanded(): boolean {
    return this.get().classList.contains('expanded');
  }
}

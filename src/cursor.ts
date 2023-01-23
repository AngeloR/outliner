export class Cursor {
  constructor() {

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
    const el = document.querySelector(elementId);

    if(el) {
      el.classList.add('cursor');
      if(!this.isVisible(elementId)) {
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

  isVisible(elementId: string) {
    const el = document.querySelector(elementId) as HTMLElement;
    var rect = el.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&     
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}

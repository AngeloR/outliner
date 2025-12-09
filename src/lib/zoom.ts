import { $, $$ } from '../dom';
import { Cursor } from '../cursor';
import { Outline } from './outline';

class ZoomManager {
  private getOutliner(): HTMLElement {
    return $('#outliner');
  }

  private isActive(): boolean {
    const container = this.getOutliner();
    return !!container?.dataset.zoomActive;
  }

  private setActive(active: boolean) {
    const container = this.getOutliner();
    if (!container) return;
    if (active) {
      container.dataset.zoomActive = 'true';
      container.classList.add('zoom-mode');
    } else {
      delete container.dataset.zoomActive;
      delete container.dataset.zoomRoot;
      delete container.dataset.zoomOrigin;
      container.classList.remove('zoom-mode');
    }
  }

  private getRootId(): string | undefined {
    return this.getOutliner()?.dataset.zoomRoot;
  }

  private setRootId(id: string) {
    const container = this.getOutliner();
    if (!container) return;
    container.dataset.zoomRoot = id;
  }

  private setOriginId(id: string) {
    const container = this.getOutliner();
    if (!container) return;
    container.dataset.zoomOrigin = id;
  }

  private getOriginId(): string | undefined {
    return this.getOutliner()?.dataset.zoomOrigin;
  }

  private isDescendant(root: HTMLElement, el: HTMLElement): boolean {
    return root === el || root.contains(el);
  }

  private showOnlySubtree(rootNodeId: string) {
    const outliner = this.getOutliner();
    if (!outliner) return;
    const rootEl = $(`#id-${rootNodeId}`) as HTMLElement;
    if (!rootEl) return;

    // Compute ancestor chain up to outliner
    const ancestors: HTMLElement[] = [];
    let walker: HTMLElement | null = rootEl.parentElement;
    while (walker) {
      if (walker.classList?.contains('node')) {
        ancestors.push(walker);
      }
      if (walker === outliner) break;
      walker = walker.parentElement;
    }

    const allNodes = $$('.node', outliner);
    // Hide everything by default
    allNodes.forEach(nodeEl => nodeEl.style.display = 'none');

    // Show ancestor chain as structural wrappers only
    ancestors.forEach(ancestor => {
      ancestor.style.display = 'contents';
      const content = $('.nodeContent', ancestor);
      if (content) {
        (content as HTMLElement).style.display = 'none';
      }
    });

    // Show the root and its descendants normally
    const showList = [rootEl].concat($$('.node', rootEl));
    showList.forEach(nodeEl => {
      nodeEl.style.display = '';
      const content = $('.nodeContent', nodeEl);
      if (content) {
        (content as HTMLElement).style.display = '';
      }
    });
  }

  private showAll() {
    const outliner = this.getOutliner();
    if (!outliner) return;
    $$('.node', outliner).forEach(el => {
      el.style.display = '';
      const content = $('.nodeContent', el);
      if (content) {
        (content as HTMLElement).style.display = '';
      }
    });
  }

  enterZoom(cursor: Cursor, outline: Outline) {
    const currentId = cursor.getIdOfNode();
    const outliner = this.getOutliner();
    if (!outliner) {
      return;
    }

    if (!this.isActive()) {
      // first-enter: record origin (the node we zoomed from)
      this.setOriginId(currentId);
    }

    this.setActive(true);
    this.setRootId(currentId);

    // Expand the root if it is collapsed so children are visible
    const rootEl = $(`#id-${currentId}`) as HTMLElement;
    if (rootEl && rootEl.classList.contains('collapsed')) {
      rootEl.classList.remove('collapsed');
      rootEl.classList.add('expanded');
      outline.unfold(currentId);
    }

    this.showOnlySubtree(currentId);
  }

  exitZoom(cursor: Cursor) {
    if (!this.isActive()) {
      return;
    }
    const originId = this.getOriginId();
    this.showAll();
    this.setActive(false);

    if (originId) {
      cursor.set(`#id-${originId}`);
    }
  }
}

export const Zoom = new ZoomManager();



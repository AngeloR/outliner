export function isVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&     
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

export function $(selector: string, root ?: HTMLElement) {
  return (root || document).querySelector(selector) as HTMLElement;
}

export function $$(selector: string, root ?: HTMLElement) {
  const els = Array.from((root || document).querySelectorAll(selector)) as HTMLElement[];
  return els;
}

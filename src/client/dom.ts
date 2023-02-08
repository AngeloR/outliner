export function isVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&     
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

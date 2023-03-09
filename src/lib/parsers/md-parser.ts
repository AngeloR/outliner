export function link(href: string, title: string, text: string): string {
  return `<a href="${href}" ${title ? 'title="${title}"' : ''} target="_blank">${text}</a>`;
}

import { Tokens } from 'marked';

export function link(token: Tokens.Link): string {
  return `<a href="${token.href}" ${token.title ? `title="${token.title}"` : ''} target="_blank">${token.text}</a>`;
}

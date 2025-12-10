import { Tokens } from 'marked';

export function link(token: Tokens.Link): string {
  return `<a href="${token.href}" ${token.title ? `title="${token.title}"` : ''} target="_blank">${token.text}</a>`;
}

function decodeHtmlEntities(input: string): string {
  if (!input) {
    return '';
  }
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeForCode(input: string): string {
  if (!input) {
    return '';
  }
  // For code content, escape only what is necessary for safe HTML text rendering.
  // We intentionally do NOT escape '>' so sequences like `g>g` render literally.
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;');
}

export function codespan(token: Tokens.Codespan): string {
  const text = token.text;
  const decoded = decodeHtmlEntities(text);
  const escaped = escapeForCode(decoded);
  return `<code>${escaped}</code>`;
}

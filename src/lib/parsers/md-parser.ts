import { convertFileSrc } from '@tauri-apps/api/tauri';
import { config } from '../config-reader';

export function link(href: string, title: string, text: string): string {
  return `<a href="${href}" ${title ? 'title="${title}"' : ''} target="_blank">${text}</a>`;
}

export function image(href: string, title: string, text: string): string {
  const path = `${config.iamgeDirPath()}/${href}`;
  console.log('loading image path', path);
  return `<img src="${convertFileSrc(path)}" alt="${text}">`;
}

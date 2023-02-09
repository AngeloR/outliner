import { create, insert, insertBatch, search } from '@lyrasearch/lyra';
import { map } from 'lodash';
import { ContentNode } from '@prisma/client';
import keyboardJS from 'keyboardjs';
import {isVisible} from './dom';

const searchModal = `
<div class="modal">
<div class="modal-content" id="search">
<input type="text" id="search-query" placeholder="enter fuzzy search terms">
<ul id="search-results">
</ul>
</div>
</div>
`;

export class Search {
  db: any;
  debounce: any;
  state: 'ready' | 'notready'

  onTermSelection: any;
  constructor() {
    this.state = 'notready';
  }

  async createIndex(schema: Record<string, any>) {
    this.db = await create({
      schema
    });
    this.state = 'ready';
  }

  bindEvents() {
    keyboardJS.withContext('search', () => {
      keyboardJS.bind('escape', e => {
        document.querySelector('.modal').remove();
        keyboardJS.setContext('navigation');
      });

      keyboardJS.bind('down', e => {
        e.preventDefault();
        document.getElementById('search-query').blur();
        const el = document.querySelector('.search-result.selected');
        if(el.nextElementSibling) {
          el.classList.remove('selected');
          el.nextElementSibling.classList.add('selected');
          if(!isVisible(el.nextElementSibling as HTMLElement)) {
            el.nextElementSibling.scrollIntoView();
          }
        }
      });

      keyboardJS.bind('up', e => {
        e.preventDefault();
        const el = document.querySelector('.search-result.selected');
        if(el.previousElementSibling) {
          el.classList.remove('selected');
          el.previousElementSibling.classList.add('selected');
          if(!isVisible(el.previousElementSibling as HTMLElement)) {
            el.previousElementSibling.scrollIntoView();
          }
        }
      })

      keyboardJS.bind('enter', e => {
        const el = document.querySelector('.search-result.selected');
        const docId = el.getAttribute('data-id');

        document.querySelector('.modal').remove();
        keyboardJS.setContext('navigation');

        if(this.onTermSelection) {
          this.onTermSelection(docId);
        }
      });
    });

    keyboardJS.withContext('navigation', () => {
      keyboardJS.bind('shift + f', e => {
        e.preventDefault();
        e.stopPropagation(); 

        document.querySelector('body').innerHTML += searchModal;
        const el = document.getElementById('search-query');
        el.focus();
        el.addEventListener('keyup', this.debounceSearch.bind(this));
        keyboardJS.setContext('search');
      });
    });
  }

  debounceSearch(e: KeyboardEvent) {
    if(this.debounce) {
      clearInterval(this.debounce);
    }

    const el = e.target as HTMLTextAreaElement;
    const query = el.value.toString().trim();

    if(query.length) {
      this.debounce = setTimeout(() => {
        this.displaySearch(query, e);
      }, 100);
    }
  }

  async displaySearch(terms: string, e: KeyboardEvent) {
    if(!this.state) {
      return;
    }
    const res = await this.search(terms);

    const resultContainer = document.getElementById('search-results');

    if(res.hits.length === 0) {
      resultContainer.innerHTML = '<li><em>No Results</em></li>';
      return;
    }

    const html = res.hits.map((doc, idx) => {
      const content = doc.document.content.toString();
      const display = content.substring(0, 100);

      return `
      <li class="search-result ${idx === 0 ? 'selected' : ''}" data-id="${doc.id}">${display}${content.length > display.length ? '...': ''}</li>
      `;
    });

    resultContainer.innerHTML = html.join("\n");
  }

  indexDoc(doc: Record<string, any>) {
    return insert(this.db, doc)
  }

  indexBatch(docs: Record<string, ContentNode>) {
    return insertBatch(this.db, map(docs, doc => doc as any));
  }

  search(term: string) {
    return search(this.db, {
      term: term.trim(),
      properties: ["content"]
    });
  }
}

import { slugify } from "./string";
import { v4 as uuid } from 'uuid';
import {CustomEventEmitter} from "./events";
import keyboardJS from 'keyboardjs';


type ModalOptions = {
  title: string;
  name?: string;
  escapeExitable?: boolean;
  keyboardContext?: string;
}

export class Modal extends CustomEventEmitter {
  options: ModalOptions;
  id: string;
  name: string;
  content: string;
  constructor(opts: ModalOptions, content: string = '') {
    super();
    this.options = opts;
    this.content = content;

    this.name = slugify(this.options.name || this.options.title);
    this.id = `id-${uuid()}`;

    if(this.options.escapeExitable && !this.options.keyboardContext) {
      this.options.keyboardContext = slugify(this.options.title) + 'kbd-context';
    }

    if(this.options.keyboardContext && this.options.escapeExitable) {
      this.makeExitable();
    }
  }

  makeExitable() {
    keyboardJS.withContext(this.options.keyboardContext, () => {
      keyboardJS.bind('escape', e => {
        this.remove();
      })
    });
  }

  renderModalTitle() {
    if(this.options.title) {
      return `<h1>${this.options.title}</h1>`;
    }
    return ``;
  }

  renderModalContent() {
    return this.content;
  }

  renderModal() {
    let html = `
    <div class="modal" id="${this.id}">
    <div class="modal-content">
      ${this.renderModalTitle()}
      ${this.renderModalContent()}
    </div>
    </div>
    `;

    return html;
  }

  updateRender() {
    const el = document.getElementById(this.id);
    el.innerHTML = `<div class="modal-content">
    ${this.renderModalTitle()}
    ${this.renderModalContent()}
    </div>`;

    this.emit('updated');
  }

  isShown(): boolean {
    const el = document.getElementById(this.id);
    return el && !el.classList.contains('hidden');
  }

  show() {
    if(this.isShown()) {
      this.updateRender();
    }
    else {
      document.querySelector('body').innerHTML += this.renderModal();
      if(this.options.keyboardContext) {
        keyboardJS.setContext(this.options.keyboardContext);

        if(this.options.escapeExitable) {
        }
      }
      this.emit('rendered');
    }
  }

  remove() {
    document.getElementById(this.id).remove();
    this.emit('removed');
    keyboardJS.setContext('navigation');
  }
}

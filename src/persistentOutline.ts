import { Outline } from './outline';
import RemoteStorage from 'remotestoragejs';
import Widget from 'remotestorage-widget';
import { v4 as uuid } from 'uuid';

const defaultId = uuid();

export class PersistOutline {
  rs: RemoteStorage;
  state: 'connected' | 'disconnected';

  constructor() {
    this.state = 'disconnected';
    this.rs = new RemoteStorage();
    this.rs.access.claim('xangelo-outliner', 'rw');
    this.rs.caching.enable('/xangelo-outliner/');

    this.bindRSEvents();
  }

  bindRSEvents() {
    this.rs.on('connected', () => {
      this.state = 'connected';
    });
    this.rs.on('network-offline', () => {
      this.state = 'disconnected';
    });
    this.rs.on('network-online', () => {
      this.state = 'connected';
    });
  }

  attachWidget(elementId: string) {
    const widget = new Widget(this.rs);
    widget.attach(elementId);
  }
}

import { JSDOM } from 'jsdom';

export default function bootstrapDom () {
  const { window } = new JSDOM('<!doctype html><html><body></body></html>');

  const win = window;

  global.window = win as any;
  global.document = window.document;
  global.HTMLElement = window.HTMLElement;
  global.Node = window.Node;
  global.CustomEvent = window.CustomEvent;
  global.customElements = window.customElements;
}


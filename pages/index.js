import { JSDOM } from 'jsdom';

export async function handler (req, res) {
  const dom = new JSDOM(`<!DOCTYPE html><html><head><title>My Page</title></head><body><div id="app"></div></body></html>`);
  const document = dom.window.document;
  const app = document.getElementById('app');

  app.innerHTML = '<div style="background-color: red">hello world!</div>'
 
  res.send(dom.serialize()); 
} 
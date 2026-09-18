import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const endpoint = process.argv[2] || 'http://127.0.0.1:9225';
const screenshotDirectory = process.argv[3];
if (screenshotDirectory) await mkdir(screenshotDirectory, { recursive: true });
const tabs = await (await fetch(`${endpoint}/json`)).json();
const tab = tabs.find(item => item.type === 'page');
if (!tab) throw new Error('No browser page found.');
const socket = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
let id = 0;
const pending = new Map();
socket.onmessage = event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
};
const command = (method, params = {}) => new Promise(resolve => { const requestId = ++id; pending.set(requestId, resolve); socket.send(JSON.stringify({ id: requestId, method, params })); });
for (const width of [390, 768, 1440]) {
  await command('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
  await command('Page.reload', { ignoreCache: true });
  await new Promise(resolve => setTimeout(resolve, 800));
  const result = await command('Runtime.evaluate', { returnByValue: true, expression: `(() => ({
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    ok: document.documentElement.scrollWidth <= innerWidth,
    probes: ['.edition-heading h1','.edition-stories','.story-card h2','.story-card'].map(selector => { const el=document.querySelector(selector); if(!el)return null; const box=el.getBoundingClientRect(); return {selector,left:Math.round(box.left),right:Math.round(box.right),width:Math.round(box.width),scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,whiteSpace:getComputedStyle(el).whiteSpace,display:getComputedStyle(el).display}; }),
    overflow: [...document.querySelectorAll('body *')].filter(el => {
      if (el.closest('.domain-rail, .masthead-nav nav')) return false;
      const box = el.getBoundingClientRect();
      return box.right > innerWidth + 1 || box.left < -1;
    }).slice(0, 12).map(el => ({tag: el.tagName, className: String(el.className).slice(0,120), left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth}))
  }))()` });
  console.log(JSON.stringify(result.result.result.value));
  if (screenshotDirectory) {
    const screenshot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(join(screenshotDirectory, `responsive-${width}.png`), Buffer.from(screenshot.result.data, 'base64'));
  }
}
socket.close();

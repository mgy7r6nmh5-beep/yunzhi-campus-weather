const { spawn } = require('child_process');
const fs = require('fs');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const [url, w, h, out, mobile] = process.argv.slice(2);
const port = 9334;
const proc = spawn(edge, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + process.env.TEMP + '/edge-cdps-' + Date.now(),
  'about:blank'
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let list = [];
  for (let i = 0; i < 40; i++) {
    try {
      list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      if (list.length) break;
    } catch (e) { /* 等待调试端口 */ }
    await sleep(300);
  }
  const page = list.find((t) => t.type === 'page');
  if (!page) { console.log('NO_PAGE'); proc.kill(); process.exit(1); }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let seq = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params) => new Promise((r) => {
    const id = ++seq;
    pending.set(id, r);
    ws.send(JSON.stringify({ id, method, params: params || {} }));
  });

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: Number(w), height: Number(h), deviceScaleFactor: 1, mobile: mobile === '1'
  });
  await send('Page.navigate', { url });
  await sleep(7000);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(out, Buffer.from(shot.result.data, 'base64'));
  console.log('saved ' + out);
  ws.close();
  proc.kill();
  process.exit(0);
})();
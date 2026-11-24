const { spawn } = require('child_process');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const url = process.argv[2];
const port = 9333;
const proc = spawn(edge, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--remote-debugging-port=' + port,
  '--user-data-dir=' + process.env.TEMP + '/edge-cdp-' + Date.now(),
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
    width: 390, height: 900, deviceScaleFactor: 1, mobile: true
  });
  await send('Page.navigate', { url });
  await sleep(7000);

  const expr = `(() => {
    const de = document.documentElement;
    const res = {
      innerWidth: window.innerWidth,
      htmlScrollWidth: de.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      locGridCols: getComputedStyle(document.querySelector('.loc-grid')).gridTemplateColumns,
      metricsCols: getComputedStyle(document.querySelector('.metrics')).gridTemplateColumns,
      overflow: []
    };
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > window.innerWidth + 1) {
        res.overflow.push({
          tag: el.tagName,
          cls: String(el.className).slice(0, 46),
          right: Math.round(r.right),
          width: Math.round(r.width)
        });
      }
    });
    res.overflow = res.overflow.slice(0, 15);
    return res;
  })()`;

  const out = await send('Runtime.evaluate', { returnByValue: true, expression: expr });
  console.log(JSON.stringify(out.result.result.value, null, 1));
  ws.close();
  proc.kill();
  process.exit(0);
})();
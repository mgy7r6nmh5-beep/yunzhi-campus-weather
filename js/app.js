(function () {
  const state = {
    locId: 'east_field',
    intentId: 'outdoor',
    cloudType: 'cumulus',
    style: 'brief',
    metrics: null,
    degraded: false,
    kind: 'live',
    advice: null,
    pendingRecord: null
  };

  const ALBUM_KEY = 'yunzhi.album';

  const qs = function (sel) { return document.querySelector(sel); };
  const esc = function (str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  function locById(id) {
    return LOCATIONS.filter(function (l) { return l.id === id; })[0] || LOCATIONS[0];
  }
  function intentById(id) {
    return INTENTS.filter(function (i) { return i.id === id; })[0] || INTENTS[0];
  }

  /* ---------- 静态渲染 ---------- */
  function renderLocations() {
    const grid = qs('#locGrid');
    grid.innerHTML = LOCATIONS.map(function (loc) {
      const meta = loc.kind === 'trail' ? '校外场景' : loc.tags[0];
      return '<button type="button" class="loc-card ' + (loc.kind === 'trail' ? 'outdoor' : '') + '"' +
        ' data-loc="' + loc.id + '" aria-pressed="' + (loc.id === state.locId) + '">' +
        '<svg class="icon"><use href="#' + loc.icon + '"></use></svg>' +
        '<span class="loc-name">' + esc(loc.name) + '</span>' +
        '<span class="loc-meta">' + esc(meta) + '</span>' +
        '</button>';
    }).join('');
  }

  function renderIntents() {
    const row = qs('#intentRow');
    row.innerHTML = INTENTS.map(function (item) {
      return '<button type="button" class="intent-chip" data-intent="' + item.id + '"' +
        ' aria-pressed="' + (item.id === state.intentId) + '" title="' + esc(item.hint) + '">' +
        esc(item.name) + '</button>';
    }).join('');
  }

  function renderCloudTypes() {
    const box = qs('#cloudTypes');
    box.innerHTML = CLOUD_TYPES.map(function (t) {
      return '<button type="button" class="chip" data-cloud="' + t.id + '"' +
        ' aria-pressed="' + (t.id === state.cloudType) + '">' +
        '<svg class="chip-art" viewBox="0 0 40 22" aria-hidden="true">' + (CLOUD_SHAPES[t.id] || '') + '</svg>' +
        esc(t.name) + '</button>';
    }).join('');
  }

  function renderStyles() {
    const box = qs('#styles');
    box.innerHTML = NOTE_STYLES.map(function (s) {
      return '<button type="button" class="chip" data-style="' + s.id + '"' +
        ' aria-pressed="' + (s.id === state.style) + '">' + esc(s.name) + '</button>';
    }).join('');
  }

  /* ---------- 状态栏 ---------- */
  function fmtTime(ts) {
    if (!ts) return '--:--';
    const d = new Date(ts);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function renderStatus(kind, fetchedAt, degraded) {
    const bar = qs('#statusBar');
    const dot = qs('#dataDot');
    const label = qs('#dataState');
    const time = qs('#dataTime');
    bar.className = 'status';
    dot.style.background = '';

    if (degraded) {
      bar.classList.add('degraded');
      label.textContent = '降级模式 · 接口不可用 · 输出零数值';
      time.textContent = '保守建议';
      return;
    }
    const map = {
      live: { cls: 'live', text: '实时气象数据' },
      cache: { cls: 'live', text: '实时数据 · 缓存命中' },
      stale: { cls: 'fallback', text: '过期缓存 · 接口暂不可用' },
      sample: { cls: 'fallback', text: '示例数据 · 非实时' }
    };
    const hit = map[kind] || map.sample;
    bar.classList.add(hit.cls);
    label.textContent = hit.text;
    time.textContent = fmtTime(fetchedAt);
  }

  /* ---------- 指标 ---------- */
  function renderMetrics(m) {
    const box = qs('#metrics');
    const defs = [
      { k: '气温', v: m ? m.temperature_2m.toFixed(1) : '—', u: '℃' },
      { k: '体感', v: m ? m.apparent_temperature.toFixed(1) : '—', u: '℃' },
      { k: '风速', v: m ? m.wind_speed_10m.toFixed(1) : '—', u: 'm/s' },
      { k: '阵风', v: m ? m.wind_gusts_10m.toFixed(1) : '—', u: 'm/s' },
      { k: '降水', v: m ? m.precipitation.toFixed(1) : '—', u: 'mm' },
      { k: '湿度', v: m ? Math.round(m.relative_humidity_2m) : '—', u: '%' },
      { k: '云量', v: m ? Math.round(m.cloud_cover) : '—', u: '%' },
      { k: '紫外线', v: m ? m.uv_index.toFixed(1) : '—', u: '' }
    ];
    box.innerHTML = defs.map(function (d) {
      const isNull = d.v === '—';
      return '<div class="metric' + (isNull ? ' null' : '') + '">' +
        '<span class="k">' + d.k + '</span>' +
        '<span class="v">' + d.v + (d.u && !isNull ? '<small>' + d.u + '</small>' : '') + '</span>' +
        '</div>';
    }).join('');
  }

  /* ---------- 结论 ---------- */

  function renderVerdict() {
    const loc = locById(state.locId);
    const intent = intentById(state.intentId);
    const advice = Engine.buildAdvice(loc, intent, state.degraded ? null : state.metrics);
    state.advice = advice;

    document.body.setAttribute('data-scene', advice.scene || 'cloudy');

    const allowed = state.degraded ? [] : Engine.allowedFromMetrics(state.metrics);
    const texts = [advice.conclusion, advice.oneLine, advice.tip]
      .concat(advice.cards.map(function (c) { return c.note; }));
    const report = Engine.audit(texts, allowed, state.degraded);

    const cardsHtml = advice.cards.map(function (c) {
      return '<div class="jcard">' +
        '<div class="jcard-top"><svg class="icon"><use href="#' + c.icon + '"></use></svg>' + esc(c.title) + '</div>' +
        '<div class="level ' + c.levelClass + '">' + esc(c.level) + '</div>' +
        '<div class="note">' + esc(c.note) + '</div>' +
        '</div>';
    }).join('');

    const auditDetail = report.pass
      ? (state.degraded ? '降级场景白名单为空，输出零数值' : '未命中任何非白名单数值')
      : ('命中：' + report.illegal.join('、') + (report.unitHit ? '（检测到数值单位）' : ''));

    qs('#verdict').innerHTML =
      '<div class="verdict-head level-' + advice.levelKey + '">' +
        '<span class="conclusion-pill">' + esc(advice.conclusion) + '</span>' +
        '<p class="one-line">' + esc(advice.oneLine) + '</p>' +
      '</div>' +
      '<div class="cards">' + cardsHtml + '</div>' +
      '<div class="tip-line"><svg class="icon"><use href="#i-pin"></use></svg>' +
        '<span><b>位置提示</b>　' + esc(advice.tip) + '</span></div>' +
      '<div class="audit">' +
        '<span class="tag ' + (report.pass ? 'pass' : 'fail') + '">输出校验 ' + (report.pass ? '通过' : '不通过') + '</span>' +
        '<span>白名单 ' + report.allowedCount + ' 项</span>' +
        '<span>' + esc(auditDetail) + '</span>' +
        '<span>' + esc(advice.source) + '</span>' +
      '</div>';

    const srcLine = qs('#srcLine');
    if (srcLine) {
      srcLine.textContent = state.degraded ? '降级模式 · 无数值可用' : 'open-meteo 实时气象接口';
    }
  }

  /* ---------- 取数 ---------- */
  let reqSeq = 0;

  async function refresh() {
    const loc = locById(state.locId);
    const seq = ++reqSeq;

    if (state.degraded) {
      state.metrics = null;
      renderStatus('degraded', null, true);
      renderMetrics(null);
      renderVerdict();
      return;
    }

    renderStatus('live', null, false);
    qs('#dataState').textContent = '正在获取实时气象数据';

    const res = await Weather.get(loc);
    if (seq !== reqSeq) return;

    state.metrics = res.metrics;
    state.kind = res.kind;
    renderStatus(res.kind, res.fetchedAt, false);
    renderMetrics(res.metrics);
    renderVerdict();
  }

  /* ---------- 云景 ---------- */
  function renderRecord(out, isSample) {
    const box = qs('#recordOut');

    if (!out || out.needMore) {
      box.innerHTML = '<div class="ask-card">' +
        '<b><svg class="icon"><use href="#i-flag"></use></svg>信息不足，先追问</b>' +
        '<p>' + esc(out ? out.question : '先告诉我云型、拍摄地点与一句描述。') + '</p>' +
        '<small>规则：汉字少于 12 字或缺少时间、地点、方位中的两项时，不硬编内容。</small>' +
        '</div>';
      return;
    }

    const r = out.record;
    const meta = r.meta || { style: 'brief' };
    const chars = Engine.hanziCount(r.note);
    const cliche = PHOTO_CLICHE.filter(function (w) { return r.note.indexOf(w) !== -1; });
    const labelOver = r.tags.some(function (t) { return Engine.hanziCount(t) > 6; });
    const lenPass = chars <= 50;
    const clichePass = cliche.length === 0;
    const tagPass = !labelOver && r.tags.length >= 1 && r.tags.length <= 2;

    box.innerHTML =
      '<div class="rec-card' + (isSample ? ' is-sample' : '') + '">' +
        '<div class="rec-head">' +
          '<span class="rec-type">' + esc(r.cloud_type) + '</span>' +
          '<span class="rec-meta">' + (isSample ? '<span class="sample-tag">示例</span>' : '') +
            esc(meta.style === 'study' ? '科普说明' : meta.style === 'life' ? '生活化' : '简洁记录') + '</span>' +
        '</div>' +
        '<div class="points">' +
          '<div class="point"><b>云底高度与参照物</b><span>' + esc(r.points.height_ref) + '</span></div>' +
          '<div class="point"><b>光线方向与测光</b><span>' + esc(r.points.light) + '</span></div>' +
          '<div class="point"><b>形态与云底判别</b><span>' + esc(r.points.form) + '</span></div>' +
          '<div class="point"><b>时间地点方位</b><span>' + esc(r.points.time_place) + '</span></div>' +
        '</div>' +
        '<div class="rec-note">' + esc(r.note) + '</div>' +
        '<div class="rec-tags">' + r.tags.map(function (t) { return '<span class="t">' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="rec-foot">' +
          '<span>字数 ' + chars + '/50 ' + (lenPass ? '达标' : '超限') +
          ' · 标签 ' + r.tags.length + ' 个 ' + (tagPass ? '达标' : '不合规') +
          ' · 摄影套话 ' + (clichePass ? '未命中' : '命中 ' + cliche.join('、')) + '</span>' +
          (isSample
            ? '<span>示例记录，生成后替换这里</span>'
            : '<button class="btn-ghost" id="saveRecord" type="button">存入打卡册</button>') +
        '</div>' +
      '</div>';

    if (isSample) return;

    state.pendingRecord = r;
    const saveBtn = qs('#saveRecord');
    if (saveBtn) saveBtn.addEventListener('click', saveRecord);
  }

  function generateRecord() {
    const out = Engine.buildCloudRecord({
      cloudType: state.cloudType,
      style: state.style,
      desc: qs('#cloudDesc').value,
      place: qs('#cloudPlace').value,
      time: qs('#cloudTime').value
    });
    renderRecord(out);
  }

  /* ---------- 打卡册 ---------- */
  function readAlbum() {
    try {
      const raw = localStorage.getItem(ALBUM_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function writeAlbum(arr) {
    try {
      localStorage.setItem(ALBUM_KEY, JSON.stringify(arr));
    } catch (e) {
      /* 忽略存储异常 */
    }
  }

  function saveRecord() {
    const r = state.pendingRecord;
    if (!r) return;
    const album = readAlbum();
    album.unshift({
      id: 'r' + Date.now(),
      cloud_type: r.cloud_type,
      note: r.note,
      tags: r.tags,
      place: r.points.time_place,
      height_ref: r.points.height_ref,
      createdAt: new Date().toISOString()
    });
    writeAlbum(album.slice(0, 30));
    renderAlbum();

    const btn = qs('#saveRecord');
    if (btn) {
      btn.textContent = '已存入打卡册';
      btn.disabled = true;
    }
  }

  function deleteRecord(id) {
    writeAlbum(readAlbum().filter(function (item) { return item.id !== id; }));
    renderAlbum();
  }

  function renderAlbum() {
    const album = readAlbum();
    const isSeed = album.length === 0;
    const list = isSeed ? SEED_ALBUM : album;
    const box = qs('#album');
    qs('#albumCount').textContent = isSeed ? '示例 ' + list.length + ' 条' : list.length + ' 条记录';

    box.innerHTML = list.map(function (item) {
      return '<div class="album-item' + (isSeed ? ' is-sample' : '') + '">' +
        '<span class="badge"><svg class="icon"><use href="#i-cloud"></use></svg></span>' +
        '<div class="a-main">' +
          '<div class="a-title"><b>' + esc(item.cloud_type) + '</b><em>' + esc(item.place) + '</em></div>' +
          '<div class="a-note">' + esc(item.note) + '　·　' + esc(item.tags.join(' / ')) + '</div>' +
        '</div>' +
        (isSeed
          ? '<span class="rec-meta">示例</span>'
          : '<button class="del" data-del="' + item.id + '" type="button">删除</button>') +
        '</div>';
    }).join('');
  }

  /* ---------- 事件 ---------- */
  function bind() {
    qs('#locGrid').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-loc]');
      if (!btn) return;
      state.locId = btn.getAttribute('data-loc');
      renderLocations();
      refresh();
    });

    qs('#intentRow').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-intent]');
      if (!btn) return;
      state.intentId = btn.getAttribute('data-intent');
      renderIntents();
      renderVerdict();
    });

    qs('#cloudTypes').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-cloud]');
      if (!btn) return;
      state.cloudType = btn.getAttribute('data-cloud');
      renderCloudTypes();
    });

    qs('#styles').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-style]');
      if (!btn) return;
      state.style = btn.getAttribute('data-style');
      renderStyles();
    });

    qs('#degradeBtn').addEventListener('click', function () {
      state.degraded = !state.degraded;
      this.classList.toggle('active', state.degraded);
      qs('#degradeLabel').textContent = state.degraded ? '恢复实时数据' : '模拟接口失败';
      refresh();
    });

    qs('#genRecord').addEventListener('click', generateRecord);

    qs('#fileInput').addEventListener('change', function (e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (ev) {
        const img = qs('#previewImg');
        img.src = ev.target.result;
        qs('#dropZone').classList.add('has-img');
      };
      reader.readAsDataURL(file);
    });

    qs('#album').addEventListener('click', function (e) {
      const btn = e.target.closest('[data-del]');
      if (!btn) return;
      deleteRecord(btn.getAttribute('data-del'));
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    renderLocations();
    renderIntents();
    renderCloudTypes();
    renderStyles();
    renderAlbum();
    renderRecord({ needMore: false, record: SAMPLE_RECORD }, true);
    bind();
    refresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
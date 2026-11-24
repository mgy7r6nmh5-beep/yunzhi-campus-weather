const Engine = (function () {

  const ARABIC_NUM_RE = /[0-9０-９]+(?:\.[0-9０-９]+)?/g;
  const UNIT_WORDS = '℃|度|级|mm|毫米|%|m\\/s|m\\/h|AQI|紫外线|公里|千米|米';
  const CN_NUM_UNIT_RE = new RegExp('[一二三四五六七八九十百千两]+(?=\\s*(?:' + UNIT_WORDS + '))', 'g');
  const NUM_UNIT_RE = new RegExp('[0-9０-９][0-9０-９.]*\\s*(?:' + UNIT_WORDS + ')');
  const CN_NUM = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const CN_UNIT = { 十: 10, 百: 100, 千: 1000 };

  const WEATHER_CODES = {
    0: { label: '晴', scene: 'clear' },
    1: { label: '大部晴朗', scene: 'clear' },
    2: { label: '局部多云', scene: 'cloudy' },
    3: { label: '阴', scene: 'cloudy' },
    45: { label: '雾', scene: 'fog' },
    48: { label: '雾凇', scene: 'fog' },
    51: { label: '毛毛雨', scene: 'rain' },
    53: { label: '毛毛雨', scene: 'rain' },
    55: { label: '毛毛雨', scene: 'rain' },
    56: { label: '冻毛毛雨', scene: 'rain' },
    57: { label: '冻毛毛雨', scene: 'rain' },
    61: { label: '小雨', scene: 'rain' },
    63: { label: '中雨', scene: 'rain' },
    65: { label: '大雨', scene: 'rain' },
    66: { label: '冻雨', scene: 'rain' },
    67: { label: '冻雨', scene: 'rain' },
    71: { label: '小雪', scene: 'snow' },
    73: { label: '中雪', scene: 'snow' },
    75: { label: '大雪', scene: 'snow' },
    77: { label: '雪粒', scene: 'snow' },
    80: { label: '阵雨', scene: 'rain' },
    81: { label: '阵雨', scene: 'rain' },
    82: { label: '强阵雨', scene: 'rain' },
    85: { label: '阵雪', scene: 'snow' },
    86: { label: '强阵雪', scene: 'snow' },
    95: { label: '雷阵雨', scene: 'storm' },
    96: { label: '雷暴伴冰雹', scene: 'storm' },
    99: { label: '雷暴伴冰雹', scene: 'storm' }
  };

  function classify(code) {
    const hit = WEATHER_CODES[code];
    if (hit) return hit;
    return { label: '未知天气', scene: 'cloudy' };
  }

  function normalizeCnNumber(token) {
    if (!token) return '';
    if (/^[0-9０-９.]+$/.test(token)) {
      return String(Number(token.replace(/[０-９]/g, function (c) {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
      })));
    }
    let total = 0;
    let unit = 0;
    for (let i = 0; i < token.length; i++) {
      const ch = token[i];
      if (CN_NUM[ch] !== undefined) {
        unit = CN_NUM[ch];
      } else if (CN_UNIT[ch]) {
        const base = unit === 0 ? 1 : unit;
        total += base * CN_UNIT[ch];
        unit = 0;
      }
    }
    return String(total + unit);
  }

  function audit(texts, allowedNumbers, degraded) {
    const allowed = allowedNumbers.map(function (v) { return String(v); });
    const illegal = [];
    let unitHit = false;

    texts.forEach(function (text) {
      if (!text) return;
      const plain = String(text);

      const arabic = plain.match(ARABIC_NUM_RE) || [];
      arabic.forEach(function (token) {
        const value = normalizeCnNumber(token);
        if (allowed.indexOf(value) === -1) illegal.push(token);
      });

      const cnWithUnit = plain.match(CN_NUM_UNIT_RE) || [];
      cnWithUnit.forEach(function (token) {
        const value = normalizeCnNumber(token);
        if (allowed.indexOf(value) === -1) illegal.push(token);
      });

      if (NUM_UNIT_RE.test(plain) || /℃/.test(plain)) unitHit = true;
    });

    const unique = Array.from(new Set(illegal));
    return {
      illegal: unique,
      unitHit: unitHit,
      allowedCount: allowed.length,
      degraded: !!degraded,
      pass: unique.length === 0 && !unitHit
    };
  }

  function allowedFromMetrics(m) {
    if (!m) return [];
    const keys = ['temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
      'precipitation', 'cloud_cover', 'wind_speed_10m', 'wind_gusts_10m', 'uv_index'];
    const out = [];
    keys.forEach(function (k) {
      const v = m[k];
      if (typeof v !== 'number' || !isFinite(v)) return;
      out.push(String(v));
      if (!Number.isInteger(v)) out.push(v.toFixed(1));
    });
    return Array.from(new Set(out));
  }

  function levelClass(level) {
    if (level === '适合' || level === '不需要') return 'ok';
    if (level === '不建议') return 'no';
    return 'mid';
  }

  function degradeAdvice(loc, intent) {
    const cards = [
      { key: 'outdoor', title: '户外运动', icon: 'i-sun', level: '谨慎', note: '实时数据暂不可用，请以现场体感与天空变化为准' },
      { key: 'umbrella', title: '带伞', icon: 'i-umbrella', level: '需要', note: '数据缺失时按保守准备，随身带伞更稳妥' },
      { key: 'sunscreen', title: '防晒', icon: 'i-shield', level: '需要注意', note: '无法核实紫外线强度，长时间在外建议防护' }
    ];
    return {
      conclusion: '不太适合',
      levelKey: 'caution',
      oneLine: loc.name + ' · ' + intent.name + '：实时气象数据暂不可用，给出保守建议，不补写任何数值。',
      cards: cards.map(function (c) {
        return Object.assign({}, c, { levelClass: levelClass(c.level) });
      }),
      tip: '数据来源中断时，系统返回保守结论并标注原因，而不是由模型推测数值。',
      source: '实时气象接口不可用 · 降级模式 · 白名单为空',
      scene: 'fog',
      degraded: true
    };
  }

  function buildAdvice(loc, intent, metrics) {
    if (!metrics) return degradeAdvice(loc, intent);

    const cls = classify(metrics.weather_code);
    const feels = metrics.apparent_temperature;
    const precip = metrics.precipitation || 0;
    const cloud = metrics.cloud_cover || 0;
    const rh = metrics.relative_humidity_2m || 0;
    const windEff = (metrics.wind_speed_10m || 0) * loc.factors.wind;
    const gustEff = (metrics.wind_gusts_10m || 0) * loc.factors.wind;
    const uvEff = Math.min(12, (metrics.uv_index || 0) * loc.factors.sun);
    const slip = loc.factors.slip;

    let outdoorLevel;
    let outdoorNote;
    if (cls.scene === 'storm') {
      outdoorLevel = '不建议';
      outdoorNote = '当前有雷电活动，空旷场地风险高，建议改为室内';
    } else if (precip >= 2) {
      outdoorLevel = '不建议';
      outdoorNote = '降水明显，场地容易积水，不宜进行户外运动';
    } else if (gustEff >= 17.2 || windEff >= 13.9) {
      outdoorLevel = '不建议';
      outdoorNote = '风力偏大，空旷处体感更强，建议改为室内';
    } else if (feels >= 34) {
      outdoorLevel = '不建议';
      outdoorNote = '体感闷热，长时间户外容易中暑，建议避开正午';
    } else if (cls.scene === 'snow') {
      outdoorLevel = '谨慎';
      outdoorNote = '有降雪，地面湿滑，运动时注意防滑与保暖';
    } else if (cls.scene === 'fog') {
      outdoorLevel = '谨慎';
      outdoorNote = '能见度偏低，跑步与骑行注意周边环境';
    } else if (precip >= 0.2) {
      outdoorLevel = '谨慎';
      outdoorNote = slip >= 1.2
        ? '有降水，路面湿滑明显，运动注意防滑'
        : '有降水，场地偏湿，运动时注意防滑';
    } else if (gustEff >= 10.8 || windEff >= 8) {
      outdoorLevel = '谨慎';
      outdoorNote = '有风，球类与轻质器材受影响，注意固定';
    } else if (feels >= 29 && uvEff >= 7) {
      outdoorLevel = '谨慎';
      outdoorNote = '日照较强，建议选择清晨或傍晚时段';
    } else if (feels <= 2) {
      outdoorLevel = '谨慎';
      outdoorNote = '体感偏冷，热身时间需要更长';
    } else {
      outdoorLevel = '适合';
      outdoorNote = '气象条件平稳，适合按计划进行户外活动';
    }

    const wetNow = precip >= 0.1 || cls.scene === 'rain' || cls.scene === 'storm' || cls.scene === 'snow';
    let umbrellaLevel;
    let umbrellaNote;
    if (wetNow) {
      umbrellaLevel = '需要';
      umbrellaNote = '当前有降水或云层正在发展，出门记得带伞';
    } else if (cloud >= 90 && rh >= 85) {
      umbrellaLevel = '需要';
      umbrellaNote = '云层很厚、湿度偏高，建议备折叠伞';
    } else if (cloud >= 70) {
      umbrellaLevel = '不需要';
      umbrellaNote = '云量偏多但暂无降水，可按需备伞';
    } else {
      umbrellaLevel = '不需要';
      umbrellaNote = '降水可能性低，可以不撑伞';
    }

    let sunscreenLevel;
    let sunscreenNote;
    if (uvEff >= 6) {
      sunscreenLevel = '需要';
      sunscreenNote = '紫外线较强，裸露皮肤需要防护';
    } else if (uvEff >= 3) {
      sunscreenLevel = '需要注意';
      sunscreenNote = '紫外线中等，长时间在外建议防护';
    } else {
      sunscreenLevel = '不需要';
      sunscreenNote = '紫外线较弱，短时外出无需特别防护';
    }

    let conclusion;
    let oneLine;
    let levelKey;

    if (intent.id === 'outdoor') {
      conclusion = outdoorLevel === '适合' ? '适合' : (outdoorLevel === '谨慎' ? '不太适合' : '不建议');
      oneLine = loc.name + ' · ' + intent.name + '：' + outdoorNote + '。';
    } else if (intent.id === 'commute') {
      if (cls.scene === 'storm') {
        conclusion = '不建议';
        oneLine = loc.name + ' · 通勤：有雷电活动，建议推迟出行或改走连廊。';
      } else if (wetNow) {
        conclusion = '不太适合';
        oneLine = loc.name + ' · 通勤：需要带伞，路面湿滑处放慢，预留提前量。';
      } else if (gustEff >= 13.9) {
        conclusion = '不太适合';
        oneLine = loc.name + ' · 通勤：风力偏大，骑行注意侧风。';
      } else if (cls.scene === 'fog') {
        conclusion = '不太适合';
        oneLine = loc.name + ' · 通勤：能见度偏低，注意来往车辆。';
      } else {
        conclusion = '适合';
        oneLine = loc.name + ' · 通勤：气象条件平稳，正常出行即可。';
      }
    } else {
      if (wetNow) {
        conclusion = '不建议';
        oneLine = loc.name + ' · 晾晒：有降水，不建议晾晒，及时收衣物。';
      } else if (cloud >= 85 && rh >= 80) {
        conclusion = '不建议';
        oneLine = loc.name + ' · 晾晒：云层厚、湿度高，衣物不易干。';
      } else if (cloud >= 60) {
        conclusion = '不太适合';
        oneLine = loc.name + ' · 晾晒：云量偏多，晾晒效果一般。';
      } else {
        conclusion = '适合';
        oneLine = loc.name + ' · 晾晒：光照与湿度条件适合晾晒。';
      }
    }

    levelKey = conclusion === '适合' ? 'ok' : (conclusion === '不建议' ? 'bad' : 'caution');

    let tipKey;
    if (cls.scene === 'storm') tipKey = 'rain';
    else if (cls.scene === 'rain' || cls.scene === 'snow') tipKey = 'rain';
    else if (cls.scene === 'fog') tipKey = 'fog';
    else if (gustEff >= 10.8) tipKey = 'wind';
    else if (feels >= 28 || uvEff >= 7) tipKey = 'hot';
    else tipKey = 'base';

    const tip = loc.tips[tipKey]
      || (tipKey === 'fog' ? '雾天能见度低，' + loc.name + '周边注意避让' : loc.tips.base);

    return {
      conclusion: conclusion,
      levelKey: levelKey,
      oneLine: oneLine,
      cards: [
        { key: 'outdoor', title: '户外运动', icon: 'i-sun', level: outdoorLevel, note: outdoorNote },
        { key: 'umbrella', title: '带伞', icon: 'i-umbrella', level: umbrellaLevel, note: umbrellaNote },
        { key: 'sunscreen', title: '防晒', icon: 'i-shield', level: sunscreenLevel, note: sunscreenNote }
      ].map(function (c) {
        return Object.assign({}, c, { levelClass: levelClass(c.level) });
      }),
      tip: tip,
      source: 'open-meteo · 数值仅作判断输入，输出层不含任何数值',
      scene: cls.scene,
      weatherLabel: cls.label,
      degraded: false,
      factors: {
        wind: loc.factors.wind,
        sun: loc.factors.sun,
        slip: loc.factors.slip
      }
    };
  }

  function hanziCount(text) {
    return (String(text).match(/[\u4e00-\u9fa5]/g) || []).length;
  }

  function trimToHanzi(text, limit) {
    let count = 0;
    let out = '';
    for (const ch of String(text)) {
      if (/[\u4e00-\u9fa5]/.test(ch)) {
        if (count >= limit) break;
        count++;
      }
      out += ch;
    }
    return out.replace(/[，、,；;。\s]+$/, '');
  }

  function findCloudType(id) {
    return CLOUD_TYPES.filter(function (c) { return c.id === id; })[0] || CLOUD_TYPES[0];
  }

  function buildCloudRecord(input) {
    const type = findCloudType(input.cloudType);
    const style = input.style;
    const desc = String(input.desc || '').trim();
    const place = String(input.place || '').trim();
    const time = String(input.time || '').trim();

    const hasTime = /[0-9０-９]|早上|上午|中午|下午|午后|傍晚|晚上|凌晨|黄昏/.test(time + desc);
    const hasPlace = place.length > 0;
    const dirMatch = desc.match(/(东|西|南|北|东南|西南|东北|西北|上方|头顶|正前|斜后|偏[东西南北])/);
    const hasDir = !!dirMatch;
    const chars = hanziCount(desc);

    const missing = [];
    if (!hasTime) missing.push('看到云的时间');
    if (!hasPlace) missing.push('你当时站的位置');
    if (!hasDir) missing.push('云在天空的哪个方向');

    if (chars < 12 || missing.length >= 2) {
      const question = missing.length
        ? '还差一点关键信息：' + missing.join('、') + '。补上之后我就能生成完整记录。'
        : '描述再具体一些：云底大约齐到哪栋楼、哪一侧更亮、云往哪个方向移动？';
      return { needMore: true, question: question, missing: missing, chars: chars };
    }

    const short = desc.replace(/[。！？!?]+$/, '');
    let note;
    if (style === 'study') {
      note = type.name + '：' + type.form + '。' + short;
    } else if (style === 'life') {
      note = (time ? time + '在' : '在') + place + '看到' + type.name + '，' + short + '。';
    } else {
      note = place + ' · ' + type.name + '：' + short;
    }
    note = trimToHanzi(note, 48);
    if (!/[。]$/.test(note)) note += '。';

    const sceneTagMap = [
      { re: /雨后|雨后/, tag: '雨后' },
      { re: /傍晚|黄昏|日落/, tag: '傍晚' },
      { re: /午后|正午|中午/, tag: '午后' },
      { re: /风|移动|飘/, tag: '有风' },
      { re: /雷|闷|压/, tag: '对流' }
    ];
    let sceneTag = '';
    for (const item of sceneTagMap) {
      if (item.re.test(desc)) { sceneTag = item.tag; break; }
    }

    const tags = [type.tags[0]];
    if (sceneTag && tags.indexOf(sceneTag) === -1) tags.push(sceneTag);
    const finalTags = tags
      .filter(function (t) { return hanziCount(t) <= 6; })
      .slice(0, 2);

    const clicheHits = PHOTO_CLICHE.filter(function (w) { return desc.indexOf(w) !== -1; });
    const noteChars = hanziCount(note);
    const labelOver = finalTags.some(function (t) { return hanziCount(t) > 6; });

    return {
      needMore: false,
      record: {
        cloud_type: type.name,
        points: {
          height_ref: type.height,
          light: type.light,
          form: type.form,
          time_place: (time || '时间待补') + ' · ' + place + (hasDir ? ' · 云在' + dirMatch[0] + '侧' : '')
        },
        note: note,
        tags: finalTags,
        meta: {
          style: style,
          chars: noteChars,
          cliche: clicheHits,
          labelOver: labelOver,
          source: IMAGE_CREDITS.model
        }
      }
    };
  }

  return {
    classify: classify,
    buildAdvice: buildAdvice,
    degradeAdvice: degradeAdvice,
    allowedFromMetrics: allowedFromMetrics,
    audit: audit,
    buildCloudRecord: buildCloudRecord,
    hanziCount: hanziCount
  };
})();
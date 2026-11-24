const Weather = (function () {
  const CACHE_MS = 10 * 60 * 1000;
  const STALE_MS = 12 * 60 * 60 * 1000;
  const CACHE_PREFIX = 'yunzhi.wx.';
  const TIMEOUT_MS = 5000;

  const ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
  const FIELDS = [
    'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
    'precipitation', 'weather_code', 'cloud_cover',
    'wind_speed_10m', 'wind_gusts_10m', 'uv_index', 'is_day'
  ].join(',');

  const SAMPLE = {
    temperature_2m: 21.4,
    apparent_temperature: 21.0,
    relative_humidity_2m: 72,
    precipitation: 0.0,
    weather_code: 3,
    cloud_cover: 68,
    wind_speed_10m: 4.6,
    wind_gusts_10m: 8.2,
    uv_index: 4.2,
    is_day: 1
  };

  function readCache(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function writeCache(key, payload) {
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      /* 存储不可用时不影响主流程 */
    }
  }

  function buildUrl(loc) {
    const p = new URLSearchParams({
      latitude: String(loc.lat),
      longitude: String(loc.lon),
      current: FIELDS,
      wind_speed_unit: 'ms',
      timezone: 'Asia/Shanghai'
    });
    return ENDPOINT + '?' + p.toString();
  }

  async function request(loc) {
    const controller = new AbortController();
    const timer = setTimeout(function () { controller.abort(); }, TIMEOUT_MS);
    try {
      const res = await fetch(buildUrl(loc), { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (!json || !json.current) throw new Error('响应缺少 current 字段');
      return { metrics: json.current, units: json.current_units || {}, observedAt: json.current.time };
    } finally {
      clearTimeout(timer);
    }
  }

  async function get(loc) {
    const key = CACHE_PREFIX + loc.id;
    const cached = readCache(key);
    const now = Date.now();

    if (cached && now - cached.savedAt < CACHE_MS) {
      return {
        metrics: cached.metrics,
        kind: 'cache',
        source: 'open-meteo · 缓存命中',
        fetchedAt: cached.savedAt,
        observedAt: cached.observedAt
      };
    }

    try {
      const data = await request(loc);
      writeCache(key, { metrics: data.metrics, observedAt: data.observedAt, savedAt: now });
      return {
        metrics: data.metrics,
        kind: 'live',
        source: 'open-meteo · 实时请求',
        fetchedAt: now,
        observedAt: data.observedAt
      };
    } catch (err) {
      if (cached && now - cached.savedAt < STALE_MS) {
        return {
          metrics: cached.metrics,
          kind: 'stale',
          source: 'open-meteo · 过期缓存（接口不可用）',
          fetchedAt: cached.savedAt,
          observedAt: cached.observedAt,
          error: err.message
        };
      }
      return {
        metrics: Object.assign({}, SAMPLE),
        kind: 'sample',
        source: '本地示例数据 · 接口不可用，非实时',
        fetchedAt: now,
        observedAt: null,
        error: err.message
      };
    }
  }

  return { get: get, SAMPLE: SAMPLE };
})();
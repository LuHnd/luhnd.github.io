"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key2, value) => key2 in obj ? __defProp(obj, key2, { enumerable: true, configurable: true, writable: true, value }) : obj[key2] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/config.ts
  var TMDB_API_KEY = "b7d4b39abbb7bee7fcbf52f0549d518b";
  var TMDB_V4_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiN2Q0YjM5YWJiYjdiZWU3ZmNiZjUyZjA1NDlkNTE4YiIsIm5iZiI6MTc4MzI5MzQyMC4yODcwMDAyLCJzdWIiOiI2YTRhZTVlYzAzMTQwOTM1NjNjZjBkNjciLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.SepQ5JZPZHIOHGzVTGXSkuJtm4AxGQE31lhg1bkaadg";

  // src/tmdb.ts
  var API = "https://api.themoviedb.org/3";
  var apiKey = () => TMDB_API_KEY;
  var session = () => Lampa.Storage.get("tmdbacc_session", "");
  var accountId = () => Lampa.Storage.get("tmdbacc_account_id", "");
  var username = () => Lampa.Storage.get("tmdbacc_username", "");
  var logged = () => !!(session() && accountId());
  function mediaType(movie) {
    return movie.name || movie.first_air_date ? "tv" : "movie";
  }
  function request(method, path, query = {}, body) {
    if (!/^[a-f0-9]{32}$/i.test(apiKey())) {
      Lampa.Noty.show("TMDB API \u043A\u043B\u044E\u0447 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D \u2014 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E \u0432 src/config.ts \u0438 \u043F\u0435\u0440\u0435\u0441\u043E\u0431\u0435\u0440\u0438\u0442\u0435");
      return Promise.reject(new Error("no api key"));
    }
    const q = __spreadProps(__spreadValues({}, query), { api_key: apiKey() });
    if (session()) q.session_id = session();
    if (!q.language) q.language = Lampa.Storage.get("language", "ru");
    const url = API + path + "?" + Object.keys(q).map((k) => k + "=" + encodeURIComponent(q[k])).join("&");
    return fetch(url, {
      method,
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: body ? JSON.stringify(body) : void 0
    }).then((r) => r.json());
  }
  function apiError(json, fallback) {
    Lampa.Noty.show(json && json.status_message || fallback || "\u041E\u0448\u0438\u0431\u043A\u0430 TMDB");
  }
  function createRequestToken() {
    return request("GET", "/authentication/token/new").then(
      (t) => t.request_token || null
    );
  }
  function tryCreateSession(token) {
    return request("POST", "/authentication/session/new", {}, { request_token: token }).then(
      (s) => s.session_id || null
    );
  }
  function finishLogin(sessionId, done) {
    Lampa.Storage.set("tmdbacc_session", sessionId);
    request("GET", "/account").then((acc) => {
      Lampa.Storage.set("tmdbacc_account_id", acc.id);
      Lampa.Storage.set("tmdbacc_username", acc.username || "");
      Lampa.Noty.show("TMDB: \u0432\u044B \u0432\u043E\u0448\u043B\u0438 \u043A\u0430\u043A " + acc.username);
      if (done) done();
    });
  }
  function loginWithPassword(user, pass, done) {
    if (!user || !pass) return Lampa.Noty.show("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043B\u043E\u0433\u0438\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C TMDB");
    createRequestToken().then((token) => {
      if (!token) return Lampa.Noty.show("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0442\u043E\u043A\u0435\u043D TMDB");
      request("POST", "/authentication/token/validate_with_login", {}, {
        username: user,
        password: pass,
        request_token: token
      }).then((v) => {
        if (!v.success) return apiError(v, "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043B\u043E\u0433\u0438\u043D \u0438\u043B\u0438 \u043F\u0430\u0440\u043E\u043B\u044C");
        tryCreateSession(token).then((sessionId) => {
          if (!sessionId) return Lampa.Noty.show("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E");
          finishLogin(sessionId, done);
        });
      });
    }).catch(() => {
      Lampa.Noty.show("TMDB \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0441\u0435\u0442\u044C");
    });
  }
  function logout() {
    Lampa.Storage.set("tmdbacc_session", "");
    Lampa.Storage.set("tmdbacc_account_id", "");
    Lampa.Storage.set("tmdbacc_username", "");
    Lampa.Noty.show("TMDB: \u0432\u044B \u0432\u044B\u0448\u043B\u0438 \u0438\u0437 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430");
  }

  // src/sync.ts
  var TTL_MS = 10 * 60 * 1e3;
  var MAX_PAGES = 15;
  var emptyState = () => ({ time: 0, rated: {}, watchlist: {}, favorite: {} });
  var state = Lampa.Storage.get("tmdbacc_sync", emptyState());
  var syncing = null;
  var key = (type, id) => type + "_" + id;
  function save() {
    Lampa.Storage.set("tmdbacc_sync", state);
  }
  function fetchAll(url) {
    const out = [];
    const step = (page) => request("GET", url, { page }).then((json) => {
      out.push(...json.results || []);
      const cur = json.page || 1;
      const total = json.total_pages || 1;
      return cur < total && cur < MAX_PAGES ? step(cur + 1) : Promise.resolve(out);
    });
    return step(1).catch(() => out);
  }
  function syncAll(force = false) {
    if (!logged()) return Promise.resolve();
    if (syncing) return syncing;
    if (!force && Date.now() - state.time < TTL_MS) return Promise.resolve();
    const acc = accountId();
    const jobs = [
      ["rated", "movie", `/account/${acc}/rated/movies`],
      ["rated", "tv", `/account/${acc}/rated/tv`],
      ["watchlist", "movie", `/account/${acc}/watchlist/movies`],
      ["watchlist", "tv", `/account/${acc}/watchlist/tv`],
      ["favorite", "movie", `/account/${acc}/favorite/movies`],
      ["favorite", "tv", `/account/${acc}/favorite/tv`]
    ];
    const done = () => {
      syncing = null;
    };
    syncing = Promise.all(jobs.map((j) => fetchAll(j[2]))).then((results) => {
      const fresh = emptyState();
      fresh.time = Date.now();
      jobs.forEach((job, i) => {
        results[i].forEach((item) => {
          if (job[0] === "rated") fresh.rated[key(job[1], item.id)] = item.rating || 0;
          else fresh[job[0]][key(job[1], item.id)] = 1;
        });
      });
      state = fresh;
      save();
    }).then(done, done);
    return syncing;
  }
  var getRating = (type, id) => state.rated[key(type, id)] || 0;
  var inList = (kind, type, id) => !!state[kind][key(type, id)];
  function setRating(type, id, value) {
    state.rated[key(type, id)] = value;
    save();
  }
  function clearRating(type, id) {
    delete state.rated[key(type, id)];
    save();
  }
  function setFlag(kind, type, id, val) {
    if (val) state[kind][key(type, id)] = 1;
    else delete state[kind][key(type, id)];
    save();
  }
  function resetSync() {
    state = emptyState();
    save();
  }

  // src/styles.ts
  var injected = false;
  function injectStyles() {
    if (injected) return;
    injected = true;
    $("body").append(
      "<style>.tmdbacc-vote{position:absolute;left:0.3em;bottom:0.3em;background:rgba(0,0,0,0.5);color:#f5c518;font-size:1.3em;font-weight:700;padding:0.2em 0.5em;border-radius:1em;z-index:1}.tmdbacc-vote--multi{font-size:1.05em;letter-spacing:0.02em;max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tmdbacc-menu__who{background:none!important;padding:0.6em!important;opacity:0.7;font-size:0.95em}.tmdbacc-menu__who.focus{opacity:1;background:#fff!important;color:#000}.tmdbacc-menu__who b{color:inherit}.tmdbacc-badge{position:absolute;top:0.5em;left:0.5em;display:flex;z-index:2}.tmdbacc-badge__chip{background:rgba(0,0,0,0.9);border-radius:0.4em;padding:0.3em 0.5em;font-size:1.05em;font-weight:700;color:#fff;display:flex;align-items:center;margin-right:0.35em;box-shadow:0 0.1em 0.5em rgba(0,0,0,0.6)}.tmdbacc-badge__chip svg{width:1.1em;height:1.1em;fill:currentColor}.tmdbacc-badge__chip--fav{color:#ff6b81}.tmdbacc-badge__chip--watch{color:#7bed9f}.tmdbacc-menu{padding:0.3em 0 0.6em}.tmdbacc-menu__tiles{display:flex}.tmdbacc-tile{flex:1;margin:0 0.35em;background:rgba(255,255,255,0.06);border-radius:0.9em;padding:1.3em 0.6em;text-align:center;border:0.15em solid transparent}.tmdbacc-tile svg{width:2.4em;height:2.4em;fill:none;stroke:currentColor;stroke-width:1.7}.tmdbacc-tile__name{margin-top:0.7em;font-weight:600;font-size:1.05em}.tmdbacc-tile__status{margin-top:0.25em;font-size:0.85em;opacity:0.65}.tmdbacc-tile--active svg{fill:currentColor}.tmdbacc-tile--watch.tmdbacc-tile--active{color:#7bed9f}.tmdbacc-tile--fav.tmdbacc-tile--active{color:#ff6b81}.tmdbacc-tile--rate.tmdbacc-tile--active{color:#f5c518}.tmdbacc-tile.focus{background:#fff;color:#000;border-color:#fff}.tmdbacc-menu__wide{display:flex;align-items:center;justify-content:center;margin:0.8em 0.35em 0;background:rgba(255,255,255,0.06);border-radius:0.9em;padding:0.9em}.tmdbacc-menu__wide svg{width:1.4em;height:1.4em;fill:none;stroke:currentColor;stroke-width:1.7;margin-right:0.6em}.tmdbacc-menu__wide.focus{background:#fff;color:#000}.tmdbacc-menu__progress{margin:0.9em 0.35em 0;padding:0.85em 1em;border-radius:0.9em;background:rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;gap:1em}.tmdbacc-menu__progress span{opacity:0.65;font-size:0.95em}.tmdbacc-menu__progress b{color:#f5c518;font-size:1.15em;font-weight:700}.tmdbacc-menu__viewers{margin:0.55em 0.35em 0;display:flex;flex-wrap:wrap;gap:0.45em}.tmdbacc-menu__chip{background:rgba(0,0,0,0.45);border-radius:2em;padding:0.45em 0.8em;font-size:1.05em;color:#fff}.tmdbacc-menu__chip i{color:#f5c518;font-style:normal;font-weight:700;margin-left:0.15em}.view--tmdbacc.tmdbacc--rated path{fill:#f5c518;stroke:#f5c518}.view--tmdbacc.tmdbacc--rated span{color:#f5c518;font-weight:700}.view--tmdbacc.tmdbacc--rated.focus span{color:inherit}.full-start-new__buttons .view--tmdbacc.tmdbacc--rated:not(.focus) span{display:inline}.tmdbacc-rate{text-align:center;padding:1.2em 0 2em}.tmdbacc-rate__big{position:relative;display:inline-block;width:7em;height:7em;filter:drop-shadow(0 0.3em 1em rgba(87,153,239,0.45))}.tmdbacc-rate__big svg{width:100%;height:100%;fill:#5799ef}.tmdbacc-rate__big span{position:absolute;top:54%;left:50%;transform:translate(-50%,-50%);font-size:2.3em;font-weight:800;color:#fff}.tmdbacc-rate__label{color:#f5c518;font-weight:700;letter-spacing:0.3em;font-size:1.05em;margin:0.8em 0 0.3em}.tmdbacc-rate__title{font-size:1.9em;font-weight:600;margin-bottom:1em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tmdbacc-rate__stars{display:flex;justify-content:center;padding:0.5em 0}.tmdbacc-rate__star{width:3.8em;height:3.8em;padding:0.35em;margin:0 0.15em;border-radius:0.4em;transition:transform 0.12s}.tmdbacc-rate__star svg{width:100%;height:100%;fill:none;stroke:#8a8a8a;stroke-width:1.4}.tmdbacc-rate__star.filled svg{fill:#f5c518;stroke:#f5c518}.tmdbacc-rate__star.focus{transform:scale(1.4)}.tmdbacc-rate__star.focus svg{stroke:#fff;filter:drop-shadow(0 0 0.4em rgba(245,197,24,0.8))}.tmdbacc-rate__star.filled.focus svg{stroke:#f5c518}.tmdbacc-rate__delete{display:inline-block;margin-top:2em;padding:0.8em 2em;border-radius:0.5em;background:rgba(255,255,255,0.12);font-size:1.1em}.tmdbacc-rate__delete.focus{background:#fff;color:#000}.tmdbacc-family{padding:1.1em 1.6em 2em;height:100%;display:flex;flex-direction:column;box-sizing:border-box}.tmdbacc-family__head{flex-shrink:0;margin-bottom:1.05em}.tmdbacc-family__sections{position:relative;display:flex;flex-wrap:nowrap;gap:0.75em;margin-bottom:0.95em;overflow-x:auto;padding:0.15em 0.1em 0.35em;-webkit-overflow-scrolling:touch}.tmdbacc-family__tab{display:flex;align-items:center;justify-content:center;gap:0.7em;flex:0 0 auto;min-height:2.8em;min-width:6em;padding:0.75em 1.3em;border-radius:1em;font-size:1.35em;font-weight:700;letter-spacing:0.01em;color:rgba(255,255,255,0.86);background:rgba(255,255,255,0.09);border:0.16em solid transparent;box-sizing:border-box}.tmdbacc-family__tab.active{background:rgba(255,255,255,0.2);color:#fff;border-color:rgba(255,255,255,0.32)}.tmdbacc-family__tab.focus{background:#fff;color:#111;border-color:#fff;box-shadow:0 0.35em 1.5em rgba(0,0,0,0.45);transform:translateY(-0.05em)}.tmdbacc-family__tab-count{font-size:0.7em;font-weight:700;opacity:0.55;padding:0.2em 0.6em;border-radius:0.55em;background:rgba(0,0,0,0.3);min-width:1.6em;text-align:center}.tmdbacc-family__tab.focus .tmdbacc-family__tab-count{background:rgba(0,0,0,0.12);opacity:0.75;color:#111}.tmdbacc-family__who{position:relative;display:flex;flex-wrap:nowrap;gap:0.65em;padding:0.25em 0.1em 0.2em;overflow-x:auto;-webkit-overflow-scrolling:touch}.tmdbacc-family__who.hide{display:none}.tmdbacc-family__sections::-webkit-scrollbar,.tmdbacc-family__who::-webkit-scrollbar{display:none}.tmdbacc-family__who-btn{flex:0 0 auto;min-height:2.7em;min-width:5.5em;padding:0.8em 1.55em;border-radius:2em;font-size:1.3em;font-weight:650;color:rgba(255,255,255,0.82);background:rgba(255,255,255,0.08);border:0.16em solid transparent;box-sizing:border-box}.tmdbacc-family__who-btn.active{background:rgba(245,197,24,0.22);color:#f5c518;border-color:rgba(245,197,24,0.45)}.tmdbacc-family__who-btn.focus{background:#fff;color:#111;border-color:#fff;box-shadow:0 0.3em 1.15em rgba(0,0,0,0.4)}.tmdbacc-family__body{flex:1;min-height:0}.tmdbacc-family__grid{display:flex;flex-wrap:wrap;gap:1.2em 1em;padding:0.4em 0.2em 2em}.tmdbacc-family__grid .card{width:10.5em;margin:0}.tmdbacc-family__empty{opacity:0.6;padding:2em 0.5em;font-size:1.25em}.tmdbacc-family__by{position:absolute;left:0.35em;bottom:0.35em;z-index:2;background:rgba(0,0,0,0.72);color:#f5c518;font-size:0.85em;font-weight:700;padding:0.15em 0.45em;border-radius:0.35em;max-width:90%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tmdbacc-deck{position:relative;height:100%;min-height:calc(100vh - 6em);padding:1.5em 3em 0;box-sizing:border-box;display:flex;flex-direction:column}.tmdbacc-deck__stage{flex:1;display:flex;align-items:center;gap:3em;min-height:0}.tmdbacc-deck__poster{position:relative;flex:none;height:min(68vh,36em);aspect-ratio:2/3;border-radius:1.2em;overflow:hidden;background:rgba(255,255,255,0.06);box-shadow:0 1.5em 4em rgba(0,0,0,0.6);transition:transform .26s ease,opacity .26s ease}.tmdbacc-deck__poster img{width:100%;height:100%;object-fit:cover;display:block}.tmdbacc-deck__poster>span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:6em;font-weight:800;opacity:.4}.tmdbacc-deck__poster.focus{outline:0.25em solid #fff;outline-offset:0.3em}.tmdbacc-deck__poster.is-yes{transform:translateX(40%) rotate(8deg);opacity:0}.tmdbacc-deck__poster.is-no{transform:translateX(-40%) rotate(-8deg);opacity:0}.tmdbacc-deck__poster.is-pass{transform:scale(0.96)}.tmdbacc-deck__stamp{position:absolute;top:1em;padding:0.2em 0.5em;border:0.18em solid;border-radius:0.3em;font-style:normal;font-weight:900;font-size:2em;letter-spacing:0.08em;opacity:0;transition:opacity .15s}.tmdbacc-deck__stamp--yes{left:0.6em;color:#4cd964;transform:rotate(-12deg)}.tmdbacc-deck__stamp--no{right:0.6em;color:#ff453a;transform:rotate(12deg)}.is-yes .tmdbacc-deck__stamp--yes,.is-pass .tmdbacc-deck__stamp--yes,.is-no .tmdbacc-deck__stamp--no{opacity:1}.tmdbacc-deck__info{flex:1;min-width:0;max-width:38em}.tmdbacc-deck__who{display:inline-block;margin-bottom:1em;padding:0.35em 0.9em;border-radius:2em;font-weight:800;font-size:1.3em;color:#000;background:var(--who,#fff)}.tmdbacc-deck__want{display:flex;align-items:center;gap:0.4em;color:#ff5e7e;font-weight:700;font-size:1.3em;margin-bottom:0.6em}.tmdbacc-deck__want svg{width:1.1em;height:1.1em}.tmdbacc-deck__title{font-size:3.2em;font-weight:800;line-height:1.05;margin-bottom:0.3em;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.tmdbacc-deck__meta{font-size:1.4em;opacity:.8;margin-bottom:1em}.tmdbacc-deck__meta b{color:#4cd964;margin-right:0.6em}.tmdbacc-deck__why{font-size:1.4em;line-height:1.35;margin-bottom:1em}.tmdbacc-deck__taste{display:inline-block;font-size:1.15em;padding:0.45em 0.8em;border-radius:0.6em;background:rgba(255,106,0,0.16);color:#ffb37a;margin-bottom:1em}.tmdbacc-deck__next{font-size:1.1em;opacity:.5}.tmdbacc-deck__keys{display:flex;justify-content:center;gap:2.2em;padding:1.2em 0 1.6em;font-size:1.15em;opacity:.75}.tmdbacc-deck__keys span{display:flex;align-items:center;gap:0.5em}.tmdbacc-deck kbd{font-family:inherit;font-weight:800;min-width:1.6em;padding:0.15em 0.45em;border-radius:0.35em;background:rgba(255,255,255,0.14);text-align:center}.tmdbacc-deck__match{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2em 0}.tmdbacc-deck__match-title{font-size:4.5em;font-weight:900;color:#ff5e7e;margin-bottom:0.3em}.tmdbacc-deck__match-poster{height:min(45vh,24em);border-radius:1em;box-shadow:0 1.5em 4em rgba(0,0,0,0.6);margin-bottom:1.2em}.tmdbacc-deck__match-text{font-size:1.5em;margin-bottom:1.2em}.tmdbacc-deck__match-go{font-size:1.5em;font-weight:800;padding:0.6em 2.4em;border-radius:3em;background:rgba(255,255,255,0.12)}.tmdbacc-deck__match-go.focus{background:#ff6a00;color:#1a0b00}.tmdbacc-deck__match-hint{margin-top:1em;opacity:.6;font-size:1.1em}.tmdbacc-deck__empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-top:20vh}.tmdbacc-deck__empty-title{font-size:2.4em;font-weight:800;margin-bottom:0.4em}.tmdbacc-deck__empty-text{font-size:1.3em;opacity:.7}.tmdbacc-pick{padding:2em 3em 1em;display:flex;flex-direction:column;min-height:calc(100vh - 6em);box-sizing:border-box}.tmdbacc-pick__title{font-size:2.6em;font-weight:800;line-height:1.1;margin-bottom:0.3em}.tmdbacc-pick__sub{font-size:1.25em;opacity:.7;margin-bottom:1.4em}.tmdbacc-pick__row{display:flex;gap:1.6em;overflow:hidden;padding:0.8em 0.6em 1.2em;margin:0 -0.6em;scroll-behavior:smooth}.tmdbacc-pick__tile{flex:none;width:13em;border-radius:1em;transition:transform .15s}.tmdbacc-pick__tile.focus{transform:scale(1.06)}.tmdbacc-pick__poster{position:relative;aspect-ratio:2/3;border-radius:0.9em;overflow:hidden;background:rgba(255,255,255,0.06);box-shadow:0 0.8em 2.4em rgba(0,0,0,0.5)}.tmdbacc-pick__tile.focus .tmdbacc-pick__poster{outline:0.22em solid #fff;outline-offset:0.25em}.tmdbacc-pick__poster img{width:100%;height:100%;object-fit:cover;display:block}.tmdbacc-pick__poster>span{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:4em;font-weight:800;opacity:.4}.tmdbacc-pick__best{position:absolute;left:0.6em;top:0.6em;font-style:normal;font-weight:800;font-size:0.95em;padding:0.3em 0.6em;border-radius:2em;background:#ff6a00;color:#1a0b00}.tmdbacc-pick__name{font-size:1.3em;font-weight:700;margin-top:0.7em;line-height:1.2;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.tmdbacc-pick__meta{font-size:1.05em;opacity:.8;margin-top:0.3em}.tmdbacc-pick__meta b{color:#4cd964;margin-right:0.5em}.tmdbacc-pick__started{display:inline-block;font-size:0.95em;margin-top:0.4em;padding:0.2em 0.55em;border-radius:0.4em;background:rgba(90,200,250,0.18);color:#9fdcff}.tmdbacc-pick__more{align-self:flex-start;margin-top:1.2em;font-size:1.3em;font-weight:700;padding:0.6em 1.6em;border-radius:3em;background:rgba(255,255,255,0.1)}.tmdbacc-pick__more.focus{background:#fff;color:#000}.tmdbacc-deck__focus{width:1px;height:1px;opacity:0}</style>"
    );
  }

  // src/wr.ts
  var URL_KEY = "tmdbacc_watchroom";
  var WR_TOKEN_KEY = "tmdbacc_wr_token";
  var WR_USER_KEY = "tmdbacc_wr_user";
  function watchroomBase() {
    return String(Lampa.Storage.get(URL_KEY, "") || "").trim().replace(/\/+$/, "");
  }
  function wrToken() {
    return String(Lampa.Storage.get(WR_TOKEN_KEY, "") || "").trim();
  }
  function watchroomUsername() {
    return String(Lampa.Storage.get(WR_USER_KEY, "") || "").trim();
  }
  function setWatchroomToken(token, me) {
    const t = String(token || "").trim();
    if (!t) return;
    Lampa.Storage.set(WR_TOKEN_KEY, t);
    const name = me && me.username ? String(me.username).trim() : "";
    if (name) Lampa.Storage.set(WR_USER_KEY, name);
  }
  function clearWatchroomToken() {
    Lampa.Storage.set(WR_TOKEN_KEY, "");
    Lampa.Storage.set(WR_USER_KEY, "");
  }
  function watchroomHeaders() {
    const url = watchroomBase();
    if (!url) return null;
    const wr = wrToken();
    if (wr) return { Authorization: "Bearer " + wr, "Content-Type": "application/json" };
    const sid = session();
    if (sid && logged()) return { Authorization: "Bearer " + sid, "Content-Type": "application/json" };
    return null;
  }
  function watchroomReady() {
    return !!(watchroomBase() && (wrToken() || session() && logged()));
  }
  function watchroomPaired() {
    return !!(watchroomBase() && wrToken());
  }

  // src/members.ts
  var MEMBER_KEY = "tmdbacc_watchroom_member";
  var MEMBERS_KEY = "tmdbacc_watchroom_members";
  function selectedMemberId() {
    return Number(Lampa.Storage.get(MEMBER_KEY, 0)) || 0;
  }
  function selectedMember() {
    const id = selectedMemberId();
    const list = membersCached();
    return list.find((m) => m.id === id) || list[0] || null;
  }
  function membersCached() {
    return Lampa.Storage.get(MEMBERS_KEY, []) || [];
  }
  function setSelectedMember(id) {
    Lampa.Storage.set(MEMBER_KEY, id);
  }
  function applyList(list) {
    Lampa.Storage.set(MEMBERS_KEY, list);
    if (!list.length) return;
    const cur = selectedMemberId();
    if (!list.some((m) => m.id === cur)) setSelectedMember(list[0].id);
  }
  function cacheMembers(list) {
    applyList(list || []);
  }
  function pullMembers() {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url || !watchroomReady()) return;
    fetch(url + "/api/members", { headers: h }).then((r) => r.ok ? r.json() : Promise.reject(r.status)).then((data) => {
      applyList(data.members || data.viewers || []);
    }).catch(() => {
    });
  }
  function createMember(name) {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url) return Promise.reject(new Error("\u041D\u0435\u0442 Watchroom"));
    return fetch(url + "/api/members", {
      method: "POST",
      headers: h,
      body: JSON.stringify({ name })
    }).then((r) => r.json().then((j) => ({ ok: r.ok, j }))).then(({ ok, j }) => {
      if (!ok) throw new Error(j.error || "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0444\u0438\u043B\u044C");
      const list = j.members || j.viewers || [];
      applyList(list);
      return list;
    });
  }
  function putMemberScore(opts) {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url) return Promise.reject(new Error("\u041D\u0435\u0442 Watchroom"));
    return fetch(url + "/api/scores", {
      method: "PUT",
      headers: h,
      body: JSON.stringify({
        memberId: opts.memberId,
        mediaType: opts.mediaType,
        tmdbId: opts.tmdbId,
        value: opts.value,
        title: opts.title || "",
        posterPath: opts.posterPath || ""
      })
    }).then((r) => {
      if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j.error || "score")));
    });
  }
  function pickMember(onDone) {
    if (!watchroomReady()) {
      Lampa.Noty.show("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 Watchroom \u043A\u043E\u0434\u043E\u043C \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 (\u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u2192 Watchroom)");
      return;
    }
    pullMembers();
    const list = membersCached();
    const cur = selectedMemberId();
    const linked = list.filter((m) => m.linked !== false);
    const source = linked.length ? linked : list;
    const items = source.map((m) => ({
      title: (m.id === cur ? "\u25CF " : "") + m.name + (m.role === "owner" ? " (\u0434\u043E\u043C)" : ""),
      member_id: m.id,
      selected: m.id === cur
    }));
    if (!source.length) {
      items.push({
        title: "\u041D\u0435\u0442 \u0443\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u043E\u0432 \u2014 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0441\u0435\u043C\u044C\u044E \u0432 Watchroom \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435",
        noop: true
      });
    } else if (!linked.length) {
      items.push({ title: "+ \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0438\u043C\u044F (\u0443\u0441\u0442\u0430\u0440\u0435\u043B\u043E)", create: true });
    }
    Lampa.Select.show({
      title: "\u041A\u0442\u043E \u0441\u0442\u0430\u0432\u0438\u0442 \u2605",
      items,
      onSelect(item) {
        if (item.noop) {
          Lampa.Noty.show("\u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u2192 \u0421\u0435\u043C\u044C\u044F: \xAB\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0434\u043E\u043C\xBB \u0438 \u043A\u043E\u0434 \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u0432\u0442\u043E\u0440\u043E\u0433\u043E \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430.");
          Lampa.Controller.toggle("full_start");
          return;
        }
        if (item.create) {
          Lampa.Input.edit(
            {
              title: "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u0438\u043C\u044F (\u043B\u0443\u0447\u0448\u0435 \u2014 \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0447\u0435\u0440\u0435\u0437 \u043A\u043E\u0434)",
              value: "",
              free: true,
              nosave: true
            },
            (name) => {
              if (!name) {
                Lampa.Controller.toggle("full_start");
                return;
              }
              createMember(String(name).trim()).then((members) => {
                const last = members[members.length - 1];
                if (last) setSelectedMember(last.id);
                Lampa.Noty.show(
                  "\u041B\u0443\u0447\u0448\u0435 \u0441\u0432\u044F\u0437\u0430\u0442\u044C \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0439 \u0430\u043A\u043A\u0430\u0443\u043D\u0442: \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u2192 \u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u2192 \u0421\u0435\u043C\u044C\u044F \u2192 \u043A\u043E\u0434."
                );
                if (onDone) onDone();
                Lampa.Controller.toggle("full_start");
              }).catch((e) => {
                Lampa.Noty.show(String(e.message || e));
                Lampa.Controller.toggle("full_start");
              });
              return;
            }
          );
          return;
        }
        setSelectedMember(Number(item.member_id));
        const picked = source.find((m) => m.id === Number(item.member_id));
        if (picked && picked.linked !== false) {
          Lampa.Noty.show("\u2605 \u043E\u0442 \xAB" + picked.name + "\xBB \u2014 \u0430\u043A\u043A\u0430\u0443\u043D\u0442 \u0432 \u0441\u0435\u043C\u044C\u0435");
        }
        if (onDone) onDone();
        Lampa.Controller.toggle("full_start");
      },
      onBack() {
        Lampa.Controller.toggle("full_start");
      }
    });
  }

  // src/member-rate.ts
  var STAR = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z"/></svg>';
  function openMemberRate(movie, member, current, onChanged) {
    var _a;
    injectStyles();
    const type = mediaType(movie);
    const title = String(movie.title || movie.name);
    const C = Lampa.Controller;
    const back = C.enabled && ((_a = C.enabled()) == null ? void 0 : _a.name) || "full_start";
    const close = () => {
      Lampa.Modal.close();
      Lampa.Controller.toggle(back);
    };
    const submit = (val) => {
      close();
      putMemberScore({
        memberId: member.id,
        mediaType: type,
        tmdbId: movie.id,
        value: val,
        title,
        posterPath: String(movie.poster_path || "")
      }).then(() => {
        Lampa.Noty.show(member.name + ": \u2605 " + val);
        pullScores();
        if (onChanged) onChanged();
      }).catch(() => Lampa.Noty.show("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443"));
    };
    const remove = () => {
      close();
      putMemberScore({
        memberId: member.id,
        mediaType: type,
        tmdbId: movie.id,
        value: 0,
        title,
        posterPath: String(movie.poster_path || "")
      }).then(() => {
        Lampa.Noty.show(member.name + ": \u043E\u0446\u0435\u043D\u043A\u0430 \u0441\u043D\u044F\u0442\u0430");
        pullScores();
        if (onChanged) onChanged();
      }).catch(() => Lampa.Noty.show("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043D\u044F\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443"));
    };
    const root = $(
      '<div class="tmdbacc-rate"><div class="tmdbacc-rate__big">' + STAR + '<span class="tmdbacc-rate__value">' + (current || "?") + '</span></div><div class="tmdbacc-rate__label">' + member.name.toUpperCase() + '</div><div class="tmdbacc-rate__title">' + title + '</div><div class="tmdbacc-rate__stars"></div></div>'
    );
    const valueEl = root.find(".tmdbacc-rate__value");
    const starsWrap = root.find(".tmdbacc-rate__stars");
    const starEls = [];
    const highlight = (n) => {
      starEls.forEach((el, idx) => {
        if (idx < n) el.addClass("filled");
        else el.removeClass("filled");
      });
      valueEl.text(n ? String(n) : "?");
    };
    for (let i = 1; i <= 10; i++) {
      const el = $('<div class="selector tmdbacc-rate__star">' + STAR + "</div>");
      el.on("hover:focus", () => highlight(i));
      el.on("hover:enter", () => submit(i));
      starEls.push(el);
      starsWrap.append(el);
    }
    highlight(current);
    if (current) {
      const del = $('<div class="selector tmdbacc-rate__delete">\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443</div>');
      del.on("hover:focus", () => highlight(current));
      del.on("hover:enter", remove);
      root.append(del);
    }
    Lampa.Modal.open({
      title: "",
      html: root,
      size: "medium",
      onBack: close
    });
    const start = current > 0 ? current : 7;
    setTimeout(() => {
      Lampa.Controller.collectionFocus(starEls[start - 1][0], root);
      highlight(start);
    }, 100);
  }

  // src/watchroom.ts
  var SCORES_KEY = "tmdbacc_watchroom_scores";
  var CURSOR_KEY = "tmdbacc_watchroom_cursors";
  var LAST_MARK_KEY = "tmdbacc_watchroom_lastmark";
  var QUEUE_KEY = "tmdbacc_watchroom_progress_q";
  function lampaHash(input) {
    const str = (input || "") + "";
    let hash = 0;
    if (!str.length) return "0";
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) + "";
  }
  function episodeHash(season, episode, original) {
    return lampaHash([season, season > 10 ? ":" : "", episode, original].join(""));
  }
  function episodeHashes(season, episode, original) {
    const a = episodeHash(season, episode, original);
    const b = lampaHash([season, episode, original].join(""));
    return a === b ? [a] : [a, b];
  }
  function readLast() {
    const raw = Lampa.Storage.get("online_watched_last", {});
    if (!raw) return {};
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch (e) {
        return {};
      }
    }
    return raw;
  }
  var noted = false;
  var sending = false;
  function sayOnce(text) {
    if (noted) return;
    noted = true;
    Lampa.Noty.show(text);
  }
  function seedOnlineChoice(tmdbId, season, episode) {
    if (!tmdbId || !season || !episode) return;
    try {
      const keys = Object.keys(window.localStorage).filter((k) => k.indexOf("online_choice_") === 0);
      const lastBal = Lampa.Storage.get("online_last_balanser", {})[String(tmdbId)];
      if (lastBal && keys.indexOf("online_choice_" + lastBal) < 0) keys.push("online_choice_" + lastBal);
      keys.forEach((k) => {
        const all = Lampa.Storage.get(k, {});
        const cur = all[String(tmdbId)] || { season: 0, voice: 0, order: 0, voice_name: "", voice_id: 0, movie_view: "", source: 0 };
        const views = cur.episodes_view || {};
        views[String(season)] = episode;
        all[String(tmdbId)] = __spreadProps(__spreadValues({}, cur), { season: season - 1, episodes_view: views });
        Lampa.Storage.set(k, all);
      });
    } catch (e) {
    }
  }
  function applyCursor(item) {
    if (!item.originalTitle) return;
    const hash = item.mediaType === "tv" && item.episode ? episodeHash(item.season, item.episode, item.originalTitle) : lampaHash(item.originalTitle);
    const Timeline = Lampa.Timeline;
    if (!Timeline) return;
    Timeline.update({
      hash,
      percent: item.percent || 0,
      time: item.positionSec || 0,
      duration: item.durationSec || 0,
      received: true
    });
    if (item.mediaType === "tv" && item.episode) {
      const last = readLast();
      last[lampaHash(item.originalTitle)] = {
        season: item.season,
        episode: item.episode,
        voice_name: item.voice || ""
      };
      Lampa.Storage.set("online_watched_last", last);
    }
  }
  function timeline() {
    return Lampa.Timeline || null;
  }
  var touched = {};
  function raise(hash, percent, time, duration) {
    const T = timeline();
    if (!T || !percent || touched[hash]) return;
    const local = T.view(hash);
    if ((local.percent || 0) >= percent) return;
    T.update({ hash, percent, time, duration, received: true });
  }
  function restore(items) {
    items.forEach((item) => {
      const original = item.originalTitle;
      if (!original) return;
      if (item.mediaType === "movie") {
        raise(lampaHash(original), item.percent, item.positionSec, item.durationSec);
        return;
      }
      const eps = (item.episodes || []).slice();
      if (item.episode) eps.push(item);
      eps.forEach(
        (e) => episodeHashes(e.season, e.episode, original).forEach(
          (h) => raise(h, e.percent, e.positionSec, e.durationSec)
        )
      );
      if (item.episode) {
        const marks = Lampa.Storage.get(LAST_MARK_KEY, {});
        const mk = item.mediaType + "_" + item.tmdbId;
        const at = Number(item.updatedAt) || 0;
        if (!at || at > (Number(marks[mk]) || 0)) {
          const last = readLast();
          const key2 = lampaHash(original);
          const cur = last[key2];
          last[key2] = { season: item.season, episode: item.episode, voice_name: item.voice || cur && cur.voice_name || "" };
          Lampa.Storage.set("online_watched_last", last);
          seedOnlineChoice(item.tmdbId, item.season, item.episode);
          marks[mk] = at || Date.now();
          Lampa.Storage.set(LAST_MARK_KEY, marks);
        }
      }
    });
  }
  function restoreCached() {
    const map = Lampa.Storage.get(CURSOR_KEY, {});
    restore(Object.keys(map).map((k) => map[k]));
  }
  function clock(sec) {
    sec = Math.round(Number(sec) || 0);
    if (!sec) return "";
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec % 3600 / 60);
    const s = sec % 60;
    if (h) return h + " \u0447 " + m + " \u043C\u0438\u043D";
    if (m) return m + " \u043C\u0438\u043D" + (s ? " " + s + " \u0441" : "");
    return s + " \u0441";
  }
  function formatCursor(item) {
    if (!item) return "";
    if (item.finished) return "\u0414\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043E";
    if (item.mediaType === "tv" && item.episode) {
      const ep = "S" + item.season + "E" + item.episode;
      if (item.percent >= 90) return ep + " \xB7 \u0441\u0435\u0440\u0438\u044F \u0434\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u0430";
      const time = item.positionSec ? clock(item.positionSec) : "";
      const pct = item.percent ? item.percent + "%" : "";
      return [ep, time, pct].filter(Boolean).join(" \xB7 ");
    }
    if (item.positionSec) {
      return clock(item.positionSec) + (item.durationSec ? " \u0438\u0437 " + clock(item.durationSec) : "");
    }
    return item.percent ? item.percent + "%" : "";
  }
  function cursorOf(type, id) {
    const map = Lampa.Storage.get(CURSOR_KEY, {});
    return map[type + "_" + id] || null;
  }
  function readQueue() {
    const raw = Lampa.Storage.get(QUEUE_KEY, []);
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  }
  function writeQueue(items) {
    Lampa.Storage.set(QUEUE_KEY, items.slice(-40));
  }
  function enqueueBody(body) {
    const key2 = body.mediaType + "_" + body.tmdbId;
    const next = readQueue().filter(
      (x) => !(x.mediaType === body.mediaType && x.tmdbId === body.tmdbId && x.season === body.season && x.episode === body.episode)
    );
    next.push(body);
    writeQueue(next);
    const cursors = Lampa.Storage.get(CURSOR_KEY, {});
    cursors[key2] = __spreadProps(__spreadValues({}, body), {
      updatedAt: Date.now()
    });
    Lampa.Storage.set(CURSOR_KEY, cursors);
  }
  function rememberOk(body, data) {
    if (!data || !data.updatedAt) return;
    const key2 = body.mediaType + "_" + body.tmdbId;
    const cursors = Lampa.Storage.get(CURSOR_KEY, {});
    cursors[key2] = __spreadProps(__spreadValues({}, body), {
      episodes: cursors[key2] && cursors[key2].episodes || [],
      finished: typeof data.finished === "boolean" ? data.finished : body.finished,
      updatedAt: data.updatedAt
    });
    Lampa.Storage.set(CURSOR_KEY, cursors);
  }
  function flushQueue() {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url || !watchroomReady() || sending) return;
    const q = readQueue();
    if (!q.length) return;
    sending = true;
    const body = q[0];
    fetch(url + "/api/progress", { method: "PUT", headers: h, body: JSON.stringify(body) }).then((r) => r.ok ? r.json() : Promise.reject(r.status)).then((data) => {
      rememberOk(body, data);
      writeQueue(readQueue().slice(1));
      sending = false;
      if (readQueue().length) flushQueue();
    }).catch(() => {
      sending = false;
      sayOnce("Watchroom: \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441 \u0432 \u043E\u0447\u0435\u0440\u0435\u0434\u0438, \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u0435\u043C \u043F\u043E\u0437\u0436\u0435");
    });
  }
  function pullProgress() {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url || !watchroomReady()) return;
    flushQueue();
    fetch(url + "/api/progress", { headers: h }).then((r) => r.ok ? r.json() : Promise.reject(r.status)).then((data) => {
      const items = data.items || [];
      const cursors = {};
      items.forEach((item) => cursors[item.mediaType + "_" + item.tmdbId] = item);
      Lampa.Storage.set(CURSOR_KEY, cursors);
      restore(items);
    }).catch(() => sayOnce("Watchroom: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0431\u0440\u0430\u0442\u044C \u043F\u0440\u043E\u0433\u0440\u0435\u0441\u0441"));
    pullScores();
    pullMembers();
  }
  function pullScores() {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url || !watchroomReady()) return Promise.resolve();
    return fetch(url + "/api/scores", { headers: h }).then((r) => r.ok ? r.json() : Promise.reject(r.status)).then((data) => {
      const map = {};
      (data.items || []).forEach((item) => {
        map[item.mediaType + "_" + item.tmdbId] = item.scores || [];
      });
      Lampa.Storage.set(SCORES_KEY, map);
    }).catch(() => {
    });
  }
  function viewerScores(type, id) {
    const map = Lampa.Storage.get(SCORES_KEY, {});
    return map[type + "_" + id] || [];
  }
  function cardOf(play) {
    var _a, _b;
    if (play.card && play.card.id) return play.card;
    if (play.movie && play.movie.id) return play.movie;
    try {
      const active = (_b = (_a = Lampa.Activity) == null ? void 0 : _a.active) == null ? void 0 : _b.call(_a);
      if (active && active.movie && active.movie.id) return active.movie;
    } catch (e) {
    }
    return null;
  }
  function voiceOf(play) {
    if (play.voice_name) return String(play.voice_name);
    if (play.translate && typeof play.translate === "object") return String(play.translate.name || "");
    if (typeof play.translate === "string") return play.translate;
    return "";
  }
  var lastCard = null;
  var lastVoice = "";
  var lastPlaylist = [];
  var lastStart = -1;
  var external = false;
  function isTv(card) {
    return !!(card.original_name || card.name || card.first_air_date);
  }
  function matchHash(card, hash) {
    const original = String(card.original_name || card.original_title || "");
    if (!original) return null;
    if (!isTv(card)) return lampaHash(original) === hash ? { season: 0, episode: 0 } : null;
    const seasons = Math.max(Number(card.number_of_seasons) || 0, 30);
    for (let s = 1; s <= seasons; s++) {
      for (let e = 1; e <= 100; e++) {
        if (episodeHashes(s, e, original).indexOf(hash) >= 0) return { season: s, episode: e };
      }
    }
    return null;
  }
  function bodyFromUpdate(hash, road) {
    const percent = Math.max(0, Math.min(100, Math.round(Number(road.percent) || 0)));
    const positionSec = Math.max(0, Number(road.time) || 0);
    const durationSec = Math.max(0, Number(road.duration) || 0);
    if (!percent && !positionSec) return null;
    const play = currentPlay();
    for (const card of [play ? cardOf(play) : null, lastCard]) {
      if (!card || !card.id) continue;
      const at = matchHash(card, hash);
      if (!at) continue;
      const tv = isTv(card);
      const original = String(card.original_name || card.original_title || "");
      const last = tv ? readLast()[lampaHash(original)] : void 0;
      return {
        mediaType: tv ? "tv" : "movie",
        tmdbId: Number(card.id),
        season: at.season,
        episode: at.episode,
        positionSec,
        durationSec,
        percent: percent || (durationSec ? Math.min(99, Math.round(positionSec / durationSec * 100)) : 0),
        originalTitle: original,
        title: String(card.title || card.name || ""),
        posterPath: String(card.poster_path || ""),
        voice: play && voiceOf(play) || lastVoice || last && last.voice_name || "",
        finished: !tv && percent >= 90
      };
    }
    return null;
  }
  function pushBody(body) {
    if (!watchroomReady() || !body) return;
    enqueueBody(body);
    flushQueue();
  }
  function currentPlay() {
    try {
      const L = Lampa;
      return L.Player && L.Player.playdata && L.Player.playdata() || null;
    } catch (e) {
      return null;
    }
  }
  var timer = null;
  var pending = null;
  function flushNow() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    const item = pending;
    pending = null;
    if (item) pushBody(item);
    else flushQueue();
  }
  function schedulePush(body) {
    pending = body;
    if (!timer) timer = setTimeout(flushNow, 800);
  }
  function fillSkipped(hash) {
    const at = lastPlaylist.indexOf(hash);
    if (lastStart < 0 || at <= lastStart) return;
    const T = timeline();
    if (!T) return;
    const from = lastStart;
    lastStart = at;
    for (let i = from; i < at; i++) {
      const h = lastPlaylist[i];
      if ((T.view(h).percent || 0) < 90) T.update({ hash: h, percent: 100 });
    }
  }
  var ASKED_KEY = "tmdbacc_rate_asked";
  var askTimer = null;
  function askRating(card) {
    const id = Number(card.id) || 0;
    if (!id || isTv(card)) return;
    const asked = Lampa.Storage.get(ASKED_KEY, {});
    if (asked[id]) return;
    const m = selectedMember();
    if (!m) return;
    if (viewerScores("movie", id).some((s) => Number(s.memberId || s.viewerId) === Number(m.id))) return;
    if (askTimer) clearTimeout(askTimer);
    askTimer = setTimeout(() => {
      askTimer = null;
      const P = Lampa.Player;
      if (P && P.opened && P.opened()) return;
      asked[id] = Date.now();
      Lampa.Storage.set(ASKED_KEY, asked);
      Lampa.Noty.show("\u0414\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043B\u0438 \xAB" + String(card.title || card.name || "") + "\xBB \u2014 \u043A\u0430\u043A \u0432\u0430\u043C?");
      openMemberRate(card, m, 0, () => pullScores());
    }, 2500);
  }
  var restoreTimer = null;
  function restoreSoon() {
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(() => {
      restoreTimer = null;
      restoreCached();
    }, 2e3);
  }
  function initWatchroom() {
    pullProgress();
    try {
      const L = Lampa;
      const T = L.Timeline;
      if (T && T.update) {
        const original = T.update;
        T.update = function(p) {
          const prev = external;
          external = !!(p && p.received);
          try {
            return original.apply(this, [p]);
          } finally {
            external = prev;
          }
        };
      }
      if (L.Player && L.Player.listener) {
        L.Player.listener.follow("create", (e) => {
          const data = e && e.data || {};
          lastCard = cardOf(data);
          lastVoice = voiceOf(data);
          lastPlaylist = (data.playlist || []).map((x) => String(x.timeline && x.timeline.hash || ""));
          lastStart = data.timeline && data.timeline.hash ? lastPlaylist.indexOf(String(data.timeline.hash)) : -1;
        });
        L.Player.listener.follow("destroy", () => flushNow());
      }
      if (T && T.listener) {
        T.listener.follow("update", (e) => {
          if (!e || !e.data || !e.data.road) return;
          if (external) {
            restoreSoon();
            return;
          }
          const hash = String(e.data.hash || "");
          touched[hash] = true;
          fillSkipped(hash);
          const body = bodyFromUpdate(hash, e.data.road);
          if (!body) return;
          if (body.mediaType === "movie" && body.percent >= 90 && lastCard) askRating(lastCard);
          if (body.mediaType === "tv" && body.percent >= 90) pushBody(body);
          else schedulePush(body);
        });
        T.listener.follow("read", () => restoreSoon());
      }
    } catch (e) {
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) flushNow();
      else pullProgress();
    });
    window.addEventListener("pagehide", () => flushNow());
    setInterval(() => {
      if (!document.hidden && readQueue().length) flushQueue();
    }, 15e3);
  }

  // src/badges.ts
  var HEART = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  var BOOKMARK = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
  function decorate(card) {
    if (!card || !card.data || !card.data.id) return;
    if (!logged() && !watchroomReady()) return;
    const el = card.render();
    if (!el || !el.length) return;
    const view = el.find(".card__view");
    if (!view.length) return;
    el.find(".tmdbacc-badge, .tmdbacc-vote").remove();
    const type = mediaType(card.data);
    const id = card.data.id;
    const rating = logged() ? getRating(type, id) : 0;
    const household = viewerScores(type, id);
    const fav = logged() && inList("favorite", type, id);
    const watch = logged() && inList("watchlist", type, id);
    if (household.length > 1) {
      const label = household.map((s) => s.name.slice(0, 1) + s.value).join(" ");
      view.append($('<div class="tmdbacc-vote tmdbacc-vote--multi">' + label + "</div>"));
    } else if (household.length === 1) {
      view.append($('<div class="tmdbacc-vote">\u2605 ' + household[0].value + "</div>"));
    } else if (rating) {
      view.append($('<div class="tmdbacc-vote">\u2605 ' + rating + "</div>"));
    }
    let chips = "";
    if (fav) chips += '<div class="tmdbacc-badge__chip tmdbacc-badge__chip--fav">' + HEART + "</div>";
    if (watch) chips += '<div class="tmdbacc-badge__chip tmdbacc-badge__chip--watch">' + BOOKMARK + "</div>";
    if (chips) view.append($('<div class="tmdbacc-badge">' + chips + "</div>"));
  }
  function initBadges() {
    injectStyles();
    const proto = Lampa.Card.prototype;
    const origCreate = proto.create;
    proto.create = function() {
      origCreate.call(this);
      try {
        decorate(this);
      } catch (e) {
      }
    };
    Lampa.Listener.follow("line", (e) => {
      const ev = e;
      if (ev.type === "append" || ev.type === "visible") {
        (ev.items || []).forEach((c) => {
          try {
            decorate(c);
          } catch (err) {
          }
        });
      }
    });
  }

  // src/cast.ts
  var DEVICE_KEY = "tmdbacc_cast_device";
  var POLL_MS = 2500;
  var sessionDeadHinted = false;
  function deviceKey() {
    return String(Lampa.Storage.get(DEVICE_KEY, "") || "").trim();
  }
  function saveDeviceKey(key2) {
    if (key2) Lampa.Storage.set(DEVICE_KEY, key2);
  }
  function claimPairCode(code) {
    const url = watchroomBase();
    if (!url) return Promise.reject(new Error("\u0417\u0430\u0434\u0430\u0439 URL Watchroom \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445"));
    const digits = String(code || "").replace(/\D/g, "").slice(0, 6);
    if (digits.length !== 6) return Promise.reject(new Error("\u041D\u0443\u0436\u0435\u043D 6-\u0437\u043D\u0430\u0447\u043D\u044B\u0439 \u043A\u043E\u0434"));
    return fetch(url + "/api/pair/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: digits })
    }).then((r) => r.json().then((j) => ({ ok: r.ok, j }))).then(({ ok, j }) => {
      if (!ok) throw new Error(j && j.error || "\u041A\u043E\u0434 \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442");
      if (!j.token) throw new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u043D\u0435 \u043E\u0442\u0434\u0430\u043B \u0442\u043E\u043A\u0435\u043D");
      const me = j.me || null;
      setWatchroomToken(j.token, me);
      sessionDeadHinted = false;
      const who = me && me.username ? me.username : "\u0441\u0435\u043C\u044C\u044F";
      Lampa.Noty.show("Watchroom: \u0432\u043E\u0448\u043B\u0438 \u043A\u0430\u043A " + who + " \u2014 \u0432\u044B\u0431\u0438\u0440\u0430\u0439 \u043A\u0442\u043E \u0441\u0442\u0430\u0432\u0438\u0442 \u2605");
      pullMembers();
      pullProgress();
    });
  }
  function modsAvailable() {
    const w = window;
    if (w.plugin_modss) return true;
    try {
      const Comp = Lampa.Component;
      if (Comp && typeof Comp.get === "function" && Comp.get("modss_online")) return true;
    } catch (e) {
    }
    return false;
  }
  function seedResume(cmd) {
    const season = Math.max(0, Math.round(Number(cmd.season) || 0));
    const episode = Math.max(0, Math.round(Number(cmd.episode) || 0));
    const positionSec = Math.max(0, Number(cmd.positionSec) || 0);
    const percent = Math.max(0, Math.min(100, Math.round(Number(cmd.percent) || 0)));
    if (!season && !episode && !positionSec && !percent) return;
    const original = String(cmd.originalTitle || cmd.title || "").trim();
    if (!original) return;
    try {
      applyCursor({
        mediaType: cmd.mediaType === "tv" ? "tv" : "movie",
        tmdbId: Number(cmd.tmdbId) || 0,
        season,
        episode,
        positionSec,
        durationSec: 0,
        percent: percent || (positionSec ? 1 : 0),
        originalTitle: original,
        title: String(cmd.title || original),
        posterPath: "",
        voice: "",
        finished: false,
        updatedAt: Date.now()
      });
    } catch (e) {
    }
  }
  function openTitle(cmd) {
    const method = cmd.mediaType === "tv" ? "tv" : "movie";
    const id = Number(cmd.tmdbId);
    if (!id) return;
    const title = cmd.title || (method === "tv" ? "\u0421\u0435\u0440\u0438\u0430\u043B" : "\u0424\u0438\u043B\u044C\u043C");
    const original = String(cmd.originalTitle || title);
    const season = Math.max(0, Math.round(Number(cmd.season) || 0));
    const episode = Math.max(0, Math.round(Number(cmd.episode) || 0));
    const positionSec = Math.max(0, Number(cmd.positionSec) || 0);
    const percent = Math.max(0, Math.min(100, Math.round(Number(cmd.percent) || 0)));
    if (!modsAvailable()) {
      Lampa.Noty.show(
        "Watchroom: \u043D\u0443\u0436\u0435\u043D \u043F\u043B\u0430\u0433\u0438\u043D MODS\u2019s (http://modss.tv). \u0411\u0435\u0437 \u043D\u0435\u0433\u043E \u043A\u0430\u0441\u0442 \u043D\u0435 \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u043E\u0431\u044B\u0447\u043D\u044B\u0439 \u043F\u043B\u0435\u0435\u0440."
      );
      return;
    }
    seedResume(cmd);
    if (method === "tv" && season && episode) seedOnlineChoice(id, season, episode);
    const movie = {
      id,
      source: "tmdb",
      title,
      original_title: original
    };
    if (method === "tv") {
      movie.name = title;
      movie.original_name = original;
      if (season) {
        movie.season = season;
        movie.season_number = season;
      }
      if (episode) {
        movie.episode = episode;
        movie.episode_number = episode;
      }
    }
    if (positionSec) movie.time = positionSec;
    if (percent) movie.percent = percent;
    const open = (card) => {
      try {
        Lampa.Activity.push({
          url: "",
          title: "MODS's \u2014 " + title,
          component: "modss_online",
          search: title,
          search_one: title,
          search_two: original !== title ? original : title,
          movie: card,
          page: 1,
          // hint для наших хуков / будущих сборок; MODS обычно игнорит
          season,
          episode,
          time: positionSec,
          percent
        });
      } catch (e) {
        Lampa.Noty.show("Watchroom: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043A\u0440\u044B\u0442\u044C MODS\u2019s");
      }
    };
    let done = false;
    const once = (card) => {
      if (done) return;
      done = true;
      open(card);
    };
    const timer3 = setTimeout(() => once(movie), 4e3);
    try {
      const Api = Lampa.Api;
      if (Api && Api.full) {
        Api.full(
          { id, method, source: "tmdb", card: movie },
          (data) => {
            clearTimeout(timer3);
            once(data && data.movie && data.movie.id ? __spreadValues(__spreadValues({}, data.movie), pick(movie, ["season", "episode", "time", "percent"])) : movie);
          },
          () => {
            clearTimeout(timer3);
            once(movie);
          }
        );
      } else once(movie);
    } catch (e) {
      clearTimeout(timer3);
      once(movie);
    }
    let note = "\u0421 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u2192 MODS\u2019s: " + title;
    if (method === "tv" && episode) note += " \xB7 S" + season + "E" + episode;
    if (positionSec || percent) note += " \xB7 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C";
    Lampa.Noty.show(note);
  }
  var pick = (o, keys) => {
    const out = {};
    keys.forEach((k) => {
      if (o[k] !== void 0) out[k] = o[k];
    });
    return out;
  };
  var timer2 = null;
  var busy = false;
  var lastCmdId = 0;
  function pollOnce() {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url || busy) return;
    busy = true;
    const body = {
      deviceKey: deviceKey() || void 0,
      name: "\u041B\u0430\u043C\u043F\u0430"
    };
    void (async () => {
      try {
        const r = await fetch(url + "/api/cast/poll", {
          method: "POST",
          headers: h,
          body: JSON.stringify(body)
        });
        if (r.status === 401) {
          if (wrToken() && !sessionDeadHinted) {
            sessionDeadHinted = true;
            clearWatchroomToken();
            Lampa.Noty.show("Watchroom: \u0441\u0435\u0441\u0441\u0438\u044F \u0443\u0441\u0442\u0430\u0440\u0435\u043B\u0430 \u2014 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430");
          }
          return;
        }
        if (!r.ok) return;
        const data = await r.json();
        if (data.deviceKey) saveDeviceKey(data.deviceKey);
        const cmd = data.command;
        if (!cmd || cmd.type !== "play") return;
        if (cmd.id && cmd.id === lastCmdId) return;
        lastCmdId = cmd.id || 0;
        openTitle(cmd);
      } catch (e) {
      } finally {
        busy = false;
      }
    })();
  }
  function initCast() {
    if (timer2) return;
    pollOnce();
    timer2 = setInterval(pollOnce, POLL_MS);
  }
  function ensureWatchroom(then) {
    if (watchroomReady()) return then();
    if (!watchroomBase()) {
      Lampa.Noty.show("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0443\u043A\u0430\u0436\u0438 URL Watchroom \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445");
      return;
    }
    Lampa.Noty.show("\u0412\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 Watchroom \u043A\u043E\u0434\u043E\u043C \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430");
    promptPairCode(then);
  }
  function promptPairCode(onDone) {
    if (!watchroomBase()) {
      Lampa.Noty.show("\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0443\u043A\u0430\u0436\u0438 URL Watchroom");
      return;
    }
    const finish = (value) => {
      claimPairCode(value).then(() => {
        if (onDone) onDone();
      }).catch((err) => Lampa.Noty.show(err.message || "\u041E\u0448\u0438\u0431\u043A\u0430"));
    };
    const Input = Lampa.Input;
    if (Input && Input.edit) {
      Input.edit(
        {
          title: "\u041A\u043E\u0434 Watchroom \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430",
          value: "",
          free: true,
          nosave: true
        },
        (value) => {
          if (!value) return;
          finish(value);
        }
      );
      return;
    }
    const raw = window.prompt("\u041A\u043E\u0434 Watchroom \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 (6 \u0446\u0438\u0444\u0440)");
    if (raw == null || !raw) return;
    finish(raw);
  }

  // src/tmdb-v4.ts
  var API4 = "https://api.themoviedb.org/4";
  var configured = () => /^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(TMDB_V4_TOKEN);
  var accessToken = () => Lampa.Storage.get("tmdbacc_v4_token", "");
  var accountId2 = () => Lampa.Storage.get("tmdbacc_v4_account", "");
  var logged2 = () => !!(accessToken() && accountId2());
  function call(bearer, method, path, query = {}, body) {
    const q = __spreadProps(__spreadValues({}, query), { language: Lampa.Storage.get("language", "ru") });
    const url = API4 + path + "?" + Object.keys(q).map((k) => k + "=" + encodeURIComponent(q[k])).join("&");
    return fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json;charset=utf-8",
        Authorization: "Bearer " + bearer
      },
      body: body ? JSON.stringify(body) : void 0
    }).then((r) => r.json());
  }
  function createRequestToken2() {
    return call(TMDB_V4_TOKEN, "POST", "/auth/request_token", {}, {}).then(
      (t) => t.request_token || null
    );
  }
  function approveUrl(token) {
    return "https://www.themoviedb.org/auth/access?request_token=" + token;
  }
  function createAccessToken(token) {
    return call(TMDB_V4_TOKEN, "POST", "/auth/access_token", {}, { request_token: token }).then((r) => {
      if (!r.access_token || !r.account_id) return null;
      return { accessToken: r.access_token, accountId: r.account_id };
    });
  }
  function finishLogin2(accessTokenValue, accountIdValue) {
    Lampa.Storage.set("tmdbacc_v4_token", accessTokenValue);
    Lampa.Storage.set("tmdbacc_v4_account", accountIdValue);
  }
  function logout2() {
    Lampa.Storage.set("tmdbacc_v4_token", "");
    Lampa.Storage.set("tmdbacc_v4_account", "");
  }
  function request2(method, path, query) {
    return call(accessToken(), method, path, query);
  }

  // src/auth.ts
  var POLL_MS2 = 4e3;
  function ensureAuth(then, opts) {
    if (logged()) return then();
    if (!(opts == null ? void 0 : opts.force) && watchroomPaired()) return then();
    Lampa.Select.show({
      title: "\u0412\u0445\u043E\u0434 \u0432 TMDB",
      items: [
        { title: "\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044C \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 (QR-\u043A\u043E\u0434)", method: "qr" },
        { title: "\u0412\u0432\u0435\u0441\u0442\u0438 \u043B\u043E\u0433\u0438\u043D \u0438 \u043F\u0430\u0440\u043E\u043B\u044C", method: "password" }
      ],
      onSelect(item) {
        if (item.method === "qr") qrFlow(then);
        else passwordFlow(then);
      },
      onBack() {
        Lampa.Controller.toggle("content");
      }
    });
  }
  function qrFlow(then) {
    createRequestToken().then((token) => {
      if (!token) return Lampa.Noty.show("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0442\u043E\u043A\u0435\u043D TMDB");
      const approveUrl2 = "https://www.themoviedb.org/authenticate/" + token;
      const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" + encodeURIComponent(approveUrl2);
      let stopped = false;
      const html = $(
        '<div style="text-align:center;padding:1em 0"><img src="' + qrUrl + '" style="width:16em;height:16em;background:#fff;padding:0.7em;border-radius:0.7em"/><div style="margin-top:1.2em;font-size:1.15em">\u041E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439\u0442\u0435 QR-\u043A\u043E\u0434 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u043C,<br>\u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 TMDB \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xABApprove\xBB</div><div style="margin-top:0.8em;opacity:0.6;font-size:0.85em;word-break:break-all">' + approveUrl2 + "</div></div>"
      );
      Lampa.Modal.open({
        title: "\u0412\u0445\u043E\u0434 \u0432 TMDB",
        html,
        size: "medium",
        onBack() {
          stopped = true;
          Lampa.Modal.close();
          Lampa.Controller.toggle("content");
        }
      });
      const poll = () => {
        if (stopped) return;
        tryCreateSession(token).then((sessionId) => {
          if (stopped) return;
          if (sessionId) {
            stopped = true;
            Lampa.Modal.close();
            Lampa.Controller.toggle("content");
            finishLogin(sessionId, () => {
              syncAll(true);
              ensureV4(then);
            });
          } else {
            setTimeout(poll, POLL_MS2);
          }
        }).catch(() => setTimeout(poll, POLL_MS2 * 2));
      };
      setTimeout(poll, POLL_MS2);
    });
  }
  function ensureV4(next) {
    if (!configured() || logged2()) return next();
    createRequestToken2().then((token) => {
      if (!token) return next();
      const url = approveUrl(token);
      const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=" + encodeURIComponent(url);
      let stopped = false;
      const finish = () => {
        stopped = true;
        Lampa.Modal.close();
        Lampa.Controller.toggle("content");
        next();
      };
      const html = $(
        '<div style="text-align:center;padding:1em 0"><img src="' + qrUrl + '" style="width:14em;height:14em;background:#fff;padding:0.6em;border-radius:0.7em"/><div style="margin-top:1.2em;font-size:1.1em">\u0415\u0449\u0451 \u0440\u0430\u0437 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u0435 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 \u2014<br>\u044D\u0442\u043E \u0432\u043A\u043B\u044E\u0447\u0438\u0442 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 TMDB</div><div class="selector" style="display:inline-block;margin-top:1.2em;padding:0.6em 1.4em;border-radius:0.5em;background:rgba(255,255,255,0.12)">\u041F\u0440\u043E\u043F\u0443\u0441\u0442\u0438\u0442\u044C</div></div>'
      );
      html.find(".selector").on("hover:enter", finish);
      Lampa.Modal.open({
        title: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438",
        html,
        size: "medium",
        onBack: finish
      });
      const poll = () => {
        if (stopped) return;
        createAccessToken(token).then((result) => {
          if (stopped) return;
          if (result) {
            finishLogin2(result.accessToken, result.accountId);
            finish();
          } else {
            setTimeout(poll, POLL_MS2);
          }
        }).catch(() => setTimeout(poll, POLL_MS2 * 2));
      };
      setTimeout(poll, POLL_MS2);
    }).catch(next);
  }
  function passwordFlow(then) {
    Lampa.Input.edit(
      { title: "\u041B\u043E\u0433\u0438\u043D TMDB", value: Lampa.Storage.get("tmdbacc_login", ""), free: true, nosave: true },
      (user) => {
        if (!user) return Lampa.Controller.toggle("content");
        Lampa.Storage.set("tmdbacc_login", user);
        Lampa.Input.edit(
          { title: "\u041F\u0430\u0440\u043E\u043B\u044C TMDB", value: "", free: true, nosave: true },
          (pass) => {
            if (!pass) return Lampa.Controller.toggle("content");
            loginWithPassword(user, pass, () => {
              syncAll(true);
              ensureV4(then);
            });
          }
        );
      }
    );
  }

  // src/icon.ts
  var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.9 8.6L22 9.3L16.6 14L18.2 21L12 17.3L5.8 21L7.4 14L2 9.3L9.1 8.6L12 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  var ICON_HEART = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2z" fill="currentColor"/></svg>';

  // src/rate.ts
  var STAR2 = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z"/></svg>';
  function openRate(movie, rated, onChanged, opts) {
    injectStyles();
    const type = mediaType(movie);
    const title = String(movie.title || movie.name);
    const current = rated ? rated.value : 0;
    const mode = opts && opts.mode === "member" ? "member" : "tmdb";
    const memberId = opts && opts.memberId ? opts.memberId : 0;
    const memberName = opts && opts.memberName || "";
    const close = () => {
      Lampa.Modal.close();
      Lampa.Controller.toggle("full_start");
    };
    const submit = (val) => {
      close();
      if (mode === "member" && memberId) {
        putMemberScore({
          memberId,
          mediaType: type,
          tmdbId: movie.id,
          value: val,
          title,
          posterPath: String(movie.poster_path || "")
        }).then(() => {
          Lampa.Noty.show(memberName + ": \u2605 " + val);
          pullScores();
          if (onChanged) onChanged();
        }).catch((e) => Lampa.Noty.show(e.message || "\u041D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u043E\u0441\u044C"));
        return;
      }
      request("POST", `/${type}/${movie.id}/rating`, {}, { value: val }).then((json) => {
        if (json.success === false) return apiError(json);
        Lampa.Noty.show("\u2605 " + val + " \u2014 \xAB" + title + "\xBB");
        setRating(type, movie.id, val);
        if (onChanged) onChanged();
      });
    };
    const removeRating = () => {
      close();
      if (mode === "member" && memberId) {
        putMemberScore({
          memberId,
          mediaType: type,
          tmdbId: movie.id,
          value: 0,
          title,
          posterPath: String(movie.poster_path || "")
        }).then(() => {
          Lampa.Noty.show("\u041E\u0446\u0435\u043D\u043A\u0430 \u0441\u043D\u044F\u0442\u0430");
          pullScores();
          if (onChanged) onChanged();
        }).catch((e) => Lampa.Noty.show(e.message || "\u041D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u043E\u0441\u044C"));
        return;
      }
      request("DELETE", `/${type}/${movie.id}/rating`).then((json) => {
        if (json.success === false) return apiError(json);
        Lampa.Noty.show("\u041E\u0446\u0435\u043D\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0430");
        clearRating(type, movie.id);
        if (onChanged) onChanged();
      });
    };
    const label = mode === "member" ? memberName ? memberName.toUpperCase() : "\u041F\u0420\u041E\u0424\u0418\u041B\u042C" : rated ? "\u0412\u0410\u0428\u0410 \u041E\u0426\u0415\u041D\u041A\u0410" : "\u041E\u0426\u0415\u041D\u0418\u0422\u0415";
    const root = $(
      '<div class="tmdbacc-rate"><div class="tmdbacc-rate__big">' + STAR2 + '<span class="tmdbacc-rate__value">' + (current || "?") + '</span></div><div class="tmdbacc-rate__label">' + label + '</div><div class="tmdbacc-rate__title">' + title + '</div><div class="tmdbacc-rate__stars"></div></div>'
    );
    const valueEl = root.find(".tmdbacc-rate__value");
    const starsWrap = root.find(".tmdbacc-rate__stars");
    const starEls = [];
    const highlight = (n) => {
      starEls.forEach((el, idx) => {
        if (idx < n) el.addClass("filled");
        else el.removeClass("filled");
      });
      valueEl.text(n ? String(n) : "?");
    };
    for (let i = 1; i <= 10; i++) {
      const el = $('<div class="selector tmdbacc-rate__star">' + STAR2 + "</div>");
      el.on("hover:focus", () => highlight(i));
      el.on("hover:enter", () => submit(i));
      starEls.push(el);
      starsWrap.append(el);
    }
    highlight(current);
    if (rated) {
      const del = $('<div class="selector tmdbacc-rate__delete">\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043E\u0446\u0435\u043D\u043A\u0443</div>');
      del.on("hover:focus", () => highlight(current));
      del.on("hover:enter", removeRating);
      root.append(del);
    }
    Lampa.Modal.open({
      title: "",
      html: root,
      size: "medium",
      onBack: close
    });
    if (current > 0) {
      setTimeout(() => {
        Lampa.Controller.collectionFocus(starEls[current - 1][0], root);
        highlight(current);
      }, 100);
    }
  }

  // src/card-menu.ts
  var BOOKMARK2 = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
  var HEART2 = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  var LIST = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h16M4 12h16M4 18h10" stroke-linecap="round"/></svg>';
  function openCardMenu(movie, onChanged) {
    const type = mediaType(movie);
    if (watchroomReady()) {
      const st = { watchlist: false, favorite: false, rated: null, loading: true };
      const refresh = show(movie, st, onChanged);
      const h = watchroomHeaders();
      fetch(watchroomBase() + "/api/title/" + type + "/" + movie.id, { headers: h || {} }).then((r) => r.ok ? r.json() : Promise.reject(r.status)).then((t) => {
        st.watchlist = !!t.watchlist;
        st.favorite = !!t.favorite;
        st.rated = t.tmdbRating ? { value: t.tmdbRating } : null;
      }).catch(() => Lampa.Noty.show("Watchroom: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0443\u0437\u043D\u0430\u0442\u044C, \u0447\u0442\u043E \u0443\u0436\u0435 \u0432 \u0441\u043F\u0438\u0441\u043A\u0430\u0445")).then(() => {
        st.loading = false;
        refresh();
      });
      return;
    }
    const empty = { watchlist: false, favorite: false, rated: null };
    if (!logged()) {
      show(movie, empty, onChanged);
      return;
    }
    request("GET", `/${type}/${movie.id}/account_states`).then((state2) => {
      show(movie, {
        watchlist: !!state2.watchlist,
        favorite: !!state2.favorite,
        rated: state2.rated && typeof state2.rated === "object" ? state2.rated : null
      }, onChanged);
    }).catch(() => {
      show(movie, empty, onChanged);
    });
  }
  function show(movie, st, onChanged) {
    injectStyles();
    const title = String(movie.title || movie.name);
    const close = () => {
      Lampa.Modal.close();
      Lampa.Controller.toggle("full_start");
    };
    const makeTile = (cls, icon, name) => $(
      '<div class="selector tmdbacc-tile tmdbacc-tile--' + cls + '">' + icon + '<div class="tmdbacc-tile__name">' + name + '</div><div class="tmdbacc-tile__status"></div></div>'
    );
    const member = selectedMember();
    const ours = viewerScores(mediaType(movie), movie.id);
    const mid = selectedMemberId();
    const myScore = ours.find(
      (s) => s.memberId === mid || s.viewerId === mid || member && s.name === member.name
    );
    const wTile = makeTile("watch", BOOKMARK2, "\u041F\u043E\u0437\u0436\u0435");
    const fTile = makeTile("fav", HEART2, "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435");
    const rTile = makeTile("rate", ICON, "\u041E\u0446\u0435\u043D\u043A\u0430");
    const whoTile = $(
      '<div class="selector tmdbacc-menu__wide tmdbacc-menu__who"><span>\u041E\u0446\u0435\u043D\u043A\u0438 \u0441\u0442\u0430\u0432\u0438\u0442\u0435 \u043A\u0430\u043A <b>' + (member ? member.name : "\u2014") + "</b> \xB7 \u0441\u043C\u0435\u043D\u0438\u0442\u044C</span></div>"
    );
    const setTile = (tile, active, status) => {
      if (active) tile.addClass("tmdbacc-tile--active");
      else tile.removeClass("tmdbacc-tile--active");
      tile.find(".tmdbacc-tile__status").text(status);
    };
    const renderStates = () => {
      if (st.loading) {
        setTile(wTile, false, "\u2026");
        setTile(fTile, false, "\u2026");
      } else {
        setTile(wTile, st.watchlist, st.watchlist ? "\u2713 \u0412 \u0441\u043F\u0438\u0441\u043A\u0435" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C");
        setTile(fTile, st.favorite, st.favorite ? "\u2713 \u0412 \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u043C" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C");
      }
      const personal = myScore ? myScore.value : 0;
      const tmdb = st.rated ? st.rated.value : 0;
      setTile(
        rTile,
        !!(personal || tmdb),
        personal ? "\u2605 " + personal + (member ? " \xB7 " + member.name : "") : tmdb ? "TMDB \u2605 " + tmdb : "\u041D\u0435 \u043E\u0446\u0435\u043D\u0435\u043D\u043E"
      );
    };
    const toggle = (kind) => {
      if (st.loading) return;
      const next = !st[kind];
      st[kind] = next;
      renderStates();
      const revert = () => {
        st[kind] = !next;
        renderStates();
      };
      if (watchroomReady()) {
        const h = watchroomHeaders();
        const url = watchroomBase();
        if (!h || !url) {
          revert();
          close();
          ensureWatchroom(() => openCardMenu(movie, onChanged));
          return;
        }
        const type2 = mediaType(movie);
        fetch(url + "/api/" + kind, {
          method: "POST",
          headers: h,
          body: JSON.stringify({
            mediaType: type2,
            tmdbId: movie.id,
            on: next,
            title: String(movie.title || movie.name || ""),
            posterPath: String(movie.poster_path || "")
          })
        }).then((r) => r.json().then((j) => ({ ok: r.ok, j }))).then(({ ok, j }) => {
          if (!ok) {
            revert();
            return Lampa.Noty.show(j && j.error || "Watchroom \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B \u0441\u043F\u0438\u0441\u043E\u043A");
          }
          if (onChanged) onChanged();
        }).catch(revert);
        return;
      }
      if (!logged()) {
        revert();
        close();
        ensureAuth(() => openCardMenu(movie, onChanged), { force: true });
        return;
      }
      const body = {
        media_type: mediaType(movie),
        media_id: movie.id,
        [kind]: next
      };
      request("POST", `/account/${accountId()}/${kind}`, {}, body).then((json) => {
        if (json.success === false) {
          revert();
          return apiError(json);
        }
        setFlag(kind, mediaType(movie), movie.id, next);
        if (onChanged) onChanged();
      }).catch(revert);
    };
    wTile.on("hover:enter", () => toggle("watchlist"));
    fTile.on("hover:enter", () => toggle("favorite"));
    rTile.on("hover:enter", () => {
      Lampa.Modal.close();
      const rateMember = () => {
        const m = selectedMember();
        if (m) {
          openMemberRate(movie, m, myScore ? myScore.value : 0, () => {
            pullScores().then(() => onChanged && onChanged());
          });
        } else if (logged()) {
          openRate(movie, st.rated, onChanged);
        } else {
          ensureWatchroom(() => openCardMenu(movie, onChanged));
        }
      };
      if (watchroomReady() || selectedMember()) rateMember();
      else ensureWatchroom(rateMember);
    });
    whoTile.on("hover:enter", () => {
      close();
      if (!watchroomReady()) {
        ensureWatchroom(() => pickMember(() => openCardMenu(movie, onChanged)));
        return;
      }
      pickMember(() => openCardMenu(movie, onChanged));
    });
    const listBtn = $(
      '<div class="selector tmdbacc-menu__wide">' + LIST + "<span>\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u0441\u043F\u0438\u0441\u043E\u043A TMDB\u2026</span></div>"
    );
    listBtn.on("hover:enter", () => {
      close();
      if (!logged()) {
        ensureAuth(() => listsMenu(movie), { force: true });
        return;
      }
      listsMenu(movie);
    });
    const tiles = $('<div class="tmdbacc-menu__tiles"></div>');
    tiles.append(wTile);
    tiles.append(fTile);
    tiles.append(rTile);
    const root = $('<div class="tmdbacc-menu"></div>');
    root.append(tiles);
    if (logged()) root.append(listBtn);
    const type = mediaType(movie);
    const cursor = cursorOf(type, movie.id);
    const place = formatCursor(cursor);
    if (place) {
      root.append($('<div class="tmdbacc-menu__progress"><span>\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u043B\u0438\u0441\u044C</span><b>' + place + "</b></div>"));
    }
    if (ours.length) {
      const chips = ours.map((s) => '<span class="tmdbacc-menu__chip">' + s.name + " <i>\u2605" + s.value + "</i></span>").join("");
      root.append($('<div class="tmdbacc-menu__viewers">' + chips + "</div>"));
    } else {
      pullScores();
    }
    root.append(whoTile);
    renderStates();
    Lampa.Modal.open({
      title,
      html: root,
      size: "medium",
      onBack: close
    });
    return renderStates;
  }
  function addToList(listId, movie) {
    request("POST", `/list/${listId}/add_item`, {}, { media_id: movie.id }).then((json) => {
      if (json.status_code === 8) Lampa.Noty.show("\u0423\u0436\u0435 \u0435\u0441\u0442\u044C \u0432 \u044D\u0442\u043E\u043C \u0441\u043F\u0438\u0441\u043A\u0435");
      else if (json.success === false) apiError(json);
      else Lampa.Noty.show("\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0432 \u0441\u043F\u0438\u0441\u043E\u043A");
    });
  }
  function createList(movie) {
    Lampa.Input.edit(
      { title: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u043F\u0438\u0441\u043A\u0430", value: "", free: true, nosave: true },
      (name) => {
        if (!name) return Lampa.Controller.toggle("full_start");
        request("POST", "/list", {}, { name, description: "", language: "ru" }).then((json) => {
          if (!json.list_id) return apiError(json, "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A");
          Lampa.Noty.show("\u0421\u043F\u0438\u0441\u043E\u043A \xAB" + name + "\xBB \u0441\u043E\u0437\u0434\u0430\u043D");
          addToList(json.list_id, movie);
        });
      }
    );
  }
  function listsMenu(movie) {
    if (mediaType(movie) === "tv") {
      return Lampa.Noty.show("\u0412 \u0441\u043F\u0438\u0441\u043A\u0438 TMDB \u043C\u043E\u0436\u043D\u043E \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0444\u0438\u043B\u044C\u043C\u044B (\u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0435 API v3)");
    }
    request("GET", `/account/${accountId()}/lists`, { page: 1 }).then((json) => {
      const lists = json.results || [];
      const items = lists.map((l) => ({
        title: `${l.name}  (${l.item_count})`,
        list_id: l.id
      }));
      items.push({ title: "+ \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A", create: true });
      Lampa.Select.show({
        title: "\u041C\u043E\u0438 \u0441\u043F\u0438\u0441\u043A\u0438",
        items,
        onSelect(item) {
          if (item.create) createList(movie);
          else {
            Lampa.Controller.toggle("full_start");
            addToList(item.list_id, movie);
          }
        },
        onBack() {
          Lampa.Controller.toggle("full_start");
        }
      });
    });
  }

  // src/card.ts
  function refreshButton(btn, movie) {
    const type = mediaType(movie);
    const label = btn.find("span");
    const member = selectedMember();
    const ours = viewerScores(type, movie.id);
    const personal = ours.find(
      (s) => member && (s.memberId === member.id || s.viewerId === member.id || s.name === member.name) || false
    );
    if (personal) {
      btn.addClass("tmdbacc--rated");
      label.text(String(personal.value));
      return;
    }
    if (!logged()) {
      btn.removeClass("tmdbacc--rated");
      label.text(watchroomReady() ? "\u2605" : "Watchroom");
      return;
    }
    request("GET", `/${type}/${movie.id}/account_states`).then((state2) => {
      const rated = state2.rated && typeof state2.rated === "object" ? state2.rated : null;
      if (rated) {
        btn.addClass("tmdbacc--rated");
        label.text(String(rated.value));
      } else {
        btn.removeClass("tmdbacc--rated");
        label.text(watchroomReady() ? "\u2605" : "TMDB");
      }
    }).catch(() => {
      btn.removeClass("tmdbacc--rated");
      label.text(watchroomReady() ? "\u2605" : "Watchroom");
    });
  }
  function openMenu(movie, btn) {
    openCardMenu(movie, () => refreshButton(btn, movie));
  }
  function initCardButton() {
    Lampa.Listener.follow("full", (e) => {
      if (e.type !== "complite") return;
      const render = e.object.activity.render();
      if (render.find(".view--tmdbacc").length) return;
      injectStyles();
      const movie = e.data.movie;
      const btn = $(
        '<div class="full-start__button selector view--tmdbacc">' + ICON + "<span>" + (watchroomReady() ? "\u2605" : "Watchroom") + "</span></div>"
      );
      btn.on("hover:enter", () => {
        if (watchroomReady()) return openMenu(movie, btn);
        if (logged()) return openMenu(movie, btn);
        ensureWatchroom(() => openMenu(movie, btn));
      });
      const container = render.find(".full-start-new__buttons, .full-start__buttons").first();
      const firstButton = container.find(".full-start__button").first();
      if (firstButton.length) firstButton.after(btn);
      else if (container.length) container.append(btn);
      refreshButton(btn, movie);
    });
  }

  // src/continue.ts
  var URL = "http://127.0.0.1:8765/continue";
  var PUSH_EVERY_MS = 90 * 1e3;
  var MAX_ITEMS = 20;
  var lampa = () => Lampa;
  var FINISHED = 90;
  var MAX_EPISODES = 40;
  function isShow(card) {
    return !!(card.number_of_seasons || card.first_air_date);
  }
  function lastEpisode(card) {
    const seasons = Math.max(1, Math.min(30, card.number_of_seasons || 1));
    for (let season = seasons; season >= 1; season--) {
      let best = null;
      for (let episode = 1; episode <= MAX_EPISODES; episode++) {
        const view = lampa().Timeline.watchedEpisode(card, season, episode, true);
        if (!view || !view.percent) continue;
        if (!best || (view.updated || 0) >= (best.view.updated || 0)) {
          best = { season, episode, view };
        }
      }
      if (best) return best;
    }
    return null;
  }
  function describe(card) {
    const title = card.title || card.name || "";
    if (!card.id || !title) return null;
    const base = { id: card.id, title, backdrop: card.backdrop_path || "", poster: card.poster_path || "" };
    if (!isShow(card)) {
      const view = lampa().Timeline.watched(card, true);
      if (!view || !view.percent || view.percent >= FINISHED) return null;
      return __spreadProps(__spreadValues({}, base), { media: "movie", percent: Math.round(view.percent), season: 0, episode: 0, next: false, updated: view.updated || 0 });
    }
    const last = lastEpisode(card);
    if (!last) return null;
    const done = last.view.percent >= FINISHED;
    return __spreadProps(__spreadValues({}, base), {
      media: "tv",
      percent: done ? 0 : Math.round(last.view.percent),
      season: last.season,
      episode: done ? last.episode + 1 : last.episode,
      next: done,
      updated: last.view.updated || 0
    });
  }
  function collect() {
    const items = [];
    const seen = {};
    ["movie", "tv", "anime"].forEach((type) => {
      let cards = [];
      try {
        cards = lampa().Favorite.continues(type) || [];
      } catch (e) {
        cards = [];
      }
      cards.forEach((card) => {
        if (seen[card.id]) return;
        seen[card.id] = true;
        try {
          const item = describe(card);
          if (item) items.push(item);
        } catch (e) {
        }
      });
    });
    items.sort((a, b) => b.updated - a.updated);
    return items.slice(0, MAX_ITEMS);
  }
  var failures = 0;
  function push() {
    try {
      const body = JSON.stringify({ v: 1, at: Date.now(), items: collect() });
      fetch(URL, { method: "POST", mode: "no-cors", keepalive: true, body }).then(
        () => {
          failures = 0;
        },
        () => {
          failures++;
        }
      );
    } catch (e) {
      failures++;
    }
  }
  function initContinue() {
    setTimeout(push, 8e3);
    setInterval(() => {
      if (!document.hidden && failures < 3) push();
    }, PUSH_EVERY_MS);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) push();
    });
    window.addEventListener("pagehide", push);
    try {
      const listener = lampa().Player && lampa().Player.listener;
      if (listener) listener.follow("destroy", () => setTimeout(push, 1500));
    } catch (e) {
    }
  }

  // src/catalog.ts
  var SOURCE = "tmdbacc";
  var FAMILY_COMPONENT = "tmdbacc_family";
  function spatialNav() {
    return globalThis.Navigator;
  }
  var V4_PREFIX = "v4:";
  var WR_PREFIX = "wr:";
  var CATEGORIES = [
    { title: "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u2014 \u0444\u0438\u043B\u044C\u043C\u044B", url: "/account/{account}/watchlist/movies" },
    { title: "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u2014 \u0441\u0435\u0440\u0438\u0430\u043B\u044B", url: "/account/{account}/watchlist/tv" },
    { title: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u2014 \u0444\u0438\u043B\u044C\u043C\u044B", url: "/account/{account}/favorite/movies" },
    { title: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u2014 \u0441\u0435\u0440\u0438\u0430\u043B\u044B", url: "/account/{account}/favorite/tv" },
    { title: "\u041E\u0446\u0435\u043D\u0451\u043D\u043D\u044B\u0435 \u2014 \u0444\u0438\u043B\u044C\u043C\u044B", url: "/account/{account}/rated/movies" },
    { title: "\u041E\u0446\u0435\u043D\u0451\u043D\u043D\u044B\u0435 \u2014 \u0441\u0435\u0440\u0438\u0430\u043B\u044B", url: "/account/{account}/rated/tv" }
  ];
  var V4_CATEGORIES = [
    { title: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u2014 \u0444\u0438\u043B\u044C\u043C\u044B", url: V4_PREFIX + "/account/{account}/movie/recommendations" },
    { title: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u0438 \u2014 \u0441\u0435\u0440\u0438\u0430\u043B\u044B", url: V4_PREFIX + "/account/{account}/tv/recommendations" }
  ];
  var WR_LINES = [
    { title: "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C", kind: "continue", short: "\u041F\u0440\u043E\u0434\u043E\u043B\u0436\u0438\u0442\u044C" },
    { title: "\u0418\u0434\u0435\u0438 \u043D\u0430 \u0432\u0435\u0447\u0435\u0440", kind: "ideas", short: "\u0418\u0434\u0435\u0438" },
    { title: "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435", kind: "watchlist", short: "\u041F\u043E\u0437\u0436\u0435" },
    { title: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435", kind: "favorite", short: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435" },
    { title: "\u041E\u0446\u0435\u043D\u043A\u0438 \u0441\u0435\u043C\u044C\u0438", kind: "ours", short: "\u041E\u0446\u0435\u043D\u043A\u0438" },
    { title: "\u0414\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043E", kind: "watched", short: "\u0414\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u043E" },
    { title: "\u041E\u0446\u0435\u043D\u0451\u043D\u043D\u044B\u0435 TMDB", kind: "rated", short: "TMDB \u2605" }
  ];
  var libraryCache = null;
  var libraryAt = 0;
  var LIBRARY_TTL_MS = 3e4;
  function toLampaCard(item) {
    const id = Number(item.id || item.tmdbId || 0);
    if (!id) return null;
    const type = item.mediaType === "tv" ? "tv" : "movie";
    const title = String(item.title || item.originalTitle || "");
    const card = {
      id,
      source: "tmdb",
      media_type: type,
      poster_path: item.posterPath || "",
      poster: item.posterPath || "",
      img: item.posterPath || ""
    };
    if (type === "tv") {
      card.name = title;
      card.original_name = item.originalTitle || title;
      if (item.year) card.first_air_date = String(item.year) + "-01-01";
    } else {
      card.title = title;
      card.original_title = item.originalTitle || title;
      if (item.year) card.release_date = String(item.year) + "-01-01";
    }
    if (item.vote) card.vote_average = item.vote;
    if (item.memberNames && item.memberNames.length) {
      card.tmdbacc_by = item.memberNames.join(", ");
    } else if (item.scores && item.scores.length) {
      card.tmdbacc_by = item.scores.map((s) => s.name).filter(Boolean).join(", ");
    }
    return card;
  }
  function pageOf(items, page) {
    const size = 20;
    const start = (Math.max(1, page) - 1) * size;
    const slice = items.slice(start, start + size);
    const results = slice.map(toLampaCard).filter(Boolean);
    const total = items.length;
    return {
      results,
      page: Math.max(1, page),
      total_pages: Math.max(1, Math.ceil(total / size) || 1),
      total_results: total
    };
  }
  function rememberMembers(lib) {
    const list = lib.members || lib.viewers || lib.household && lib.household.members || [];
    if (list.length) cacheMembers(list);
  }
  function fetchLibrary(force) {
    const now = Date.now();
    if (!force && libraryCache && now - libraryAt < LIBRARY_TTL_MS) {
      return Promise.resolve(libraryCache);
    }
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url) return Promise.reject(new Error("Watchroom \u043D\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D"));
    const ideas = Promise.race([
      fetch(url + "/api/recommend?hideListed=1", { headers: h }).then((r) => r.ok ? r.json() : null).catch(() => null),
      new Promise((ok) => setTimeout(() => ok(null), 4e3))
    ]).then((rec) => {
      if (!rec) return [];
      const seen = /* @__PURE__ */ new Set();
      return [...rec.top || [], ...rec.discover || []].filter((c) => {
        const k = c.mediaType + ":" + c.id;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
    });
    return Promise.all([
      fetch(url + "/api/library?scope=household", { headers: h }).then((r) => r.ok ? r.json() : Promise.reject(r.status)),
      ideas
    ]).then(([data, ideaList]) => {
      libraryCache = __spreadProps(__spreadValues({}, data || {}), { ideas: ideaList });
      libraryAt = Date.now();
      rememberMembers(libraryCache);
      return libraryCache;
    });
  }
  function filterCardsByMember(items, memberId, kind, members) {
    if (!memberId) return items;
    if (kind === "continue" || kind === "ideas") return items;
    const mid = Number(memberId) || 0;
    const accountOf = (m) => Number(m.accountId || 0) || 0;
    return items.filter((c) => {
      const ids = (c.memberIds || []).map(Number).filter(Boolean);
      if (ids.indexOf(mid) >= 0) return true;
      if (c.scores && c.scores.some((s) => Number(s.memberId || s.viewerId) === mid)) return true;
      const aid = Number(c.addedByAccountId) || 0;
      if (aid && members && members.some((m) => m.id === mid && accountOf(m) === aid)) return true;
      return false;
    });
  }
  function sourceListWr(kind, page, oncomplite, onerror) {
    fetchLibrary().then((lib) => {
      const raw = lib[kind] || [];
      oncomplite(pageOf(raw, page));
    }).catch(onerror);
  }
  function sourceListV4(url, page, oncomplite, onerror) {
    const path = url.slice(V4_PREFIX.length).replace("{account}", accountId2());
    request2("GET", path, { page }).then((json) => {
      const results = json.results || [];
      results.forEach((item) => {
        item.source = "tmdb";
      });
      oncomplite({
        results,
        page: json.page || 1,
        total_pages: json.total_pages || 1,
        total_results: json.total_results || results.length
      });
    }).catch(onerror);
  }
  function sourceList(params, oncomplite, onerror) {
    const page = params.page || 1;
    if (params.url.indexOf(WR_PREFIX) === 0) {
      return sourceListWr(params.url.slice(WR_PREFIX.length), page, oncomplite, onerror);
    }
    if (params.url.indexOf(V4_PREFIX) === 0) {
      return sourceListV4(params.url, page, oncomplite, onerror);
    }
    const url = params.url.replace("{account}", String(accountId()));
    const isCustomList = url.indexOf("/list/") === 0;
    const query = isCustomList ? { page } : { page, sort_by: "created_at.desc" };
    request("GET", url, query).then((json) => {
      const results = json.results || json.items || [];
      results.forEach((item) => {
        item.source = "tmdb";
      });
      oncomplite({
        results,
        page: json.page || 1,
        total_pages: json.total_pages || 1,
        total_results: json.total_results || results.length
      });
    }).catch(onerror);
  }
  function buildWrLines(lib) {
    const lines = [];
    WR_LINES.forEach((line) => {
      const raw = lib[line.kind] || [];
      if (!raw.length) return;
      const data = pageOf(raw, 1);
      if (!data.results.length) return;
      data.title = line.title;
      data.url = WR_PREFIX + line.kind;
      data.source = SOURCE;
      lines.push(data);
    });
    return lines;
  }
  function sourceMainWr(oncomplite, onerror) {
    pullProgress();
    fetchLibrary(true).then((lib) => {
      const lines = buildWrLines(lib);
      if (lines.length) {
        oncomplite(lines);
        return;
      }
      Lampa.Noty.show(
        "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0441\u0435\u043C\u044C\u0438 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u0430 \u2014 \u2605 \u0438 \xAB\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435\xBB \u0441 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 / \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C"
      );
      onerror(new Error("empty"));
    }).catch((_err) => {
      Lampa.Noty.show("Watchroom: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443 \u0441\u0435\u043C\u044C\u0438");
      onerror(_err);
    });
  }
  function sourceMainTmdb(oncomplite, onerror) {
    syncAll(true);
    const loadLine = (title, url) => new Promise((resolve) => {
      sourceList(
        { url, page: 1 },
        (data) => {
          if (!data.results.length) return resolve(null);
          data.title = title;
          data.url = url;
          data.source = SOURCE;
          resolve(data);
        },
        () => resolve(null)
      );
    });
    const baseLines = Promise.all(CATEGORIES.map((c) => loadLine(c.title, c.url)));
    const recommendLines = logged2() ? Promise.all(V4_CATEGORIES.map((c) => loadLine(c.title, c.url))) : Promise.resolve([]);
    const customLines = request("GET", `/account/${accountId()}/lists`, { page: 1 }).then((json) => {
      const lists = (json.results || []).slice(0, 10);
      return Promise.all(lists.map((l) => loadLine(l.name, "/list/" + l.id)));
    }).catch(() => []);
    Promise.all([recommendLines, baseLines, customLines]).then(([recommend, base, custom]) => {
      const lines = recommend.concat(base, custom).filter(Boolean);
      if (lines.length) oncomplite(lines);
      else onerror(new Error("empty"));
    });
  }
  function sourceMain(_params, oncomplite, onerror) {
    if (watchroomPaired()) return sourceMainWr(oncomplite, onerror);
    if (logged()) return sourceMainTmdb(oncomplite, onerror);
    onerror(new Error("not authorized"));
  }
  var pendingByUrl = {};
  function patchApiListForWr() {
    const api2 = Lampa.Api;
    const prev = api2.list.bind(Lampa.Api);
    api2.list = function(params, oncomplite, onerror) {
      const url = String(params && params.url || "");
      if (url.indexOf(WR_PREFIX) !== 0) return prev(params, oncomplite, onerror);
      const kind = url.slice(WR_PREFIX.length);
      const page = params && params.page || 1;
      const ready = pendingByUrl[url];
      if (ready && page === 1) {
        oncomplite(ready);
        return;
      }
      fetchLibrary().then((lib) => {
        const raw = lib[kind] || [];
        const data = pageOf(raw, page);
        if (data.results.length) oncomplite(data);
        else onerror(new Error("empty"));
      }).catch(onerror);
    };
  }
  function familyTitle(section, whoLabel) {
    const house = watchroomUsername() || "\u0441\u0435\u043C\u044C\u044F";
    return section + " \xB7 " + whoLabel + " \u2014 " + house;
  }
  function setActivityTitle(title) {
    try {
      const act = Lampa.Activity.active();
      if (act) act.title = title;
    } catch (_e) {
    }
    const head = $(".head__title");
    if (head && head.length) head.text(title);
  }
  function FamilyComponent() {
    const html = $('<div class="tmdbacc-family"></div>');
    const head = $('<div class="tmdbacc-family__head"></div>');
    const sectionsRow = $('<div class="tmdbacc-family__sections"></div>');
    const whoRow = $('<div class="tmdbacc-family__who"></div>');
    const bodyHost = $('<div class="tmdbacc-family__body"></div>');
    head.append(sectionsRow).append(whoRow);
    html.append(head).append(bodyHost);
    const scroll = new Lampa.Scroll({ mask: true, over: true });
    bodyHost.append(scroll.render());
    try {
      scroll.minus(head);
    } catch (_e) {
      scroll.minus();
    }
    let lib = null;
    let sectionKind = "watchlist";
    let memberId = 0;
    let cards = [];
    let focusKey = "sec:watchlist";
    let lastCardFocus = false;
    let showWho = false;
    function availableSections() {
      if (!lib) return [];
      const people = membersForFilter();
      return WR_LINES.map((line) => {
        const raw = filterCardsByMember(
          lib[line.kind] || [],
          memberId,
          line.kind,
          people
        );
        return __spreadProps(__spreadValues({}, line), { count: raw.length });
      }).filter((l) => l.count > 0 || (lib[l.kind] || []).length > 0);
    }
    function membersForFilter() {
      const cached = membersCached();
      if (cached.length) return cached;
      return lib && (lib.members || lib.viewers) || [];
    }
    function whoLabel() {
      if (!memberId) return "\u0412\u0441\u0435";
      const m = membersForFilter().find((x) => x.id === memberId);
      return m ? m.name : "\u0412\u0441\u0435";
    }
    function sectionMeta() {
      return WR_LINES.find((l) => l.kind === sectionKind) || WR_LINES[1];
    }
    const self = this;
    function destroyCards() {
      cards.forEach((c) => {
        try {
          if (c.destroy) c.destroy();
        } catch (_e) {
        }
      });
      cards = [];
      scroll.clear();
    }
    function resolveFocus() {
      if (focusKey.indexOf("sec:") === 0) {
        const kind = focusKey.slice(4);
        const el = html.find('.tmdbacc-family__tab[data-kind="' + kind + '"]')[0];
        if (el) return el;
      }
      if (focusKey.indexOf("who:") === 0) {
        const id = focusKey.slice(4);
        const el = html.find('.tmdbacc-family__who-btn[data-member="' + id + '"]')[0];
        if (el) return el;
      }
      if (lastCardFocus && lastCardFocus.offsetParent !== null) return lastCardFocus;
      return html.find(".tmdbacc-family__tab.active")[0] || html.find(".tmdbacc-family__tab.selector")[0] || false;
    }
    function reveal(row, el) {
      const right = el.offsetLeft + el.offsetWidth + 16;
      if (right > row.scrollLeft + row.clientWidth) row.scrollLeft = right - row.clientWidth;
      else if (el.offsetLeft - 16 < row.scrollLeft) row.scrollLeft = Math.max(0, el.offsetLeft - 16);
    }
    function paintTabs() {
      sectionsRow.empty();
      const secs = availableSections();
      if (!secs.some((s) => s.kind === sectionKind) && secs.length) {
        sectionKind = secs[0].kind;
      }
      secs.forEach((sec) => {
        const btn = $(
          '<div class="tmdbacc-family__tab selector" data-kind="' + sec.kind + '"><span class="tmdbacc-family__tab-label">' + sec.short + "</span>" + (sec.count ? '<span class="tmdbacc-family__tab-count">' + sec.count + "</span>" : "") + "</div>"
        );
        if (sec.kind === sectionKind) btn.addClass("active");
        btn.on("hover:enter", () => {
          if (sectionKind === sec.kind) return;
          sectionKind = sec.kind;
          focusKey = "sec:" + sec.kind;
          rebuild();
        });
        btn.on("hover:focus", () => {
          focusKey = "sec:" + sec.kind;
          reveal(sectionsRow[0], btn[0]);
        });
        sectionsRow.append(btn);
      });
      whoRow.empty();
      const people = membersForFilter();
      showWho = people.length > 1;
      if (showWho) {
        whoRow.removeClass("hide");
        const whoItems = [{ id: 0, name: "\u0412\u0441\u0435" }].concat(
          people.map((p) => ({ id: p.id, name: p.name }))
        );
        whoItems.forEach((w) => {
          const btn = $(
            '<div class="tmdbacc-family__who-btn selector" data-member="' + w.id + '">' + w.name + "</div>"
          );
          if (w.id === memberId) btn.addClass("active");
          btn.on("hover:enter", () => {
            if (memberId === w.id) return;
            memberId = w.id;
            focusKey = "who:" + w.id;
            rebuild();
          });
          btn.on("hover:focus", () => {
            focusKey = "who:" + w.id;
            reveal(whoRow[0], btn[0]);
          });
          whoRow.append(btn);
        });
      } else {
        whoRow.addClass("hide");
        memberId = 0;
      }
    }
    function appendCards(items) {
      const layer = document.createElement("div");
      layer.className = "tmdbacc-family__grid category-full__layer";
      items.forEach((raw) => {
        const data = toLampaCard(raw);
        if (!data) return;
        const card = new Lampa.Card(data, { card_category: true });
        card.create();
        card.onFocus = (target) => {
          lastCardFocus = target;
          focusKey = "card";
          scroll.update(target);
          try {
            const bg = Lampa.Utils;
            if (bg && bg.cardImgBackground) Lampa.Background.change(bg.cardImgBackground(data));
          } catch (_e) {
          }
        };
        card.onEnter = () => {
          Lampa.Activity.push({
            url: "",
            component: "full",
            id: data.id,
            method: data.name || data.original_name ? "tv" : "movie",
            card: data,
            source: "tmdb"
          });
        };
        const rendered = card.render(true);
        const node = rendered[0] || rendered;
        if (data.tmdbacc_by && node && node.querySelector) {
          const by = document.createElement("div");
          by.className = "tmdbacc-family__by";
          by.textContent = String(data.tmdbacc_by);
          const view = node.querySelector(".card__view");
          if (view) view.appendChild(by);
          else node.appendChild(by);
        }
        if (node) {
          layer.appendChild(node);
          try {
            const anyCard = card;
            if (typeof anyCard.visible === "function") anyCard.visible();
            else node.dispatchEvent(new Event("visible"));
          } catch (_e) {
          }
          const img = node.querySelector(".card__img");
          const path = String(data.poster_path || data.poster || "");
          if (img && path && (!img.src || img.src.indexOf("img_load") >= 0 || img.src.indexOf("img_broken") >= 0)) {
            img.src = path.indexOf("http") === 0 ? path : "https://image.tmdb.org/t/p/w300" + path;
          }
        }
        cards.push(card);
      });
      scroll.append(layer);
    }
    function rebuild() {
      paintTabs();
      destroyCards();
      lastCardFocus = false;
      const meta = sectionMeta();
      const raw = filterCardsByMember(
        lib && lib[sectionKind] || [],
        memberId,
        sectionKind,
        membersForFilter()
      );
      const title = familyTitle(meta.title, whoLabel());
      setActivityTitle(title);
      if (!raw.length) {
        scroll.append(
          $(
            '<div class="tmdbacc-family__empty">\u0412 \u044D\u0442\u043E\u043C \u0440\u0430\u0437\u0434\u0435\u043B\u0435 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u043E' + (memberId ? " \u0443 \xAB" + whoLabel() + "\xBB" : "") + "</div>"
          )
        );
      } else {
        appendCards(raw);
      }
      self.start();
    }
    this.create = function() {
      self.activity.loader(true);
      pullProgress();
      fetchLibrary(true).then((data) => {
        lib = data;
        const secs = availableSections();
        if (!secs.length) {
          Lampa.Noty.show("\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0441\u0435\u043C\u044C\u0438 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u0430 \u2014 \u0434\u043E\u0431\u0430\u0432\u044C \u2605 / \xAB\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435\xBB \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430");
          self.activity.loader(false);
          scroll.append($('<div class="tmdbacc-family__empty">\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0441\u0435\u043C\u044C\u0438 \u043F\u043E\u043A\u0430 \u043F\u0443\u0441\u0442\u0430</div>'));
          self.activity.toggle();
          return;
        }
        const prefer = ["watchlist", "favorite", "ours", "continue", "watched", "rated"];
        sectionKind = prefer.find((k) => secs.some((s) => s.kind === k && s.count > 0)) || secs[0].kind;
        rebuild();
        self.activity.loader(false);
        self.activity.toggle();
      }).catch((err) => {
        self.activity.loader(false);
        Lampa.Noty.show("Watchroom: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443 (" + String(err) + ")");
        scroll.append($('<div class="tmdbacc-family__empty">\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0443</div>'));
        self.activity.toggle();
      });
      return self.render();
    };
    this.start = function() {
      Lampa.Controller.add("content", {
        toggle: () => {
          Lampa.Controller.collectionSet(html);
          Lampa.Controller.collectionFocus(resolveFocus(), html);
        },
        left: () => {
          const nav = spatialNav();
          if (nav.canmove("left")) nav.move("left");
          else Lampa.Controller.toggle("menu");
        },
        right: () => {
          const nav = spatialNav();
          if (nav.canmove("right")) nav.move("right");
        },
        up: () => {
          const nav = spatialNav();
          if (nav.canmove("up")) nav.move("up");
          else Lampa.Controller.toggle("head");
        },
        down: () => {
          const nav = spatialNav();
          if (nav.canmove("down")) nav.move("down");
        },
        back: () => {
          Lampa.Activity.backward();
        }
      });
      Lampa.Controller.toggle("content");
    };
    this.pause = function() {
    };
    this.stop = function() {
    };
    this.render = function() {
      return html;
    };
    this.destroy = function() {
      destroyCards();
      scroll.destroy();
      html.remove();
    };
  }
  function FamilyComponentFactory(_object) {
    FamilyComponent.call(this);
  }
  function registerSource() {
    Lampa.Api.sources[SOURCE] = {
      main: sourceMain,
      list: sourceList,
      get: sourceList,
      category: sourceList,
      full(params, oncomplite, onerror) {
        Lampa.Api.sources.tmdb.full(params, oncomplite, onerror);
      },
      clear() {
        libraryCache = null;
        libraryAt = 0;
      }
    };
    patchApiListForWr();
    Lampa.Component.add(
      FAMILY_COMPONENT,
      FamilyComponentFactory
    );
  }
  function openHousehold() {
    const who = watchroomUsername() || "\u0441\u0435\u043C\u044C\u044F";
    Lampa.Activity.push({
      url: "wr:library",
      title: "\u0421\u0435\u043C\u044C\u044F \u2014 " + who,
      component: FAMILY_COMPONENT,
      page: 1
    });
  }
  function openTmdbMain() {
    Lampa.Activity.push({
      url: "",
      title: "TMDB \u2014 " + username(),
      component: "main",
      source: SOURCE,
      page: 1
    });
  }
  function openMenu2() {
    if (watchroomPaired()) return openHousehold();
    if (logged()) return openTmdbMain();
    Lampa.Select.show({
      title: "\u0411\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430 \u0441\u0435\u043C\u044C\u0438",
      items: [
        { title: "\u0412\u043E\u0439\u0442\u0438 \u0432 Watchroom (\u043A\u043E\u0434 \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430)", method: "wr" },
        { title: "\u0412\u043E\u0439\u0442\u0438 \u0432 TMDB (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E, themoviedb.org)", method: "tmdb" }
      ],
      onSelect(item) {
        if (item.method === "wr") {
          promptPairCode(() => {
            if (watchroomPaired()) openHousehold();
          });
          return;
        }
        ensureAuth(openTmdbMain, { force: true });
      },
      onBack() {
        Lampa.Controller.toggle("content");
      }
    });
  }
  function isOurMenuLabel(text) {
    const t = String(text || "").trim();
    return t === "TMDB" || t === "\u0421\u0435\u043C\u044C\u044F" || t.indexOf("TMDB") === 0 || t.indexOf("\u0421\u0435\u043C\u044C\u044F") === 0;
  }
  function scrubAndBindMenu() {
    const label = watchroomPaired() ? "TMDB \xB7 \u0441\u0435\u043C\u044C\u044F" : "TMDB";
    let kept = null;
    const lists = $(".menu .menu__list");
    for (let i = 0; i < lists.length; i++) {
      lists.eq(i).find("li.menu__item").each(function() {
        const el = $(this);
        const text = String(el.find(".menu__text").text() || "").trim();
        if (!isOurMenuLabel(text) && el.attr("data-tmdbacc") !== "menu") return;
        if (kept) {
          el.remove();
          return;
        }
        el.off("hover:enter");
        el.attr("data-tmdbacc", "menu");
        el.find(".menu__text").text(label);
        el.on("hover:enter", () => openMenu2());
        kept = el;
      });
    }
    if (kept) return;
    const list = $(".menu .menu__list").eq(0);
    const item = $(
      '<li class="menu__item selector" data-tmdbacc="menu"><div class="menu__ico">' + ICON + '</div><div class="menu__text">' + label + "</div></li>"
    );
    item.on("hover:enter", () => openMenu2());
    list.append(item);
  }
  function addMenuItem() {
    scrubAndBindMenu();
    setTimeout(scrubAndBindMenu, 1500);
    setTimeout(scrubAndBindMenu, 4e3);
  }

  // src/finished.ts
  var FINISHED2 = 90;
  var handled = {};
  function onUpdate(road) {
    if (!road || !road.card || (road.percent || 0) < FINISHED2 || !logged()) return;
    const match = /^movie_(\d+)$/.exec(road.card);
    if (!match) return;
    const id = Number(match[1]);
    if (handled[id] || !inList("watchlist", "movie", id)) return;
    handled[id] = true;
    request("POST", `/account/${accountId()}/watchlist`, {}, { media_type: "movie", media_id: id, watchlist: false }).then((json) => {
      if (json.success === false) {
        delete handled[id];
        return;
      }
      setFlag("watchlist", "movie", id, false);
      Lampa.Noty.show("TMDB: \u0444\u0438\u043B\u044C\u043C \u0434\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u043D \u2014 \u0443\u0431\u0440\u0430\u043D \u0438\u0437 \xAB\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435\xBB");
    }).catch(() => {
      delete handled[id];
    });
  }
  function initFinished() {
    try {
      const timeline2 = Lampa.Timeline;
      if (timeline2 && timeline2.listener) timeline2.listener.follow("update", (e) => onUpdate(e && e.data && e.data.road));
    } catch (e) {
    }
  }

  // src/settings.ts
  var wrDescEl = null;
  var tmdbDescEl = null;
  function watchroomDescription() {
    if (watchroomPaired()) {
      const who = watchroomUsername() || "\u0441\u0435\u043C\u044C\u044F";
      return "Watchroom: \u0432\u043E\u0448\u043B\u0438 \u043A\u0430\u043A " + who;
    }
    if (wrToken()) return "Watchroom: \u0442\u043E\u043A\u0435\u043D \u0435\u0441\u0442\u044C (\u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u0442\u0430\u0442\u0443\u0441)";
    return "\u041D\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D \u2014 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u043A\u043E\u0434\u043E\u043C \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430";
  }
  function tmdbDescription() {
    return logged() ? "TMDB: \u0432\u043E\u0448\u043B\u0438 \u043A\u0430\u043A " + username() : "TMDB: \u043D\u0435 \u043D\u0443\u0436\u0435\u043D \u0434\u043B\u044F \u0441\u0435\u043C\u044C\u0438 / cast / \u2605";
  }
  function refreshStatus() {
    if (wrDescEl) wrDescEl.text(watchroomDescription());
    if (tmdbDescEl) tmdbDescEl.text(tmdbDescription());
  }
  function addSettings() {
    Lampa.SettingsApi.addComponent({
      component: "tmdbacc",
      name: "Watchroom / TMDB",
      icon: ICON
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      // Lampa Params.update: если values не string, делает values[storedUrl] → TypeError
      param: { name: "tmdbacc_watchroom", type: "input", values: "", default: "https://watchroom-phi.vercel.app" },
      field: {
        name: "URL Watchroom",
        description: "\u041E\u0431\u044B\u0447\u043D\u043E https://watchroom-phi.vercel.app"
      },
      onChange() {
        pullProgress();
        refreshStatus();
      }
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_do_pair", type: "button" },
      field: {
        name: "\u25B6 \u0412\u043E\u0439\u0442\u0438 \u0432 Watchroom \u043A\u043E\u0434\u043E\u043C \u0441 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430",
        description: watchroomDescription()
      },
      onRender(item) {
        wrDescEl = item.find(".settings-param__descr");
        const nameEl = item.find(".settings-param__name");
        if (nameEl.length && nameEl[0]) {
          nameEl[0].style.fontWeight = "700";
          nameEl[0].style.fontSize = "1.05em";
        }
      },
      onChange() {
        promptPairCode(refreshStatus);
      }
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_pair_hint", type: "button" },
      field: {
        name: "\u041A\u0430\u043A \u0432\u043E\u0439\u0442\u0438",
        description: "\u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435: Watchroom \u2192 \u0410\u043A\u043A\u0430\u0443\u043D\u0442 \u2192 \xAB\u041A\u043E\u0434 \u0434\u043B\u044F \u043B\u0430\u043C\u043F\u044B\xBB (Google \u0438\u043B\u0438 TMDB). \u041D\u0430 \u0422\u0412 \u0432\u0432\u0435\u0434\u0438 6 \u0446\u0438\u0444\u0440. TMDB-\u043B\u043E\u0433\u0438\u043D \u043D\u0430 \u0422\u0412 \u0434\u043B\u044F \u0441\u0435\u043C\u044C\u0438 \u043D\u0435 \u043D\u0443\u0436\u0435\u043D."
      },
      onChange() {
        Lampa.Noty.show("\u0422\u0435\u043B\u0435\u0444\u043E\u043D \u2192 \u043A\u043E\u0434 \u2192 \u0422\u0412. Google \u0438\u043B\u0438 TMDB \u2014 \u043D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435.");
      }
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_do_member", type: "button" },
      field: {
        name: "\u041A\u0442\u043E \u0441\u0442\u0430\u0432\u0438\u0442 \u2605",
        description: "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 \u0441\u0435\u043C\u044C\u0438 Watchroom. \u041F\u043E\u0441\u043B\u0435 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0441\u0442\u0430\u0432\u0438\u0442 \u2605 \u043E\u0442 \u0441\u0435\u0431\u044F \u2014 \u0431\u0435\u0437 \u0441\u043C\u0435\u043D\u044B \u043B\u043E\u0433\u0438\u043D\u0430 \u043D\u0430 \u0422\u0412."
      },
      onChange() {
        if (!watchroomReady()) {
          promptPairCode(() => pickMember(refreshStatus));
          return;
        }
        pickMember(refreshStatus);
      }
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_do_wr_logout", type: "button" },
      field: {
        name: "\u0412\u044B\u0439\u0442\u0438 \u0438\u0437 Watchroom",
        description: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0443 \u0422\u0412 (wr_). TMDB-\u0441\u0435\u0441\u0441\u0438\u044F \u041B\u0430\u043C\u043F\u044B \u043D\u0435 \u0442\u0440\u043E\u0433\u0430\u0435\u0442\u0441\u044F."
      },
      onChange() {
        clearWatchroomToken();
        refreshStatus();
        Lampa.Noty.show("Watchroom: \u0422\u0412 \u043E\u0442\u0432\u044F\u0437\u0430\u043D");
      }
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_do_login", type: "button" },
      field: {
        name: "\u0412\u043E\u0439\u0442\u0438 \u0432 TMDB (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)",
        description: tmdbDescription()
      },
      onRender(item) {
        tmdbDescEl = item.find(".settings-param__descr");
      },
      onChange() {
        ensureAuth(refreshStatus, { force: true });
      }
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_do_logout", type: "button" },
      field: {
        name: "\u0412\u044B\u0439\u0442\u0438 \u0438\u0437 TMDB",
        description: "\u0422\u043E\u043B\u044C\u043A\u043E \u0430\u043A\u043A\u0430\u0443\u043D\u0442 TMDB \u0432 \u041B\u0430\u043C\u043F\u0435. Watchroom (\u043A\u043E\u0434) \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F."
      },
      onChange() {
        logout();
        logout2();
        resetSync();
        refreshStatus();
      }
    });
  }

  // src/together.ts
  var COMPONENT = "tmdbacc_together";
  var TASTE_KEY = "tmdbacc_deck_taste";
  var MODE_KEY = "tmdbacc_deck_mode";
  var TIME_KEY = "tmdbacc_deck_time";
  var TIMES = [
    { v: 0, title: "\u0412\u0440\u0435\u043C\u044F \u043B\u044E\u0431\u043E\u0435", short: "" },
    { v: 95, title: "\u0414\u043E 1,5 \u0447\u0430\u0441\u0430", short: "\u0434\u043E 1,5 \u0447" },
    { v: 125, title: "\u0414\u043E 2 \u0447\u0430\u0441\u043E\u0432", short: "\u0434\u043E 2 \u0447" },
    { v: 155, title: "\u0414\u043E 2,5 \u0447\u0430\u0441\u0430", short: "\u0434\u043E 2,5 \u0447" }
  ];
  var keyOf = (it) => it.mediaType + ":" + it.id;
  var clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  var esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var plural = (n, one, few, many) => {
    const a = n % 10;
    const b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
  };
  function runtimeText(it) {
    const m = it.runtime || 0;
    if (it.mediaType === "tv") {
      return [m ? "\u0441\u0435\u0440\u0438\u0438 \u043F\u043E " + m + " \u043C\u0438\u043D" : "", it.seasons ? it.seasons + " " + plural(it.seasons, "\u0441\u0435\u0437\u043E\u043D", "\u0441\u0435\u0437\u043E\u043D\u0430", "\u0441\u0435\u0437\u043E\u043D\u043E\u0432") : ""].filter(Boolean).join(" \xB7 ");
    }
    if (!m) return "";
    return ((m >= 60 ? Math.floor(m / 60) + " \u0447 " : "") + (m % 60 ? m % 60 + " \u043C\u0438\u043D" : "")).trim();
  }
  var firstName = (m) => m ? String(m.name).split(/\s+/)[0] : "";
  function api(path, body, method) {
    const h = watchroomHeaders();
    const url = watchroomBase();
    if (!h || !url) return Promise.reject(new Error("Watchroom \u043D\u0435 \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D"));
    return fetch(url + path, { method: method || (body ? "POST" : "GET"), headers: h, body: body ? JSON.stringify(body) : void 0 }).then(
      (r) => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))
    );
  }
  var GENRE = {
    28: "\u0431\u043E\u0435\u0432\u0438\u043A\u043E\u0432",
    12: "\u043F\u0440\u0438\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0439",
    16: "\u043C\u0443\u043B\u044C\u0442\u0444\u0438\u043B\u044C\u043C\u043E\u0432",
    35: "\u043A\u043E\u043C\u0435\u0434\u0438\u0439",
    80: "\u043A\u0440\u0438\u043C\u0438\u043D\u0430\u043B\u0430",
    99: "\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u043B\u043E\u043A",
    18: "\u0434\u0440\u0430\u043C",
    10751: "\u0441\u0435\u043C\u0435\u0439\u043D\u043E\u0433\u043E",
    14: "\u0444\u044D\u043D\u0442\u0435\u0437\u0438",
    36: "\u0438\u0441\u0442\u043E\u0440\u0438\u0438",
    27: "\u0443\u0436\u0430\u0441\u043E\u0432",
    9648: "\u0434\u0435\u0442\u0435\u043A\u0442\u0438\u0432\u043E\u0432",
    10749: "\u043C\u0435\u043B\u043E\u0434\u0440\u0430\u043C",
    878: "\u0444\u0430\u043D\u0442\u0430\u0441\u0442\u0438\u043A\u0438",
    53: "\u0442\u0440\u0438\u043B\u043B\u0435\u0440\u043E\u0432",
    10752: "\u0432\u043E\u0435\u043D\u043D\u043E\u0433\u043E",
    37: "\u0432\u0435\u0441\u0442\u0435\u0440\u043D\u043E\u0432"
  };
  var BROAD = { 28: 0.7, 12: 0.7, 18: 0.75 };
  function fadeTaste(saved) {
    const src = saved || {};
    const k = Math.pow(0.85, Math.max(0, (Date.now() - (src.at || Date.now())) / 864e5));
    const fade = (m) => {
      const out = {};
      Object.keys(m || {}).forEach((a) => {
        const v = m[a] * k;
        if (Math.abs(v) > 0.05) out[a] = v;
      });
      return out;
    };
    return { g: fade(src.g), l: fade(src.l), s: fade(src.s), at: Number(src.at) || 0 };
  }
  function TogetherComponent() {
    injectStyles();
    const self = this;
    const html = $('<div class="tmdbacc-deck"></div>');
    const tastes = {};
    const localTastes = Lampa.Storage.get(TASTE_KEY, {}) || {};
    let members = [];
    let mode = String(Lampa.Storage.get(MODE_KEY, "pair") || "pair");
    let rec = null;
    const partial = [];
    const votes = /* @__PURE__ */ new Map();
    let extra = [];
    const done = /* @__PURE__ */ new Set();
    const asked = /* @__PURE__ */ new Set();
    let history = [];
    let n = 0;
    let top = "";
    let match = null;
    let busy2 = false;
    let refilling = false;
    let alive = true;
    let maxMin = Number(Lampa.Storage.get(TIME_KEY, 0)) || 0;
    const fitsTime = (it) => !maxMin || !it.runtime || it.runtime <= maxMin;
    const timeShort = () => (TIMES.find((t) => t.v === maxMin) || TIMES[0]).short;
    let toWatch = [];
    let view = "deck";
    let focusKey = "";
    const pair = () => mode === "pair" && members.length > 1;
    const soloId = () => {
      const id = Number(mode) || 0;
      return members.some((m) => m.id === id) ? id : (selectedMember() || members[0] || { id: 0 }).id;
    };
    const voteOf = (it, m) => (votes.get(keyOf(it)) || /* @__PURE__ */ new Map()).get(m) || 0;
    const voters = (it) => {
      if (!pair()) return voteOf(it, soloId()) ? [] : [soloId()];
      return members.map((m) => m.id).filter((id) => !voteOf(it, id));
    };
    const blocked = (it) => pair() ? members.some((m) => voteOf(it, m.id) < 0) : voteOf(it, soloId()) !== 0;
    const tasteOf = (id) => tastes[id] = tastes[id] || fadeTaste(localTastes[id]);
    const active = () => pair() ? members.map((m) => m.id) : [soloId()];
    function combined() {
      const out = { g: {}, l: {}, s: {}, at: 0 };
      active().forEach((id) => {
        const t = tasteOf(id);
        ["g", "l", "s"].forEach(
          (part) => Object.keys(t[part]).forEach((k) => out[part][k] = (out[part][k] || 0) + t[part][k])
        );
      });
      return out;
    }
    let taste = { g: {}, l: {}, s: {}, at: 0 };
    const refreshTaste = () => taste = combined();
    const pushTimers = {};
    function save2(id) {
      const all = {};
      Object.keys(tastes).forEach((k) => all[k] = tastes[Number(k)]);
      Lampa.Storage.set(TASTE_KEY, all);
      clearTimeout(pushTimers[id]);
      pushTimers[id] = setTimeout(() => {
        api("/api/taste", { memberId: id, taste: tastes[id] }, "PUT").catch(() => {
        });
      }, 1500);
    }
    function syncTastes() {
      const ids = members.map((m) => m.id);
      if (!ids.length) return Promise.resolve();
      return api("/api/taste?members=" + ids.join(",")).then((d) => {
        ids.forEach((id) => {
          const remote = d && d.tastes && d.tastes[id];
          if (remote && Number(remote.at) > tasteOf(id).at) tastes[id] = fadeTaste(remote);
        });
        refreshTaste();
      }).catch(() => {
        refreshTaste();
      });
    }
    const bump = (m, k, d) => {
      m[k] = clamp((m[k] || 0) + d, -4, 4);
    };
    function learn(it, vote2, who, sign = 1) {
      const d = vote2 > 0 ? 1 : vote2 < 0 ? -0.6 : 0;
      if (!d || !who) return;
      const t = tasteOf(who);
      const gs = it.genres || [];
      gs.forEach((g) => bump(t.g, String(g), sign * d / Math.sqrt(gs.length)));
      if (it.lang) bump(t.l, it.lang, sign * d * 0.5);
      (it.seeds || []).forEach((s) => bump(t.s, s, sign * d * 0.8));
      if (vote2 > 0) bump(t.s, keyOf(it), sign * 1.5);
      t.at = Date.now();
      save2(who);
      refreshTaste();
    }
    const liveMatch = (it) => Math.round(clamp(74 + 0.6 * ((it.match || 82) - 80) + 14 * Math.tanh(scoreOf(it, 0) / 1.2), 50, 99));
    function scoreOf(it, base) {
      const gs = it.genres || [];
      const tg = gs.length ? gs.reduce((a, g) => a + (taste.g[g] || 0), 0) / Math.sqrt(gs.length) : 0;
      const tl = clamp(taste.l[it.lang || ""] || 0, -1.5, 1.5);
      const ts = (it.seeds || []).reduce((a, s) => a + (taste.s[s] || 0), 0);
      return base + 1.3 * Math.tanh(tg / 2) + 0.25 * tl + 0.7 * Math.tanh(ts / 1.5);
    }
    const stem = (it) => String(it.title || "").toLowerCase().replace(/[^a-zа-яё0-9 ]/gi, " ").trim().split(/\s+/)[0].slice(0, 7);
    function repeatPenalty(it, recent) {
      const g = (it.genres || [])[0];
      const st = stem(it);
      let p = 0;
      recent.slice(-2).forEach((r) => {
        if ((r.genres || [])[0] === g) p += 0.35;
      });
      if (st.length >= 4 && recent.some((r) => stem(r) === st)) p += 1.2;
      const last2 = recent.slice(-2);
      if ((it.likes || []).length && last2.some((r) => (r.likes || []).length)) p += 2;
      if (it._at != null && last2.length === 2 && last2.every((r) => r._at != null)) p += 1.4;
      return p;
    }
    function deck() {
      const seen2 = /* @__PURE__ */ new Set();
      const pool = [];
      const add = (it) => {
        if (!it || !it.id) return;
        const k = keyOf(it);
        if (seen2.has(k) || done.has(k) || blocked(it) || !voters(it).length || !fitsTime(it)) return;
        seen2.add(k);
        pool.push(it);
      };
      partial.forEach(add);
      extra.forEach(add);
      if (rec) {
        (rec.top || []).forEach(add);
        if (rec.forBoth) rec.forBoth.results.forEach(add);
        (rec.because || []).forEach((b) => b.results.forEach(add));
        if (rec.gems) rec.gems.results.forEach(add);
        if (rec.fresh) rec.fresh.results.forEach(add);
        (rec.discover || []).forEach(add);
      }
      const len = pool.length || 1;
      const scored = pool.map((it, i) => {
        let base = 3 * (1 - i / len);
        if (it._at != null) base = 2.6 - 0.08 * (it._i || 0) - 0.12 * Math.max(0, n - it._at);
        if ((it.likes || []).length) base += 1.2;
        return { it, s: scoreOf(it, base) };
      });
      scored.sort((a, b) => b.s - a.s);
      const loved = (it) => (it.genres || []).some((g) => (taste.g[g] || 0) > 0.4);
      const shown = history.slice(-4).map((h) => h.it);
      const out = [];
      while (scored.length && out.length < 12) {
        const recent = shown.concat(out).slice(-4);
        let pick2 = 0;
        if ((n + out.length) % 6 === 5) {
          const j = scored.findIndex((x) => !loved(x.it) && !(x.it.likes || []).length);
          if (j >= 0) pick2 = j;
        } else {
          let best = -Infinity;
          for (let i = 0; i < Math.min(scored.length, 14); i++) {
            const s = scored[i].s - repeatPenalty(scored[i].it, recent);
            if (s > best) {
              best = s;
              pick2 = i;
            }
          }
        }
        out.push(scored.splice(pick2, 1)[0].it);
      }
      const pin = out.findIndex((it) => keyOf(it) === top);
      if (pin > 0) out.unshift(out.splice(pin, 1)[0]);
      else if (pin < 0 && top) {
        const was = pool.find((it) => keyOf(it) === top);
        if (was) out.unshift(was);
      }
      top = out.length ? keyOf(out[0]) : "";
      return out;
    }
    function tasteLine() {
      const ent = Object.keys(taste.g).filter((g) => GENRE[g]).map((g) => ({ g, w: taste.g[g] * (BROAD[g] || 1) }));
      const up = ent.filter((e) => e.w >= 0.9).sort((a, b) => b.w - a.w).slice(0, 2).map((e) => GENRE[e.g]);
      const down = ent.filter((e) => e.w <= -0.7).sort((a, b) => a.w - b.w).slice(0, 2).map((e) => GENRE[e.g]);
      const parts = [];
      if (up.length) parts.push("\u0431\u043E\u043B\u044C\u0448\u0435 " + up.join(" \u0438 "));
      if (down.length) parts.push("\u043C\u0435\u043D\u044C\u0448\u0435 " + down.join(" \u0438 "));
      return parts.join(" \xB7 ");
    }
    const setVote = (k, who, v) => {
      if (!votes.has(k)) votes.set(k, /* @__PURE__ */ new Map());
      votes.get(k).set(who, v);
    };
    function loadSwipes() {
      const ids = members.length ? members.map((m) => m.id) : [0];
      return Promise.all(ids.map((id) => api("/api/swipes" + (id ? "?memberId=" + id : "")).catch(() => null))).then((list) => {
        if (list.every((d) => !d)) return;
        votes.clear();
        partial.length = 0;
        list.forEach((d, i) => {
          if (!d) return;
          const mid = ids[i];
          (d.mine || []).forEach((v) => setVote(v.mediaType + ":" + v.id, mid, Number(v.vote)));
          (d.othersLike || []).forEach((it) => {
            if (!partial.some((x) => keyOf(x) === keyOf(it))) partial.push(it);
            (it.likes || []).forEach((who) => setVote(keyOf(it), who, 1));
          });
        });
        history.forEach((h) => setVote(keyOf(h.it), h.member, h.vote));
        const withPick = list.find((d) => d && d.toWatch);
        if (withPick) toWatch = withPick.toWatch || [];
      });
    }
    function loadRec(shuffle) {
      return api("/api/recommend?hideListed=1" + (shuffle ? "&shuffle=" + shuffle : "") + (maxMin ? "&maxMin=" + maxMin : "")).then((d) => {
        rec = d;
      });
    }
    function moreLike(it) {
      const k = keyOf(it);
      if (asked.has(k)) return;
      asked.add(k);
      api("/api/swipe/more?type=" + it.mediaType + "&id=" + it.id + (maxMin ? "&maxMin=" + maxMin : "")).then((d) => {
        if (!alive || !history.some((h) => h.vote > 0 && keyOf(h.it) === k)) return;
        const have = new Set(extra.map(keyOf));
        const add = (d.results || []).filter((x) => !have.has(keyOf(x))).map((x, i) => __spreadProps(__spreadValues({}, x), { _at: n, _i: i }));
        extra = add.concat(extra).slice(0, 80);
      }).catch(() => {
      });
    }
    let paused = false;
    let pollTimer = null;
    const matched = /* @__PURE__ */ new Set();
    function allLiked() {
      const out = [];
      if (members.length < 2) return out;
      votes.forEach((mv, k) => {
        if (members.every((m) => mv.get(m.id) === 1)) out.push(k);
      });
      return out;
    }
    function signature() {
      if (match) return "match:" + keyOf(match);
      if (view === "pick") return "pick:" + toWatch.map(keyOf).join(",");
      const it = deck()[0];
      if (!it) return "empty";
      return keyOf(it) + "|" + voters(it).join(",") + "|" + members.filter((m) => voteOf(it, m.id) > 0).map((m) => m.id).join(",");
    }
    function poll() {
      if (!alive || paused || busy2 || match) return;
      const before = signature();
      const seenBefore = partial.concat(extra, history.map((h) => h.it));
      loadSwipes().then(() => {
        if (!alive || paused || busy2) return;
        const fresh = allLiked().filter((k) => !matched.has(k));
        fresh.forEach((k) => matched.add(k));
        const known = seenBefore.concat(partial, rec ? (rec.top || []).concat(rec.discover || []) : []);
        const hit = fresh.map((k) => known.find((it) => keyOf(it) === k)).filter(Boolean)[0];
        if (hit && !match) match = hit;
        if (signature() !== before) paint();
      }).catch(() => {
      });
    }
    function vote(v) {
      if (busy2 || match) return;
      const it = deck()[0];
      if (!it) return;
      const who = voters(it)[0];
      if (!who) return;
      busy2 = true;
      const k = keyOf(it);
      if (!votes.has(k)) votes.set(k, /* @__PURE__ */ new Map());
      votes.get(k).set(who, v);
      history.push({ it, member: who, vote: v });
      n++;
      learn(it, v, who);
      if (v > 0) moreLike(it);
      const allYes = v > 0 && !voters(it).length;
      const last = v < 0 || !voters(it).length;
      html.find(".tmdbacc-deck__poster").addClass(last ? v > 0 ? "is-yes" : "is-no" : "is-pass");
      api("/api/swipe", {
        memberId: who,
        mediaType: it.mediaType,
        tmdbId: it.id,
        vote: v,
        title: it.title,
        posterPath: it.posterPath || "",
        year: it.year || "",
        genres: it.genres || []
      }).then((d) => {
        if (d && d.match && !match && !matched.has(keyOf(it))) {
          matched.add(keyOf(it));
          match = it;
          paint();
        }
      }).catch(() => Lampa.Noty.show("Watchroom: \u0433\u043E\u043B\u043E\u0441 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u0441\u044F \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0441\u0435\u0442\u044C"));
      setTimeout(() => {
        busy2 = false;
        if (!alive) return;
        if (v < 0 || !voters(it).length) done.add(k);
        if (allYes && pair()) match = it;
        if (allYes) matched.add(k);
        if (deck().length < 5 && !refilling) {
          refilling = true;
          loadRec(String(Date.now())).catch(() => {
          }).then(() => {
            refilling = false;
            if (alive) paint();
          });
        }
        paint();
      }, 260);
    }
    function undo() {
      const last = history.pop();
      if (!last) return Lampa.Noty.show("\u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0442\u044C \u043D\u0435\u0447\u0435\u0433\u043E");
      const k = keyOf(last.it);
      const mv = votes.get(k);
      if (mv) mv.delete(last.member);
      done.delete(k);
      learn(last.it, last.vote, last.member, -1);
      n = Math.max(0, n - 1);
      if (last.vote > 0) extra = extra.filter((x) => (x.seeds || []).indexOf(k) < 0);
      top = k;
      match = null;
      api("/api/swipe", { memberId: last.member, mediaType: last.it.mediaType, tmdbId: last.it.id, vote: 0 }).catch(() => {
      });
      paint();
    }
    function seen() {
      const it = deck()[0];
      if (!it) return;
      done.add(keyOf(it));
      api("/api/recommend/hide", { mediaType: it.mediaType, tmdbId: it.id }).catch(() => {
      });
      Lampa.Noty.show("\xAB" + it.title + "\xBB \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u043C \u2014 \u043E\u0446\u0435\u043D\u0438\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435");
      paint();
    }
    function openFull(it) {
      Lampa.Activity.push({
        url: "",
        component: "full",
        id: it.id,
        method: it.mediaType,
        card: { id: it.id, title: it.title, name: it.mediaType === "tv" ? it.title : void 0, poster_path: it.posterPath, source: "tmdb" },
        source: "tmdb"
      });
    }
    function menu() {
      const items = [{ title: "\u0412\u0435\u0440\u043D\u0443\u0442\u044C \u043F\u0440\u043E\u0448\u043B\u0443\u044E", act: "undo" }];
      if (members.length > 1) {
        items.push({ title: (pair() ? "\u25CF " : "") + "\u0413\u043E\u043B\u043E\u0441\u0443\u0435\u043C \u0432\u0434\u0432\u043E\u0451\u043C", act: "mode", v: "pair" });
        members.forEach((m) => items.push({ title: (!pair() && soloId() === m.id ? "\u25CF " : "") + "\u0422\u043E\u043B\u044C\u043A\u043E " + m.name, act: "mode", v: String(m.id) }));
      }
      if (toWatch.length) items.unshift({ title: "\u041D\u0430\u0448\u0438 \u043C\u044D\u0442\u0447\u0438 \u2014 \u0447\u0442\u043E \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u043C (" + toWatch.length + ")", act: "pick" });
      TIMES.forEach((t) => items.push({ title: (t.v === maxMin ? "\u25CF " : "") + t.title, act: "time", v: String(t.v) }));
      items.push({ title: "\u041D\u0430\u0447\u0430\u0442\u044C \u043F\u043E\u0434\u0431\u043E\u0440 \u0437\u0430\u043D\u043E\u0432\u043E", act: "reset" });
      Lampa.Select.show({
        title: "\u0412\u043C\u0435\u0441\u0442\u0435",
        items,
        onSelect(item) {
          if (item.act === "undo") undo();
          if (item.act === "pick") view = "pick";
          if (item.act === "time") {
            maxMin = Number(item.v) || 0;
            Lampa.Storage.set(TIME_KEY, maxMin);
            top = "";
            refilling = true;
            loadRec().catch(() => {
            }).then(() => {
              refilling = false;
              if (alive) paint();
            });
          }
          if (item.act === "mode") {
            mode = String(item.v);
            Lampa.Storage.set(MODE_KEY, mode);
            top = "";
          }
          refreshTaste();
          if (item.act === "reset") {
            active().forEach((id) => {
              tastes[id] = { g: {}, l: {}, s: {}, at: Date.now() };
              save2(id);
            });
            extra = [];
            top = "";
            Lampa.Noty.show("\u041D\u0430\u0447\u0430\u043B\u0438 \u043F\u043E\u0434\u0431\u043E\u0440 \u0437\u0430\u043D\u043E\u0432\u043E");
          }
          Lampa.Controller.toggle("content");
          paint();
        },
        onBack() {
          Lampa.Controller.toggle("content");
        }
      });
    }
    const poster = (it, size) => it.posterPath ? "https://image.tmdb.org/t/p/" + size + it.posterPath : "";
    const member = (id) => members.find((m) => m.id === id);
    const colorOf = (id) => ["#5ac8fa", "#ff5e7e", "#ffd60a", "#7bed9f"][Math.max(0, members.findIndex((m) => m.id === id)) % 4];
    function paint() {
      var _a;
      if (!alive) return;
      if (match) return paintMatch(match);
      if (view === "pick") return paintPick();
      const list = deck();
      const it = list[0];
      const line = tasteLine();
      if (!it) {
        html.html(
          '<div class="tmdbacc-deck__empty"><div class="tmdbacc-deck__empty-title">' + (refilling || !rec ? "\u041F\u043E\u0434\u0431\u0438\u0440\u0430\u0435\u043C \u0438\u0434\u0435\u0438\u2026" : "\u041A\u043E\u043B\u043E\u0434\u0430 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0430\u0441\u044C") + '</div><div class="tmdbacc-deck__empty-text">' + (refilling || !rec ? "" : "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u2191 \u2014 \xAB\u041D\u0430\u0447\u0430\u0442\u044C \u043F\u043E\u0434\u0431\u043E\u0440 \u0437\u0430\u043D\u043E\u0432\u043E\xBB \u0438\u043B\u0438 \u0437\u0430\u0439\u0434\u0438\u0442\u0435 \u043F\u043E\u0437\u0436\u0435") + '</div><div class="tmdbacc-deck__focus selector"></div></div>'
        );
        return focus();
      }
      const who = voters(it)[0];
      const wanted = members.filter((m) => voteOf(it, m.id) > 0).map((m) => firstName(m));
      const meta = [it.year, it.mediaType === "tv" ? "\u0421\u0435\u0440\u0438\u0430\u043B" : "\u0424\u0438\u043B\u044C\u043C", runtimeText(it), it.vote ? "\u2605 " + it.vote.toFixed(1) : ""].filter(Boolean).join(" \xB7 ");
      const next = list[1];
      Lampa.Background.change(poster(it, "w300"));
      html.html(
        '<div class="tmdbacc-deck__stage"><div class="tmdbacc-deck__poster selector">' + (poster(it, "w500") ? '<img src="' + poster(it, "w500") + '" alt="">' : "<span>" + esc(it.title.slice(0, 1)) + "</span>") + '<i class="tmdbacc-deck__stamp tmdbacc-deck__stamp--yes">\u0425\u041E\u0427\u0423</i><i class="tmdbacc-deck__stamp tmdbacc-deck__stamp--no">\u041D\u0415\u0422</i></div><div class="tmdbacc-deck__info">' + (pair() && who ? '<div class="tmdbacc-deck__who" style="--who:' + colorOf(who) + '">\u0413\u043E\u043B\u043E\u0441\u0443\u0435\u0442 ' + esc(((_a = member(who)) == null ? void 0 : _a.name) || "") + "</div>" : "") + (wanted.length ? '<div class="tmdbacc-deck__want">' + ICON_HEART + esc(wanted.join(" \u0438 ")) + " \u2014 \u0445\u043E\u0447\u0435\u0442</div>" : "") + '<div class="tmdbacc-deck__title">' + esc(it.title) + '</div><div class="tmdbacc-deck__meta"><b>' + liveMatch(it) + "%</b>" + esc(meta) + "</div>" + (it.why ? '<div class="tmdbacc-deck__why">' + esc(it.why) + "</div>" : "") + (line || maxMin ? '<div class="tmdbacc-deck__taste">' + [maxMin ? "\u0412\u0435\u0447\u0435\u0440 " + timeShort() : "", line ? "\u043F\u043E\u0434\u0431\u0438\u0440\u0430\u044E: " + line : ""].filter(Boolean).map(esc).join(" \xB7 ") + "</div>" : "") + (next ? '<div class="tmdbacc-deck__next">\u0414\u0430\u043B\u044C\u0448\u0435: ' + esc(next.title) + "</div>" : "") + '</div></div><div class="tmdbacc-deck__keys"><span><kbd>\u2190</kbd>\u041D\u0435\u0442</span><span><kbd>\u2192</kbd>\u0425\u043E\u0447\u0443</span><span><kbd>OK</kbd>\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u0435\u0435</span><span><kbd>\u2193</kbd>\u0423\u0436\u0435 \u0441\u043C\u043E\u0442\u0440\u0435\u043B\u0438</span><span><kbd>\u2191</kbd>\u041C\u0435\u043D\u044E</span></div>'
      );
      html.find(".tmdbacc-deck__poster").on("hover:enter", () => openFull(it));
      focus();
    }
    function paintMatch(it) {
      html.html(
        '<div class="tmdbacc-deck__match"><div class="tmdbacc-deck__match-title">\u041C\u044D\u0442\u0447!</div>' + (poster(it, "w342") ? '<img class="tmdbacc-deck__match-poster" src="' + poster(it, "w342") + '" alt="">' : "") + '<div class="tmdbacc-deck__match-text">' + (members.length > 1 ? "\u0412\u044B \u043E\u0431\u0430 \u0445\u043E\u0442\u0438\u0442\u0435" : "\u0425\u043E\u0442\u0438\u0442\u0435") + " \xAB" + esc(it.title) + '\xBB. \u0423\u0436\u0435 \u0432 \xAB\u041F\u043E\u0437\u0436\u0435\xBB.</div><div class="tmdbacc-deck__match-go selector">\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C</div><div class="tmdbacc-deck__match-hint"><kbd>\u2192</kbd> \u0432\u044B\u0431\u0438\u0440\u0430\u0442\u044C \u0434\u0430\u043B\u044C\u0448\u0435</div></div>'
      );
      html.find(".tmdbacc-deck__match-go").on("hover:enter", () => {
        match = null;
        openFull(it);
      });
      focus();
    }
    function paintPick() {
      const rankOf = (it) => (it.started ? 100 : 0) + liveMatch(it) + (it.vote || 0) / 100;
      const list = toWatch.filter(fitsTime).sort((a, b) => rankOf(b) - rankOf(a));
      if (!list.length) {
        if (toWatch.length) Lampa.Noty.show("\u041D\u0438 \u043E\u0434\u0438\u043D \u043C\u044D\u0442\u0447 \u043D\u0435 \u0432\u043B\u0435\u0437\u0430\u0435\u0442 \u0432 \xAB" + timeShort() + "\xBB \u2014 \u0432\u044B\u0431\u0438\u0440\u0430\u0435\u043C \u043D\u043E\u0432\u043E\u0435");
        view = "deck";
        return paint();
      }
      Lampa.Background.change(poster(list[0], "w300"));
      const tile = (it, i) => {
        const st = it.started;
        const startedText = st ? it.mediaType === "tv" && st.episode ? "\u041D\u0430\u0447\u0430\u043B\u0438 \xB7 S" + (st.season || 1) + "E" + st.episode : "\u041D\u0430\u0447\u0430\u043B\u0438 \xB7 " + st.percent + "%" : "";
        return '<div class="tmdbacc-pick__tile selector" data-key="' + keyOf(it) + '"><div class="tmdbacc-pick__poster">' + (poster(it, "w342") ? '<img src="' + poster(it, "w342") + '" alt="">' : "<span>" + esc(it.title.slice(0, 1)) + "</span>") + (i === 0 ? '<i class="tmdbacc-pick__best">' + (it.started ? "\u0414\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C" : "\u041B\u0443\u0447\u0448\u0435 \u0432\u0441\u0435\u0433\u043E \u0441\u0435\u0439\u0447\u0430\u0441") + "</i>" : "") + '</div><div class="tmdbacc-pick__name">' + esc(it.title) + '</div><div class="tmdbacc-pick__meta"><b>' + liveMatch(it) + "%</b>" + esc(runtimeText(it) || (it.mediaType === "tv" ? "\u0421\u0435\u0440\u0438\u0430\u043B" : "\u0424\u0438\u043B\u044C\u043C")) + "</div>" + (startedText ? '<div class="tmdbacc-pick__started">' + esc(startedText) + "</div>" : "") + "</div>";
      };
      html.html(
        '<div class="tmdbacc-pick"><div class="tmdbacc-pick__title">\u0423 \u0432\u0430\u0441 ' + list.length + " " + plural(list.length, "\u043C\u044D\u0442\u0447", "\u043C\u044D\u0442\u0447\u0430", "\u043C\u044D\u0442\u0447\u0435\u0439") + ' \u2014 \u0447\u0442\u043E \u0432\u043A\u043B\u044E\u0447\u0430\u0435\u043C?</div><div class="tmdbacc-pick__sub">\u042D\u0442\u043E \u0432\u044B \u043E\u0431\u0430 \u0445\u043E\u0442\u0435\u043B\u0438 \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C' + (maxMin ? " \u2014 \u0438 \u044D\u0442\u043E \u0432\u043B\u0435\u0437\u0430\u0435\u0442 \u0432 \u0432\u0435\u0447\u0435\u0440 " + timeShort() : "") + '. OK \u2014 \u043E\u0442\u043A\u0440\u044B\u0442\u044C, \u2193 \u2014 \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0447\u0442\u043E-\u0442\u043E \u043D\u043E\u0432\u043E\u0435, \u2191 \u2014 \u0432\u0440\u0435\u043C\u044F \u0438 \u0434\u0440\u0443\u0433\u043E\u0435.</div><div class="tmdbacc-pick__row">' + list.map(tile).join("") + '</div><div class="tmdbacc-pick__more selector" data-key="more">\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043D\u043E\u0432\u043E\u0435 \u2014 \u0441\u0432\u0430\u0439\u043F\u044B</div></div>'
      );
      const row = html.find(".tmdbacc-pick__row")[0];
      html.find(".tmdbacc-pick__tile").each(function() {
        const el = this;
        const it = list.find((x) => keyOf(x) === el.getAttribute("data-key"));
        $(el).on("hover:enter", () => it && openFull(it));
        $(el).on("hover:focus", () => {
          focusKey = el.getAttribute("data-key") || "";
          html.find(".tmdbacc-pick__tile.last-focus").removeClass("last-focus");
          $(el).addClass("last-focus");
          if (row) row.scrollLeft = Math.max(0, el.offsetLeft - row.clientWidth / 2 + el.offsetWidth / 2);
          if (it) Lampa.Background.change(poster(it, "w300"));
        });
      });
      html.find(".tmdbacc-pick__more").on("hover:enter", () => {
        view = "deck";
        focusKey = "";
        paint();
      });
      html.find(".tmdbacc-pick__more").on("hover:focus", () => focusKey = "more");
      focus();
    }
    function focus() {
      Lampa.Controller.collectionSet(html);
      const keep = focusKey ? html.find('[data-key="' + focusKey + '"]')[0] : null;
      Lampa.Controller.collectionFocus(keep || html.find(".selector")[0] || false, html);
    }
    const nav = () => globalThis.Navigator;
    const move = (d) => {
      const n2 = nav();
      if (n2 && n2.canmove(d)) n2.move(d);
    };
    this.create = function() {
      self.activity.loader(true);
      pullMembers();
      members = membersCached();
      loadSwipes().then(() => {
        allLiked().forEach((k) => matched.add(k));
        return syncTastes();
      }).then(() => loadRec()).catch((err) => Lampa.Noty.show("Watchroom: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0434\u0435\u0438 (" + String(err) + ")")).then(() => {
        self.activity.loader(false);
        if (toWatch.length && members.length > 1) view = "pick";
        paint();
        self.activity.toggle();
        pollTimer = setInterval(poll, 5e3);
      });
      return html;
    };
    this.start = function() {
      Lampa.Controller.add("content", {
        toggle: () => focus(),
        left: () => {
          if (match) return;
          if (view === "pick") return move("left");
          vote(-1);
        },
        right: () => {
          if (match) {
            match = null;
            return paint();
          }
          if (view === "pick") return move("right");
          vote(1);
        },
        down: () => {
          if (match) return;
          if (view === "pick") return Lampa.Controller.collectionFocus(html.find(".tmdbacc-pick__more")[0] || false, html);
          seen();
        },
        up: () => {
          if (!match && view === "pick") {
            if (focusKey === "more") {
              const back = html.find(".tmdbacc-pick__tile.last-focus")[0] || html.find(".tmdbacc-pick__tile")[0];
              return Lampa.Controller.collectionFocus(back || false, html);
            }
            return menu();
          }
          menu();
        },
        back: () => {
          if (match) {
            match = null;
            return paint();
          }
          if (view === "deck" && toWatch.length && members.length > 1) {
            view = "pick";
            return paint();
          }
          Lampa.Activity.backward();
        }
      });
      Lampa.Controller.toggle("content");
      if (paused) {
        paused = false;
        poll();
      }
    };
    this.pause = function() {
      paused = true;
    };
    this.stop = function() {
    };
    this.render = function() {
      return html;
    };
    this.destroy = function() {
      alive = false;
      if (pollTimer) clearInterval(pollTimer);
      html.remove();
    };
  }
  function TogetherFactory() {
    TogetherComponent.call(this);
  }
  function openTogether() {
    Lampa.Activity.push({ url: "", title: "\u0412\u043C\u0435\u0441\u0442\u0435", component: COMPONENT, page: 1 });
  }
  function ensureMenu() {
    if (!watchroomPaired()) return;
    const list = $(".menu .menu__list").eq(0);
    if (!list.length || list.find('[data-tmdbacc="together"]').length) return;
    const item = $(
      '<li class="menu__item selector" data-tmdbacc="together"><div class="menu__ico">' + ICON_HEART + '</div><div class="menu__text">\u0412\u043C\u0435\u0441\u0442\u0435</div></li>'
    );
    item.on("hover:enter", () => openTogether());
    const ours = list.find('[data-tmdbacc="menu"]');
    if (ours.length) ours.after(item);
    else list.append(item);
  }
  function initTogether() {
    Lampa.Component.add(COMPONENT, TogetherFactory);
    ensureMenu();
    setTimeout(ensureMenu, 1600);
    setTimeout(ensureMenu, 4200);
  }

  // src/index.ts
  function startPlugin() {
    window.tmdbacc_ready = true;
    registerSource();
    addSettings();
    addMenuItem();
    initCardButton();
    initBadges();
    initContinue();
    initFinished();
    initWatchroom();
    initCast();
    initTogether();
    syncAll();
  }
  if (!window.tmdbacc_ready) {
    if (window.appready) startPlugin();
    else {
      Lampa.Listener.follow("app", (e) => {
        if (e.type === "ready") startPlugin();
      });
    }
  }
})();

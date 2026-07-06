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
      "<style>.tmdbacc-vote{position:absolute;left:0.3em;bottom:0.3em;background:rgba(0,0,0,0.5);color:#f5c518;font-size:1.3em;font-weight:700;padding:0.2em 0.5em;border-radius:1em;z-index:1}.tmdbacc-badge{position:absolute;top:0.5em;left:0.5em;display:flex;z-index:2}.tmdbacc-badge__chip{background:rgba(0,0,0,0.9);border-radius:0.4em;padding:0.3em 0.5em;font-size:1.05em;font-weight:700;color:#fff;display:flex;align-items:center;margin-right:0.35em;box-shadow:0 0.1em 0.5em rgba(0,0,0,0.6)}.tmdbacc-badge__chip svg{width:1.1em;height:1.1em;fill:currentColor}.tmdbacc-badge__chip--fav{color:#ff6b81}.tmdbacc-badge__chip--watch{color:#7bed9f}.tmdbacc-menu{padding:0.3em 0 0.6em}.tmdbacc-menu__tiles{display:flex}.tmdbacc-tile{flex:1;margin:0 0.35em;background:rgba(255,255,255,0.06);border-radius:0.9em;padding:1.3em 0.6em;text-align:center;border:0.15em solid transparent}.tmdbacc-tile svg{width:2.4em;height:2.4em;fill:none;stroke:currentColor;stroke-width:1.7}.tmdbacc-tile__name{margin-top:0.7em;font-weight:600;font-size:1.05em}.tmdbacc-tile__status{margin-top:0.25em;font-size:0.85em;opacity:0.65}.tmdbacc-tile--active svg{fill:currentColor}.tmdbacc-tile--watch.tmdbacc-tile--active{color:#7bed9f}.tmdbacc-tile--fav.tmdbacc-tile--active{color:#ff6b81}.tmdbacc-tile--rate.tmdbacc-tile--active{color:#f5c518}.tmdbacc-tile.focus{background:#fff;color:#000;border-color:#fff}.tmdbacc-menu__wide{display:flex;align-items:center;justify-content:center;margin:0.8em 0.35em 0;background:rgba(255,255,255,0.06);border-radius:0.9em;padding:0.9em}.tmdbacc-menu__wide svg{width:1.4em;height:1.4em;fill:none;stroke:currentColor;stroke-width:1.7;margin-right:0.6em}.tmdbacc-menu__wide.focus{background:#fff;color:#000}.view--tmdbacc.tmdbacc--rated path{fill:#f5c518;stroke:#f5c518}.view--tmdbacc.tmdbacc--rated span{color:#f5c518;font-weight:700}.view--tmdbacc.tmdbacc--rated.focus span{color:inherit}.full-start-new__buttons .view--tmdbacc.tmdbacc--rated:not(.focus) span{display:inline}.tmdbacc-rate{text-align:center;padding:1.2em 0 2em}.tmdbacc-rate__big{position:relative;display:inline-block;width:7em;height:7em;filter:drop-shadow(0 0.3em 1em rgba(87,153,239,0.45))}.tmdbacc-rate__big svg{width:100%;height:100%;fill:#5799ef}.tmdbacc-rate__big span{position:absolute;top:54%;left:50%;transform:translate(-50%,-50%);font-size:2.3em;font-weight:800;color:#fff}.tmdbacc-rate__label{color:#f5c518;font-weight:700;letter-spacing:0.3em;font-size:1.05em;margin:0.8em 0 0.3em}.tmdbacc-rate__title{font-size:1.9em;font-weight:600;margin-bottom:1em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tmdbacc-rate__stars{display:flex;justify-content:center;padding:0.5em 0}.tmdbacc-rate__star{width:3.8em;height:3.8em;padding:0.35em;margin:0 0.15em;border-radius:0.4em;transition:transform 0.12s}.tmdbacc-rate__star svg{width:100%;height:100%;fill:none;stroke:#8a8a8a;stroke-width:1.4}.tmdbacc-rate__star.filled svg{fill:#f5c518;stroke:#f5c518}.tmdbacc-rate__star.focus{transform:scale(1.4)}.tmdbacc-rate__star.focus svg{stroke:#fff;filter:drop-shadow(0 0 0.4em rgba(245,197,24,0.8))}.tmdbacc-rate__star.filled.focus svg{stroke:#f5c518}.tmdbacc-rate__delete{display:inline-block;margin-top:2em;padding:0.8em 2em;border-radius:0.5em;background:rgba(255,255,255,0.12);font-size:1.1em}.tmdbacc-rate__delete.focus{background:#fff;color:#000}</style>"
    );
  }

  // src/badges.ts
  var HEART = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  var BOOKMARK = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>';
  function decorate(card) {
    if (!logged() || !card || !card.data || !card.data.id) return;
    const el = card.render();
    if (!el || !el.length) return;
    const view = el.find(".card__view");
    if (!view.length) return;
    el.find(".tmdbacc-badge, .tmdbacc-vote").remove();
    const type = mediaType(card.data);
    const id = card.data.id;
    const rating = getRating(type, id);
    const fav = inList("favorite", type, id);
    const watch = inList("watchlist", type, id);
    if (rating) {
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

  // src/auth.ts
  var POLL_MS = 4e3;
  function ensureAuth(then) {
    if (logged()) return then();
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
      const approveUrl = "https://www.themoviedb.org/authenticate/" + token;
      const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=" + encodeURIComponent(approveUrl);
      let stopped = false;
      const html = $(
        '<div style="text-align:center;padding:1em 0"><img src="' + qrUrl + '" style="width:16em;height:16em;background:#fff;padding:0.7em;border-radius:0.7em"/><div style="margin-top:1.2em;font-size:1.15em">\u041E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439\u0442\u0435 QR-\u043A\u043E\u0434 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u043C,<br>\u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u0432 TMDB \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \xABApprove\xBB</div><div style="margin-top:0.8em;opacity:0.6;font-size:0.85em;word-break:break-all">' + approveUrl + "</div></div>"
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
              then();
            });
          } else {
            setTimeout(poll, POLL_MS);
          }
        }).catch(() => setTimeout(poll, POLL_MS * 2));
      };
      setTimeout(poll, POLL_MS);
    });
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
              then();
            });
          }
        );
      }
    );
  }

  // src/icon.ts
  var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14.9 8.6L22 9.3L16.6 14L18.2 21L12 17.3L5.8 21L7.4 14L2 9.3L9.1 8.6L12 2Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

  // src/rate.ts
  var STAR = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.6 7-6.2-3.7L5.8 21l1.6-7L2 9.3l7.1-.7L12 2z"/></svg>';
  function openRate(movie, rated, onChanged) {
    injectStyles();
    const type = mediaType(movie);
    const title = String(movie.title || movie.name);
    const current = rated ? rated.value : 0;
    const close = () => {
      Lampa.Modal.close();
      Lampa.Controller.toggle("full_start");
    };
    const submit = (val) => {
      close();
      request("POST", `/${type}/${movie.id}/rating`, {}, { value: val }).then((json) => {
        if (json.success === false) return apiError(json);
        Lampa.Noty.show("\u2605 " + val + " \u2014 \xAB" + title + "\xBB");
        setRating(type, movie.id, val);
        if (onChanged) onChanged();
      });
    };
    const removeRating = () => {
      close();
      request("DELETE", `/${type}/${movie.id}/rating`).then((json) => {
        if (json.success === false) return apiError(json);
        Lampa.Noty.show("\u041E\u0446\u0435\u043D\u043A\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0430");
        clearRating(type, movie.id);
        if (onChanged) onChanged();
      });
    };
    const root = $(
      '<div class="tmdbacc-rate"><div class="tmdbacc-rate__big">' + STAR + '<span class="tmdbacc-rate__value">' + (current || "?") + '</span></div><div class="tmdbacc-rate__label">' + (rated ? "\u0412\u0410\u0428\u0410 \u041E\u0426\u0415\u041D\u041A\u0410" : "\u041E\u0426\u0415\u041D\u0418\u0422\u0415") + '</div><div class="tmdbacc-rate__title">' + title + '</div><div class="tmdbacc-rate__stars"></div></div>'
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
    request("GET", `/${type}/${movie.id}/account_states`).then((state2) => {
      show(movie, {
        watchlist: !!state2.watchlist,
        favorite: !!state2.favorite,
        rated: state2.rated && typeof state2.rated === "object" ? state2.rated : null
      }, onChanged);
    }).catch(() => {
      Lampa.Noty.show("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435 TMDB");
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
    const wTile = makeTile("watch", BOOKMARK2, "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435");
    const fTile = makeTile("fav", HEART2, "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435");
    const rTile = makeTile("rate", ICON, "\u041E\u0446\u0435\u043D\u043A\u0430");
    const setTile = (tile, active, status) => {
      if (active) tile.addClass("tmdbacc-tile--active");
      else tile.removeClass("tmdbacc-tile--active");
      tile.find(".tmdbacc-tile__status").text(status);
    };
    const renderStates = () => {
      setTile(wTile, st.watchlist, st.watchlist ? "\u2713 \u0412 \u0441\u043F\u0438\u0441\u043A\u0435" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C");
      setTile(fTile, st.favorite, st.favorite ? "\u2713 \u0412 \u0438\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u043C" : "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C");
      setTile(rTile, !!st.rated, st.rated ? "\u2605 " + st.rated.value : "\u041D\u0435 \u043E\u0446\u0435\u043D\u0435\u043D\u043E");
    };
    const toggle = (kind) => {
      const next = !st[kind];
      st[kind] = next;
      renderStates();
      const body = {
        media_type: mediaType(movie),
        media_id: movie.id,
        [kind]: next
      };
      const revert = () => {
        st[kind] = !next;
        renderStates();
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
      openRate(movie, st.rated, onChanged);
    });
    const listBtn = $(
      '<div class="selector tmdbacc-menu__wide">' + LIST + "<span>\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432 \u0441\u043F\u0438\u0441\u043E\u043A\u2026</span></div>"
    );
    listBtn.on("hover:enter", () => {
      close();
      listsMenu(movie);
    });
    const tiles = $('<div class="tmdbacc-menu__tiles"></div>');
    tiles.append(wTile);
    tiles.append(fTile);
    tiles.append(rTile);
    const root = $('<div class="tmdbacc-menu"></div>');
    root.append(tiles);
    root.append(listBtn);
    renderStates();
    Lampa.Modal.open({
      title,
      html: root,
      size: "medium",
      onBack: close
    });
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
    if (!logged()) return;
    const type = mediaType(movie);
    request("GET", `/${type}/${movie.id}/account_states`).then((state2) => {
      const rated = state2.rated && typeof state2.rated === "object" ? state2.rated : null;
      const label = btn.find("span");
      if (rated) {
        btn.addClass("tmdbacc--rated");
        label.text(String(rated.value));
      } else {
        btn.removeClass("tmdbacc--rated");
        label.text("TMDB");
      }
    }).catch(() => {
    });
  }
  function initCardButton() {
    Lampa.Listener.follow("full", (e) => {
      if (e.type !== "complite") return;
      const render = e.object.activity.render();
      if (render.find(".view--tmdbacc").length) return;
      injectStyles();
      const movie = e.data.movie;
      const btn = $(
        '<div class="full-start__button selector view--tmdbacc">' + ICON + "<span>TMDB</span></div>"
      );
      btn.on("hover:enter", () => ensureAuth(() => openCardMenu(movie, () => refreshButton(btn, movie))));
      const container = render.find(".full-start-new__buttons, .full-start__buttons").first();
      if (container.length) container.append(btn);
      refreshButton(btn, movie);
    });
  }

  // src/catalog.ts
  var SOURCE = "tmdbacc";
  var CATEGORIES = [
    { title: "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u2014 \u0444\u0438\u043B\u044C\u043C\u044B", url: "/account/{account}/watchlist/movies" },
    { title: "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043F\u043E\u0437\u0436\u0435 \u2014 \u0441\u0435\u0440\u0438\u0430\u043B\u044B", url: "/account/{account}/watchlist/tv" },
    { title: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u2014 \u0444\u0438\u043B\u044C\u043C\u044B", url: "/account/{account}/favorite/movies" },
    { title: "\u0418\u0437\u0431\u0440\u0430\u043D\u043D\u043E\u0435 \u2014 \u0441\u0435\u0440\u0438\u0430\u043B\u044B", url: "/account/{account}/favorite/tv" },
    { title: "\u041E\u0446\u0435\u043D\u0451\u043D\u043D\u044B\u0435 \u2014 \u0444\u0438\u043B\u044C\u043C\u044B", url: "/account/{account}/rated/movies" },
    { title: "\u041E\u0446\u0435\u043D\u0451\u043D\u043D\u044B\u0435 \u2014 \u0441\u0435\u0440\u0438\u0430\u043B\u044B", url: "/account/{account}/rated/tv" }
  ];
  function sourceList(params, oncomplite, onerror) {
    const page = params.page || 1;
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
  function sourceMain(_params, oncomplite, onerror) {
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
    const customLines = request("GET", `/account/${accountId()}/lists`, { page: 1 }).then((json) => {
      const lists = (json.results || []).slice(0, 10);
      return Promise.all(lists.map((l) => loadLine(l.name, "/list/" + l.id)));
    }).catch(() => []);
    Promise.all([baseLines, customLines]).then(([base, custom]) => {
      const lines = base.concat(custom).filter(Boolean);
      if (lines.length) oncomplite(lines);
      else onerror(new Error("empty"));
    });
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
      }
    };
  }
  function openMain() {
    Lampa.Activity.push({
      url: "",
      title: "TMDB \u2014 " + username(),
      component: "main",
      source: SOURCE,
      page: 1
    });
  }
  function addMenuItem() {
    const item = $(
      '<li class="menu__item selector"><div class="menu__ico">' + ICON + '</div><div class="menu__text">TMDB</div></li>'
    );
    item.on("hover:enter", () => ensureAuth(openMain));
    $(".menu .menu__list").eq(0).append(item);
  }

  // src/settings.ts
  function addSettings() {
    Lampa.SettingsApi.addComponent({
      component: "tmdbacc",
      name: "TMDB \u0410\u043A\u043A\u0430\u0443\u043D\u0442",
      icon: ICON
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_do_login", type: "button" },
      field: {
        name: "\u0412\u043E\u0439\u0442\u0438",
        description: logged() ? "\u0412\u044B \u0432\u043E\u0448\u043B\u0438 \u043A\u0430\u043A " + username() : "\u041D\u0435 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u043E\u0432\u0430\u043D"
      },
      onChange() {
        ensureAuth(() => {
        });
      }
    });
    Lampa.SettingsApi.addParam({
      component: "tmdbacc",
      param: { name: "tmdbacc_do_logout", type: "button" },
      field: { name: "\u0412\u044B\u0439\u0442\u0438 \u0438\u0437 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430" },
      onChange() {
        logout();
        resetSync();
      }
    });
  }

  // src/index.ts
  function startPlugin() {
    window.tmdbacc_ready = true;
    registerSource();
    addSettings();
    addMenuItem();
    initCardButton();
    initBadges();
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

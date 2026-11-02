/* ============================================================
   觀後問卷提醒（Google 表單）
   ------------------------------------------------------------
   什麼時候跳出：
     1. 看完一集（或看超過一半）後關閉播放視窗
     2. 電腦版：看過影片後，滑鼠移出視窗頂端（準備關分頁或離開）
     3. 看過影片後要關閉／離開網頁：瀏覽器先問「要離開嗎？」，選「留下」就出現問卷邀請
   不會一直打擾：
     ・按「填寫問卷」後就不再出現
     ・按「下次再說」後 3 天內不出現；同一次瀏覽最多出現 1 次
   GoatCounter 會記錄：survey-show（跳出）、survey-open（點開問卷）、survey-later（下次再說）
   ============================================================ */
(function () {
  var FORM = "https://docs.google.com/forms/d/e/1FAIpQLSd9fy-m5bz0PIEAsL12Vx9DavNNP0NS02H3yLhAT_xiMzz2aw/viewform";
  var ENTRY_WATCHED = "207519911";  // 題 5「看過哪幾集」的 entry 編號
  var ENTRY_SRC = "95516846";       // 題 4「從哪裡知道」的 entry 編號
  var SRC_WEB = "影片網站";
  var SNOOZE_DAYS = 3;
  var LABELS = {
    E01: "EP01 一滴血，讀出 DNA 的秘密", E02: "EP02 多一條染色體，會發生什麼事？", E03: "EP03 女生的細胞，為什麼要關掉一條 X？",
    E04: "EP04 煞車變鈍了：Factor V Leiden", E05: "EP05 會越傳越長的 DNA", E06: "EP06 短紙條拼不起來？長讀段定序登場",
    E07: "EP07 抽媽媽的血，看見胎兒的 DNA", E08: "EP08 NIPT 背後的數學：在雜訊裡找多一條", E09: "EP09 PCR：DNA 影印機，一小時印出上億份",
    E10: "EP10 NGS：一次讀幾百萬條 DNA", E11: "EP11 找到突變，就是找到病因嗎？", E12: "EP12 液體活檢：抽血追蹤腫瘤",
    E13: "EP13 DNA 沒變，基因卻被關掉了：甲基化", E14: "EP14 同一顆藥，為什麼不適合每個人？", E15: "EP15 PCR 揪出感染的「敵人」",
    E16: "EP16 CRISPR 診斷：像驗孕棒一樣簡單？"
  };

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function seen() { try { return JSON.parse(ls("seenEps") || "[]"); } catch (e) { return []; } }
  function t(path, title) { if (window.track) window.track(path, title, true); }

  function done() { return ls("survey.done") === "1"; }
  function snoozed() { var s = +(ls("survey.snooze") || 0); return s && Date.now() - s < SNOOZE_DAYS * 864e5; }
  function engaged() { return ss("survey.engaged") === "1" || seen().length > 0; }
  function eligible() { return !done() && !snoozed() && ss("survey.shown") !== "1" && engaged(); }

  function formUrl() {
    var u = FORM + (FORM.indexOf("?") < 0 ? "?" : "&") + "usp=pp_url";
    if (ENTRY_SRC.indexOf("__") < 0) u += "&entry." + ENTRY_SRC + "=" + encodeURIComponent(SRC_WEB);
    if (ENTRY_WATCHED.indexOf("__") < 0) seen().sort().forEach(function (id) {
      if (LABELS[id]) u += "&entry." + ENTRY_WATCHED + "=" + encodeURIComponent(LABELS[id]);
    });
    return u;
  }

  // 只要網站上有影片達到一半，就算「有看」
  var origTrack = window.track;
  window.track = function (path) {
    if (/^(half|done)-E\d\d$/.test(path)) ss("survey.engaged", "1");
    return origTrack.apply(this, arguments);
  };

  var css = "" +
    "#svy{position:fixed;inset:0;z-index:100;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(3,6,12,.72);backdrop-filter:blur(3px)}" +
    "#svy.on{display:flex}" +
    "#svy .box{position:relative;max-width:420px;width:100%;background:var(--bg2,#111a2e);border:1px solid var(--line,#22314f);border-radius:18px;padding:30px 26px 24px;color:var(--ink,#eef2f8);box-shadow:0 20px 60px rgba(0,0,0,.5);animation:svyIn .25s ease-out}" +
    "@keyframes svyIn{from{transform:translateY(16px);opacity:0}to{transform:none;opacity:1}}" +
    "#svy .ic{width:52px;height:52px;border-radius:14px;background:rgba(60,200,180,.15);display:grid;place-items:center;font-size:26px;margin-bottom:14px}" +
    "#svy h3{font-family:var(--serif,serif);font-size:22px;line-height:1.4;margin:0 0 8px}" +
    "#svy p{color:var(--ink2,#a9b4c9);margin:0 0 6px;font-size:15px}" +
    "#svy .meta{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 20px}" +
    "#svy .meta span{font-size:13px;border:1px solid var(--line,#22314f);border-radius:999px;padding:3px 11px;color:var(--ink2,#a9b4c9)}" +
    "#svy .act{display:flex;gap:10px;flex-wrap:wrap}" +
    "#svy .act .btn{flex:1;display:inline-flex;align-items:center;justify-content:center;background:#3cc8b4;color:#06231f;font-weight:700;border:0;border-radius:10px;padding:11px 18px;font-size:15px;text-decoration:none;cursor:pointer;font-family:inherit}" +
    "#svy .act .btn.ghost{background:transparent;color:#eef2f8;border:1px solid #22314f}" +
    "#svy .box{font-family:'Noto Sans TC','PingFang TC','Microsoft JhengHei',system-ui,sans-serif;line-height:1.7}" +
    "#svy .x{position:absolute;top:10px;right:12px;width:36px;height:36px;border-radius:50%;border:0;background:transparent;color:var(--ink2,#a9b4c9);font-size:22px;cursor:pointer}" +
    "#svyTab{position:fixed;left:16px;bottom:16px;z-index:40;display:none;background:var(--teal,#3cc8b4);color:#06231f;font-weight:700;border:0;border-radius:999px;padding:10px 16px;font-size:14px;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.35);font-family:inherit}" +
    "#svyTab.on{display:block}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var box = document.createElement("div");
  box.id = "svy"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "svyT");
  box.innerHTML =
    '<div class="box"><button class="x" aria-label="關閉">×</button>' +
    '<div class="ic">📝</div>' +
    '<h3 id="svyT">看完了嗎？說說你的想法</h3>' +
    '<p>你的回饋會決定下一季要拍哪些主題，也幫助我們把內容講得更清楚。</p>' +
    '<div class="meta"><span>約 3 分鐘</span><span>匿名填答</span><span>已看過的集數會自動勾好</span></div>' +
    '<div class="act"><a class="btn" id="svyGo" target="_blank" rel="noopener">填寫問卷</a>' +
    '<button class="btn ghost" id="svyLater">下次再說</button></div></div>';
  var tab = document.createElement("button");
  tab.id = "svyTab"; tab.textContent = "📝 填寫觀後問卷";

  function mount() { document.body.appendChild(box); document.body.appendChild(tab); refreshTab(); }
  if (document.body) mount(); else document.addEventListener("DOMContentLoaded", mount);

  function refreshTab() { tab.classList.toggle("on", !done() && engaged() && !box.classList.contains("on")); }

  function show(reason, force) {
    if ((!force && !eligible()) || box.classList.contains("on")) return;
    ss("survey.shown", "1");
    document.getElementById("svyGo").href = formUrl();
    box.classList.add("on"); refreshTab();
    t("survey-show", "問卷邀請跳出（" + reason + "）");
    setTimeout(function () { document.getElementById("svyGo").focus(); }, 50);
  }
  function hide() { box.classList.remove("on"); refreshTab(); }
  window.showSurvey = function () { show("手動", true); };

  box.addEventListener("click", function (e) {
    if (e.target.id === "svyGo") { ls("survey.done", "1"); t("survey-open", "點開問卷"); setTimeout(hide, 200); }
    else if (e.target.id === "svyLater" || e.target.classList.contains("x") || e.target === box) {
      ls("survey.snooze", String(Date.now())); t("survey-later", "問卷下次再說"); hide();
    }
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && box.classList.contains("on")) { ls("survey.snooze", String(Date.now())); hide(); } });
  tab.addEventListener("click", function () {
    ls("survey.done", "1"); t("survey-open", "點開問卷（側邊按鈕）");
    window.open(formUrl(), "_blank", "noopener"); refreshTab();
  });

  // 觸發 1：關閉播放視窗（看過一半以上）
  document.addEventListener("DOMContentLoaded", function () {
    var dlg = document.getElementById("dlg");
    if (!dlg) return;
    // 用 open 屬性變化偵測關閉（部分瀏覽器不觸發 dialog 的 close 事件）
    var wasOpen = dlg.open;
    new MutationObserver(function () {
      var nowOpen = dlg.hasAttribute("open");
      if (wasOpen && !nowOpen) {
        refreshTab();
        if (ss("survey.engaged") === "1") setTimeout(function () { show("關閉影片"); }, 400);
      }
      wasOpen = nowOpen;
    }).observe(dlg, { attributes: true, attributeFilter: ["open"] });
  });
  // 觸發 2：電腦版滑鼠移出視窗頂端
  document.addEventListener("mouseout", function (e) {
    if (!e.relatedTarget && e.clientY <= 0) {
      var d = document.getElementById("dlg");
      if (d && d.open) return;
      show("準備離開");
    }
  });
  // 觸發 3：關閉或離開網頁 → 瀏覽器詢問；選「留下」就跳出邀請
  var internal = false;   // 站內換頁（例如點到倫理專區）不算離開
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (a && a.host === location.host && a.target !== "_blank") { internal = true; setTimeout(function () { internal = false; }, 1500); }
  }, true);
  window.addEventListener("beforeunload", function (e) {
    if (internal || !eligible()) return;
    setTimeout(function () { show("取消離開"); }, 600);
    e.preventDefault(); e.returnValue = "";
    return "";
  });
})();

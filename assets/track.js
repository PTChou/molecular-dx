/* ============================================================
   流量追蹤（GoatCounter，免 Cookie、不蒐集個資）
   ------------------------------------------------------------
   1. 到 https://www.goatcounter.com/signup 註冊，取一個代碼，例如 dnakepu
   2. 把下面 GC_CODE 改成你的代碼（只要代碼，不要網址）
   3. GoatCounter 後台 Settings → 勾選
      「Allow adding visitor counts on your website」
      流量儀表板（stats.html）才讀得到各影片數字
   記錄的路徑（後台 Pages 會看到）：
     home            首頁瀏覽
     ethics          倫理專區瀏覽
     ep-E01          點開第 1 集（＝點擊）
     play-E01        第 1 集開始播放（事件）
     half-E01        看到一半（事件）
     done-E01        看完（事件，≥95% 或播放結束）
   ============================================================ */
window.GC_CODE = "";   // ← 填入 GoatCounter 代碼

(function () {
  var q = [];
  var local = /^(localhost|127\.|192\.168\.|\[::1\])/.test(location.hostname) || location.protocol === "file:";
  window.track = function (path, title, isEvent) {
    var hit = { path: path, title: title || path, event: !!isEvent };
    if (local) { console.log("[track]", hit); }
    if (!window.GC_CODE) return;
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count(hit);
    else q.push(hit);
  };
  if (!window.GC_CODE) return;
  window.goatcounter = { no_onload: true, allow_local: false };
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://gc.zgo.at/count.js";
  s.setAttribute("data-goatcounter", "https://" + window.GC_CODE + ".goatcounter.com/count");
  s.onload = function () { while (q.length) window.goatcounter.count(q.shift()); };
  document.head.appendChild(s);
})();

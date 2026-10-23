(function () {
  try {
    var t = localStorage.getItem("__nt_theme") || "dark";
    var a = localStorage.getItem("__nt_accent") || "#e86c2c";
    document.documentElement.dataset.theme = t;
    document.documentElement.style.setProperty("--accent", a);
    document.documentElement.style.setProperty("--accent-2", a + "cc");
    document.documentElement.style.setProperty("--accent-light", a + "cc");
    document.documentElement.style.setProperty("--accent-bg", a + "24");
    document.documentElement.style.setProperty("--accent-subtle", a + "12");
    document.documentElement.style.setProperty("--accent-glow", a + "59");
    var gf = document.getElementById("gfontsLink");
    if (gf) {
      gf.addEventListener("load", function () { gf.media = "all"; });
      if (gf.sheet) gf.media = "all";
    }
  } catch {}
})();

try {
  var a = localStorage.getItem('__nt_accent');
  var t = localStorage.getItem('__nt_theme');
  if (a) {
    var r = document.documentElement;
    r.style.setProperty('--accent', a);
    r.style.setProperty('--accent-2', a + 'cc');
    r.style.setProperty('--accent-bg', a + '20');
    r.style.setProperty('--accent-glow', a + '47');
  }
  if (t) document.documentElement.dataset.theme = t;
} catch (e) {}

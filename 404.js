(function initTheme() {
  const root = document.documentElement;
  let dark = localStorage.getItem("theme") === "dark";
  if (dark) {
    root.setAttribute("data-theme", "dark");
  }
})();

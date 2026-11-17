// Small non-blocking notification. Usage: Toast.show("Added to cart")
const Toast = (() => {
  // Notifications are created on demand and removed after the animation, with no modal alert().
  let container = null;

  function ensureContainer() {
    // A single container can host multiple stacked notifications.
    if (container) return container;
    container = document.createElement("div");
    container.className = "toast-stack";
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    document.body.append(container);
    return container;
  }

  function show(message, type = "success") {
    // requestAnimationFrame lets the browser apply the initial state before the transition.
    const el = document.createElement("div");
    el.className = `toast-item toast-${type}`;
    el.textContent = message;
    ensureContainer().append(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => {
      el.classList.remove("show");
      el.addEventListener("transitionend", () => el.remove(), { once: true });
    }, 2500);
  }

  return { show };
})();

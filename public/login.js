// Shared login widget. Renders into <div id="auth-slot"> on any page.
// Fires "auth-change" on window with detail { loggedIn }.
const Auth = (() => {
  const TOKEN_KEY = "gfuel-token";
  const USER_KEY = "gfuel-user";

  function get(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function set(key, value) {
    try { localStorage.setItem(key, value); } catch { /* storage blocked */ }
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch { /* storage blocked */ }
  }

  function tokenValid(token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  function user() {
    try { return JSON.parse(get(USER_KEY)); } catch { return null; }
  }

  function token() {
    const t = get(TOKEN_KEY);
    return t && user() && tokenValid(t) ? t : null;
  }

  function save(newToken, newUser) {
    set(TOKEN_KEY, newToken);
    set(USER_KEY, JSON.stringify(newUser));
    render();
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { loggedIn: true } }));
  }

  function clear() {
    remove(TOKEN_KEY);
    remove(USER_KEY);
    render();
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { loggedIn: false } }));
  }

  const slot = document.querySelector("#auth-slot");

  function render() {
    if (!slot) return;
    slot.replaceChildren();

    if (token()) {
      const box = document.createElement("div");
      box.className = "login-container d-flex";
      const name = document.createElement("span");
      const u = user();
      name.textContent = `Hi, ${u.firstName || u.email}`;
      const logout = document.createElement("button");
      logout.type = "button";
      logout.className = "btn btn-outline-secondary";
      logout.textContent = "Logout";
      logout.addEventListener("click", clear);
      box.append(name, logout);
      slot.append(box);
      return;
    }

    const form = document.createElement("form");
    form.className = "login-container d-flex";
    form.innerHTML = `
      <h2>Login</h2>
      <input type="email" name="email" class="form-control" placeholder="Email" aria-label="Email" autocomplete="email" required/>
      <input type="password" name="password" class="form-control" placeholder="Password" aria-label="Password" autocomplete="current-password" required/>
      <button type="submit" class="btn btn-outline-success">Login</button>
      <a class="login-forgot small" href="/password/forgot/index.html">Forgot password?</a>
      <span class="login-error text-danger small w-100 text-end" role="alert" hidden></span>`;
    const error = form.querySelector(".login-error");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      error.hidden = true;
      const button = form.querySelector("button");
      button.disabled = true;
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          error.textContent = body.error || "Login failed";
          error.hidden = false;
          return;
        }
        save(body.token, body.user);
      } catch {
        error.textContent = "Cannot reach the server";
        error.hidden = false;
      } finally {
        button.disabled = false;
      }
    });
    slot.append(form);
  }

  render();
  return { token, user, save, clear };
})();

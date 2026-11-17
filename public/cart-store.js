// Shared cart logic. Logged-in users use /api/cart; guests use localStorage.
// Fires "cart-change" on window with the cart as detail:
// { items: [{ productId, name, price, imageUrl, quantity, lineTotal }], totalQuantity, totalPrice }
// Requires login.js (Auth) to be loaded first.
const Cart = (() => {
  // State is shared across pages: a local cart for guests, the API for accounts.
  const GUEST_KEY = "gfuel-cart";
  const MAX_QTY = 99;
  let productsPromise = null;
  let current = { items: [], totalQuantity: 0, totalPrice: 0 };

  function products() {
    // The catalog is cached while the page is open; on error the cache is cleared
    // so that a later retry can redo the request.
    if (!productsPromise) {
      productsPromise = fetch("/api/products").then((r) => {
        if (!r.ok) throw new Error("Could not load products");
        return r.json();
      });
      productsPromise.catch(() => { productsPromise = null; });
    }
    return productsPromise;
  }

  function readGuest() {
    // localStorage may contain corrupt JSON or may be blocked by the browser.
    try { return JSON.parse(localStorage.getItem(GUEST_KEY)) || {}; } catch { return {}; }
  }
  function writeGuest(cart) {
    try { localStorage.setItem(GUEST_KEY, JSON.stringify(cart)); } catch { /* storage blocked */ }
  }

  function round(n) {
    return Math.round(n * 100) / 100;
  }

  async function guestCart() {
    // Enriches local quantities with current catalog data and computes the totals.
    const guest = readGuest();
    const list = await products();
    const items = list
      .filter((p) => guest[p.id] > 0)
      .map((p) => ({
        productId: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl,
        quantity: guest[p.id], lineTotal: round(p.price * guest[p.id]),
      }));
    return {
      items,
      totalQuantity: items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: round(items.reduce((s, i) => s + i.lineTotal, 0)),
    };
  }

  async function api(method, path, body) {
    // All authenticated cart requests go through this function and send the JWT.
    const response = await fetch(`/api/cart${path}`, {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${Auth.token()}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      Auth.clear();
      throw new Error("Your session expired. Please log in again.");
    }
    if (!response.ok) throw new Error(data.error || "Cart request failed");
    return data;
  }

  function publish(cart) {
    // Updates the state and the navbar badges, and notifies open pages.
    current = cart;
    document.querySelectorAll(".cart-count").forEach((el) => { el.textContent = cart.totalQuantity; });
    window.dispatchEvent(new CustomEvent("cart-change", { detail: cart }));
    return cart;
  }

  async function refresh() {
    return publish(Auth.token() ? await api("GET", "") : await guestCart());
  }

  async function setQuantity(productId, quantity) {
    // Quantity is capped on the client for quick feedback; the server validates it again.
    const q = Math.max(0, Math.min(MAX_QTY, quantity));
    if (Auth.token()) {
      return publish(await api("PUT", `/items/${productId}`, { quantity: q }));
    }
    const guest = readGuest();
    if (q > 0) guest[productId] = q; else delete guest[productId];
    writeGuest(guest);
    return publish(await guestCart());
  }

  function quantityOf(productId) {
    const item = current.items.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  }

  async function clear() {
    if (Auth.token()) return publish(await api("DELETE", ""));
    writeGuest({});
    return publish(await guestCart());
  }

  // Move the guest cart into the account after login.
  async function mergeGuest() {
    // On login, merge local items with the account's items, then clear the local copy.
    const items = Object.entries(readGuest())
      .map(([id, quantity]) => ({ productId: Number(id), quantity }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) return refresh();
    const cart = await api("POST", "/merge", { items });
    writeGuest({});
    return publish(cart);
  }

  window.addEventListener("auth-change", (event) => {
    // A session change selects the correct source for the cart.
    (event.detail.loggedIn ? mergeGuest() : refresh()).catch((e) => console.error(e));
  });

  refresh().catch((e) => console.error(e));
  return { refresh, setQuantity, quantityOf, clear, products };
})();

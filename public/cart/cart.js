const list = document.querySelector("#cart-items");
const emptyBox = document.querySelector("#cart-empty");
const content = document.querySelector("#cart-content");
const totalEl = document.querySelector("#cart-total");
const errorBox = document.querySelector("#cart-error");
const modeEl = document.querySelector("#cart-mode");

function formatPrice(value) {
  // Prices arrive as numbers; two decimals are shown consistently in the cart.
  return `$${value.toFixed(2)}`;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

async function run(action) {
  // Disable the controls during the request and re-read the state on error.
  errorBox.hidden = true;
  list.querySelectorAll("button").forEach((b) => { b.disabled = true; });
  try {
    await action();
  } catch (error) {
    showError(error.message);
    Cart.refresh().catch(() => {});
  }
}

function button(label, ariaLabel, className, onClick) {
  // Builds accessible buttons with labels for screen readers.
  const b = document.createElement("button");
  b.type = "button";
  b.className = className;
  b.textContent = label;
  b.setAttribute("aria-label", ariaLabel);
  b.addEventListener("click", onClick);
  return b;
}

function render(cart) {
  // Updates the page from the snapshot emitted by Cart; the old DOM is replaced.
  modeEl.textContent = Auth.token()
    ? "Your cart is saved to your account."
    : "You are not logged in. Your cart is saved in this browser and moves to your account when you log in.";

  emptyBox.hidden = cart.items.length > 0;
  content.hidden = cart.items.length === 0;
  totalEl.textContent = formatPrice(cart.totalPrice);

  // Lines use DOM APIs and textContent, not server-produced HTML.
  list.replaceChildren(...cart.items.map((item) => {
    const li = document.createElement("li");
    li.className = "cart-item";

    const img = document.createElement("img");
    img.src = item.imageUrl;
    img.alt = "";

    const info = document.createElement("div");
    info.className = "cart-item-info";
    const name = document.createElement("div");
    name.className = "cart-item-name";
    name.textContent = item.name;
    const price = document.createElement("div");
    price.textContent = `${formatPrice(item.price)} each`;
    info.append(name, price);

    const controls = document.createElement("div");
    controls.className = "qty-control";
    const qty = document.createElement("span");
    qty.className = "qty";
    qty.textContent = item.quantity;
    const minus = button("−", `Remove one ${item.name}`, "btn btn-light",
      () => run(() => Cart.setQuantity(item.productId, item.quantity - 1)));
    const plus = button("+", `Add one ${item.name}`, "btn btn-light",
      () => run(() => Cart.setQuantity(item.productId, item.quantity + 1)));
    plus.disabled = item.quantity >= 99;
    controls.append(minus, qty, plus);

    const total = document.createElement("div");
    total.className = "cart-item-total";
    total.textContent = formatPrice(item.lineTotal);

    const remove = button("Remove", `Remove ${item.name} from cart`, "btn btn-outline-danger btn-sm",
      () => run(() => Cart.setQuantity(item.productId, 0)));

    li.append(img, info, controls, total, remove);
    return li;
  }));
}

window.addEventListener("cart-change", (event) => render(event.detail));

document.querySelector("#clear-cart").addEventListener("click", () => {
  if (confirm("Remove all items from your cart?")) run(() => Cart.clear());
});

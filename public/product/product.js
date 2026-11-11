const view = document.querySelector("#product-view");
const errorBox = document.querySelector("#product-error");
const qtyValue = document.querySelector("#qty-value");
const minusBtn = document.querySelector("#qty-minus");
const plusBtn = document.querySelector("#qty-plus");

let product = null;

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function showNotFound(message) {
  view.hidden = true;
  showError(message);
}

function refreshControls() {
  const quantity = product ? Cart.quantityOf(product.id) : 0;
  qtyValue.textContent = quantity;
  minusBtn.disabled = quantity === 0;
  plusBtn.disabled = quantity >= 99;
  document.querySelector("#in-cart").textContent = quantity > 0
    ? `${quantity} in your cart.`
    : "Not in your cart yet.";
}

async function change(delta) {
  minusBtn.disabled = plusBtn.disabled = true;
  errorBox.hidden = true;
  try {
    await Cart.setQuantity(product.id, Cart.quantityOf(product.id) + delta);
    if (delta > 0) Toast.show(`${product.name} added to cart`);
  } catch (error) {
    showError(error.message);
  } finally {
    refreshControls();
  }
}

minusBtn.addEventListener("click", () => change(-1));
plusBtn.addEventListener("click", () => change(1));
window.addEventListener("cart-change", () => {
  if (product) refreshControls();
});

// Reads ?id=<number> and checks it is a positive integer before calling the API.
const params = new URLSearchParams(window.location.search);
const rawId = params.get("id");
const id = Number(rawId);

if (!rawId || !Number.isInteger(id) || id < 1) {
  showNotFound("This product does not exist. Browse the shop to find what you need.");
} else {
  fetch(`/api/products/${id}`)
    .then(async (response) => {
      if (response.status === 404) {
        throw new Error("This product does not exist. Browse the shop to find what you need.");
      }
      if (!response.ok) throw new Error("Could not load this product. Please try again.");
      return response.json();
    })
    .then((data) => {
      product = data;
      document.title = `${product.name} - G-FUEL DRINK`;
      document.querySelector("#crumb-name").textContent = product.name;
      document.querySelector("#product-category").textContent = product.category.name;
      document.querySelector("#product-title").textContent = product.name;
      document.querySelector("#product-price").textContent = formatPrice(product.price);
      document.querySelector("#product-description").textContent =
        product.description || "No description yet.";
      const img = document.querySelector("#product-img");
      img.src = product.imageUrl;
      img.alt = product.name;
      view.hidden = false;
      refreshControls();
    })
    .catch((error) => showNotFound(error.message));
}

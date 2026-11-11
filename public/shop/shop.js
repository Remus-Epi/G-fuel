const grid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#search-input");
const sortSelect = document.querySelector("#sort-select");
const categoryBox = document.querySelector("#category-filters");
const noResults = document.querySelector("#no-results");
const shopError = document.querySelector("#shop-error");

const cards = new Map(); // productId -> { product, card }
let activeCategory = "all";

function formatPrice(value) {
  return `$${value.toFixed(2)}`;
}

function showError(message) {
  shopError.textContent = message;
  shopError.hidden = false;
}

function createCard(product) {
  const card = document.createElement("div");
  card.className = "col-12 col-sm-6 col-lg-3 product-card";
  card.dataset.name = product.name;

  const detailHref = `../product/index.html?id=${product.id}`;

  const imageLink = document.createElement("a");
  imageLink.href = detailHref;
  imageLink.className = "product-image-link";
  imageLink.setAttribute("aria-label", `View ${product.name}`);
  const img = document.createElement("img");
  img.className = "product-image";
  img.src = product.imageUrl;
  img.alt = product.name;
  imageLink.append(img);

  const name = document.createElement("h2");
  name.className = "product-name";
  const nameLink = document.createElement("a");
  nameLink.href = detailHref;
  nameLink.textContent = product.name;
  name.append(nameLink);

  const category = document.createElement("div");
  category.className = "product-category";
  category.textContent = product.category.name;

  const price = document.createElement("div");
  price.className = "product-price";
  price.textContent = formatPrice(product.price);

  const controls = document.createElement("div");
  controls.className = "qty-control";
  const minus = document.createElement("button");
  minus.type = "button";
  minus.className = "btn btn-light btn-lg";
  minus.textContent = "−";
  minus.setAttribute("aria-label", `Remove one ${product.name} from cart`);
  const qty = document.createElement("span");
  qty.className = "qty";
  qty.setAttribute("aria-live", "polite");
  qty.textContent = "0";
  const plus = document.createElement("button");
  plus.type = "button";
  plus.className = "btn btn-light btn-lg";
  plus.textContent = "+";
  plus.setAttribute("aria-label", `Add one ${product.name} to cart`);
  controls.append(minus, qty, plus);

  async function change(delta) {
    minus.disabled = plus.disabled = true;
    shopError.hidden = true;
    try {
      await Cart.setQuantity(product.id, Cart.quantityOf(product.id) + delta);
      if (delta > 0) Toast.show(`${product.name} added to cart`);
    } catch (error) {
      showError(error.message);
    } finally {
      updateCard(card, Cart.quantityOf(product.id));
    }
  }
  minus.addEventListener("click", () => change(-1));
  plus.addEventListener("click", () => change(1));

  card.append(imageLink, name, category, price, controls);
  updateCard(card, 0);
  return card;
}

function updateCard(card, quantity) {
  const [minus, plus] = card.querySelectorAll(".qty-control button");
  card.querySelector(".qty").textContent = quantity;
  minus.disabled = quantity === 0;
  plus.disabled = quantity >= 99;
}

function compareProducts(a, b) {
  switch (sortSelect.value) {
    case "name-asc":
      return a.name.localeCompare(b.name);
    case "price-asc":
      return a.price - b.price || a.name.localeCompare(b.name);
    case "price-desc":
      return b.price - a.price || a.name.localeCompare(b.name);
    default:
      return a.id - b.id;
  }
}

// Applies the search, category and sort settings to the grid.
function render() {
  const query = searchInput.value.trim().toLowerCase();
  const ordered = [...cards.values()].sort((a, b) => compareProducts(a.product, b.product));

  let visible = 0;
  for (const { product, card } of ordered) {
    const matchesQuery = product.name.toLowerCase().includes(query);
    const matchesCategory = activeCategory === "all" || product.category.slug === activeCategory;
    card.hidden = !(matchesQuery && matchesCategory);
    if (!card.hidden) visible++;
    grid.append(card); // re-appending keeps the DOM in sort order
  }
  noResults.hidden = visible > 0 || cards.size === 0;
}

function renderCategoryFilters(products) {
  const categories = new Map();
  for (const p of products) categories.set(p.category.slug, p.category.name);

  const options = [["all", "All"], ...categories];
  categoryBox.replaceChildren(...options.map(([slug, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-sm category-chip";
    button.dataset.category = slug;
    button.textContent = label;
    button.setAttribute("aria-pressed", String(slug === activeCategory));
    button.addEventListener("click", () => {
      activeCategory = slug;
      for (const chip of categoryBox.children) {
        chip.setAttribute("aria-pressed", String(chip.dataset.category === slug));
      }
      render();
    });
    return button;
  }));
}

window.addEventListener("cart-change", () => {
  for (const [id, { card }] of cards) updateCard(card, Cart.quantityOf(id));
});

searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);
document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  render();
});

Cart.products()
  .then((products) => {
    for (const product of products) {
      const card = createCard(product);
      cards.set(product.id, { product, card });
      grid.append(card);
      updateCard(card, Cart.quantityOf(product.id));
    }
    renderCategoryFilters(products);
    render();
  })
  .catch(() => showError("Could not load products. Make sure the server is running."));

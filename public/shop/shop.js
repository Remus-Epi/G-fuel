const BASKET_KEY = "gfuel-basket";
const cards = [...document.querySelectorAll(".product-card")];
const searchInput = document.querySelector("#search-input");
const noResults = document.querySelector("#no-results");
const basketCount = document.querySelector("#basket-count");

function readBasket() {
  try {
    return JSON.parse(localStorage.getItem(BASKET_KEY)) || {};
  } catch {
    return {};
  }
}

let basket = readBasket();

function renderBasketCount() {
  const total = Object.values(basket).reduce((sum, quantity) => sum + quantity, 0);
  basketCount.textContent = `Basket: ${total}`;
}

function addToBasket(name) {
  basket[name] = (basket[name] || 0) + 1;
  try {
    localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
  } catch {
    // Storage can be blocked; the count still works for this page view.
  }
  renderBasketCount();
}

function filterProducts() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;
  for (const card of cards) {
    card.hidden = !card.dataset.name.toLowerCase().includes(query);
    if (!card.hidden) visible++;
  }
  noResults.hidden = visible > 0;
}

for (const card of cards) {
  card.querySelector("button").addEventListener("click", () => addToBasket(card.dataset.name));
}
searchInput.addEventListener("input", filterProducts);
document.querySelector("#searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  filterProducts();
});
renderBasketCount();

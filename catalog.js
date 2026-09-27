const loggedInUser = localStorage.getItem('firstName') || 'User';

let allProducts = [];
let filteredProducts = [];
const PAGE_LIMIT = 8;
let currentDisplayCount = PAGE_LIMIT;
let cart = JSON.parse(localStorage.getItem('cart_items')) || [];

const userDisplayName = document.getElementById('user-display-name');
const btnLogout = document.getElementById('btn-logout');

const productGrid = document.getElementById('product-grid');
const statusLine = document.getElementById('status-line');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortSelect = document.getElementById('sort-select');
const loadMoreBtn = document.getElementById('load-more-btn');

const errorBanner = document.getElementById('error-banner');
const errorMsg = document.getElementById('error-msg');
const retryFetchBtn = document.getElementById('retry-fetch-btn');

const productModal = document.getElementById('product-modal');
const modalContent = document.getElementById('modal-content');

const btnCart = document.getElementById('btn-cart');
const cartCount = document.getElementById('cart-count');
const cartDrawer = document.getElementById('cart-drawer');
const overlay = document.getElementById('overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const clearCartBtn = document.getElementById('clear-cart-btn');

const toast = document.getElementById('toast');

userDisplayName.textContent = loggedInUser;

btnLogout.addEventListener('click', () => {
  const confirmLogout = confirm("Are you sure you want to log out?");
  if (!confirmLogout) return; 
 
  localStorage.removeItem('firstName');
  window.location.href = 'loginpage.html';
});

async function loadProducts() {
  statusLine.textContent = 'Loading products…';
  hideError();

  try {
    const response = await fetch('https://dummyjson.com/products?limit=100');
    if (!response.ok) {
      throw new Error('Server returned status ' + response.status);
    }
    const data = await response.json();
    allProducts = data.products;

    populateCategories(allProducts);
    handleSearchAndFilter();
  } catch (error) {
    statusLine.textContent = '';
    showError('Failed to load products. Please check your connection and try again.');
    console.error(error);
  }
}

function populateCategories(products) {
  const categories = [...new Set(products.map(p => p.category))].sort();
  categoryFilter.innerHTML = '<option value="">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(option);
  });
}

function showError(message) {
  errorMsg.textContent = message;
  errorBanner.classList.remove('hidden');
}

function hideError() {
  errorBanner.classList.add('hidden');
}

retryFetchBtn.addEventListener('click', loadProducts);

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

searchInput.addEventListener('input', debounce(handleSearchAndFilter, 300));

function handleSearchAndFilter() {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const selectedCategory = categoryFilter.value;
  const selectedSort = sortSelect.value;

  filteredProducts = allProducts.filter(product => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm);
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedSort === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (selectedSort === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (selectedSort === 'rating-desc') {
    filteredProducts.sort((a, b) => b.rating - a.rating);
  } else if (selectedSort === 'rating-asc') {
    filteredProducts.sort((a, b) => a.rating - b.rating);
  }

  currentDisplayCount = PAGE_LIMIT;
  renderProducts();
}

categoryFilter.addEventListener('change', handleSearchAndFilter);
sortSelect.addEventListener('change', handleSearchAndFilter);

function renderProducts() {
  const productsToRender = filteredProducts.slice(0, currentDisplayCount);

  if (productsToRender.length === 0) {
    productGrid.innerHTML = '<p class="empty-state">No products found.</p>';
  } else {
    productGrid.innerHTML = productsToRender.map(product => buildCardHTML(product)).join('');
  }

  statusLine.textContent = `Showing ${productsToRender.length} of ${filteredProducts.length} products`;

  if (currentDisplayCount < filteredProducts.length) {
    loadMoreBtn.classList.remove('hidden');
  } else {
    loadMoreBtn.classList.add('hidden');
  }
}

function buildCardHTML(product) {
  const discountBadge = product.discountPercentage
    ? `<span class="discount">-${Math.round(product.discountPercentage)}%</span>`
    : '';

  return `
    <div class="card" data-id="${product.id}">
      <img src="${product.thumbnail}" alt="${product.title}" loading="lazy">
      <div class="card-body">
        <h3>${product.title}</h3>
        <span class="card-cat">${product.category}</span>
        <span class="card-rating">⭐ ${product.rating}</span>
        <div class="price-row">
          <span class="price">$${product.price.toFixed(2)}</span>
          ${discountBadge}
        </div>
        <button class="btn-add-cart" data-id="${product.id}">Add to Cart</button>
      </div>
    </div>
  `;
}

loadMoreBtn.addEventListener('click', () => {
  currentDisplayCount += PAGE_LIMIT;
  renderProducts();
});

productGrid.addEventListener('click', handleGridClick);

function handleGridClick(e) {
  const addBtn = e.target.closest('.btn-add-cart');
  if (addBtn) {
    addToCart(Number(addBtn.dataset.id));
    return;
  }

  const card = e.target.closest('.card');
  if (card) {
    openProductModal(Number(card.dataset.id));
  }
}

function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const discountBadge = product.discountPercentage
    ? `<span class="modal-discount-badge">-${Math.round(product.discountPercentage)}%</span>`
    : '';

  modalContent.innerHTML = `
    <button id="close-modal-btn" class="modal-close-x" aria-label="Close">✕</button>
    <div class="modal-grid">
      <div class="modal-image-wrap">
        ${discountBadge}
        <img src="${product.thumbnail}" alt="${product.title}">
      </div>
      <div class="modal-info">
        <span class="modal-category-pill">${product.category}</span>
        <h2>${product.title}</h2>
        <p class="modal-brand">Brand: <strong>${product.brand || '-'}</strong></p>
        <div class="modal-price-rating">
          <span class="modal-price">$${product.price.toFixed(2)}</span>
          <span class="modal-rating">★ ${product.rating}</span>
        </div>
        <p class="modal-stock">Stock available: ${product.stock}</p>
        <p class="modal-desc">${product.description}</p>
        <button class="btn-add-cart modal-add-btn" data-id="${product.id}">Add to Cart</button>
      </div>
    </div>
  `;
  productModal.classList.remove('hidden');
}

productModal.addEventListener('click', (e) => {
  if (e.target.id === 'close-modal-btn' || e.target.id === 'product-modal') {
    productModal.classList.add('hidden');
  }
  const addBtn = e.target.closest('.btn-add-cart');
  if (addBtn) {
    addToCart(Number(addBtn.dataset.id));
  }
});

function addToCart(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity: 1
    });
  }

  saveCart();
  showToast(product.title + ' added to cart');
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
}

function updateQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
  }
}

function clearCart() {
  cart = [];
  localStorage.removeItem('cart_items');
  renderCart();
}

function saveCart() {
  if (cart.length === 0) {
    localStorage.removeItem('cart_items');
  } else {
    localStorage.setItem('cart_items', JSON.stringify(cart));
  }
  renderCart();
}

function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
  } else {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.thumbnail}" alt="${item.title}">
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <span>$${item.price.toFixed(2)} x ${item.quantity}</span>
          <div class="qty-ctrl">
            <button data-qty="-1" data-id="${item.id}">−</button>
            <span>${item.quantity}</span>
            <button data-qty="1" data-id="${item.id}">+</button>
          </div>
          <button class="remove-item" data-remove="${item.id}">Remove</button>
        </div>
      </div>
    `).join('');
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  cartTotalEl.textContent = '$' + total.toFixed(2);
}

cartItemsEl.addEventListener('click', (e) => {
  const qtyBtn = e.target.closest('[data-qty]');
  const removeBtn = e.target.closest('[data-remove]');
  if (qtyBtn) {
    updateQuantity(Number(qtyBtn.dataset.id), Number(qtyBtn.dataset.qty));
  } else if (removeBtn) {
    removeFromCart(Number(removeBtn.dataset.remove));
  }
});

clearCartBtn.addEventListener('click', clearCart);

btnCart.addEventListener('click', () => {
  cartDrawer.classList.add('open');
  overlay.classList.add('open');
});

closeCartBtn.addEventListener('click', closeCartDrawer);
overlay.addEventListener('click', closeCartDrawer);

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
  overlay.classList.remove('open');
}


let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
}

renderCart();
loadProducts();
/* ==========================================================================
   GABUNGAN TUGAS IZZAT & RIFKI (product.js)
   Tersinkronisasi dengan tugas Malikha (Login & Session)
========================================================================== */

// --- 1. STATE MANAGEMENT ---
let allProducts = [];
let filteredProducts = [];
let currentVisible = 8;
const BATCH_SIZE = 8;
let cart = JSON.parse(localStorage.getItem('cart_items')) || [];

// --- 2. ELEMENT SELECTORS ---
// Navbar & Auth Elements
const userNameElement = document.getElementById('userName');
const logoutButton = document.getElementById('logoutButton');
const searchInput = document.getElementById('searchInput');

// Product & Control Elements
const productGrid = document.getElementById('productGrid');
const productLoading = document.getElementById('productLoading');
const globalError = document.getElementById('globalError');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const loadMoreButton = document.getElementById('loadMoreButton');

// Cart Elements
const cartButton = document.getElementById('cartButton');
const closeCartButton = document.getElementById('closeCartButton');
const cartPanel = document.getElementById('cartPanel');
const cartOverlay = document.getElementById('cartOverlay');
const cartItemsContainer = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutButton = document.getElementById('checkoutButton');

// Modal Elements
const productModal = document.getElementById('productModal');
const closeModalButton = document.getElementById('closeModalButton');
const modalProductContent = document.getElementById('modalProductContent');


// --- 3. AUTH GUARD & INITIALIZATION (Sinkronisasi dengan Malikha) ---
document.addEventListener("DOMContentLoaded", () => {
    // Mengecek apakah user sudah login melalui data dari Malikha
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    
    // Jika belum login, tendang kembali ke halaman login
    if (!isLoggedIn) {
        window.location.href = "login.html";
        return;
    }

    // Menampilkan nama user dari localStorage (diset oleh Malikha)
    const firstName = localStorage.getItem("firstName") || "Shopper";
    userNameElement.textContent = `Halo, ${firstName}`;

    // Jalankan aplikasi utama
    initApp();
});

// Fitur Logout
logoutButton.addEventListener('click', () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("firstName");
    window.location.href = "login.html";
});


// --- 4. FETCH API & SETUP APLIKASI UTAMA ---
async function initApp() {
    try {
        productLoading.style.display = "block";
        globalError.style.display = "none";

        // Fetch data dari API DummyJSON
        const response = await fetch("https://dummyjson.com/products");
        if (!response.ok) throw new Error("Gagal mengambil data dari server.");
        
        const data = await response.json();
        allProducts = data.products;
        filteredProducts = [...allProducts];

        // Ekstrak kategori untuk dropdown
        extractCategories();
        
        // Pasang semua Event Listener
        setupEventListeners();
        
        // Tampilkan keranjang dan produk
        updateCartUI();
        applyPaginationAndRender();

    } catch (error) {
        // Global Error Handling
        globalError.style.display = "block";
        globalError.textContent = `⚠️ Terjadi kesalahan: ${error.message}`;
    } finally {
        productLoading.style.display = "none";
    }
}


// --- 5. RENDER PRODUK ---
function renderProducts(productsToRender) {
    productGrid.innerHTML = "";

    if (productsToRender.length === 0) {
        productGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Produk tidak ditemukan.</p>`;
        return;
    }

    productsToRender.forEach(product => {
        // Render Card HTML (Sesuai dengan style.css)
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.id = product.id; // Penting untuk Event Delegation

        const discountBadge = product.discountPercentage > 0 
            ? `<span class="discount-badge">-${Math.round(product.discountPercentage)}%</span>` 
            : '';

        card.innerHTML = `
            <div class="product-image-container">
                ${discountBadge}
                <img src="${product.thumbnail}" alt="${product.title}" class="product-image" loading="lazy">
            </div>
            <div class="product-category">${product.category}</div>
            <div class="product-name">${product.title}</div>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <div class="product-rating">⭐ ${product.rating}</div>
            <button class="add-cart-button">Tambah ke Keranjang</button>
        `;

        productGrid.appendChild(card);
    });
}


// --- 6. SEARCH DEBOUNCE (CLOSURE) ---
function debounce(func, delay) {
    let timeoutId; // Variabel closure
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

const handleSearch = debounce(() => {
    applyFilters(); // Panggil fungsi filter utama setiap kali ngetik (setelah delay)
}, 300);


// --- 7. FILTERING & SORTING UTAMA ---
function extractCategories() {
    const categories = [...new Set(allProducts.map(p => p.category))];
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilter.appendChild(option);
    });
}

function applyFilters() {
    let result = [...allProducts];

    // 1. Filter Pencarian (Search)
    const searchTerm = searchInput.value.toLowerCase();
    if (searchTerm) {
        result = result.filter(p => 
            p.title.toLowerCase().includes(searchTerm) || 
            p.category.toLowerCase().includes(searchTerm)
        );
    }

    // 2. Filter Kategori Dropdown
    const selectedCategory = categoryFilter.value;
    if (selectedCategory !== 'all') {
        result = result.filter(p => p.category === selectedCategory);
    }

    // 3. Sorting (Harga / Rating)
    const sortVal = sortSelect.value;
    if (sortVal === 'price-low') {
        result.sort((a, b) => a.price - b.price);
    } else if (sortVal === 'price-high') {
        result.sort((a, b) => b.price - a.price);
    } else if (sortVal === 'rating-high') {
        result.sort((a, b) => b.rating - a.rating);
    }

    filteredProducts = result;
    currentVisible = BATCH_SIZE; // Reset ke batch pertama jika filter berubah
    applyPaginationAndRender();
}


// --- 8. PAGINATION (LOAD MORE) ---
function applyPaginationAndRender() {
    const slicedData = filteredProducts.slice(0, currentVisible);
    
    // Tampilkan / Sembunyikan tombol Load More
    if (currentVisible >= filteredProducts.length) {
        loadMoreButton.style.display = 'none';
    } else {
        loadMoreButton.style.display = 'inline-block';
    }

    renderProducts(slicedData);
}


// --- 9. EVENT LISTENERS UTAMA ---
function setupEventListeners() {
    // Input Pencarian (dengan Debounce)
    searchInput.addEventListener('input', handleSearch);

    // Dropdown Filter & Sort
    categoryFilter.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);
    
    // Tombol Load More
    loadMoreButton.addEventListener('click', () => {
        currentVisible += BATCH_SIZE;
        applyPaginationAndRender();
    });

    // Event Delegation (Modal Detail & Add to Cart) pada Grid
    productGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (!card) return;
        
        const productId = parseInt(card.dataset.id);
        
        if (e.target.classList.contains('add-cart-button')) {
            addToCart(productId);
        } else {
            showProductModal(productId); // Klik selain tombol cart buka modal
        }
    });

    // Modal Control
    closeModalButton.addEventListener('click', () => productModal.classList.remove('active'));
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) productModal.classList.remove('active');
    });

    // Cart Panel Control
    cartButton.addEventListener('click', () => {
        cartPanel.classList.add('active');
        cartOverlay.classList.add('active');
    });
    closeCartButton.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);
    
    // Checkout Dummy
    checkoutButton.addEventListener('click', () => {
        if(cart.length > 0) {
            alert('Fitur Checkout sedang dalam pengembangan!');
        }
    });
}

function closeCart() {
    cartPanel.classList.remove('active');
    cartOverlay.classList.remove('active');
}


// --- 10. MODAL DETAIL PRODUK ---
function showProductModal(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    modalProductContent.innerHTML = `
        <div style="display:flex; gap:20px; flex-wrap:wrap; margin-top: 15px;">
            <img src="${product.thumbnail}" alt="${product.title}" style="width:100%; max-width:250px; border-radius:6px; background:#f0f0f0;">
            <div style="flex:1;">
                <span class="product-category">${product.category}</span>
                <h2 style="margin-bottom:10px;">${product.title}</h2>
                <h3 style="color:#d00000; margin-bottom:10px;">$${product.price} <span style="font-size:14px; color:#777;">(⭐ ${product.rating})</span></h3>
                <p style="margin-bottom:10px; font-size:14px;"><strong>Stok tersedia:</strong> ${product.stock}</p>
                <p style="margin-bottom:15px; font-size:14px; line-height:1.5;">${product.description}</p>
                <button class="add-cart-button" onclick="addToCart(${product.id})" style="width:auto; padding:8px 20px;">Tambah ke Keranjang</button>
            </div>
        </div>
    `;
    productModal.classList.add('active');
}


// --- 11. KERANJANG BELANJA (CRUD LOCAL STORAGE) ---
window.addToCart = function(id) { // Dijadikan global agar bisa dipanggil dari inline onclick modal
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    const existingItem = cart.find(item => item.id === id);
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
    
    // Opsional: Buka otomatis keranjang saat tambah barang
    cartPanel.classList.add('active');
    cartOverlay.classList.add('active');
}

window.updateCartQuantity = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        saveCart();
    }
}

window.removeCartItem = function(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
}

function saveCart() {
    localStorage.setItem('cart_items', JSON.stringify(cart));
    updateCartUI();
}

function updateCartUI() {
    // Hitung badge
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;

    // Hitung total harga
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;

    // Render list
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#777; margin-top:20px;">Keranjang belanja kosong.</p>';
        return;
    }

    cartItemsContainer.innerHTML = cart.map(item => `
        <div style="display:flex; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <img src="${item.thumbnail}" alt="${item.title}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
            <div style="flex:1;">
                <h4 style="font-size:13px; margin-bottom:4px;">${item.title}</h4>
                <div style="color:#d00000; font-size:12px; margin-bottom:5px;">$${item.price}</div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="updateCartQuantity(${item.id}, -1)" style="padding:2px 8px; border:1px solid #ccc; background:#fff;">-</button>
                    <span style="font-size:13px;">${item.quantity}</span>
                    <button onclick="updateCartQuantity(${item.id}, 1)" style="padding:2px 8px; border:1px solid #ccc; background:#fff;">+</button>
                    <button onclick="removeCartItem(${item.id})" style="margin-left:auto; padding:2px 8px; border:none; background:none; color:red; font-size:12px; cursor:pointer;">Hapus</button>
                </div>
            </div>
        </div>
    `).join('');
}
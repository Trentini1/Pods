// --- CONFIGURAÇÕES ---
const FIREBASE_URL = 'https://vip-pods-estoque-default-rtdb.firebaseio.com/'; // SUBSTITUA PELA SUA URL
const ADMIN_PASSWORD = 'Trentini7'; // MUDE PARA UMA SENHA SEGURA

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    loadProductsAndSetupTabs();
    setupModal();
    setupAdminLogin();
});

// --- LÓGICA PRINCIPAL DA LOJA ---
async function loadProductsAndSetupTabs() {
    try {
        const [productsResponse, stockResponse] = await Promise.all([
            fetch('products/products.json'),
            fetch(FIREBASE_URL)
        ]);

        if (!productsResponse.ok) throw new Error('Falha ao carregar products.json');
        
        const productData = await productsResponse.json();
        const stockData = stockResponse.ok ? await stockResponse.json() || {} : {};

        const brandToTabId = {
            'BLACK SHEEP 20k': 'black-sheep',
            'ELF BAR TE 30k': 'elf-bar', 'ELF BAR GH23k': 'elf-bar',
            'SEX ADDICT S280k': 'sex-addict',
            'IGNITE V80': 'ignite'
        };

        productData.forEach(brandData => {
            const tabId = brandToTabId[brandData.brand];
            const container = document.getElementById(tabId);
            if (container) {
                brandData.products.forEach(product => {
                    const stockCount = stockData[product.id] === undefined ? 10 : stockData[product.id]; // Estoque padrão de 10 se não definido
                    container.innerHTML += createProductCardHTML(brandData, product, stockCount);
                });
            }
        });
        setupTabs();
        setupIntersectionObserver();
    } catch (error) {
        console.error('Erro fatal ao carregar os produtos:', error);
        document.querySelector('.tabs-content').innerHTML = '<p style="text-align:center; color:red;">Não foi possível carregar os produtos.</p>';
    }
}

function createProductCardHTML(brandData, product, stockCount) {
    const isOutOfStock = stockCount <= 0;
    const buttonHTML = isOutOfStock
        ? `<button class="action-button out-of-stock" disabled>Sem Estoque</button>`
        : `<button class="action-button add-to-cart-button" onclick="addToCart('${brandData.brand} - ${product.name}', ${brandData.price})">Adicionar ao Carrinho</button>`;
    
    return `
        <div class="product-card" data-id="${product.id}" data-stock="${stockCount}">
            <h4>${product.name}</h4>
            <p class="price">R$${brandData.price.toFixed(2).replace('.', ',')}</p>
            
            ${buttonHTML}
            
            <div class="admin-stock-controls">
                <button class="stock-change-btn" data-change="-1">-</button>
                <span class="stock-count">${stockCount}</span>
                <button class="stock-change-btn" data-change="1">+</button>
            </div>
        </div>`;
}

// --- LÓGICA DO MODO ADMIN ---
function setupAdminLogin() {
    const adminLoginButton = document.getElementById('admin-login-button');
    const loginModal = document.getElementById('login-modal');
    const closeLoginModalButton = document.getElementById('close-login-modal');
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password-input');
    const saveStockButton = document.getElementById('save-stock-button');
    const logoutButton = document.getElementById('logout-button');

    adminLoginButton.addEventListener('click', () => {
        loginModal.style.display = 'flex';
    });

    closeLoginModalButton.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });

    loginButton.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            document.body.classList.add('admin-logged-in');
            loginModal.style.display = 'none';
            passwordInput.value = '';
            setupAdminControls();
        } else {
            alert('Senha incorreta!');
        }
    });

    saveStockButton.addEventListener('click', saveAllStock);

    logoutButton.addEventListener('click', () => {
        document.body.classList.remove('admin-logged-in');
    });
}

function setupAdminControls() {
    const stockChangeButtons = document.querySelectorAll('.stock-change-btn');
    stockChangeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');
            const stockCountEl = card.querySelector('.stock-count');
            const change = parseInt(button.dataset.change, 10);
            
            let currentStock = parseInt(stockCountEl.textContent, 10);
            currentStock += change;
            if (currentStock < 0) currentStock = 0; // Não permite estoque negativo

            stockCountEl.textContent = currentStock;
            card.dataset.stock = currentStock; // Atualiza o dado no elemento para salvar depois
        });
    });
}

async function saveAllStock() {
    const allCards = document.querySelectorAll('.product-card');
    const newStockData = {};
    allCards.forEach(card => {
        newStockData[card.dataset.id] = parseInt(card.dataset.stock, 10);
    });

    try {
        const response = await fetch(FIREBASE_URL, {
            method: 'PUT', // PUT sobrescreve todo o objeto de estoque
            body: JSON.stringify(newStockData),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Falha ao salvar no Firebase');
        alert('Estoque atualizado com sucesso!');
        // Opcional: recarregar a página para refletir o estado de "Sem Estoque"
        // window.location.reload(); 
    } catch (error) {
        console.error("Erro ao salvar o estoque:", error);
        alert("Ocorreu um erro ao salvar. Verifique o console.");
    }
}

// --- FUNÇÕES UTILITÁRIAS (Abas, Modal, Animações) ---
// Estas funções permanecem praticamente as mesmas

function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanels = document.querySelectorAll('.tab-content-panel');
    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            const targetPanel = document.getElementById(link.dataset.tab);
            if(targetPanel) targetPanel.classList.add('active');
        });
    });
    if (tabLinks.length > 0) tabLinks[0].click();
}

function setupModal() {
    const cartModal = document.getElementById('cart-modal');
    const modalContent = document.querySelector('.modal-content');
    const cartIcon = document.querySelector('.cart-icon');
    const closeButton = cartModal.querySelector('.close-button');
    const checkoutButton = document.getElementById('checkout-button');
    const openCart = () => {
        cartModal.style.display = 'block';
        modalContent.classList.remove('hide');
        modalContent.classList.add('show');
        updateCartDisplay();
    };
    const closeModal = () => {
        modalContent.classList.remove('show');
        modalContent.classList.add('hide');
        setTimeout(() => { cartModal.style.display = 'none'; }, 500);
    };
    cartIcon.addEventListener('click', openCart);
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target == cartModal) closeModal(); });
    checkoutButton.addEventListener('click', generateWhatsAppMessage);
}

function setupIntersectionObserver() {
    const cards = document.querySelectorAll('.product-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${index * 50}ms`;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    cards.forEach(card => { observer.observe(card); });
}

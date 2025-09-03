// --- CONFIGURAÇÕES ---
// 1. COLE A URL DO SEU FIREBASE AQUI (SEM /stock.json no final)
const FIREBASE_URL_BASE = 'https://vip-pods-estoque-default-rtdb.firebaseio.com/';
const ADMIN_PASSWORD = 'vip'; // MUDE PARA UMA SENHA SEGURA

// --- CONSTANTES ---
const FIREBASE_STOCK_URL = `${FIREBASE_URL_BASE}/stock.json`;

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM carregado. Iniciando script...");
    loadProductsAndSetupTabs();
    setupModal(); // Modal do Carrinho
    setupAdminFeature(); // Configura o login de admin
});

// --- LÓGICA DE ADMIN ---
function setupAdminFeature() {
    console.log("Configurando funcionalidade de Admin...");
    const openLoginBtn = document.getElementById('open-admin-login-button');
    const loginModal = document.getElementById('login-modal');
    const closeLoginBtn = document.getElementById('login-close-button');
    const loginSubmitBtn = document.getElementById('login-submit-button');
    const saveAndExitButton = document.getElementById('save-and-exit-button');

    if (!openLoginBtn || !loginModal || !closeLoginBtn || !loginSubmitBtn || !saveAndExitButton) {
        console.error("ERRO CRÍTICO: Um ou mais elementos do Admin não foram encontrados no HTML. Verifique os IDs.");
        return; // Para a execução se o HTML estiver quebrado
    }

    openLoginBtn.addEventListener('click', () => {
        console.log("Botão 'Acesso ADM' clicado.");
        loginModal.style.display = 'flex';
    });

    closeLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
    });
    
    loginModal.addEventListener('click', (event) => {
        if(event.target === loginModal) {
            loginModal.style.display = 'none';
        }
    });

    loginSubmitBtn.addEventListener('click', () => {
        const passwordInput = document.getElementById('password-input');
        if (passwordInput.value === ADMIN_PASSWORD) {
            passwordInput.value = '';
            loginModal.style.display = 'none';
            enterAdminMode();
        } else {
            alert('Senha incorreta.');
        }
    });

    saveAndExitButton.addEventListener('click', saveStockAndExit);
    console.log("Funcionalidade de Admin configurada com sucesso.");
}


function enterAdminMode() {
    console.log("Entrando no Modo Admin...");
    document.body.classList.add('admin-logged-in');
    
    document.querySelectorAll('.stock-change-btn').forEach(button => {
        // Previne múltiplos listeners limpando e recriando o elemento
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);

        newButton.addEventListener('click', () => {
            const card = newButton.closest('.product-card');
            const stockCountEl = card.querySelector('.stock-count');
            const change = parseInt(newButton.dataset.change, 10);
            
            let currentStock = parseInt(stockCountEl.textContent, 10);
            currentStock = Math.max(0, currentStock + change); // Previne números negativos

            stockCountEl.textContent = currentStock;
            card.dataset.stock = currentStock;
        });
    });
    console.log("Modo Admin ativado.");
}


async function saveStockAndExit() {
    const saveButton = document.getElementById('save-and-exit-button');
    saveButton.textContent = 'Salvando...';
    saveButton.disabled = true;

    const allCards = document.querySelectorAll('.product-card');
    const newStockData = {};
    allCards.forEach(card => {
        newStockData[card.dataset.id] = parseInt(card.dataset.stock, 10);
    });

    try {
        const response = await fetch(FIREBASE_STOCK_URL, {
            method: 'PUT',
            body: JSON.stringify(newStockData),
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Falha ao salvar no Firebase: ${errorData.error}`);
        }
        
        alert('Estoque atualizado com sucesso!');
        window.location.reload();

    } catch (error) {
        console.error("Erro ao salvar o estoque:", error);
        alert(`Ocorreu um erro ao salvar: ${error.message}`);
        saveButton.textContent = 'Salvar Estoque e Sair';
        saveButton.disabled = false;
    }
}

// --- LÓGICA DA LOJA ---
async function loadProductsAndSetupTabs() {
    console.log("Tentando carregar produtos...");
    try {
        const [productsResponse, stockResponse] = await Promise.all([
            fetch('products/products.json'),
            fetch(FIREBASE_STOCK_URL)
        ]);

        if (!productsResponse.ok) throw new Error('Falha ao carregar o arquivo local products.json');
        
        console.log("Arquivo local 'products.json' carregado.");

        if (!stockResponse.ok) {
             const errorData = await stockResponse.json();
             console.error("Erro do Firebase:", errorData);
             throw new Error(`Falha ao carregar o estoque do Firebase. Motivo: ${errorData.error || 'Verifique as regras e a URL.'}`);
        }
        
        console.log("Estoque do Firebase carregado.");

        const productData = await productsResponse.json();
        const stockData = await stockResponse.json() || {};

        const brandToTabId = {'BLACK SHEEP 20k': 'black-sheep', 'ELF BAR TE 30k': 'elf-bar', 'ELF BAR GH23k': 'elf-bar', 'SEX ADDICT S280k': 'sex-addict', 'IGNITE V80': 'ignite'};
        
        // Limpa os painéis antes de adicionar novos produtos
        document.querySelectorAll('.tab-content-panel').forEach(panel => panel.innerHTML = '');

        productData.forEach(brandData => {
            const tabId = brandToTabId[brandData.brand];
            const container = document.getElementById(tabId);
            if (container) {
                brandData.products.forEach(product => {
                    const stockCount = stockData[product.id] === undefined ? 10 : stockData[product.id];
                    container.innerHTML += createProductCardHTML(brandData, product, stockCount);
                });
            }
        });

        console.log("Produtos inseridos na página.");
        setupTabs();
        setupIntersectionObserver();
    } catch (error) {
        console.error('ERRO CRÍTICO ao carregar os produtos:', error);
        const errorContainer = document.querySelector('.tabs-content');
        if(errorContainer) {
            errorContainer.innerHTML = `<p style="text-align:center; color:red; padding: 30px; border: 1px solid red; border-radius: 8px;"><b>Não foi possível carregar os produtos.</b><br><small>${error.message}</small></p>`;
        }
    }
}


// O resto das funções (createProductCardHTML, setupTabs, setupModal, etc.) permanece o mesmo.
function createProductCardHTML(brandData, product, stockCount) {
    const isOutOfStock = stockCount <= 0;
    const customerButton = isOutOfStock
        ? `<button class="action-button out-of-stock" disabled>Sem Estoque</button>`
        : `<button class="action-button add-to-cart-button" onclick="addToCart('${brandData.brand} - ${product.name}', ${brandData.price})">Adicionar ao Carrinho</button>`;
    
    return `
        <div class="product-card" data-id="${product.id}" data-stock="${stockCount}">
            <h4>${product.name}</h4>
            <p class="price">R$${brandData.price.toFixed(2).replace('.', ',')}</p>
            ${customerButton}
            <div class="admin-stock-controls">
                <button class="stock-change-btn" data-change="-1">-</button>
                <span class="stock-count">${stockCount}</span>
                <button class="stock-change-btn" data-change="1">+</button>
            </div>
        </div>`;
}

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
    if (tabLinks.length > 0 && !document.querySelector('.tab-link.active')) {
        tabLinks[0].click();
    }
}

function setupModal() {
    const cartModal = document.getElementById('cart-modal');
    if (!cartModal) return;
    const modalContent = cartModal.querySelector('.modal-content');
    const cartIcon = document.querySelector('.cart-icon');
    const closeButton = cartModal.querySelector('.close-button');
    const checkoutButton = document.getElementById('checkout-button');
    const openCart = () => { cartModal.style.display = 'block'; modalContent.classList.remove('hide'); modalContent.classList.add('show'); updateCartDisplay(); };
    const closeModal = () => { modalContent.classList.remove('show'); modalContent.classList.add('hide'); setTimeout(() => { cartModal.style.display = 'none'; }, 500); };
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

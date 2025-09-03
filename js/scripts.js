// ATENÇÃO: Cole a URL do seu Firebase Realtime Database aqui também!
const FIREBASE_URL = 'https://vip-pods-estoque-default-rtdb.firebaseio.com/stock.json'; // SUBSTITUA PELA SUA URL

document.addEventListener('DOMContentLoaded', () => {
    loadProductsAndSetupTabs();
    setupModal();
});

async function loadProductsAndSetupTabs() {
    try {
        // Carrega ambos os dados em paralelo para mais performance
        const [productsResponse, stockResponse] = await Promise.all([
            fetch('products/products.json'),
            fetch(FIREBASE_URL)
        ]);

        if (!productsResponse.ok) throw new Error('Falha ao carregar products.json');
        
        const productData = await productsResponse.json();
        const stockData = stockResponse.ok ? await stockResponse.json() || {} : {};

        const brandToTabId = {
            'BLACK SHEEP 20k': 'black-sheep',
            'ELF BAR TE 30k': 'elf-bar',
            'ELF BAR GH23k': 'elf-bar',
            'SEX ADDICT S280k': 'sex-addict',
            'IGNITE V80': 'ignite'
        };

        productData.forEach(brandData => {
            const tabId = brandToTabId[brandData.brand];
            const container = document.getElementById(tabId);

            if (container) {
                brandData.products.forEach(product => {
                    const stockCount = stockData[product.id]; // Pode ser um número ou undefined

                    // Define o botão com base no estoque
                    let buttonHTML;
                    if (stockCount > 0) {
                        buttonHTML = `<button class="action-button add-to-cart-button" onclick="addToCart('${brandData.brand} - ${product.name}', ${brandData.price})">
                                        Adicionar ao Carrinho
                                      </button>`;
                    } else {
                        // Se o estoque for 0 ou não definido, mostra como indisponível
                        buttonHTML = `<button class="action-button out-of-stock" disabled>
                                        Sem Estoque
                                      </button>`;
                    }

                    const productHTML = `
                        <div class="product-card">
                            <h4>${product.name}</h4>
                            <p class="price">R$${brandData.price.toFixed(2).replace('.', ',')}</p>
                            ${buttonHTML}
                        </div>`;
                    container.innerHTML += productHTML;
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

function setupTabs() {
    // Esta função permanece a mesma da versão anterior
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

    // Ativa a primeira aba por padrão
    if (tabLinks.length > 0) {
        tabLinks[0].click();
    }
}

// O resto das funções (setupModal, setupIntersectionObserver) permanece o mesmo da versão anterior...
function setupModal() {
    const cartModal = document.getElementById('cart-modal');
    const modalContent = document.querySelector('.modal-content');
    const cartIcon = document.querySelector('.cart-icon');
    const closeButton = document.querySelector('.close-button');
    const checkoutButton = document.getElementById('checkout-button');

    cartIcon.addEventListener('click', () => {
        cartModal.style.display = 'block';
        modalContent.classList.remove('hide');
        modalContent.classList.add('show');
        updateCartDisplay();
    });

    const closeModal = () => {
        modalContent.classList.remove('show');
        modalContent.classList.add('hide');
        setTimeout(() => {
            cartModal.style.display = 'none';
        }, 500);
    };

    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target == cartModal) {
            closeModal();
        }
    });
    
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
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    cards.forEach(card => {
        observer.observe(card);
    });
}

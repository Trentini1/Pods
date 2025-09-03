document.addEventListener('DOMContentLoaded', () => {
    loadProductsAndSetupTabs(); // Esta função agora cuidará de tudo
    setupModal(); // A lógica do modal permanece a mesma
});

// A função loadProductsAndSetupTabs é responsável por carregar os produtos
// e, EM SEGUIDA, inicializar as abas e as animações.
function loadProductsAndSetupTabs() {
    fetch('products/products.json')
        .then(response => {
            if (!response.ok) throw new Error(`Erro de rede! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            const brandToTabId = {
                'BLACK SHEEP 20k': 'black-sheep',
                'ELF BAR TE 30k': 'elf-bar', // Agrupa ambos ELF BAR aqui
                'ELF BAR GH23k': 'elf-bar',
                'SEX ADDICT S280k': 'sex-addict',
                'IGNITE V80': 'ignite'
            };

            // Certifica-se de que os painéis de abas existam
            Object.values(brandToTabId).forEach(tabId => {
                if (!document.getElementById(tabId)) {
                    console.warn(`Painel de aba com ID '${tabId}' não encontrado. Criando um placeholder.`);
                    // Cria um div temporário se a aba não existir no HTML por algum motivo
                    const tempDiv = document.createElement('div');
                    tempDiv.id = tabId;
                    tempDiv.classList.add('tab-content-panel');
                    document.querySelector('.tabs-content').appendChild(tempDiv);
                }
            });

            data.forEach(brandData => {
                // Para simplificar, vou tratar 'ELF BAR TE' e 'ELF BAR GH' como 'elf-bar'
                // Se quiser abas separadas para elas, precisaremos ajustar brandToTabId e o HTML.
                let tabId = brandToTabId[brandData.brand];

                // Ajusta para o caso específico de "ELF BAR"
                if (brandData.brand.includes("ELF BAR")) {
                    tabId = 'elf-bar';
                }

                const container = document.getElementById(tabId);

                if (container) {
                    brandData.products.forEach(product => {
                        const productHTML = `
                            <div class="product-card fade-in-scale">
                                <h4>${product.name}</h4>
                                <p class="price">R$${brandData.price.toFixed(2).replace('.', ',')}</p>
                                <button class="action-button add-to-cart-button" onclick="addToCart('${brandData.brand} - ${product.name}', ${brandData.price})">
                                    Adicionar ao Carrinho
                                </button>
                            </div>`;
                        container.innerHTML += productHTML;
                    });
                } else {
                    console.error(`Container para a marca '${brandData.brand}' (tabId: '${tabId}') não encontrado.`);
                }
            });

            // ATENÇÃO: setupTabs() e setupIntersectionObserver() DEVEM ser chamados AQUI,
            // depois que todos os produtos foram inseridos no DOM.
            setupTabs();
            // Ativa a primeira aba por padrão
            document.querySelector('.tab-link.active').click();
            setupIntersectionObserver();

        })
        .catch(error => {
            console.error('Erro fatal ao carregar os produtos:', error);
            document.querySelector('.tabs-content').innerHTML = '<p style="text-align:center; color:red; padding: 30px;">Não foi possível carregar os produtos. Verifique o console para mais detalhes.</p>';
        });
}


function setupTabs() {
    const tabLinks = document.querySelectorAll('.tabs-nav .tab-link');
    const tabPanels = document.querySelectorAll('.tabs-content .tab-content-panel');

    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // Impede o comportamento padrão, se houver
            
            // Remove 'active' de todos
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Adiciona 'active' ao link clicado
            link.classList.add('active');

            // Adiciona 'active' ao painel correspondente
            const targetPanelId = link.getAttribute('data-tab');
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                // Re-observa os cards para novas animações ao trocar de aba
                setupIntersectionObserver();
            }
        });
    });

    // Ativa a primeira aba no carregamento inicial, se houver
    const firstActiveTab = document.querySelector('.tab-link.active');
    if (firstActiveTab) {
        firstActiveTab.click(); // Simula o clique para ativar o painel
    }
}


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
        }, 500); // Aguarda a animação de saída
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
    const cards = document.querySelectorAll('.tab-content-panel.active .product-card'); // Seleciona apenas cards na aba ativa
    
    // Desconecta qualquer observer anterior para evitar duplicidade
    if (window.productCardObserver) {
        window.productCardObserver.disconnect();
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${index * 80}ms`; // Aumenta um pouco o delay
                entry.target.classList.add('visible');
                entry.target.classList.add('fade-in-scale'); // Garante que a classe de animação está lá
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    cards.forEach(card => {
        card.classList.remove('visible'); // Reseta o estado para re-animar
        card.style.animation = 'none'; // Reseta a animação anterior
        void card.offsetWidth; // Força um reflow para resetar a animação
        card.style.animation = null; // Remove a instrução 'none'
        observer.observe(card);
    });

    window.productCardObserver = observer; // Armazena o observer para desconectar depois
}

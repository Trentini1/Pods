document.addEventListener('DOMContentLoaded', () => {
    loadProductsAndSetupTabs();
    setupModal(); // A lógica do modal não muda
});

function setupTabs() {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabPanels = document.querySelectorAll('.tab-content-panel');

    tabLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Remove 'active' de todos
            tabLinks.forEach(l => l.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            // Adiciona 'active' ao clicado e ao seu painel correspondente
            link.classList.add('active');
            const targetPanelId = link.getAttribute('data-tab');
            const targetPanel = document.getElementById(targetPanelId);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

function loadProductsAndSetupTabs() {
    fetch('products/products.json')
        .then(response => {
            if (!response.ok) throw new Error(`Erro de rede! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            // Mapeia as marcas do JSON para os IDs das abas no HTML
            const brandToTabId = {
                'BLACK SHEEP 20k': 'black-sheep',
                'ELF BAR TE 30k': 'elf-bar',
                'ELF BAR GH23k': 'elf-bar', // Ambas Elf Bar vão para a mesma aba
                'SEX ADDICT S280k': 'sex-addict',
                'IGNITE V80': 'ignite'
            };

            data.forEach(brandData => {
                const tabId = brandToTabId[brandData.brand];
                const container = document.getElementById(tabId);

                if (container) {
                    brandData.products.forEach(product => {
                        const productHTML = `
                            <div class="product-card">
                                <h4>${product.name}</h4>
                                <p class="price">R$${brandData.price.toFixed(2).replace('.', ',')}</p>
                                <button class="action-button add-to-cart-button" onclick="addToCart('${brandData.brand} - ${product.name}', ${brandData.price})">
                                    Adicionar ao Carrinho
                                </button>
                            </div>`;
                        container.innerHTML += productHTML;
                    });
                }
            });

            // Após carregar todos os produtos, configuramos as abas e as animações de rolagem
            setupTabs();
            setupIntersectionObserver();
        })
        .catch(error => {
            console.error('Erro fatal ao carregar os produtos:', error);
            document.querySelector('.tabs-content').innerHTML = '<p style="text-align:center; color:red;">Não foi possível carregar os produtos.</p>';
        });
}

function setupIntersectionObserver() {
    const cards = document.querySelectorAll('.product-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Adiciona um pequeno delay para cada card aparecer em sequência
                entry.target.style.animationDelay = `${index * 50}ms`;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1, // O card anima quando 10% dele estiver visível
        rootMargin: "0px 0px -50px 0px" // Começa a carregar um pouco antes de chegar no card
    });

    cards.forEach(card => {
        observer.observe(card);
    });
}

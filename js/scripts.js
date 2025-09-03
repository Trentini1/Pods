document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupModal();
});

function loadProducts() {
    fetch('products/products.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro de rede! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const productsContainer = document.getElementById('products');
            if (!productsContainer) {
                console.error("Elemento 'products' não encontrado no DOM!");
                return;
            }

            data.forEach(brandData => {
                let brandHTML = `<h3>${brandData.brand}</h3>`;
                brandData.products.forEach(product => {
                    brandHTML += `
                        <div class="product-card">
                            <h4>${product.name}</h4>
                            <p class="price">R$${brandData.price.toFixed(2).replace('.', ',')}</p>
                            <button class="action-button add-to-cart-button" onclick="addToCart('${brandData.brand} - ${product.name}', ${brandData.price})">
                                Adicionar ao Carrinho
                            </button>
                        </div>
                    `;
                });
                // Adiciona o HTML da marca e seus produtos de uma vez
                productsContainer.innerHTML += brandHTML;
            });

            // CHAME A FUNÇÃO DE ANIMAÇÃO AQUI!
            // Isso garante que os cards de produto já existem quando a animação for configurada.
            setupIntersectionObserver();
        })
        .catch(error => {
            console.error('Erro fatal ao carregar os produtos:', error);
            // Mostra uma mensagem de erro para o usuário na tela
            document.getElementById('products').innerHTML = '<p style="text-align:center; color:red;">Não foi possível carregar os produtos. Verifique o console para mais detalhes.</p>';
        });
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
    const cards = document.querySelectorAll('.product-card');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationDelay = `${entries.indexOf(entry) * 100}ms`;
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    cards.forEach(card => {
        observer.observe(card);
    });
}

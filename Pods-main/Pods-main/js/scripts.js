document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupModal();
});

function loadProducts() {
    fetch('products/products.json')
        .then(response => response.json())
        .then(data => {
            const productsContainer = document.getElementById('products');
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
                productsContainer.innerHTML += brandHTML;
            });
            setupIntersectionObserver();
        })
        .catch(error => console.error('Erro ao carregar os produtos:', error));
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

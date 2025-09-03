let cart = JSON.parse(localStorage.getItem('vipPodsCart')) || [];

function addToCart(productName, productPrice) {
    const existingProduct = cart.find(item => item.name === productName);
    if (existingProduct) {
        existingProduct.quantity++;
    } else {
        cart.push({ name: productName, price: productPrice, quantity: 1 });
    }
    saveCart();
    updateCartDisplay();
    showToast(`${productName.split(' - ')[1]} adicionado!`);
}

function removeFromCart(productName) {
    const itemIndex = cart.findIndex(item => item.name === productName);
    if (itemIndex > -1) {
        cart[itemIndex].quantity--;
        if (cart[itemIndex].quantity === 0) {
            cart.splice(itemIndex, 1);
        }
    }
    saveCart();
    updateCartDisplay();
}

function updateCartDisplay() {
    const cartItemsEl = document.getElementById('cart-items');
    const cartCountEl = document.getElementById('cart-count');
    const cartTotalEl = document.getElementById('cart-total-price');
    
    cartItemsEl.innerHTML = '';
    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalItems += item.quantity;
        totalPrice += itemTotal;

        cartItemsEl.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h5>${item.name}</h5>
                    <p>R$ ${itemTotal.toFixed(2).replace('.', ',')}</p>
                </div>
                <div class="cart-item-actions">
                    <button onclick="removeFromCart('${item.name}')">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="addToCart('${item.name}', ${item.price})">+</button>
                </div>
            </div>`;
    });

    cartCountEl.innerText = totalItems;
    cartTotalEl.innerText = `R$${totalPrice.toFixed(2).replace('.', ',')}`;
    
    if (cart.length === 0) {
        cartItemsEl.innerHTML = '<p style="text-align:center; padding: 20px;">Seu carrinho está vazio.</p>';
    }
}

function generateWhatsAppMessage() {
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let message = "Olá, Vip Pods! Gostaria de fazer o seguinte pedido:\n\n";
    let totalPrice = 0;

    cart.forEach(item => {
        message += `*${item.quantity}x* ${item.name}\n`;
        totalPrice += item.price * item.quantity;
    });

    message += `\n*Total do Pedido: R$${totalPrice.toFixed(2).replace('.', ',')}*`;

    const whatsappUrl = `https://wa.me/5541995252161?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

function saveCart() {
    localStorage.setItem('vipPodsCart', JSON.stringify(cart));
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 500);
    }, 2500);
}

// Atualiza o display ao carregar a página
document.addEventListener('DOMContentLoaded', updateCartDisplay);

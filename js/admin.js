// ATENÇÃO: Cole a URL do seu Firebase Realtime Database aqui!
const FIREBASE_URL = 'https://vip-pods-estoque-default-rtdb.firebaseio.com/stock.json'; // SUBSTITUA PELA SUA URL

// ATENÇÃO: Defina sua senha de administrador aqui!
const ADMIN_PASSWORD = 'vip'; // MUDE PARA UMA SENHA SEGURA

document.addEventListener('DOMContentLoaded', () => {
    const loginSection = document.getElementById('login-section');
    const stockSection = document.getElementById('stock-section');
    const loginButton = document.getElementById('login-button');
    const passwordInput = document.getElementById('password-input');

    loginButton.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            loginSection.style.display = 'none';
            stockSection.style.display = 'block';
            loadAdminStock();
        } else {
            alert('Senha incorreta!');
        }
    });

    const saveAllButton = document.getElementById('save-all-button');
    saveAllButton.addEventListener('click', saveAllStock);
});

async function loadAdminStock() {
    try {
        // 1. Carrega a lista de produtos do JSON local
        const productsResponse = await fetch('../products/products.json');
        const productData = await productsResponse.json();

        // 2. Carrega os dados de estoque do Firebase
        const stockResponse = await fetch(FIREBASE_URL);
        const stockData = await stockResponse.json() || {}; // Se não houver nada, usa um objeto vazio

        // 3. Monta a lista no HTML
        const stockList = document.getElementById('stock-list');
        stockList.innerHTML = ''; // Limpa a lista

        productData.forEach(brand => {
            stockList.innerHTML += `<h3>${brand.brand}</h3>`;
            brand.products.forEach(product => {
                const currentStock = stockData[product.id] || 0; // Pega o estoque atual ou define 0
                stockList.innerHTML += `
                    <div class="stock-item" data-id="${product.id}">
                        <label>${product.name}</label>
                        <input type="number" value="${currentStock}" min="0">
                    </div>
                `;
            });
        });

    } catch (error) {
        console.error("Erro ao carregar dados para o admin:", error);
        alert("Não foi possível carregar os dados. Verifique o console.");
    }
}

async function saveAllStock() {
    const stockItems = document.querySelectorAll('.stock-item');
    let newStockData = {};

    stockItems.forEach(item => {
        const productId = item.getAttribute('data-id');
        const stockValue = item.querySelector('input').value;
        newStockData[productId] = parseInt(stockValue, 10);
    });

    try {
        const response = await fetch(FIREBASE_URL, {
            method: 'PUT', // PUT sobrescreve todos os dados de estoque
            body: JSON.stringify(newStockData),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Falha ao salvar no Firebase');
        }

        alert('Estoque atualizado com sucesso!');

    } catch (error) {
        console.error("Erro ao salvar o estoque:", error);
        alert("Ocorreu um erro ao salvar. Verifique o console.");
    }
}

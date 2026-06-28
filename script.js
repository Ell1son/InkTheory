let cart = [];

const buttons = document.querySelectorAll(".cart-btn");
const counter = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartWindow = document.querySelector(".cart-window");
const cartItems = document.querySelector(".cart-items");
const clearBtn = document.querySelector(".clear-cart");
const checkoutBtn = document.querySelector(".checkout-btn");

// Вспомогательная функция для безопасного вывода текста в HTML (нужна для buyNow)
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// =========================================================================
// ДАННЫЕ О ТОВАРАХ И ИХ ТЕКУЩЕМ ВЫБОРЕ ДЛЯ МОДАЛКИ PAYPAL
// =========================================================================

// База данных товаров (цены, названия и пути к картинкам для каждого цвета)
const products = [
    { id: 'never', name: 'Never Give Up', price: 15.00, colors: { black: 'images/never.png', white: 'images/never.png' } },
    { id: 'chaos', name: 'Chaos', price: 15.00, colors: { black: 'images/chaos.png', white: 'images/chaos.png' } },
    { id: 'summer', name: 'Summer Vibes', price: 15.00, colors: { black: 'images/summer-black.png', white: 'images/summer.png' } },
    { id: 'drive', name: 'Tokyo Drive', price: 15.00, colors: { black: 'images/drive.png', white: 'images/drive-white.png' } },
    { id: 'samurai', name: 'Shadow Ronin', price: 15.00, colors: { black: 'images/Samurai.png', white: 'images/Samurai.png' } }
];

// Глобальный объект, где хранится текущий выбор (цвет и размер) для каждого товара
const catalogSelection = {
    never: { color: 'black', size: 'S' },
    chaos: { color: 'white', size: 'S' },
    summer: { color: 'black', size: 'S' },
    drive: { color: 'black', size: 'S' },
    samurai: { color: 'black', size: 'S' }
};

// Функция отслеживания того, что выбирает пользователь в каталоге
function updateCatalogSelection() {
    document.querySelectorAll('.product-card').forEach(card => {
        const prodId = card.getAttribute('data-product-id');
        if (!prodId || !catalogSelection[prodId]) return;

        const colorSelect = card.querySelector('.color-select');
        const sizeSelect = card.querySelectorAll('.options select')[1]; // второй select — это размер

        if (colorSelect) {
            catalogSelection[prodId].color = colorSelect.value;
            colorSelect.addEventListener('change', (e) => {
                catalogSelection[prodId].color = e.target.value;
            });
        }
        if (sizeSelect) {
            catalogSelection[prodId].size = sizeSelect.value;
            sizeSelect.addEventListener('change', (e) => {
                catalogSelection[prodId].size = e.target.value;
            });
        }
    });
}
// Запускаем отслеживание селектов сразу при загрузке
updateCatalogSelection();


// =========================================================================
// ФУНКЦИЯ БЫСТРОЙ ОПЛАТЫ ЧЕРЕЗ МОДАЛЬНОЕ ОКНО PAYPAL
// =========================================================================
function buyNow(prodId) {
    const product = products.find(p => p.id === prodId);
    if (!product) return;

    const selection = catalogSelection[prodId];
    const currentImgPath = product.colors[selection.color] || product.colors['black'];

    // 1. Находим или создаем фоновую подложку модалки
    let payModal = document.getElementById('paypal-fast-modal');
    if (!payModal) {
        payModal = document.createElement('div');
        payModal.id = 'paypal-fast-modal';
        payModal.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
        `;
        document.body.appendChild(payModal);
    }

    // Получаем текущие переводы для модалки из словаря (если они там есть) или пишем дефолтные
    const d = dictionary[activeLang] || dictionary['ru'];
    const colorText = selection.color === 'black' ? (d.clrBlack || 'Черный') : (d.clrWhite || 'Белый');
    const sizeLabel = d.lblSize || 'Размер';
    const colorLabel = d.lblColor || 'Цвет';

    payModal.innerHTML = `
        <div style="background: #111; padding: 30px; border-radius: 12px; border: 1px solid #222; width: 95%; max-width: 650px; position: relative; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.7); font-family: sans-serif; color: #fff;
            max-height: 90vh; 
            display: flex; flex-direction: column; box-sizing: border-box;">
           
            <button id="closeFastModal" style="position: absolute; top: 12px; right: 15px; background: none; border: none; color: #888; font-size: 28px; cursor: pointer; line-height: 1; z-index: 10;">&times;</button>
           
            <div style="flex-shrink: 0;">
                <div style="width: 130px; height: 130px; margin: 0 auto 15px auto; background: #1a1a1a; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${currentImgPath}" alt="${escapeHTML(product.name)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <h3 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 600;">${escapeHTML(productNames[prodId] ? productNames[prodId][activeLang] : product.name)}</h3>
                <p style="margin: 0 0 12px 0; color: #888; font-size: 14px;">${sizeLabel}: ${selection.size} | ${colorLabel}: ${colorText}</p>
                <p style="margin: 0 0 25px 0; font-size: 22px; font-weight: bold; color: #fff;">${product.price.toFixed(2)} €</p>
            </div>
           
            <div id="paypal-fast-container" style="flex: 1; overflow-y: auto; padding-right: 2px; width: 100%; box-sizing: border-box;"></div>
        </div>
    `;

    payModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    document.getElementById('closeFastModal').addEventListener('click', () => {
        payModal.style.display = 'none';
        document.body.style.overflow = '';
    });

    // 3. Рендерим кнопки PayPal SDK
    if (window.paypal && window.paypal.Buttons) {
        window.paypal.Buttons({
            style: {
                layout: 'vertical',
                color:  'gold',
                shape:  'rect',
                label:  'buynow'
            },
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        description: `Покупка: ${product.name} (${selection.size}/${selection.color})`,
                        amount: {
                            currency_code: "EUR",
                            value: product.price.toFixed(2)
                        }
                    }]
                });
            },
            onApprove: function(data, actions) {
                return actions.order.capture().then(function(details) {
                    showMessage(d.msgAdded ? "Оплата успешно прошла! ✔" : "Success! ✔");
                    payModal.style.display = 'none';
                    document.body.style.overflow = '';
                });
            },
            onError: function(err) {
                console.error("PayPal Error: ", err);
                showMessage("PayPal Error ❌");
            }
        }).render('#paypal-fast-container');
    }
}


// Добавление товара в корзину (Оставлено без изменений)
buttons.forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".product-card");
        const name = card.querySelector("h3").textContent;
        const price = card.querySelector(".product-price").textContent;
        const image = card.querySelector(".product-image").src;
        const size = card.querySelector(".options select:last-of-type").value;

        cart.push({ name, price, image, size });
        updateCart();
        showMessage(dictionary[activeLang].msgAdded);
    });
});

// Обновление корзины
function updateCart() {
    counter.textContent = cart.length;
    const totalElement = document.querySelector(".cart-total");

    if (cart.length === 0) {
        cartItems.innerHTML = `<p id="lang-cart-empty">${dictionary[activeLang].cartEmpty}</p>`;
        if(totalElement){
            totalElement.textContent = dictionary[activeLang].cartTotal + "0 €";
        }
        return;
    }

    cartItems.innerHTML = "";
    let total = 0;

    cart.forEach((item, index) => {
        const priceNumber = parseFloat(item.price);
        total += priceNumber;

        cartItems.innerHTML += `
        <div class="cart-product">
            <img src="${item.image}" class="cart-img">
            <div class="cart-info">
                <span>${item.name}</span>
                <small>${dictionary[activeLang].cartSize}${item.size}</small>
                <b>${item.price}</b>
            </div>
            <button class="remove-item" data-index="${index}">✕</button>
        </div>
        `;
    });

    if(totalElement){
        totalElement.textContent = dictionary[activeLang].cartTotal + total + " €";
    }

    document.querySelectorAll(".remove-item").forEach(button => {
        button.addEventListener("click", () => {
            const index = button.dataset.index;
            cart.splice(index, 1);
            updateCart();
            showMessage(dictionary[activeLang].msgRemoved);
        });
    });

    if (typeof applyCartTranslation === "function") {
        applyCartTranslation();
    }
}

// Открытие корзины
cartIcon.addEventListener("click", () => {
    cartWindow.classList.toggle("active");
});

// Очистка корзины
clearBtn.addEventListener("click", () => {
    cart = [];
    updateCart();
    showMessage(dictionary[activeLang].msgCleared);
});

// Переход к оплате из корзины
checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
        showMessage(dictionary[activeLang].msgEmpty);
        return;
    }
    window.open("https://www.paypal.com/ncp/payment/6EME7F92SFN36", "_blank");
});

// Уведомления (Заменено внутреннее имя для совместимости)
function showMessage(text) {
    let message = document.querySelector(".cart-message");
    if (!message) {
        message = document.createElement("div");
        message.className = "cart-message";
        document.body.appendChild(message);
    }
    message.textContent = text;
    message.classList.add("show");
    setTimeout(() => {
        message.classList.remove("show");
    }, 1500);
}

// Смена цвета товара
const colorSelects = document.querySelectorAll(".color-select");
colorSelects.forEach(select => {
    select.addEventListener("change", () => {
        const card = select.closest(".product-card");
        const image = card.querySelector(".product-image");
        const color = select.value;
        const newImage = image.dataset[color];

        if (newImage) {
            image.src = newImage;
        } else {
            showMessage(dictionary[activeLang].msgColorUnavailable);
        }
    });
});

// Живой Поиск
const searchInput = document.getElementById("search-input");
if (searchInput) {
    searchInput.addEventListener("input", function() {
        const query = searchInput.value.toLowerCase().trim();
        const cards = document.querySelectorAll(".product-card");
        
        cards.forEach(card => {
            const title = card.querySelector("h3").textContent.toLowerCase();
            if (title.includes(query)) {
                card.style.display = ""; 
            } else {
                card.style.display = "none"; 
            }
        });
    });
}

// Словарь названий
const productNames = {
    never: { ru: "Never Give Up", en: "Never Give Up", et: "Ära anna kunagi alla" },
    chaos: { ru: "Chaos", en: "Chaos", et: "Kaos" },
    summer: { ru: "Summer Vibes", en: "Summer Vibes", et: "Suve meeleolu" },
    drive: { ru: "Tokyo Drive", en: "Tokyo Drive", et: "Tokyo Sõit" },
    samurai: { ru: "Shadow Ronin", en: "Shadow Ronin", et: "Varju Ronin" }
};

// Полный словарь мультиязычности
const dictionary = {
    ru: {
        navCatalog: "Каталог", navCollections: "О нас", navContacts: "Контакты", searchPlh: "Поиск...",
        cartTitle: "Корзина", cartEmpty: "Корзина пустая", cartCheckout: "Перейти к оплате", cartClear: "Очистить", cartTotal: "Итого: ", cartSize: "Размер: ",
        heroSubtitle: "Чернила, которые говорят<br>за тебя.", heroBtn: "Перейти в каталог", catalogTitle: "Каталог",
        lblColor: "Цвет", lblSize: "Размер", clrBlack: "Черный", clrWhite: "Белый", btnAdd: "Добавить в корзину", btnBuy: "Купить сейчас",
        ftAbout: "Мы создаём одежду с уникальными принтами, вдохновлёнными искусством, культурой и современным дизайном.",
        ftContacts: "Контакты и Социальные сети", ftSocials: "Социальные сети",
        msgAdded: "Товар добавлен в корзину ✓", msgRemoved: "Товар удалён", msgCleared: "Корзина очищена", msgEmpty: "Корзина пустая", msgCheckout: "Переходим к оплате 💳", msgColorUnavailable: "❌ Этот цвет недоступен"
    },
    en: {
        navCatalog: "Catalog", navCollections: "About us", navContacts: "Contacts", searchPlh: "Search...",
        cartTitle: "Cart", cartEmpty: "Cart is empty", cartCheckout: "Checkout", cartClear: "Clear", cartTotal: "Total: ", cartSize: "Size: ",
        heroSubtitle: "Inks that speak<br>for you.", heroBtn: "Go to catalog", catalogTitle: "Catalog",
        lblColor: "Color", lblSize: "Size", clrBlack: "Black", clrWhite: "White", btnAdd: "Add to cart", btnBuy: "Buy now",
        ftAbout: "We create clothing with unique prints inspired by art, culture, and modern design.",
        ftContacts: "Contacts and Social Networks", ftSocials: "Social Networks",
        msgAdded: "Item added to cart ✓", msgRemoved: "Item removed", msgCleared: "Cart cleared", msgEmpty: "Cart is empty", msgCheckout: "Proceeding to checkout 💳", msgColorUnavailable: "❌ This color is unavailable"
    },
    et: {
        navCatalog: "Kataloog", navCollections: "Meie kohta", navContacts: "Kontaktid", searchPlh: "Otsi...",
        cartTitle: "Ostukorv", cartEmpty: "Ostukorv on tühi", cartCheckout: "Vormista ost", cartClear: "Tühjenda", cartTotal: "Kokku: ", cartSize: "Suurus: ",
        heroSubtitle: "Tindid, mis räägivad<br>Sinu eest.", heroBtn: "Mine kataloogi", catalogTitle: "Kataloog",
        lblColor: "Värv", lblSize: "Suurus", clrBlack: "Must", clrWhite: "Valge", btnAdd: "Lisa ostukorvi", btnBuy: "Osta kohe",
        ftAbout: "Loome unikaalsete printidega rõivaid, mis on inspireeritud kunstist, kultuurist ja kaasegsest disainist.",
        ftContacts: "Kontaktid ja sotsiaalmeedia", ftSocials: "Sotsiaalmeedia",
        msgAdded: "Toode lisatud ostukorvi ✓", msgRemoved: "Toode eemaldatud", msgCleared: "Ostukorv tühjendatud", msgEmpty: "Ostukorv on tühi", msgCheckout: "Suundume maksmisele 💳", msgColorUnavailable: "❌ See värv pole saadaval"
    }
};

let activeLang = "ru";

function applyCartTranslation() {
    const d = dictionary[activeLang];
    const cartTitleEl = document.getElementById("lang-cart-title");
    const cartEmptyEl = document.getElementById("lang-cart-empty");
    if (cartTitleEl) cartTitleEl.textContent = d.cartTitle;
    if (cartEmptyEl) cartEmptyEl.textContent = d.cartEmpty;
    
    const totalEl = document.querySelector(".cart-total");
    if (totalEl && cart.length > 0) {
        let totalSum = 0;
        cart.forEach(item => totalSum += parseFloat(item.price));
        totalEl.textContent = d.cartTotal + totalSum + " €";
    } else if (totalEl) {
        totalEl.textContent = d.cartTotal + "0 €";
    }
    
    document.querySelectorAll(".cart-product").forEach(cartProd => {
        const nameSpan = cartProd.querySelector(".cart-info span");
        const sizeSmall = cartProd.querySelector(".cart-info small");
        
        if (nameSpan) {
            let origName = nameSpan.textContent;
            for (let id in productNames) {
                if (productNames[id].ru === origName || productNames[id].en === origName || productNames[id].et === origName) {
                    nameSpan.textContent = productNames[id][activeLang];
                    break;
                }
            }
        }
        if (sizeSmall) {
            const currentSize = sizeSmall.textContent.replace("Размер:", "").replace("Size:", "").replace("Suurus:", "").trim();
            sizeSmall.textContent = d.cartSize + currentSize;
        }
    });
}

const langSelect = document.getElementById("language-select");
if (langSelect) {
    langSelect.addEventListener("change", (e) => {
        activeLang = e.target.value;
        const d = dictionary[activeLang];
        
        document.getElementById("lang-nav-catalog").textContent = d.navCatalog;
        document.getElementById("lang-nav-collections").textContent = d.navCollections;
        document.getElementById("lang-nav-contacts").textContent = d.navContacts;
        document.getElementById("search-input").placeholder = d.searchPlh;
        
        document.getElementById("lang-hero-subtitle").innerHTML = d.heroSubtitle;
        document.getElementById("lang-hero-btn").textContent = d.heroBtn;
        
        document.getElementById("lang-catalog-title").textContent = d.catalogTitle;
        
        document.querySelectorAll(".product-card").forEach(card => {
            const pId = card.getAttribute("data-product-id");
            if (pId && productNames[pId]) {
                card.querySelector(".lang-p-title").textContent = productNames[pId][activeLang];
            }
        });
        
        document.querySelectorAll(".lang-label-color").forEach(el => el.textContent = d.lblColor);
        document.querySelectorAll(".lang-label-size").forEach(el => el.textContent = d.lblSize);
        document.querySelectorAll(".lang-color-black").forEach(el => el.textContent = d.clrBlack);
        document.querySelectorAll(".lang-color-white").forEach(el => el.textContent = d.clrWhite);
        document.querySelectorAll(".lang-btn-add").forEach(el => el.textContent = d.btnAdd);
        document.querySelectorAll(".lang-btn-buy").forEach(el => el.textContent = d.btnBuy);
        
        document.getElementById("lang-cart-checkout").textContent = d.cartCheckout;
        document.getElementById("lang-cart-clear").textContent = d.cartClear;
        applyCartTranslation();
        
        document.getElementById("lang-footer-about").textContent = d.ftAbout;
        document.getElementById("lang-footer-contacts-title").textContent = d.ftContacts;
        document.getElementById("lang-footer-socials").textContent = d.ftSocials;
    });
}

// =========================================================================
// ИЗМЕНЕННЫЙ ОБРАБОТЧИК КЛИКА «КУПИТЬ СЕЙЧАС» — ТЕПЕРЬ ВЫЗЫВАЕТ buyNow()
// =========================================================================
document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".product-card");
        const prodId = card.getAttribute("data-product-id");

        if (prodId) {
            // Вызываем вашу функцию быстрого заказа PayPal
            buyNow(prodId);
        }
    });
});
let cart = [];

const buttons = document.querySelectorAll(".cart-btn");
const counter = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartWindow = document.querySelector(".cart-window");
const cartItems = document.querySelector(".cart-items");
const clearBtn = document.querySelector(".clear-cart");
const checkoutBtn = document.querySelector(".checkout-btn");

// Вспомогательная функция для безопасного вывода текста в HTML
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// Стоимость доставки
const shippingRates = {
    "omniva": 2.99,
    "dpd": 2.99,
    "europe": 2.99
};

// =========================================================================
// ДАННЫЕ О ТОВАРАХ И ИХ ТЕКУЩЕМ ВЫБОРЕ ДЛЯ МОДАЛКИ PAYPAL
// =========================================================================

    const products = [
    { id: 'never', name: 'Never Give Up', price: 15.00, colors: { black: 'images/never.png', white: 'images/Never Give Up.png' } },
    { id: 'chaos', name: 'Chaos', price: 15.00, colors: { black: 'images/Chaos (2).png', white: 'images/Chaos (2).png' } },
    { id: 'summer', name: 'Summer Vibes', price: 15.00, colors: { black: 'images/Summer Vibes Black.png', white: 'images/Summer Vibes White.png' } },
    { id: 'drive', name: 'Tokyo Drive', price: 15.00, colors: { black: 'images/Tokyo Drive Black.png', white: 'images/Tokyo Drive White.png' } },
    { id: 'samurai', name: 'Shadow Ronin', price: 15.00, colors: { black: 'images/Shadow ronin Black.png', white: 'images/Shadow ronin Black.png' } }
];

const catalogSelection = {
    never: { color: 'black', size: 'S' },
    chaos: { color: 'white', size: 'S' },
    summer: { color: 'black', size: 'S' },
    drive: { color: 'black', size: 'S' },
    samurai: { color: 'black', size: 'S' }
};

function updateCatalogSelection() {
    document.querySelectorAll('.product-card').forEach(card => {
        const prodId = card.getAttribute('data-product-id');
        if (!prodId || !catalogSelection[prodId]) return;

        const colorSelect = card.querySelector('.color-select');
        const sizeSelect = card.querySelectorAll('.options select')[1];

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
updateCatalogSelection();

// =========================================================================
// ФУНКЦИЯ БЫСТРОЙ ОПЛАТЫ + СБОР ДАННЫХ ДОСТАВКИ
// =========================================================================
// =========================================================================
// ФУНКЦИЯ БЫСТРОЙ ОПЛАТЫ + СБОР ДАННЫХ ДОСТАВКИ И РАСЧЕТ СУММЫ
// =========================================================================
function buyNow(prodId) {
    const product = products.find(p => p.id === prodId);
    if (!product) return;

    const selection = catalogSelection[prodId];
    const currentImgPath = product.colors[selection.color] || product.colors['black'];

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

    const d = dictionary[activeLang] || dictionary['ru'];
    const colorText = selection.color === 'black' ? (d.clrBlack || 'Черный') : (d.clrWhite || 'Белый');
    const orderId = 'INK-' + Math.floor(Math.random() * 100000);

    // Локализация текстов
    const txtName = activeLang === 'et' ? 'Sinu nimi' : (activeLang === 'en' ? 'Full Name' : 'Ваше Имя и Фамилия');
    const txtPhone = activeLang === 'et' ? 'Telefoninumber (SMS jaoks)' : (activeLang === 'en' ? 'Phone (for SMS)' : 'Телефон (для SMS)');
    const txtMethod = activeLang === 'et' ? 'Tarneviis' : (activeLang === 'en' ? 'Shipping Method' : 'Способ доставки');
    const txtAddress = activeLang === 'et' ? 'Pakiautomaadi või pakiautomaadi aadress' : (activeLang === 'en' ? 'Parcel locker or home address' : 'Адрес автомата (или домашний адрес)');
    const txtBtnSave = activeLang === 'et' ? 'Kinnita andmed' : (activeLang === 'en' ? 'Confirm Details' : 'Подтвердить данные');
    const txtTotal = activeLang === 'et' ? 'Kokku tasumisele' : (activeLang === 'en' ? 'Total to pay' : 'Итого к оплате');

    // Начальная сумма (цена товара + дефолтная доставка Omniva 3.50)
    let initialShipping = shippingRates["omniva"];
    let initialTotal = product.price + initialShipping;

    payModal.innerHTML = `
        <div style="background: #111; padding: 25px; border-radius: 12px; border: 1px solid #222; width: 95%; max-width: 500px; position: relative; text-align: center; color: #fff; max-height: 95vh; display: flex; flex-direction: column; box-sizing: border-box; overflow-y: auto;">
           
            <button id="closeFastModal" style="position: absolute; top: 12px; right: 15px; background: none; border: none; color: #888; font-size: 28px; cursor: pointer; line-height: 1; z-index: 10;">&times;</button>
           
            <div style="flex-shrink: 0;">
                <div style="width: 90px; height: 90px; margin: 0 auto 10px auto; background: #1a1a1a; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    <img src="${currentImgPath}" alt="${escapeHTML(product.name)}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                </div>
                <h3 style="margin: 0 0 4px 0; font-size: 18px;">${escapeHTML(productNames[prodId] ? productNames[prodId][activeLang] : product.name)}</h3>
                <p style="margin: 0 0 15px 0; color: #888; font-size: 13px;">${d.lblSize}: ${selection.size} | ${d.lblColor}: ${colorText}</p>
            </div>
           
            <!-- Форма сбора адреса доставки -->
            <form id="fastOrderForm" action="https://formsubmit.co/lyvero.company@gmail.com" method="POST" style="text-align: left; display: flex; flex-direction: column; gap: 10px;">
                <input type="hidden" name="_captcha" value="false">
                <input type="hidden" name="order_id" value="${orderId}">
                <input type="hidden" name="product" value="${product.name} (${selection.size}/${selection.color})">
                <input type="hidden" name="total_price" id="hiddenTotalInput" value="${initialTotal.toFixed(2)} €">

                <label style="font-size: 13px; color: #aaa;">${txtName}:</label>
                <input type="text" name="customer_name" required style="padding: 8px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px;">

                <label style="font-size: 13px; color: #aaa;">${txtPhone}:</label>
                <input type="tel" name="customer_phone" required placeholder="+372..." style="padding: 8px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px;">

                <label style="font-size: 13px; color: #aaa;">${txtMethod}:</label>
                <select name="shipping_method" id="fastShippingMethod" required style="padding: 8px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px;">
                    <option value="omniva">Omniva Pakiautomaat (€2.99)</option>
                    <option value="dpd">DPD Pakiautomaat (€2.99)</option>
                    <option value="europe">Smartposti Pakiautomaat (€2.99)</option>
                </select>

                <label style="font-size: 13px; color: #aaa;">${txtAddress}:</label>
                <textarea name="delivery_address" required rows="2" placeholder="Таллинн, Kaubamaja Omniva..." style="padding: 8px; background: #222; border: 1px solid #333; color: #fff; border-radius: 6px; resize: none;"></textarea>

                <!-- Динамический текст итоговой стоимости -->
                <div style="margin-top: 5px; padding: 10px; background: #1a1a1a; border-radius: 6px; text-align: center; border: 1px dashed #333;">
                    <span style="font-size: 14px; color: #aaa;">${txtTotal}:</span>
                    <strong id="modalTotalDisplay" style="font-size: 18px; color: #fff; margin-left: 5px;">${initialTotal.toFixed(2)} €</strong>
                </div>

                <button type="submit" id="fastSubmitBtn" style="padding: 12px; background: #fff; color: #000; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; margin-top: 5px;">${txtBtnSave}</button>
            </form>

            <!-- Контейнер для PayPal -->
            <div id="paypal-fast-container" style="display: none; margin-top: 15px; min-height: 150px;">
                <p style="color: #4cd137; font-weight: bold; margin-bottom: 15px; font-size: 14px;">✓ Данные доставки сохранены. Оплатите заказ:</p>
                <div id="paypal-buttons-inside"></div>
            </div>
        </div>
    `;

    payModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const shippingSelect = document.getElementById('fastShippingMethod');
    const totalDisplay = document.getElementById('modalTotalDisplay');
    const hiddenTotalInput = document.getElementById('hiddenTotalInput');

    // Функция перерасчета стоимости «на лету»
    function recalculate() {
        const selectedShipping = shippingSelect.value;
        const shippingPrice = shippingRates[selectedShipping] || 0;
        const finalPrice = product.price + shippingPrice;
        
        totalDisplay.innerText = `${finalPrice.toFixed(2)} €`;
        hiddenTotalInput.value = `${finalPrice.toFixed(2)} €`; // Чтобы эта сумма улетала и вам на email
        return finalPrice;
    }

    // Слушаем изменения в выпадающем списке доставки
    shippingSelect.addEventListener('change', recalculate);

    // Закрытие модалки
    document.getElementById('closeFastModal').addEventListener('click', () => {
        payModal.style.display = 'none';
        document.body.style.overflow = '';
    });

    // Обработка отправки формы
    document.getElementById('fastOrderForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const form = this;
        const submitBtn = document.getElementById('fastSubmitBtn');
        const finalPrice = recalculate(); // Получаем актуальную сумму с доставкой

        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving...';

        // Отправка данных на почту
        fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        })
        .then(() => {
            form.style.display = 'none';
            document.getElementById('paypal-fast-container').style.display = 'block';
            
            // Запуск кнопок PayPal с обновленной ценой товара + доставки
            if (window.paypal && window.paypal.Buttons) {
                window.paypal.Buttons({
                    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'buynow' },
                    createOrder: function(data, actions) {
                        return actions.order.create({
                            purchase_units: [{
                                invoice_id: orderId,
                                description: `Заказ ${orderId}: ${product.name} (${selection.size}/${selection.color})`,
                                amount: {
                                    currency_code: "EUR",
                                    value: finalPrice.toFixed(2) // Передаем итоговую сумму
                                }
                            }]
                        });
                    },
                    onApprove: function(data, actions) {
                        return actions.order.capture().then(function(details) {
                            showMessage(activeLang === 'et' ? "Edukalt makstud! ✔" : "Success! ✔");
                            payModal.style.display = 'none';
                            document.body.style.overflow = '';
                        });
                    },
                    onError: function(err) {
                        console.error(err);
                        showMessage("PayPal Error ❌");
                    }
                }).render('#paypal-buttons-inside');
            }
        })
        .catch(() => {
            alert('Error saving data.');
            submitBtn.disabled = false;
            submitBtn.innerText = txtBtnSave;
        });
    });
}
// Переход к оплате из корзины (Оставлено без изменений)
checkoutBtn.addEventListener("click", () => {
    if (cart.length === 0) {
        showMessage(dictionary[activeLang].msgEmpty);
        return;
    }
    window.open("https://www.paypal.com/ncp/payment/6EME7F92SFN36", "_blank");
});

// Добавление товара в корзину
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

// Уведомления
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

document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".product-card");
        const prodId = card.getAttribute("data-product-id");

        if (prodId) {
            buyNow(prodId);
        }
    });
});
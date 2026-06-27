let cart = [];

const buttons = document.querySelectorAll(".cart-btn");
const counter = document.querySelector(".cart-count");
const cartIcon = document.querySelector(".cart-icon");
const cartWindow = document.querySelector(".cart-window");
const cartItems = document.querySelector(".cart-items");
const clearBtn = document.querySelector(".clear-cart");
const checkoutBtn = document.querySelector(".checkout-btn");



// Добавление товара

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const card = button.closest(".product-card");

        const name =
        card.querySelector("h3").textContent;

        const price =
        card.querySelector(".product-price").textContent;

        const image =
        card.querySelector(".product-image").src;

        const size =
        card.querySelector(".options select:last-of-type").value;

        cart.push({
            name,
            price,
            image,
            size
        });

        updateCart();

        // ИСПРАВЛЕНО: Текст уведомления теперь переводится
        showMessage(dictionary[activeLang].msgAdded);

    });

});



// Обновление корзины

function updateCart() {

    counter.textContent = cart.length;

    const totalElement =
    document.querySelector(".cart-total");



    if (cart.length === 0) {

        // ИСПРАВЛЕНО: Текст пустой корзины теперь берется из словаря переводов
        cartItems.innerHTML = `<p id="lang-cart-empty">${dictionary[activeLang].cartEmpty}</p>`;

        if(totalElement){
            // ИСПРАВЛЕНО: Слово "Итого" переводится
            totalElement.textContent = dictionary[activeLang].cartTotal + "0 €";
        }

        return;
    }



    cartItems.innerHTML = "";

    let total = 0;



    cart.forEach((item, index) => {

        const priceNumber =
        parseFloat(item.price);

        total += priceNumber;



        cartItems.innerHTML += `

        <div class="cart-product">

            <img
            src="${item.image}"
            class="cart-img">

            <div class="cart-info">

                <span>${item.name}</span>

                <small>
                    ${dictionary[activeLang].cartSize}${item.size}
                </small>

                <b>${item.price}</b>

            </div>

            <button
                class="remove-item"
                data-index="${index}">
                ✕
            </button>

        </div>

        `;

    });



    if(totalElement){

        // ИСПРАВЛЕНО: Слово "Итого" переводится при наличии товаров
        totalElement.textContent = dictionary[activeLang].cartTotal + total + " €";

    }



    document
    .querySelectorAll(".remove-item")
    .forEach(button => {

        button.addEventListener("click", () => {

            const index =
            button.dataset.index;

            cart.splice(index, 1);

            updateCart();

            // ИСПРАВЛЕНО: Текст уведомления об удалении теперь переводится
            showMessage(dictionary[activeLang].msgRemoved);

        });

    });

    // ИНТЕГРАЦИЯ: Дополнительный перевод динамического содержимого
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

    // ИСПРАВЛЕНО: Текст уведомления об очистке теперь переводится
    showMessage(dictionary[activeLang].msgCleared);

});



// Переход к оплате

checkoutBtn.addEventListener("click", () => {

    if (cart.length === 0) {

        showMessage(dictionary[activeLang].msgEmpty);
        return;
    }


    window.open(
        "https://www.paypal.com/ncp/payment/6EME7F92SFN36",
        "_blank"
    );

});



// Уведомления

function showMessage(text) {

    let message =
    document.querySelector(".cart-message");



    if (!message) {

        message =
        document.createElement("div");

        message.className =
        "cart-message";

        document.body.appendChild(message);

    }



    message.textContent = text;

    message.classList.add("show");



    setTimeout(() => {

        message.classList.remove("show");

    }, 1500);

}



// Смена цвета товара

const colorSelects =
document.querySelectorAll(".color-select");



colorSelects.forEach(select => {

    select.addEventListener("change", () => {

        const card =
        select.closest(".product-card");

        const image =
        card.querySelector(".product-image");

        const color =
        select.value;

        const newImage =
        image.dataset[color];



        if (newImage) {

            image.src = newImage;

        } else {

            // ИСПРАВЛЕНО: Текст ошибки цвета переводится
            showMessage(dictionary[activeLang].msgColorUnavailable);

        }

    });

});


// =========================================================================
// ФУНКЦИОНАЛ ПОИСКА И ПОЛНОГО ПЕРЕВОДА (ДОБАВЛЕН БЕЗ НАРУШЕНИЯ СТАРЫХ ФУНКЦИЙ)
// =========================================================================

// 1. Живой Поиск по названию
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

// Перевод названий самих товаров в каталоге
const productNames = {
    never: { ru: "Never Give Up", en: "Never Give Up", et: "Ära anna kunagi alla" },
    chaos: { ru: "Chaos", en: "Chaos", et: "Kaos" },
    summer: { ru: "Summer Vibes", en: "Summer Vibes", et: "Suve meeleolu" },
    drive: { ru: "Tokyo Drive", en: "Tokyo Drive", et: "Tokyo Sõit" },
    samurai: { ru: "Shadow Ronin", en: "Shadow Ronin", et: "Varju Ronin" }
};

// Полный словарь текстов интерфейса
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
        ftAbout: "Loome unikaalsete printidega rõivaid, mis on inspireeritud kunstist, kultuurist ja kaasaegsest disainist.",
        ftContacts: "Kontaktid ja sotsiaalmeedia", ftSocials: "Sotsiaalmeedia",
        msgAdded: "Toode lisatud ostukorvi ✓", msgRemoved: "Toode eemaldatud", msgCleared: "Ostukorv tühjendatud", msgEmpty: "Ostukorv on tühi", msgCheckout: "Suundume maksmisele 💳", msgColorUnavailable: "❌ See värv pole saadaval"
    }
};

let activeLang = "ru";

// Функция перевода текстов внутри корзины (срабатывает и при добавлении новых товаров)
function applyCartTranslation() {
    const d = dictionary[activeLang];
    
    // Перевод заголовка, пустой корзины и кнопок
    const cartTitleEl = document.getElementById("lang-cart-title");
    const cartEmptyEl = document.getElementById("lang-cart-empty");
    if (cartTitleEl) cartTitleEl.textContent = d.cartTitle;
    if (cartEmptyEl) cartEmptyEl.textContent = d.cartEmpty;
    
    // Перевод "Итого: X €"
    const totalEl = document.querySelector(".cart-total");
    if (totalEl && cart.length > 0) {
        let totalSum = 0;
        cart.forEach(item => totalSum += parseFloat(item.price));
        totalEl.textContent = d.cartTotal + totalSum + " €";
    } else if (totalEl) {
        totalEl.textContent = d.cartTotal + "0 €";
    }
    
    // Перевод названий и размера вещей внутри корзины
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

// Функция изменения языка для всего сайта
const langSelect = document.getElementById("language-select");
if (langSelect) {
    langSelect.addEventListener("change", (e) => {
        activeLang = e.target.value;
        const d = dictionary[activeLang];
        
        // 1. Панель навигации и поиск
        document.getElementById("lang-nav-catalog").textContent = d.navCatalog;
        document.getElementById("lang-nav-collections").textContent = d.navCollections;
        document.getElementById("lang-nav-contacts").textContent = d.navContacts;
        document.getElementById("search-input").placeholder = d.searchPlh;
        
        // 2. Баннер (Hero block)
        document.getElementById("lang-hero-subtitle").innerHTML = d.heroSubtitle;
        document.getElementById("lang-hero-btn").textContent = d.heroBtn;
        
        // 3. Каталог
        document.getElementById("lang-catalog-title").textContent = d.catalogTitle;
        
        // Перевод названий товаров на карточках
        document.querySelectorAll(".product-card").forEach(card => {
            const pId = card.getAttribute("data-product-id");
            if (pId && productNames[pId]) {
                card.querySelector(".lang-p-title").textContent = productNames[pId][activeLang];
            }
        });
        
        // Перевод опций и кнопок карточек
        document.querySelectorAll(".lang-label-color").forEach(el => el.textContent = d.lblColor);
        document.querySelectorAll(".lang-label-size").forEach(el => el.textContent = d.lblSize);
        document.querySelectorAll(".lang-color-black").forEach(el => el.textContent = d.clrBlack);
        document.querySelectorAll(".lang-color-white").forEach(el => el.textContent = d.clrWhite);
        document.querySelectorAll(".lang-btn-add").forEach(el => el.textContent = d.btnAdd);
        document.querySelectorAll(".lang-btn-buy").forEach(el => el.textContent = d.btnBuy);
        
        // 4. Корзина
        document.getElementById("lang-cart-checkout").textContent = d.cartCheckout;
        document.getElementById("lang-cart-clear").textContent = d.cartClear;
        applyCartTranslation();
        
        // 5. Подвал (Footer)
        document.getElementById("lang-footer-about").textContent = d.ftAbout;
        document.getElementById("lang-footer-contacts-title").textContent = d.ftContacts;
        document.getElementById("lang-footer-socials").textContent = d.ftSocials;
    });
}

/* ОПЛАТА */
document.querySelectorAll(".buy-btn").forEach(button => {

    button.addEventListener("click", () => {

        const card = button.closest(".product-card");

        const color =
        card.querySelector(".color-select").value;


        let paypalLink;


        if (color === "black") {

            paypalLink = button.dataset.paypalBlack;

        } else {

            paypalLink = button.dataset.paypalWhite;

        }


        const size =
        card.querySelectorAll(".options select")[1].value;


        const name =
        card.querySelector("h3").textContent;


        const finalLink =
        paypalLink
        + "?product="
        + encodeURIComponent(name)
        + "&size="
        + encodeURIComponent(size)
        + "&color="
        + encodeURIComponent(color);



        window.open(finalLink, "_blank");

    });

});
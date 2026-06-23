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

        showMessage(
            "Товар добавлен в корзину ✓"
        );

    });

});



// Обновление корзины

function updateCart() {

    counter.textContent = cart.length;

    const totalElement =
    document.querySelector(".cart-total");



    if (cart.length === 0) {

        cartItems.innerHTML =
        "<p>Корзина пустая</p>";

        if(totalElement){
            totalElement.textContent =
            "Итого: 0 €";
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
                    Размер: ${item.size}
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

        totalElement.textContent =
        "Итого: " + total + " €";

    }



    document
    .querySelectorAll(".remove-item")
    .forEach(button => {

        button.addEventListener("click", () => {

            const index =
            button.dataset.index;

            cart.splice(index, 1);

            updateCart();

            showMessage(
                "Товар удалён"
            );

        });

    });

}



// Открытие корзины

cartIcon.addEventListener("click", () => {

    cartWindow.classList.toggle("active");

});



// Очистка корзины

clearBtn.addEventListener("click", () => {

    cart = [];

    updateCart();

    showMessage(
        "Корзина очищена"
    );

});



// Переход к оплате

checkoutBtn.addEventListener("click", () => {

    if (cart.length === 0) {

        showMessage(
            "Корзина пустая"
        );

        return;
    }

    alert(
        "Переходим к оплате 💳"
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

            showMessage(
                "❌ Этот цвет недоступен"
            );

        }

    });

});
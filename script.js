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



        cart.push({

            name: name,

            price: price,

            image: image

        });



        updateCart();


        showMessage(
        "Товар добавлен в корзину ✓"
        );


    });

});





// Обновление корзины

function updateCart(){


    counter.textContent = cart.length;



    if(cart.length === 0){


        cartItems.innerHTML =
        "<p>Корзина пустая</p>";

        return;

    }




    cartItems.innerHTML = "";



    cart.forEach(item => {



        cartItems.innerHTML += `


        <div class="cart-product">


            <img 
            src="${item.image}" 
            class="cart-img">


            <div class="cart-info">


                <span>
                ${item.name}
                </span>


                <b>
                ${item.price}
                </b>


            </div>


        </div>


        `;



    });



}







// Открытие корзины

cartIcon.addEventListener("click",()=>{


    cartWindow.classList.toggle("active");


});







// Очистить корзину

clearBtn.addEventListener("click",()=>{


    cart = [];


    updateCart();


    showMessage(
    "Корзина очищена"
    );


});







// Оплата

checkoutBtn.addEventListener("click",()=>{


    if(cart.length === 0){


        showMessage(
        "Корзина пустая"
        );


        return;

    }



    alert(
    "Переходим к оплате 💳"
    );


});







// Сообщение

function showMessage(text){



    let message =
    document.querySelector(".cart-message");



    if(!message){


        message =
        document.createElement("div");


        message.className =
        "cart-message";


        document.body.appendChild(message);


    }





    message.textContent = text;



    message.classList.add("show");




    setTimeout(()=>{


        message.classList.remove("show");


    },1500);



}

const colorSelects = document.querySelectorAll(".color-select");


colorSelects.forEach(select => {


    select.addEventListener("change",()=>{


        const card = select.closest(".product-card");

        const image = card.querySelector(".product-image");


        const color = select.value;


        const newImage = image.dataset[color];



        if(newImage){


            image.src = newImage;


        } else {


            showMessage("❌ Этот цвет недоступен");


            // возвращаем предыдущий цвет
            select.selectedIndex = 0;


        }


    });


});
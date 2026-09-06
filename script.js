/* ======================================================================
   НАСТРОЙКА EMAILJS — автописьмо клиенту "Спасибо за заказ"
   ------------------------------------------------------------------
   Письмо клиенту отправляется ТОЛЬКО после успешной оплаты PayPal.
   ====================================================================== */
const EMAILJS_PUBLIC_KEY  = "6ck12n75Ku0jwZinW";
const EMAILJS_SERVICE_ID  = "service_ee9a096";
const EMAILJS_TEMPLATE_ID = "template_kco6uyf";

if (window.emailjs && EMAILJS_PUBLIC_KEY) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

function sendCustomerConfirmationEmail(params) {
    if (!window.emailjs || !EMAILJS_PUBLIC_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID) {
        console.warn('EmailJS не настроен — письмо клиенту не отправлено. См. комментарий "НАСТРОЙКА EMAILJS" в начале script.js.');
        return;
    }

    emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params).catch(err => {
        console.error('EmailJS error:', err);
    });
}

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

// Официальные страницы с картами пунктов выдачи по каждому перевозчику
const carrierLocatorLinks = {
    omniva: "https://www.omniva.ee/asukohad",
    dpd: "https://www.dpd.ee/",
    europe: "https://www.smartpost.ee/"
};

// =========================================================================
// ДАННЫЕ О ТОВАРАХ И ИХ ТЕКУЩЕМ ВЫБОРЕ ДЛЯ МОДАЛКИ PAYPAL
//
// TODO ДЛЯ НОВЫХ ТОВАРОВ "new-product-1" / "new-product-2":
//  1) поменять id на реальный (и точно так же — в index.html
//     в data-product-id, и в объекте productNames ниже)
//  2) вписать реальное name / price
//  3) вписать реальные пути к картинкам вместо TODO-...
// =========================================================================

const products = [
    { id: 'signal-lost', name: 'Signal Lost', price: 18.00, colors: { black: 'images/signal-front.jpg', white: 'images/TODO-new-3-white.png' } },
    { id: 'no-kings', name: 'No Kings', price: 18.00, colors: { black: 'images/No Kings.jpg', white: 'images/No Kings.png' } },
    { id: 'connection', name: 'Connection', price: 16.00, colors: { black: 'images/ConnectionB.jpg', white: 'images/ConnectionW.jpg' } },
    { id: 'time-to-live', name: 'Time ti live', price: 16.00, colors: { black: 'images/Time to liveB.png', white: 'images/Time to liveW.png' } },
    { id: 'never', name: 'Never Give Up', price: 15.00, colors: { black: 'images/Never Give Up.png', white: 'images/Never Give Up.png' } },
    { id: 'chaos', name: 'Chaos', price: 15.00, colors: { black: 'images/Chaos (2).png', white: 'images/Chaos (2).png' } },
    { id: 'summer', name: 'Summer Vibes', price: 15.00, colors: { black: 'images/Summer Vibes Black.png', white: 'images/Summer Vibes White.png' } },
    { id: 'drive', name: 'Tokyo Drive', price: 15.00, colors: { black: 'images/Tokyo Drive Black.png', white: 'images/Tokyo Drive White.png' } },
    { id: 'samurai', name: 'Shadow Ronin', price: 15.00, colors: { black: 'images/Shadow ronin Black.png', white: 'images/Shadow ronin Black.png' } }
    
];

const catalogSelection = {
    'signal-lost': { color: 'black', size: 'S', fit: 'regular' },
    'no-kings': { color: 'black', size: 'S', fit: 'regular' },
    'connection': { color: 'black', size: 'S', fit: 'regular' },
    'time-to-live': { color: 'black', size: 'S', fit: 'regular' },
    never: { color: 'black', size: 'S', fit: 'regular' },
    chaos: { color: 'white', size: 'S', fit: 'regular' },
    summer: { color: 'black', size: 'S', fit: 'regular' },
    drive: { color: 'black', size: 'S', fit: 'regular' },
    samurai: { color: 'black', size: 'S', fit: 'regular' }
};

function updateCatalogSelection() {
    document.querySelectorAll('.product-card').forEach(card => {
        const prodId = card.getAttribute('data-product-id');
        if (!prodId || !catalogSelection[prodId]) return;

        const colorSelect = card.querySelector('.color-select');
        const sizeSelect = card.querySelectorAll('.options select')[1];
        const fitSelect = card.querySelector('.fit-select');

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

        if (fitSelect) {
            catalogSelection[prodId].fit = fitSelect.value;
            fitSelect.addEventListener('change', (e) => {
                catalogSelection[prodId].fit = e.target.value;
            });
        }
    });
}

updateCatalogSelection();

// =========================================================================
// КАРТА ВЫБОРА МЕСТА ДОСТАВКИ
// =========================================================================

function initDeliveryMap() {
    const canvas = document.getElementById('fastMapCanvas');

    if (!canvas || !window.L) return;

    const map = L.map(canvas, {
        attributionControl: true
    }).setView([59.4370, 24.7536], 12);

    L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
        }
    ).addTo(map);

    let marker = null;

    const addressField =
        document.getElementById('fastDeliveryAddress');

    function setMarker(lat, lon, popupText) {
        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker([lat, lon], {
            draggable: true
        }).addTo(map);

        if (popupText) {
            marker
                .bindPopup(popupText)
                .openPopup();
        }

        marker.on('dragend', () => {
            const pos = marker.getLatLng();

            reverseGeocode(
                pos.lat,
                pos.lng
            );
        });
    }

    function reverseGeocode(lat, lon) {
        fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        )
            .then(r => r.json())
            .then(data => {
                if (addressField) {
                    addressField.value =
                        data.display_name ||
                        `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
                }
            })
            .catch(() => {});
    }

    map.on('click', (e) => {
        setMarker(
            e.latlng.lat,
            e.latlng.lng
        );

        reverseGeocode(
            e.latlng.lat,
            e.latlng.lng
        );
    });

    const searchInputEl =
        document.getElementById('fastMapSearchInput');

    const searchBtnEl =
        document.getElementById('fastMapSearchBtn');

    function runSearch() {
        const q =
            (searchInputEl.value || '').trim();

        if (!q) return;

        fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q + ', Eesti')}`
        )
            .then(r => r.json())
            .then(results => {
                if (results && results[0]) {

                    const lat =
                        parseFloat(results[0].lat);

                    const lon =
                        parseFloat(results[0].lon);

                    map.setView(
                        [lat, lon],
                        15
                    );

                    setMarker(
                        lat,
                        lon,
                        results[0].display_name
                    );

                    if (addressField) {
                        addressField.value =
                            results[0].display_name;
                    }
                }
            })
            .catch(() => {});
    }

    if (searchBtnEl) {
        searchBtnEl.addEventListener(
            'click',
            runSearch
        );
    }

    if (searchInputEl) {
        searchInputEl.addEventListener(
            'keydown',
            (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    runSearch();
                }
            }
        );
    }

    setTimeout(
        () => map.invalidateSize(),
        250
    );
}

function renderMapLinks(method, d) {
    const box =
        document.getElementById('fastMapLinks');

    if (!box) return;

    const labels = {
        omniva: d.mapLinkOmniva,
        dpd: d.mapLinkDpd,
        europe: d.mapLinkSmartpost
    };

    const href =
        carrierLocatorLinks[method] ||
        carrierLocatorLinks.omniva;

    const label =
        labels[method] ||
        labels.omniva;

    box.innerHTML = `
        <a
            class="delivery-map-link"
            href="${href}"
            target="_blank"
            rel="noopener"
        >
            🗺 ${escapeHTML(label)}
        </a>
    `;
}

// =========================================================================
// ФУНКЦИЯ БЫСТРОЙ ОПЛАТЫ
// =========================================================================

function buyNow(prodId) {

    const product =
        products.find(p => p.id === prodId);

    if (!product) return;

    const selection =
        catalogSelection[prodId];

    const currentImgPath =
        product.colors[selection.color] ||
        product.colors['black'];

    let payModal =
        document.getElementById('paypal-fast-modal');

    if (!payModal) {

        payModal =
            document.createElement('div');

        payModal.id =
            'paypal-fast-modal';

        payModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(6, 5, 8, 0.88);
            backdrop-filter: blur(4px);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        document.body.appendChild(payModal);
    }

    const d =
        dictionary[activeLang] ||
        dictionary['ru'];

    const colorText =
        selection.color === 'black'
            ? (d.clrBlack || 'Черный')
            : (d.clrWhite || 'Белый');

    const fitKeyMap = {
        slim: 'fitSlim',
        regular: 'fitRegular',
        relaxed: 'fitRelaxed',
        loose: 'fitLoose',
        oversize: 'fitOversize'
    };

    const fitText =
        d[fitKeyMap[selection.fit]] ||
        'Regular';

    const orderId =
        'INK-' +
        Math.floor(Math.random() * 10000);

    const txtName =
        activeLang === 'et'
            ? 'Sinu nimi'
            : (
                activeLang === 'en'
                    ? 'Full Name'
                    : 'Ваше Имя и Фамилия'
            );

    const txtEmail =
        activeLang === 'et'
            ? 'E-posti aadress (kinnituse jaoks)'
            : (
                activeLang === 'en'
                    ? 'Email (for order confirmation)'
                    : 'Email (для подтверждения заказа)'
            );

    const txtPhone =
        activeLang === 'et'
            ? 'Telefoninumber (SMS jaoks)'
            : (
                activeLang === 'en'
                    ? 'Phone (for SMS)'
                    : 'Телефон (для SMS)'
            );

    const txtMethod =
        activeLang === 'et'
            ? 'Tarneviis'
            : (
                activeLang === 'en'
                    ? 'Shipping Method'
                    : 'Способ доставки'
            );

    const txtAddress =
        activeLang === 'et'
            ? 'Pakiautomaadi või pakiautomaadi aadress'
            : (
                activeLang === 'en'
                    ? 'Parcel locker or home address'
                    : 'Адрес автомата (или домашний адрес)'
            );

    const txtBtnSave =
        activeLang === 'et'
            ? 'Kinnita andmed'
            : (
                activeLang === 'en'
                    ? 'Confirm Details'
                    : 'Подтвердить данные'
            );

    const txtTotal =
        activeLang === 'et'
            ? 'Kokku tasumisele'
            : (
                activeLang === 'en'
                    ? 'Total to pay'
                    : 'Итого к оплате'
            );

    let initialShipping =
        shippingRates["omniva"];

    let initialTotal =
        product.price + initialShipping;

    payModal.innerHTML = `
        <div style="
            background: #15131a;
            padding: 28px;
            border-radius: 16px;
            border: 1px solid rgba(201,162,75,0.28);
            width: 95%;
            max-width: 500px;
            position: relative;
            text-align: center;
            color: #f2ede2;
            max-height: 95vh;
            display: flex;
            flex-direction: column;
            box-sizing: border-box;
            overflow-y: auto;
            font-family: 'Jura', sans-serif;
            box-shadow: 0 30px 80px rgba(0,0,0,0.6);
        ">

            <button
                id="closeFastModal"
                style="
                    position: absolute;
                    top: 12px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: #948c7f;
                    font-size: 28px;
                    cursor: pointer;
                    line-height: 1;
                    z-index: 10;
                "
            >&times;</button>

            <div style="flex-shrink: 0;">

                <div style="
                    width: 92px;
                    height: 92px;
                    margin: 0 auto 12px auto;
                    background: #1d1922;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                    border: 1px solid rgba(201,162,75,0.2);
                ">

                    <img
                        src="${currentImgPath}"
                        alt="${escapeHTML(product.name)}"
                        style="
                            max-width: 100%;
                            max-height: 100%;
                            object-fit: contain;
                        "
                    >

                </div>

                <h3 style="
                    margin: 0 0 4px 0;
                    font-size: 19px;
                    font-family: 'Fraunces', serif;
                    font-weight: 500;
                    color: #f2ede2;
                ">
                    ${escapeHTML(
                        productNames[prodId]
                            ? productNames[prodId][activeLang]
                            : product.name
                    )}
                </h3>

                <p style="
                    margin: 0 0 15px 0;
                    color: #948c7f;
                    font-size: 13px;
                ">
                    ${d.lblSize}: ${selection.size}
                    |
                    ${d.lblColor}: ${colorText}
                    |
                    ${d.lblFit}: ${fitText}
                </p>

            </div>

            <form
                id="fastOrderForm"
                action="https://formsubmit.co/lyvero.company@gmail.com"
                method="POST"
                style="
                    text-align: left;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                "
            >

                <input
                    type="hidden"
                    name="_captcha"
                    value="false"
                >

                <input
                    type="hidden"
                    name="order_id"
                    value="${orderId}"
                >

                <input
                    type="hidden"
                    name="product"
                    value="${product.name} (${selection.size}/${selection.color}/${fitText})"
                >

                <input
                    type="hidden"
                    name="total_price"
                    id="hiddenTotalInput"
                    value="${initialTotal.toFixed(2)} €"
                >

                <label style="
                    font-size: 12.5px;
                    letter-spacing: 0.04em;
                    color: #948c7f;
                ">
                    ${txtName}:
                </label>

                <input
                    type="text"
                    name="customer_name"
                    required
                    style="
                        padding: 10px;
                        background: #1d1922;
                        border: 1px solid rgba(201,162,75,0.2);
                        color: #f2ede2;
                        border-radius: 8px;
                    "
                >

                <label style="
                    font-size: 12.5px;
                    letter-spacing: 0.04em;
                    color: #948c7f;
                ">
                    ${txtEmail}:
                </label>

                <input
                    type="email"
                    name="email"
                    id="fastCustomerEmail"
                    required
                    placeholder="you@example.com"
                    style="
                        padding: 10px;
                        background: #1d1922;
                        border: 1px solid rgba(201,162,75,0.2);
                        color: #f2ede2;
                        border-radius: 8px;
                    "
                >

                <label style="
                    font-size: 12.5px;
                    letter-spacing: 0.04em;
                    color: #948c7f;
                ">
                    ${txtPhone}:
                </label>

                <input
                    type="tel"
                    name="customer_phone"
                    required
                    placeholder="+372..."
                    style="
                        padding: 10px;
                        background: #1d1922;
                        border: 1px solid rgba(201,162,75,0.2);
                        color: #f2ede2;
                        border-radius: 8px;
                    "
                >

                <label style="
                    font-size: 12.5px;
                    letter-spacing: 0.04em;
                    color: #948c7f;
                ">
                    ${txtMethod}:
                </label>

                <select
                    name="shipping_method"
                    id="fastShippingMethod"
                    required
                    style="
                        padding: 10px;
                        background: #1d1922;
                        border: 1px solid rgba(201,162,75,0.2);
                        color: #f2ede2;
                        border-radius: 8px;
                    "
                >

                    <option value="omniva">
                        Omniva Pakiautomaat (€2.99)
                    </option>

                    <option value="dpd">
                        DPD Pakiautomaat (€2.99)
                    </option>

                    <option value="europe">
                        Smartposti Pakiautomaat (€2.99)
                    </option>

                </select>

                <div class="delivery-map-block">

                    <div
                        class="delivery-map-links"
                        id="fastMapLinks"
                    ></div>

                    <div class="delivery-map-search">

                        <input
                            type="text"
                            id="fastMapSearchInput"
                            placeholder="${d.mapSearchPlh}"
                        >

                        <button
                            type="button"
                            id="fastMapSearchBtn"
                        >
                            ${d.mapSearchBtn}
                        </button>

                    </div>

                    <div
                        class="delivery-map-canvas"
                        id="fastMapCanvas"
                    ></div>

                    <p class="delivery-map-hint">
                        ${d.mapHint}
                    </p>

                </div>

                <label style="
                    font-size: 12.5px;
                    letter-spacing: 0.04em;
                    color: #948c7f;
                ">
                    ${txtAddress}:
                </label>

                <textarea
                    name="delivery_address"
                    id="fastDeliveryAddress"
                    required
                    rows="2"
                    placeholder="${d.addressPlh}"
                    style="
                        padding: 10px;
                        background: #1d1922;
                        border: 1px solid rgba(201,162,75,0.2);
                        color: #f2ede2;
                        border-radius: 8px;
                        resize: none;
                    "
                ></textarea>

                <div style="
                    margin-top: 5px;
                    padding: 12px;
                    background: #1d1922;
                    border-radius: 8px;
                    text-align: center;
                    border: 1px dashed rgba(201,162,75,0.3);
                ">

                    <span style="
                        font-size: 13px;
                        color: #948c7f;
                    ">
                        ${txtTotal}:
                    </span>

                    <strong
                        id="modalTotalDisplay"
                        style="
                            font-size: 19px;
                            color: #e6c583;
                            margin-left: 6px;
                            font-family: 'Fraunces', serif;
                        "
                    >
                        ${initialTotal.toFixed(2)} €
                    </strong>

                </div>

                <button
                    type="submit"
                    id="fastSubmitBtn"
                    style="
                        padding: 13px;
                        background: #c9a24b;
                        color: #0b0a0d;
                        border: none;
                        border-radius: 8px;
                        font-weight: 700;
                        letter-spacing: 0.04em;
                        text-transform: uppercase;
                        font-size: 13px;
                        cursor: pointer;
                        margin-top: 6px;
                        transition: background 0.2s;
                    "
                >
                    ${txtBtnSave}
                </button>

            </form>

            <div
                id="paypal-fast-container"
                style="
                    display: none;
                    margin-top: 16px;
                    min-height: 150px;
                "
            >

                <p style="
                    color: #7fc97f;
                    font-weight: 600;
                    margin-bottom: 15px;
                    font-size: 13.5px;
                ">
                    ${d.deliverySaved}
                </p>

                <div id="paypal-buttons-inside"></div>

            </div>

        </div>
    `;

    payModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    const shippingSelect =
        document.getElementById('fastShippingMethod');

    const totalDisplay =
        document.getElementById('modalTotalDisplay');

    const hiddenTotalInput =
        document.getElementById('hiddenTotalInput');

    function recalculate() {

        const selectedShipping =
            shippingSelect.value;

        const shippingPrice =
            shippingRates[selectedShipping] || 0;

        const finalPrice =
            product.price + shippingPrice;

        totalDisplay.innerText =
            `${finalPrice.toFixed(2)} €`;

        hiddenTotalInput.value =
            `${finalPrice.toFixed(2)} €`;

        return finalPrice;
    }

    renderMapLinks(
        shippingSelect.value,
        d
    );

    initDeliveryMap();

    shippingSelect.addEventListener(
        'change',
        () => {

            recalculate();

            renderMapLinks(
                shippingSelect.value,
                d
            );

        }
    );

    document
        .getElementById('closeFastModal')
        .addEventListener('click', () => {

            payModal.style.display = 'none';
            document.body.style.overflow = '';

        });

    document
    .getElementById('fastOrderForm')
    .addEventListener('submit', async function(e) {

        e.preventDefault();

        const form = this;
        const submitBtn =
            document.getElementById('fastSubmitBtn');

        const paypalContainer =
            document.getElementById('paypal-fast-container');

        const paypalButtons =
            document.getElementById('paypal-buttons-inside');

        const finalPrice =
            recalculate();

        const customerEmail =
            document
                .getElementById('fastCustomerEmail')
                .value
                .trim();

        const customerName =
            form
                .querySelector('[name="customer_name"]')
                .value
                .trim();

        // Проверяем, что PayPal SDK загрузился
        if (!window.paypal || !window.paypal.Buttons) {

            console.error('PayPal SDK не загружен.');

            showMessage(
                d.paypalErrorMsg ||
                'PayPal Error ❌'
            );

            return;
        }

        submitBtn.disabled = true;

        submitBtn.innerText =
            d.savingBtn ||
            'Saving...';

        /*
         * ВАЖНО:
         * До успешной оплаты PayPal заказ НЕ отправляем.
         */

        form.style.display = 'none';

        paypalContainer.style.display =
            'block';

        paypalButtons.innerHTML = '';

        /*
         * Подготавливаем данные заказа.
         * Они будут отправлены продавцу ТОЛЬКО
         * после успешного capture.
         */

        const orderData =
            new FormData(form);

        orderData.set(
            'total_price',
            `${finalPrice.toFixed(2)} €`
        );

        try {

            await window.paypal.Buttons({

                style: {
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'buynow'
                },

                /*
                 * СОЗДАНИЕ PAYPAL ORDER
                 */

                createOrder:
                    function(data, actions) {

                        return actions.order.create({

                            intent: 'CAPTURE',

                            purchase_units: [{

                                invoice_id:
                                    orderId,

                                description:
                                    `Заказ ${orderId}: ${product.name} (${selection.size}/${selection.color}/${fitText})`,

                                amount: {

                                    currency_code: 'EUR',

                                    value:
                                        finalPrice.toFixed(2)

                                }

                            }]

                        });

                    },

                /*
                 * ПОКУПАТЕЛЬ ПОДТВЕРДИЛ ОПЛАТУ
                 */

                onApprove:
                    async function(data, actions) {

                        try {

                            /*
                             * ЗДЕСЬ ПРОИСХОДИТ ФАКТИЧЕСКИЙ CAPTURE
                             */

                            const details =
                                await actions.order.capture();

                            console.log(
                                'PayPal capture response:',
                                details
                            );

                            /*
                             * Получаем информацию о capture
                             */

                            const capture =
                                details
                                    ?.purchase_units?.[0]
                                    ?.payments?.captures?.[0];

                            const captureStatus =
                                capture?.status;

                            const captureId =
                                capture?.id || '';

                            console.log(
                                'PayPal capture status:',
                                captureStatus
                            );

                            console.log(
                                'PayPal capture ID:',
                                captureId
                            );

                            /*
                             * ДЕНЬГИ СЧИТАЕМ ПОЛУЧЕННЫМИ
                             * ТОЛЬКО ЕСЛИ PAYPAL ВЕРНУЛ COMPLETED
                             */

                            if (
                                captureStatus !==
                                'COMPLETED'
                            ) {

                                throw new Error(
                                    `PayPal capture status: ${
                                        captureStatus ||
                                        'UNKNOWN'
                                    }`
                                );

                            }

                            /*
                             * Сохраняем информацию
                             * об успешной оплате
                             */

                            orderData.set(
                                'payment_status',
                                captureStatus
                            );

                            orderData.set(
                                'paypal_order_id',
                                data.orderID || ''
                            );

                            orderData.set(
                                'paypal_capture_id',
                                captureId
                            );

                            /*
                             * ТЕПЕРЬ, И ТОЛЬКО ТЕПЕРЬ,
                             * отправляем заказ продавцу.
                             */

                            let sellerEmailSent =
                                false;

                            try {

                                const response =
                                    await fetch(
                                        form.action,
                                        {
                                            method: 'POST',

                                            body:
                                                orderData,

                                            headers: {
                                                'Accept':
                                                    'application/json'
                                            }
                                        }
                                    );

                                sellerEmailSent =
                                    response.ok;

                                if (!response.ok) {

                                    console.error(
                                        'FormSubmit error:',
                                        response.status,
                                        await response
                                            .text()
                                            .catch(() => '')
                                    );

                                }

                            } catch (sellerError) {

                                console.error(
                                    'Не удалось отправить заказ продавцу:',
                                    sellerError
                                );

                            }

                            /*
                             * Письмо покупателю отправляем
                             * только после COMPLETED.
                             */

                            sendCustomerConfirmationEmail({

                                to_email:
                                    customerEmail,

                                customer_name:
                                    customerName,

                                order_id:
                                    orderId,

                                product:
                                    `${product.name} (${selection.size}/${selection.color}/${fitText})`,

                                total_price:
                                    `${finalPrice.toFixed(2)} €`,

                                payment_status:
                                    captureStatus,

                                paypal_order_id:
                                    data.orderID || '',

                                paypal_capture_id:
                                    captureId

                            });

                            /*
                             * Показываем успешную оплату
                             */

                            showMessage(
                                d.paymentSuccess ||
                                'Payment successful! ✔'
                            );

                            if (!sellerEmailSent) {

                                console.warn(
                                    'Оплата прошла, но письмо продавцу не было подтверждено FormSubmit.'
                                );

                            }

                            payModal.style.display =
                                'none';

                            document.body.style.overflow =
                                '';

                        } catch (captureError) {

                            console.error(
                                'PayPal capture error:',
                                captureError
                            );

                            /*
                             * Если capture НЕ COMPLETED,
                             * заказ продавцу НЕ отправляем.
                             */

                            form.style.display =
                                'flex';

                            paypalContainer.style.display =
                                'none';

                            submitBtn.disabled =
                                false;

                            submitBtn.innerText =
                                txtBtnSave;

                            showMessage(
                                `${
                                    d.paypalErrorMsg ||
                                    'PayPal Error ❌'
                                } ${
                                    captureError.message ||
                                    ''
                                }`
                            );

                        }

                    },

                /*
                 * ПОКУПАТЕЛЬ ОТМЕНИЛ ОПЛАТУ
                 */

                onCancel:
                    function(data) {

                        console.warn(
                            'PayPal payment cancelled:',
                            data
                        );

                        form.style.display =
                            'flex';

                        paypalContainer.style.display =
                            'none';

                        submitBtn.disabled =
                            false;

                        submitBtn.innerText =
                            txtBtnSave;

                        showMessage(
                            d.paypalErrorMsg ||
                            'Оплата отменена'
                        );

                    },

                /*
                 * ОШИБКА PAYPAL
                 */

                onError:
                    function(err) {

                        console.error(
                            'PayPal Buttons error:',
                            err
                        );

                        form.style.display =
                            'flex';

                        paypalContainer.style.display =
                            'none';

                        submitBtn.disabled =
                            false;

                        submitBtn.innerText =
                            txtBtnSave;

                        showMessage(
                            d.paypalErrorMsg ||
                            'PayPal Error ❌'
                        );

                    }

            }).render(
                '#paypal-buttons-inside'
            );

        } catch (renderError) {

            console.error(
                'PayPal render error:',
                renderError
            );

            form.style.display =
                'flex';

            paypalContainer.style.display =
                'none';

            submitBtn.disabled =
                false;

            submitBtn.innerText =
                txtBtnSave;

            showMessage(
                d.paypalErrorMsg ||
                'PayPal Error ❌'
            );

        }

    });
}
// =========================================================================
// ПЕРЕХОД К ОПЛАТЕ ИЗ КОРЗИНЫ
// =========================================================================

checkoutBtn.addEventListener("click", () => {

    if (cart.length === 0) {

        showMessage(
            dictionary[activeLang].msgEmpty
        );

        return;
    }

    window.open(
        "https://www.paypal.com/ncp/payment/6EME7F92SFN36",
        "_blank"
    );

});

// =========================================================================
// ДОБАВЛЕНИЕ ТОВАРА В КОРЗИНУ
// =========================================================================

buttons.forEach(button => {

    button.addEventListener("click", () => {

        const card =
            button.closest(".product-card");

        const name =
            card.querySelector("h3").textContent;

        const price =
            card.querySelector(".product-price").textContent;

        const image =
            card.querySelector(".product-image").src;

        const size =
            card
                .querySelector(".options select:last-of-type")
                .value;

        cart.push({
            name,
            price,
            image,
            size
        });

        updateCart();

        showMessage(
            dictionary[activeLang].msgAdded
        );

    });

});

// =========================================================================
// ОБНОВЛЕНИЕ КОРЗИНЫ
// =========================================================================

function updateCart() {

    counter.textContent =
        cart.length;

    const totalElement =
        document.querySelector(".cart-total");

    if (cart.length === 0) {

        cartItems.innerHTML =
            `<p id="lang-cart-empty">
                ${dictionary[activeLang].cartEmpty}
            </p>`;

        if (totalElement) {

            totalElement.textContent =
                dictionary[activeLang].cartTotal +
                "0 €";

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
                class="cart-img"
            >

            <div class="cart-info">

                <span>
                    ${item.name}
                </span>

                <small>
                    ${dictionary[activeLang].cartSize}${item.size}
                </small>

                <b>
                    ${item.price}
                </b>

            </div>

            <button
                class="remove-item"
                data-index="${index}"
            >
                ✕
            </button>

        </div>

        `;

    });

    if (totalElement) {

        totalElement.textContent =
            dictionary[activeLang].cartTotal +
            total +
            " €";

    }

    document
        .querySelectorAll(".remove-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        button.dataset.index;

                    cart.splice(
                        index,
                        1
                    );

                    updateCart();

                    showMessage(
                        dictionary[activeLang].msgRemoved
                    );

                }
            );

        });

    if (
        typeof applyCartTranslation ===
        "function"
    ) {

        applyCartTranslation();

    }

}

// =========================================================================
// ОТКРЫТИЕ КОРЗИНЫ
// =========================================================================

cartIcon.addEventListener(
    "click",
    () => {

        cartWindow.classList.toggle(
            "active"
        );

    }
);

// =========================================================================
// ЗАКРЫТИЕ КОРЗИНЫ ПО КЛИКУ ВНЕ ОКНА
// =========================================================================

document.addEventListener(
    "click",
    (e) => {

        const wrapper =
            document.querySelector(
                ".cart-wrapper"
            );

        if (
            wrapper &&
            !wrapper.contains(e.target)
        ) {

            cartWindow.classList.remove(
                "active"
            );

        }

    }
);

// =========================================================================
// ОЧИСТКА КОРЗИНЫ
// =========================================================================

clearBtn.addEventListener(
    "click",
    () => {

        cart = [];

        updateCart();

        showMessage(
            dictionary[activeLang].msgCleared
        );

    }
);

// =========================================================================
// УВЕДОМЛЕНИЯ
// =========================================================================

function showMessage(text) {

    let message =
        document.querySelector(
            ".cart-message"
        );

    if (!message) {

        message =
            document.createElement(
                "div"
            );

        message.className =
            "cart-message";

        document.body.appendChild(
            message
        );

    }

    message.textContent =
        text;

    message.classList.add(
        "show"
    );

    setTimeout(
        () => {

            message.classList.remove(
                "show"
            );

        },
        1500
    );

}

// =========================================================================
// ПРОСТАЯ КАРУСЕЛЬ ФОТО ТОВАРА (разные ракурсы одного цвета)
// -------------------------------------------------------------------------
// Источник фото для карусели — атрибуты data-images-black / data-images-white
// на <img class="product-image">, список путей через запятую.
// Если список не задан, карусель падает обратно на одиночное фото из
// data-black / data-white (как раньше) — так старые карточки не ломаются.
// =========================================================================

function capitalize(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : str;
}

function getCardCurrentColor(card) {
    const colorSelect = card ? card.querySelector('.color-select') : null;
    return colorSelect ? colorSelect.value : 'black';
}

function getImageListForColor(image, color) {
    const listAttr = image.dataset['images' + capitalize(color)];

    if (listAttr && listAttr.trim()) {
        return listAttr.split(',').map(s => s.trim()).filter(Boolean);
    }

    const single = image.dataset[color];
    return single ? [single] : [];
}

function initCardCarousel(wrap) {
    const image = wrap.querySelector('.product-image');
    const prevBtn = wrap.querySelector('.carousel-prev');
    const nextBtn = wrap.querySelector('.carousel-next');
    const dotsBox = wrap.querySelector('.carousel-dots');
    const card = wrap.closest('.product-card');

    if (!image) return;

    let index = 0;

    function render() {
        const color = getCardCurrentColor(card);
        let images = getImageListForColor(image, color);

        if (images.length === 0) {
            images = [image.getAttribute('src')];
        }

        if (index >= images.length) index = 0;
        if (index < 0) index = images.length - 1;

        image.src = images[index];

        const showControls = images.length > 1;

        if (prevBtn) prevBtn.style.display = showControls ? '' : 'none';
        if (nextBtn) nextBtn.style.display = showControls ? '' : 'none';

        if (dotsBox) {
            dotsBox.innerHTML = '';

            if (showControls) {
                images.forEach((_, i) => {
                    const dot = document.createElement('span');
                    dot.className = 'carousel-dot' + (i === index ? ' active' : '');
                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        index = i;
                        render();
                    });
                    dotsBox.appendChild(dot);
                });
            }
        }
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            index -= 1;
            render();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            index += 1;
            render();
        });
    }

    // сохраняем ссылку на "сброс" карусели, чтобы вызвать её
    // при смене цвета товара (см. обработчик color-select ниже)
    wrap.__resetCarousel = () => {
        index = 0;
        render();
    };

    render();
}

document.querySelectorAll('.product-image-wrap').forEach(initCardCarousel);

// =========================================================================
// СМЕНА ЦВЕТА ТОВАРА
// =========================================================================

const colorSelects =
    document.querySelectorAll(
        ".color-select"
    );

colorSelects.forEach(select => {

    select.addEventListener(
        "change",
        () => {

            const card =
                select.closest(
                    ".product-card"
                );

            const image =
                card.querySelector(
                    ".product-image"
                );

            const wrap =
                card.querySelector(
                    ".product-image-wrap"
                );

            const color =
                select.value;

            const hasImages =
                (image.dataset[color] && image.dataset[color].trim()) ||
                (image.dataset['images' + capitalize(color)] && image.dataset['images' + capitalize(color)].trim());

            if (hasImages) {

                if (wrap && wrap.__resetCarousel) {

                    wrap.__resetCarousel();

                } else {

                    image.src =
                        image.dataset[color];

                }

            } else {

                showMessage(
                    dictionary[activeLang]
                        .msgColorUnavailable
                );

            }

        }
    );

});

// =========================================================================
// ЖИВОЙ ПОИСК
// =========================================================================

const searchInput =
    document.getElementById(
        "search-input"
    );

const searchResults =
    document.getElementById(
        "search-results"
    );

function closeSearchResults() {

    if (searchResults) {

        searchResults.classList.remove(
            "active"
        );

        searchResults.innerHTML =
            "";

    }

}

if (searchInput) {

    searchInput.addEventListener(
        "input",
        function() {

            const query =
                searchInput.value
                    .toLowerCase()
                    .trim();

            const cards =
                document.querySelectorAll(
                    ".product-card"
                );

            const matches = [];

            cards.forEach(card => {

                const title =
                    card
                        .querySelector("h3")
                        .textContent
                        .toLowerCase();

                const isMatch =
                    title.includes(query);

                card.style.display =
                    isMatch
                        ? ""
                        : "none";

                if (
                    query &&
                    isMatch
                ) {

                    matches.push(card);

                }

            });

            if (!searchResults)
                return;

            if (!query) {

                closeSearchResults();

                return;

            }

            if (matches.length === 0) {

                searchResults.innerHTML =
                    `<div class="search-no-results">
                        ${dictionary[activeLang].msgNoResults}
                    </div>`;

                searchResults.classList.add(
                    "active"
                );

                return;

            }

            searchResults.innerHTML =
                "";

            matches.forEach(card => {

                const name =
                    card
                        .querySelector("h3")
                        .textContent;

                const image =
                    card
                        .querySelector(
                            ".product-image"
                        )
                        .src;

                const item =
                    document.createElement(
                        "button"
                    );

                item.type =
                    "button";

                item.className =
                    "search-result-item";

                item.innerHTML =
                    `<img src="${image}" alt="">
                     <span>
                        ${escapeHTML(name)}
                     </span>`;

                item.addEventListener(
                    "click",
                    () => {

                        document
                            .querySelectorAll(
                                ".product-card"
                            )
                            .forEach(
                                c =>
                                    c.style.display =
                                        ""
                            );

                        searchInput.value =
                            "";

                        closeSearchResults();

                        card.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });

                        card.classList.remove(
                            "search-highlight"
                        );

                        void card.offsetWidth;

                        card.classList.add(
                            "search-highlight"
                        );

                        setTimeout(
                            () =>
                                card.classList.remove(
                                    "search-highlight"
                                ),
                            1600
                        );

                    }
                );

                searchResults.appendChild(
                    item
                );

            });

            searchResults.classList.add(
                "active"
            );

        }
    );

    document.addEventListener(
        "click",
        (e) => {

            if (
                !e.target.closest(
                    ".search-wrap"
                )
            ) {

                closeSearchResults();

            }

        }
    );

}

// =========================================================================
// СЛОВАРЬ НАЗВАНИЙ
//
// TODO: переименовать new-product-1 / new-product-2 (ключи объекта)
// в реальные id товаров и вписать настоящие названия на трёх языках.
// =========================================================================

const productNames = {

    'connection': {
        ru: "Connection",
        en: "Connection",
        et: "Connection"
    },

    'time-to-live': {
        ru: "Time to live",
        en: "Time to live",
        et: "Time to live"
    },

        'no-kings': {
        ru: "No Kings",
        en: "No Kings",
        et: "No Kings"
    },

    'signal-lost': {
        ru: "Signal Lost",
        en: "Signal Lost",
        et: "Signal Lost"
    },

    never: {
        ru: "Never Give Up",
        en: "Never Give Up",
        et: "Ära anna kunagi alla"
    },

    chaos: {
        ru: "Chaos",
        en: "Chaos",
        et: "Kaos"
    },

    summer: {
        ru: "Summer Vibes",
        en: "Summer Vibes",
        et: "Suve meeleolu"
    },

    drive: {
        ru: "Tokyo Drive",
        en: "Tokyo Drive",
        et: "Tokyo Sõit"
    },

    samurai: {
        ru: "Shadow Ronin",
        en: "Shadow Ronin",
        et: "Varju Ronin"
    }

};

// =========================================================================
// ПОЛНЫЙ СЛОВАРЬ МУЛЬТИЯЗЫЧНОСТИ
// =========================================================================

const dictionary = {

    ru: {

        navCatalog: "Каталог",
        navCollections: "О нас",
        navContacts: "Контакты",
        searchPlh: "Поиск...",

        cartTitle: "Корзина",
        cartEmpty: "Корзина пустая",
        cartCheckout: "Перейти к оплате",
        cartClear: "Очистить",
        cartTotal: "Итого: ",
        cartSize: "Размер: ",

        collections:
        "Коллекция",

        heroEyebrow:
            "Ателье принта — основано в Эстонии",

        heroSubtitle:
            "Чернила, которые говорят<br>за тебя.",

        heroBtn:
            "Перейти в каталог",

        catalogTitle:
            "Каталог",

        catalogEyebrow:
            "Коллекция",

        lblColor:
            "Цвет",

        lblSize:
            "Размер",

        lblFit:
            "Посадка",

        clrBlack:
            "Черный",

        clrWhite:
            "Белый",

        btnAdd:
            "Добавить в корзину",

        btnBuy:
            "Купить сейчас",

        fitSlim:
            "Slim fit",

        fitRegular:
            "Regular",

        fitRelaxed:
            "Relaxed",

        fitLoose:
            "Loose",

        fitOversize:
            "Oversize",

        ftAbout:
            "Мы создаём одежду с уникальными принтами, вдохновлёнными искусством, культурой и современным дизайном.",

        ftContacts:
            "Контакты и Социальные сети",

        ftSocials:
            "Социальные сети",

        scrollCue:
            "Листайте",

        msgAdded:
            "Товар добавлен в корзину ✓",

        msgRemoved:
            "Товар удалён",

        msgCleared:
            "Корзина очищена",

        msgEmpty:
            "Корзина пустая",

        msgCheckout:
            "Переходим к оплате 💳",

        msgColorUnavailable:
            "❌ Этот цвет недоступен",

        msgNoResults:
            "Ничего не найдено",

        mapSearchPlh:
            "Введите город или улицу",

        mapSearchBtn:
            "Найти",

        mapHint:
            "Отметьте на карте примерный район или адрес — так проще выбрать ближайший автомат. Точный список автоматов — по кнопке выше.",

        mapLinkOmniva:
            "Автоматы Omniva на карте",

        mapLinkDpd:
            "Автоматы DPD на карте",

        mapLinkSmartpost:
            "Автоматы Smartpost на карте",

        addressPlh:
            "Таллинн, Kaubamaja Omniva...",

        deliverySaved:
            "✓ Данные доставки сохранены. Оплатите заказ:",

        savingBtn:
            "Сохранение...",

        paymentSuccess:
            "Успешно оплачено! ✔",

        paypalErrorMsg:
            "Ошибка PayPal ❌",

        saveErrorMsg:
            "Ошибка сохранения данных."

    },

    en: {

        collections:
        "Collection",

        navCatalog:
            "Catalog",

        navCollections:
            "About us",

        navContacts:
            "Contacts",

        searchPlh:
            "Search...",

        cartTitle:
            "Cart",

        cartEmpty:
            "Cart is empty",

        cartCheckout:
            "Checkout",

        cartClear:
            "Clear",

        cartTotal:
            "Total: ",

        cartSize:
            "Size: ",

        heroEyebrow:
            "Print atelier — founded in Estonia",

        heroSubtitle:
            "Inks that speak<br>for you.",

        heroBtn:
            "Go to catalog",

        catalogTitle:
            "Catalog",

        catalogEyebrow:
            "Collection",

        lblColor:
            "Color",

        lblSize:
            "Size",

        lblFit:
            "Fit",

        clrBlack:
            "Black",

        clrWhite:
            "White",

        btnAdd:
            "Add to cart",

        btnBuy:
            "Buy now",

        fitSlim:
            "Slim fit",

        fitRegular:
            "Regular",

        fitRelaxed:
            "Relaxed",

        fitLoose:
            "Loose",

        fitOversize:
            "Oversize",

        ftAbout:
            "We create clothing with unique prints inspired by art, culture, and modern design.",

        ftContacts:
            "Contacts and Social Networks",

        ftSocials:
            "Social Networks",

        scrollCue:
            "Scroll",

        msgAdded:
            "Item added to cart ✓",

        msgRemoved:
            "Item removed",

        msgCleared:
            "Cart cleared",

        msgEmpty:
            "Cart is empty",

        msgCheckout:
            "Proceeding to checkout 💳",

        msgColorUnavailable:
            "❌ This color is unavailable",

        msgNoResults:
            "No results found",

        mapSearchPlh:
            "Enter a city or street",

        mapSearchBtn:
            "Search",

        mapHint:
            "Mark your general area or address on the map to help pick the nearest locker. For the exact list of lockers, use the button above.",

        mapLinkOmniva:
            "Omniva lockers on the map",

        mapLinkDpd:
            "DPD lockers on the map",

        mapLinkSmartpost:
            "Smartpost lockers on the map",

        addressPlh:
            "Tallinn, Kaubamaja Omniva...",

        deliverySaved:
            "✓ Delivery details saved. Please complete payment:",

        savingBtn:
            "Saving...",

        paymentSuccess:
            "Payment successful! ✔",

        paypalErrorMsg:
            "PayPal Error ❌",

        saveErrorMsg:
            "Error saving data."

    },

    et: {

        collections:
        "Kollektsioon",

        navCatalog:
            "Kataloog",

        navCollections:
            "Meie kohta",

        navContacts:
            "Kontaktid",

        searchPlh:
            "Otsi...",

        cartTitle:
            "Ostukorv",

        cartEmpty:
            "Ostukorv on tühi",

        cartCheckout:
            "Vormista ost",

        cartClear:
            "Tühjenda",

        cartTotal:
            "Kokku: ",

        cartSize:
            "Suurus: ",

        heroEyebrow:
            "Trükiateljee — asutatud Eestis",

        heroSubtitle:
            "Tindid, mis räägivad<br>Sinu eest.",

        heroBtn:
            "Mine kataloogi",

        catalogTitle:
            "Kataloog",

        catalogEyebrow:
            "Kollektsioon",

        lblColor:
            "Värv",

        lblSize:
            "Suurus",

        lblFit:
            "Lõige",

        clrBlack:
            "Must",

        clrWhite:
            "Valge",

        btnAdd:
            "Lisa ostukorvi",

        btnBuy:
            "Osta kohe",

        fitSlim:
            "Slim fit",

        fitRegular:
            "Regular",

        fitRelaxed:
            "Relaxed",

        fitLoose:
            "Loose",

        fitOversize:
            "Oversize",

        ftAbout:
            "Loome unikaalsete printidega rõivaid, mis on inspireeritud kunstist, kultuurist ja kaasegsest disainist.",

        ftContacts:
            "Kontaktid ja sotsiaalmeedia",

        ftSocials:
            "Sotsiaalmeedia",

        scrollCue:
            "Keri edasi",

        msgAdded:
            "Toode lisatud ostukorvi ✓",

        msgRemoved:
            "Toode eemaldatud",

        msgCleared:
            "Ostukorv tühjendatud",

        msgEmpty:
            "Ostukorv on tühi",

        msgCheckout:
            "Suundume maksmisele 💳",

        msgColorUnavailable:
            "❌ See värv pole saadaval",

        msgNoResults:
            "Tulemusi ei leitud",

        mapSearchPlh:
            "Sisesta linn või tänav",

        mapSearchBtn:
            "Otsi",

        mapHint:
            "Märgi kaardile oma piirkond või aadress — nii on lihtsam valida lähim automaat. Täpne automaatide nimekiri on ülal oleva nupu taga.",

        mapLinkOmniva:
            "Omniva automaadid kaardil",

        mapLinkDpd:
            "DPD automaadid kaardil",

        mapLinkSmartpost:
            "Smartposti automaadid kaardil",

        addressPlh:
            "Tallinn, Kaubamaja Omniva...",

        deliverySaved:
            "✓ Tarneandmed salvestatud. Palun tasu:",

        savingBtn:
            "Salvestamine...",

        paymentSuccess:
            "Makse õnnestus! ✔",

        paypalErrorMsg:
            "PayPali viga ❌",

        saveErrorMsg:
            "Andmete salvestamise viga."

    }

};

let activeLang = "ru";

// =========================================================================
// ПЕРЕВОД КОРЗИНЫ
// =========================================================================

function applyCartTranslation() {

    const d =
        dictionary[activeLang];

    const cartTitleEl =
        document.getElementById(
            "lang-cart-title"
        );

    const cartEmptyEl =
        document.getElementById(
            "lang-cart-empty"
        );

    if (cartTitleEl) {
        cartTitleEl.textContent =
            d.cartTitle;
    }

    if (cartEmptyEl) {
        cartEmptyEl.textContent =
            d.cartEmpty;
    }

    const totalEl =
        document.querySelector(
            ".cart-total"
        );

    if (
        totalEl &&
        cart.length > 0
    ) {

        let totalSum = 0;

        cart.forEach(item => {

            totalSum +=
                parseFloat(item.price);

        });

        totalEl.textContent =
            d.cartTotal +
            totalSum +
            " €";

    } else if (totalEl) {

        totalEl.textContent =
            d.cartTotal +
            "0 €";

    }

    document
        .querySelectorAll(
            ".cart-product"
        )
        .forEach(cartProd => {

            const nameSpan =
                cartProd.querySelector(
                    ".cart-info span"
                );

            const sizeSmall =
                cartProd.querySelector(
                    ".cart-info small"
                );

            if (nameSpan) {

                let origName =
                    nameSpan.textContent;

                for (
                    let id in productNames
                ) {

                    if (
                        productNames[id].ru === origName ||
                        productNames[id].en === origName ||
                        productNames[id].et === origName
                    ) {

                        nameSpan.textContent =
                            productNames[id][activeLang];

                        break;

                    }

                }

            }

            if (sizeSmall) {

                const currentSize =
                    sizeSmall.textContent
                        .replace("Размер:", "")
                        .replace("Size:", "")
                        .replace("Suurus:", "")
                        .trim();

                sizeSmall.textContent =
                    d.cartSize +
                    currentSize;

            }

        });

}

// =========================================================================
// СМЕНА ЯЗЫКА
// =========================================================================

const langSelect =
    document.getElementById(
        "language-select"
    );

if (langSelect) {

    langSelect.addEventListener(
        "change",
        (e) => {

            activeLang =
                e.target.value;

            const d =
                dictionary[activeLang];

            document.getElementById(
                "lang-nav-catalog"
            ).textContent =
                d.navCatalog;

            document.getElementById(
                "lang-nav-collections"
            ).textContent =
                d.navCollections;

            document.getElementById(
                "lang-nav-contacts"
            ).textContent =
                d.navContacts;

            document.getElementById(
                "search-input"
            ).placeholder =
                d.searchPlh;

            const heroEyebrowEl =
                document.getElementById(
                    "lang-hero-eyebrow"
                );

            if (heroEyebrowEl) {

                heroEyebrowEl.textContent =
                    d.heroEyebrow;

            }

            document.getElementById(
                "lang-hero-subtitle"
            ).innerHTML =
                d.heroSubtitle;

            document.getElementById(
                "lang-hero-btn"
            ).textContent =
                d.heroBtn;

            document.getElementById(
                "lang-catalog-title"
            ).textContent =
                d.catalogTitle;

            const catalogEyebrowEl =
                document.getElementById(
                    "lang-catalog-eyebrow"
                );

            if (catalogEyebrowEl) {

                catalogEyebrowEl.textContent =
                    d.catalogEyebrow;

            }

            document
                .querySelectorAll(
                    ".product-card"
                )
                .forEach(card => {

                    const pId =
                        card.getAttribute(
                            "data-product-id"
                        );

                    if (
                        pId &&
                        productNames[pId]
                    ) {

                        card.querySelector(
                            ".lang-p-title"
                        ).textContent =
                            productNames[pId][
                                activeLang
                            ];

                    }

                });

            document
                .querySelectorAll(
                    ".lang-label-color"
                )
                .forEach(el => {

                    el.textContent =
                        d.lblColor;

                });

            document
                .querySelectorAll(
                    ".lang-label-size"
                )
                .forEach(el => {

                    el.textContent =
                        d.lblSize;

                });

            document
                .querySelectorAll(
                    ".lang-label-fit"
                )
                .forEach(el => {

                    el.textContent =
                        d.lblFit;

                });

            document
                .querySelectorAll(
                    ".lang-color-black"
                )
                .forEach(el => {

                    el.textContent =
                        d.clrBlack;

                });

            document
                .querySelectorAll(
                    ".lang-color-white"
                )
                .forEach(el => {

                    el.textContent =
                        d.clrWhite;

                });

            document
                .querySelectorAll(
                    ".lang-fit-slim"
                )
                .forEach(el => {

                    el.textContent =
                        d.fitSlim;

                });

            document
                .querySelectorAll(
                    ".lang-fit-regular"
                )
                .forEach(el => {

                    el.textContent =
                        d.fitRegular;

                });

            document
                .querySelectorAll(
                    ".lang-fit-relaxed"
                )
                .forEach(el => {

                    el.textContent =
                        d.fitRelaxed;

                });

            document
                .querySelectorAll(
                    ".lang-fit-loose"
                )
                .forEach(el => {

                    el.textContent =
                        d.fitLoose;

                });

            document
                .querySelectorAll(
                    ".lang-fit-oversize"
                )
                .forEach(el => {

                    el.textContent =
                        d.fitOversize;

                });

            document
                .querySelectorAll(
                    ".lang-btn-add"
                )
                .forEach(el => {

                    el.textContent =
                        d.btnAdd;

                });

            document
                .querySelectorAll(
                    ".lang-btn-buy"
                )
                .forEach(el => {

                    el.textContent =
                        d.btnBuy;

                });

            const scrollCueEl =
                document.getElementById(
                    "lang-scroll-cue"
                );

            if (scrollCueEl) {

                scrollCueEl.textContent =
                    d.scrollCue;

            }

            document.getElementById(
                "lang-cart-checkout"
            ).textContent =
                d.cartCheckout;

            document.getElementById(
                "lang-cart-clear"
            ).textContent =
                d.cartClear;

            applyCartTranslation();

            document.getElementById(
                "lang-footer-about"
            ).textContent =
                d.ftAbout;

            document.getElementById(
                "lang-footer-contacts-title"
            ).textContent =
                d.ftContacts;

            document.getElementById(
                "lang-footer-socials"
            ).textContent =
                d.ftSocials;

        }
    );

}

// =========================================================================
// BUY NOW
// =========================================================================

document
    .querySelectorAll(".buy-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const card =
                    button.closest(
                        ".product-card"
                    );

                const prodId =
                    card.getAttribute(
                        "data-product-id"
                    );

                if (prodId) {

                    buyNow(prodId);

                }

            }
        );

    });

// =========================================================================
// ФИКСИРОВАННАЯ ШАПКА
// =========================================================================

const siteNav =
    document.getElementById(
        "siteNav"
    );

if (siteNav) {

    const toggleNav = () => {

        if (window.scrollY > 40) {

            siteNav.classList.add(
                "scrolled"
            );

        } else {

            siteNav.classList.remove(
                "scrolled"
            );

        }

    };

    toggleNav();

    window.addEventListener(
        "scroll",
        toggleNav,
        {
            passive: true
        }
    );

}

// =========================================================================
// ПОЯВЛЕНИЕ ЭЛЕМЕНТОВ ПРИ ПРОКРУТКЕ
// =========================================================================

const revealItems =
    document.querySelectorAll(
        ".reveal"
    );

if (
    "IntersectionObserver" in window &&
    revealItems.length
) {

    const revealObserver =
        new IntersectionObserver(
            (entries) => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "in-view"
                        );

                        revealObserver.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.15
            }
        );

    revealItems.forEach(item =>
        revealObserver.observe(item)
    );

} else {

    revealItems.forEach(item =>
        item.classList.add(
            "in-view"
        )
    );

}
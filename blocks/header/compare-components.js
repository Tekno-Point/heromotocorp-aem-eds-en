import { div, section, input, label, button, img, p, span, sup, i } from '../../scripts/dom-helpers.js';
import { fetchCategory } from '../../scripts/common.js';

const RED_CHEVRON = '/icons/icon-chevron-red.svg';
const WHITE_CROSS_ICON = '/icons/icon-cross-white.svg';
const WHITE_CHEVRON = '/icons/icon-chevron-white.svg';

let vehiclesList = [];
let comparedCardsContainer;
let vehiclePriceData = sessionStorage.getItem('vehiclePriceData');
vehiclePriceData = (vehiclePriceData && vehiclePriceData != 'undefined') ? JSON.parse(vehiclePriceData) : []; // Default to empty array if null or undefined

const getSkuItem = (sku) => {
    const vehicles = vehiclesList.length ? vehiclesList : vehiclePriceData?.data?.products?.items;
    const vehicle = vehicles.find((vehicle) => vehicle.sku === sku);
    if (vehicle) {
        return vehicle;
    }

    return null;
}

const toggleDrawer = ({ target }) => {
    if (target.closest('.drawer-wrapper')) {
        return;
    }

    drawerSection.classList.toggle('open');
}

const initVehicleRender = async () => {
    document.removeEventListener('mouseover', initVehicleRender);

    const { vehiclePriceData, vehiclesObj } = await fetchCategory();
    vehiclesList = vehiclePriceData.data.products.items;
    if (vehiclesList) {
        sessionStorage.setItem('vehiclePriceData', JSON.stringify(vehiclePriceData));
    }

    const { motorcycles, scooters } = vehiclesObj;

    const scootersAccordion = createAccordion('Scooters', scooters);
    const scootersDrawer = drawerSection.querySelector('#scooters-drawer');
    scootersDrawer.appendChild(scootersAccordion);

    const hunccAccordion = createAccordion('100CC', motorcycles['100CC']);
    const one25ccAccordion = createAccordion('125CC', motorcycles['125CC']);
    const premiumAccordion = createAccordion('Premium', motorcycles['premium']);
    const motorcyclesDrawer = drawerSection.querySelector('#motorcycles-drawer');
    motorcyclesDrawer.append(hunccAccordion, one25ccAccordion, premiumAccordion);
}

const cards = [
    div({ class: 'compare-card' },
        button({ class: 'tray-add-cta', value: '1', onclick: toggleDrawer },
            div({ class: 'add-cta-count' }, '01'),
            div({ class: 'add-cta-label' }, 'Add at least two vehicle to compare')
        )
    ),
    div({ class: 'compare-card' },
        button({ class: 'tray-add-cta', value: '2', disabled: 'disabled', onclick: toggleDrawer },
            div({ class: 'add-cta-count' }, '02'),
            div({ class: 'add-cta-label' }, 'Add at least one more vehicle to compare')
        )
    ),
    div({ class: 'compare-card' },
        button({ class: 'tray-add-cta', value: '3', disabled: 'disabled', onclick: toggleDrawer },
            div({ class: 'add-cta-count' }, '03'),
            div({ class: 'add-cta-label' }, 'Up to 3 vehicles can be compared at a time')
        )
    )
];

const getTrayAddButtons = (index) => {
    const buttons = [...cards];

    if (typeof index === 'number') {
        const btnIndex = index - 1;

        if (buttons[btnIndex]) {
            const firstCompareCTA = buttons[btnIndex].querySelector('.tray-add-cta');
            firstCompareCTA.disabled = false;
        }

        return buttons.slice(btnIndex);
    }

    return buttons;
};

const trayCard = (vehicle, cardValue) => {
    let price = vehicle.price_range.minimum_price.regular_price.value;

    if (!isNaN(price)) {
        price = price.toLocaleString('en-IN');
    }

    return div({ class: 'compare-card' },
        div(
            { class: 'tray-card-wrapper', 'data-bike-id': vehicle.sku },
            img({
                alt: vehicle.image.label,
                src: vehicle.image.url
            }),
            div({ class: 'tray-card-details' },
                div({ class: 'card-details-label' }, vehicle.name),
                div(
                    { class: 'card-details-amount' },
                    'Starting at ',
                    span({}, '₹' + price + '*')
                )
            ),
            button({ class: 'tray-remove-cta', value: cardValue, 'data-bike-id': vehicle.sku, onclick: onVehicleRmove },
                img({
                    alt: 'Remove Vehicle',
                    src: WHITE_CROSS_ICON
                })
            )
        )
    )
}
const toggleTray = () => {
    traySection.classList.toggle('disappear');
}

const traySection = section({ class: 'tray-container disappear open' },
    div({ class: 'tray-wrapper' },
        button({ class: 'tray-control', onclick: toggleTray },
            div({ class: 'tray-toggle-cta' },
                img({
                    alt: 'Toggle Tray',
                    src: WHITE_CHEVRON,
                    height: '100%',
                    width: '70%',
                })
            ),
            div({ class: 'tray-name' }, 'COMPARE ITEMS'),
            div({ class: 'tray-count' },
                span({ class: 'card-count' }, '0'),
                span({ class: 'card-max-dsk' }, '/3'),
                span({ class: 'card-max-mob' }, '/2')
            )
        ),

        div({ class: 'tray-card-container', id: 'compared-cards' }),
        div({ class: 'tray-cta-container' },
            button({ class: 'tray-clear-cta', onclick: clearSessionVehicles }, 'CLEAR ALL'),
            button({
                class: 'tray-compare-cta',
                disabled: 'disabled',
            }, 'COMPARE NOW')
        )
    )
);

document.addEventListener('mouseover', initVehicleRender);

function clearSessionVehicles() {
    traySection.classList.toggle('disappear')
    sessionStorage.removeItem('comparedVehicles');
    renderTrayCards();
}

comparedCardsContainer = traySection.querySelector('#compared-cards');

const vehicleToggler = (e) => {
    const vehicleDrawers = drawerSection.querySelectorAll('.drawer-content-motorcycles, .drawer-content-scooters');
    vehicleDrawers.forEach((drawer) => {
        drawer.classList.toggle('hidden');
    });
}

const drawerSection = section({ class: 'drawer-container opaque', onclick: toggleDrawer },
    div({ class: 'drawer-wrapper' },
        div({ class: 'drawer-heading' }, 'Select Vehicle To Compare'),

        div({ class: 'drawer-tabs' },
            input({
                type: 'radio',
                name: 'vehicle-type',
                id: 'drawer-motorcycles',
                value: 'motorcycles',
                checked: 'checked',
                onchange: vehicleToggler
            }),
            label({ for: 'drawer-motorcycles' }, 'Motorcycles'),

            input({
                type: 'radio',
                name: 'vehicle-type',
                id: 'drawer-scooters',
                value: 'scooters',
                onchange: vehicleToggler
            }),
            label({ for: 'drawer-scooters' }, 'Scooters'),
        ),

        div({ class: 'drawer-content drawer-content-motorcycles' },
            div({ class: 'homepage-placeholder-div' },
                div({ class: 'drawer-fragment-wrap', id: 'motorcycles-drawer' })
            ),
        ),

        div({ class: 'drawer-content drawer-content-scooters hidden' },
            div({ class: 'homepage-placeholder-div' },
                div({ class: 'drawer-fragment-wrap', id: 'scooters-drawer' })
            ),
        )
    )
);

const onVehicleAdd = (e) => {
    let comparedVehicle = sessionStorage.getItem('comparedVehicles');

    if (comparedVehicle == 'undefined' || !comparedVehicle) {
        comparedVehicle = null
    }

    const selectedVehicleSku = e.currentTarget.dataset.bikeId || e.currentTarget.value;

    let vehicles = [];

    if (comparedVehicle) {
        vehicles = JSON.parse(comparedVehicle);
    }

    if (!vehicles.includes(selectedVehicleSku)) {
        vehicles.push(selectedVehicleSku);
    }

    const vehicle = getSkuItem(selectedVehicleSku);
    console.log(vehicle, 'selected-sku');

    sessionStorage.setItem('comparedVehicles', JSON.stringify(vehicles));

    renderTrayCards();
}

const onVehicleRmove = (e) => {
    let comparedVehicle = sessionStorage.getItem('comparedVehicles');

    if (comparedVehicle == 'undefined' || !comparedVehicle) {
        comparedVehicle = null
    }

    const selectedVehicle = e.currentTarget.dataset.bikeId || e.currentTarget.value;

    let vehicles = [];

    if (comparedVehicle) {
        vehicles = JSON.parse(comparedVehicle);
    }

    vehicles.splice(vehicles.indexOf(selectedVehicle), 1);

    sessionStorage.setItem('comparedVehicles', JSON.stringify(vehicles));

    renderTrayCards();
}

const createVehicleButton = (label, sku, cc, imageDetail) => {
    return button({
        class: 'select-vehicle', 'data-bike-id': sku,
        onclick: (e) => {
            onVehicleAdd(e);
            drawerSection.classList.toggle('open');
        }
    },
        img({
            alt: imageDetail.label,
            class: 'vehicle-image',
            src: imageDetail.url,
            loading: 'lazy',
        }),
        div({ class: 'vehicle-details' },
            div({ class: 'vehicle-label' }, label),
            div({ class: 'vehicle-engine' },
                p(cc, sup('cc'), ' engine')
            )
        )
    );
}

const toggleAccordion = ({ currentTarget }) => {
    const toogleButton = currentTarget;
    toogleButton.classList.toggle('active-acc');

    const content = toogleButton.closest('.drawer-accordion-wrapper').querySelector('.drawer-accordion-content');
    content.classList.toggle('collapsed');
}

const createAccordion = (label, vehicles) => {
    return div({ class: 'drawer-accordion-wrapper' },
        button({ class: 'drawer-accordion-toggle', onclick: toggleAccordion },
            div({ class: 'drawer-accordion-label' }, label),
            img({
                alt: 'Accordion Icon',
                class: 'drawer-accordion-icon',
                src: RED_CHEVRON,
            })
        ),
        div({ class: 'drawer-accordion-content collapsed' },
            ...vehicles.map(v => createVehicleButton(v.name, v.sku, v.type_of_cc, v.image))
        )
    );

}

const compareButton = traySection.querySelector('.tray-compare-cta');
compareButton.addEventListener('click', () => {
    console.log(sessionStorage.getItem('comparedVehicles'), 'compare clicked');
});

const renderTrayCards = () => {
    const cardCountLabel = traySection.querySelector('.card-count');
    let sessionVehilces = sessionStorage.getItem('comparedVehicles');
    sessionVehilces = (sessionVehilces && sessionVehilces != 'undefined') ? JSON.parse(sessionVehilces) : []; // Default to empty array if null or undefined

    if (!sessionVehilces.length) {
        comparedCardsContainer.replaceChildren(...getTrayAddButtons());
        cardCountLabel.textContent = 0;
        compareButton.disabled = true;
        traySection.classList.remove('compared');
        return;
    }

    traySection.classList.add('compared');
    compareButton.disabled = false;

    const sesssionVehLength = sessionVehilces.length;

    const cards = [];

    for (let i = 0; i < sessionVehilces.length; i++) {
        const vehicle = sessionVehilces[i];

        const vehicleObj = getSkuItem(vehicle);
        if (!vehicleObj) continue;

        cards.push(trayCard(vehicleObj, sesssionVehLength));
    }

    if (cards.length < 3) {
        cards.push(...getTrayAddButtons(cards.length + 1));
    }

    comparedCardsContainer.replaceChildren(...cards);

    cardCountLabel.textContent = sesssionVehLength;
}

renderTrayCards();

export { traySection, drawerSection, onVehicleAdd, onVehicleRmove };

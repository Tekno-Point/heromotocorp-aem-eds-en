import { div, section, input, label, button, img, p, span, sup, i } from '../../scripts/dom-helpers.js';
import { fetchCategory } from './getCategory.js';

const RED_CHEVRON = '/icons/icon-chevron-red.svg';
const WHITE_CROSS_ICON = '/icons/icon-cross-white.svg';

let vehiclesList = [];
let sessionVehilces = JSON.parse(sessionStorage.getItem('compareVehicles')) || [];
let comparedCardsContainer;
let vehiclePriceData = JSON.parse(sessionStorage.getItem('vehiclePriceData'));

const getSkuItem = (sku) => {
    const vehicles = vehiclePriceData.products.items;
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

const initVehicleRender = async (e) => {
    const currentTarget = e.currentTarget;
    toggleDrawer(e);
    if (currentTarget.dataset.vehiclesRendered) {
        return;
    }

    const { vehiclePriceData, vehiclesObj } = await fetchCategory();
    vehiclesList = vehiclePriceData.products.items;
    sessionStorage.setItem('vehiclePriceData', JSON.stringify(vehiclePriceData));

    const { motorcycles, scooters } = vehiclesObj;

    const scootersAccordion = createAccordion('Scooters', scooters);
    const scootersDrawer = drawerSection.querySelector('#scooters-drawer');
    scootersDrawer.appendChild(scootersAccordion);

    const hunccAccordion = createAccordion('100CC', motorcycles['100CC']);
    const one25ccAccordion = createAccordion('125CC', motorcycles['125CC']);
    const premiumAccordion = createAccordion('Premium', motorcycles['premium']);
    const motorcyclesDrawer = drawerSection.querySelector('#motorcycles-drawer');
    motorcyclesDrawer.append(hunccAccordion, one25ccAccordion, premiumAccordion);

    currentTarget.dataset.vehiclesRendered = true;

}

const cards = [
    div({ class: 'tray-card-box' },
        button({ class: 'tray-add-cta', value: '1', onclick: initVehicleRender },
            div({ class: 'add-cta-count' }, '01'),
            div({ class: 'add-cta-label' }, 'Add at least two vehicle to compare')
        )
    ),
    div({ class: 'tray-card-box' },
        button({ class: 'tray-add-cta', value: '2', disabled: 'disabled', onclick: toggleDrawer },
            div({ class: 'add-cta-count' }, '02'),
            div({ class: 'add-cta-label' }, 'Add at least one more vehicle to compare')
        )
    ),
    div({ class: 'tray-card-box' },
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

const clearSessionVehicles = () => {
    sessionStorage.removeItem('compareVehicles');
    renderTrayCards();
}

const trayCard = (vehicle, cardValue) => {
    let price = vehicle.price_range.minimum_price.regular_price.value;

    if (!isNaN(price)) {
        price = price.toLocaleString('en-IN');
    }

    return div({ class: 'tray-card-box' },
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
            button({ class: 'tray-remove-cta', value: cardValue, onclick: onVehicleRmove},
                img({
                    alt: 'Remove Vehicle',
                    src:  WHITE_CROSS_ICON
                })
            )
        )
    )
}

const traySection = section({ class: 'tray-container disappear open' },
    div({ class: 'tray-wrapper' },
        button({ class: 'tray-control' },
            div({ class: 'tray-toggle-cta' },
                img({
                    alt: 'Toggle Tray',
                    src: '/etc.clientlibs/hero-aem-website/clientlibs/clientlib-homepage/resources/images/icon-chevron-white.svg',
                    height: '100%',
                    width: '100%',
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
                div({ class: 'drawer-fragment', id: 'motorcycles-drawer' })
            ),
        ),

        div({ class: 'drawer-content drawer-content-scooters hidden' },
            div({ class: 'homepage-placeholder-div' },
                div({ class: 'drawer-fragment', id: 'scooters-drawer' })
            ),
        )
    )
);

const onVehicleAdd = (e) => {
    const comparedVehicle = sessionStorage.getItem('compareVehicles');

    const selectedVehicleSku = e.currentTarget.dataset.bikeId;

    let vehicles = [];

    if (comparedVehicle) {
        vehicles = JSON.parse(comparedVehicle);
    }

    if (!vehicles.includes(selectedVehicleSku)) {
        vehicles.push(selectedVehicleSku);
    }

    const vehicle = getSkuItem(selectedVehicleSku);
    console.log(vehicle, 'selected-sku');

    sessionStorage.setItem('compareVehicles', JSON.stringify(vehicles));

    renderTrayCards();
    drawerSection.classList.toggle('open');
}

const onVehicleRmove = (e) => {
    const comparedVehicle = sessionStorage.getItem('compareVehicles');

    const selectedVehicle = e.currentTarget.dataset.bikeId;

    let vehicles = [];

    if (comparedVehicle) {
        vehicles = JSON.parse(comparedVehicle);
    }

    vehicles.splice(vehicles.indexOf(selectedVehicle), 1);

    sessionStorage.setItem('compareVehicles', JSON.stringify(vehicles));

    renderTrayCards();
}

const createVehicleButton = (label, sku, cc, imageDetail) => {
    return button({ class: 'select-vehicle', 'data-bike-id': sku, onclick: onVehicleAdd },
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

const renderTrayCards = () => {
    const cardCountLabel = traySection.querySelector('.card-count');
    const sessionVehilces = JSON.parse(sessionStorage.getItem('compareVehicles')) || [];

    if (!sessionVehilces.length) {
        comparedCardsContainer.replaceChildren(...getTrayAddButtons());
        return;
    }

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

export { traySection, drawerSection };

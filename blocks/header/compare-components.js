/* eslint-disable object-curly-newline */
/* eslint-disable arrow-parens */
/* eslint-disable no-use-before-define */
/* eslint-disable dot-notation */
/* eslint-disable function-paren-newline */

import { div, section, input, label, button, img, p, span, sup } from '../../scripts/dom-helpers.js';
import { fetchCategory } from '../../scripts/common.js';
import { fetchPlaceholders } from '../../scripts/aem.js';

const placeholders = await fetchPlaceholders('/form');
const { comparePageUrl } = placeholders;

const RED_CHEVRON = '/icons/icon-chevron-red.svg';
const WHITE_CROSS_ICON = '/icons/icon-cross-white.svg';
const WHITE_CHEVRON = '/icons/icon-chevron-white.svg';
const compareVehicles = 'compareVehicles';

let vehiclesList = [];
let vehiclePriceData = sessionStorage.getItem('vehiclePriceData');
vehiclePriceData = (vehiclePriceData && vehiclePriceData !== 'undefined') ? JSON.parse(vehiclePriceData) : [];

const getSkuItem = (sku) => {
  const vehicles = vehiclesList.length ? vehiclesList : vehiclePriceData?.data?.products?.items;
  const vehicle = vehicles.find((v) => v.sku === sku);
  if (vehicle) {
    return vehicle;
  }
  return null;
};

let traySection;
let drawerSection;
let comparedCardsContainer;
let compareButton;

const toggleDrawer = () => {
  drawerSection.classList.toggle('open');
};

const toggleTray = () => {
  traySection.classList.toggle('disappear');
};

const cards = [
  div({ class: 'compare-card' },
    button({ class: 'tray-add-cta', value: '1' },
      div({ class: 'add-cta-count' }, '01'),
      div({ class: 'add-cta-label' }, 'Add at least two vehicle to compare'),
    ),
  ),
  div({ class: 'compare-card' },
    button({ class: 'tray-add-cta', value: '2', disabled: 'disabled' },
      div({ class: 'add-cta-count' }, '02'),
      div({ class: 'add-cta-label' }, 'Add at least one more vehicle to compare'),
    ),
  ),
  div({ class: 'compare-card' },
    button({ class: 'tray-add-cta', value: '3', disabled: 'disabled' },
      div({ class: 'add-cta-count' }, '03'),
      div({ class: 'add-cta-label' }, 'Up to 3 vehicles can be compared at a time'),
    ),
  ),
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

const trayCard = (vehicle) => {
  let price = vehicle.price_range.minimum_price.regular_price.value;
  if (!Number.isNaN(price)) {
    price = price.toLocaleString('en-IN');
  }
  return div({ class: 'compare-card' },
    div(
      { class: 'tray-card-wrapper', 'data-bike-id': vehicle.sku },
      img({
        alt: vehicle.image.label,
        src: vehicle.image.url,
      }),
      div({ class: 'tray-card-details' },
        div({ class: 'card-details-label' }, vehicle.name),
        div(
          { class: 'card-details-amount' },
          'Starting at ',
          span({}, `₹${price}*`),
        ),
      ),
      button({ class: 'tray-remove-cta', 'data-bike-id': vehicle.sku },
        img({
          alt: 'Remove Vehicle',
          src: WHITE_CROSS_ICON,
        }),
      ),
    ),
  );
};

const toggleAccordion = ({ currentTarget }) => {
  const toogleButton = currentTarget;
  toogleButton.classList.toggle('active-acc');
  const content = toogleButton.closest('.drawer-accordion-wrapper').querySelector('.drawer-accordion-content');
  content.classList.toggle('collapsed');
};

const createVehicleButton = (buttonLabel, sku, cc, imageDetail) => button({
  class: 'select-vehicle', 'data-bike-id': sku,
},
img({
  alt: imageDetail.label,
  class: 'vehicle-image',
  src: imageDetail.url,
  loading: 'lazy',
}),
div({ class: 'vehicle-details' },
  div({ class: 'vehicle-label' }, buttonLabel),
  div({ class: 'vehicle-engine' },
    p(cc, sup('cc'), ' engine'),
  ),
),
);

const createAccordion = (accordionLabel, vehicles) => div({ class: 'drawer-accordion-wrapper' },
  button({ class: 'drawer-accordion-toggle', onclick: toggleAccordion },
    div({ class: 'drawer-accordion-label' }, accordionLabel),
    img({
      alt: 'Accordion Icon',
      class: 'drawer-accordion-icon',
      src: RED_CHEVRON,
    }),
  ),
  div({ class: 'drawer-accordion-content collapsed' },
    ...vehicles.map(v => createVehicleButton(v.name, v.sku, v.type_of_cc, v.image)),
  ),
);

const onVehicleRmove = (e) => {
  let comparedVehicle = sessionStorage.getItem(compareVehicles);
  if (comparedVehicle === 'undefined' || !comparedVehicle) {
    comparedVehicle = null;
  }
  const selectedVehicle = e.currentTarget.dataset.bikeId;
  document.querySelectorAll(`[data-bike-id="${selectedVehicle}"]`).forEach(el => {
    if (el.type === 'checkbox') {
      el.checked = false;
    }
  });
  let vehicles = [];
  if (comparedVehicle) {
    vehicles = JSON.parse(comparedVehicle);
  }
  vehicles.splice(vehicles.indexOf(selectedVehicle), 1);
  sessionStorage.setItem(compareVehicles, JSON.stringify(vehicles));
  renderTrayCards();
  if (!vehicles.length) {
    toggleTray();
  }
};

const onVehicleAdd = (e) => {
  let comparedVehicle = sessionStorage.getItem(compareVehicles);
  if (comparedVehicle === 'undefined' || !comparedVehicle) {
    comparedVehicle = null;
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
  if (vehicle) {
    sessionStorage.setItem(compareVehicles, JSON.stringify(vehicles));
  }
  renderTrayCards();
};

const vehicleToggler = () => {
  const vehicleDrawers = drawerSection.querySelectorAll('.drawer-content-motorcycles, .drawer-content-scooters');
  vehicleDrawers.forEach((drawer) => {
    drawer.classList.toggle('hidden');
  });
};

const renderTrayCards = () => {
  const cardCountLabel = traySection.querySelector('.card-count');
  let sessionVehicles = sessionStorage.getItem(compareVehicles);
  sessionVehicles = (sessionVehicles && sessionVehicles !== 'undefined') ? JSON.parse(sessionVehicles) : [];
  if (!sessionVehicles.length) {
    comparedCardsContainer.replaceChildren(...getTrayAddButtons());
    cardCountLabel.textContent = 0;
    compareButton.disabled = true;
    traySection.classList.remove('compared');
    return;
  }
  traySection.classList.add('compared');
  if (sessionVehicles.length > 1) {
    compareButton.disabled = false;
  } else {
    compareButton.disabled = true;
  }
  const cardsToRender = [];
  sessionVehicles.forEach((vehicleSku) => {
    const vehicleObj = getSkuItem(vehicleSku);
    if (vehicleObj) {
      cardsToRender.push(trayCard(vehicleObj));
    }
  });
  if (cardsToRender.length < 3) {
    cardsToRender.push(...getTrayAddButtons(cardsToRender.length + 1));
  }
  comparedCardsContainer.replaceChildren(...cardsToRender);
  cardCountLabel.textContent = sessionVehicles.length;
};

const clearSessionVehicles = () => {
  traySection.classList.add('disappear');
  JSON.parse(sessionStorage.getItem(compareVehicles))?.forEach((sku) => {
    document.querySelectorAll(`[value="${sku}"]`).forEach(check => {
      check.checked = false;
    });
  });
  sessionStorage.removeItem(compareVehicles);
  renderTrayCards();
};

const initVehicleRender = async () => {
  document.removeEventListener('mouseover', initVehicleRender);
  const { vehiclePriceData: newPriceData, vehiclesObj } = await fetchCategory();
  vehiclesList = newPriceData.data.products.items;
  if (vehiclesList) {
    sessionStorage.setItem('vehiclePriceData', JSON.stringify(newPriceData));
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
};

export { onVehicleAdd, onVehicleRmove };

export default function decorate(block) {
  traySection = section({ class: 'tray-container disappear open' },
    div({ class: 'tray-wrapper' },
      button({ class: 'tray-control' },
        div({ class: 'tray-toggle-cta' },
          img({
            alt: 'Toggle Tray',
            src: WHITE_CHEVRON,
            height: '100%',
            width: '70%',
          }),
        ),
        div({ class: 'tray-name' }, 'COMPARE ITEMS'),
        div({ class: 'tray-count' },
          span({ class: 'card-count' }, '0'),
          span({ class: 'card-max-dsk' }, '/3'),
          span({ class: 'card-max-mob' }, '/2'),
        ),
      ),
      div({ class: 'tray-card-container', id: 'compared-cards' }),
      div({ class: 'tray-cta-container' },
        button({ class: 'tray-clear-cta' }, 'CLEAR ALL'),
        button({ class: 'tray-compare-cta', disabled: true }, 'COMPARE NOW'),
      ),
    ),
  );

  drawerSection = section({ class: 'drawer-container opaque' },
    div({ class: 'drawer-wrapper' },
      div({ class: 'drawer-heading' }, 'Select Vehicle To Compare'),
      div({ class: 'drawer-tabs' },
        input({
          type: 'radio',
          name: 'vehicle-type',
          id: 'drawer-motorcycles',
          value: 'motorcycles',
          checked: 'checked',
        }),
        label({ for: 'drawer-motorcycles' }, 'Motorcycles'),
        input({
          type: 'radio',
          name: 'vehicle-type',
          id: 'drawer-scooters',
          value: 'scooters',
        }),
        label({ for: 'drawer-scooters' }, 'Scooters'),
      ),
      div({ class: 'drawer-content drawer-content-motorcycles' },
        div({ class: 'homepage-placeholder-div' },
          div({ class: 'drawer-fragment-wrap', id: 'motorcycles-drawer' }),
        ),
      ),
      div({ class: 'drawer-content drawer-content-scooters hidden' },
        div({ class: 'homepage-placeholder-div' },
          div({ class: 'drawer-fragment-wrap', id: 'scooters-drawer' }),
        ),
      ),
    ),
  );

  block.append(traySection, drawerSection);

  const localCompareButton = traySection.querySelector('.tray-compare-cta');
  const localComparedCardsContainer = traySection.querySelector('#compared-cards');
  compareButton = localCompareButton;
  comparedCardsContainer = localComparedCardsContainer;

  traySection.querySelector('.tray-control').addEventListener('click', toggleTray);
  drawerSection.querySelector('.drawer-tabs').addEventListener('change', vehicleToggler);
  drawerSection.addEventListener('click', toggleDrawer);

  compareButton.addEventListener('click', () => {
    window.location.href = comparePageUrl;
  });
  traySection.querySelector('.tray-clear-cta').addEventListener('click', clearSessionVehicles);

  document.querySelectorAll('.select-vehicle').forEach((buttonEl) => {
    buttonEl.addEventListener('click', (e) => {
      onVehicleAdd(e);
      drawerSection.classList.toggle('open');
    });
  });

  document.querySelectorAll('.tray-add-cta').forEach((buttonEl) => {
    buttonEl.addEventListener('click', toggleDrawer);
  });
  document.querySelectorAll('.tray-remove-cta').forEach((buttonEl) => {
    buttonEl.addEventListener('click', onVehicleRmove);
  });
  renderTrayCards();
  document.addEventListener('mouseover', initVehicleRender);

  return block;
}

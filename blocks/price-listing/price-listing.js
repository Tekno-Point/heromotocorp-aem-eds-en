import {
  fetchStateCityMaster,
  fetchStateCity,
  fetchProduct,
  useDataMapping,
  pubsub
} from "../../scripts/common.js";
import {
  div, label, fieldset, p, a, span, input as inputEl, img
} from "../../scripts/dom-helpers.js";

pubsub.subscribe('price-listing-event', updatePriceListing);

function createDropdownInput(placeholder) {
  const input = inputEl({ placeholder, class: 'react-select__input', autocomplete: 'off' });
  const clearBtn = span({ class: 'clear-btn' }, '×');
  const dropdownBtn = span({ class: 'dropdown-btn' },
    img({ src: '/icons/svgviewer-png-output.png', width: 16, height: 16, alt: 'Dropdown' })
  );
  const wrapper = div({ class: 'input-wrapper' }, input, clearBtn, dropdownBtn);
  const list = div({ class: 'custom-dropdown-list scrollable', style: 'display:none' });
  return { wrapper, input, clearBtn, dropdownBtn, list };
}

let selectedEl = null;
let isStateOpen = false;
let isCityOpen = false;

function populateList(input, list, data, onSelect) {
  list.innerHTML = '';
  const typedValue = (input.dataset.filter || '').trim().toLowerCase();
  const filtered = data.filter(d => d.label.toLowerCase().includes(typedValue));
  const currentValue = input.value.trim().toLowerCase();
  selectedEl = null;

  if (!filtered.length) {
    list.appendChild(div({ class: 'dropdown-item no-results' }, 'No results found'));
  } else {
    filtered.forEach(item => {
      const isSelected = item.label.toLowerCase() === currentValue;
      const itemEl = div(
        {
          class: `dropdown-item${isSelected ? ' selected' : ''}`,
          style: isSelected ? 'background-color: #007aff; font-weight: bold;' : ''
        },
        item.label
      );
      itemEl.addEventListener('click', () => {
        input.value = item.label;
        list.style.display = 'none';
        if (input.id === 'state-input') isStateOpen = false;
        if (input.id === 'city-input') isCityOpen = false;
        onSelect(item);
      });
      list.appendChild(itemEl);
      if (isSelected) selectedEl = itemEl;
    });
  }

  list.style.display = 'block';
  if (selectedEl) {
    setTimeout(() => selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
  } else if (filtered.length > 0) {
    const firstItemEl = list.querySelector('.dropdown-item:not(.no-results)');
    if (firstItemEl) {
      setTimeout(() => firstItemEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
    }
  }
}

async function decoratePriceListing() {
  const [dataMapping, setDataMapping] = await useDataMapping();
  const mapped = dataMapping.state_city_master;
  const states = mapped.state.map(label => ({ label, cities: Object.values(mapped[label]) }));

  const current = dataMapping.current_location;
  let selectedState = states.find(s => s.label.toUpperCase() === current.state.toUpperCase()) || states[0];
  let selectedCity = null;

  const { wrapper: sw, input: si, clearBtn: sc, dropdownBtn: sd, list: sl } = createDropdownInput('Enter State');
  const { wrapper: cw, input: ci, clearBtn: cc, dropdownBtn: cd, list: cl } = createDropdownInput('Enter City');

  si.id = 'state-input';
  ci.id = 'city-input';

  const dropdowns = div({ class: 'price-listing__row-col--container row' },
    div({ class: 'custom-select-state-city' },
      div({ class: 'custom-select-state-city__col' },
        div({ class: 'custom-autocomplete ' }, label({}, 'State'), sw, sl)
      )
    ),
    div({ class: 'custom-select-state-city__col false' },
      div({ class: 'custom-autocomplete ' }, label({}, 'City'), cw, cl)
    )
  );

  const priceInfo = div({ class: 'price-details--info' });
  const fieldsetEl = fieldset({ class: 'my-lg-12 my-6 w-100' }, priceInfo);

  async function renderPriceTable(state, cityCode) {
    priceInfo.innerHTML = '';
    priceInfo.append(
      div({ class: 'row' },
        div({ class: 'col-6' },
          div({ class: 'price-details-col' }, div({ class: 'price-details-col__text h4 weight-heavy' }, 'Variant'))
        ),
        div({ class: 'col-6' },
          div({ class: 'price-details-col' }, div({ class: 'price-details-col__text h4 weight-heavy' }, 'Ex-Showroom Price'))
        )
      )
    );
    const prod = await fetchProduct(state, cityCode);
    const variants = prod.data.products.items?.[0]?.variant_to_colors || [];

    if (variants.length === 0) {
      priceInfo.append(p({ class: 'body2 weight-medium text-center py-4' }, 'No price information available for this location.'));
    } else {
      variants.forEach(v => {
        priceInfo.append(
          div({ class: 'row' },
            div({ class: 'col-6' },
              div({ class: 'price-details-col' },
                div({ class: 'price-details-col__text' }, p({ class: 'body2 weight-medium' }, v.label))
              )
            ),
            div({ class: 'col-6' },
              div({ class: 'price-details-col' },
                div({ class: 'price-details-col__text' }, p({ class: 'body2 weight-medium' }, `₹ ${v.variant_price.toLocaleString('en-IN')}`))
              )
            )
          )
        );
      });
    }
  }

  si.addEventListener('focus', () => {
    si.dataset.filter = '';
    populateList(si, sl, states, onStateSelect);
    sl.style.display = 'block';
    isStateOpen = true;
    // Close city dropdown if state is focused
    if (isCityOpen) {
      cl.style.display = 'none';
      isCityOpen = false;
    }
  });

  si.addEventListener('input', () => {
    si.dataset.filter = si.value;
    populateList(si, sl, states, onStateSelect);
    sl.style.display = 'block';
    isStateOpen = true;
    // Close city dropdown if state input is typed into
    if (isCityOpen) {
      cl.style.display = 'none';
      isCityOpen = false;
    }
  });

  sd.addEventListener('click', e => {
    e.stopPropagation();
    if (isStateOpen) {
      sl.style.display = 'none';
      isStateOpen = false;
    } else {
      // Close city dropdown before opening state dropdown
      if (isCityOpen) {
        cl.style.display = 'none';
        isCityOpen = false;
      }
      si.dataset.filter = '';
      populateList(si, sl, states, onStateSelect);
      sl.style.display = 'block';
      isStateOpen = true;
      si.focus();
    }
  });

  sc.addEventListener('click', () => {
    si.value = '';
    sl.style.display = 'none';
    isStateOpen = false;
    ci.value = '';
    ci.disabled = true;
    cl.style.display = 'none';
    isCityOpen = false;
    // priceInfo.innerHTML = '<p class="no-results">Please select a state and city to view prices.</p>';
  });

  ci.addEventListener('focus', () => {
    if (ci.disabled) return;
    ci.dataset.filter = '';
    populateList(ci, cl, selectedState.cities, onCitySelect);
    cl.style.display = 'block';
    isCityOpen = true;
    // Close state dropdown if city is focused
    if (isStateOpen) {
      sl.style.display = 'none';
      isStateOpen = false;
    }
  });

  ci.addEventListener('input', () => {
    if (ci.disabled) return;
    ci.dataset.filter = ci.value;
    populateList(ci, cl, selectedState.cities, onCitySelect);
    cl.style.display = 'block';
    isCityOpen = true;
    // Close state dropdown if city input is typed into
    if (isStateOpen) {
      sl.style.display = 'none';
      isStateOpen = false;
    }
  });

  cd.addEventListener('click', e => {
    e.stopPropagation();
    if (ci.disabled) return;
    if (isCityOpen) {
      cl.style.display = 'none';
      isCityOpen = false;
    } else {
      // Close state dropdown before opening city dropdown
      if (isStateOpen) {
        sl.style.display = 'none';
        isStateOpen = false;
      }
      ci.dataset.filter = '';
      populateList(ci, cl, selectedState.cities, onCitySelect);
      cl.style.display = 'block';
      isCityOpen = true;
      ci.focus();
    }
  });

  cc.addEventListener('click', () => {
    ci.value = '';
    cl.style.display = 'none';
    isCityOpen = false;
    // priceInfo.innerHTML = '<p class="no-results">Please select a state and city to view prices.</p>';
  });

  document.addEventListener('click', e => {
    if (!sw.contains(e.target) && isStateOpen) {
      sl.style.display = 'none';
      isStateOpen = false;
    }
    if (!cw.contains(e.target) && isCityOpen) {
      cl.style.display = 'none';
      isCityOpen = false;
    }
  });

  async function onStateSelect(s) {
    selectedState = s;
    selectedCity = null;
    ci.disabled = false;
    ci.value = '';
    cl.style.display = 'none';
    isCityOpen = false;

    // priceInfo.innerHTML = '<p class="no-results">Please select a city to view prices.</p>';

    sl.style.display = 'none';
    isStateOpen = false;

    // const [dataMapping, setCurrentDataMapping] = await useDataMapping();
    // dataMapping.current_location = { state: s.label, city: '' };
    // setCurrentDataMapping(dataMapping);

    // pubsub.publish("product-banner-event", document.querySelector(".product-banner"), { test: true });
  }

  async function onCitySelect(c) {
    selectedCity = c;
    renderPriceTable(selectedState.label, c.code);
    cl.style.display = 'none';
    isCityOpen = false;

    const [dataMapping, setCurrentDataMapping] = await useDataMapping();
    dataMapping.current_location = { state: selectedState.label, city: selectedCity.code };
    setCurrentDataMapping(dataMapping);

    pubsub.publish("product-banner-event", document.querySelector(".product-banner"), { test: true });
  }

  si.value = selectedState ? selectedState.label : '';
  const initialCityFromMapping = selectedState.cities.find(c => c.code.toUpperCase() === current.city.toUpperCase());
  if (initialCityFromMapping) {
    ci.value = initialCityFromMapping.label;
    selectedCity = initialCityFromMapping;
  } else {
    ci.value = '';
    selectedCity = null;
  }
  ci.disabled = !selectedState;

  if (selectedState && selectedCity) {
    renderPriceTable(selectedState.label, selectedCity.code);
  } else {
    // priceInfo.innerHTML = '<p class="no-results">Please select a state and city to view prices.</p>';
  }

  return { dropdowns, fieldsetEl }
}

export async function updatePriceListing() {
  const block = document.querySelector('.price-listing.block');
  if (!block) return;
  const { dropdowns, fieldsetEl } = await decoratePriceListing();
  const headingUL = block.children[1].querySelector('ul');
  const liList = headingUL?.querySelectorAll('li') || [];
  if (liList[0]) liList[0].replaceChildren(dropdowns, fieldsetEl);
}

export default async function decorate(block) {
  const { dropdowns, fieldsetEl } = await decoratePriceListing();
  const headingUL = block.children[1].querySelector('ul');
  const liList = headingUL?.querySelectorAll('li') || [];

  if (liList[0]) {
    liList[0].replaceChildren(dropdowns, fieldsetEl);
  }

  if (liList[1]) {
    const innerUL = liList[1].querySelector('ul');
    if (innerUL) {
      const links = [...innerUL.querySelectorAll('li a')];
      const wrap = document.createElement('div');
      if (links[0]) {
        wrap.append(a({ href: links[0].href, class: 'avail-finance-button-size' }, links[0].textContent.trim()));
      }
      if (links[1]) {
        wrap.append(a({ href: links[1].href, class: 'buynow-button-size button' }, links[1].textContent.trim()));
      }
      innerUL.replaceWith(wrap);
    }
  }
}

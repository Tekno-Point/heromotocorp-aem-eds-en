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
  // const dropdownBtn = span({ class: 'dropdown-btn' },
  //   img({ src: '/icons/chevron_down.svg', width: 16, height: 16, alt: 'Dropdown' })
  // );
  const wrapper = div({ class: 'input-wrapper' }, input, clearBtn/*, dropdownBtn*/);
  const list = div({ class: 'custom-dropdown-list scrollable', style: 'display:none' });
  return { wrapper, input, clearBtn/*, dropdownBtn*/, list };
}

function populateList(input, list, data, onSelect) {
  list.innerHTML = '';
  const filtered = data.filter(d => d.label.toLowerCase().includes(input.value.trim().toLowerCase()));
  if (!filtered.length) {
    list.appendChild(div({ class: 'dropdown-item no-results' }, 'No results found'));
  } else {
    filtered.forEach(item => {
      const itemEl = div({ class: 'dropdown-item' }, item.label);
      itemEl.addEventListener('click', () => { input.value = item.label; list.style.display = 'none'; onSelect(item); });
      list.appendChild(itemEl);
    });
  }
  list.style.display = 'block';
}

async function decoratePriceListing() {
  // const raw = await fetchStateCityMaster();
  const [dataMapping] = await useDataMapping();
  const mapped = dataMapping.state_city_master;
  const states = mapped.state.map(label => ({ label, cities: Object.values(mapped[label]) }));

  const current = dataMapping.current_location;
  let selectedState = states.find(s => s.label.toUpperCase() === current.state.toUpperCase()) || states[0];
  let selectedCity = selectedState.cities.find(c => c.label.toUpperCase() === current.city.toUpperCase()) || selectedState.cities[0];

  const { wrapper: sw, input: si, clearBtn: sc/*, dropdownBtn: sd*/,arrowBtn:sa, list: sl } = createDropdownInput('Select State');
  const { wrapper: cw, input: ci, clearBtn: cc/*, dropdownBtn: cd*/,arrowBtn:ca, list: cl } = createDropdownInput('Select City');

  const dropdowns = div({ class: 'price-listing__row-col--container row' },
    div({ class: 'custom-select-state-city z-1 px-md-6 px-lg-6' },
      div({ class: 'custom-select-state-city__col' },
        div({ class: 'custom-autocomplete position-relative' }, label({}, 'State'), sw, sl)
      )
    ),
    div({ class: 'custom-select-state-city__col false' },
      div({ class: 'custom-autocomplete position-relative' }, label({}, 'City'), cw, cl)
    )
  );

  const priceInfo = div({ class: 'price-details--info w-100 my-lg-4 px-0' });
  const fieldsetEl = fieldset({ class: 'my-lg-12 my-6 w-100' }, priceInfo);

  async function renderPriceTable(state, cityCode) {
    priceInfo.innerHTML = '';
    priceInfo.append(
      div({ class: 'row' },
        div({ class: 'col-6' },
          div({ class: 'price-details-col pb-6 pb-sm-12' }, div({ class: 'price-details-col__text h4 weight-heavy' }, 'Variant'))
        ),
        div({ class: 'col-6' },
          div({ class: 'price-details-col pb-6 pb-sm-12 ps-6 pe-0' }, div({ class: 'price-details-col__text h4 weight-heavy' }, 'Ex-Showroom Price'))
        )
      )
    );
    const prod = await fetchProduct(state, cityCode);
    const variants = prod.data.products.items?.[0]?.variant_to_colors || [];
    variants.forEach(v => {
      priceInfo.append(
        div({ class: 'row' },
          div({ class: 'col-6' },
            div({ class: 'price-details-col pb-6 pb-sm-12' },
              div({ class: 'price-details-col__text' }, p({ class: 'body2 weight-medium' }, v.label))
            )
          ),
          div({ class: 'col-6' },
            div({ class: 'price-details-col pb-6 pb-sm-12 ps-6 pe-6' },
              div({ class: 'price-details-col__text' }, p({ class: 'body2 weight-medium' }, `₹ ${v.variant_price}`))
            )
          )
        )
      );
    });
  }

  // ==== events ====
  async function onStateSelect(s) {
    selectedState = s; selectedCity = s.cities[0];
    ci.disabled = false;
    ci.value = selectedCity.label;
    renderPriceTable(s.label, selectedCity.code);
    const [dataMapping, setDataMapping] = await useDataMapping();
    dataMapping.current_location = {
      state: s.label,
      city: selectedCity.code,
    };
    setDataMapping(dataMapping);
    pubsub.publish("product-banner-event", document.querySelector(".product-banner"), {
      test: true,
    });
  }
  async function onCitySelect(c) {
    selectedCity = c;
    renderPriceTable(selectedState.label, c.code);
    const [dataMapping, setDataMapping] = await useDataMapping();
    dataMapping.current_location = {
      state: selectedState.label,
      city: selectedCity.code,
    };
    setDataMapping(dataMapping);
    pubsub.publish("product-banner-event", document.querySelector(".product-banner"), {
      test: true,
    });
  }
let isStateOpen = false;
let isCityOpen = false;

  si.addEventListener('input', () => populateList(si, sl, states, onStateSelect));
  // sd.addEventListener('click', e => { e.stopPropagation(); sl.style.display !== 'block' ? populateList(si, sl, states, onStateSelect) : sl.style.display = 'none'; si.focus(); });
  sw.addEventListener('click', e => (e.stopPropagation(), isStateOpen ? (sl.style.display = 'none', isStateOpen = false) : (populateList(si, sl, states, onStateSelect), si.focus(), sl.style.display = 'block', isStateOpen = true)));  sc.addEventListener('click', () => { si.value = ''; sl.style.display = 'none'; });

  ci.disabled = !selectedState;
  ci.addEventListener('input', () => populateList(ci, cl, selectedState.cities, onCitySelect));
  cw.addEventListener('click', e => (e.stopPropagation(), !selectedState ? null : isCityOpen ? (cl.style.display = 'none', isCityOpen = false) : (populateList(ci, cl, selectedState.cities, onCitySelect), ci.focus(), cl.style.display = 'block', isCityOpen = true)));  
  // cd.addEventListener('click', e => { e.stopPropagation(); cl.style.display !== 'block' ? populateList(ci, cl, selectedState.cities, onCitySelect) : cl.style.display = 'none'; ci.focus(); });
  cc.addEventListener('click', () => { ci.value = ''; cl.style.display = 'none'; });

  si.addEventListener('focus', () => populateList(si, sl, states, onStateSelect));
  ci.addEventListener('focus', () => populateList(ci, cl, selectedState.cities, onCitySelect));

  document.addEventListener('click', e => {
    !sw.contains(e.target) && (sl.style.display = 'none');
    !cw.contains(e.target) && (cl.style.display = 'none');
  });

  si.value = selectedState.label;
  ci.value = selectedCity.label;
  renderPriceTable(selectedState.label, selectedCity.code);
  return { dropdowns, fieldsetEl }
}

export async function updatePriceListing() {
  const block = document.querySelector('.price-listing.block');
  const { dropdowns, fieldsetEl } = await decoratePriceListing();
  const headingUL = block.querySelector('h1')?.closest('div')?.querySelector('ul');
  const liList = headingUL?.querySelectorAll('li') || [];
  if (liList[0]) liList[0].replaceChildren(dropdowns, fieldsetEl);
}
export default async function decorate(block) {
  const { dropdowns, fieldsetEl } = await decoratePriceListing();
  const headingUL = block.querySelector('h1')?.closest('div')?.querySelector('ul');
  const liList = headingUL?.querySelectorAll('li') || [];
  if (liList[0]) liList[0].replaceChildren(dropdowns, fieldsetEl);
  if (liList[1]) {
    const innerUL = liList[1].querySelector('ul');
    if (innerUL) {
      const labels = [...innerUL.querySelectorAll('li')].map(li => li.textContent.trim());
      const wrap = div();
      if (labels[0]) wrap.append(a({ href: '/content/hero-commerce/in/en/pre-approved-offers.html', class: 'avail-finance-button-size' }, labels[0]));
      if (labels[1]) wrap.append(a({ href: 'https://www.heromotocorp.com/.../splendor-plus.html', class: 'buynow-button-size button' }, labels[1]));
      innerUL.replaceWith(wrap);
    }
  }
}

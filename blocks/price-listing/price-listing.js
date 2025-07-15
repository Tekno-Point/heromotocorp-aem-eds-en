import { fetchStateCityMaster, fetchProdcut } from "../../scripts/common.js";
import { div, label, select, option, fieldset, p } from "../../scripts/dom-helpers.js";

export default async function decorate(block) {
  const stateCityData = await fetchStateCityMaster();
  const states = stateCityData.data.stateCity.map(item => ({
    code: item.code,
    label: item.label,
    cities: item.cities,
  }));

  // --- Dropdown Elements ---
  const stateSelect = select({ class: 'react-select__input' },
    ...states.map(state => option({ value: state.label }, state.label))
  );
  const citySelect = select({ class: 'react-select__input' });

  const dropdownsContainer = div({ class: 'price-listing__row-col--container row' },
    div({ class: 'custom-select-state-city z-1 px-md-6 px-lg-6' },
      div({ class: 'custom-select-state-city__col' },
        div({ class: 'custom-autocomplete position-relative' },
          label({}, 'State'),
          stateSelect
        )
      )
    ),
    div({ class: 'custom-select-state-city__col false' },
      div({ class: 'custom-autocomplete position-relative' },
        label({}, 'City'),
        citySelect
      )
    )
  );

  const priceInfo = div({ class: 'price-details--info w-100 my-lg-4 px-0' });
  const fieldsetEl = fieldset({ class: 'my-lg-12 my-6 w-100' }, priceInfo);

  // --- DOM Injection ---
  const headingWrapper = block.querySelector('h1')?.closest('div');
  const headingUL = headingWrapper?.querySelector('ul');
  const liList = headingUL?.querySelectorAll('li');

  if (liList?.length > 0) {
    // Replace <p>ul</p> with dropdown + price table
    const firstLi = liList[0];
    firstLi.innerHTML = ''; // remove <p>ul</p>
    firstLi.appendChild(dropdownsContainer);
    firstLi.appendChild(fieldsetEl);
  }

  if (liList?.length > 1) {
    const secondLi = liList[1];
    const innerUL = secondLi.querySelector('ul');
    if (innerUL) {
      const labels = [...innerUL.querySelectorAll('li')].map(li => li.textContent?.trim());
      const wrapper = document.createElement('div');
      wrapper.className = 'price-listing__row-col--button align-items-center d-flex';

      if (labels[0]) {
        const btn1 = document.createElement('a');
        btn1.href = '/content/hero-commerce/in/en/pre-approved-offers.html';
        btn1.textContent = labels[0];
        btn1.className = 'avail-finance-button-size button button--secondary weight-heavy bg-white text-error border-error text-uppercase d-flex border rounded-2 cta-text py-4 px-12 d-inline-flex justify-content-center flex-row text-center align-items-center';
        wrapper.appendChild(btn1);
      }

      if (labels[1]) {
        const btn2 = document.createElement('a');
        btn2.href = 'https://www.heromotocorp.com/en-in/buy-now/practical/splendor-plus.html';
        btn2.textContent = labels[1];
        btn2.className = 'buynow-button-size button button--primary weight-heavy cta-text d-flex flex-row justify-content-center align-items-center text-uppercase rounded-2 py-4 px-12 py-sm-5 px-sm-16 text-white gradient-1 border-0';
        wrapper.appendChild(btn2);
      }

      innerUL.replaceWith(wrapper);
    }
  }

  // --- Dropdown Interaction ---
  function updateCityDropdown(stateLabel) {
    const state = states.find((s) => s.label === stateLabel);
    citySelect.innerHTML = '';
    if (state?.cities) {
      state.cities.forEach(city => {
        citySelect.appendChild(option({ value: city.code }, city.label));
      });
    }
  }

  async function renderPriceTable(stateLabel, cityCode) {
    priceInfo.innerHTML = '';

    // Table header
    const headerRow = div({ class: 'row' },
      div({ class: 'col-6' },
        div({ class: 'price-details-col pb-6 pb-sm-12' },
          div({ class: 'price-details-col__text h4 weight-heavy' }, 'Variant')
        )
      ),
      div({ class: 'col-6' },
        div({ class: 'price-details-col pb-6 pb-sm-12 ps-6 pe-0' },
          div({ class: 'price-details-col__text h4 weight-heavy' }, 'Ex-Showroom Price')
        )
      )
    );
    priceInfo.appendChild(headerRow);

    // API data
    const state = states.find(s => s.label === stateLabel);
    if (!state) return;
    const city = state.cities.find(c => c.code === cityCode);
    if (!city) return;

    const productData = await fetchProdcut(state.label, city.code);
    const variants = productData?.data?.products?.items?.[0]?.variant_to_colors || [];

    variants.forEach(v => {
      const row = div({ class: 'row' },
        div({ class: 'col-6' },
          div({ class: 'price-details-col pb-6 pb-sm-12' },
            div({ class: 'price-details-col__text' },
              p({ class: 'body2 weight-medium' }, v.label)
            )
          )
        ),
        div({ class: 'col-6' },
          div({ class: 'price-details-col pb-6 pb-sm-12 ps-6 pe-6' },
            div({ class: 'price-details-col__text' },
              p({ class: 'body2 weight-medium' }, `₹ ${v.variant_price}`)
            )
          )
        )
      );
      priceInfo.appendChild(row);
    });
  }

  // --- Listeners ---
  stateSelect.addEventListener('change', () => {
    updateCityDropdown(stateSelect.value);
    if (citySelect.options.length > 0) {
      renderPriceTable(stateSelect.value, citySelect.value);
    } else {
      priceInfo.innerHTML = '';
    }
  });

  citySelect.addEventListener('change', () => {
    renderPriceTable(stateSelect.value, citySelect.value);
  });

  // --- Init ---
  updateCityDropdown(stateSelect.value);
  if (citySelect.options.length > 0) {
    renderPriceTable(stateSelect.value, citySelect.value);
  }
}

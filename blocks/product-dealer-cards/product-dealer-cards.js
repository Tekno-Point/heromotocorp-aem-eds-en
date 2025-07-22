import { fetchDealers, useDataMapping, pubsub } from "../../scripts/common.js";
import { div, p, span } from "../../scripts/dom-helpers.js";
import Swiper from "../carousel/swiper.min.js";
pubsub.subscribe('product-dealer-cards-event', decorateProductDealerCards);

function createCustomDropdown(className, labelText, optionsList, onSelect, defaultValue = "") {
  const wrapper = div({ class: "custom-select-wrapper position-relative" });

  const labelEl = p({ class: "dropdown-label mb-1" }, labelText);

  const inputWrapper = document.createElement("div");
  inputWrapper.className = "input-wrapper";
  inputWrapper.style.position = "relative";

  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.placeholder = `Select ${labelText}`;
  inputEl.className = `custom-input react-select__input ${className}`;
  inputEl.value = defaultValue;
  inputEl.autocomplete = "off";
  inputEl.style.width = "100%";


  const clearBtn = document.createElement("span");
  clearBtn.textContent = "×";
  clearBtn.className = "clear-btn";
  clearBtn.style.cssText = `
    color: silver;
    position: absolute;
    right: 27px;
    cursor: pointer;
    display: ${defaultValue ? 'block' : 'none'};
    z-index: 4;
  `;

  const arrowBtn = document.createElement("span");
  arrowBtn.className = "dropdown-arrow";
  arrowBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 8px;
    width: 12px;
    height: 12px;
    cursor: pointer;
  `;

  const dropdown = document.createElement("ul");
  dropdown.className = "dropdown-options position-absolute bg-white border rounded shadow-sm z-3 mt-1";
  dropdown.style.cssText = "max-height: 180px; overflow-y: auto; max-width:100%; display: none;";

  inputWrapper.appendChild(inputEl);
  inputWrapper.appendChild(clearBtn);
  inputWrapper.appendChild(arrowBtn);

  wrapper.appendChild(labelEl);
  wrapper.appendChild(inputWrapper);
  wrapper.appendChild(dropdown);

  let isDropdownOpen = false;
  let disabled = false; // 🔹 Added flag to track disabled state

  function updateOptions(query = "") {
    if (disabled) return; // 🔹 Do nothing if disabled

    dropdown.innerHTML = "";
    const currentValue = inputEl.value.trim().toLowerCase();

    const filtered = query.trim()
      ? optionsList.filter(opt => opt.toLowerCase().includes(query.toLowerCase()))
      : optionsList;

    if (!filtered.length) {
      const li = document.createElement("li");
      li.textContent = "No results found";
      li.className = "dropdown-option px-3 py-2 text-muted";
      dropdown.appendChild(li);
    } else {
      filtered.forEach(value => {
        const isSelected = value.toLowerCase() === currentValue;
        const li = document.createElement("li");
        li.textContent = value;
        li.className = `dropdown-option px-3 py-2 hover-bg${isSelected ? ' selected' : ''}`;
        if (isSelected) {
          li.style.backgroundColor = '#f1f1f1';
          li.style.fontWeight = 'bold';
        }
        li.addEventListener("click", () => {
          inputEl.value = value;
          dropdown.style.display = "none";
          isDropdownOpen = false;
          clearBtn.style.display = "block";
          onSelect(value);
        });
        dropdown.appendChild(li);
      });
    }

    dropdown.style.display = "block";
    isDropdownOpen = true;
  }

  inputEl.addEventListener("input", () => {
    if (disabled) return; // 🔹 Prevent input when disabled
    clearBtn.style.display = inputEl.value ? "block" : "none";
    updateOptions(inputEl.value);
  });

  inputEl.addEventListener("focus", () => {
    if (disabled) return; // 🔹 Prevent focus actions when disabled
    updateOptions();
    // inputEl.select();
  });

  clearBtn.addEventListener("click", () => {
    if (disabled) return; // 🔹 Prevent clear when disabled
    inputEl.value = "";
    clearBtn.style.display = "block";
    updateOptions();
    isDropdownOpen = false;
    onSelect("");
  });

  arrowBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (disabled) return; // 🔹 Prevent dropdown toggle when disabled
    if (isDropdownOpen) {
      dropdown.style.display = "none";
      isDropdownOpen = false;
    } else {
      updateOptions();
      inputEl.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = "none";
      isDropdownOpen = false;
    }
  });

  return {
    wrapper,
    inputEl,
    setDisabled: (state) => {
      disabled = state;
      inputEl.disabled = state;
      dropdown.style.display = "none";
    },
    setOptions: (newOptions) => {
      optionsList = newOptions;
    }
  };
}

export async function decorateProductDealerCards(block = document.querySelector('.product-dealer-cards')) {
  const [dataMapping] = await useDataMapping();

  const sku = dataMapping?.sku;
  const current = dataMapping.current_location || {};
  const states = dataMapping.state_city_master.state;
  const cityMap = dataMapping.state_city_master;

  let activeState =
    current.state && cityMap[current.state.toUpperCase()]
      ? current.state
      : states[0];
  let activeCity =
    current.city &&
      cityMap[activeState.toUpperCase()] &&
      Object.values(cityMap[activeState.toUpperCase()]).some(
        (c) => c.label.toUpperCase() === current.city.toUpperCase()
      )
      ? current.city
      : Object.values(cityMap[activeState.toUpperCase()])[0]?.label;

  let cityDropdown;

  const stateDropdown = createCustomDropdown(
    "state-input",
    "State",
    states,
    async (newState) => {
      activeState = newState;

      if (!newState || !cityMap[newState.toUpperCase()]) {
        cityDropdown.setOptions([]);
        cityDropdown.inputEl.value = "";
        cityDropdown.setDisabled(true); // ✅ Disable city if no state
        return;
      }

      const cityList = Object.values(cityMap[newState.toUpperCase()] || {}).map((c) => c.label);
      activeCity = cityList[0];

      cityDropdown.setOptions(cityList);
      cityDropdown.inputEl.value = activeCity;
      cityDropdown.setDisabled(false);

      const [dataMapping, setDataMapping] = await useDataMapping();
      dataMapping.current_location = { state: activeState, city: activeCity };
      setDataMapping(dataMapping);

      renderDealers(activeState, activeCity);
      pubsub.publish("product-banner-event", document.querySelector(".product-banner"), {
        test: true,
      });
    },
    activeState
  );

  const cityList = Object.values(cityMap[activeState.toUpperCase()] || {}).map(
    (c) => c.label
  );
  cityDropdown = createCustomDropdown(
    "city-input",
    "City",
    cityList,
    async (newCity) => {
      activeCity = newCity;

      const [dataMapping, setDataMapping] = await useDataMapping();
      dataMapping.current_location = { state: activeState, city: activeCity };
      setDataMapping(dataMapping);

      if (!newCity) {
        return;
      }

      renderDealers(activeState, activeCity);

      pubsub.publish("product-banner-event", document.querySelector(".product-banner"), {
        test: true,
      });
    },
    activeCity
  );

  cityDropdown.setDisabled(true);

  // ✅ Re-enable city dropdown if a valid state is pre-selected
  if (activeState && cityMap[activeState.toUpperCase()]) {
    const cityList = Object.values(cityMap[activeState.toUpperCase()] || {}).map((c) => c.label);
    cityDropdown.setOptions(cityList);
    cityDropdown.setDisabled(false);
  }

  const dropdowns = div(
    {
      class: "dealer-dropdownss",
    },
    stateDropdown.wrapper,
    cityDropdown.wrapper
  );

  const swiperWrapper = div({ class: "swiper-wrapper" });
  const swiperEl = div(
    { class: "dealer-card-wrapperr row swiper" },
    swiperWrapper
  );
  block.innerHTML = "";
  block.appendChild(dropdowns);
  block.appendChild(swiperEl);

  async function renderDealers(state, city) {
    const cityData = Object.values(cityMap[state.toUpperCase()] || []).find(
      (c) => c.label.toUpperCase() === city.toUpperCase()
    );

    if (!cityData) {
      swiperWrapper.innerHTML = "<p>No city data found.</p>";
      return;
    }

    const dealerData = await fetchDealers(
      sku,
      cityData.stateCode,
      cityData.code
    );
    const dealers = dealerData?.data?.dealers?.items || [];

    if (!dealers.length) {
      swiperWrapper.innerHTML = "<p>No dealers found for this location.</p>";
      return;
    }

    const slidesPerView = "swiper-slide";

    swiperWrapper.innerHTML = "";

    dealers.forEach((dealer) => {
      const card = div(
        { class: slidesPerView },
        div(
          {
            class: "dealer-card",
          },
          div({ class: "dealer-name" }, div({ class: "wrapper" }, span({ class: "heroicon-logo hero-icon" },
            span({ class: "path1 heroicon-logo hero-icon" }),
            span({ class: "path2 heroicon-logo hero-icon" }),
            span({ class: "path3 heroicon-logo hero-icon" })
          ), dealer.name)
          ),
          p({ class: 'dealer-phone' }, div({ class: "wrapper" }, span({ class: "hero-icon heroicon-call" }), `${dealer.phone}`)),
          p({ class: 'dealer-email' }, div({ class: "wrapper" }, span({ class: "hero-icon heroicon-email" }), `${dealer.email}`)),
          p({ class: 'dealer-address' }, div({ class: "wrapper" }, span({ class: "hero-icon heroicon-address" },
            span({ class: "path1 heroicon-logo hero-icon" }),
            span({ class: "path2 heroicon-logo hero-icon" }),
            span({ class: "path3 heroicon-logo hero-icon" })
          ),
            `${dealer.address_line_1} ${dealer.address_line_2} ${dealer.city}, ${dealer.state} - ${dealer.zip_code}`)),
        )
      );
      swiperWrapper.appendChild(card);
    });

    const paginationEl = document.createElement("div");
    paginationEl.classList.add("swiper-pagination");
    swiperEl.appendChild(paginationEl);
    Swiper = new Swiper(swiperEl, {
      grabCursor: true,
      spaceBetween: 20,
      pagination: {
        el: paginationEl,
        clickable: true,
      },
      observer: true,
      observeParents: true,
      breakpoints: {
        0: {
          slidesPerView: 1.2,
        },
        768: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 4,
        },
      },
    });
  }

  renderDealers(activeState, activeCity);
}

export default function decorate(block) {
  decorateProductDealerCards(block)
}

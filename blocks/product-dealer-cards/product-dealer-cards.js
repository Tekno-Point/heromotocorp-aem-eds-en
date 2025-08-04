import { fetchDealers, useDataMapping, pubsub } from "../../scripts/common.js";
import { div, p, span } from "../../scripts/dom-helpers.js";
import Swiper from "../swiper/swiper.min.js";

pubsub.subscribe('product-dealer-cards-event', decorateProductDealerCards);

let selectedEl = null;
let isStateDropdownOpen = false;
let isCityDropdownOpen = false;
let isEmptyInput = true;

function createCustomDropdown(className, labelText, optionsList, onSelect, defaultValue = "") {
  const wrapper = div({ class: "custom-select-wrapper position-relative" });
  const labelEl = p({ class: "dropdown-label mb-1" }, labelText);
  const inputWrapper = document.createElement("div");
  inputWrapper.className = "input-wrapper";

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
  clearBtn.style.display = defaultValue ? 'block' : 'none';

  const arrowBtn = document.createElement("span");
  arrowBtn.className = "dropdown-arrow";

  const dropdown = document.createElement("ul");
  dropdown.className = "dropdown-options position-absolute bg-white border rounded shadow-sm z-3 mt-1";
  dropdown.style.cssText = "max-height: 250px; overflow-y: auto; max-width:100%; display: none;";

  inputWrapper.appendChild(inputEl);
  inputWrapper.appendChild(clearBtn);
  inputWrapper.appendChild(arrowBtn);
  wrapper.appendChild(labelEl);
  wrapper.appendChild(inputWrapper);
  wrapper.appendChild(dropdown);

  let disabled = false;

  function updateOptions(query = "") {
    if (disabled) return;

    dropdown.innerHTML = "";
    const currentValue = inputEl.value.trim().toLowerCase();
    selectedEl = null;

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
          li.style.backgroundColor = '#007aff';
          li.style.fontWeight = 'bold';
          selectedEl = li;
        }
        li.addEventListener("click", (e) => {
          inputEl.value = value;
          dropdown.style.display = "none";
          if (inputEl.id === 'state-input') isStateDropdownOpen = false;
          if (inputEl.id === 'city-input') isCityDropdownOpen = false;
          onSelect(value);
          clearBtn.style.display = "block";
        });
        dropdown.appendChild(li);
      });
    }

    dropdown.style.display = "block";
    if (inputEl.id === 'state-input') isStateDropdownOpen = true;
    if (inputEl.id === 'city-input') isCityDropdownOpen = true;

    if (selectedEl) {
      setTimeout(() => selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" }), 0);
    } else if (filtered.length > 0) {
      const firstItemEl = dropdown.querySelector('.dropdown-option:not(.no-results)');
      if (firstItemEl) {
        setTimeout(() => firstItemEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 0);
      }
    }
  }

  inputEl.addEventListener("input", (e) => {
    if (disabled) return;
     if (isEmptyInput) {
      inputEl.value = e.data;
      isEmptyInput = false;
    }
    clearBtn.style.display = inputEl.value ? "block" : "none";
    updateOptions(inputEl.value);
    if (inputEl.id === 'state-input' && isCityDropdownOpen) {
      cityDropdown.wrapper.querySelector('.dropdown-options').style.display = 'none';
      isCityDropdownOpen = false;
    } else if (inputEl.id === 'city-input' && isStateDropdownOpen) {
      stateDropdown.wrapper.querySelector('.dropdown-options').style.display = 'none';
      isStateDropdownOpen = false;
    }
  });

  inputEl.addEventListener("focus", () => {
    if (disabled) return;
    isEmptyInput = true;
    updateOptions();
    if (inputEl.id === 'state-input' && isCityDropdownOpen) {
      cityDropdown.wrapper.querySelector('.dropdown-options').style.display = 'none';
      isCityDropdownOpen = false;
    } else if (inputEl.id === 'city-input' && isStateDropdownOpen) {
      stateDropdown.wrapper.querySelector('.dropdown-options').style.display = 'none';
      isStateDropdownOpen = false;
    }
  });

  clearBtn.addEventListener("click", () => {
    if (disabled) return;
    inputEl.value = "";
    clearBtn.style.display = "none";
    dropdown.style.display = "none";
    if (inputEl.id === 'state-input') isStateDropdownOpen = false;
    if (inputEl.id === 'city-input') isCityDropdownOpen = false;
    onSelect("");
  });

  arrowBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (disabled) return;
    const isCurrentDropdownOpen = (inputEl.id === 'state-input' && isStateDropdownOpen) || (inputEl.id === 'city-input' && isCityDropdownOpen);

    if (isCurrentDropdownOpen) {
      dropdown.style.display = "none";
      if (inputEl.id === 'state-input') isStateDropdownOpen = false;
      if (inputEl.id === 'city-input') isCityDropdownOpen = false;
    } else {
      if (inputEl.id === 'state-input' && isCityDropdownOpen) {
        cityDropdown.wrapper.querySelector('.dropdown-options').style.display = 'none';
        isCityDropdownOpen = false;
      } else if (inputEl.id === 'city-input' && isStateDropdownOpen) {
        stateDropdown.wrapper.querySelector('.dropdown-options').style.display = 'none';
        isStateDropdownOpen = false;
      }
      updateOptions();
      inputEl.focus();
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target) && dropdown.style.display === 'block') {
      dropdown.style.display = "none";
      if (inputEl.id === 'state-input') isStateDropdownOpen = false;
      if (inputEl.id === 'city-input') isCityDropdownOpen = false;
    }
  });

  return {
    wrapper,
    inputEl,
    setDisabled: (state) => {
      disabled = state;
      inputEl.disabled = state;
      dropdown.style.display = "none";

      if (state) {
        clearBtn.style.display = "none";
      }
    },
    setOptions: (newOptions) => {
      optionsList = newOptions;
    }
  };
}

let stateDropdown;
let cityDropdown;

export async function decorateProductDealerCards(block = document.querySelector('.product-dealer-cards')) {
  const [dataMapping, setDataMapping] = await useDataMapping();
  const sku = dataMapping?.sku;
  const current = dataMapping.current_location || {};
  const states = dataMapping.state_city_master.state;
  const cityMap = dataMapping.state_city_master;

  let activeState = current.state && cityMap[current.state.toUpperCase()] ? current.state : states[0];
  let activeCity = current?.city || "";

  stateDropdown = createCustomDropdown(
    "state-input",
    "State",
    states,
    async (newState) => {
      activeState = newState;
      activeCity = "";
      cityDropdown.inputEl.value = "";
      cityDropdown.setOptions([]);
      cityDropdown.setDisabled(true);

      if (!newState || !cityMap[newState.toUpperCase()]) {
        dataMapping.current_location = { state: activeState, city: "" };
        setDataMapping(dataMapping);
        // swiperWrapper.innerHTML = "<p>Please select a state and city to find dealers.</p>";
        // pubsub.publish("product-banner-event", document.querySelector(".product-banner"), { test: true });
        return;
      }

      const cityList = Object.values(cityMap[newState.toUpperCase()] || {}).map((c) => c.label);
      cityDropdown.setOptions(cityList);
      cityDropdown.setDisabled(false);
      dataMapping.current_location = { state: activeState, city: "" };
      setDataMapping(dataMapping);
      // swiperWrapper.innerHTML = "<p>Please select a city to find dealers.</p>";
      // pubsub.publish("product-banner-event", document.querySelector(".product-banner"), { test: true });
    },
    activeState
  );

  const initialCityList = Object.values(cityMap[activeState.toUpperCase()] || {}).map((c) => c.label);
  cityDropdown = createCustomDropdown(
    "city-input",
    "City",
    initialCityList,
    async (newCity) => {
      activeCity = newCity;
      const [updatedDataMapping, setUpdatedDataMapping] = await useDataMapping();
      const selectedCityObj = Object.values(cityMap[activeState.toUpperCase()] || {}).find(
        (c) => c.label.toUpperCase() === newCity.toUpperCase()
      );

      updatedDataMapping.current_location = { state: activeState, city: selectedCityObj ? selectedCityObj.code : "" };
      setUpdatedDataMapping(updatedDataMapping);

      if (!newCity) {
        swiperWrapper.innerHTML = "<p>Please select a city.</p>";
        return;
      }

      if (selectedCityObj) {
        renderDealers(activeState, selectedCityObj.code);
      } else {
        swiperWrapper.innerHTML = "<p>Invalid city selected. Please try again.</p>";
      }

      pubsub.publish("product-banner-event", document.querySelector(".product-banner"), { test: true });
    },
    activeCity
  );

  if (!activeState || !cityMap[activeState.toUpperCase()] || Object.values(cityMap[activeState.toUpperCase()]).length === 0 || activeCity === "") {
    cityDropdown.setDisabled(true);
    cityDropdown.inputEl.value = "";
  } else {
    cityDropdown.setDisabled(false);
  }

  const dropdowns = div({ class: "dealer-dropdownss" }, stateDropdown.wrapper, cityDropdown.wrapper);
  const swiperWrapper = div({ class: "swiper-wrapper" });
  const swiperEl = div({ class: "dealer-card-wrapperr row swiper" }, swiperWrapper);
  block.innerHTML = "";
  block.appendChild(dropdowns);
  block.appendChild(swiperEl);

  async function renderDealers(stateLabel, cityCode) {
    if (!stateLabel || !cityCode) {
      swiperWrapper.innerHTML = "<p>Please select both a state and a city to find dealers.</p>";
      return;
    }

    const cityData = Object.values(cityMap[stateLabel.toUpperCase()] || []).find(c => c.code === cityCode);
    if (!cityData) {
      swiperWrapper.innerHTML = "<p>No city data found for the selected city.</p>";
      return;
    }

    const dealerData = await fetchDealers(sku, cityData.stateCode, cityData.code);
    const dealers = dealerData?.data?.dealers?.items || [];

    if (!dealers.length) {
      swiperWrapper.innerHTML = "<p>Sorry, no dealers are available in your area.</p>";
      swiperWrapper.classList.add("no-dealers");
      return;
    }

    if (swiperEl.swiper) swiperEl.swiper.destroy(true, true);
    swiperWrapper.innerHTML = "";

    dealers.forEach((dealer) => {
      const card = div(
        { class: "swiper-slide" },
        div(
          { class: "dealer-card" },
          div({ class: "dealer-name" }, div({ class: "wrapper" }, span({ class: "heroicon-logo hero-icon" }, span({ class: "path1 heroicon-logo hero-icon" }), span({ class: "path2 heroicon-logo hero-icon" }), span({ class: "path3 heroicon-logo hero-icon" })), dealer.name)),
          p({ class: 'dealer-phone' }, div({ class: "wrapper" }, span({ class: "hero-icon heroicon-call" }), dealer.phone)),
          p({ class: 'dealer-email' }, div({ class: "wrapper" }, span({ class: "hero-icon heroicon-email" }), dealer.email)),
          p({ class: 'dealer-address' }, div({ class: "wrapper" }, span({ class: "hero-icon heroicon-address" }, span({ class: "path1 heroicon-logo hero-icon" }), span({ class: "path2 heroicon-logo hero-icon" }), span({ class: "path3 heroicon-logo hero-icon" })), `${dealer.address_line_1} ${dealer.address_line_2} ${dealer.city}, ${dealer.state} - ${dealer.zip_code}`))
        )
      );
      swiperWrapper.appendChild(card);
    });

    const paginationEl = document.createElement("div");
    paginationEl.classList.add("swiper-pagination");
    swiperEl.appendChild(paginationEl);

    new Swiper(swiperEl, {
      grabCursor: true,
      spaceBetween: 20,
      pagination: { el: paginationEl, clickable: true },
      observer: true,
      observeParents: true,
      breakpoints: {
        0: { slidesPerView: 1.2 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 4 },
      },
    });
  }

  if (current.state && cityMap[current.state.toUpperCase()]) {
    activeState = current.state;
    const initialCityObj = Object.values(cityMap[activeState.toUpperCase()] || {}).find(c => c.label.toUpperCase() === current.city.toUpperCase());
    if (initialCityObj) {
      activeCity = initialCityObj.label;
      cityDropdown.inputEl.value = activeCity;
      cityDropdown.setDisabled(false);
      renderDealers(activeState, initialCityObj.code);
    } else {
      activeCity = "";
      cityDropdown.inputEl.value = "";
      cityDropdown.setDisabled(false);
      // swiperWrapper.innerHTML = "<p>Please select a city to find dealers.</p>";
    }
  } else {
    activeState = states[0] || "";
    stateDropdown.inputEl.value = activeState;
    activeCity = "";
    cityDropdown.inputEl.value = "";
    cityDropdown.setDisabled(true);
    // swiperWrapper.innerHTML = "<p>Please select a state and city to find dealers.</p>";
  }
}

export default function decorate(block) {
  decorateProductDealerCards(block);
}

import { fetchDealers, useDataMapping, pubsub } from "../../scripts/common.js";
import { div, p } from "../../scripts/dom-helpers.js";
import Swiper from "../carousel/swiper.min.js";

function createCustomDropdown(
  className,
  labelText,
  optionsList,
  onSelect,
  defaultValue = ""
) {
  const wrapper = div({
    class: "custom-select-wrapper position-relative d-flex flex-column",
  });

  const labelEl = p({ class: "dropdown-label mb-1" }, labelText);
  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.placeholder = `Select ${labelText}`;
  inputEl.className = "custom-input react-select__input " + className;
  inputEl.value = defaultValue;

  const clearBtn = document.createElement("span");
  clearBtn.textContent = "×";
  clearBtn.className = "clear-btn";
  clearBtn.style.cssText =
    "position:absolute; right:8px; top:8px; cursor:pointer; display:none;";

  const dropdown = document.createElement("ul");
  dropdown.className =
    "dropdown-options position-absolute bg-white border rounded shadow-sm z-3 mt-1";
  dropdown.style.cssText =
    "max-height: 180px; overflow-y: auto; max-width:100%; display: none;";

  wrapper.appendChild(labelEl);
  wrapper.appendChild(inputEl);
  wrapper.appendChild(clearBtn);
  wrapper.appendChild(dropdown);

  function updateOptions(filter = "") {
    dropdown.innerHTML = "";
    const filtered = optionsList.filter((opt) =>
      opt.toLowerCase().includes(filter.toLowerCase())
    );
    filtered.forEach((value) => {
      const li = document.createElement("li");
      li.textContent = value;
      li.className = "dropdown-option px-3 py-2 hover-bg";
      li.addEventListener("click", () => {
        inputEl.value = value;
        dropdown.style.display = "none";
        clearBtn.style.display = "block";
        onSelect(value);
      });
      dropdown.appendChild(li);
    });
    dropdown.style.display = filtered.length ? "block" : "none";
  }

  inputEl.addEventListener("input", () => {
    updateOptions(inputEl.value);
  });

  inputEl.addEventListener("focus", () => {
    updateOptions(inputEl.value);
  });

  clearBtn.addEventListener("click", () => {
    inputEl.value = "";
    clearBtn.style.display = "none";
    updateOptions("");
    onSelect("");
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  return { wrapper, inputEl };
}

export default async function decorate(block) {
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
      if (!newState || !cityMap[newState.toUpperCase()]) return;
      activeState = newState;
      const cityList = Object.values(
        cityMap[activeState.toUpperCase()] || {}
      ).map((c) => c.label);
      activeCity = cityList[0];

      const newCityDropdown = createCustomDropdown(
        "city-input",
        "City",
        cityList,
        async (newCity) => {
          activeCity = newCity;
          renderDealers(activeState, activeCity);
          const [dataMapping, setDataMapping] = await useDataMapping();
          dataMapping.current_location = {
            state: activeState,
            city: activeCity,
          };
          setDataMapping(dataMapping);
          pubsub.publish("fire", document.querySelector(".product-banner"), {
            test: true,
          });
        },
        activeCity
      );

      dropdowns.replaceChild(newCityDropdown.wrapper, cityDropdown.wrapper);
      cityDropdown = newCityDropdown;

      renderDealers(activeState, activeCity);
      const [dataMapping, setDataMapping] = await useDataMapping();
      dataMapping.current_location = { state: activeState, city: activeCity };
      setDataMapping(dataMapping);
      pubsub.publish("fire", document.querySelector(".product-banner"), {
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
      renderDealers(activeState, activeCity);
      const [dataMapping, setDataMapping] = await useDataMapping();
      dataMapping.current_location = { state: activeState, city: activeCity };
      setDataMapping(dataMapping);
      pubsub.publish("fire", document.querySelector(".product-banner"), {
        test: true,
      });
    },
    activeCity
  );

  const dropdowns = div(
    {
      class: "dealer-dropdowns d-flex flex-column gap-3 mb-4 align-items-start",
    },
    stateDropdown.wrapper,
    cityDropdown.wrapper
  );

  const swiperWrapper = div({ class: "swiper-wrapper" });
  const swiperEl = div(
    { class: "dealer-card-wrapper row swiper" },
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
            class:
              "dealer-card col-12 col-md-6 col-lg-4 mb-4 p-4 border rounded shadow-sm bg-white",
          },
          div({ class: "dealer-name h5 mb-2 weight-bold" }, dealer.name),
          p(
            { class: "dealer-address body2 mb-1" },
            `${dealer.address_line_1} ${dealer.address_line_2}`
          ),
          p(
            { class: "dealer-location body2 mb-1" },
            `${dealer.city}, ${dealer.state} - ${dealer.zip_code}`
          ),
          p({ class: "dealer-phone body2 mb-1" }, `${dealer.phone}`),
          p({ class: "dealer-email body2" }, `${dealer.email}`)
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
      autoplay: {
        delay: 3000,
        disableOnInteraction: false,
      },
      pagination: {
        el: paginationEl,
        clickable: true,
      },
      observer: true,
      observeParents: true,
      breakpoints: {
        0: {
          slidesPerView: 1.5,
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

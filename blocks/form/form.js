
import createField from "./form-fields.js";
import { div, ul, li, p, label, span, input as inputEl, img } from "../../scripts/dom-helpers.js";
import { fetchBookARide, fetchOTP, useDataMapping, verifyOtp, getRandomId } from "../../scripts/common.js";

const nameRegex = /^[a-zA-Z\s]{1,50}$/;

const isValidName = (name) => nameRegex.test(name);
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const mobRegex = /^[6-9][0-9]{9}$/;

let selectedEl = null;
let isStateOpen = false;
let isCityOpen = false;

function createDropdownInput(placeholder) {
  const input = inputEl({ placeholder, class: 'react-select__input', autocomplete: 'off' });
  const clearBtn = span({ class: 'clear-btn' }, '×');
  const dropdownBtn = span({ class: 'dropdown-btn' },
    img({ src: '/icons/svgviewer-png-output.png', width: 16, height: 16, alt: 'Dropdown' })
  );
  const wrapper = div({ class: 'input-wrapper' }, input, clearBtn, dropdownBtn);
  const list = div({ class: 'custom-dropdown-list scrollable', style: 'display:none' });

  // Set initial display of clearBtn based on input value
  clearBtn.style.display = input.value ? 'block' : 'none';

  // Update clearBtn display on input changes
  input.addEventListener('input', () => {
    clearBtn.style.display = input.value ? 'block' : 'none';
  });

  return { wrapper, input, clearBtn, dropdownBtn, list };
}

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
      itemEl.addEventListener('click', (e) => {

        input.value = item.label;
        list.style.display = 'none';
        if (input.id === 'state-input') isStateOpen = false;
        if (input.id === 'city-input') isCityOpen = false;
        onSelect(item);
        e.currentTarget.closest(".field-wrapper").querySelector(".clear-btn").style.display = 'block'
      });
      list.appendChild(itemEl);
      if (isSelected) selectedEl = itemEl;
    });
  }
  // debugger
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

function errorField(message) {
  return p({ class: "error-msg" }, message);
};

function showError(field, msg) {
  const msgEl = field.querySelector('.error-msg')
  if (!msg) {
    msgEl?.remove();
  } else if (msgEl) {
    msgEl.textContent = msg
  } else {
    field.appendChild(errorField(msg));
  }
}

function validateName(fieldWrapper, inpVal) {
  if (inpVal) {
    if (isValidName(inpVal)) {
      showError(fieldWrapper, '')
      return true
    } else {
      showError(fieldWrapper, 'Invalid Name')
      return false
    }
  } else {
    showError(fieldWrapper, 'The Name is required')
    return false
  }
}

function validateOtp(fieldWrapper, mobile, otp) {
  const isValid = verifyOtp(mobile, otp);
  showError(fieldWrapper, '')
  if (!otp) {
    showError(fieldWrapper, 'The OTP is required')
  } else if (!isValid) {
    showError(fieldWrapper, 'Incorrect OTP')
  }
  return isValid;
}

function validateMobile(fieldWrapper, inpVal) {
  if (inpVal) {
    if (mobRegex.test(inpVal)) {
      showError(fieldWrapper, '');
      return true;
    } else {
      showError(fieldWrapper, 'Enter correct mobile number');
      return false;
    }
  } else {
    showError(fieldWrapper, 'Please Enter a valid Mobile Number');
    return false;
  }
}

function validateOtherFields(fieldWrapper, inpName, inpVal) {
  if (inpVal) {
    showError(fieldWrapper, '')
    return true
  } else if (inpName == "state") {
    showError(fieldWrapper, 'Select a state')
  } else if (inpName == "city") {
    showError(fieldWrapper, 'Select a city')
  }
  return false
}

function validateEmail(fieldWrapper, inpVal) {
  if (inpVal) {
    if (emailRegex.test(inpVal)) {
      showError(fieldWrapper, '');
      return true;
    } else {
      showError(fieldWrapper, 'Please enter correct email');
      return false;
    }
  } else {
    showError(fieldWrapper, 'The Email is required');
    return false;
  }
}

async function createForm(formHref, submitHref) {
  const { pathname } = new URL(formHref);
  const resp = await fetch(pathname);
  const json = await resp.json();

  const form = document.createElement("form");
  form.dataset.action = submitHref;

  const fields = await Promise.all(
    json.data.map((fd) => createField(fd, form))
  );
  fields.forEach((field) => {
    if (field) {
      form.append(field);
    }
  });

  const fieldsets = form.querySelectorAll("fieldset");
  fieldsets.forEach((fieldset) => {
    form
      .querySelectorAll(`[data-fieldset="${fieldset.name}"`)
      .forEach((field) => {
        fieldset.append(field);
      });
  });

  return form;
}

function generatePayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== "submit" && !field.disabled) {
      if (field.type === "radio") {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === "checkbox") {
        if (field.checked)
          payload[field.name] = payload[field.name]
            ? `${payload[field.name]},${field.value}`
            : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });
  return payload;
}

async function handleSubmit(form) {
  if (form.getAttribute("data-submitting") === "true") return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute("data-submitting", "true");
    submit.disabled = true;
    form.closest(".section").querySelector(".book-ride-thankyou-wrapper").classList.add("dsp-block");
    const data = await fetchBookARide(
      form.name.value,
      form.mobile.value,
      form.otp.value,
      form.email.value,
      form.state.value,
      form.city.value,
      getRandomId()
    )
    form.closest(".section").querySelector(".book-ride-thankyou-wrapper .loader").classList.add("dsp-none");
    form.closest(".section").querySelector(".book-ride-thankyou-wrapper .succ-content").classList.add("dsp-block");
    form.classList.add("dsp-none");
  } catch (e) {
    console.error(e);
  } finally {
    form.setAttribute("data-submitting", "false");
    submit.disabled = false;
  }
}

export default async function decorate(block) {
  const [dataMapping, setDataMapping] = await useDataMapping();
  const links = [...block.querySelectorAll("a")].map((a) => a.href);
  const formLink = links.find(
    (link) => link.startsWith(window.location.origin) && link.endsWith(".json")
  );
  const submitLink = links.find((link) => link !== formLink);
  if (!formLink || !submitLink) return;

  const form = await createForm(formLink, submitLink);
  block.replaceChildren(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const valid = checkValidity();
    if (!valid.includes(false)) {
      handleSubmit(form);
    } else {
      const firstInvalidEl = form.querySelector(":invalid:not(fieldset)");
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  });

  const state_inp = form.state;
  const state_field_wrapper = state_inp.closest(".field-wrapper");
  const city_inp = form.city;
  const city_field_wrapper = city_inp.closest(".field-wrapper");

  const { wrapper: stateCustomWrapper, input: stateCustomInput, clearBtn: stateClearBtn, dropdownBtn: stateDropdownBtn, list: stateList } = createDropdownInput('Select State');
  const { wrapper: cityCustomWrapper, input: cityCustomInput, clearBtn: cityClearBtn, dropdownBtn: cityDropdownBtn, list: cityList } = createDropdownInput('Select City');

  stateCustomInput.id = 'state-input';
  cityCustomInput.id = 'city-input';

  state_inp.replaceWith(stateCustomWrapper);
  state_field_wrapper.appendChild(stateList);

  city_inp.replaceWith(cityCustomWrapper);
  city_field_wrapper.appendChild(cityList);

  block.querySelectorAll(".book-ride input").forEach((inp) => inp.setAttribute("autocomplete", "off"));

  const mappedStates = dataMapping.state_city_master.state.map(stateLabel => ({
    label: stateLabel,
    cities: Object.values(dataMapping.state_city_master[stateLabel.toUpperCase()] || {})
  }));

  let selectedStateData = null;
  let selectedCityData = null;

  const initialCurrentLocation = dataMapping.current_location || {};
  if (initialCurrentLocation.state) {
    selectedStateData = mappedStates.find(s => s.label.toUpperCase() === initialCurrentLocation.state.toUpperCase());
    if (selectedStateData) {
      stateCustomInput.value = selectedStateData.label;
      if (initialCurrentLocation.city) {
        selectedCityData = selectedStateData.cities.find(c => c.code === initialCurrentLocation.city);
        if (selectedCityData) {
          cityCustomInput.value = selectedCityData.label;
        }
      }
    }
  } else {
    selectedStateData = mappedStates[0];
    stateCustomInput.value = selectedStateData ? selectedStateData.label : '';
  }

  stateCustomInput.addEventListener('focus', () => {
    stateCustomInput.dataset.filter = '';
    populateList(stateCustomInput, stateList, mappedStates, onStateSelect);
    stateList.style.display = 'block';
    isStateOpen = true;
    if (isCityOpen) {
      cityList.style.display = 'none';
      isCityOpen = false;
    }
  });

  stateCustomInput.addEventListener('input', () => {
    stateCustomInput.dataset.filter = stateCustomInput.value;
    populateList(stateCustomInput, stateList, mappedStates, onStateSelect);
    stateList.style.display = 'block';
    isStateOpen = true;
    if (isCityOpen) {
      cityList.style.display = 'none';
      isCityOpen = false;
    }
  });

  stateDropdownBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (isStateOpen) {
      stateList.style.display = 'none';
      isStateOpen = false;
    } else {
      if (isCityOpen) {
        cityList.style.display = 'none';
        isCityOpen = false;
      }
      stateCustomInput.dataset.filter = '';
      populateList(stateCustomInput, stateList, mappedStates, onStateSelect);
      stateList.style.display = 'block';
      isStateOpen = true;
      stateCustomInput.focus();
    }
  });

  stateClearBtn.addEventListener('click', () => {
    stateCustomInput.value = '';
    stateCustomInput.dataset.filter = '';
    stateClearBtn.style.display = 'none'; // Hide clear button when input is empty
    isStateOpen = false; // Reset state open flag

    cityCustomInput.value = '';
    cityCustomInput.dataset.filter = '';
    cityCustomInput.disabled = true;
    cityClearBtn.style.display = 'none'; // Hide city clear button when state is cleared
    cityList.style.display = 'none';
    isCityOpen = false;

    selectedStateData = null;
    selectedCityData = null;

    showError(state_field_wrapper, 'Select a state');
    showError(city_field_wrapper, 'Select a city');

    dataMapping.current_location = { state: '', city: '' };
    setDataMapping(dataMapping);

    populateList(stateCustomInput, stateList, mappedStates, onStateSelect); // Repopulate and open
    stateList.style.display = 'block';
    isStateOpen = true;
  });

  cityCustomInput.addEventListener('focus', () => {
    if (cityCustomInput.disabled) return;
    cityCustomInput.dataset.filter = '';
    const citiesForSelectedState = selectedStateData ? selectedStateData.cities : [];
    populateList(cityCustomInput, cityList, citiesForSelectedState, onCitySelect);
    cityList.style.display = 'block';
    isCityOpen = true;
    if (isStateOpen) {
      stateList.style.display = 'none';
      isStateOpen = false;
    }
  });

  cityCustomInput.addEventListener('input', () => {
    if (cityCustomInput.disabled) return;
    cityCustomInput.dataset.filter = cityCustomInput.value;
    const citiesForSelectedState = selectedStateData ? selectedStateData.cities : [];
    populateList(cityCustomInput, cityList, citiesForSelectedState, onCitySelect);
    cityList.style.display = 'block';
    isCityOpen = true;
    if (isStateOpen) {
      stateList.style.display = 'none';
      isStateOpen = false;
    }
  });

  cityDropdownBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (cityCustomInput.disabled) return;
    if (isCityOpen) {
      cityList.style.display = 'none';
      isCityOpen = false;
    } else {
      if (isStateOpen) {
        stateList.style.display = 'none';
        isStateOpen = false;
      }
      cityCustomInput.dataset.filter = '';
      const citiesForSelectedState = selectedStateData ? selectedStateData.cities : [];
      populateList(cityCustomInput, cityList, citiesForSelectedState, onCitySelect);
      cityList.style.display = 'block';
      isCityOpen = true;
      cityCustomInput.focus();
    }
  });

  cityClearBtn.addEventListener('click', () => {
    cityCustomInput.value = '';
    cityCustomInput.dataset.filter = '';
    cityClearBtn.style.display = 'none'; // Hide clear button when input is empty
    isCityOpen = false; // Reset city open flag

    selectedCityData = null;
    showError(city_field_wrapper, 'Select a city');

    dataMapping.current_location = { state: selectedStateData ? selectedStateData.label : '', city: '' };
    setDataMapping(dataMapping);

    const citiesForSelectedState = selectedStateData ? selectedStateData.cities : [];
    populateList(cityCustomInput, cityList, citiesForSelectedState, onCitySelect); // Repopulate and open
    cityList.style.display = 'block';
    isCityOpen = true;
  });

  block.addEventListener('click', e => {
    if (!stateCustomWrapper.contains(e.target) && isStateOpen) {
      stateList.style.display = 'none';
      isStateOpen = false;
    }
    if (!cityCustomWrapper.contains(e.target) && isCityOpen) {
      cityList.style.display = 'none';
      isCityOpen = false;
    }
  });

  async function onStateSelect(s) {
    selectedStateData = s;
    selectedCityData = null;
    cityCustomInput.disabled = false;
    cityCustomInput.value = '';
    cityList.style.display = 'none';
    isCityOpen = false;

    showError(state_field_wrapper, '');
    showError(city_field_wrapper, 'Select a city');

    stateList.style.display = 'none';
    isStateOpen = false;

    dataMapping.current_location = { state: s.label, city: '' };
    setDataMapping(dataMapping);
  }

  async function onCitySelect(c) {
    selectedCityData = c;
    showError(city_field_wrapper, '');

    cityList.style.display = 'none';
    isCityOpen = false;

    dataMapping.current_location = { state: selectedStateData.label, city: selectedCityData.code };
    setDataMapping(dataMapping);
  }

  if (selectedStateData) {
    stateCustomInput.value = selectedStateData.label;
    stateClearBtn.style.display = 'block';
    cityCustomInput.disabled = false;

    if (selectedCityData) {
      cityCustomInput.value = selectedCityData.label;
      cityClearBtn.style.display = 'block';
      showError(state_field_wrapper, '');
      showError(city_field_wrapper, '');
    } else {
      cityCustomInput.value = '';
      cityClearBtn.style.display = 'none';
      showError(city_field_wrapper, 'Select a city');
    }
  } else {
    cityCustomInput.disabled = true;
    stateCustomInput.value = '';
    stateClearBtn.style.display = 'none';
    cityCustomInput.value = '';
    cityClearBtn.style.display = 'none';
    showError(state_field_wrapper, 'Select a state');
    showError(city_field_wrapper, 'Select a city');
  }

  function toggleCityInputState() {
    if (stateCustomInput.value.trim() === "") {
      cityCustomInput.setAttribute("disabled", true);
      cityCustomInput.style.cursor = "not-allowed";
      cityCustomInput.value = "";
      cityClearBtn.style.display = 'none';
    } else {
      cityCustomInput.removeAttribute("disabled");
      cityCustomInput.style.cursor = "unset";
    }
  }
  toggleCityInputState();

  block.querySelector(".sendOTP-btn").addEventListener("click", function () {
    console.log("Hi Send otp");
    try {
      block.querySelector(".sendOTP-btn").classList.add("dsp-none");
      block.querySelector(".resendOTP-btn").classList.remove("dsp-none");
      form.otp.disabled = false;
      form.otp.value = '';
      fetchOTP(form.mobile.value);
    } catch (error) {
      console.log(error);
    } finally {
      console.log("working");
    }
  });

  block.querySelector(".resendOTP-btn").addEventListener("click", function () {
    console.log("Hi Resend otp");
    try {
      fetchOTP(form.mobile.value);
    } catch (error) {
      console.log(error);
    } finally {
      console.log("working");
    }
  });

  const nameInp = form.name;
  const nameField = nameInp.closest(".text-wrapper");
  nameInp.addEventListener("input", function () {
    validateName(nameField, nameInp.value);
  });

  const mobInp = form.mobile;
  const mobField = mobInp.closest(".tel-wrapper");
  mobInp.addEventListener("input", function () {
    this.value = this.value.substr(0, 10);
    block.querySelector(".sendOTP-btn").classList.add("dsp-none");
    block.querySelector(".resendOTP-btn").classList.add("dsp-none");

    form.otp.disabled = true;
    form.otp.value = '';
    const valid = validateMobile(mobField, mobInp.value);
    if (valid) {
      block.querySelector(".sendOTP-btn").classList.remove("dsp-none");
    }
  });

  const otpInp = form.otp;
  const otpField = otpInp.closest(".field-wrapper");
  otpInp.addEventListener("input", function () {
    this.value = this.value.substr(0, 6);
    validateOtp(otpField, form.mobile.value, otpInp.value);
  })

  const emailInp = form.email;
  const emailField = emailInp.closest(".email-wrapper");
  emailInp.addEventListener("input", function () {
    validateEmail(emailField, emailInp.value);
  });

  function checkValidity() {
    const allInp = block.querySelectorAll("input[type='tel'],input[type='text'],input[type='email']");
    return [...allInp].map((inp) => {
      const fieldWrapper = inp.closest(".field-wrapper");
      const inpVal = inp.value;
      const inpName = inp.name;

      if (inpName === "state") {
        return validateOtherFields(state_field_wrapper, inpName, stateCustomInput.value);
      } else if (inpName === "city") {
        return validateOtherFields(city_field_wrapper, inpName, cityCustomInput.value);
      } else if (inpName == "name") {
        return validateName(fieldWrapper, inpVal);
      } else if (inpName == "otp") {
        return validateOtp(otpField, form.mobile.value, otpInp.value);
      } else if (inpName == "mobile") {
        const isValid = validateMobile(mobField, inpVal);
        form.otp.disabled = true;
        if (isValid) {
          form.otp.disabled = false;
        }
        return isValid;
      } else if (inpName == "email") {
        return validateEmail(emailField, inpVal);
      } else if (inpVal == "") {
        showError(fieldWrapper, 'This field is required');
        return false;
      } else {
        showError(fieldWrapper, '')
        return true
      }
    });
  };
}

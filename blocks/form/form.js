import createField from "./form-fields.js";
import { div, ul, li, p } from "../../scripts/dom-helpers.js";

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

  // group fields into fieldsets
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

    // create payload
    const payload = generatePayload(form);
    const response = await fetch(form.dataset.action, {
      method: "POST",
      body: JSON.stringify({ data: payload }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.ok) {
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
      }
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    form.setAttribute("data-submitting", "false");
    submit.disabled = false;
  }
}

export default async function decorate(block) {
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
    const valid = form.checkValidity();
    if (valid) {
      handleSubmit(form);
    } else {
      const firstInvalidEl = form.querySelector(":invalid:not(fieldset)");
      if (firstInvalidEl) {
        firstInvalidEl.focus();
        firstInvalidEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  });

  // Book a ride form start
  const state_inp = block.querySelector("#form-state");
  const state_field = state_inp.closest(".field-wrapper");
  const city_inp = block.querySelector("#form-city");
  const city_field = city_inp.closest(".field-wrapper");
  const submitBtn = block.querySelector(".submit-btn");

  const errorField = function (message) {
    return p({ class: "error-msg" }, message);
  };

  // Set autoComplete - off to all input and set disable to city field on "Load"
  block
    .querySelectorAll(".book-ride input")
    .forEach((inp) => inp.setAttribute("autocomplete", "off"));

  // Function for creating state/city list
  const stateOptions = function (mainClass, ulClass, liClass, dataList) {
    return div(
      { class: mainClass },
      ul(
        { class: ulClass },
        ...dataList.map((item) => li({ class: liClass }, item))
      )
    );
  };
  const cityOptions = function (mainClass, ulClass, liClass, dataList) {
    return div(
      { class: mainClass },
      ul(
        { class: ulClass },
        ...Object.keys(dataList).map((item) => li({ class: liClass }, item))
      )
    );
  };

  state_inp.addEventListener("focus", function () {
    // Avoid adding it again
    if (!state_field.querySelector(".state")) {
      const states = dataMapping.state_city_master.state;
      state_field.appendChild(
        stateOptions("state", "state-list", "state-name", states)
      );
      city_field.querySelector(".city").classList.add("dsp-none");
      block.querySelectorAll(".state-name").forEach((ele) => {
        ele.addEventListener("click", function () {
          block.querySelectorAll(".state-name").forEach((ele) => {
            ele.classList.remove("active");
          });
          ele.classList.add("active");
          state_inp.value = ele.textContent;
          state_field.querySelector(".state").classList.add("dsp-none");
          if (state_field.querySelector(".error-msg")) {
            state_field.querySelector(".error-msg").remove();
          }
          toggleCityInputState();
          city_field.querySelectorAll(".city").forEach((ele) => {
            ele.remove();
          });
          const cities = dataMapping.state_city_master[state_inp.value];
          city_field.appendChild(
            cityOptions("city", "city-list", "city-name", cities)
          );
          city_inp.value = "";
          city_field.querySelector(".city").classList.add("dsp-none");
        });
      });
      toggleCityInputState();
    }
  });

  // on load city append for by default state (DELHI)
  const cities = dataMapping.state_city_master[state_inp.value];
  city_field.appendChild(cityOptions("city", "city-list", "city-name", cities));
  city_field.querySelector(".city").classList.add("dsp-none");
  city_inp.addEventListener("focus", function () {
    if (city_field.querySelector(".city")) {
      city_field.querySelector(".city").classList.remove("dsp-none");
    }
    block.querySelectorAll(".city-name").forEach((ele) => {
      ele.addEventListener("click", function () {
        block.querySelectorAll(".city-name").forEach((ele) => {
          ele.classList.remove("active");
        });
        ele.classList.add("active");
        city_inp.value = ele.textContent;
        city_field.querySelector(".city").classList.add("dsp-none");
        city_field.querySelector(".error-msg").remove();
      });
    });
  });

  // Filtering Logic for state/City
  function filterHandler(fieldWrapper, inputName, inputField, ulClass) {
    let anyListVisibe = false;
    fieldWrapper.querySelectorAll(inputName).forEach((list) => {
      inputField.value = inputField.value.toUpperCase();
      const inp_val = inputField.value.toUpperCase();
      const ListName = list.textContent;
      if (inp_val == "" || ListName.includes(inp_val)) {
        list.classList.remove("dsp-none");
        anyListVisibe = true;
      } else {
        list.classList.add("dsp-none");
      }
    });
    // Handle No options
    const existingNoOption = block
      .querySelector(ulClass)
      .querySelector(".noOption");
    if (!anyListVisibe) {
      if (!existingNoOption) {
        const noOptionList = div({ class: "noOption" }, "No options");
        block.querySelector(ulClass).append(noOptionList);
      }
    } else {
      if (existingNoOption) {
        existingNoOption.remove();
      }
    }
  }

  // State filter
  state_inp.addEventListener("input", function () {
    filterHandler(state_field, ".state-name", state_inp, ".state-list");
    toggleCityInputState();
  });

  // City filter
  city_inp.addEventListener("input", function () {
    filterHandler(city_field, ".city-name", city_inp, ".city-list");
    if (city_field.querySelector(".error-msg")) {
      city_field.querySelector(".error-msg").remove();
    }
  });

  // Hide dropdown if clicked outside input or dropdown
  document.addEventListener("click", function (e) {
    if (!state_field.contains(e.target)) {
      const dropdown = state_field.querySelector(".state");
      if (dropdown) dropdown.remove();
    }
  });

  // City disabled if state is empty
  function toggleCityInputState() {
    if (state_inp.value.trim() === "") {
      city_inp.setAttribute("disabled", true);
      city_inp.style.cursor = "not-allowed";
      city_inp.value = "";
      city_field.querySelector(".city").classList.add("dsp-none");
    } else {
      city_inp.removeAttribute("disabled", true);
      city_inp.style.cursor = "unset";
    }
  }
  toggleCityInputState();

  // Send OTP click start
  block.querySelector(".sendOTP-btn").addEventListener("click", function () {
    console.log("Hi Send otp");
    try {
      fetchOTP("8169850484");
      block.querySelector(".sendOTP-btn").classList.add("dsp-none");
      block.querySelector(".resendOTP-btn").classList.remove("dsp-none");
    } catch (error) {
      console.log(error);
    } finally {
      console.log("working");
    }
  });

  block.querySelector(".resendOTP-btn").addEventListener("click", function () {
    console.log("Hi Send otp");
    try {
      fetchOTP("8169850484");
    } catch (error) {
      console.log(error);
    } finally {
      console.log("working");
    }
  });

  // Validation Start
  // Name validation
  const nameRegex = /^[a-z]+(?: [a-z]+)?$/;
  const nameInp = block.querySelector("#form-name");
  const nameField = nameInp.closest(".text-wrapper");
  nameInp.addEventListener("input", function () {
    const nameError = nameField.querySelector(".error-msg");
    const value = nameInp.value.trim();
    if (nameError) {
      nameError.remove();
    }
    if (value == "") {
      nameField.appendChild(errorField("Field is required"));
    } else if (!nameRegex.test(value)) {
      nameField.appendChild(errorField("Please enter a valid name"));
    }
  });

  // Mobile validation
  // const mobRegex = /^[6-9]\d{9}$/;
  const mobRegex = /^[6-9][0-9]{9}$/;
  const mobInp = block.querySelector("#form-mobile");
  const mobField = mobInp.closest(".tel-wrapper");
  mobInp.addEventListener("input", function () {
    const mobError = mobField.querySelector(".error-msg");
    const value = mobInp.value.trim();
    if (mobError) {
      mobError.remove();
    }
    if (value == "") {
      mobField.appendChild(errorField("Field is required"));
    } else if (value.length !== 10 && !mobRegex.test(value)) {
      block.querySelector(".sendOTP-btn").classList.add("dsp-none");
      mobField.appendChild(errorField("Please enter a valid mobile no."));
    } else {
      block.querySelector(".sendOTP-btn").classList.remove("dsp-none");
    }
  });

  // Email Validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const emailInp = block.querySelector("#form-email");
  const emailField = emailInp.closest(".email-wrapper");
  emailInp.addEventListener("input", function () {
    const emailError = emailField.querySelector(".error-msg");
    const value = emailInp.value.trim();
    if (emailError) {
      emailError.remove();
    }
    if (value == "") {
      emailField.appendChild(errorField("Field is required"));
    } else if (!emailRegex.test(value)) {
      emailField.appendChild(errorField("Please enter a valid email"));
    }
  });

  // State and city validation
  const stateCityInp = block.querySelectorAll(".book-ride #form-f1 input");
  stateCityInp.forEach((inp) => {
    const optionField = inp.closest(".field-wrapper");
    const optionError = optionField.querySelector(".error-msg");
    inp.addEventListener("input", function () {
      const value = inp.value.trim();
      if (optionError) {
        optionError.remove();
      }
      if (value == "") {
        optionField.appendChild(errorField("Field is required"));
      }
    });
  });

  // Submit Click
  submitBtn.addEventListener("click", function () {
    const allInp = block.querySelectorAll(".book-ride input");
    allInp.forEach((inp) => {
      const fieldWrapper = inp.closest(".field-wrapper");
      const error = fieldWrapper.querySelector(".error-msg");
      const inpVal = inp.value;
      const inpName = inp.name;
      if (error) {
        error.remove();
      }
      if (inpVal == "") {
        fieldWrapper.append(errorField("Field is required"));
      } else if (inpName == "name" && !nameRegex.test(inpVal)) {
        fieldWrapper.append(errorField("Please enter a valid name"));
      } else if (inpName == "mobile" && !mobRegex.test(inpVal)) {
        fieldWrapper.append(errorField("Please enter a valid mobile no."));
      } else if (inpName == "email" && !emailRegex.test(inpVal)) {
        fieldWrapper.append(errorField("Please enter a valid email"));
      } else {
        if (error) {
          error.remove();
        }
      }
    });

    if (!block.querySelector(".error-msg")) {
      alert("Form Valid...You can call Submit API here");
    }
  });
}

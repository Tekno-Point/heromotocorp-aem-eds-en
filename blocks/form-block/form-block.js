import { placeholders } from '../../scripts/common.js';
import { div, p, input, span, label, button } from '../../scripts/dom-helpers.js';
const { preApprovedOfferPageUrl } = placeholders;
export default function decorate(block) {
  const [amountWrap, interestWrap, durationWrap] = block.children;

  const amountMin = parseInt(amountWrap.querySelectorAll('p')[2].textContent.trim());
  const amountMax = parseInt(amountWrap.querySelectorAll('p')[4].textContent.trim());

  const rateMin = parseFloat(interestWrap.querySelectorAll('p')[2].textContent.trim());
  const rateMax = parseFloat(interestWrap.querySelectorAll('p')[4].textContent.trim());

  const monthsMin = parseInt(durationWrap.querySelectorAll('p')[2].textContent.trim());
  const monthsMax = parseInt(durationWrap.querySelectorAll('p')[4].textContent.trim());

  [amountWrap, interestWrap, durationWrap].forEach((wrap) => wrap.innerHTML = '');

  const amountSlider = input({ type: 'range', min: amountMin, max: amountMax, step: 1, value: amountMin });
  const rateSlider = input({ type: 'range', min: rateMin, max: rateMax, step: 0.1, value: rateMin });
  const monthsSlider = input({ type: 'range', min: monthsMin, max: monthsMax, step: 1, value: monthsMin });

  const amountVal = p({ class: 'input-value' }, `₹ ${amountMin.toLocaleString('en-IN')}`);
  const amountInput = input({ type: 'text', value: amountMin.toLocaleString('en-IN'), class: 'number-box' });

  const rateVal = p({ class: 'input-value' }, `${rateMin.toFixed(2)}%`);
  const rateInput = input({ type: 'text',name : 'emi', value: `${rateMin.toFixed(2)}%`, class: 'number-box' });

  const monthsVal = p({ class: 'input-value' }, `${monthsMin} months`);
  const monthsInput = input({ type: 'number', value: monthsMin, class: 'number-box' });

  function createSliderGroup(labelText, valP, inputEl, slider, minLabel, maxLabel) {
    const labelInputRow = div({ class: 'label-input-row' },
      label({}, labelText),
      inputEl
    );

    const sliderElements = [
      div({ class: 'value-row' }, valP),
      labelInputRow,
      div({ class: 'slider-row' }, slider),
      div({ class: 'range-labels' }, p({}, minLabel), p({}, maxLabel)),
    ];

    return div({ class: 'slider-group' }, ...sliderElements);
  }

  const amountGroup = createSliderGroup('Amount Needed (₹)', amountVal, amountInput, amountSlider, '₹ 10 Thousand', '₹ 1 Lakh');
  const rateGroup = createSliderGroup('Interest rate (P.A)', rateVal, rateInput, rateSlider, '8 %', '15 %');
  const monthsGroup = createSliderGroup('Duration (Months)', monthsVal, monthsInput, monthsSlider, '12 Months', '60 Months');

  const controls = div({ class: 'emi-controls' }, amountGroup, rateGroup, monthsGroup);

  const emiValue = span({ class: 'emi-value' }, '0');
  const emiOutput = div({ class: 'emi-output' },
    p({ class: 'emi-title' }, 'Monthly Payment (EMI)'),
    emiValue,
    button({ class: 'apply-btn' }, 'APPLY LOAN')
  );

  const wrapper = div({ class: 'emi-container' }, controls, emiOutput);
  block.append(wrapper);

  // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  function calculateEMI(P, r, n) {
    const monthlyRate = r / 12 / 100;
    const emi = P * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
    return Math.round(emi); // No decimal in result
  }

  function updateUI() {
    const amount = parseFloat(amountSlider.value);
    const rate = parseFloat(rateSlider.value);
    const months = parseInt(monthsSlider.value);

    amountVal.textContent = `₹ ${amount.toLocaleString('en-IN')}`;
    rateVal.textContent = `${rate}%`;
    monthsVal.textContent = `${months} months`;

    amountInput.value = amount.toLocaleString('en-IN');
    rateInput.value = `${rate}%`;
    monthsInput.value = months;

    const emi = calculateEMI(amount, rate, months);
    emiValue.textContent = `₹ ${emi.toLocaleString('en-IN')}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatIndianNumber(inputEl) {
    const raw = inputEl.value.replace(/,/g, '').replace(/[^\d]/g, '');
    const val = parseInt(raw);
    if (!isNaN(val)) {
      inputEl.value = val.toLocaleString('en-IN');
    }
  }

  function handleNumberInput(inputEl, sliderEl, min, max, isFloat = false, useCommas = false, suffix = '') {
    // inputEl.addEventListener('input', () => {
    //   if (useCommas) formatIndianNumber(inputEl);
    // });

    inputEl.addEventListener('input', () => {
      let raw = inputEl.value.replace(/,/g, '').replace(/[^\d.]/g, '');
      let val = raw ?  parseFloat(raw) : 0;

      // if (isNaN(val)) val = min;
      // val = clamp(val, min, max);
      sliderEl.value = val;
      
      if(min <= val && val <= max) {
        inputEl.value = val;
        if (useCommas) {
          inputEl.value = val.toLocaleString('en-IN');
        } else {
          inputEl.value = raw + suffix;
        }
        updateFill(sliderEl);
        updateUI();
      }
    });
    inputEl.addEventListener('blur', () => {
      let raw = inputEl.value.replace(/,/g, '').replace(/[^\d.]/g, '');
      let val = raw ?  parseFloat(raw) : 0;

      // if (isNaN(val)) val = min;
      // val = clamp(val, min, max);
      sliderEl.value = val;

      if (useCommas) {
        inputEl.value = val.toLocaleString('en-IN') + suffix;
      } else {
        inputEl.value = raw + suffix;
      }
      updateUI();
      updateFill(sliderEl);
    })
  }

  amountSlider.addEventListener('input', () => {
    updateUI();
    updateFill(amountSlider);
  });

  rateSlider.addEventListener('input', () => {
    updateUI();
    updateFill(rateSlider);
  });

  monthsSlider.addEventListener('input', () => {
    updateUI();
    updateFill(monthsSlider);
  });

  handleNumberInput(amountInput, amountSlider, amountMin, amountMax, false, true);
  handleNumberInput(rateInput, rateSlider, rateMin, rateMax, true, false, '%');
  handleNumberInput(monthsInput, monthsSlider, monthsMin, monthsMax);

  function updateFill(range) {
    const min = range.min;
    const max = range.max;
    const val = range.value;
    const percent = ((val - min) / (max - min)) * 100;
    range.style.setProperty('--progress', `${percent}%`);
  }

  updateUI();
  updateFill(amountSlider);
  updateFill(rateSlider);
  updateFill(monthsSlider);
  const btn = block.querySelector('.apply-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      window.location.href = preApprovedOfferPageUrl;
      // window.location.href = 'https://www.heromotocorp.com/en-in/pre-approved-offers.html'
    })
  }

}

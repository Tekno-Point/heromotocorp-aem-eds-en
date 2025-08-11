import { placeholders } from '../../scripts/common.js';
import {
  div, p, input, label, button, h1,
} from '../../scripts/dom-helpers.js';

const { preApprovedOfferPageUrl } = placeholders;
export default function decorate(block) {
  const [amountWrap, interestWrap, durationWrap] = block.children;

  const amountMin = parseInt(amountWrap.querySelectorAll('p')[2].textContent.trim(), 10);
  const amountMax = parseInt(amountWrap.querySelectorAll('p')[4].textContent.trim(), 10);

  const rateMin = parseFloat(interestWrap.querySelectorAll('p')[2].textContent.trim());
  const rateMax = parseFloat(interestWrap.querySelectorAll('p')[4].textContent.trim());

  const monthsMin = parseInt(durationWrap.querySelectorAll('p')[2].textContent.trim(), 10);
  const monthsMax = parseInt(durationWrap.querySelectorAll('p')[4].textContent.trim(), 10);

  [amountWrap, interestWrap, durationWrap].forEach((wrap) => { wrap.innerHTML = ''; });

  const amountSlider = input({
    type: 'range', min: amountMin, max: amountMax, step: 1, value: amountMin,
  });
  const rateSlider = input({
    type: 'range', min: rateMin, max: rateMax, step: 0.01, value: rateMin,
  });
  const monthsSlider = input({
    type: 'range', min: monthsMin, max: monthsMax, step: 1, value: monthsMin,
  });

  const amountVal = p({ class: 'input-value' }, `₹ ${amountMin.toLocaleString('en-IN')}`);
  const amountInput = input({ type: 'text', value: amountMin.toLocaleString('en-IN'), class: 'number-box' });

  const rateVal = p({ class: 'input-value' }, `${rateMin.toFixed(2)}%`);
  const rateInput = input({
    type: 'text', name: 'emi', value: `${rateMin.toFixed(2)}%`, class: 'number-box',
  });

  const monthsVal = p({ class: 'input-value' }, `${monthsMin} months`);
  const monthsInput = input({ type: 'number', value: monthsMin, class: 'number-box' });

  function createSliderGroup(labelText, valP, inputEl, slider, minLabel, maxLabel) {
    const labelInputRow = div(
      { class: 'label-input-row' },
      label({}, labelText),
      inputEl,
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

  const emiValue = h1({ class: 'emi-value' }, '0');
  const emiOutput = div(
    { class: 'emi-output' },
    p({ class: 'emi-title' }, 'Monthly Payment (EMI)'),
    emiValue,
    button({ class: 'apply-btn' }, 'APPLY LOAN'),
  );

  const wrapper = div({ class: 'emi-container' }, controls, emiOutput);
  block.append(wrapper);

  // EMI formula: P * r * (1+r)^n / ((1+r)^n - 1)
  function calculateEMI(P, r, n) {
    const monthlyRate = r / 12 / 100;
    const emi = (P * monthlyRate * (1 + monthlyRate) ** n) / (((1 + monthlyRate) ** n) - 1);
    return Math.round(emi); // No decimal in result
  }

  function updateFill(range) {
    const { min } = range;
    const { max } = range;
    const val = range.value;
    const percent = ((val - min) / (max - min)) * 100;
    range.style.setProperty('--progress', `${percent}%`);
  }

  function updateUI() {
    const amount = parseFloat(amountSlider.value);
    const rate = parseFloat(rateSlider.value);
    const months = parseInt(monthsSlider.value, 10);

    amountVal.textContent = `₹ ${amount.toLocaleString('en-IN')}`;
    rateVal.textContent = `${rate}%`;
    monthsVal.textContent = `${months} months`;

    amountInput.value = amount.toLocaleString('en-IN');
    rateInput.value = `${rate}%`;
    monthsInput.value = months;

    const emi = calculateEMI(amount, rate, months);
    emiValue.textContent = `₹ ${emi.toLocaleString('en-IN')}`;
  }

  function handleNumberInput(inputEl, sliderEl, min, max, useCommas = false, suffix = '') {
    inputEl.addEventListener('input', () => {
      const raw = inputEl.value.replace(/,/g, '').replace(/[^\d.]/g, '');
      if (raw.endsWith('.')) {
        return;
      }
      const val = raw ? parseFloat(raw) : 0;

      sliderEl.value = val;

      updateFill(sliderEl);
      if (min <= val && val <= max) {
        inputEl.value = val;
        if (useCommas) {
          inputEl.value = val.toLocaleString('en-IN');
        } else {
          inputEl.value = raw + suffix;
        }
        updateUI();
      }
    });

    inputEl.addEventListener('blur', () => {
      const raw = inputEl.value.replace(/,/g, '').replace(/[^\d.]/g, '');
      const val = raw ? parseFloat(raw) : 0;
      sliderEl.value = val;

      if (useCommas) {
        inputEl.value = `${val.toLocaleString('en-IN')}${suffix}`;
      } else {
        inputEl.value = `${raw}${suffix}`;
      }
      updateUI();
      updateFill(sliderEl);
    });
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

  handleNumberInput(amountInput, amountSlider, amountMin, amountMax, true);
  handleNumberInput(rateInput, rateSlider, rateMin, rateMax, false, '%');
  handleNumberInput(monthsInput, monthsSlider, monthsMin, monthsMax);

  updateUI();
  updateFill(amountSlider);
  updateFill(rateSlider);
  updateFill(monthsSlider);
  const btn = block.querySelector('.apply-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      window.location.href = preApprovedOfferPageUrl;
    });
  }
}

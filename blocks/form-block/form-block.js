import { div, p, input, span, label, button } from '../../scripts/dom-helpers.js';

export default function decorate(block) {
  const [amountWrap, interestWrap, durationWrap] = block.children;

  const amountMin = parseInt(amountWrap.querySelectorAll('p')[2].textContent.trim());
  const amountMax = parseInt(amountWrap.querySelectorAll('p')[4].textContent.trim());

  const rateMin = parseFloat(interestWrap.querySelectorAll('p')[2].textContent.trim());
  const rateMax = parseFloat(interestWrap.querySelectorAll('p')[4].textContent.trim());

  const monthsMin = parseInt(durationWrap.querySelectorAll('p')[2].textContent.trim());
  const monthsMax = parseInt(durationWrap.querySelectorAll('p')[4].textContent.trim());

  [amountWrap, interestWrap, durationWrap].forEach((wrap) => wrap.innerHTML = '');

  // Create sliders
  const amountSlider = input({ type: 'range', min: amountMin, max: amountMax, step: 1000, value: amountMin });
  const rateSlider = input({ type: 'range', min: rateMin, max: rateMax, step: 0.1, value: rateMin });
  const monthsSlider = input({ type: 'range', min: monthsMin, max: monthsMax, step: 1, value: monthsMin });

  // Create display values and inputs
  const amountVal = p({ class: 'input-value' }, `₹ ${amountMin.toLocaleString('en-IN')}`);
  const amountInput = input({ type: 'number', value: amountMin, class: 'number-box' });

  const rateVal = p({ class: 'input-value' }, `${rateMin.toFixed(2)}%`);
  const rateInput = input({ type: 'number', value: rateMin, class: 'number-box', step: 0.1 });

  const monthsVal = p({ class: 'input-value' }, `${monthsMin} months`);
  const monthsInput = input({ type: 'number', value: monthsMin, class: 'number-box' });

  // Only add value-row for Amount group
  function createSliderGroup(labelText, valP, inputEl, slider, minLabel, maxLabel) {
    const labelInputRow = div({ class: 'label-input-row' },
      label({}, labelText),
      inputEl
    );

    const sliderElements = [
      labelText === 'Amount Needed (₹)' ? div({ class: 'value-row' }, valP) : null,
      labelInputRow,
      div({ class: 'slider-row' }, slider),
      div({ class: 'range-labels' }, p({}, minLabel), p({}, maxLabel)),
    ].filter(Boolean); // removes null entries

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
    button({}, 'APPLY LOAN')
  );

  const wrapper = div({ class: 'emi-container' }, controls, emiOutput);
  block.append(wrapper);

  // EMI calculation formula
  function calculateEMI(P, r, n) {
    const monthlyRate = r / 12 / 100;
    const emi = P * monthlyRate * Math.pow(1 + monthlyRate, n) / (Math.pow(1 + monthlyRate, n) - 1);
    return Math.round(emi);
  }

  // UI update logic
  function updateUI() {
    const amount = parseFloat(amountSlider.value);
    const rate = parseFloat(rateSlider.value);
    const months = parseInt(monthsSlider.value);

    amountVal.textContent = `₹ ${amount.toLocaleString('en-IN')}`;
    rateVal.textContent = `${rate.toFixed(2)}%`;
    monthsVal.textContent = `${months} months`;

    amountInput.value = amount;
    rateInput.value = rate;
    monthsInput.value = months;

    const emi = calculateEMI(amount, rate, months);
    emiValue.textContent = `₹ ${emi.toLocaleString('en-IN')}`;
  }

  // Clamp utility to keep values in range
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // Sync: slider → input → EMI
  amountSlider.addEventListener('input', updateUI);
  rateSlider.addEventListener('input', updateUI);
  monthsSlider.addEventListener('input', updateUI);

  // Sync: input → slider → EMI (live typing)
  amountInput.addEventListener('input', () => {
    const value = clamp(parseFloat(amountInput.value) || 0, amountMin, amountMax);
    amountInput.value = value;
    amountSlider.value = value;
    updateUI();
  });

  rateInput.addEventListener('input', () => {
    const value = clamp(parseFloat(rateInput.value) || 0, rateMin, rateMax);
    rateInput.value = value;
    rateSlider.value = value;
    updateUI();
  });

  monthsInput.addEventListener('input', () => {
    const value = clamp(parseInt(monthsInput.value) || 0, monthsMin, monthsMax);
    monthsInput.value = value;
    monthsSlider.value = value;
    updateUI();
  });

  // Initial render
  updateUI();

// Slider filling function
  function updateFill(range) {
  const min = range.min;
  const max = range.max;
  const val = range.value;
  const getPercentage = ((val - min) / (max - min)) * 100;
  range.style.setProperty('--progress', `${getPercentage}%`);
};

const rangeInput = block.querySelectorAll('.slider-row input')
rangeInput.forEach((inp)=>{
    inp.addEventListener('input', function () {
        updateFill(inp)
    })
})
}

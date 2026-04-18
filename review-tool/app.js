'use strict';

const state = {
  firstName: '',
  companyName: '',
  gbpLink: '',
  customerName: '',
  customerPhone: '',
};

let selectedPlace = null;

// ── Utilities ──────────────────────────────────────────────────────────────

function goTo(stepNumber) {
  document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
  document.getElementById('step-' + stepNumber).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}

// ── Google Places Autocomplete ─────────────────────────────────────────────

function initAutocomplete() {
  const container = document.getElementById('business-search-container');
  const confirm = document.getElementById('business-confirm');
  const continueBtn = document.getElementById('btn-to-step3');

  container.innerHTML = '';

  const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
    types: ['establishment'],
    includedRegionCodes: ['us'],
  });

  container.appendChild(placeAutocomplete);

  const resetBusinessSelection = () => {
    selectedPlace = null;
    state.gbpLink = '';
    document.getElementById('gbp-link').value = '';
    continueBtn.disabled = true;
    confirm.textContent = '';
    confirm.classList.add('hidden');
  };

  resetBusinessSelection();

  placeAutocomplete.addEventListener('gmp-select', async ({ placePrediction }) => {
    const place = placePrediction?.toPlace ? placePrediction.toPlace() : null;

    if (!place) {
      resetBusinessSelection();
      showError(container, 'Please select a valid business from the list');
      return;
    }

    selectedPlace = place;
    continueBtn.disabled = false;
    clearError(container);

    confirm.textContent = '✓ Business selected';
    confirm.classList.remove('hidden');

    try {
      await place.fetchFields({ fields: ['id', 'displayName'] });
      state.gbpLink = `https://search.google.com/local/writereview?placeid=${place.id}`;
      document.getElementById('gbp-link').value = state.gbpLink;
      confirm.textContent = `✓ ${place.displayName}`;
    } catch (_) {
      state.gbpLink = '';
      document.getElementById('gbp-link').value = '';
      confirm.textContent = '✓ Business selected';
    }
  });

  placeAutocomplete.addEventListener('input', () => {
    resetBusinessSelection();
    clearError(container);
  });
}

function showError(inputEl, msg) {
  clearError(inputEl);
  inputEl.classList.add('error');
  const err = document.createElement('span');
  err.className = 'field-error';
  err.textContent = msg;
  inputEl.parentElement.appendChild(err);
}

function clearError(inputEl) {
  inputEl.classList.remove('error');
  const existing = inputEl.parentElement.querySelector('.field-error');
  if (existing) existing.remove();
}

// ── Phone formatting (live) ────────────────────────────────────────────────

function attachPhoneFormatter(inputEl) {
  inputEl.addEventListener('input', () => {
    const formatted = formatPhone(inputEl.value);
    inputEl.value = formatted;
    inputEl.setSelectionRange(formatted.length, formatted.length);
  });
}

// ── Step 1: Registration ───────────────────────────────────────────────────

const form1 = document.getElementById('form-step1');

form1.addEventListener('submit', (e) => {
  e.preventDefault();

  const firstName = document.getElementById('first-name').value.trim();
  const companyName = document.getElementById('company-name').value.trim();

  let valid = true;

  if (!firstName) { showError(document.getElementById('first-name'), 'Required'); valid = false; }
  else clearError(document.getElementById('first-name'));

  if (!companyName) { showError(document.getElementById('company-name'), 'Required'); valid = false; }
  else clearError(document.getElementById('company-name'));

  if (!valid) return;

  state.firstName = firstName;
  state.companyName = companyName;

  goTo(2);
});

// ── Step 2: Business Search ────────────────────────────────────────────────

document.getElementById('btn-to-step3').addEventListener('click', async () => {
  const containerEl = document.getElementById('business-search-container');
  clearError(containerEl);

  if (!selectedPlace) {
    showError(containerEl, 'Please search and select your business');
    document.getElementById('btn-to-step3').disabled = true;
    return;
  }

  if (!state.gbpLink) {
    try {
      await selectedPlace.fetchFields({ fields: ['id', 'displayName'] });
      state.gbpLink = `https://search.google.com/local/writereview?placeid=${selectedPlace.id}`;
      document.getElementById('gbp-link').value = state.gbpLink;
      document.getElementById('business-confirm').textContent = `✓ ${selectedPlace.displayName}`;
    } catch (_) {
      showError(containerEl, 'Could not load business details — please search and select again');
      selectedPlace = null;
      document.getElementById('btn-to-step3').disabled = true;
      document.getElementById('business-confirm').classList.add('hidden');
      return;
    }
  }

  // Submit contractor info to Netlify Forms now that we have the GBP link
  try {
    const formData = new FormData(form1);
    await fetch('/', { method: 'POST', body: new URLSearchParams(formData) });
  } catch (_) {
    // Non-blocking
  }

  goTo(3);
});

// ── Step 3: Customer Info ──────────────────────────────────────────────────

attachPhoneFormatter(document.getElementById('customer-phone'));

document.getElementById('btn-to-step4').addEventListener('click', () => {
  const nameEl = document.getElementById('customer-name');
  const phoneEl = document.getElementById('customer-phone');
  const name = nameEl.value.trim();
  const phone = phoneEl.value.trim();

  let valid = true;

  if (!name) { showError(nameEl, 'Required'); valid = false; }
  else clearError(nameEl);

  if (!phone || phone.replace(/\D/g,'').length < 10) {
    showError(phoneEl, 'Enter a valid 10-digit number'); valid = false;
  } else clearError(phoneEl);

  if (!valid) return;

  state.customerName = name;
  state.customerPhone = phone.replace(/\D/g,'');

  buildPreview();
  goTo(4);
});

// ── Step 4: Preview & Send ─────────────────────────────────────────────────

function buildPreview() {
  const msg = buildMessage();
  document.getElementById('message-preview').textContent = msg;
  const smsHref = `sms:${state.customerPhone}&body=${encodeURIComponent(msg)}`;
  document.getElementById('sms-link').href = smsHref;
}

function buildMessage() {
  return (
    `Hi ${state.customerName}, it's ${state.firstName} from ${state.companyName} — ` +
    `we just finished up at your property today. If you're happy with the work, ` +
    `we'd really appreciate a quick Google review, it helps us out more than you know: ` +
    `${state.gbpLink} — Thanks!`
  );
}

document.getElementById('btn-send-another').addEventListener('click', () => {
  document.getElementById('customer-name').value = '';
  document.getElementById('customer-phone').value = '';
  goTo(3);
});

'use strict';

const state = {
  firstName: '',
  companyName: '',
  gbpLink: '',
  businessSelected: false,
  customerName: '',
  customerPhone: '',
};

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
  const input = document.getElementById('business-search');
  const confirm = document.getElementById('business-confirm');

  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['establishment'],
    componentRestrictions: { country: 'us' },
    fields: ['place_id', 'name'],
  });

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.place_id) return;

    state.gbpLink = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
    state.businessSelected = true;
    document.getElementById('gbp-link').value = state.gbpLink;

    confirm.textContent = `✓ ${place.name}`;
    confirm.classList.remove('hidden');
    clearError(input);
  });

  input.addEventListener('input', () => {
    state.businessSelected = false;
    state.gbpLink = '';
    document.getElementById('gbp-link').value = '';
    confirm.classList.add('hidden');
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
    const cursor = inputEl.selectionStart;
    const prev = inputEl.value;
    const formatted = formatPhone(inputEl.value);
    inputEl.value = formatted;
    // keep cursor roughly in place when typing forward
    if (formatted.length > prev.length) {
      inputEl.setSelectionRange(cursor + 1, cursor + 1);
    }
  });
}

// ── Step 1 ─────────────────────────────────────────────────────────────────

const form1 = document.getElementById('form-step1');

attachPhoneFormatter(document.getElementById('phone'));

form1.addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = document.getElementById('first-name').value.trim();
  const companyName = document.getElementById('company-name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const searchEl = document.getElementById('business-search');

  let valid = true;

  if (!firstName) { showError(document.getElementById('first-name'), 'Required'); valid = false; }
  else clearError(document.getElementById('first-name'));

  if (!companyName) { showError(document.getElementById('company-name'), 'Required'); valid = false; }
  else clearError(document.getElementById('company-name'));

  if (!phone || phone.replace(/\D/g,'').length < 10) {
    showError(document.getElementById('phone'), 'Enter a valid 10-digit number'); valid = false;
  } else clearError(document.getElementById('phone'));

  if (!state.businessSelected) {
    showError(searchEl, 'Please select your business from the suggestions'); valid = false;
  } else clearError(searchEl);

  if (!valid) return;

  // Submit to Netlify Forms
  try {
    const formData = new FormData(form1);
    await fetch('/', { method: 'POST', body: new URLSearchParams(formData) });
  } catch (_) {
    // Non-blocking — proceed even if submission fails
  }

  state.firstName = firstName;
  state.companyName = companyName;

  goTo(2);
});

// ── Step 2 ─────────────────────────────────────────────────────────────────

attachPhoneFormatter(document.getElementById('customer-phone'));

document.getElementById('btn-to-step3').addEventListener('click', () => {
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
  goTo(3);
});

// ── Step 3 ─────────────────────────────────────────────────────────────────

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

// Reset customer fields when going back to step 2 for "Send another"
document.getElementById('btn-send-another').addEventListener('click', () => {
  document.getElementById('customer-name').value = '';
  document.getElementById('customer-phone').value = '';
  goTo(2);
});

/* Wave Electrical Noosa - contact form enhancement (contact.html only).
   Sends the form to Formspree in the background and shows an on-page result.
   Without JavaScript the form still posts to Formspree exactly as before.
   GA4: contact_form_sent fires ONLY after Formspree returns a successful response - it means
   "technically accepted by Formspree", not a verified enquiry (Formshield may still mark it as spam).
   No name, email, phone number or message is ever sent to Google Analytics. */
(function () {
  var form = document.querySelector('form.contact-form');
  var status = document.getElementById('form-status');
  if (!form || !status || !window.fetch || !window.FormData) return; // fall back to the normal form post

  var button = form.querySelector('button[type="submit"]');
  var buttonText = button.textContent;
  var TIMEOUT_MS = 15000;
  var sending = false;
  var PHONE = '<a href="tel:0423181744">0423 181 744</a>';

  function track(name, params) {
    if (window.waveAnalyticsEnabled && typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  function show(kind, html) {
    status.className = 'form-status form-status-' + kind;
    status.innerHTML = html;
    status.hidden = false;
    status.focus();
  }

  function finish() {
    sending = false;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = buttonText;
  }

  function failed(type, detail) {
    finish();
    show('error', '<p><strong>Sorry, your message couldn&rsquo;t be sent.</strong>' + (detail ? ' ' + detail : '') +
      ' Please try again, or call Steve on ' + PHONE + '.</p>');
    track('contact_form_error', { form_name: 'contact', error_type: type });
  }

  form.addEventListener('submit', function (e) {
    // The browser only fires "submit" after its own validation passes, so invalid forms never get here.
    e.preventDefault();
    if (sending) return; // ignore double clicks while a message is on its way
    sending = true;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Sending…';
    status.hidden = true;

    var service = (form.elements.service && form.elements.service.value) || 'not_selected';
    var controller = window.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, TIMEOUT_MS);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' },
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      clearTimeout(timer);
      if (res.ok) {
        form.reset();
        form.hidden = true;
        finish();
        show('success', '<p><strong>Thanks &mdash; your message has been sent.</strong> We&rsquo;ll be in touch shortly. ' +
          'For anything urgent, call Steve on ' + PHONE + '.</p>');
        track('contact_form_sent', { form_name: 'contact', form_service: service });
        return;
      }
      return res.json().catch(function () { return {}; }).then(function (data) {
        var msgs = (data && data.errors || []).map(function (x) { return x && x.message; }).filter(Boolean);
        var detail = msgs.length ? 'Please check: ' + msgs.join('; ').replace(/[<>&]/g, '') + '.' : '';
        failed(res.status >= 400 && res.status < 500 ? 'validation' : 'server', detail);
      });
    }).catch(function (err) {
      clearTimeout(timer);
      failed(err && err.name === 'AbortError' ? 'timeout' : 'network', '');
    });
  });
})();

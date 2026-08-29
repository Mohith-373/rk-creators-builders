// Contact/enquiry form: client validation + submission to the Netlify function.
(function () {
  'use strict';
  var form = document.getElementById('enquiry-form');
  var msg = document.getElementById('form-msg');
  var btn = document.getElementById('submit-btn');
  if (!form) return;

  var submitting = false;

  function show(type, html) {
    msg.className = 'form-msg ' + type;
    msg.innerHTML = html;
    msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Client-side validation (server re-validates everything).
  function clientValidate(fd) {
    var errors = [];
    var name = (fd.get('name') || '').trim();
    var phone = (fd.get('phone') || '').trim();
    var email = (fd.get('email') || '').trim();
    var type = fd.get('projectType') || '';
    var desc = (fd.get('description') || '').trim();
    var contact = fd.get('preferredContact') || '';

    if (name.length < 2) errors.push('Please enter your name.');
    if (phone.length < 7) errors.push('Please enter a valid phone number.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Please enter a valid email address.');
    if (!type) errors.push('Please select a project type.');
    if (desc.length < 10) errors.push('Please describe your project (a little more detail helps us help you).');
    if (!['phone', 'email', 'whatsapp'].includes(contact)) errors.push('Please choose a preferred contact method.');
    return errors;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (submitting) return; // prevent duplicate submissions
    msg.className = 'form-msg';

    var fd = new FormData(form);
    var errors = clientValidate(fd);
    if (errors.length) {
      show('error', '<strong>Please fix the following:</strong><ul>' + errors.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>');
      return;
    }

    submitting = true;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    var payload = {};
    fd.forEach(function (v, k) { payload[k] = v; });

    fetch('/.netlify/functions/enquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().then(function (data) { return { ok: data.ok, status: res.status, data: data }; });
    }).then(function (r) {
      if (r.ok) {
        form.reset();
        msg.classList.remove('error');
        show('success', '<strong>Thank you!</strong> Your enquiry has been received. We will contact you soon.');
      } else {
        var errs = (r.data && r.data.errors) || ['Something went wrong. Please try again.'];
        show('error', '<strong>Please fix the following:</strong><ul>' + errs.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>');
      }
    }).catch(function () {
      show('error', '<strong>Something went wrong.</strong> Please try again shortly, or call us on +91 95000 49098.');
    }).finally(function () {
      submitting = false;
      btn.disabled = false;
      btn.textContent = 'Send Enquiry';
    });
  });
})();

// Shared site configuration for RK Creators & Builders.
// Central place for company details used across the site.
(function (window) {
  'use strict';

  var CONFIG = {
    name: 'RK Creators & Builders',
    tagline: 'Family-run residential construction, trusted for over 25 years.',
    phones: [
      { label: '+91 95000 49098', tel: '+919500049098' },
      { label: '+91 98430 40772', tel: '+919843040772' }
    ],
    whatsapp: '919500049098',
    email: 'rkcreators1@gmail.com',
    location: {
      line1: '69-B, Thiyagi Singaravelan St',
      city: 'Thuraiyur',
      state: 'Tamil Nadu 621010',
      full: '69-B, Thiyagi Singaravelan St, Thuraiyur, Tamil Nadu 621010, India'
    },
    yearsExperience: 25,
    statement:
      'A family-run residential construction and building company with more than 25 years of experience serving homeowners in and around Thuraiyur, Tamil Nadu.'
  };

  // Human-readable formatting helpers
  CONFIG.phoneDisplay = CONFIG.phones.map(function (p) { return p.label; }).join(' / ');
  CONFIG.mapEmbed =
    'https://www.google.com/maps?q=' +
    encodeURIComponent('69-B, Thiyagi Singaravelan St, Thuraiyur, Tamil Nadu 621010') +
    '&output=embed';

  window.SITE = CONFIG;
})(window);

/* Wave Electrical Noosa - GA4 enquiry-intent events.
   phone_click, email_click and booking_click (ServiceM8) with the link's location on the page.
   Sends nothing unless the analytics guard in each page's <head> allowed GA4 to load
   (live site, real browser, not opted out). A click is intent only - not a confirmed enquiry. */
(function () {
  function linkLocation(el) {
    if (el.closest('.site-header')) return 'header';
    if (el.closest('.hero, .page-hero')) return 'hero';
    if (el.closest('.site-footer')) return 'footer';
    if (el.closest('section.bg-blue')) return 'cta_banner';
    if (el.closest('.contact-details')) return 'contact_details';
    return 'page_content';
  }

  var lastSent = {};
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href'), name;
    if (/^tel:/i.test(href)) name = 'phone_click';
    else if (/^mailto:/i.test(href)) name = 'email_click';
    else if (/^https:\/\/book\.servicem8\.com\//i.test(href)) name = 'booking_click';
    else return;

    var where = linkLocation(a), key = name + ':' + where, now = Date.now();
    if (lastSent[key] && now - lastSent[key] < 1000) return; // a double tap counts once
    lastSent[key] = now;

    if (window.waveAnalyticsEnabled && typeof window.gtag === 'function') {
      window.gtag('event', name, { link_location: where });
    }
  }, true);
})();

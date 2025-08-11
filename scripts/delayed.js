// Function to load the GTM script
function loadGtmScript() {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-NJW8B6';
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'gtm.start': new Date().getTime(),
    event: 'gtm.js',
  });
}

// Load GTM script
loadGtmScript();

// Add delayed functionality
if (!window.location.href.includes('author-p')) {
  setTimeout(async () => {
    const { openModal } = await import(
      `${window.hlx.codeBasePath}/blocks/modal/modal.js`
    );
    openModal('/form/modals/get-a-call-back');
  }, 10000);
}

// Add event listeners for swiper pagination
document
  .querySelectorAll('.swiper-pagination.swiper-pagination-clickable h3')
  .forEach((pag) => {
    pag.addEventListener('click', () => {
      pag.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    });
  });

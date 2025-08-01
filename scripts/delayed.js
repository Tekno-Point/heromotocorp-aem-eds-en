if(!location.href.includes("author-p") ){
	setTimeout(async () => {
	  // This function will execute after a delay
	  const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
	  openModal('/form/modals/get-a-call-back');
	}, 10000); // Delay in milliseconds
}

// add delayed functionality here
const scriptCode = document.createElement('script');
scriptCode.innerHTML = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
		new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
		j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
		'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
		})(window,document,'script','dataLayer','GTM-NJW8B6');
`
document.querySelector('head').append(scriptCode);
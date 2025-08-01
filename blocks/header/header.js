import { fetchPlaceholders, getMetadata } from '../../scripts/aem.js';
import initCompare from './compare.js';
import { loadFragment } from '../fragment/fragment.js';
import { onVehicleAdd, onVehicleRmove } from './compare-components.js';

const placeholders = await fetchPlaceholders('/form');
const { headerXf, helpAndSupportPageUrl } = placeholders;
const isDesktop = window.matchMedia('(min-width: 900px)');

let navTimeoutSession;
let dropdownItemsSession;
let timeOutSession;

export async function getFetchAPI(url) {
  try {
    const resp = await fetch(url);
    return resp;
  } catch (error) {
    console.error('Fetch API error:', error);
    return error;
  }
}

function extractNumberFromSpecification(str) {
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[0]) : null;
}

function handleBikeFilterClick(event, selectedCategory, bikeItemContainers, bikeDetailsContainers, handleAboutPremiaDisplay) {
  const filtersContainer = selectedCategory.querySelectorAll('.filters');
  filtersContainer.forEach((filter) => filter.classList.remove('selected'));

  const clickedFilter = event.currentTarget;
  clickedFilter.classList.add('selected');

  const range = clickedFilter.dataset.filterRange;
  if (!range) return;

  clearTimeout(timeOutSession);
  timeOutSession = setTimeout(() => {
    bikeItemContainers.forEach((item) => item.classList.remove('homepage-animate'));
  }, 350);

  setTimeout(() => {
    let toBeSelectedIndex = -1;
    handleAboutPremiaDisplay(range === 'aboutpremia');

    bikeItemContainers.forEach((item, index) => {
      let isVisible = false;
      const bikeSpecText = item.querySelector('.bike-spec')?.textContent;
      const cc = extractNumberFromSpecification(bikeSpecText?.trim() || '');

      if (range === 'newlaunch') {
        isVisible = item.dataset.isNewLaunch === 'true';
      } else if (range !== 'aboutpremia') {
        const [startRange, endRange] = range.split('-').map(Number);
        if (cc && cc >= startRange && cc < endRange) {
          isVisible = true;
        }
      }

      item.style.display = isVisible ? 'flex' : 'none';
      item.classList.remove('selected', 'homepage-animate');

      if (isVisible) {
        setTimeout(() => item.classList.add('homepage-animate'), 50);
        if (toBeSelectedIndex === -1) {
          toBeSelectedIndex = index;
          item.classList.add('selected');
          handleBikeDetailsDisplay(index, bikeDetailsContainers);
        }
      }
    });
  }, 400);
}

function handleBikeDetailsDisplay(index, bikeDetailsContainers) {
  clearTimeout(timeOutSession);

  bikeDetailsContainers.forEach((item, i) => {
    item.classList.remove('selected', 'homepage-animate');
    if (i === index) {
      item.classList.add('selected');
      setTimeout(() => item.classList.add('homepage-animate'), 30);
    }
  });

  timeOutSession = setTimeout(() => {
    bikeDetailsContainers.forEach((item, i) => {
      if (i !== index) item.classList.remove('selected');
    });
  }, 450);

  setTimeout(handleScrollIndicator, 500);
}

function handleScrollIndicator(selectedCategory) {
  const parentDiv = selectedCategory.querySelector('.column.column2');
  if (!parentDiv) {
    console.error('Parent div ".column.column2" not found.');
    return;
  }
  const bikeItems = parentDiv.querySelectorAll('.bike-item-container');
  const totalHeight = [...bikeItems].reduce((sum, el) => sum + el.offsetHeight, 0);
  const scrollIndicator = selectedCategory.querySelector('.scroll-indicator');

  if (scrollIndicator) {
    scrollIndicator.style.display = totalHeight > parentDiv.offsetHeight ? 'flex' : 'none';
  }
}

function initDesktopHeader(parentClassName) {
  if (parentClassName?.toString().toLowerCase().includes('service')) return;

  const selectedCategory = document.querySelector(parentClassName);
  if (!selectedCategory) return;

  const bikeArray = selectedCategory.querySelector('.column2.vehicle-options');
  const bikeDetailsArray = selectedCategory.querySelector('.column3.vehicle-spec-info');
  const filtersArray = selectedCategory.querySelector('.column1.bike-filters');
  const filtersContainer = filtersArray?.querySelectorAll('.filters');
  const bikeItemContainers = bikeArray?.querySelectorAll('.bike-item-container');
  const bikeDetailsContainers = bikeDetailsArray?.querySelectorAll('.bike-details');
  const aboutPremiaContainer = bikeArray?.querySelectorAll('.about-premia-text');
  const aboutPremiaImgContainer = bikeDetailsArray?.querySelector('.about-premia-image-container');

  const handleAboutPremiaDisplay = (isShow) => {
    if (!aboutPremiaContainer || !aboutPremiaImgContainer) return;
    aboutPremiaContainer.forEach((el) => el.classList.toggle('d-none', !isShow));
    aboutPremiaImgContainer.classList.toggle('d-none', !isShow);
    bikeDetailsArray?.classList.toggle('p-0', isShow);
    if (bikeArray?.querySelector('.scroll-indicator')) {
      bikeArray.querySelector('.scroll-indicator').classList.toggle('d-none', isShow);
    }
    bikeItemContainers?.forEach((el) => {
      el.classList.remove('selected', 'homepage-animate');
      el.style.display = isShow ? 'none' : 'flex';
    });
    if (!isShow && bikeItemContainers?.length > 0) {
      bikeItemContainers[0].classList.add('selected');
      handleBikeDetailsDisplay(0, bikeDetailsContainers);
    }
  };

  if (bikeArray && bikeItemContainers?.length > 0) {
    bikeItemContainers.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        bikeItemContainers.forEach(bike => bike.classList.remove('selected'));
        e.currentTarget.classList.add('selected');
        handleBikeDetailsDisplay(index, bikeDetailsContainers);
      });
    });
  }

  if (filtersArray && filtersContainer?.length > 0) {
    filtersArray.classList.remove('homepage-animate');
    setTimeout(() => filtersArray.classList.add('homepage-animate'), 450);

    filtersContainer.forEach((el) => el.classList.remove('selected'));
    filtersContainer[0].classList.add('selected');
    const defaultRange = filtersContainer[0].dataset.filterRange;
    if (defaultRange) {
      handleBikeFilterClick({ currentTarget: filtersContainer[0] }, selectedCategory, bikeItemContainers, bikeDetailsContainers, handleAboutPremiaDisplay);
    }

    filtersContainer.forEach((filter) => {
      filter.addEventListener('click', (e) => {
        handleBikeFilterClick(e, selectedCategory, bikeItemContainers, bikeDetailsContainers, handleAboutPremiaDisplay);
      });
    });
  }

  const scrollContainers = document.querySelectorAll('.column.column2');
  scrollContainers.forEach((container) => {
    container.addEventListener('scroll', (e) => {
      const el = e.target;
      const scrollPosition = el.scrollTop + el.clientHeight;
      const indicator = el.closest(parentClassName)?.querySelector('.scroll-indicator');
      if (indicator) {
        indicator.style.display = (scrollPosition >= el.scrollHeight - 1) ? 'none' : 'flex';
      }
    });
  });

  setTimeout(() => handleScrollIndicator(selectedCategory), 500);
}

function initMobileMenu() {
  if (window.innerWidth >= 1024) return;

  const mobileMenu = document.getElementById('newMobileNav');
  const openBtns = document.querySelectorAll('#custom-menu-open-btn, #custom-collapse-menu-btn');

  function handleMobileMenuToggle() {
    let navHeader = mobileMenu?.closest('body >header');
    if (navHeader?.classList.contains("hamburger-clicked")) {
      navHeader.classList.remove("hamburger-clicked")
    }
    else {
      navHeader.classList.add("hamburger-clicked")
    }
    // navBarWrapper?.closest('body >header')?.classList.remove('hide-header');
    const isOpen = mobileMenu.classList.contains('open-menu');
    mobileMenu.classList.toggle('open-menu', !isOpen);
    mobileMenu.classList.toggle('collapse-menu', isOpen);

    document.documentElement.classList.toggle('overflow-hidden', !isOpen);
    document.querySelector('.event_register_footer')?.classList.toggle('hide', !isOpen);

    const navbar = document.querySelector('.navbar.navbar-expand-lg.new-header-variation');
    if (navbar) {
      navbar.style.top = isOpen && window.scrollY > 0 ? '-70px' : '0';
      navbar.style.background = isOpen ? 'unset' : 'rgba(0,0,0,0.2)';
    }

    if (!isOpen) {
      document.querySelector('.new-header-variation.Premium.mobile-accordion')?.scrollIntoView();
    } else {
      document.querySelector('.bike-container-wrapper.show .back-button-container')?.click();
      document.querySelector('.accordion-header .selected')?.click();
    }
  }

  openBtns.forEach(btn => btn.addEventListener('click', handleMobileMenuToggle));

  document.querySelectorAll('#newMobileNav .accordion-header').forEach(header => {
    header.addEventListener('click', function (e) {
      e.stopImmediatePropagation();
      const content = this.nextElementSibling;
      const isVisible = content.style.display === 'block';

      document.querySelectorAll('#newMobileNav .accordion-content').forEach(c => c.style.display = 'none');
      document.querySelectorAll('#newMobileNav .accordion-header .icon').forEach(i => i.textContent = '+');

      if (!isVisible) {
        content.style.display = 'block';
        this.querySelector('.icon').textContent = '-';
        this.querySelector('a')?.classList.add('selected');
        slideDown(content);
      } else {
        this.querySelector('a')?.classList.remove('selected');
        slideUp(content, () => this.querySelector('.icon').textContent = '+');
      }

      const parentLi = this.closest('li');
      const classSelector = parentLi ? `.${Array.from(parentLi.classList).join('.')}` : null;
      if (classSelector) {
        mobileAccordionHandler(classSelector);
      }
    });
  });

  document.querySelectorAll('.services-click .back-button-container, .parts-click .back-button-container').forEach(backBtn => {
    backBtn.addEventListener('click', (e) => {
      e.currentTarget.parentElement?.classList.remove('show');
    });
  });

  document.querySelectorAll('.service-mob-tab, .parts-mob-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetClass = e.currentTarget.classList.contains('service-mob-tab') ? '.services-click' : '.parts-click';
      e.currentTarget.parentElement?.querySelector(targetClass)?.classList.add('show');
    });
  });
}

function mobileAccordionHandler(parentClassName) {
  const selectedCategory = document.querySelector(parentClassName);
  if (!selectedCategory) return;

  document.querySelectorAll('.mobile-menu .filters').forEach(filterBtn => {
    filterBtn.addEventListener('click', function () {
    });
  });

  document.querySelectorAll('.mobile-menu .back-button-container').forEach(backBtn => {
    backBtn.addEventListener('click', function () {
      const bikeWrapper = selectedCategory.querySelector('.mobile-menu .bike-container-wrapper');
      if (bikeWrapper) bikeWrapper.classList.remove('show');
      document.querySelectorAll('#newMobileNav .accordion-item').forEach(item => item.classList.remove('remove-margin'));
    });
  });
}

function slideUp(element, duration = 300, callback) {
  element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
  element.style.boxSizing = 'border-box';
  element.style.height = `${element.offsetHeight}px`;
  element.offsetHeight;
  element.style.overflow = 'hidden';
  element.style.height = 0;
  element.style.paddingTop = 0;
  element.style.paddingBottom = 0;
  setTimeout(() => {
    element.style.display = 'none';
    element.style.removeProperty('height');
    element.style.removeProperty('padding-top');
    element.style.removeProperty('padding-bottom');
    element.style.removeProperty('overflow');
    element.style.removeProperty('transition');
    if (callback) callback();
  }, duration);
}

function slideDown(element, duration = 700) {
  element.style.removeProperty('display');
  let display = window.getComputedStyle(element).display;
  if (display === 'none') display = 'block';
  element.style.display = display;
  const height = `${element.scrollHeight}px`;
  element.style.height = 0;
  element.style.paddingTop = 0;
  element.style.paddingBottom = 0;
  element.style.overflow = 'hidden';
  element.offsetHeight;
  element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
  element.style.height = height;
  setTimeout(() => {
    element.style.removeProperty('height');
    element.style.removeProperty('overflow');
    element.style.removeProperty('transition');
    element.style.removeProperty('padding-top');
    element.style.removeProperty('padding-bottom');
  }, duration);
}

export async function appendXF(block, xfPath) {
  const resp = await getFetchAPI(xfPath);
  if (!resp.ok) {
    return block;
  }

  let str = await resp.text();
  const isLocalOrStage = window.location.href.includes('localhost') || window.location.href.includes('.aem.live') || window.location.href.includes('.aem.page');
  if (isLocalOrStage) {
    str = str.replace(/\/etc\.clientlibs\//g, 'https://stage.heromotocorp.com/etc.clientlibs/');
    str = str.replace(/\/content\/dam\//g, 'https://stage.heromotocorp.com/content/dam/');
  }

  const div = document.createElement('div');
  div.innerHTML = str;

  div.querySelector('.tray-container')?.remove();
  div.querySelector('.drawer-container')?.remove();
  str = str.replaceAll('hp-hide-cmp-checkbox', '');

  const includeLinks = ['/clientlib-dependencies.lc', '/clientlib-site-lite.lc'];
  div.querySelectorAll('link').forEach((link) => {
    if (includeLinks.some((clientLib) => link.href.includes(clientLib))) {
      const newLink = document.createElement('link');
      newLink.href = link.href;
      newLink.rel = 'stylesheet';
      document.head.append(newLink);
    } else {
      link.remove();
    }
  });

  block.append(div);

  document.querySelectorAll('.megamenu-li').forEach((menuItem) => {
    menuItem.addEventListener('click', (event) => {
      const target = event.target;
      if (target.closest('.nav-link')) {
        handleMegaMenuToggle(menuItem);
      }
    });
  });

  document.querySelectorAll('.header-explore-tabs .explore-nav-link').forEach((tab) => {
    tab.addEventListener('click', handleExploreTabClick);
  });

  if (document.querySelector('.new-header-variation')) {
    window.addEventListener('resize', handleHeaderBehavior);
    handleHeaderBehavior();
  }

  initMobileMenu();

  const scrollText = document.querySelector('.scroll-for-more-container p');
  if (scrollText) scrollText.style.display = 'block';

  return block;
}

function handleMegaMenuToggle(menuItem) {
  const isActive = menuItem.classList.contains('active');
  document.querySelectorAll('.megamenu-li.active').forEach((el) => el.classList.remove('active'));
  document.querySelectorAll('.megamenu.slim-scroll').forEach((menu) => menu.classList.remove('homepage-drop-animation'));
  document.body.classList.remove('position-fixed');
  document.body.style.overflow = 'auto';

  if (!isActive) {
    menuItem.classList.add('active');
    document.body.classList.add('position-fixed');
    document.body.style.overflow = 'hidden';
    const thisMenu = menuItem.querySelector('.megamenu.slim-scroll');
    if (thisMenu) {
      setTimeout(() => thisMenu.classList.add('homepage-drop-animation'), 50);
      initDesktopHeader(`.${Array.from(menuItem.classList).join('.')}`);
    }
  }
}

function handleExploreTabClick() {
  const tabId = this.dataset.id;
  document.querySelectorAll('.header-explore-tabs .explore-nav-link').forEach((el) => el.classList.remove('active'));
  this.classList.add('active');
  document.querySelectorAll('.header-explore-tabs .explore-tab-content').forEach((content) => {
    content.classList.add('d-none');
    content.classList.remove('active');
  });
  const targetContent = document.querySelector(`.header-explore-tabs .explore-tab-content[data-id="${tabId}"]`);
  if (targetContent) {
    targetContent.classList.remove('d-none');
    targetContent.classList.add('active');
  }
}

let homepageDesktopHeaderLogo;
function handleHeaderBehavior() {
  const width = window.innerWidth;
  const isHomepage = document.querySelector('.homepage-banner');
  const isComparePage = document.querySelector('.homepage-compare-page');
  const navbar = document.querySelector('.navbar.navbar-expand-lg.new-header-variation');
  const footer = document.querySelector('.event_register_footer');

  footer?.classList.toggle('handle-new-variation-bottom-tab', width < 1024 && width > 767);
  footer?.classList.toggle('handle-new-variation-bottom-mob', width < 768);

  const icons = document.querySelectorAll('.homepage-redesign-right-nav-icon');
  const brands = document.querySelectorAll('.navbar-brand');

  if (width <= 767 && isHomepage) {
    icons.forEach(icon => {
      const mobileIcon = icon.dataset.mobileicon;
      if (mobileIcon) icon.src = mobileIcon;
    });
    brands.forEach(brand => {
      const img = brand.querySelector('img');
      const headerLogo = document.getElementById('newMobileNav')?.dataset.mobileheaderlogo;
      if (headerLogo && img) {
        if (!homepageDesktopHeaderLogo) homepageDesktopHeaderLogo = img.src;
        img.src = headerLogo;
      }
    });
    if (navbar) {
      navbar.style.position = 'fixed';
      window.addEventListener('scroll', handleMobileHomepageScroll);
    }
  } else if (width > 767 && (isHomepage || isComparePage)) {
    icons.forEach(icon => {
      const desktopIcon = icon.dataset.desktopicon;
      if (desktopIcon) icon.src = desktopIcon;
    });
    brands.forEach(brand => {
      const img = brand.querySelector('img');
      if (homepageDesktopHeaderLogo && img) img.src = homepageDesktopHeaderLogo;
    });
    if (navbar) {
      navbar.style.top = '0';
      navbar.style.position = 'relative';
    }
    window.removeEventListener('scroll', handleMobileHomepageScroll);
  } else if (width <= 767 && isComparePage) {
    const headerMain = document.querySelector('.header-main.new-header-variation');
    if (headerMain) headerMain.style.position = 'relative';
  }
}

function handleMobileHomepageScroll() {
  const navbar = document.querySelector('.navbar.navbar-expand-lg.new-header-variation');
  if (!navbar) return;
  const currentScroll = window.scrollY;
  navbar.style.background = currentScroll <= 0 ? 'unset' : 'rgba(0,0,0,0.2)';
}

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  if (focused.className === 'nav-drop' && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = expanded || isDesktop.matches ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');

  const navDrops = navSections.querySelectorAll('.nav-drop');
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute('tabindex')) {
        drop.setAttribute('tabindex', 0);
        drop.addEventListener('focus', focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute('tabindex');
      drop.removeEventListener('focus', focusNavSection);
    });
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener('keydown', closeOnEscape);
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.append(...fragment.children);

  ['brand', 'sections', 'tools', 'bar'].forEach((c, i) => {
    if (nav.children[i]) nav.children[i].classList.add(`nav-${c}`);
  });

  const brandLink = nav.querySelector('.nav-brand .button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
    <span class="nav-hamburger-icon"></span>
  </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  const navWrapper2 = document.querySelector('.nav-wrapper');
  const heroSection = document.querySelector('.banner-price');
  const navBar = nav.querySelector('.nav-bar');
  const navBarWrapper = navBar?.querySelector('.default-content-wrapper');
  const secondUl = navBar?.querySelectorAll('ul')[1];
  const navBarImages = navBar?.querySelectorAll('p');

  window.addEventListener('scroll', () => {
    const heroBottom = heroSection?.getBoundingClientRect().bottom - 76 || -1;
    const isScrolledPastHero = heroBottom <= 0;

    if (isScrolledPastHero) {
      navWrapper2.style.transform = 'translateY(-100%)';
      // document.querySelector('.header-main')?.style.setProperty('display', 'none');
      if (secondUl) secondUl.style.display = 'flex';
      navBarImages?.forEach(img => img.style.display = 'block');
      navBarWrapper?.classList.add('scrolled');
      navBarWrapper?.closest('body >header')?.classList.add('hide-header');
      if (navBarWrapper) {
        navBarWrapper.style.height = '76px';
        navBarWrapper.style.padding = '0px 10px 0';
      }
    } else {
      navBarWrapper?.classList.remove('scrolled');
      navBarWrapper?.closest('body >header')?.classList.remove('hide-header');
      navWrapper2.style.transform = 'translateY(0)';
      // document.querySelector('.header-main')?.style.setProperty('display', 'block');
      if (secondUl) secondUl.style.display = 'none';
      navBarImages?.forEach(img => img.style.display = 'none');
      if (navBarWrapper) {
        navBarWrapper.style.padding = 'unset';
        navBarWrapper.style.height = '40px';
      }
    }
  });

  document.querySelectorAll('.header .section.nav-bar ul:first-of-type li').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = e.target.closest('li')?.querySelector('a')?.textContent.trim().toLowerCase().replace(/ /g, '-');
      const target = document.querySelector(`.section[data-id="${targetId}"]`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  await appendXF(block, headerXf);

  initCompare();

  block.querySelectorAll('.add-to-compare .add-vehicle-checkbox').forEach((checkbox) => {
    checkbox.addEventListener('change', (e) => {
      const traySection = document.querySelector('.tray-container');
      traySection?.classList.toggle('disappear', !e.target.checked);

      if (e.target.checked) {
        onVehicleAdd(e);
      } else {
        onVehicleRmove(e);
      }

      if (!e.target.dataset.vehiclesRendered) {
        initCompare();
        e.target.dataset.vehiclesRendered = true;
      }
    });
  });

  block.querySelectorAll('[data-target="#countryModal"]').forEach((a) => {
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal('/form/modals/country');
    });
  });

  const stickyHeader = block.querySelector('.mobile-only.new-header-variation.bottom-menu');
  // if (stickyHeader) {
  //   const helpAndSupportLink = stickyHeader.querySelectorAll('li')[1]?.querySelector('a');
  //   if (helpAndSupportLink) {
  //     helpAndSupportLink.href = helpAndSupportPageUrl;
  //   }
  //   document.body.append(stickyHeader);
  //   // document.body.append(stickyHeader);
  // }

  return block;
}
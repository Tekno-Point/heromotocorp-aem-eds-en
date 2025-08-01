import { fetchPlaceholders, getMetadata } from "../../scripts/aem.js";
import initCompare from "./compare.js";
import { loadFragment } from "../fragment/fragment.js";
import { onVehicleAdd, onVehicleRmove } from "./compare-components.js";

const placeholders = await fetchPlaceholders('/form');
const { headerXf, helpAndSupportPageUrl } = placeholders;

const isDesktop = window.matchMedia("(min-width: 900px)");
let navTimeoutSession;
let dropdownItemsSession;
let homepageDesktopHeaderLogo;

export async function getFetchAPI(url) {
  try {
    const resp = await fetch(url);
    return resp;
  } catch (error) {
    console.error("Fetch API error:", error);
    return error;
  }
}

export async function appendXF(block, xfPath) {
  const resp = await getFetchAPI(xfPath);
  if (!resp.ok) {
    console.error(`Failed to fetch XF: ${xfPath}`);
    return block;
  }

  let str = await resp.text();
  const { location } = window;
  const isLocalOrAem = location.href.includes("localhost") || location.href.includes(".aem.live") || location.href.includes(".aem.page");

  if (isLocalOrAem) {
    str = str.replaceAll("/etc.clientlibs/", "https://stage.heromotocorp.com/etc.clientlibs/");
    str = str.replaceAll("/content/dam/", "https://stage.heromotocorp.com/content/dam/");
  }
  str = str.replaceAll("hp-hide-cmp-checkbox", "");

  const div = document.createElement("div");
  div.innerHTML = str;

  div.querySelector(".tray-container")?.remove();
  div.querySelector(".drawer-container")?.remove();

  const includeClientLibs = ['/clientlib-dependencies.lc', '/clientlib-site-lite.lc'];
  div.querySelectorAll("link").forEach((link) => {
    if (includeClientLibs.some((clientLib) => link.href.includes(clientLib))) {
      const newLink = document.createElement("link");
      newLink.href = link.href;
      newLink.rel = "stylesheet";
      document.head.append(newLink);
    } else {
      link.remove();
    }
  });

  block.append(div);

  initDesktopMegaMenu();
  initHeaderBehaviors();
  initMobileMenu();

  return block;
}

function initDesktopMegaMenu() {
  document.querySelectorAll(".megamenu-li").forEach((menuItem) => {
    menuItem.addEventListener("click", function (event) {
      const target = event.target;
      const isNavLink = target.classList.contains("nav-link") || target.parentElement?.classList.contains("nav-link");

      if (isNavLink) {
        clearTimeout(navTimeoutSession);
        clearTimeout(dropdownItemsSession);

        this.parentElement?.querySelectorAll(".megamenu-li.active")?.forEach((el) => {
          if (el !== this) el.classList.remove("active");
        });

        const allMenus = document.querySelectorAll(".megamenu.slim-scroll");
        const thisMenu = this.querySelector(".megamenu.slim-scroll");

        allMenus.forEach((menu) => menu.classList.remove("homepage-drop-animation"));
        document.querySelectorAll(".homepage-animate").forEach((el) => el.classList.remove("homepage-animate"));

        if (thisMenu && thisMenu.classList.contains("homepage-drop-animation")) {
          navTimeoutSession = setTimeout(() => {
            this.classList.toggle("active");
          }, 400);
        } else {
          this.classList.toggle("active");
          setTimeout(() => thisMenu?.classList.add("homepage-drop-animation"), 50);
        }

        if (this.classList.contains('active')) {
          document.body.style.height = '100vh';
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.height = 'auto';
          document.body.style.overflow = 'auto';
        }

        document.querySelectorAll(".bike-spec p, .about-premia-text p, .scroll-for-more-container p, .parts-desc, .parts-wrap .parts-title").forEach((p) => {
          p.style.display = "block";
        });

        const classNames = this.className.split(/\s+/);
        const combinedClassNames = "." + classNames.join(".");

        if (combinedClassNames.includes("new-header-variation")) {
          this.querySelectorAll(".homepage-animate").forEach((el) => el.classList.remove("homepage-animate"));
        }

        dropdownItemsSession = setTimeout(() => {
          initHeader(combinedClassNames);
        }, 50);

        const anyActive = document.querySelectorAll(".nav-item.dropdown.megamenu-li.active").length > 0;
        document.body.classList.toggle("position-fixed", anyActive);

        if (document.querySelector(".e-shop")?.classList.contains("active")) {
          const siblings = this.parentElement?.parentElement?.querySelectorAll(".megamenu-li");
          siblings?.forEach((sibling) => {
            if (sibling !== this) sibling.classList.remove("active");
          });
        }
      }
    });
  });
}

function initHeader(parentClassName) {
  if (parentClassName?.toString().toLowerCase().includes("service")) return;

  const selectedCategory = document.querySelector(parentClassName?.toString());
  if (!selectedCategory) return;

  const bikeArray = selectedCategory.querySelector(".column2.vehicle-options");
  const bikeDetailsArray = selectedCategory.querySelector(".column3.vehicle-spec-info");
  const filtersArray = selectedCategory.querySelector(".column1.bike-filters");

  const filtersContainer = filtersArray?.querySelectorAll(".filters");
  const bikeItemContainers = bikeArray?.querySelectorAll(".bike-item-container");
  const aboutPremiaContainer = bikeArray?.querySelectorAll(".about-premia-text");
  const aboutPremiaImgContainer = bikeDetailsArray?.querySelector(".about-premia-image-container");
  const bikeDetailsContainers = bikeDetailsArray?.querySelectorAll(".bike-details");
  const scrollIndicator = selectedCategory.querySelector(".scroll-indicator");

  let timeOutSession;

  const handleClickBikeItem = (event, index) => {
    bikeItemContainers.forEach((bike) => bike.classList.remove("selected"));
    event.currentTarget.classList.add("selected");
    handleBikeDetailsDisplay(index);
  };

  const handleBikeDetailsDisplay = (index) => {
    clearTimeout(timeOutSession);
    bikeDetailsContainers[index].classList.add("selected");
    setTimeout(() => {
      bikeDetailsContainers[index].classList.add("homepage-animate");
    }, 30);
    bikeDetailsContainers.forEach((item, i) => {
      if (i !== index) item.classList.remove("homepage-animate");
    });
    timeOutSession = setTimeout(() => {
      bikeDetailsContainers.forEach((item, i) => {
        if (i !== index) item.classList.remove("selected");
      });
    }, 450);
    setTimeout(handleScrollIndicator, 500);
  };

  const handleAboutPremiaDisplay = (isShow) => {
    if (!aboutPremiaContainer || !aboutPremiaImgContainer) return;
    if (isShow) {
      bikeDetailsContainers?.forEach((el) => el.classList.remove("selected", "homepage-animate"));
      bikeItemContainers?.forEach((el) => {
        el.classList.remove("selected");
        el.style.display = "none";
      });
      bikeDetailsArray?.classList.add("p-0");
      scrollIndicator?.classList.add("d-none");
      aboutPremiaContainer?.forEach((el) => el.classList.remove("d-none"));
      aboutPremiaImgContainer.classList.remove("d-none");
    } else {
      aboutPremiaContainer?.forEach((el) => el.classList.add("d-none"));
      aboutPremiaImgContainer.classList.add("d-none");
      bikeDetailsArray?.classList.remove("p-0");
      scrollIndicator?.classList.remove("d-none");
    }
  };

  const handleClickBikeFilters = (event) => {
    filtersContainer.forEach((filter) => filter.classList.remove("selected"));
    const clickedFilter = event.currentTarget;
    clickedFilter.classList.add("selected");
    const range = clickedFilter.dataset.filterRange;
    if (range) filterBikes(range.trim());
  };

  const filterBikes = (range) => {
    clearTimeout(timeOutSession);
    timeOutSession = setTimeout(() => {
      bikeItemContainers.forEach((item) => item.classList.remove("homepage-animate"));
    }, 350);

    setTimeout(() => {
      let toBeSelectedIndex = -1;

      if (range === "newlaunch") {
        handleAboutPremiaDisplay(false);
        bikeItemContainers.forEach((item, index) => {
          const isNew = item.dataset.isNewLaunch === "true";
          item.style.display = isNew ? "flex" : "none";
          if (isNew) {
            item.classList.remove("selected");
            setTimeout(() => item.classList.add("homepage-animate"), 50);
            if (toBeSelectedIndex === -1) {
              toBeSelectedIndex = index;
              item.classList.add("selected");
              handleBikeDetailsDisplay(index);
            }
          }
        });
      } else if (range === "aboutpremia") {
        handleAboutPremiaDisplay(true);
      } else {
        handleAboutPremiaDisplay(false);
        const [startRange, endRange] = range.split("-").map(Number);

        bikeItemContainers.forEach((item, index) => {
          const bikeSpec = item.querySelector(".bike-spec")?.textContent;
          const cc = extractNumberFromSpecification(bikeSpec?.trim() || "");

          const shouldDisplay = cc && cc >= startRange && cc < endRange;
          item.style.display = shouldDisplay ? "flex" : "none";
          if (shouldDisplay) {
            item.classList.remove("selected");
            setTimeout(() => item.classList.add("homepage-animate"), 50);
            if (toBeSelectedIndex === -1) {
              toBeSelectedIndex = index;
              item.classList.add("selected");
              handleBikeDetailsDisplay(index);
            }
          }
        });
      }
    }, 350);
  };

  const handleScrollIndicator = () => {
    const parentDiv = selectedCategory.querySelector(".column.column2");
    if (!parentDiv) {
      return;
    }
    const bikeItems = parentDiv.querySelectorAll(".bike-item-container");
    const totalHeight = [...bikeItems].reduce((sum, el) => sum + el.offsetHeight, 0);
    const indicator = selectedCategory.querySelector(".scroll-indicator");

    if (totalHeight > parentDiv.offsetHeight) {
      indicator.style.display = "flex";
    } else {
      indicator.style.display = "none";
    }
  };

  const extractNumberFromSpecification = (str) => {
    const match = str.match(/(\d+(\.\d+)?)/);
    return match ? Number(match[0]) : null;
  };

  if (bikeArray && bikeItemContainers.length > 0) {
    bikeItemContainers[0].classList.add("selected");
    bikeItemContainers.forEach((item, index) => {
      item.addEventListener("click", (e) => handleClickBikeItem(e, index));
    });
  } else {
    console.error('".column2.vehicle-options" not found.');
  }

  if (filtersArray && filtersContainer?.length > 0) {
    filtersArray.classList.remove("homepage-animate");
    setTimeout(() => {
      filtersArray.classList.add("homepage-animate");
    }, 450);

    filtersContainer.forEach((el) => el.classList.remove("selected"));
    filtersContainer[0].classList.add("selected");
    filtersContainer.forEach(filter => filter.style.display = "block");

    const defaultRange = filtersContainer[0].dataset.filterRange;
    if (defaultRange) filterBikes(defaultRange.trim());

    filtersContainer.forEach((filter) => {
      filter.addEventListener("click", handleClickBikeFilters);
    });
  }

  const scrollContainers = document.querySelectorAll(".column.column2");
  scrollContainers.forEach((container) => {
    container.removeEventListener("scroll", handleScrollCheck);
    container.addEventListener("scroll", handleScrollCheck);
  });

  function handleScrollCheck(e) {
    const el = e.target;
    const scrollPosition = el.scrollTop + el.clientHeight;
    const divContentHeight = el.scrollHeight;
    const indicator = el.closest(parentClassName)?.querySelector(".scroll-indicator");

    if (!indicator) return;

    if (scrollPosition >= divContentHeight - 1) {
      indicator.style.display = "none";
    } else {
      indicator.style.display = "flex";
    }
  }

  setTimeout(handleScrollIndicator, 500);
}

function initHeaderBehaviors() {
  const handleHeaderBehavior = () => {
    const width = window.innerWidth;
    const footer = document.querySelector(".event_register_footer");
    const isHomepage = document.querySelector(".homepage-banner");
    const isComparePage = document.querySelector(".homepage-compare-page");
    const navbar = document.querySelector(".navbar.navbar-expand-lg.new-header-variation");

    footer?.classList.toggle("handle-new-variation-bottom-tab", width < 1024 && width > 767);
    footer?.classList.toggle("handle-new-variation-bottom-mob", width < 768);

    if (width <= 767 && isHomepage) {
      document.querySelectorAll(".homepage-redesign-right-nav-icon").forEach((icon) => {
        const mobileIcon = icon.getAttribute("data-mobileicon");
        if (mobileIcon) icon.setAttribute("src", mobileIcon);
      });
      document.querySelectorAll(".navbar-brand").forEach((brand) => {
        const mobileHeaderLogo = document.getElementById("newMobileNav")?.getAttribute("data-mobileheaderlogo");
        const img = brand.querySelector("img");
        if (mobileHeaderLogo && img) {
          if (!homepageDesktopHeaderLogo) homepageDesktopHeaderLogo = img.getAttribute("src");
          img.setAttribute("src", mobileHeaderLogo);
        }
      });
      if (navbar) {
        navbar.style.position = "fixed";
        let prevScroll = window.scrollY;
        window.addEventListener("scroll", () => {
          let currentScroll = window.scrollY;
          navbar.style.background = currentScroll <= 0 ? "unset" : "rgba(0,0,0,0.2)";
          prevScroll = currentScroll;
        });
      }
    } else if (width > 767 && (isHomepage || isComparePage)) {
      document.querySelectorAll(".navbar-brand").forEach((brand) => {
        const img = brand.querySelector("img");
        if (homepageDesktopHeaderLogo && img) img.setAttribute("src", homepageDesktopHeaderLogo);
      });
      if (navbar) navbar.style.position = "relative";
      document.querySelectorAll(".homepage-redesign-right-nav-icon").forEach((icon) => {
        const desktopIcon = icon.getAttribute("data-desktopicon");
        if (desktopIcon) icon.setAttribute("src", desktopIcon);
      });
    } else if (width <= 767 && isComparePage) {
      document.querySelector(".header-main.new-header-variation")?.style.setProperty("position", "relative");
    }
  };

  if (document.querySelector(".new-header-variation")) {
    window.addEventListener("resize", handleHeaderBehavior);
    handleHeaderBehavior();
  }
}

function initMobileMenu() {
  const menu = document.getElementById("newMobileNav");

  const openBtns = document.querySelectorAll("#custom-menu-open-btn, #custom-collapse-menu-btn");
  openBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      let navHeader = document?.querySelector('body >header');
      if (navHeader?.classList.contains("hamburger-clicked")) {
        navHeader.classList.remove("hamburger-clicked")
      } else {
        navHeader.classList.add("hamburger-clicked")
      }
      const isOpen = menu.classList.toggle("open-menu");
      menu.classList.toggle("collapse-menu", !isOpen);

      document.documentElement.classList.toggle("overflow-hidden", isOpen);
      document.querySelector(".event_register_footer")?.classList.toggle("hide", isOpen);

      const navbar = document.querySelector(".navbar.new-header-variation");
      if (navbar) navbar.style.top = isOpen ? "0" : "-70px";
      if (window.scrollY === 0 && navbar) navbar.style.background = "unset";

      if (!isOpen) {
        document.querySelector(".bike-container-wrapper.show .back-button-container")?.click();
        document.querySelector(".accordion-header .selected")?.click();
      }
    });
  });

  document.querySelectorAll("#newMobileNav .accordion-header").forEach((header) => {
    header.addEventListener("click", function (e) {
      e.stopImmediatePropagation();
      const content = this.nextElementSibling;
      const icon = this.querySelector(".icon");
      const isVisible = content.style.display === "block";
      const parentLi = this.closest("li");
      const classSelector = "." + Array.from(parentLi.classList).join(".");
      initMobileFilterLogic(classSelector);

      document.querySelectorAll(".hp-dropdown-content, .drawer-fragment, .our-range-fragment").forEach((el) => (el.style.display = "none"));

      document.querySelectorAll(".bike-item-container .bike-spec p, .about-premia-text p, .parts-desc, .parts-wrap .parts-title").forEach((p) => {
        p.style.display = "block";
      });

      document.querySelectorAll("#new-mobile .accordion-content").forEach((c) => (c.style.display = "none"));
      document.querySelectorAll("#new-mobile .accordion-header .icon").forEach((i) => (i.textContent = "+"));

      if (!isVisible) {
        content.style.display = "block";
        icon.textContent = "-";
        this.querySelector("a")?.classList.add("selected");
        slideDown(content);
      } else {
        content.style.display = "none";
        icon.textContent = "+";
        this.querySelector("a")?.classList.remove("selected");
        slideUp(content);
      }
    });
  });

  document.querySelectorAll(".service-mob-tab, .parts-mob-tab").forEach(tab => {
    tab.addEventListener("click", (e) => {
      const targetClass = e.currentTarget.classList.contains("service-mob-tab") ? ".services-click" : ".parts-click";
      e.currentTarget.parentElement.querySelector(targetClass)?.classList.add("show");
    });
  });

  document.querySelectorAll(".services-click .back-button-container, .parts-click .back-button-container").forEach(backBtn => {
    backBtn.addEventListener("click", (e) => {
      e.currentTarget.parentElement?.classList?.remove("show");
    });
  });
}

function initMobileFilterLogic(parentClassName) {
  if (window.innerWidth >= 1024) return;

  const selectedCategory = document.querySelector(parentClassName);
  if (!selectedCategory) return;

  const filters = selectedCategory.querySelectorAll(".mobile-menu .filters");
  const bikeWrapper = selectedCategory.querySelector(".mobile-menu .bike-container-wrapper");
  const backBtn = selectedCategory.querySelector(".mobile-menu .back-button-container");

  filters.forEach((filterBtn) => {
    filterBtn.addEventListener("click", function () {
      const filterRange = this.dataset.filterRange;
      const bikeContainers = selectedCategory.querySelectorAll(".mobile-menu .bike-container");
      const aboutPremiaText = selectedCategory.querySelector(".mobile-menu .about-premia-text");

      aboutPremiaText?.classList.toggle("d-none", filterRange !== "aboutpremia");

      if (filterRange === "newlaunch") {
        bikeContainers.forEach((container) => {
          container.style.display = container.dataset.isNewLaunch === "true" ? "flex" : "none";
        });
      } else if (filterRange === "aboutpremia") {
        bikeContainers.forEach((container) => (container.style.display = "none"));
      } else {
        const [minRange, maxRange] = filterRange.split("-").map(Number);
        bikeContainers.forEach((container) => {
          const specText = container.querySelector(".bike-spec")?.textContent;
          const cc = extractNumberFromSpecification(specText);
          container.style.display = cc >= minRange && cc <= maxRange ? "flex" : "none";
        });
      }

      if (bikeWrapper) bikeWrapper.classList.add("show");
      document.querySelectorAll("#newMobileNav .accordion-item").forEach((item) => item.classList.add("remove-margin"));

      const labelText = this.querySelector(".filter-label")?.textContent;
      const backText = bikeWrapper?.querySelector(".back-button-text-container");
      if (backText && labelText) backText.textContent = labelText;
    });
  });

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      if (bikeWrapper) bikeWrapper.classList.remove("show");
      document.querySelectorAll("#newMobileNav .accordion-item").forEach((item) => item.classList.remove("remove-margin"));
    });
  }
}

function extractNumberFromSpecification(str) {
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[0]) : null;
}

function slideUp(element, duration = 300) {
  element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
  element.style.boxSizing = "border-box";
  element.style.height = element.offsetHeight + "px";
  element.offsetHeight;
  element.style.overflow = "hidden";
  element.style.height = 0;
  element.style.paddingTop = 0;
  element.style.paddingBottom = 0;
  setTimeout(() => {
    element.style.display = "none";
    element.style.removeProperty("height");
    element.style.removeProperty("padding-top");
    element.style.removeProperty("padding-bottom");
    element.style.removeProperty("overflow");
    element.style.removeProperty("transition");
  }, duration);
}

function slideDown(element, duration = 700) {
  element.style.removeProperty("display");
  let display = window.getComputedStyle(element).display;
  if (display === "none") display = "block";
  element.style.display = display;
  const height = element.scrollHeight + "px";
  element.style.height = 0;
  element.style.paddingTop = 0;
  element.style.paddingBottom = 0;
  element.style.overflow = "hidden";
  element.offsetHeight;
  element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
  element.style.height = height;
  setTimeout(() => {
    element.style.removeProperty("height");
    element.style.removeProperty("overflow");
    element.style.removeProperty("transition");
    element.style.removeProperty("padding-top");
    element.style.removeProperty("padding-bottom");
  }, duration);
}

function closeOnEscape(e) {
  if (e.code === "Escape") {
    const nav = document.getElementById("nav");
    const navSections = nav.querySelector(".nav-sections");
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections);
      nav.querySelector("button").focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector(".nav-sections");
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
  const isNavDrop = focused.className === "nav-drop";
  if (isNavDrop && (e.code === "Enter" || e.code === "Space")) {
    const dropExpanded = focused.getAttribute("aria-expanded") === "true";
    toggleAllNavSections(focused.closest(".nav-sections"));
    focused.setAttribute("aria-expanded", dropExpanded ? "false" : "true");
  }
}

function focusNavSection() {
  document.activeElement.addEventListener("keydown", openOnKeydown);
}

function toggleAllNavSections(sections, expanded = false) {
  sections.querySelectorAll(".nav-sections .default-content-wrapper > ul > li").forEach((section) => {
    section.setAttribute("aria-expanded", expanded);
  });
}

function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute("aria-expanded") === "true";
  const button = nav.querySelector(".nav-hamburger button");
  document.body.style.overflowY = expanded || isDesktop.matches ? "" : "hidden";
  nav.setAttribute("aria-expanded", expanded ? "false" : "true");
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? "false" : "true");
  button.setAttribute("aria-label", expanded ? "Open navigation" : "Close navigation");

  const navDrops = navSections.querySelectorAll(".nav-drop");
  if (isDesktop.matches) {
    navDrops.forEach((drop) => {
      if (!drop.hasAttribute("tabindex")) {
        drop.setAttribute("tabindex", 0);
        drop.addEventListener("focus", focusNavSection);
      }
    });
  } else {
    navDrops.forEach((drop) => {
      drop.removeAttribute("tabindex");
      drop.removeEventListener("focus", focusNavSection);
    });
  }

  if (!expanded || isDesktop.matches) {
    window.addEventListener("keydown", closeOnEscape);
    nav.addEventListener("focusout", closeOnFocusLost);
  } else {
    window.removeEventListener("keydown", closeOnEscape);
    nav.removeEventListener("focusout", closeOnFocusLost);
  }
}

export default async function decorate(block) {
  const navMeta = getMetadata("nav");
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : "/nav";
  const fragment = await loadFragment(navPath);

  block.textContent = "";
  const nav = document.createElement("nav");
  nav.id = "nav";
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ["brand", "sections", "tools", "bar"];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector(".nav-brand");
  const brandLink = navBrand.querySelector(".button");
  if (brandLink) {
    brandLink.className = "";
    brandLink.closest(".button-container").className = "";
  }

  const navSections = nav.querySelector(".nav-sections");
  if (navSections) {
    navSections.querySelectorAll(":scope .default-content-wrapper > ul > li").forEach((navSection) => {
      if (navSection.querySelector("ul")) navSection.classList.add("nav-drop");
      navSection.addEventListener("click", () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute("aria-expanded") === "true";
          toggleAllNavSections(navSections);
          navSection.setAttribute("aria-expanded", expanded ? "false" : "true");
        }
      });
    });
  }

  const hamburger = document.createElement("div");
  hamburger.classList.add("nav-hamburger");
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation"><span class="nav-hamburger-icon"></span></button>`;
  hamburger.addEventListener("click", () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute("aria-expanded", "false");
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener("change", () => toggleMenu(nav, navSections, isDesktop.matches));

  const navWrapper = document.createElement("div");
  navWrapper.className = "nav-wrapper";
  navWrapper.append(nav);
  block.append(navWrapper);

  const navBar = document.querySelector(".nav-bar");
  const secondUl = navBar?.querySelectorAll("ul")[1];
  const navBarWrapper = document.querySelector(".nav-bar > .default-content-wrapper");
  const heroSection = document.querySelector(".banner-price");

  window.addEventListener("scroll", () => {
    if (!heroSection || !secondUl || !navBarWrapper) return;
    const heroBottom = heroSection.getBoundingClientRect().bottom - 76;
    const img = document.querySelectorAll(".nav-bar p");

    if (heroBottom <= 0) {
      navWrapper.style.transform = "translateY(-100%)";
      // document.getElementsByClassName("header-main")[0].style.display = "none";
      secondUl.style.display = "flex";
      img.forEach((images) => (images.style.display = "block"));
      navBarWrapper.classList.add("scrolled");
      navBarWrapper?.closest('body >header')?.classList.add('hide-header');
      navBarWrapper.style.height = "76px";
      navBarWrapper.style.padding = "0px 10px 0";
    } else {
      navBarWrapper.classList.remove("scrolled");
      navBarWrapper?.closest('body >header')?.classList.remove('hide-header');
      navWrapper.style.transform = "translateY(0)";
      // document.getElementsByClassName("header-main")[0].style.display = "block";
      navBarWrapper.style.padding = "unset";
      secondUl.style.display = "none";
      img.forEach((images) => (images.style.display = "none"));
      navBarWrapper.style.height = "40px";
    }
  });

  if (document.querySelector(".header .section.nav-bar ul li")) {
    document.querySelectorAll(".header .section.nav-bar ul:first-of-type li a").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = e.target.closest("li").querySelector("a").textContent.trim().toLowerCase()?.split(" ").join("-");
        const target = document.querySelector(`.section[data-id="${targetId}"]`);
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  await appendXF(block, headerXf);

  initCompare();
  const addVehicleCheckboxs = block.querySelectorAll(".add-to-compare .add-vehicle-checkbox");
  const traySecion = document.querySelector(".tray-container");

  addVehicleCheckboxs.forEach((addVehicleCheckbox) => {
    addVehicleCheckbox.addEventListener("change", (e) => {
      traySecion.classList.toggle("disappear");
      e.target.dataset.checked = e.target.checked ? "true" : "";
      if (e.target.checked) {
        onVehicleAdd(e);
      } else {
        onVehicleRmove(e);
      }
      if (!e.target.dataset.vehiclesRendered) {
        initCompare();
        e.target.dataset.vehiclesRendered = "true";
      }
    });
  });

  block.querySelectorAll('[data-target="#countryModal"]').forEach((a) => {
    a.addEventListener('click', async function (e) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal('/form/modals/country');
    });
  });

  // let stickyHeader = block.querySelector(".mobile-only.new-header-variation.bottom-menu");
  // if (stickyHeader) {
  //   const helpLink = stickyHeader.querySelectorAll('li')[1]?.querySelector('a');
  //   if (helpLink) {
  //     helpLink.href = helpAndSupportPageUrl;
  //   }
  //   document.body.append(stickyHeader);
  // }
  return block;
}
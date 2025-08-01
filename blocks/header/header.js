import { fetchPlaceholders, getMetadata } from "../../scripts/aem.js";
import initCompare from "./compare.js";
import { loadFragment } from "../fragment/fragment.js";
import { onVehicleAdd, onVehicleRmove } from "./compare-components.js";

const placeholders = await fetchPlaceholders('/form');
const { headerXf, helpAndSupportPageUrl } = placeholders;

// Media query to check for desktop width
const isDesktop = window.matchMedia("(min-width: 900px)");

let navTimeoutSession;
let dropdownItemsSession;
let homepageDesktopHeaderLogo;

/**
 * Fetches data from a given URL.
 * @param {string} url The URL to fetch.
 * @returns {Promise<Response>} The fetch response object.
 */
export async function getFetchAPI(url) {
  try {
    return await fetch(url);
  } catch (error) {
    console.error("Fetch API error:", error);
    return error;
  }
}

/**
 * Appends the Experience Fragment (XF) to the block and initializes its logic.
 * @param {Element} block The main block element.
 * @param {string} xfPath The path to the XF.
 */
export async function appendXF(block, xfPath) {
  const resp = await getFetchAPI(xfPath);
  if (!resp.ok) {
    console.error(`Failed to fetch XF: ${xfPath}`);
    return block;
  }

  let str = await resp.text();
  const { location } = window;
  const isLocalOrAem = location.href.includes("localhost") || location.href.includes(".aem.live") || location.href.includes(".aem.page");

  // Replace links for local/AEM environments
  if (isLocalOrAem) {
    str = str.replaceAll("/etc.clientlibs/", "https://stage.heromotocorp.com/etc.clientlibs/");
    str = str.replaceAll("/content/dam/", "https://stage.heromotocorp.com/content/dam/");
  }
  str = str.replaceAll("hp-hide-cmp-checkbox", "");

  const div = document.createElement("div");
  div.innerHTML = str;

  // Remove elements not needed on the page
  div.querySelector(".tray-container")?.remove();
  div.querySelector(".drawer-container")?.remove();

  // Handle client library stylesheets
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

  // Initialize all dynamic header behaviors
  initDesktopMegaMenu();
  initHeaderBehaviors();
  initMobileMenu();

  return block;
}

/**
 * Initializes desktop megamenu functionality.
 */
function initDesktopMegaMenu() {
  document.querySelectorAll(".megamenu-li").forEach((menuItem) => {
    menuItem.addEventListener("click", function (event) {
      const target = event.target;
      const isNavLink = target.classList.contains("nav-link") || target.parentElement?.classList.contains("nav-link");

      if (isNavLink) {
        clearTimeout(navTimeoutSession);
        clearTimeout(dropdownItemsSession);

        // Deactivate other active menu items
        this.parentElement?.querySelectorAll(".megamenu-li.active")?.forEach((el) => {
          if (el !== this) el.classList.remove("active");
        });

        const allMenus = document.querySelectorAll(".megamenu.slim-scroll");
        const thisMenu = this.querySelector(".megamenu.slim-scroll");

        // Remove animation from all menus
        allMenus.forEach((menu) => menu.classList.remove("homepage-drop-animation"));

        // Remove `homepage-animate` class from all elements
        document.querySelectorAll(".homepage-animate").forEach((el) => el.classList.remove("homepage-animate"));

        // Toggle 'active' class and apply animation
        this.classList.toggle("active");
        if (this.classList.contains("active")) {
          setTimeout(() => thisMenu?.classList.add("homepage-drop-animation"), 50);
        }

        // Manage body overflow
        document.body.style.height = this.classList.contains('active') ? '100vh' : 'auto';
        document.body.style.overflow = this.classList.contains('active') ? 'hidden' : 'auto';

        // Ensure text is visible
        document.querySelectorAll(".bike-spec p, .about-premia-text p, .scroll-for-more-container p").forEach((p) => {
          p.style.display = "block";
        });

        // Initialize header functionality with new animation
        dropdownItemsSession = setTimeout(() => {
          if (this.classList.contains("active")) {
            const combinedClassNames = "." + Array.from(this.classList).join(".");
            initHeader(combinedClassNames);
          }
        }, 50);

        // Handle body fixed position
        const anyActive = document.querySelectorAll(".nav-item.dropdown.megamenu-li.active").length > 0;
        document.body.classList.toggle("position-fixed", anyActive);
      }
    });
  });
}

/**
 * Extracts a number from a string specification.
 * @param {string} str The input string.
 * @returns {number|null} The extracted number or null.
 */
function extractNumberFromSpecification(str) {
  const match = str.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[0]) : null;
}

/**
 * Handles the display of a bike item and its details.
 * @param {HTMLElement} selectedCategory The parent element.
 */
function handleBikeSelection(selectedCategory) {
  let timeOutSession;

  const bikeItemContainers = selectedCategory.querySelectorAll(".bike-item-container");
  const bikeDetailsContainers = selectedCategory.querySelectorAll(".bike-details");

  const handleBikeDetailsDisplay = (index) => {
    clearTimeout(timeOutSession);
    bikeDetailsContainers.forEach((item) => item.classList.remove("selected", "homepage-animate"));

    if (bikeDetailsContainers[index]) {
      bikeDetailsContainers[index].classList.add("selected");
      setTimeout(() => bikeDetailsContainers[index].classList.add("homepage-animate"), 30);
    }
  };

  if (bikeItemContainers.length > 0) {
    bikeItemContainers.forEach((item, index) => {
      // Remove existing event listener to prevent "multiclick" issues
      item.removeEventListener("click", item.handler);

      const handler = (e) => {
        bikeItemContainers.forEach((bike) => bike.classList.remove("selected"));
        e.currentTarget.classList.add("selected");
        handleBikeDetailsDisplay(index);
      };

      item.handler = handler; // Store the handler
      item.addEventListener("click", handler);
    });

    // Select the first bike by default
    bikeItemContainers[0].classList.add("selected");
    handleBikeDetailsDisplay(0);
  }
}

/**
 * Manages the visibility of the scroll indicator based on content height.
 * @param {HTMLElement} parentDiv The scrollable container.
 * @param {HTMLElement} indicator The scroll indicator element.
 */
function handleScrollIndicator(parentDiv, indicator) {
  if (!parentDiv || !indicator) return;

  const totalHeight = [...parentDiv.querySelectorAll(".bike-item-container")]
    .reduce((sum, el) => sum + el.offsetHeight, 0);

  indicator.style.display = totalHeight > parentDiv.offsetHeight ? "flex" : "none";
}

/**
 * Implements the filtering logic for bikes.
 * @param {string} range The filter range string (e.g., "100-200", "newlaunch").
 * @param {HTMLElement} selectedCategory The container for the bikes.
 * @param {HTMLElement[]} bikeItemContainers All bike item elements.
 * @param {Function} handleAboutPremiaDisplay Function to show/hide premia section.
 * @param {Function} handleBikeDetailsDisplay Function to display bike details.
 */
function filterBikes(range, selectedCategory, bikeItemContainers, handleAboutPremiaDisplay, handleBikeDetailsDisplay) {
  let timeOutSession;
  clearTimeout(timeOutSession);
  timeOutSession = setTimeout(() => {
    bikeItemContainers.forEach((item) => item.classList.remove("homepage-animate"));
  }, 350);

  setTimeout(() => {
    let toBeSelectedIndex = -1;
    handleAboutPremiaDisplay(range === "aboutpremia");

    bikeItemContainers.forEach((item, index) => {
      const bikeIsNew = item.dataset.isNewLaunch === "true";
      const bikeSpec = extractNumberFromSpecification(item.querySelector(".bike-spec")?.textContent || "");

      let shouldDisplay = false;

      if (range === "newlaunch") {
        shouldDisplay = bikeIsNew;
      } else if (range !== "aboutpremia") {
        const [left, right] = range.split("-").map(Number);
        shouldDisplay = bikeSpec >= left && bikeSpec < right;
      }

      item.style.display = shouldDisplay ? "flex" : "none";
      if (shouldDisplay) {
        setTimeout(() => item.classList.add("homepage-animate"), 50);
        if (toBeSelectedIndex === -1) {
          toBeSelectedIndex = index;
          item.classList.add("selected");
          handleBikeDetailsDisplay(index);
        }
      }
    });

    // Fallback to select the first visible bike if none were selected
    if (toBeSelectedIndex === -1) {
      const firstVisibleBike = [...bikeItemContainers].find(item => item.style.display !== 'none');
      if (firstVisibleBike) {
        firstVisibleBike.classList.add('selected');
        const firstVisibleIndex = [...bikeItemContainers].indexOf(firstVisibleBike);
        handleBikeDetailsDisplay(firstVisibleIndex);
      }
    }

    // Update scroll indicator after filtering
    const scrollContainer = selectedCategory.querySelector(".column.column2");
    const indicator = selectedCategory.querySelector(".scroll-indicator");
    handleScrollIndicator(scrollContainer, indicator);

  }, 350);
}

/**
 * Initializes the bike filter and detail view logic for a given category.
 * @param {string} parentClassName The class selector for the parent category.
 */
function initHeader(parentClassName) {
  if (parentClassName?.toLowerCase().includes("service")) return;

  const selectedCategory = document.querySelector(parentClassName);
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

  const handleAboutPremiaDisplay = (isShow) => {
    if (!aboutPremiaContainer || !aboutPremiaImgContainer) return;
    if (isShow) {
      bikeDetailsContainers?.forEach((el) => el.classList.remove("selected", "homepage-animate"));
      bikeItemContainers?.forEach((el) => el.style.display = "none");
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

  const handleBikeDetailsDisplay = (index) => {
    bikeDetailsContainers.forEach((item) => item.classList.remove("selected", "homepage-animate"));
    if (bikeDetailsContainers[index]) {
      bikeDetailsContainers[index].classList.add("selected");
      setTimeout(() => bikeDetailsContainers[index].classList.add("homepage-animate"), 30);
    }
  };

  // Attach filter click handlers
  if (filtersArray && filtersContainer?.length > 0) {
    filtersContainer.forEach((el) => el.classList.remove("selected"));
    filtersContainer[0].classList.add("selected");

    const defaultRange = filtersContainer[0].dataset.filterRange;
    if (defaultRange) {
      filterBikes(defaultRange.trim(), selectedCategory, bikeItemContainers, handleAboutPremiaDisplay, handleBikeDetailsDisplay);
    }

    filtersContainer.forEach((filter) => {
      // Remove existing event listener to prevent "multiclick" issues
      filter.removeEventListener("click", filter.handler);

      const handler = (e) => {
        filtersContainer.forEach((f) => f.classList.remove("selected"));
        e.currentTarget.classList.add("selected");
        const range = e.currentTarget.dataset.filterRange;
        if (range) {
          filterBikes(range.trim(), selectedCategory, bikeItemContainers, handleAboutPremiaDisplay, handleBikeDetailsDisplay);
        }
      };

      filter.handler = handler;
      filter.addEventListener("click", handler);
    });
  }

  // Attach bike item click handlers
  if (bikeArray && bikeItemContainers?.length > 0) {
    bikeItemContainers.forEach((item, index) => {
      // Remove existing event listener to prevent "multiclick" issues
      item.removeEventListener("click", item.handler);

      const handler = (e) => {
        bikeItemContainers.forEach((bike) => bike.classList.remove("selected"));
        e.currentTarget.classList.add("selected");
        handleBikeDetailsDisplay(index);
      };

      item.handler = handler;
      item.addEventListener("click", handler);
    });
  }

  // Handle scroll indicator visibility on scroll
  const scrollContainer = selectedCategory.querySelector(".column.column2");
  if (scrollContainer) {
    scrollContainer.addEventListener("scroll", (e) => {
      const el = e.target;
      const indicator = el.closest(parentClassName)?.querySelector(".scroll-indicator");
      if (!indicator) return;

      const scrollPosition = el.scrollTop + el.clientHeight;
      const divContentHeight = el.scrollHeight;

      indicator.style.display = scrollPosition >= divContentHeight - 1 ? "none" : "flex";
    });
  }
}

/**
 * Initializes desktop and mobile header behaviors on load and resize.
 */
function initHeaderBehaviors() {
  const handleHeaderBehavior = () => {
    const width = window.innerWidth;
    const footer = document.querySelector(".event_register_footer");
    const isHomepage = document.querySelector(".homepage-banner");
    const isComparePage = document.querySelector(".homepage-compare-page");
    const navbar = document.querySelector(".navbar.navbar-expand-lg.new-header-variation");

    // Adjust footer classes based on screen width
    footer?.classList.toggle("handle-new-variation-bottom-tab", width < 1024 && width > 767);
    footer?.classList.toggle("handle-new-variation-bottom-mob", width < 768);

    // Mobile homepage header logic
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
    }
    // Desktop or non-homepage header logic
    else if (width > 767 && (isHomepage || isComparePage)) {
      document.querySelectorAll(".navbar-brand").forEach((brand) => {
        const img = brand.querySelector("img");
        if (homepageDesktopHeaderLogo && img) img.setAttribute("src", homepageDesktopHeaderLogo);
      });
      if (navbar) navbar.style.position = "relative";
      document.querySelectorAll(".homepage-redesign-right-nav-icon").forEach((icon) => {
        const desktopIcon = icon.getAttribute("data-desktopicon");
        if (desktopIcon) icon.setAttribute("src", desktopIcon);
      });
    }
    // Mobile compare page header logic
    else if (width <= 767 && isComparePage) {
      document.querySelector(".header-main.new-header-variation")?.style.setProperty("position", "relative");
    }
  };

  if (document.querySelector(".new-header-variation")) {
    window.addEventListener("resize", handleHeaderBehavior);
    handleHeaderBehavior();
  }
}

/**
 * Initializes all mobile menu related functionality.
 */
function initMobileMenu() {
  const menu = document.getElementById("newMobileNav");

  // Handle open/close menu buttons
  document.querySelectorAll("#custom-menu-open-btn, #custom-collapse-menu-btn").forEach((btn) => {
    // Remove existing event listeners to prevent duplicates
    btn.removeEventListener("click", btn.handler);

    const handler = (e) => {
      e.stopPropagation();
      let navHeader = document?.querySelector('body >header');
      if (navHeader?.classList.contains("hamburger-clicked")) {
        navHeader.classList.remove("hamburger-clicked")
      }
      else {
        navHeader.classList.add("hamburger-clicked")
      }
      const isOpen = menu.classList.toggle("open-menu");
      menu.classList.toggle("collapse-menu", !isOpen);

      document.documentElement.classList.toggle("overflow-hidden", isOpen);
      document.querySelector(".event_register_footer")?.classList.toggle("hide", isOpen);

      const navbar = document.querySelector(".navbar.new-header-variation");
      if (navbar) navbar.style.top = isOpen ? "0" : "-70px";
      if (window.scrollY === 0 && navbar) navbar.style.background = "unset";

      // Reset menu state on close
      if (!isOpen) {
        document.querySelector(".bike-container-wrapper.show .back-button-container")?.click();
        document.querySelector(".accordion-header .selected")?.click();
      }
    };

    btn.handler = handler;
    btn.addEventListener("click", handler);
  });

  // Handle accordion menu clicks
  document.querySelectorAll("#newMobileNav .accordion-header").forEach((header) => {
    header.removeEventListener("click", header.handler);

    const handler = (e) => {
      e.stopImmediatePropagation();
      const content = header.nextElementSibling;
      const icon = header.querySelector(".icon");
      const isVisible = content.style.display === "block";

      // Hide all other open accordions
      document.querySelectorAll(".hp-dropdown-content, .drawer-fragment, .our-range-fragment").forEach((el) => (el.style.display = "none"));
      document.querySelectorAll("#newMobileNav .accordion-content").forEach((c) => (c.style.display = "none"));
      document.querySelectorAll("#new-mobile .accordion-header .icon").forEach((i) => (i.textContent = "+"));

      // Show the clicked accordion
      if (!isVisible) {
        content.style.display = "block";
        icon.textContent = "-";
        slideDown(content);

        const parentLi = header.closest("li");
        const classSelector = "." + Array.from(parentLi.classList).join(".");
        initMobileFilterLogic(classSelector);
      } else {
        icon.textContent = "+";
        slideUp(content);
      }
    };

    header.handler = handler;
    header.addEventListener("click", handler);
  });

  // Handle mobile tabs (Service and Parts)
  document.querySelectorAll(".service-mob-tab, .parts-mob-tab").forEach(tab => {
    tab.removeEventListener("click", tab.handler);

    const handler = (e) => {
      const targetClass = e.currentTarget.classList.contains("service-mob-tab") ? ".services-click" : ".parts-click";
      e.currentTarget.parentElement.querySelector(targetClass)?.classList.add("show");
    };

    tab.handler = handler;
    tab.addEventListener("click", handler);
  });

  // Handle mobile tab back buttons
  document.querySelectorAll(".services-click .back-button-container, .parts-click .back-button-container").forEach(backBtn => {
    backBtn.removeEventListener("click", backBtn.handler);

    const handler = (e) => {
      e.currentTarget.parentElement?.classList?.remove("show");
    };

    backBtn.handler = handler;
    backBtn.addEventListener("click", handler);
  });
}

/**
 * Initializes the bike filtering logic for the mobile menu.
 * @param {string} parentClassName The class selector for the parent element.
 */
function initMobileFilterLogic(parentClassName) {
  if (window.innerWidth >= 1024) return;

  const selectedCategory = document.querySelector(parentClassName);
  if (!selectedCategory) return;

  const filters = selectedCategory.querySelectorAll(".mobile-menu .filters");
  const bikeWrapper = selectedCategory.querySelector(".mobile-menu .bike-container-wrapper");
  const backBtn = selectedCategory.querySelector(".mobile-menu .back-button-container");

  filters.forEach((filterBtn) => {
    filterBtn.removeEventListener("click", filterBtn.handler);

    const handler = function () {
      const filterRange = this.dataset.filterRange;
      const bikeContainers = selectedCategory.querySelectorAll(".mobile-menu .bike-container");
      const aboutPremiaText = selectedCategory.querySelector(".mobile-menu .about-premia-text");

      aboutPremiaText?.classList.toggle("d-none", filterRange !== "aboutpremia");

      if (filterRange === "newlaunch") {
        bikeContainers.forEach((container) => {
          container.style.display = container.dataset.isNewLaunch === "true" ? "flex" : "none";
        });
      } else if (filterRange !== "aboutpremia") {
        const [minRange, maxRange] = filterRange.split("-").map(Number);
        bikeContainers.forEach((container) => {
          const specText = container.querySelector(".bike-spec")?.textContent;
          const cc = extractNumberFromSpecification(specText);
          container.style.display = cc >= minRange && cc <= maxRange ? "flex" : "none";
        });
      } else {
        bikeContainers.forEach((container) => (container.style.display = "none"));
      }

      if (bikeWrapper) bikeWrapper.classList.add("show");
      document.querySelectorAll("#newMobileNav .accordion-item").forEach((item) => item.classList.add("remove-margin"));

      const labelText = this.querySelector(".filter-label")?.textContent;
      const backText = bikeWrapper?.querySelector(".back-button-text-container");
      if (backText && labelText) backText.textContent = labelText;
    };

    filterBtn.handler = handler;
    filterBtn.addEventListener("click", handler);
  });

  if (backBtn) {
    backBtn.removeEventListener("click", backBtn.handler);

    const handler = () => {
      if (bikeWrapper) bikeWrapper.classList.remove("show");
      document.querySelectorAll("#newMobileNav .accordion-item").forEach((item) => item.classList.remove("remove-margin"));
    };

    backBtn.handler = handler;
    backBtn.addEventListener("click", handler);
  }
}

/**
 * Slide-up animation utility.
 * @param {Element} element The element to animate.
 * @param {number} duration The animation duration in ms.
 */
function slideUp(element, duration = 300) {
  element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
  element.style.overflow = "hidden";
  element.style.height = element.offsetHeight + "px";
  element.offsetHeight; // Force repaint
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

/**
 * Slide-down animation utility.
 * @param {Element} element The element to animate.
 * @param {number} duration The animation duration in ms.
 */
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
  element.offsetHeight; // Force repaint
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

// --- DECORATE BLOCK FUNCTION ---

/**
 * Loads and decorates the header, mainly the nav.
 * @param {Element} block The header block element.
 */
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

  // Hamburger for mobile
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

  // Scroll behavior for the secondary nav bar
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
      // document.querySelector(".header-main").style.display = "none";
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
      // document.querySelector(".header-main").style.display = "block";
      navBarWrapper.style.padding = "unset";
      secondUl.style.display = "none";
      img.forEach((images) => (images.style.display = "none"));
      navBarWrapper.style.height = "40px";
    }
  });

  // Handle nav-bar links for scrolling to sections
  document.querySelectorAll(".header .section.nav-bar ul:first-of-type li a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = e.target.textContent.trim().toLowerCase().split(" ").join("-");
      const target = document.querySelector(`.section[data-id="${targetId}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  await appendXF(block, headerXf);

  // Initialize the compare feature
  initCompare();
  block.querySelectorAll(".add-to-compare .add-vehicle-checkbox").forEach((addVehicleCheckbox) => {
    addVehicleCheckbox.addEventListener("change", (e) => {
      document.querySelector(".tray-container")?.classList.toggle("disappear");
      e.target.dataset.checked = e.target.checked;
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

  // Attach modal open handlers
  block.querySelectorAll('[data-target="#countryModal"]').forEach((a) => {
    a.addEventListener('click', async function (e) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal('/form/modals/country');
    });
  });

  // Set URL for help and support link in the sticky mobile header
  const stickyHeader = block.querySelector(".mobile-only.new-header-variation.bottom-menu");
  if (stickyHeader) {
    const helpLink = stickyHeader.querySelectorAll('li')[1]?.querySelector('a');
    if (helpLink) {
      helpLink.href = helpAndSupportPageUrl;
    }
    document.body.append(stickyHeader);
  }

  return block;
}

// Helper functions for nav-toggle. These were already well-structured.
function closeOnEscape(e) {
  if (e.code === "Escape") {
    const nav = document.getElementById("nav");
    const navSections = nav.querySelector(".nav-sections");
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      toggleAllNavSections(navSections, false);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      toggleMenu(nav, navSections, false);
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
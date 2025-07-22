import { getMetadata } from "../../scripts/aem.js";
import initCompare from "./compare.js";
import { loadFragment } from "../fragment/fragment.js";
import { onVehicleAdd, onVehicleRmove } from "./compare-components.js";
import { stageendpoint } from "../../scripts/common.js";

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia("(min-width: 900px)");

export async function getFetchAPI(url) {
  try {
    const resp = await fetch(url);
    // const text = type === 'json' ? await resp.json() : await resp.text();
    return resp;
  } catch (error) {
    return error;
  }
}

export async function appendXF(block, xfPath) {
  // block.style.display = 'none';
  const resp = await getFetchAPI(xfPath);
  if (resp.ok) {
    let str = await resp.text();
    const { location } = window;
    if (location.href.includes('localhost') || location.href.includes('.aem.live')) {
      str = str.replaceAll(
        '/etc.clientlibs/',
        'https://stage.heromotocorp.com/etc.clientlibs/',
      );
      str = str.replaceAll(
        '/content/dam/',
        'https://stage.heromotocorp.com/content/dam/',
      );
      str = str.replaceAll('hp-hide-cmp-checkbox', '');
    }
    const div = document.createElement('div');
    div.innerHTML = str;
    div.querySelector('.tray-container').remove();
    div.querySelector('.drawer-container').remove();

    div.querySelectorAll('link').forEach((link) => {
      try {
        const newLink = document.createElement('link');
        newLink.href = link.href
        // newLink.href = link.href.replace('http://localhost:3000', 'https://stage.heromotocorp.com');
        newLink.rel = 'stylesheet';
        document.head.append(newLink);
      } catch (error) {
        console.error(error); // eslint-disable-line
      }
    });
    block.append(div);
    function addClientLibScript() {
      div.querySelectorAll('script').forEach((link) => {
        const exculdeLink = [
          // '/clientlibs/granite/',
          // '/foundation/clientlibs',
        ];
        // debugger;
        if (!exculdeLink.filter((clientLib) => link.src.includes(clientLib)).length) {
          try {
            const newScript = document.createElement('script');
            newScript.src = link.src;
          //   newScript.src = link.src.replace('http://localhost:3000', 'https://stage.heromotocorp.com');
            newScript.type = 'text/javascript';
  
            document.body.append(newScript);
          } catch (error) {
            console.error(error); // eslint-disable-line
          }
        }
      });
      // block.removeEventListener('click', addClientLibScript);
    }
    // block.addEventListener('click', addClientLibScript)
    addClientLibScript();
    // block.style.display = 'block';
    
    // setTimeout(() => {
    //     // $.noConflict();
    //   const event = new Event('DOMContentLoaded');
    //   // Dispatch the event
    //   document.dispatchEvent(event);
    // });
    // if (window.isLast) {
    // }
    // window.isLast = true;
  }
  
  return block;
}

function closeOnEscape(e) {
  if (e.code === "Escape") {
    const nav = document.getElementById("nav");
    const navSections = nav.querySelector(".nav-sections");
    const navSectionExpanded = navSections.querySelector(
      '[aria-expanded="true"]'
    );
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector("button").focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector(".nav-sections");
    const navSectionExpanded = navSections.querySelector(
      '[aria-expanded="true"]'
    );
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === "nav-drop";
  if (isNavDrop && (e.code === "Enter" || e.code === "Space")) {
    const dropExpanded = focused.getAttribute("aria-expanded") === "true";
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest(".nav-sections"));
    focused.setAttribute("aria-expanded", dropExpanded ? "false" : "true");
  }
}

function focusNavSection() {
  document.activeElement.addEventListener("keydown", openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  sections
    .querySelectorAll(".nav-sections .default-content-wrapper > ul > li")
    .forEach((section) => {
      section.setAttribute("aria-expanded", expanded);
    });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded =
    forceExpanded !== null
      ? !forceExpanded
      : nav.getAttribute("aria-expanded") === "true";
  const button = nav.querySelector(".nav-hamburger button");
  document.body.style.overflowY = expanded || isDesktop.matches ? "" : "hidden";
  nav.setAttribute("aria-expanded", expanded ? "false" : "true");
  toggleAllNavSections(
    navSections,
    expanded || isDesktop.matches ? "false" : "true"
  );
  button.setAttribute(
    "aria-label",
    expanded ? "Open navigation" : "Close navigation"
  );
  // enable nav dropdown keyboard accessibility
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

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener("keydown", closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener("focusout", closeOnFocusLost);
  } else {
    window.removeEventListener("keydown", closeOnEscape);
    nav.removeEventListener("focusout", closeOnFocusLost);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment

  const navMeta = getMetadata("nav");
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : "/nav";
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
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
    navSections
      .querySelectorAll(":scope .default-content-wrapper > ul > li")
      .forEach((navSection) => {
        if (navSection.querySelector("ul"))
          navSection.classList.add("nav-drop");
        navSection.addEventListener("click", () => {
          if (isDesktop.matches) {
            const expanded =
              navSection.getAttribute("aria-expanded") === "true";
            toggleAllNavSections(navSections);
            navSection.setAttribute(
              "aria-expanded",
              expanded ? "false" : "true"
            );
          }
        });
      });
  }

  // hamburger for mobile
  const hamburger = document.createElement("div");
  hamburger.classList.add("nav-hamburger");
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener("click", () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute("aria-expanded", "false");
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener("change", () =>
    toggleMenu(nav, navSections, isDesktop.matches)
  );

  const navWrapper = document.createElement("div");
  navWrapper.className = "nav-wrapper";
  navWrapper.append(nav);
  block.append(navWrapper);

  // changes  for header

  window.addEventListener("scroll", function () {
    const header = document.querySelector(".nav-wrapper"); // or .header
    if (window.scrollY > 50) {
      header.style.transform = "translateY(-100%)";
    } else {
      header.style.transform = "translateY(0)";
    }
  });

  initCompare();

  const navWrapper2 = document.querySelector(".nav-wrapper");
  const heroSection = document.querySelector(".banner-price");  //changed it acc to the site

  window.addEventListener("scroll", () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;

    const navBar = document.querySelector(".nav-bar");
    const secondUl = navBar?.querySelectorAll("ul")[1];

    // if (secondUl) {
    //   // console.log("Second <ul> found:", secondUl);
    // } else {
    //   console.warn("Second <ul> not found");
    // }

    const img = document.querySelector(".nav-bar p");

    const navBarWrapper = document.querySelector(
      ".nav-bar > .default-content-wrapper"
    );

    if (heroBottom <= 0) {
      navWrapper2.style.transform = "translateY(-100%)";
      (document.getElementsByClassName("header-main")[0].style.display =
        "none"),
        (secondUl.style.display = "flex");
      img.style.display = "block";
      navBarWrapper.style.height = "72px";
      navBarWrapper.style.padding = "0px 10px 0";
      // navBarWrapper.style.top = "0"
    } else {
      navWrapper2.style.transform = "translateY(0)";
      (document.getElementsByClassName("header-main")[0].style.display =
        "block"),
        (navBarWrapper.style.padding = "unset");
      secondUl.style.display = "none";
      img.style.display = "none";
      navBarWrapper.style.height = "40px";
    }
  });

  if (document.querySelector(".header .section.nav-bar ul li ")) {
    document
      .querySelectorAll(".header .section.nav-bar ul li ")
      .forEach((link) => {
        link.addEventListener("click", (e) => {
          // e.preventDefault();
          const targetId = e.target
            .closest("li")
            .querySelector("a")
            .textContent.trim()
            .toLowerCase()
            ?.split(" ")
            .join("-");
          const target = document.querySelector(
            `.section[data-id="${targetId}"]`
          );
          target?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
  }


  await appendXF(
    block,
    stageendpoint +
      "/content/experience-fragments/hero-aem-website/in/en/hero-site/header/master.html"
  );

  /* init Compare */
  const addVehicleCheckboxs = block.querySelectorAll(
    ".add-to-compare  .add-vehicle-checkbox"
  );
  const traySecion = document.querySelector(".tray-container");

  addVehicleCheckboxs.forEach((addVehicleCheckbox) => {
    addVehicleCheckbox.addEventListener("change", (e) => {
      traySecion.classList.toggle("disappear");
      if (e.target.dataset.checked) {
        e.target.dataset.checked = false;
      } else {
        e.target.dataset.checked = true;
      }
      if (e.target.dataset.checked) {
        onVehicleAdd(e);
      } else {
        onVehicleRmove(e);
      }

      if (e.target.dataset.vehiclesRendered) {
        return;
      }

      initCompare();
      e.target.dataset.vehiclesRendered = true;
    });
  });

  return block;
}

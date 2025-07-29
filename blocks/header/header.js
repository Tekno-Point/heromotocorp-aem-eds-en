import { getMetadata } from "../../scripts/aem.js";
import initCompare from "./compare.js";
import { loadFragment } from "../fragment/fragment.js";
import { onVehicleAdd, onVehicleRmove } from "./compare-components.js";
import { stageendpoint } from "../../scripts/common.js";

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia("(min-width: 900px)");
let scriptcount = 0;
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
    if (
      location.href.includes("localhost") ||
      location.href.includes(".aem.live") ||
      location.href.includes(".aem.page")
    ) {
      str = str.replaceAll(
        "/etc.clientlibs/",
        "https://stage.heromotocorp.com/etc.clientlibs/"
      );
      str = str.replaceAll(
        "/content/dam/",
        "https://stage.heromotocorp.com/content/dam/"
      );
      str = str.replaceAll("hp-hide-cmp-checkbox", "");
    }
    const div = document.createElement("div");
    div.innerHTML = str;
    div.querySelector(".tray-container").remove();
    div.querySelector(".drawer-container").remove();

    div.querySelectorAll("link").forEach((link) => {
      try {
        const newLink = document.createElement("link");
        newLink.href = link.href;
        // newLink.href = link.href.replace('http://localhost:3000', 'https://stage.heromotocorp.com');
        newLink.rel = "stylesheet";
        document.head.append(newLink);
      } catch (error) {
        console.error(error); // eslint-disable-line
      }
    });
    block.append(div);
    ///////////////////AK11 25-07///////////////
    document.querySelectorAll(".megamenu-li").forEach((menuItem) => {
      menuItem.addEventListener("click", function (event) {
        const target = event.target;
        const isNavLink =
          target.classList.contains("nav-link") ||
          target.parentElement?.classList.contains("nav-link");

        if (isNavLink) {
          this.parentElement
            ?.querySelectorAll(".megamenu-li.active")
            ?.forEach((el) => {
              if (el !== this) el.classList.remove("active");
            });
          const allMenus = document.querySelectorAll(".megamenu.slim-scroll");
          const thisMenu = this.querySelector(".megamenu.slim-scroll");

          // Remove animation if any other has it
          allMenus.forEach((menu) => {
            menu.classList.remove("homepage-drop-animation");
          });

          document.querySelectorAll(".homepage-animate").forEach((el) => {
            el.classList.remove("homepage-animate");
          });

          // Handle toggle logic
          if (
            thisMenu &&
            thisMenu.classList.contains("homepage-drop-animation")
          ) {
            navTimeoutSession = setTimeout(() => {
              this.classList.toggle("active");
            }, 400);
          } else {
            this.classList.toggle("active");
            setTimeout(() => {
              thisMenu?.classList.add("homepage-drop-animation");
            }, 50);
          }

          document
            .querySelectorAll(".bike-item-container .bike-spec p")
            .forEach((p) => {
              p.style.display = "block"; // or "inline"
            });

          document.querySelectorAll(".about-premia-text p").forEach((p) => {
            p.style.display = "block"; // or "inline"
          });
          // Handle combined class names
          const classNames = this.className.split(/\s+/);
          const combinedClassNames = "." + classNames.join(".");
          const newVariationClassName = "new-header-variation";

          if (combinedClassNames.includes(newVariationClassName)) {
            this.querySelectorAll(".homepage-animate").forEach((el) => {
              el.classList.remove("homepage-animate");
            });
          }

          dropdownItemsSession = setTimeout(() => {
            initHeader(combinedClassNames);
          }, 50);

          // Body class toggle based on active megamenu items
          const anyActive =
            document.querySelectorAll(".nav-item.dropdown.megamenu-li.active")
              .length > 0;
          document.body.classList.toggle("position-fixed", anyActive);

          // Special case: remove other active menu items if `.e-shop` is active
          if (document.querySelector(".e-shop")?.classList.contains("active")) {
            const siblings =
              this.parentElement?.parentElement?.querySelectorAll(
                ".megamenu-li"
              );
            siblings?.forEach((sibling) => {
              if (sibling !== this) sibling.classList.remove("active");
            });
          }
        }
      });
    });

    function initHeader(parentClassName) {
      if (parentClassName?.toString().toLowerCase().includes("service")) return;

      const selectedCategory = document.querySelector(
        parentClassName?.toString()
      );
      if (!selectedCategory) return;

      const bikeArray = selectedCategory.querySelector(
        ".column2.vehicle-options"
      );
      const bikeDetailsArray = selectedCategory.querySelector(
        ".column3.vehicle-spec-info"
      );
      const filtersArray = selectedCategory.querySelector(
        ".column1.bike-filters"
      );

      const filtersContainer = filtersArray?.querySelectorAll(".filters");
      const bikeItemContainers = bikeArray?.querySelectorAll(
        ".bike-item-container"
      );
      const aboutPremiaContainer =
        bikeArray?.querySelectorAll(".about-premia-text");
      const aboutPremiaImgContainer = bikeDetailsArray?.querySelector(
        ".about-premia-image-container"
      );
      const bikeDetailsContainers =
        bikeDetailsArray?.querySelectorAll(".bike-details");

      let timeOutSession;

      // 👇 Bike Item Click
      const handleClickBikeItem = (event, index) => {
        bikeItemContainers.forEach((bike) => bike.classList.remove("selected"));
        event.currentTarget.classList.add("selected");
        handleBikeDetailsDisplay(index);
      };

      // 👇 Show Bike Details Panel
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

      // 👇 Show/Hide Premia Section
      const handleAboutPremiaDisplay = (isShow) => {
        if (!aboutPremiaContainer || !aboutPremiaImgContainer) return;
        if (isShow) {
          bikeDetailsContainers?.forEach((el) => {
            el.classList.remove("selected", "homepage-animate");
          });
          bikeItemContainers?.forEach((el) => {
            el.classList.remove("selected");
            el.style.display = "none";
          });
          bikeDetailsArray?.classList.add("p-0");
          bikeArray
            ?.querySelector(".scroll-indicator")
            ?.classList.add("d-none");
          aboutPremiaContainer?.forEach((el) => el.classList.remove("d-none"));
          aboutPremiaImgContainer.classList.remove("d-none");
        } else {
          aboutPremiaContainer?.forEach((el) => el.classList.add("d-none"));
          aboutPremiaImgContainer.classList.add("d-none");
          bikeDetailsArray?.classList.remove("p-0");
        }
      };

      // 👇 Filter Click
      const handleClickBikeFilters = (event, index) => {
        filtersContainer.forEach((filter) =>
          filter.classList.remove("selected")
        );
        event.currentTarget.classList.add("selected");
        const range = event.currentTarget.dataset.filterRange;
        if (range) filterBikes(range.trim());
      };

      // 👇 Bike Filter Logic
      const filterBikes = (range) => {
        clearTimeout(timeOutSession);
        timeOutSession = setTimeout(() => {
          bikeItemContainers.forEach((item) =>
            item.classList.remove("homepage-animate")
          );
        });

        setTimeout(() => {
          let toBeSelectedIndex = -1;

          if (range === "newlaunch") {
            handleAboutPremiaDisplay(false);
            bikeItemContainers.forEach((item, index) => {
              if (item.dataset.isNewLaunch === "true") {
                item.classList.remove("selected");
                item.style.display = "flex";
                setTimeout(() => item.classList.add("homepage-animate"), 50);
                if (toBeSelectedIndex === -1) {
                  toBeSelectedIndex = index;
                  item.classList.add("selected");
                  handleBikeDetailsDisplay(index);
                }
              } else {
                item.style.display = "none";
              }
            });
          } else if (range === "aboutpremia") {
            handleAboutPremiaDisplay(true);
          } else {
            handleAboutPremiaDisplay(false);
            const [left, right] = range.split("-");
            const startRange = Number(left);
            const endRange = Number(right);

            bikeItemContainers.forEach((item, index) => {
              const bikeSpec = item.querySelector(".bike-spec")?.textContent;
              const cc = extractNumberFromSpecification(bikeSpec?.trim() || "");
              if (cc && cc >= startRange && cc < endRange) {
                item.classList.remove("selected");
                item.style.display = "flex";
                setTimeout(() => item.classList.add("homepage-animate"), 50);
                if (toBeSelectedIndex === -1) {
                  toBeSelectedIndex = index;
                  item.classList.add("selected");
                  handleBikeDetailsDisplay(index);
                }
              } else {
                item.style.display = "none";
              }
            });
          }
        }, 350);
      };

      // 👇 Scroll Indicator Visibility
      const handleScrollIndicator = () => {
        const parentDiv = selectedCategory.querySelector(".column.column2");
        if (!parentDiv) {
          console.error('Parent div ".column.column2" not found.');
          return;
        }

        const bikeItems = parentDiv.querySelectorAll(".bike-item-container");
        const totalHeight = [...bikeItems].reduce(
          (sum, el) => sum + el.offsetHeight,
          0
        );
        const scrollIndicator =
          selectedCategory.querySelector(".scroll-indicator");

        if (totalHeight > parentDiv.offsetHeight) {
          scrollIndicator.style.display = "flex";
        } else {
          scrollIndicator.style.display = "none";
        }
      };

      // 👇 DOM Interactions
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

        const defaultRange = filtersContainer[0].dataset.filterRange;
        if (defaultRange) filterBikes(defaultRange.trim());

        filtersContainer.forEach((filter, index) => {
          filter.addEventListener("click", (e) =>
            handleClickBikeFilters(e, index)
          );
        });
      }

      // 👇 Scroll Listener to hide scroll-indicator
      const scrollContainers = document.querySelectorAll(".column.column2");
      scrollContainers.forEach((container) => {
        container.removeEventListener("scroll", handleScrollCheck);
        container.addEventListener("scroll", handleScrollCheck);
      });

      function handleScrollCheck(e) {
        const el = e.target;
        const scrollPosition = el.scrollTop + el.clientHeight;
        const divContentHeight = el.scrollHeight;
        const indicator = el
          .closest(parentClassName)
          ?.querySelector(".scroll-indicator");
        if (!indicator) return;

        if (scrollPosition >= divContentHeight - 1) {
          indicator.style.display = "none";
        } else {
          indicator.style.display = "flex";
        }
      }

      setTimeout(handleScrollIndicator, 500);
    }
    const handleClickBikeFilters = (event) => {
      // Remove 'selected' class from all filters
      filtersContainer.forEach((filter) => {
        filter.classList.remove("selected");
      });

      // Add 'selected' class to the clicked one
      const clickedFilter = event.currentTarget;
      clickedFilter.classList.add("selected");

      // Get the filter range and call the filter function
      const range = clickedFilter.dataset.filterRange;
      if (range) {
        filterBikes(range.trim());
      }
    };
    const extractNumberFromSpecification = (str) => {
      const match = str.match(/(\d+(\.\d+)?)/);
      return match ? Number(match[0]) : null;
    };
    ///////////////////AK11 25-07///////////////
    document
      .querySelectorAll(".header-explore-tabs .explore-nav-link")
      .forEach((tab) => {
        tab.addEventListener("click", function () {
          const tabId = this.dataset.id;

          // Remove 'active' class from all tabs
          document
            .querySelectorAll(".header-explore-tabs .explore-nav-link")
            .forEach((el) => {
              el.classList.remove("active");
            });

          // Add 'active' to clicked tab
          this.classList.add("active");

          // Hide all tab contents
          document
            .querySelectorAll(".header-explore-tabs .explore-tab-content")
            .forEach((content) => {
              content.classList.add("d-none");
              content.classList.remove("active");
            });

          // Show selected tab content
          const targetContent = document.querySelector(
            `.header-explore-tabs .explore-tab-content[data-id="${tabId}"]`
          );
          if (targetContent) {
            targetContent.classList.remove("d-none");
            targetContent.classList.add("active");
          }
        });

        // initHeaderMenu();
        let homepageDesktopHeaderLogo;

        function handleHeaderBehavior() {
          const width = window.innerWidth;
          const footer = document.querySelector(".event_register_footer");

          if (width < 1024 && width > 767) {
            footer?.classList.add("handle-new-variation-bottom-tab");
          } else if (width < 768) {
            footer?.classList.add("handle-new-variation-bottom-mob");
          }

          const isHomepage = document.querySelector(".homepage-banner");
          const isComparePage = document.querySelector(
            ".homepage-compare-page"
          );
          const navbar = document.querySelector(
            ".navbar.navbar-expand-lg.new-header-variation"
          );

          if (width <= 767 && isHomepage) {
            document
              .querySelectorAll(".homepage-redesign-right-nav-icon")
              .forEach((icon) => {
                const mobileIcon = icon.getAttribute("data-mobileicon");
                if (mobileIcon) {
                  icon.setAttribute("src", mobileIcon);
                }
              });

            document.querySelectorAll(".navbar-brand").forEach((brand) => {
              const headerLogo = document
                .getElementById("newMobileNav")
                ?.getAttribute("data-mobileheaderlogo");
              const img = brand.querySelector("img");

              if (headerLogo && img) {
                if (!homepageDesktopHeaderLogo) {
                  homepageDesktopHeaderLogo = img.getAttribute("src");
                }
                img.setAttribute("src", headerLogo);
              }
            });

            if (navbar) {
              navbar.style.position = "fixed";
            }

            let prevScroll = window.scrollY;

            window.addEventListener("scroll", () => {
              let currentScroll = window.scrollY;

              if (currentScroll <= 0) {
                navbar.style.top = "0";
                navbar.style.background = "unset";
              } else {
                navbar.style.background = "rgba(0,0,0,0.2)";
                // navbar.style.top = "-70px"; // Uncomment if needed
              }

              prevScroll = currentScroll;
            });
          } else if (width > 767 && (isHomepage || isComparePage)) {
            document.querySelectorAll(".navbar-brand").forEach((brand) => {
              const img = brand.querySelector("img");
              if (homepageDesktopHeaderLogo && img) {
                img.setAttribute("src", homepageDesktopHeaderLogo);
              }
            });

            if (navbar) {
              navbar.style.top = "0";
              navbar.style.position = "relative";
            }

            document
              .querySelectorAll(".homepage-redesign-right-nav-icon")
              .forEach((icon) => {
                const desktopIcon = icon.getAttribute("data-desktopicon");
                if (desktopIcon) {
                  icon.setAttribute("src", desktopIcon);
                }
              });
          } else if (width <= 767 && isComparePage) {
            document
              .querySelector(".header-main.new-header-variation")
              ?.style.setProperty("position", "relative");
          }
        }

        if (document.querySelector(".new-header-variation")) {
          window.addEventListener("resize", handleHeaderBehavior);
          handleHeaderBehavior();
        }

        ///////////////////////////end///////////
      });
    //////////////////////////mobile code/////////
    const openBtns = document.querySelectorAll(
      "#custom-menu-open-btn, #custom-collapse-menu-btn"
    );

    openBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        initHeaderMenu();
      });
    });

    // function mobileMenuHandler(parentClassName = ".accordion-header") {
    //   let selectedCategory = document.querySelector(parentClassName);

    //   function onFilterClick() {
    //     if (window.innerWidth >= 1024) return;

    //     document
    //       .querySelectorAll(".mobile-menu .filters")
    //       .forEach((filterBtn) => {
    //         filterBtn.addEventListener("click", function () {
    //           const parentLi = this.closest("li");
    //           if (!parentLi) return;
    //           const parentLiClasses = Array.from(parentLi.classList);
    //           const combinedClassNames = "." + parentLiClasses.join(".");
    //           selectedCategory = document.querySelector(combinedClassNames);

    //           const isNewLaunch = this.dataset.filterRange;

    //           const bikeContainers = selectedCategory.querySelectorAll(
    //             ".mobile-menu .bike-container"
    //           );
    //           const aboutPremiaText = selectedCategory.querySelector(
    //             ".mobile-menu .about-premia-text"
    //           );

    //           if (isNewLaunch === "newlaunch") {
    //             if (aboutPremiaText)
    //               aboutPremiaText.classList.add("d-none");

    //             bikeContainers.forEach((container) => {
    //               const isNew = container.dataset.isNewLaunch === "true";
    //               container.style.display = isNew ? "flex" : "none";
    //             });
    //           } else if (isNewLaunch === "aboutpremia") {
    //             bikeContainers.forEach(
    //               (container) => (container.style.display = "none")
    //             );
    //             if (aboutPremiaText)
    //               aboutPremiaText.classList.remove("d-none");
    //           } else {
    //             const [minRange, maxRange] = isNewLaunch
    //               .split("-")
    //               .map(Number);
    //             if (aboutPremiaText)
    //               aboutPremiaText.classList.add("d-none");

    //             const bikeSpecs = selectedCategory.querySelectorAll(
    //               ".mobile-menu .bike-container .bike-item-container .bike-spec"
    //             );
    //             bikeSpecs.forEach((spec, index) => {
    //               const match = spec.textContent.match(/\d+/);
    //               const number = match ? parseInt(match[0], 10) : 0;
    //               const container = bikeContainers[index];
    //               container.style.display =
    //                 number >= minRange && number <= maxRange
    //                   ? "flex"
    //                   : "none";
    //             });
    //           }

    //           const bikeWrapper = selectedCategory.querySelector(
    //             ".mobile-menu .bike-container-wrapper"
    //           );
    //           if (bikeWrapper) bikeWrapper.classList.add("show");

    //           document
    //             .querySelectorAll("#newMobileNav .accordion-item")
    //             .forEach((item) => {
    //               item.classList.add("remove-margin");
    //             });

    //           const labelText =
    //             this.querySelector(".filter-label")?.textContent;
    //           const backText = document.querySelector(
    //             "#newMobileNav .back-button-text-container"
    //           );
    //           if (backText && labelText) backText.textContent = labelText;
    //         });
    //       });

    //     document
    //       .querySelectorAll(".mobile-menu .back-button-container")
    //       .forEach((backBtn) => {
    //         backBtn.addEventListener("click", function () {
    //           const bikeWrapper = selectedCategory.querySelector(
    //             ".mobile-menu .bike-container-wrapper"
    //           );
    //           if (bikeWrapper) bikeWrapper.classList.remove("show");

    //           document
    //             .querySelectorAll("#newMobileNav .accordion-item")
    //             .forEach((item) => {
    //               item.classList.remove("remove-margin");
    //             });
    //         });
    //       });
    //   }

    //   onFilterClick();
    //   window.addEventListener("resize", onFilterClick);
    // }
    function initHeaderMenu() {
      const openBtns = document.querySelectorAll(
        "#custom-menu-open-btn, #custom-collapse-menu-btn"
      );
      openBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const menu = document.getElementById("newMobileNav");
          const imageUrl = menu.getAttribute("data-mobilemenuimg");
          const imgContainer = menu.querySelector(".mobile-img-container");
          // if (imgContainer && imageUrl) {
          //   imgContainer.style.backgroundImage = `url("${imageUrl}")`;
          // }

          if (menu.classList.contains("collapse-menu")) {
            menu.classList.remove("collapse-menu");
            menu.classList.add("open-menu");
            document
              .querySelector(".new-header-variation.Premium.mobile-accordion")
              ?.scrollIntoView();
            document
              .querySelector(".event_register_footer")
              ?.classList.add("hide");
            const navbar = document.querySelector(
              ".navbar.navbar-expand-lg.new-header-variation"
            );
            if (navbar) {
              navbar.style.top = "0";
              // navbar.style.background = "#000";
            }
            document.documentElement.classList.add("overflow-hidden");
          } else if (menu.classList.contains("open-menu")) {
            document
              .querySelector(
                ".bike-container-wrapper.show .back-button-container"
              )
              ?.click();
            document.querySelector(".accordion-header .selected")?.click();
            menu.classList.remove("open-menu");
            menu.classList.add("collapse-menu");
            document
              .querySelector(".event_register_footer")
              ?.classList.remove("hide");
            const navbar = document.querySelector(
              ".navbar.navbar-expand-lg.new-header-variation"
            );
            if (window.scrollY > 0 && navbar) {
              navbar.style.top = "-70px";
            }
            document.documentElement.classList.remove("overflow-hidden");
            if (navbar) navbar.style.background = "unset";
          } else {
            menu.classList.add("open-menu");
            document.body.classList.add("position-fixed");
          }
        });
      });
      document
        .querySelectorAll("#newMobileNav .accordion-header")
        .forEach((header) => {
          header.addEventListener("click", function (e) {
            e.stopImmediatePropagation();

            const content = this.nextElementSibling;
            const icon = this.querySelector(".icon");
            const anchor = this.querySelector("a");
            const parentLi = this.closest("li");
            const classSelector =
              "." + Array.from(parentLi.classList).join(".");
            mobileMenuHandler(classSelector);
            console.log(classSelector)
            const isVisible = content.style.display === "block";
            document.querySelectorAll(".hp-dropdown-content").forEach((el) => {
              el.style.display = "none";
            }); ///////hide
            document.querySelectorAll(".drawer-fragment").forEach((el) => {
              el.style.display = "none";
            });
            document.querySelectorAll(".our-range-fragment").forEach((el) => {
              el.style.display = "none";
            });
           
            document
              .querySelectorAll(".bike-item-container .bike-spec p")
              .forEach((p) => {
                p.style.display = "block"; // or "inline"
              });

            document.querySelectorAll(".about-premia-text p").forEach((p) => {
              p.style.display = "block"; // or "inline"
            });
            document
              .querySelectorAll("#new-mobile .accordion-content")
              .forEach((c) => (c.style.display = "none"));
            document
              .querySelectorAll("#new-mobile .accordion-header .icon")
              .forEach((i) => (i.textContent = "+"));
            if (!isVisible) {
              console.log(content)
              content.style.display = "block";
              icon.textContent = "-";
              anchor?.classList.add("selected");
               slideDown(content);
            } else {
           
              content.style.display = "none";
              icon.textContent = "+";
              anchor?.classList.remove("selected");
                 slideUp(content);
            }
          });
        });
      document.querySelectorAll(".service-mob-tab").forEach(function (eachEl) {
        eachEl.addEventListener("click", (e) => {
          e.currentTarget.parentElement.querySelector(".services-click").classList.add("show");
        });
      })

      document.querySelectorAll(".parts-mob-tab").forEach(function (eachEl) {
        eachEl.addEventListener("click", (e) => {
          e.currentTarget.parentElement.querySelector(".parts-click").classList.add("show");
        })
      })

      document.querySelectorAll(".services-click .back-button-container").forEach(function (eachEl) {
        eachEl.addEventListener("click", (e) => {
          e.currentTarget.parentElement?.classList?.remove("show");
        });
      })
      document.querySelectorAll(".parts-click .back-button-container").forEach(function (eachEl) {
        eachEl.addEventListener("click", (e) => {
          e.currentTarget.parentElement.classList.remove("show");
        });
      })

    }


    function slideUp(element, duration = 300) {
      element.style.transition = `height ${duration}ms ease, padding ${duration}ms ease`;
      element.style.boxSizing = "border-box";
      element.style.height = element.offsetHeight + "px";
      element.offsetHeight; // force repaint
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
      element.offsetHeight; // force repaint
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

    initHeaderMenu();
    let homepageDesktopHeaderLogo;
    function handleHeaderBehavior() {
      const width = window.innerWidth;
      const footer = document.querySelector(".event_register_footer");
      if (width < 1024 && width > 767) {
        footer?.classList.add("handle-new-variation-bottom-tab");
      } else if (width < 768) {
        footer?.classList.add("handle-new-variation-bottom-mob");
      }
      const isHomepage = document.querySelector(".homepage-banner");
      const isComparePage = document.querySelector(".homepage-compare-page");
      const navbar = document.querySelector(
        ".navbar.navbar-expand-lg.new-header-variation"
      );
      if (width <= 767 && isHomepage) {
        document
          .querySelectorAll(".homepage-redesign-right-nav-icon")
          .forEach((icon) => {
            const mobileIcon = icon.getAttribute("data-mobileicon");
            if (mobileIcon) {
              icon.setAttribute("src", mobileIcon);
            }
          });
        document.querySelectorAll(".navbar-brand").forEach((brand) => {
          const headerLogo = document
            .getElementById("newMobileNav")
            ?.getAttribute("data-mobileheaderlogo");
          const img = brand.querySelector("img");
          if (headerLogo && img) {
            if (!homepageDesktopHeaderLogo) {
              homepageDesktopHeaderLogo = img.getAttribute("src");
            }
            img.setAttribute("src", headerLogo);
          }
        });
        if (navbar) {
          navbar.style.position = "fixed";
        }
        let prevScroll = window.scrollY;
        window.addEventListener("scroll", () => {
          let currentScroll = window.scrollY;
          if (currentScroll <= 0) {
            navbar.style.top = "0";
            navbar.style.background = "unset";
          } else {
            navbar.style.background = "rgba(0,0,0,0.2)";
            // navbar.style.top = "-70px"; // Uncomment if needed
          }
          prevScroll = currentScroll;
        });
      } else if (width > 767 && (isHomepage || isComparePage)) {
        document.querySelectorAll(".navbar-brand").forEach((brand) => {
          const img = brand.querySelector("img");
          if (homepageDesktopHeaderLogo && img) {
            img.setAttribute("src", homepageDesktopHeaderLogo);
          }
        });
        if (navbar) {
          navbar.style.top = "0";
          navbar.style.position = "relative";
        }
        document
          .querySelectorAll(".homepage-redesign-right-nav-icon")
          .forEach((icon) => {
            const desktopIcon = icon.getAttribute("data-desktopicon");
            if (desktopIcon) {
              icon.setAttribute("src", desktopIcon);
            }
          });
      } else if (width <= 767 && isComparePage) {
        document
          .querySelector(".header-main.new-header-variation")
          ?.style.setProperty("position", "relative");
      }
    }
    if (document.querySelector(".new-header-variation")) {
      window.addEventListener("resize", handleHeaderBehavior);
      handleHeaderBehavior();
    }



    function mobileMenuHandler(parentClassName = ".accordion-header") {
      let selectedCategory = document.querySelector(parentClassName);
      function onFilterClick() {
        if (window.innerWidth >= 1024) return;
        document
          .querySelectorAll(".mobile-menu .filters")
          .forEach((filterBtn) => {
            filterBtn.addEventListener("click", function () {
              const parentLi = this.closest("li");
              if (!parentLi) return;
              const parentLiClasses = Array.from(parentLi.classList);
              const combinedClassNames = "." + parentLiClasses.join(".");
              selectedCategory = document.querySelector(combinedClassNames);
              const isNewLaunch = this.dataset.filterRange;
              const bikeContainers = selectedCategory.querySelectorAll(
                ".mobile-menu .bike-container"
              );
              const aboutPremiaText = selectedCategory.querySelector(
                ".mobile-menu .about-premia-text"
              );
              if (isNewLaunch === "newlaunch") {
                if (aboutPremiaText) aboutPremiaText.classList.add("d-none");
                bikeContainers.forEach((container) => {
                  const isNew = container.dataset.isNewLaunch === "true";
                  container.style.display = isNew ? "flex" : "none";
                });
              } else if (isNewLaunch === "aboutpremia") {
                bikeContainers.forEach(
                  (container) => (container.style.display = "none")
                );
                if (aboutPremiaText) aboutPremiaText.classList.remove("d-none");
              } else {
                const [minRange, maxRange] = isNewLaunch.split("-").map(Number);
                if (aboutPremiaText) aboutPremiaText.classList.add("d-none");
                const bikeSpecs = selectedCategory.querySelectorAll(
                  ".mobile-menu .bike-container .bike-item-container .bike-spec"
                );
                bikeSpecs.forEach((spec, index) => {
                  const match = spec.textContent.match(/\d+/);
                  const number = match ? parseInt(match[0], 10) : 0;
                  const container = bikeContainers[index];
                  container.style.display =
                    number >= minRange && number <= maxRange ? "flex" : "none";
                });
              }
              const bikeWrapper = selectedCategory.querySelector(
                ".mobile-menu .bike-container-wrapper"
              );
              if (bikeWrapper) bikeWrapper.classList.add("show");
              document
                .querySelectorAll("#newMobileNav .accordion-item")
                .forEach((item) => {
                  item.classList.add("remove-margin");
                });
              const labelText =
                this.querySelector(".filter-label")?.textContent;
              // debugger;
              const backText = bikeWrapper.querySelector(
                "#newMobileNav .back-button-text-container"
              );
              if (backText && labelText) backText.textContent = labelText;
            });
          });
        document
          .querySelectorAll(".mobile-menu .back-button-container")
          .forEach((backBtn) => {
            backBtn.addEventListener("click", function () {
              const bikeWrapper = selectedCategory.querySelector(
                ".mobile-menu .bike-container-wrapper"
              );
              if (bikeWrapper) bikeWrapper.classList.remove("show");
              document
                .querySelectorAll("#newMobileNav .accordion-item")
                .forEach((item) => {
                  item.classList.remove("remove-margin");
                });
            });
          });
      }
      onFilterClick();
      window.addEventListener("resize", onFilterClick);
    }
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
  const heroSection = document.querySelector(".banner-price"); //changed it acc to the site


 const img = document.querySelectorAll(".nav-bar p");
   img.forEach((images)=>{
        images.style.display = "none"
      })

  window.addEventListener("scroll", () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;

    const navBar = document.querySelector(".nav-bar");
    const secondUl = navBar?.querySelectorAll("ul")[1];

    // if (secondUl) {
    //   // console.log("Second <ul> found:", secondUl);
    // } else {
    //   console.warn("Second <ul> not found");
    // }

    const img = document.querySelectorAll(".nav-bar p");

    const navBarWrapper = document.querySelector(
      ".nav-bar > .default-content-wrapper"
    );

    if (heroBottom <= 0) {
      navWrapper2.style.transform = "translateY(-100%)";
      (document.getElementsByClassName("header-main")[0].style.display =
        "none"),
        (secondUl.style.display = "flex");
      // img.style.display = "block";
       img.forEach((images)=>{
        images.style.display = "block"
      })
      navBarWrapper.style.height = "76px";
      navBarWrapper.style.padding = "0px 10px 0";
      // navBarWrapper.style.top = "0"
    } else {
      navWrapper2.style.transform = "translateY(0)";
      (document.getElementsByClassName("header-main")[0].style.display =
        "block"),
        (navBarWrapper.style.padding = "unset");
      secondUl.style.display = "none";
      // img.style.display = "none";
       img.forEach((images)=>{
        images.style.display = "none"
      })
      navBarWrapper.style.height = "40px";
    }
  });

  if (document.querySelector(".header .section.nav-bar ul li ")) {
    document
      .querySelectorAll(".header .section.nav-bar ul li ")
      .forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();
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
  // document
  //   .getElementsByClassName("navbar-nav")
  //   .addEventListener("click", addClientLibScript);
  return block;
}

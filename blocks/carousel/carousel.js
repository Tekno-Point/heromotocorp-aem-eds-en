// import Swiper from "./swiper.min.js";

// export default function decorate(block) {
//   console.log("Carousel block detected");

//   // Add unique class names to children
//   Array.from(block.children).forEach((element, index) => {
//     element.classList.add("inner-" + (index + 1));
//     Array.from(element.children).forEach((child, subIndex) => {
//       child.classList.add("inner-innerSub-" + (subIndex + 1));
//     });
//   });

//   // Store the custom pagination content (e.g., image or text elements)
//   const paginationTexts = [];

//   // Convert block to Swiper container
//   block.classList.add("swiper");

//   // Create swiper-wrapper
//   const swiperWrapper = document.createElement("div");
//   swiperWrapper.classList.add("swiper-wrapper");

//   Array.from(block.children).forEach((element) => {
//     const paginationContent = element?.firstElementChild?.firstElementChild;
//     if (paginationContent) paginationTexts.push(paginationContent);

//     element.classList.add("swiper-slide");
//     // document.querySelector('.inner-innerSub-1 h3').style.display = 'none'
//     swiperWrapper.appendChild(element);
//   });

//   Array.from(swiperWrapper.querySelectorAll(".inner-innerSub-1 h3")).map(
//     (i, k) => i.remove()
//   );

//   // Clear original block and append new structure
//   block.innerHTML = "";
//   block.appendChild(swiperWrapper);

//   // Create navigation & pagination container
//   const btnWrapper = document.createElement("div");
//   btnWrapper.classList.add("btnWrapper");

//   const divPagination = document.createElement("div");
//   divPagination.classList.add("swiper-pagination");
//   btnWrapper.appendChild(divPagination);

//   const leftArrow = document.createElement("div");
//   leftArrow.classList.add("swiper-button-prev");
//   leftArrow.textContent = "<";
//   btnWrapper.appendChild(leftArrow);

//   const rightArrow = document.createElement("div");
//   rightArrow.classList.add("swiper-button-next");
//   rightArrow.textContent = ">";
//   btnWrapper.appendChild(rightArrow);

//   block.appendChild(btnWrapper);

//   // Initialize Swiper
//   Swiper(block, {
//     loop: false,
//     navigation: {
//       nextEl: rightArrow,
//       prevEl: leftArrow,
//     },
//     pagination: {
//       el: divPagination,
//       clickable: true,
//       renderBullet: function (index, className) {
//         const el = paginationTexts[index];
//         if (!el) return `<span class="${className}">•</span>`; // fallback

//         const clone = el.cloneNode(true); // safe clone
//         clone.classList.add("swiper-pagination-bullet");
//         return clone.outerHTML;
//       },
//     },
//     freeMode: true,
//     scrollOnFocus: true,
//   });


//   let prevBtn = block.querySelector(".swiper-button-prev");
//   let nextBtn = block.querySelector(".swiper-button-next");
//   [prevBtn, nextBtn].forEach((btn) => {
//     btn.addEventListener("click", () => {
//       let activeTab = block.querySelector(".swiper-pagination-bullet-active");
//       activeTab.scrollIntoView({ behavior: "smooth", block: "center" });
//     });
//   });
//   scrollIntoView(activeTab)

// }







// changes for slide over 



import Swiper from "./swiper.min.js";

export default function decorate(block) {
  console.log("Carousel block detected");

  // Add unique class names to children
  Array.from(block.children).forEach((element, index) => {
    element.classList.add("inner-" + (index + 1));
    Array.from(element.children).forEach((child, subIndex) => {
      child.classList.add("inner-innerSub-" + (subIndex + 1));
    });
  });

  const paginationTexts = [];
  block.classList.add("swiper");

  // Create swiper-wrapper
  const swiperWrapper = document.createElement("div");
  swiperWrapper.classList.add("swiper-wrapper");

  Array.from(block.children).forEach((element) => {
    const paginationContent = element?.firstElementChild?.firstElementChild;
    if (paginationContent) paginationTexts.push(paginationContent);
    element.classList.add("swiper-slide");
    swiperWrapper.appendChild(element);
  });

  Array.from(swiperWrapper.querySelectorAll(".inner-innerSub-1 h3")).forEach((i) => i.remove());

  // Clear block and append new structure
  block.innerHTML = "";
  block.appendChild(swiperWrapper);

  // Navigation & pagination UI
  const btnWrapper = document.createElement("div");
  btnWrapper.classList.add("btnWrapper");

  const divPagination = document.createElement("div");
  divPagination.classList.add("swiper-pagination");
  btnWrapper.appendChild(divPagination);

  const leftArrow = document.createElement("div");
  leftArrow.classList.add("swiper-button-prev");
//   leftArrow.textContent = "<";
  btnWrapper.appendChild(leftArrow);

  const rightArrow = document.createElement("div");
  rightArrow.classList.add("swiper-button-next");
//   rightArrow.textContent = ">";
  btnWrapper.appendChild(rightArrow);

  block.appendChild(btnWrapper);

  const prevBtn = leftArrow;
  const nextBtn = rightArrow;

  // Initialize and store Swiper instance
  const swiperInstance = new Swiper(block, {
    loop: false,
    navigation: {
      nextEl: rightArrow,
      prevEl: leftArrow,
    },
    pagination: {
      el: divPagination,
      clickable: true,
      renderBullet: function (index, className) {
        const el = paginationTexts[index];
        if (!el) return `<span class="${className}">•</span>`;
        const clone = el.cloneNode(true);
        clone.classList.add("swiper-pagination-bullet");
        return clone.outerHTML;
      },
    },
    freeMode: true,
    scrollOnFocus: true,
    // on: {
    //   init: function () {
    //     updateNavButtons(this);
    //   },
    //   slideChange: function () {
    //     updateNavButtons(this);
    //     const activeTab = block.querySelector(".swiper-pagination-bullet-active");
    //     if (activeTab) {
    //       activeTab.scrollIntoView({ behavior: "smooth", block: "center" });
    //     }
    //   },
    // },
  });

  // Scroll bullet into view on click
  // [prevBtn, nextBtn].forEach((btn) => {
  //   btn.addEventListener("click", () => {
  //     const activeTab = block.querySelector(".swiper-pagination-bullet-active");
  //     if (activeTab) {
  //       activeTab.scrollIntoView({ behavior: "smooth", block: "center" });
  //     }
  //   });
  // });


  [prevBtn, nextBtn].forEach((btn) => {
  btn.addEventListener("click", () => {
    const activeBullet = block.querySelector(".swiper-pagination-bullet-active");
    const paginationContainer = block.querySelector(".swiper-pagination");

    if (activeBullet && paginationContainer) {
      const bulletLeft = activeBullet.offsetLeft;
      const containerWidth = paginationContainer.offsetWidth;
      const bulletWidth = activeBullet.offsetWidth;

      // Scroll the pagination container so the active bullet is centered
      paginationContainer.scrollTo({
        left: bulletLeft - (containerWidth / 2) + (bulletWidth / 2),
        behavior: "smooth"
      });
    }
  });
});


  // Update button states
  function updateNavButtons(swiper) {
    if (swiper.isBeginning) {
      prevBtn.classList.add("disabled");
    } else {
      prevBtn.classList.remove("disabled");
    }

    if (swiper.isEnd) {
      nextBtn.classList.add("disabled");
    } else {
      nextBtn.classList.remove("disabled");
    }
  }
}

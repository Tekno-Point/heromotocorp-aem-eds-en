import BlocksSwiper from "../swiper/swiper.min.js";

export default function decorate(block) {
  block.classList.add("swiper");

  const swiperWrapper = document.createElement("div");
  swiperWrapper.classList.add("swiper-wrapper");

  Array.from(block.children).forEach((element) => {
    element.classList.add("swiper-slide");
    swiperWrapper.appendChild(element);
  });

  block.innerHTML = '';
  block.appendChild(swiperWrapper);

  const paginationEl = document.createElement("div");
  paginationEl.classList.add("swiper-pagination");
  block.appendChild(paginationEl);

  // ✅ Initialize Swiper with autoplay + observer
  BlocksSwiper(block, {
    loop: true,
    grabCursor: true,
    spaceBetween: 10,
    autoplay: {
      delay: 3000,
      disableOnInteraction: false,
    },
    pagination: {
      el: paginationEl,
      clickable: true,
    },
    observer: true,              // 👈 observe DOM changes
    observeParents: true,        // 👈 observe parent visibility
    breakpoints: {
      0: {
        slidesPerView: 1,
      },
      768: {
        slidesPerView: 2,
      },
      1024: {
        slidesPerView: 3,
      },
    },
  });
}

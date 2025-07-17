import SwiperText from "../swiper/swiper.min.js"
export default function decorate(block) {
//   const paginationTexts = ['Brakes', 'i3S Technology', 'Rear Suspension', 'Seat','Side Stand Indicator','xSENS FI Technology','Tyer','Warranty'];
  const paginationTexts = [];
  console.log(block);
  block.classList.add("swiper");
  const swapperWapper = document.createElement("div");
  swapperWapper.classList.add("swiper-wrapper")
  Array.from(block.children).forEach((element) => {
    paginationTexts.push(element?.firstElementChild?.firstElementChild);
    element.classList.add("swiper-slide")
    swapperWapper.append(element);
  })
  block.append(swapperWapper)
  // swiper-pagination
  

  const btnWrapper = document.createElement("div");
  btnWrapper.classList.add("btnWrapper");

  const divPagination = document.createElement("div");
  divPagination.classList.add("swiper-pagination");
  btnWrapper.append(divPagination);

  const LeftArrow = document.createElement("div");
  LeftArrow.classList.add("swiper-button-prev");
  btnWrapper.appendChild(LeftArrow);

  const RightArrow = document.createElement("div")
  RightArrow.classList.add("swiper-button-next");
  btnWrapper.appendChild(RightArrow);

  block.append(btnWrapper)
  SwiperText(block, {
    loop:true,
    navigation: {
      nextEl: RightArrow,
      prevEl: LeftArrow,
    },
    pagination: {
      el: divPagination,
      clickable: true,
      renderBullet: function (index, className) {
        // Use your text for each bullet based on index
        const el = paginationTexts[index];
        console.log(paginationTexts[index]);
        el?.remove();
        el.classList.add('swiper-pagination-bullet');
        return paginationTexts[index].outerHTML;
      }
    },
    freeMode: true,           // free scrolling mode
    // scrollbar: {
    //   el: divPagination,
    //   draggable: true,
    //   clickable: true,
    // },
    scrollOnFocus : true
  })
}

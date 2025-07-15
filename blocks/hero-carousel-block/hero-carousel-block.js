import SwiperBlock from "../swiper/swiper.js"
export default function decorate(block) {
  Array.from(block.children).forEach((element, index) => {
    element.classList.add("inner-" + (index+1))
    Array.from(element.children).forEach((element, indjx) => {
      element.classList.add("inner-innerSub-" + (indjx+1))
    })
  });
  SwiperBlock(block)
}
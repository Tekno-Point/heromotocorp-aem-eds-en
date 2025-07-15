/*eslint-disable*/
import BlocksSwiper from "../swiper/swiper.min.js";
import { div, h2, p, img, a } from "../../scripts/dom-helpers.js";

export default function decorate(block) {
  function getFakeApiData() {
    return [
      {
        id: 1,
        image: "https://picsum.photos/id/1015/250/150",
        title: "Mountain View",
        description: "A beautiful mountain view with mist and trees.",
        link: "#",
      },
      {
        id: 2,
        image: "https://picsum.photos/id/1016/250/150",
        title: "City Life",
        description: "The hustle and bustle of a vibrant cityscape.",
        link: "#",
      },
      {
        id: 3,
        image: "https://picsum.photos/id/1018/250/150",
        title: "Ocean Breeze",
        description: "Relaxing ocean waves on a sunny day.",
        link: "#",
      },
      {
        id: 4,
        image: "https://picsum.photos/id/1020/250/150",
        title: "Forest Trail",
        description: "A serene walk through the woods.",
        link: "#",
      },
       {
        id: 5,
        image: "https://picsum.photos/id/1020/250/150",
        title: "Forest Trail",
        description: "A serene walk through the woods.",
        link: "#",
      },
       {
        id: 6,
        image: "https://picsum.photos/id/1020/250/150",
        title: "Forest Trail",
        description: "A serene walk through the woods.",
        link: "#",
      },
       {
        id: 7,
        image: "https://picsum.photos/id/1020/250/150",
        title: "Forest Trail",
        description: "A serene walk through the woods.",
        link: "#",
      },
       {
        id: 8,
        image: "https://picsum.photos/id/1020/250/150",
        title: "Forest Trail",
        description: "A serene walk through the woods.",
        link: "#",
      }
    ];
  }

  const apiData = getFakeApiData();
  const mainDiv = div(
    { class: "cards-container swiper" },
    div(
      { class: "swiper-wrapper" },
      ...apiData.map((data) =>
        div(
          { class: "swiper-slide" },
          div(
            { class: "images" },
            img({ class: "my-image", src: data.image, alt: data.title })
          ),
          div(
            { class: "card-body" },
            h2({ class: "my-h2" }, data.title),
            p({ class: "my-p" }, data.description),
            a(
              { class: "my-a", href: data.link, target: "_blank" },
              "View Image"
            )
          )
        )
      )
    )
  );
  block.appendChild(mainDiv);

BlocksSwiper(block.children[1].children[0]);
}

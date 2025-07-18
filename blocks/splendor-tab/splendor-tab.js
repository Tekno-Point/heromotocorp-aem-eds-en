import tab from "../tab/tab.js";
export default async function decorate(block) {
  tab(block); // Assuming this function is defined

  const demo = document.querySelectorAll(".tabs-panel");
  const allDeta = Array.from(demo);

  allDeta.forEach((deta) => {

    Array.from(deta.children).forEach((child) => {
      child.classList.add('tab-slide'); 
    });
  });
}

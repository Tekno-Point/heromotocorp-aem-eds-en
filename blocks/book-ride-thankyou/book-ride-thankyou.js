export default function decorate(block) {
  block.children[0].classList.add('popup-wrapper');
  block.children[0].children[0].classList.add('loader');
  block.children[0].children[1].classList.add('succ-content');
  block.children[0].children[1].querySelector('p').classList.add('succ-img');
}

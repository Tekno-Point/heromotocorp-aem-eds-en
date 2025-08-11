import { loadFragment } from '../fragment/fragment.js';
import {
  buildBlock, decorateBlock, loadBlock, loadCSS,
} from '../../scripts/aem.js';

/*
  This is not a traditional block, so there is no decorate function.
  Instead, links to a /modals/ path are automatically transformed into a modal.
  Other blocks can also use the createModal() and openModal() functions.
*/

export async function createModal(contentNodes, isShareModal) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/modal/modal.css`);
  const dialog = document.createElement('dialog');
  const dialogContent = document.createElement('div');
  dialogContent.classList.add('modal-content');
  // debugger;
  dialogContent.append(...contentNodes);
  dialog.append(dialogContent);

  const closeButton = document.createElement('button');
  closeButton.classList.add('close-button');
  closeButton.setAttribute('aria-label', 'Close');
  closeButton.type = 'button';
  closeButton.innerHTML = '<span class="icon icon-close"></span>';
  closeButton.addEventListener('click', () => dialog.close());
  dialog.prepend(closeButton);

  const block = buildBlock('modal', '');

  function bodyClickHandler(e) {
    e.stopPropagation();
    e.preventDefault();

    if (!e.target.closest('dialog')) {
      isShareModal?.querySelector('dialog')?.remove();
      document.body.removeEventListener('click', bodyClickHandler);
    }
  }

  if (!isShareModal) {
    document.querySelector('main').append(block);
  } else {
    if (!isShareModal.querySelector('dialog')) {
      document.body.addEventListener('click', bodyClickHandler, { once: true });
    }
    const tabBlock = isShareModal?.querySelector('.splendor-tab.block');
    tabBlock?.append(dialog);
    return 1;
  }

  decorateBlock(block);
  await loadBlock(block);

  // close on click outside the dialog
  dialog.addEventListener('click', (e) => {
    const {
      left, right, top, bottom,
    } = dialog.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    block.remove();
  });

  block.innerHTML = '';
  block.append(dialog);

  return {
    block,
    showModal: () => {
      dialog.showModal();
      // reset scroll position
      setTimeout(() => { dialogContent.scrollTop = 0; }, 0);
      document.body.classList.add('modal-open');
    },
  };
}

export async function openModal(fragmentUrl, isShareModal) {
  const path = fragmentUrl.startsWith('http')
    ? new URL(fragmentUrl, window.location).pathname
    : fragmentUrl;

  const fragment = await loadFragment(path);
  const { classList } = fragment.firstElementChild;

  const { block, showModal } = await createModal(fragment.childNodes, isShareModal);
  // console.log(fragment);
  // fragment.querySelector('.section').classList
  block.classList.add(...classList);
  showModal();
}

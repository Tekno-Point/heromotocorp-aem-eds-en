import { traySection, drawerSection } from './compare-components.js';

const compareTray = () => {
  document.body.appendChild(traySection);
};

const compareDrawer = () => {
  document.body.appendChild(drawerSection);
};

const initCompare = () => {
  compareTray();
  compareDrawer();
};

export default initCompare;

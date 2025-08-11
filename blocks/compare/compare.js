export default async function decorate(block) {
  const children = Array.from(block.children);

  children.forEach((child, index) => {
    const className = `compare-child-${index + 1}`;
    child.classList.add(className);

    const innerChildren = Array.from(child.children);

    innerChildren.forEach((innerChild, innerIndex) => {
      // Add both the indexed class and the shared class
      innerChild.classList.add(
        `${className}-inner-${innerIndex + 1}`,
        'compare-child-inner',
      );
    });
  });
}

import { fetchProduct, useDataMapping, pubsub } from "../../scripts/common.js";
import { div, input, label, h4, span, img, i } from "../../scripts/dom-helpers.js";
pubsub.subscribe('fire', decorateProductBanner)

let isDragging = false;
let startX = 0;
let currentFrame = 0;
let accumulated = 0;
const pixelsPerDegree = 1.5;

export async function decorateProductBanner(block, data) {


    block?.querySelector(".middle-sec")?.remove();
    console.log(block, data)
    const { data: { products: { items: [productInfo] } } } = await fetchProduct();
    const { variant_to_colors: variantsData, variants: allVariantsDetails } = productInfo;
    const [dataMapping, setDataMapping] = await useDataMapping();

    const getVariantDetailsBySku = sku =>
        allVariantsDetails.find(variant => variant[sku])?.[sku];

    const updateMainImage = sku => {
        debugger;
        const media = getVariantDetailsBySku(sku);
        const imgEl = block.querySelector('.product-overview__360View .rotate');
        if (media?.product?.media_gallery?.length && imgEl) {
            imgEl.src = media.product.media_gallery[0].url;
        }
    };

    const updateActiveColorSwatch = colorLabel => {
        block.querySelectorAll('.color-option').forEach(option =>
            option.classList.toggle('active', option.querySelector('span').textContent === colorLabel)
        );
    };

    const renderColors = (colors, selectedLabel) => {
        const container = block.querySelector('.colors-container .color-wrapp');
        if (!container) return;

        container.innerHTML = '';

        colors.forEach(({ sku, label: colorLabel, color_swatch_url }) => {
            const option = div({
                class: `color-option ${colorLabel === selectedLabel ? 'active' : ''}`,
                onClick: () => {
                    dataMapping.sku = sku;
                    setDataMapping(dataMapping);
                    // sessionStorage.setItem("dataMapping", JSON.stringify(dataMapping));
                    updateMainImage(sku);
                    updateActiveColorSwatch(colorLabel);
                }
            },
                span(colorLabel),
                img({
                    class: "ms-7",
                    loading: "lazy",
                    src: `https://www.heromotocorp.com${color_swatch_url}`,
                    alt: colorLabel,
                })
            );
            container.append(option);
        });
    };

    const initialVariantGroup = variantsData[0];
    const initialColor = initialVariantGroup.colors[0];
    dataMapping.sku = initialColor.sku;
    setDataMapping(dataMapping);
    // sessionStorage.setItem("dataMapping", JSON.stringify(dataMapping));

    const handleVariantChange = e => {
        const selectedValueIndex = e.target.value;
        block.querySelectorAll('.form-control').forEach(el => el.classList.remove('active'));
        e.target.closest('.form-control').classList.add('active');

        const selectedGroup = variantsData.find(v => v.value_index == selectedValueIndex);
        if (selectedGroup) {
            const { sku, label } = selectedGroup.colors[0];
            dataMapping.sku = sku;
            setDataMapping(dataMapping);
            // sessionStorage.setItem("dataMapping", JSON.stringify(dataMapping));
            updateMainImage(sku);
            renderColors(selectedGroup.colors, label);
        }
    };

    const variantsDOM = div({ class: "product-overview__variantWrapper d-flex justify-content-lg-center order-2 order-lg-0" },
        div({ class: "variants-wrap" },
            h4({ class: "text" }, "Variants"),
            div({ class: "radio-wrap" },
                ...variantsData.map(({ value_index, label: variantLabel, variant_price }) => {
                    const isActive = initialVariantGroup.value_index === value_index;
                    const radioProps = {
                        class: "position-absolute",
                        type: "radio",
                        id: value_index,
                        name: "variants",
                        value: value_index,
                        onChange: handleVariantChange
                    };
                    if (isActive) radioProps.checked = true;

                    return div({ class: `form-control p-1 ${isActive ? "active" : ''}` },
                        div({ class: "mb-12 body text-uppercase weight-heavy" },
                            input(radioProps),
                            label({ for: value_index, class: "d-flex pe-lg-10" }, span(variantLabel)),
                            div({ class: "ps-11 mt-2" }, span(`₹ ${variant_price.toLocaleString('en-IN')}`))
                        )
                    );
                })
            )
        )
    );

    const { product: { media_gallery: [firstImage] } } = getVariantDetailsBySku(initialColor.sku);

    const imageDom = div({ class: "product-overview__360View" },
        div({ class: "hero-360 w-100" },
            div({ class: "rotate-images" }, img({ class: "hero-icon left", src: "/images/rotate-left.png" }), img({ class: "hero-icon right", src: "/images/rotate-right.png" })),
            div({ class: "hero-360" },
                div({ class: "spritespin-stage" },
                    img({ class: "rotate", src: firstImage.url })
                )
            ),
            div({ class: "hero-360__" }),
        )
    );

    const colorsDiv = div({ class: "colors-container" },
        h4({ class: "mb-8 weight" }, "Colours"),
        div({ class: "color-wrapp" })
    );

    block.append(div({ class: "middle-sec" }, variantsDOM, imageDom, colorsDiv));

    renderColors(initialVariantGroup.colors, initialColor.label);

    const mainImage = block.querySelector(".product-overview__360View .rotate");
    mainImage.addEventListener("mousedown", (e) => {
        const media = getVariantDetailsBySku(dataMapping.sku);
        rotateImg(e, "act", media.product.media_gallery, mainImage, false);
    });
    mainImage.addEventListener("touchstart", (e) => {
        const media = getVariantDetailsBySku(dataMapping.sku);
        rotateImg(e.touches[0], "activeIndex", media.product.media_gallery, mainImage, true);
    });

    // Add icon click rotation
    const leftIcon = block.querySelector('.hero-icon.left');
    const rightIcon = block.querySelector('.hero-icon.right');

    if (leftIcon && rightIcon) {
        leftIcon.addEventListener('click', () => {
            const media = getVariantDetailsBySku(dataMapping.sku);
            const rotateUrls = media.product.media_gallery;
            rotateFrame(rotateUrls, mainImage, -1)
        });
        rightIcon.addEventListener('click', () => {
            const media = getVariantDetailsBySku(dataMapping.sku);
            const rotateUrls = media.product.media_gallery;
            rotateFrame(rotateUrls, mainImage, 1)
        }
        );
    }
}


export default async function decorate(block) {
    decorateProductBanner(block);
}

const rotateImg = (event, activeIndex = 0, rotateUrlString, imgEl, isTouch = false) => {
    isDragging = true;
    startX = event.clientX;

    const imgRotateUrls = rotateUrlString;
    const totalFrames = imgRotateUrls.length;
    const degreesPerFrame = 360 / totalFrames;
    const pixelsPerFrame = degreesPerFrame * pixelsPerDegree;

    document.body.style.userSelect = 'none';

    const onMove = (e) => {
        if (!isDragging) return;
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - startX;
        accumulated += deltaX;
        startX = clientX;

        const frameShift = Math.floor(accumulated / pixelsPerFrame);
        if (frameShift !== 0) {
            accumulated -= frameShift * pixelsPerFrame;
            currentFrame = (currentFrame + frameShift + totalFrames) % totalFrames;
            imgEl.src = imgRotateUrls[currentFrame].url;
        }
    };

    const onEnd = () => {
        isDragging = false;
        document.body.style.userSelect = ''; // re-enable selection
        window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
        window.removeEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);
    };

    window.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
    window.addEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);
};

// Helper to shift frame on icon click
const rotateFrame = (rotateUrlString, imgEl, direction = 1) => {
    const imgRotateUrls = rotateUrlString;
    const totalFrames = imgRotateUrls.length;
    currentFrame = (currentFrame + direction + totalFrames) % totalFrames;
    imgEl.src = imgRotateUrls[currentFrame].url;
};



/* const rotateImg = (event, activeIndex = 0, rotateUrlString, imgEl, isTouch = false) => {
    isDragging = true;
    startX = event.clientX;

    // const rotateUrlString = isMobile
    //     ? arrayImagesDet[activeIndex].mob_img_urls
    //     : arrayImagesDet[activeIndex].desk_img_urls;

    const imgRotateUrls = rotateUrlString;
    const totalFrames = imgRotateUrls.length;
    const degreesPerFrame = 360 / totalFrames;
    const pixelsPerFrame = degreesPerFrame * pixelsPerDegree;

    const onMove = (e) => {
        if (!isDragging) return;
        const clientX = isTouch ? e.touches[0].clientX : e.clientX;
        const deltaX = clientX - startX;
        accumulated += deltaX;
        startX = clientX;

        const frameShift = Math.floor(accumulated / pixelsPerFrame);
        if (frameShift !== 0) {
            accumulated -= frameShift * pixelsPerFrame;
            currentFrame = (currentFrame + frameShift + totalFrames) % totalFrames;
            // debugger;
            imgEl.src = imgRotateUrls[currentFrame].url;
        }
    };

    const onEnd = () => {
        isDragging = false;
        window.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
        window.removeEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);
    };

    window.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMove);
    window.addEventListener(isTouch ? 'touchend' : 'mouseup', onEnd);

} */


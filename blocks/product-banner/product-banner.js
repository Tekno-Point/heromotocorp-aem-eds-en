import { fetchProduct, useDataMapping, pubsub } from "../../scripts/common.js";
import { div, input, label, h4, span, img, i } from "../../scripts/dom-helpers.js";
pubsub.subscribe('fire', decorateProductBanner)

export async function decorateProductBanner(block , data) {
    debugger;
    console.log(block , data)
    const { data: { products: { items: [productInfo] } } } = await fetchProduct();
    const { variant_to_colors: variantsData, variants: allVariantsDetails } = productInfo;
    const [dataMapping, setDataMapping] = await useDataMapping();

    const getVariantDetailsBySku = sku =>
        allVariantsDetails.find(variant => variant[sku])?.[sku];

    const updateMainImage = sku => {
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
            div({ class: "hero-360__" }, i({ class: "hero-icon" }), i({ class: "hero-icon right" })),
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

    block.append(div(variantsDOM, imageDom, colorsDiv));

    renderColors(initialVariantGroup.colors, initialColor.label);
}

export default async function decorate(block) {
    decorateProductBanner(block);
}
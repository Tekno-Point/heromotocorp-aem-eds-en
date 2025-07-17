export function block(block) {
    console.log(block);
    const script = document.createElement("script");
    script.type = "application/ld+json",
    script.innerHTML = block.textContent,
    block.innerHTML = "",
    document.head.append(script)
}
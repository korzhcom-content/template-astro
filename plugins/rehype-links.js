import { visit } from "unist-util-visit";

export const rehypeLinks = (options) => {
    let base = options?.base;

    return (ast, file) => {
        if (typeof base !== "string") return;
        if (!base.startsWith("/")) base = "/" + base;
        if (base.length > 1 && base[base.length - 1] === "/")
            base = base.slice(0, -1);

        visit(ast, "element", function (node, index, parent) {
            if (node.tagName === "a") {
                let href = node.properties.href;
                
                if (href.startsWith("http")) {
                    return 
                }
                
                if (!href.startsWith("http")) {
                    if (!href.startsWith("/")) {
                        href = "/" + href;
                        // node.properties.href = href;
                    }
                }
                
                if (
                    typeof href === "string" &&
                    href.startsWith("/") &&
                    !href.startsWith(base)
                ) {
                    node.properties.href = base + href;
                }
            }
        });
    };
};
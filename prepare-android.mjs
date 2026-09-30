import {
    cp,
    mkdir,
    rm,
    access
} from "node:fs/promises";

const root = new URL("./", import.meta.url);
const destination = new URL("./www/", root);

const files = [
    "index.html",
    "style.css",
    "manifest.webmanifest",
    "js",
    "sounds",
    "icons"
];

// Confere os arquivos antes de gerar a cópia.
for (const file of files) {
    await access(new URL(file, root));
}

// A pasta www contém somente arquivos gerados.
await rm(destination, {
    recursive: true,
    force: true
});

await mkdir(destination, {
    recursive: true
});

for (const file of files) {
    await cp(
        new URL(file, root),
        new URL(file, destination),
        { recursive: true }
    );
}

console.log("Arquivos do Android preparados.");
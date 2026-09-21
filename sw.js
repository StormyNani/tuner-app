// Altere este valor a cada atualização publicada.
const VERSION = "1.0.2";

const BASE_URL = new URL("./", self.location.href);

const CACHE_PREFIX =
    "sesi-tuner:" + BASE_URL.pathname + ":";

const CACHE_NAME = CACHE_PREFIX + VERSION;

// Arquivos necessários para usar o aplicativo offline.
const FILES = [
    "index.html",
    "style.css",
    "manifest.webmanifest",

    "js/main.js",
    "js/config.js",
    "js/state.js",
    "js/pitchDetector.js",
    "js/audio.js",
    "js/metronome.js",
    "js/instrumentDiagram.js",
    "js/preferences.js",
    "js/pwa.js",

    "sounds/madeira.wav",
    "sounds/caixa.wav",
    "sounds/prato.wav",
    "sounds/classico.wav",

    "icons/icon-192.png",
    "icons/icon-512.png",
    "icons/apple-touch-icon.png",
    "icons/favicon-rounded.svg"
];

const FILE_URLS = new Set(
    FILES.map(function (file) {
        return new URL(file, BASE_URL).href;
    })
);

// Prepara todos os arquivos antes de aceitar a versão.
self.addEventListener("install", function (event) {
    event.waitUntil(
        (async function () {
            const cache = await caches.open(CACHE_NAME);

            const requests = Array.from(FILE_URLS, function (url) {
                return new Request(url, { cache: "reload" });
            });

            await cache.addAll(requests);
        })()
    );
});

// Remove somente os caches antigos deste aplicativo.
// A ativação aguarda o fechamento das páginas da versão anterior.
self.addEventListener("activate", function (event) {
    event.waitUntil(
        (async function () {
            const names = await caches.keys();

            await Promise.all(
                names
                    .filter(function (name) {
                        return (
                            name.startsWith(CACHE_PREFIX) &&
                            name !== CACHE_NAME
                        );
                    })
                    .map(function (name) {
                        return caches.delete(name);
                    })
            );
        })()
    );
});

// Usa os arquivos da versão instalada.
self.addEventListener("fetch", function (event) {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== BASE_URL.origin) {
        return;
    }

    // Os parâmetros de versão do CSS não alteram o nome do arquivo.
    url.search = "";
    url.hash = "";

    let cacheKey = url.href;

    if (url.pathname === BASE_URL.pathname) {
        cacheKey = new URL("index.html", BASE_URL).href;
    }

    if (!FILE_URLS.has(cacheKey)) {
        return;
    }

    event.respondWith(
        (async function () {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(cacheKey);

            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request);
        })()
    );
});
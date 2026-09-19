const offlineStatus = document.getElementById("offlineStatus");

function showOfflineStatus(message) {
    if (offlineStatus) {
        offlineStatus.textContent = message;
    }
}

async function initializePwa() {
    if (!("serviceWorker" in navigator)) {
        showOfflineStatus(
            "Este navegador não oferece suporte ao modo offline."
        );
        return;
    }

    // Mantém o desenvolvimento pelo Live Server sem cache offline.
    // A instalação será testada no endereço HTTPS do GitHub Pages.
    if (location.protocol !== "https:") {
        showOfflineStatus(
            "O modo offline estará disponível no site publicado."
        );
        return;
    }

    try {
        const workerUrl = new URL("../sw.js", import.meta.url);

        const registration = await navigator.serviceWorker.register(
            workerUrl,
            { updateViaCache: "none" }
        );

        function refreshStatus() {
            if (registration.waiting) {
                showOfflineStatus(
                    "Atualização pronta. Feche o aplicativo e todas " +
                    "as abas dele; depois, abra novamente."
                );
            } else if (registration.active) {
                showOfflineStatus("Disponível para uso offline.");
            } else {
                showOfflineStatus("Preparando o uso offline…");
            }
        }

        function watchWorker(worker) {
            if (!worker) {
                return;
            }

            worker.addEventListener("statechange", function () {
                if (worker.state === "redundant") {
                    showOfflineStatus(
                        "Não foi possível concluir a preparação " +
                        "offline desta versão. Tente novamente com internet."
                    );
                    return;
                }

                refreshStatus();
            });
        }

        watchWorker(registration.installing);

        registration.addEventListener("updatefound", function () {
            watchWorker(registration.installing);
            refreshStatus();
        });

        refreshStatus();

        navigator.serviceWorker.ready.then(function () {
            refreshStatus();
        });
    } catch (error) {
        console.error("Erro ao preparar o modo offline:", error);

        showOfflineStatus(
            "Não foi possível preparar o modo offline. " +
            "Tente novamente com internet."
        );
    }
}

initializePwa();
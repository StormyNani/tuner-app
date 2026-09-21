// INSTALAÇÃO DO APLICATIVO

const installAppGroup = document.getElementById("installAppGroup");
const installAppButton = document.getElementById("installAppButton");
const installAppStatus = document.getElementById("installAppStatus");

const standaloneMode = window.matchMedia(
    "(display-mode: standalone)"
);

let pendingInstallPrompt = null;
let installationInProgress = false;
let installationConfirmed = false;

function isRunningAsApp() {
    return (
        standaloneMode.matches ||
        navigator.standalone === true
    );
}

function showInstallStatus(message) {
    installAppStatus.textContent = message;
    installAppStatus.hidden = !message;
}

function updateInstallButton() {
    installAppGroup.hidden =
        isRunningAsApp() ||
        installationConfirmed ||
        pendingInstallPrompt === null ||
        installationInProgress;
}

window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();

    pendingInstallPrompt = event;
    installationConfirmed = false;

    showInstallStatus("");
    updateInstallButton();
});

installAppButton.addEventListener("click", async function () {
    if (!pendingInstallPrompt || installationInProgress) {
        return;
    }

    const promptEvent = pendingInstallPrompt;

    // Cada evento de instalação só pode ser utilizado uma vez.
    pendingInstallPrompt = null;
    installationInProgress = true;
    installAppButton.disabled = true;

    showInstallStatus("");

    try {
        await promptEvent.prompt();

        const choice = await promptEvent.userChoice;

        if (
            choice.outcome === "accepted" &&
            !installationConfirmed
        ) {
            showInstallStatus(
                "Instalação solicitada. Aguarde a conclusão pelo navegador."
            );
        } else if (
            choice.outcome === "dismissed" &&
            !installationConfirmed
        ) {
            showInstallStatus(
                "Instalação cancelada. Você pode continuar usando o site."
            );
        }
    } catch (error) {
        console.error("Erro ao abrir a instalação:", error);

        if (!installationConfirmed) {
            showInstallStatus(
                "Não foi possível abrir a instalação. " +
                "Verifique também as opções no menu do navegador."
            );
        }
    } finally {
        installationInProgress = false;
        installAppButton.disabled = false;

        updateInstallButton();
    }
});

window.addEventListener("appinstalled", function () {
    installationConfirmed = true;
    pendingInstallPrompt = null;

    showInstallStatus("Aplicativo instalado.");
    updateInstallButton();
});

standaloneMode.addEventListener("change", function () {
    updateInstallButton();

    if (isRunningAsApp()) {
        showInstallStatus("");
    }
});

updateInstallButton();





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
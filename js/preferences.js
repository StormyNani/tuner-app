import {
    appState,
    metronomeState
} from "./state.js";

const KEY = "sesi-tuner.preferences.v1";

let enabled = false;
let ready = false;
let lastSaved = "";


// Validação dos valores armazenados.

const range = (min, max) => value =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max;

const choice = values => value => values.includes(value);

const boolean = value => typeof value === "boolean";

const tunerRules = {
    referenceA4: range(432, 446),
    noteNameStyle: choice(["letters", "solfege"]),
    accidentalStyle: choice(["sharps", "flats"]),
    showTechnicalInfo: boolean,
    referenceSoundEnabled: boolean
};

const metroRules = {
    bpm: value => Number.isSafeInteger(value) && value > 0,

    subdivision: choice([1, 2, 3, 4, 6]),

    volume: range(0, 1),

    soundType: choice([
        "electronic",
        "sine",
        "wood",
        "snare"
    ]),

    timeSignature: value =>
        typeof value === "string" &&
        /^(?:[1-9]|1[0-6])\/(?:1|2|4|8|16|32|64)$/.test(value)
};


function pick(source, rules) {
    const result = {};

    if (!source || typeof source !== "object") {
        return result;
    }

    for (const [key, valid] of Object.entries(rules)) {
        if (valid(source[key])) {
            result[key] = source[key];
        }
    }

    return result;
}


// Restaura somente preferências.
// Microfone, reprodução e timers não são restaurados.

export function loadPreferences() {
    try {
        const data = JSON.parse(localStorage.getItem(KEY));

        if (
            !data ||
            data.version !== 1 ||
            data.enabled !== true
        ) {
            return;
        }

        Object.assign(
            appState,
            pick(data.tuner, tunerRules)
        );

        Object.assign(
            metronomeState,
            pick(data.metronome, metroRules)
        );

        const count = Number(
            metronomeState.timeSignature.split("/")[0]
        );

        metronomeState.beatsPerMeasure = count;

        const strengths = data.metronome?.beatStrengths;

        if (
            Array.isArray(strengths) &&
            strengths.length === count &&
            strengths.every(
                choice(["strong", "medium", "weak", "silent"])
            )
        ) {
            metronomeState.beatStrengths = [...strengths];
        }

        enabled = true;
    } catch (error) {
        console.warn("Preferências não restauradas:", error);
    }
}


// Grava apenas quando o usuário ativou o salvamento.

export function savePreferences() {
    if (!ready || !enabled) {
        return;
    }

    const status = document.getElementById(
        "preferencesStatus"
    );

    try {
        const payload = JSON.stringify({
            version: 1,
            enabled: true,

            tuner: pick(appState, tunerRules),

            metronome: {
                ...pick(metronomeState, metroRules),
                beatStrengths: [...metronomeState.beatStrengths]
            }
        });

        if (payload === lastSaved) {
            return;
        }

        localStorage.setItem(KEY, payload);

        lastSaved = payload;
        status.textContent = "";
    } catch (error) {
        status.textContent =
            "Não foi possível salvar. Confira se o navegador " +
            "permite armazenamento para este site.";
    }
}


// Janela da tela inicial e acompanhamento das alterações.

export function initializeHomeSettings() {
    const open = document.getElementById("openHomeSettings");

    const dialog = document.getElementById(
        "homeSettingsDialog"
    );

    const close = document.getElementById(
        "closeHomeSettings"
    );

    const toggle = document.getElementById(
        "saveDevicePreferences"
    );

    const status = document.getElementById(
        "preferencesStatus"
    );

    const creditsButton = document.getElementById(
        "toggleHomeCredits"
    );

    const credits = document.getElementById("homeCredits");

    ready = true;
    toggle.checked = enabled;

    open.addEventListener("click", () => {
        dialog.showModal();

        document.body.classList.add("settings-open");

        open.setAttribute("aria-expanded", "true");

        close.focus();
    });

    close.addEventListener("click", () => {
        dialog.close();
    });

    dialog.addEventListener("close", () => {
        document.body.classList.remove("settings-open");

        open.setAttribute("aria-expanded", "false");

        open.focus();
    });

    creditsButton.addEventListener("click", () => {
        credits.hidden = !credits.hidden;

        creditsButton.setAttribute(
            "aria-expanded",
            String(!credits.hidden)
        );
    });

    toggle.addEventListener("change", () => {
        enabled = toggle.checked;

        if (enabled) {
            lastSaved = "";
            savePreferences();
        } else {
            try {
                localStorage.removeItem(KEY);

                lastSaved = "";

                status.textContent =
                    "Preferências apagadas. Os ajustes atuais " +
                    "continuam nesta sessão.";
            } catch (error) {
                status.textContent =
                    "Salvamento pausado, mas os dados antigos " +
                    "não puderam ser apagados. Limpe os dados " +
                    "deste site no navegador.";
            }
        }
    });

    // Os controles atualizam o estado antes de o evento
    // chegar ao document. Só gravamos se os valores mudaram.
    for (const name of ["input", "change", "click", "submit"]) {
        document.addEventListener(name, savePreferences);
    }

    window.addEventListener("pagehide", savePreferences);

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            savePreferences();
        }
    });
}
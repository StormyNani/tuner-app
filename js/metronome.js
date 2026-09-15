let updateMeterControls;

import {
    metronomeState
} from "./state.js";

import {
    savePreferences
} from "./preferences.js";


// ELEMENTOS DO METRÃ”NOMO   

const metronomeBpmInput = document.getElementById("metronomeBpm");

const metronomeBpmValue = document.getElementById("metronomeBpmValue");

const decreaseMetronomeBpmButton = document.getElementById("decreaseMetronomeBpm");

const increaseMetronomeBpmButton = document.getElementById("increaseMetronomeBpm");

const metronomeTempoName = document.getElementById("metronomeTempoName");

const toggleMetronomeButton = document.getElementById("toggleMetronome");

const metronomeStatus = document.getElementById("metronomeStatus");

const metronomeBeatsInput = document.getElementById("metronomeBeats");

const metronomeBeatsValue = document.getElementById("metronomeBeatsValue");

const metronomeBeatIndicator = document.getElementById("metronomeBeatIndicator");

const subdivisionButton = document.getElementById("subdivisionButton");

const subdivisionButtonSymbol = document.getElementById("subdivisionButtonSymbol");

const subdivisionButtonName = document.getElementById("subdivisionButtonName");

const subdivisionPanel = document.getElementById("subdivisionPanel");

const subdivisionOptions = document.querySelectorAll("[data-subdivision]");

const timeSignatureButton = document.getElementById("timeSignatureButton");


const timeSignaturePanel = document.getElementById("timeSignaturePanel");


const metronomeRhythmArea = document.getElementById("metronomeRhythmArea");
 
const toggleTapTempoButton = document.getElementById("toggleTapTempo");

const tapTempoPanel = document.getElementById("tapTempoPanel");

const tapTempoButton = document.getElementById("tapTempoButton");

const tapTempoInfo = document.getElementById("tapTempoInfo");

const metronomeElement = document.getElementById("metronome");

const openMetronomeSettingsButton = document.getElementById("openMetronomeSettings");

const metronomeSettingsModal = document.getElementById("metronomeSettingsModal");

const closeMetronomeSettingsButton = document.getElementById("closeMetronomeSettings");

const metronomeVolumeInput = document.getElementById("metronomeVolume");

const metronomeVolumeValue = document.getElementById("metronomeVolumeValue");

let beatIndicators = [];



//CONFIGURAÃ‡Ã•ES INTERNAS

const LOOKAHEAD_MS = 25;

const SCHEDULE_AHEAD_TIME = 0.12;

const METRONOME_START_DELAY = 0.05;

const CLICK_DURATION = 0.05;

const SUBDIVISION_CLICK_DURATION = 0.035;

const SUBDIVISION_FREQUENCY = 650;

const SUBDIVISION_VOLUME_FACTOR = 0.25;

const BPM_MIN = Number(metronomeBpmInput.min);

const BPM_MAX = Number(metronomeBpmInput.max);

const BEATS_MIN = Number(metronomeBeatsInput.min);

const BEATS_MAX = 16;

const BEAT_STRENGTH_ORDER = [
    "strong",
    "medium",
    "weak",
    "silent"
];

const BEAT_STRENGTH_SETTINGS = {
    strong: {
        label: "forte",
        volume: 0.22,
        frequency: 1200
    },

    medium: {
        label: "meio forte",
        volume: 0.14,
        frequency: 1000
    },

    weak: {
        label: "fraco",
        volume: 0.08,
        frequency: 800
    },

    silent: {
        label: "silencioso",
        volume: 0,
        frequency: 0
    }
};





let initialized = false;

let startRequestInProgress = false;

let visualBeatQueue = [];

let scheduledOscillators = [];

let metronomeMasterGain = null;

let metronomeSettingsOpen = false;

let lastMetronomeSettingsFocus = null;

let tapTimes = [];

const TAP_RESET_TIME = 2500;

const TAP_MAX_SAMPLES = 8;





// CLASSIFICAÃ‡ÃƒO DO ANDAMENTO

function getTempoName(bpm) {

    if (bpm < 60) {
        return "Largo";
    }

    if (bpm < 66) {
        return "Larghetto";
    }

    if (bpm < 76) {
        return "Adagio";
    }

    if (bpm < 108) {
        return "Andante";
    }

    if (bpm < 112) {
        return "Moderato";
    }

    if (bpm < 120) {
        return "Allegretto";
    }

    if (bpm < 168) {
        return "Allegro";
    }

    if (bpm < 200) {
        return "Presto";
    }

    return "Prestissimo";
}




// ATUALIZAÃ‡ÃƒO VISUAL DO BPM

function updateMetronomeBpmInterface() {

    metronomeBpmInput.value = String(metronomeState.bpm);

    metronomeBpmValue.textContent = String(metronomeState.bpm);

    metronomeTempoName.textContent = getTempoName(metronomeState.bpm);


    decreaseMetronomeBpmButton.disabled = metronomeState.bpm <= BPM_MIN;

    increaseMetronomeBpmButton.disabled = metronomeState.bpm >= BPM_MAX;


    if (metronomeState.running) {

        metronomeStatus.textContent = "Tocando em " + metronomeState.bpm + " BPM";
    }
}




// ALTERAÃ‡ÃƒO DO BPM

function setMetronomeBpm(newBpm, respectSliderLimits = true) {
    
    const numericBpm = Number(newBpm);

    if (!Number.isFinite(numericBpm)) {
        return;
    }

     let finalBpm = Math.round(numericBpm);


    if (respectSliderLimits) {

        finalBpm = Math.min(BPM_MAX, Math.max(BPM_MIN, finalBpm));
    }

    if (finalBpm <= 0) {

        return;
    }

    metronomeState.bpm = finalBpm;

    updateMetronomeBpmInterface();
}





// PREPARAÃ‡ÃƒO DAS INTENSIDADES

function ensureBeatStrengths(beatCount) {

    const currentBeatStrengths = Array.isArray(metronomeState.beatStrengths) ? metronomeState.beatStrengths : [];

    const nextStrengths = [];

    for (let beatIndex = 0; beatIndex < beatCount; beatIndex++) {
        const existingStrength = currentBeatStrengths[beatIndex];

        if (BEAT_STRENGTH_ORDER.includes(existingStrength)) {
            nextStrengths.push(existingStrength);

        } else {

            nextStrengths.push(beatIndex === 0 ? "strong" : "weak");
        }
    }


    metronomeState.beatStrengths = nextStrengths;
}



// APARENCIA DE UMA BARRA 

function applyBeatStrengthToElement(beatIndicator, beatIndex) {
    const strength = metronomeState.beatStrengths[beatIndex];

    const strengthSettings = BEAT_STRENGTH_SETTINGS[strength];

    BEAT_STRENGTH_ORDER.forEach(function (strengthName) {
        beatIndicator.classList.remove("strength-" + strengthName);
    
    });

    beatIndicator.classList.add("strength-" + strength);

    beatIndicator.dataset.strength = strength;

    beatIndicator.setAttribute("aria-label", "Tempo " + String(beatIndex + 1) + ": " + strengthSettings.label + ". Clique para alterar.");

    beatIndicator.title = "Tempo " + String(beatIndex + 1) + ": " + strengthSettings.label;
}



// ALTERAÃ‡ÃƒO DA INTENSIDADE

function cycleBeatStrength(beatIndex) {
    const currentStrength = metronomeState.beatStrengths[beatIndex];

    const currentIndex = BEAT_STRENGTH_ORDER.indexOf(currentStrength);

    const nextIndex = (currentIndex + 1) % BEAT_STRENGTH_ORDER.length;

    metronomeState.beatStrengths[beatIndex] = BEAT_STRENGTH_ORDER[nextIndex];

    const beatIndicator = beatIndicators[beatIndex];

    if (!beatIndicator) {
        return;

    }

    applyBeatStrengthToElement(beatIndicator, beatIndex);
}




// CRIAÃ‡ÃƒO DAS BARRAS DOS TEMPOS

function renderBeatIndicators() {

    metronomeBeatIndicator.innerHTML = "";

    metronomeBeatIndicator.style.setProperty("--beat-count", String(metronomeState.beatsPerMeasure));

    for (
        
        let beatIndex = 0;
        beatIndex < metronomeState.beatsPerMeasure;
        beatIndex++

    ) {

        const beatIndicator = document.createElement("button");

        beatIndicator.type = "button";
    
        beatIndicator.className = "metronomeBeat";

        beatIndicator.dataset.beatIndex = String(beatIndex);

        beatIndicator.dataset.beatNumber = String(beatIndex + 1);

        applyBeatStrengthToElement(beatIndicator, beatIndex);

        beatIndicator.addEventListener("click", function () {
            cycleBeatStrength(beatIndex);

        });

        metronomeBeatIndicator.appendChild(beatIndicator);

    }

    beatIndicators = Array.from(metronomeBeatIndicator.querySelectorAll(".metronomeBeat"));
}




// REINICIO DO CICLO DO METRONOMO

function restartMetronomeCycle() {

    if (
        !metronomeState.running || metronomeState.audioContext === null
    ) {
        
        return;
    }

    if (metronomeState.schedulerTimerId !== null) {

        clearTimeout(metronomeState.schedulerTimerId);

        metronomeState.schedulerTimerId = null;
    }

    scheduledOscillators.forEach(function (oscillator) {

        try {
            oscillator.stop();

        } catch (error) {

        }

        try {
            oscillator.disconnect();

        } catch (error) {

        }
    });

    scheduledOscillators = [];

    visualBeatQueue = [];

    metronomeState.currentBeat = 0;

    metronomeState.nextBeatTime = metronomeState.audioContext.currentTime + METRONOME_START_DELAY;

    resetBeatIndicators();

    scheduler();
}




// ALTERAÃ‡ÃƒO DA QUANTIDADE DE TEMPOS

function setBeatsPerMeasure(newBeatCount, newStrengths = null) {
    const numericBeatCount = Number(newBeatCount);

    if (!Number.isFinite(numericBeatCount)) {
        return;
    }

    const limitedBeatCount = Math.min(BEATS_MAX, Math.max(BEATS_MIN, Math.round(numericBeatCount)));

    metronomeState.beatsPerMeasure = limitedBeatCount;

    if (Array.isArray(newStrengths)) {
    metronomeState.beatStrengths = newStrengths.slice(0, limitedBeatCount);
    }

    ensureBeatStrengths(limitedBeatCount);

    metronomeBeatsInput.value = String(limitedBeatCount);

    metronomeBeatsValue.textContent = String(limitedBeatCount);

    metronomeBeatIndicator.setAttribute("aria-label", "Indicador de " + limitedBeatCount +
        (limitedBeatCount === 1 ? " tempo" : " tempos"));

    renderBeatIndicators();

    if (metronomeState.running) {
        metronomeStatus.textContent = "Tocando em " + metronomeState.bpm + " BPM â€” " + limitedBeatCount + 
            (limitedBeatCount === 1 ? " tempo" : " tempos");

        restartMetronomeCycle();
    
    } else {

        metronomeStatus.textContent = "";
    }
}




// PAINÃ‰IS RÃTMICOS

function closeRhythmPanels() {

    subdivisionPanel.hidden = true;

    timeSignaturePanel.hidden = true;

    subdivisionButton.setAttribute("aria-expanded", "false");

    timeSignatureButton.setAttribute("aria-expanded", "false");
}



function toggleSubdivisionPanel() {

    const shouldOpen = subdivisionPanel.hidden;

    closeRhythmPanels();

    if (!shouldOpen) {
        return;
    }

    subdivisionPanel.hidden = false;

    subdivisionButton.setAttribute("aria-expanded", "true");
}



function toggleTimeSignaturePanel() {

    const shouldOpen = timeSignaturePanel.hidden;

    closeRhythmPanels();

    if (!shouldOpen) {
        return;
    }

    timeSignaturePanel.hidden = false;

    timeSignatureButton.setAttribute("aria-expanded", "true");
}



function setSubdivision(newSubdivision) {
    const subdivision = Number(newSubdivision);

    if (![1, 2, 3, 4, 6].includes(subdivision)) return;

    metronomeState.subdivision = subdivision;

    const denominator = Number(
        metronomeState.timeSignature.split("/")[1]
    ) || 4;

    subdivisionButtonSymbol.innerHTML = createSubdivisionSymbol(
        subdivision,
        denominator
    );

    subdivisionButtonName.textContent = "";
    subdivisionButtonName.hidden = true;

    subdivisionButton.setAttribute(
        "aria-label",
        `Subdivisão: ${subdivision} ${
            subdivision === 1 ? "marcação" : "marcações"
        } por pulsação. Alterar subdivisão.`
    );

    subdivisionOptions.forEach(function (option) {
        const count = Number(option.dataset.subdivision);
        const selected = count === subdivision;
        const spans = option.querySelectorAll("span");

        if (spans[0]) {
            spans[0].innerHTML = createSubdivisionSymbol(
                count,
                denominator
            );
        }

        if (spans[1]) {
            spans[1].textContent = "";
            spans[1].hidden = true;
        }

        option.setAttribute(
            "aria-label",
            count === 1
                ? "Pulsação sem divisão"
                : `Dividir a pulsação em ${count} partes iguais`
        );

        option.classList.toggle("selected", selected);
        option.setAttribute("aria-pressed", String(selected));
    });

    if (metronomeState.running) {
        restartMetronomeCycle();
    }

    closeRhythmPanels();
}



function getDefaultBeatStrengths(numerator, denominator) {
    const strengths = Array(numerator).fill("weak");

    strengths[0] = "strong";

    // Convenção inicial para compassos compostos.
    // Cada barra representa uma unidade do denominador.
    const compound =
        [6, 9, 12].includes(numerator) &&
        [4, 8, 16, 32, 64].includes(denominator);

    if (compound) {
        const groupCount = numerator / 3;

        for (let group = 1; group < groupCount; group++) {
            const index = group * 3;

            // Binário composto: destaca o segundo grupo
            // em relação às divisões internas.
            if (groupCount === 2) {
                strengths[index] = "medium";
            }

            // Ternário composto: identifica os outros grupos.
            if (groupCount === 3) {
                strengths[index] = "medium";
            }

            // Quaternário composto: acento secundário
            // no início do terceiro grupo.
            if (groupCount === 4 && group === 2) {
                strengths[index] = "medium";
            }
        }

        return strengths;
    }

    // Quaternário simples.
    if (numerator === 4) {
        strengths[2] = "medium";
    }

    return strengths;
}



function setTimeSignature(newTimeSignature) {
    const plan = getMeterPlan(newTimeSignature);

    if (!plan) {
        return;
    }

    metronomeState.timeSignature = plan.signature;

    const strengths = getDefaultBeatStrengths(
        plan.numerator,
        plan.denominator
    );

    setSubdivision(metronomeState.subdivision);

    setBeatsPerMeasure(plan.beats, strengths);

    updateMeterControls(plan);

    closeRhythmPanels();
}



// TAP TEMPO
function toggleTapTempoPanel() {

    const shouldOpen = tapTempoPanel.hidden;

    tapTempoPanel.hidden = !shouldOpen;

    toggleTapTempoButton.setAttribute("aria-expanded", String(shouldOpen));
}



function registerTap() {

    const currentTime = performance.now();

    if (tapTimes.length > 0) {

        const lastTap = tapTimes[tapTimes.length - 1];

        const timeSinceLastTap = currentTime - lastTap;

        if (timeSinceLastTap > TAP_RESET_TIME) {

            tapTimes = [];
        }
    }

    tapTimes.push(currentTime);

    if (tapTimes.length > TAP_MAX_SAMPLES) {
        
        tapTimes.shift();
    }

    if (tapTimes.length < 2) {
        
        tapTempoInfo.textContent = "Continue tocando";
        return;
    }

    let totalInterval = 0;

    for (let index = 1; index < tapTimes.length; index++) {

        totalInterval += tapTimes[index] - tapTimes[index - 1];
    }

    const intervalCount = tapTimes.length - 1;

    const averageInterval = totalInterval / intervalCount;

    const calculatedBpm = 60000 / averageInterval;

    const roundedBpm = Math.round(calculatedBpm);

    setMetronomeBpm(roundedBpm, false);

    tapTempoInfo.textContent = tapTimes.length + (tapTimes.length === 1 ? " toque" : " toques");
}




// CONFIGURAÃ‡Ã•ES DO METRÃ”NOMO

function openMetronomeSettings() {

    if (metronomeSettingsOpen) {
        return;
    }

    metronomeSettingsOpen = true;

    lastMetronomeSettingsFocus = document.activeElement;

    metronomeSettingsModal.hidden = false;

    document.body.classList.add("settings-open");

    metronomeElement.setAttribute("inert", "");

    openMetronomeSettingsButton.setAttribute("aria-expanded", "true");

    requestAnimationFrame(function () {
        
        closeMetronomeSettingsButton.focus();
    });
}




function closeMetronomeSettings() {
    stopMetronomePreview();

    if (!metronomeSettingsOpen) {
        return;
    }

    metronomeSettingsOpen = false;

    metronomeSettingsModal.hidden = true;

    document.body.classList.remove("settings-open");

    metronomeElement.removeAttribute("inert");

    openMetronomeSettingsButton.setAttribute("aria-expanded", "false");

    if (lastMetronomeSettingsFocus instanceof HTMLElement) {

        lastMetronomeSettingsFocus.focus();
    }

    lastMetronomeSettingsFocus = null;
}



function organizeMetronomeControls() {
    const startButton =
        document.getElementById("toggleMetronome");

    const speedControl =
        document.getElementById("metronomeBpmControl");

    const tapArea =
        document.getElementById("tapTempoArea");

    // Aproxima velocidade e Tap Tempo do mostrador de BPM.
    startButton.before(speedControl, tapArea);

    const rhythmControls =
        document.getElementById("metronomeRhythmControls");

    const meterButton =
        document.getElementById("timeSignatureButton");

    const divisionButton =
        document.getElementById("subdivisionButton");

    // Primeiro o compasso, depois sua subdivisão.
    rhythmControls.insertBefore(
        meterButton,
        divisionButton
    );

    const beatsControl =
        document.getElementById("metronomeBeatsControl");

    const rhythmArea =
        document.getElementById("metronomeRhythmArea");

    // Coloca o controle de tempos acima de Compasso e Subdivisão.
    rhythmArea.before(beatsControl);
}




// INICIALIZAÃ‡ÃƒO

export function initializeMetronome() {

    if (initialized) {
        return;
    }

    const initialStrengths = [...metronomeState.beatStrengths];

    initialized = true;

    organizeMetronomeControls();

    initializeMetronomeSounds();

    updateMeterControls = installMeterControls(setTimeSignature);

    setMetronomeBpm(metronomeState.bpm, false);

    setBeatsPerMeasure(metronomeState.beatsPerMeasure);

    setSubdivision(metronomeState.subdivision);

    setTimeSignature(metronomeState.timeSignature);

    if (initialStrengths.length === metronomeState.beatsPerMeasure) {
        metronomeState.beatStrengths = initialStrengths;

        renderBeatIndicators();
    }

    setMetronomeVolume(metronomeState.volume * 100);

    toggleMetronomeButton.disabled = false;



    toggleMetronomeButton.addEventListener("click", function () {

        if (metronomeState.running) {

            stopMetronome();

        } else {

            startMetronome();
        }
    });

    metronomeBpmInput.addEventListener("input", function () {
        
       setMetronomeBpm(metronomeBpmInput.value);
    });

    decreaseMetronomeBpmButton.addEventListener("click", function () {

        setMetronomeBpm(metronomeState.bpm - 1);
    });

    increaseMetronomeBpmButton.addEventListener("click", function () {

        setMetronomeBpm(metronomeState.bpm + 1);
    });

    subdivisionButton.addEventListener("click", function () {

        toggleSubdivisionPanel();
    });

    timeSignatureButton.addEventListener("click", function () { 
        
        toggleTimeSignaturePanel();
    });

    subdivisionOptions.forEach(function (option) {

        option.addEventListener("click", function () {

            setSubdivision(option.dataset.subdivision);
        });
    });



    document.addEventListener("click", function (event) {

        if (metronomeRhythmArea.contains(event.target)) {

            return;
        }
        
        closeRhythmPanels();
    });

    openMetronomeSettingsButton.addEventListener("click", function () {
        openMetronomeSettings();
    });

    closeMetronomeSettingsButton.addEventListener("click", function () {
        closeMetronomeSettings();
    });

    metronomeVolumeInput.addEventListener("input", function () {
        setMetronomeVolume(metronomeVolumeInput.value);
    });

    metronomeSettingsModal.addEventListener("click", function (event) {

        if (event.target === metronomeSettingsModal) {
            closeMetronomeSettings();
        }
    });

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && metronomeSettingsOpen) {
            closeMetronomeSettings();
        }
    });

    toggleTapTempoButton.addEventListener("click", function () { 
        toggleTapTempoPanel();
    });

    tapTempoButton.addEventListener("click", function () {
        registerTap(); 
    });


    resetBeatIndicators();
}




// VOLUME DO METRÃ”NOMO

function setMetronomeVolume(newVolume) {

    const numericVolume = Number(newVolume);

    if (!Number.isFinite(numericVolume)) {

        return;
    }

    const limitedVolume = Math.min(100, Math.max(0, Math.round(numericVolume)));

    metronomeState.volume = limitedVolume / 100;

    metronomeVolumeInput.value = String(limitedVolume);

    metronomeVolumeValue.textContent = limitedVolume + "%";


    if (metronomeMasterGain !== null && metronomeState.audioContext !== null) {

        const currentTime = metronomeState.audioContext.currentTime;

        metronomeMasterGain.gain.cancelScheduledValues(currentTime);

        metronomeMasterGain.gain.setTargetAtTime(metronomeState.volume, currentTime, 0.015);
    }
}




// AUDIO CONTEXT

function ensureMetronomeMasterGain(
    audioContext
) {

    if (metronomeMasterGain !== null && metronomeMasterGain.context === audioContext) {

        return;
    }

    metronomeMasterGain = audioContext.createGain();

    metronomeMasterGain.gain.setValueAtTime(metronomeState.volume, audioContext.currentTime);

    metronomeMasterGain.connect(audioContext.destination);
}



async function getMetronomeAudioContext() {

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {

        throw new Error("A Web Audio API nÃ£o Ã© suportada neste navegador");
    }

    if (metronomeState.audioContext === null || metronomeState.audioContext.state === "closed") {

        metronomeState.audioContext = new AudioContextClass();
    }

    if (metronomeState.audioContext.state === "suspended") {

        await metronomeState.audioContext.resume();
    }

    ensureMetronomeMasterGain(metronomeState.audioContext);

    return metronomeState.audioContext;
}




// SOM DO CLIQUE
/*
Créditos dos sons — CC0 1.0

Madeira:
Woodblock-hard.wav — hollandm
https://freesound.org/people/hollandm/sounds/692818/

Caixa:
Snare 1.wav — RutgerMuller
https://freesound.org/people/RutgerMuller/sounds/50759/

Licença:
https://creativecommons.org/publicdomain/zero/1.0/

Reprodução com ajustes de volume, duração e,
no acento forte da Madeira, altura.
*/

const METRONOME_SOUNDS = {
    electronic: {
        label: "Eletrônico",
        file: null,
        wave: "square",
        gain: 1
    },

    sine: {
        label: "Senoide",
        file: null,
        wave: "sine",
        gain: 1.35
    },

    wood: {
        label: "Madeira",
        file: "madeira.wav",
        gain: 1.3
    },

    snare: {
        label: "Caixa",
        file: "caixa.wav",
        gain: 1.4
    },

    cymbal: {
    label: "Prato",
    file: "prato.wav",
    gain: 1
}
};

const metronomeSampleCache = new Map();

const metronomePreviewNodes = new Set();

let metronomeSoundRequestId = 0;

let activeMetronomeSample = null;

let metronomeCymbalSample = null;

// Um semitom abaixo da gravação original.
const CYMBAL_PLAYBACK_RATE = 2 ** (-1 / 12);

// Ponto de partida para equilibrar o prato com a caixa.
const CYMBAL_GAIN = 1;


// CANCELAMENTO DA PRÉVIA

function stopMetronomePreview() {
    metronomeSoundRequestId++;

    metronomePreviewNodes.forEach(function (node) {
        try {
            node.stop();
        } catch (error) {
        }
    });

    metronomePreviewNodes.clear();

    document.getElementById(
        "metronomeSoundStatus"
    ).textContent = "";
}


// CARREGAMENTO DOS ÁUDIOS
async function loadMetronomeSample(soundType, audioContext) {
    const sound = METRONOME_SOUNDS[soundType];

    if (!sound) {
        throw new Error("Som desconhecido.");
    }

    if (!sound.file) {
        return null;
    }

    if (!metronomeSampleCache.has(soundType)) {
        const loading = (async function () {
            const url = new URL(
                "../sounds/" + sound.file,
                import.meta.url
            );

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    "Não foi possível carregar " + sound.file
                );
            }

            const data = await response.arrayBuffer();

            return await audioContext.decodeAudioData(data);
        })();

        metronomeSampleCache.set(soundType, loading);
    }

    let buffer;

    try {
        buffer = await metronomeSampleCache.get(soundType);
    } catch (error) {
        metronomeSampleCache.delete(soundType);
        throw error;
    }

    if (soundType === "snare") {
        metronomeCymbalSample = await loadMetronomeSample(
            "cymbal",
            audioContext
        );
    }

    return buffer;
}


// SELEÇÃO VISUAL

function updateMetronomeSoundButtons() {
    document.querySelectorAll(
        "[data-metronome-sound]"
    ).forEach(function (button) {
        const selected =
            button.dataset.metronomeSound ===
            metronomeState.soundType;

        button.setAttribute(
            "aria-pressed",
            String(selected)
        );
    });
}


// EVENTOS DAS OPÇÕES DE SOM

function initializeMetronomeSounds() {
    updateMetronomeSoundButtons();

    document.querySelectorAll(
        "[data-metronome-sound]"
    ).forEach(function (button) {
        button.addEventListener("click", async function () {
            const soundType = button.dataset.metronomeSound;

            if (!Object.prototype.hasOwnProperty.call(
                METRONOME_SOUNDS,
                soundType
            )) {
                return;
            }

            stopMetronome();

            const requestId = metronomeSoundRequestId;

            const status = document.getElementById(
                "metronomeSoundStatus"
            );

            status.textContent = "Carregando som…";

            try {
                const audioContext =
                    await getMetronomeAudioContext();

                if (requestId !== metronomeSoundRequestId) {
                    return;
                }

                const buffer = await loadMetronomeSample(
                    soundType,
                    audioContext
                );

                if (
                    requestId !== metronomeSoundRequestId ||
                    !metronomeSettingsOpen
                ) {
                    return;
                }

                activeMetronomeSample = buffer;

                metronomeState.soundType = soundType;

                savePreferences();

                updateMetronomeSoundButtons();

                status.textContent = "";

                const startTime =
                    audioContext.currentTime + 0.05;

                ["strong", "medium", "weak"].forEach(
                    function (strength, index) {
                        const settings =
                            BEAT_STRENGTH_SETTINGS[strength];

                            scheduleTone(
                                settings.frequency,
                                settings.volume,
                                startTime + index * 0.45,
                                CLICK_DURATION,
                                true,
                                strength
                            );
                    }
                );
            } catch (error) {
                if (requestId !== metronomeSoundRequestId) {
                    return;
                }

                console.error(
                    "Erro ao carregar som:",
                    error
                );

                status.textContent =
                    "Não foi possível carregar o som. " +
                    "Confira os arquivos na pasta sounds.";
            }
        });
    });
}


// REPRODUÇÃO DAS BATIDAS E DA PRÉVIA
function scheduleTone(
    frequency,
    volume,
    scheduledTime,
    duration,
    preview = false,
    strength = "weak"
) {
    const audioContext = metronomeState.audioContext;

    if (
        !audioContext ||
        (!preview && !metronomeState.running) ||
        volume <= 0
    ) {
        return;
    }

    const sound = METRONOME_SOUNDS[metronomeState.soundType];

    if (!sound || (sound.file && !activeMetronomeSample)) {
        return;
    }

    const isSubdivision =
        duration === SUBDIVISION_CLICK_DURATION;

    const isStrong =
        strength === "strong" && !isSubdivision;

    const gain = audioContext.createGain();

    let source;
    let playbackDuration;

    if (sound.file) {
        if (!activeMetronomeSample) {
            return;
        }

        const subdivisionClick =
            duration === SUBDIVISION_CLICK_DURATION;

        const strongClick =
            !subdivisionClick &&
            frequency === BEAT_STRENGTH_SETTINGS.strong.frequency;

        const useCymbal =
            metronomeState.soundType === "snare" &&
            strongClick &&
            metronomeCymbalSample !== null;

        source = audioContext.createBufferSource();

        source.buffer = useCymbal
            ? metronomeCymbalSample
            : activeMetronomeSample;

        const playbackRate = useCymbal
            ? CYMBAL_PLAYBACK_RATE
            : 1;

        source.playbackRate.setValueAtTime(
            playbackRate,
            scheduledTime
        );

        const naturalDuration =
            source.buffer.duration / playbackRate;

        // O prato ganha mais espaço para soar.
        // Em andamentos rápidos, termina antes da próxima pulsação.
        const maximumDuration = useCymbal
            ? Math.min(0.35, (60 / metronomeState.bpm) * 0.8)
            : subdivisionClick
                ? 0.08
                : 0.18;

        playbackDuration = Math.min(
            naturalDuration,
            maximumDuration
        );

        const woodAccent =
            metronomeState.soundType === "wood" && strongClick
                ? 1.2
                : 1;

        const level = useCymbal
            ? volume * CYMBAL_GAIN
            : volume * sound.gain * woodAccent;

        const fadeDuration = Math.min(
            useCymbal ? 0.12 : 0.02,
            playbackDuration
        );

        gain.gain.setValueAtTime(
            level,
            scheduledTime
        );

        gain.gain.setValueAtTime(
            level,
            scheduledTime + playbackDuration - fadeDuration
        );

        gain.gain.linearRampToValueAtTime(
            0,
            scheduledTime + playbackDuration
        );

    } else {

        source = audioContext.createOscillator();
        source.type = sound.wave;

        const isSine = sound.wave === "sine";

        // A senoide usa uma região menos aguda.
        const toneFrequency = isSine
            ? frequency * 0.75
            : frequency;

        source.frequency.setValueAtTime(
            toneFrequency,
            scheduledTime
        );

        const toneDuration = isSine
            ? (isSubdivision ? 0.045 : 0.085)
            : duration;

        const attackDuration = isSine ? 0.004 : 0.002;

        const level = volume * sound.gain;

        playbackDuration = toneDuration + 0.01;

        gain.gain.setValueAtTime(
            0.0001,
            scheduledTime
        );

        gain.gain.exponentialRampToValueAtTime(
            level,
            scheduledTime + attackDuration
        );

        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            scheduledTime + toneDuration
        );
    }

    source.connect(gain);
    gain.connect(metronomeMasterGain);

    if (preview) {
        metronomePreviewNodes.add(source);
    } else {
        scheduledOscillators.push(source);
    }

    source.onended = function () {
        metronomePreviewNodes.delete(source);

        scheduledOscillators =
            scheduledOscillators.filter(function (node) {
                return node !== source;
            });

        source.disconnect();
        gain.disconnect();
    };

    source.start(scheduledTime);

    source.stop(
        scheduledTime + playbackDuration
    );
}




function scheduleClick(beatIndex, scheduledTime) {

    const audioContext = metronomeState.audioContext;

    if (audioContext === null || !metronomeState.running) {

        return;
    }

    const strength = metronomeState.beatStrengths[beatIndex] || "weak";

    const strengthSettings = BEAT_STRENGTH_SETTINGS[strength];

    visualBeatQueue.push({

        beatIndex: beatIndex,

        scheduledTime: scheduledTime
    });

    if (strength === "silent" || !strengthSettings) {

        return;
    }

    scheduleTone(
        strengthSettings.frequency,
        strengthSettings.volume,
        scheduledTime,
        CLICK_DURATION,
        false,
        strength
    );

    const subdivision = Number(metronomeState.subdivision) || 1;

    if (subdivision <= 1) {

        return;
    }

    const secondsPerBeat = 60 / metronomeState.bpm;

    const subdivisionInterval = secondsPerBeat / subdivision;

    const subdivisionVolume = strengthSettings.volume * SUBDIVISION_VOLUME_FACTOR;

    for (
        
        let subdivisionIndex = 1;
        
        subdivisionIndex < subdivision; 
        
        subdivisionIndex++) 
    
    {

    const subdivisionTime = scheduledTime + (subdivisionInterval * subdivisionIndex);

        scheduleTone(SUBDIVISION_FREQUENCY, subdivisionVolume, subdivisionTime, SUBDIVISION_CLICK_DURATION);
    
    }
}




//AGENDAMENTO DOS TEMPOS

function scheduler() {

    if (!metronomeState.running || metronomeState.audioContext === null) {

        return;
    }

    const audioContext = metronomeState.audioContext;

    while (
        metronomeState.nextBeatTime <
        audioContext.currentTime +
        SCHEDULE_AHEAD_TIME
    ) {

        scheduleClick(metronomeState.currentBeat, metronomeState.nextBeatTime);
    

        const secondsPerBeat = 60 / metronomeState.bpm;

        metronomeState.nextBeatTime += secondsPerBeat;

        metronomeState.currentBeat = (metronomeState.currentBeat + 1) % metronomeState.beatsPerMeasure; 
    }

    metronomeState.schedulerTimerId = window.setTimeout(scheduler, LOOKAHEAD_MS);
}




// INDICADORES VISUAIS 

function updateBeatAnimation() {

    if (!metronomeState.running || metronomeState.audioContext === null) {

        return;
    }

    const currentAudioTime = metronomeState.audioContext.currentTime;

    while (

        visualBeatQueue.length > 0 &&
        visualBeatQueue[0].scheduledTime <= currentAudioTime + 0.01
    ) {

        const visualBeat = visualBeatQueue.shift();

        showActiveBeat(visualBeat.beatIndex);
    }

    metronomeState.animationFrameId = requestAnimationFrame(updateBeatAnimation);
}




function showActiveBeat(beatIndex) {

    beatIndicators.forEach(function (indicator) {

        indicator.classList.remove("active");

    });

    const activeIndicator = beatIndicators[beatIndex];

    if (!activeIndicator) {

        return;
    }

    activeIndicator.classList.add("active");

}




function resetBeatIndicators() {

    beatIndicators.forEach(function (indicator) {

        indicator.classList.remove("active");

    });
}





// INICIAR O METRÃ”NONO

async function startMetronome() {
    if (
        metronomeState.running ||
        startRequestInProgress
    ) {
        return;
    }

    startRequestInProgress = true;

    stopMetronomePreview();

    const requestId = metronomeSoundRequestId;

    try {
        const audioContext =
            await getMetronomeAudioContext();

        if (requestId !== metronomeSoundRequestId) {
            return;
        }

        const buffer = await loadMetronomeSample(
            metronomeState.soundType,
            audioContext
        );

        if (requestId !== metronomeSoundRequestId) {
            return;
        }

        activeMetronomeSample = buffer;

        metronomeState.running = true;

        metronomeState.currentBeat = 0;

        metronomeState.nextBeatTime =
            audioContext.currentTime +
            METRONOME_START_DELAY;

        visualBeatQueue = [];

        toggleMetronomeButton.textContent = "Parar";

        toggleMetronomeButton.setAttribute(
            "aria-pressed",
            "true"
        );

        toggleMetronomeButton.classList.add("active");

        metronomeStatus.textContent = "";

        scheduler();

        updateBeatAnimation();
    } catch (error) {
        if (requestId !== metronomeSoundRequestId) {
            return;
        }

        console.error(
            "Erro ao iniciar o metrônomo:",
            error
        );

        stopMetronome();

        metronomeStatus.textContent =
            "Não foi possível iniciar o áudio. " +
            "Confira o som selecionado.";
    } finally {
        startRequestInProgress = false;
    }
}




// PARAR O METRÃ”NOMO

export function stopMetronome() {
    stopMetronomePreview();

    metronomeState.running = false;

    if (metronomeState.schedulerTimerId !== null) {

        clearTimeout(metronomeState.schedulerTimerId);

        metronomeState.schedulerTimerId = null;
    }

    if (metronomeState.animationFrameId !== null) {

        cancelAnimationFrame(metronomeState.animationFrameId);

        metronomeState.animationFrameId = null;
    }

    scheduledOscillators.forEach(function (oscillator) {

        try {

            oscillator.stop();
        } catch (error) {
        
        }
    });

    scheduledOscillators = [];

    visualBeatQueue = [];

    metronomeState.currentBeat = 0;

    metronomeState.nextBeatTime = 0;

    toggleMetronomeButton.textContent = "Iniciar";

    toggleMetronomeButton.setAttribute("aria-pressed", "false");

    toggleMetronomeButton.classList.remove("active");

    metronomeStatus.textContent = "";

    resetBeatIndicators();
}


function getMeterPlan(signature) {
    if (!/^\d+\/\d+$/.test(signature)) {
        return null;
    }

    const [numerator, denominator] =
        signature.split("/").map(Number);

    if (
        numerator < 1 ||
        numerator > 16 ||
        ![1, 2, 4, 8, 16, 32, 64].includes(denominator)
    ) {
        return null;
    }

    return {
        signature: `${numerator}/${denominator}`,
        numerator,
        denominator,
        beats: numerator,
        note: denominator
    };
}


function installMeterControls(onApply) {
    const options = document.getElementById("timeSignatureOptions");

    const buttonValue = document.getElementById(
        "timeSignatureButtonValue"
    );

    const buttons = options.querySelectorAll("[data-time-signature]");

    const subtitle = document.querySelector(
        "#timeSignatureButton small"
    );

    const slider = document.getElementById("metronomeBeats");

    const names = {
        1: "Semibreve",
        2: "Mínima",
        4: "Semínima",
        8: "Colcheia",
        16: "Semicolcheia",
        32: "Fusa",
        64: "Semifusa"
    };

    // Botão dentro do painel que já existe.
    const openButton = document.createElement("button");

    openButton.type = "button";
    openButton.className =
        "metronomeRhythmOption customMeterOpenButton";

    openButton.textContent = "Personalizado";
    openButton.setAttribute("aria-haspopup", "dialog");
    openButton.setAttribute("aria-controls", "customMeterDialog");

    options.after(openButton);

    // Janela com o acabamento das configurações.
    const dialog = document.createElement("dialog");

    dialog.id = "customMeterDialog";
    dialog.className = "settingsDialog customMeterDialog";

    dialog.setAttribute(
        "aria-labelledby",
        "customMeterTitle"
    );

    dialog.innerHTML = `
        <div class="settingsHeader">
            <h2 id="customMeterTitle">Compasso personalizado</h2>

            <button
                type="button"
                class="closeSettingsButton"
                aria-label="Fechar compasso personalizado"
            >×</button>
        </div>

        <form class="settingsContent">
            <div class="customMeterLayout">

                <div class="customMeterPreview">
                    <span class="customMeterPreviewLabel">
                        Prévia
                    </span>

                    <div
                        class="customMeterFraction"
                        aria-hidden="true"
                    >
                        <span data-preview-top>4</span>
                        <span data-preview-bottom>4</span>
                    </div>
                </div>

                <div class="customMeterFields">
                    <label>
                        Numerador

                        <input
                            name="numerator"
                            type="number"
                            min="1"
                            max="16"
                            step="1"
                            value="4"
                            required
                            inputmode="numeric"
                        >
                    </label>

                    <fieldset class="customMeterDenominators">
                        <legend>Denominador</legend>

                        <div class="customMeterNoteOptions">
                            ${[1, 2, 4, 8, 16, 32, 64].map(n => `
                                <label class="customMeterNoteChoice">
                                    <input
                                        type="radio"
                                        name="denominator"
                                        value="${n}"
                                        ${n === 4 ? "checked" : ""}
                                        aria-label="${n} — ${names[n]}"
                                        required
                                    >

                                    <span class="customMeterNoteFace" aria-hidden="true">
                                        <span>${n}</span>
                                        ${createSubdivisionSymbol(1, n)}
                                    </span>
                                </label>
                            `).join("")}
                        </div>
                    </fieldset>
                </div>
            </div>

            <p
                class="metronomeSettingHelp"
                data-preview-description
                aria-live="polite"
            ></p>

            <div class="customMeterActions">
                <button type="submit">Aplicar</button>

                <button
                    type="button"
                    class="customMeterCancel"
                >Cancelar</button>
            </div>
        </form>
    `;

    document.body.appendChild(dialog);

    const form = dialog.querySelector("form");

    const top = form.elements.namedItem("numerator");
    const bottom = form.elements.namedItem("denominator");

    const previewTop = dialog.querySelector("[data-preview-top]");
    const previewBottom = dialog.querySelector("[data-preview-bottom]");
    const help = dialog.querySelector("[data-preview-description]");

    const closeButton = dialog.querySelector(".closeSettingsButton");
    const cancelButton = dialog.querySelector(".customMeterCancel");

    function preview() {
        const plan = getMeterPlan(`${top.value}/${bottom.value}`);

        previewTop.textContent = plan ? plan.numerator : "–";
        previewBottom.textContent = bottom.value;

        // Só aparece uma mensagem quando o valor é inválido.
        help.hidden = Boolean(plan);

        help.textContent = plan
            ? ""
            : "Informe um número inteiro de 1 a 16.";
    }

    function closeDialog() {
        if (dialog.open) {
            dialog.close();
        }
    }

    openButton.addEventListener("click", function () {
        // Sempre abre com o compasso aplicado atualmente.
        const plan = getMeterPlan(metronomeState.timeSignature);

        top.value = plan ? plan.numerator : 4;
        bottom.value = plan ? plan.denominator : 4;

        preview();

        dialog.showModal();
        closeButton.focus();
    });

    closeButton.addEventListener("click", closeDialog);
    cancelButton.addEventListener("click", closeDialog);

    form.addEventListener("input", preview);
    form.addEventListener("change", preview);

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        if (!form.reportValidity()) return;

        const plan = getMeterPlan(`${top.value}/${bottom.value}`);

        if (!plan) return;

        // Fecha primeiro para devolver o foco ao botão visível.
        closeDialog();

        onApply(plan.signature);

        // A aplicação fecha o painel de opções.
        document.getElementById("timeSignatureButton").focus();
    });

    // Os botões prontos continuam funcionando como antes.
    buttons.forEach(function (button) {
        button.addEventListener("click", function () {
            onApply(button.dataset.timeSignature);
        });
    });

    slider.max = "16";

    document.querySelector(
        'label[for="metronomeBeats"]'
    ).textContent = "Numerador";

    document.querySelector(
        "#metronomeBeatsLimits span:last-child"
    ).textContent = "16";

    slider.addEventListener("input", function () {
        const denominator =
            metronomeState.timeSignature.split("/")[1];

        onApply(`${slider.value}/${denominator}`);
    });

    return function (plan) {
        slider.value = plan.numerator;

        document.getElementById(
            "metronomeBeatsValue"
        ).textContent = plan.numerator;

        buttonValue.textContent = plan.signature;
        subtitle.textContent = "";
        subtitle.hidden = true;

        buttons.forEach(function (button) {
            const selected =
                button.dataset.timeSignature === plan.signature;

            button.classList.toggle("selected", selected);
            button.setAttribute("aria-pressed", String(selected));
        });
    };
}



function createSubdivisionSymbol(count, denominator) {
    const factor = count === 3 ? 2 : count === 6 ? 4 : count;
    const noteValue = denominator * factor;

    const beams = Math.max(0, Math.log2(noteValue) - 2);
    const hollow = noteValue <= 2;
    const whole = noteValue === 1;
    const tuplet = count === 3 || count === 6;

    const spacing = 20;
    const width = count === 1
        ? 44
        : (count - 1) * spacing + 32;

    const firstX = count === 1 ? 17 : 12;
    const headY = 60;
    const stemTop = 10;

    let drawing = "";

    for (let index = 0; index < count; index++) {
        const x = firstX + index * spacing;

        // Traço horizontal da semibreve.
        if (whole) {
            drawing += `
                <path
                    d="M${x - 12} ${headY} H${x + 12}"
                    stroke="currentColor"
                    stroke-width="1.4"
                />
            `;
        }

        drawing += `
            <ellipse
                cx="${x}"
                cy="${headY}"
                rx="${whole ? 8 : 6}"
                ry="${whole ? 4.5 : 4}"
                transform="rotate(${whole ? 0 : -18} ${x} ${headY})"
                fill="${hollow ? "none" : "currentColor"}"
                stroke="currentColor"
                stroke-width="${hollow ? 2 : 1.5}"
            />
        `;

        if (!whole) {
            drawing += `
                <path
                    d="M${x + 5} ${headY - 1} V${stemTop}"
                    stroke="currentColor"
                    stroke-width="2"
                />
            `;
        }
    }

    // Mais espaço entre as barras e as bandeirolas.
    for (let beam = 0; beam < beams; beam++) {
        const y = stemTop + beam * 7;
        const stemX = firstX + 5;

        if (count > 1) {
            drawing += `
                <path
                    d="M${stemX} ${y}
                       H${stemX + (count - 1) * spacing}"
                    stroke="currentColor"
                    stroke-width="3"
                />
            `;
        } else {
            drawing += `
                <path
                    d="M${stemX} ${y}
                       C${stemX + 4} ${y + 3},
                        ${stemX + 14} ${y + 4},
                        ${stemX + 12} ${y + 12}
                       C${stemX + 10} ${y + 7},
                        ${stemX + 4} ${y + 7},
                        ${stemX} ${y + 5} Z"
                    fill="currentColor"
                />
            `;
        }
    }

    if (tuplet) {
        drawing += `
            <path
                d="M5 3 V-1 H${width - 5} V3"
                fill="none"
                stroke="currentColor"
                stroke-width="1.2"
            />

            <text
                x="${width / 2}"
                y="-4"
                text-anchor="middle"
                font-family="Arial, sans-serif"
                font-size="11"
                font-weight="bold"
                fill="currentColor"
            >${count}</text>
        `;
    }

    // Centraliza a área realmente desenhada.
    // A semibreve não tem haste; as quiálteras têm número acima.
    const offsetY = whole ? -22 : tuplet ? 13 : 0;

    return `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -4 ${width} 84"
            width="${width}"
            height="64"
            style="display:block;max-width:100%;margin:auto"
            aria-hidden="true"
            focusable="false"
        >
            <g transform="translate(0 ${offsetY})">
                ${drawing}
            </g>
        </svg>
    `;
}
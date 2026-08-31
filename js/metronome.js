import {
    metronomeState
} from "./state.js";




// ELEMENTOS DO METRÔNOMO   

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

const timeSignatureButtonValue = document.getElementById("timeSignatureButtonValue");

const timeSignaturePanel = document.getElementById("timeSignaturePanel");

const timeSignatureOptions = document.querySelectorAll("[data-time-signature]");

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



//CONFIGURAÇÕES INTERNAS

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

const BEATS_MAX = Number(metronomeBeatsInput.max)

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


const SUBDIVISION_SETTINGS = {
    1: {
        symbol: "♩",
        name: "Semínima"
    },

    2: {
        symbol: "♫",
        name: "Colcheias"
    },

    3: {
        symbol: "3",
        name: "Tercinas"
    },

    4: {
        symbol: "♬",
        name: "Semicolcheias"
    },

    6: {
        symbol: "6",
        name: "Sextinas"
    }
};


const TIME_SIGNATURE_SETTINGS = {

    "1/4": {
        beats: 1,

        strengths: [
            "strong"
        ]
    },


    "2/4": {
        beats: 2,

        strengths: [
            "strong",
            "weak"
        ]
    },


    "3/4": {
        beats: 3,

        strengths: [
            "strong",
            "weak",
            "weak"
        ]
    },


    "4/4": {
        beats: 4,

        strengths: [
            "strong",
            "weak",
            "medium",
            "weak"
        ]
    },


    "5/4": {
        beats: 5,

        strengths: [
            "strong",
            "weak",
            "weak",
            "medium",
            "weak"
        ]
    },


    "6/4": {
        beats: 6,

        strengths: [
            "strong",
            "weak",
            "weak",
            "medium",
            "weak",
            "weak"
        ]
    },


    "3/8": {
        beats: 3,

        strengths: [
            "strong",
            "weak",
            "weak"
        ]
    },


    "5/8": {
        beats: 5,

        strengths: [
            "strong",
            "weak",
            "weak",
            "medium",
            "weak"
        ]
    },


    "6/8": {
        beats: 6,

        strengths: [
            "strong",
            "weak",
            "weak",
            "medium",
            "weak",
            "weak"
        ]
    },


    "7/8": {
        beats: 7,

        strengths: [
            "strong",
            "weak",
            "medium",
            "weak",
            "medium",
            "weak",
            "weak"
        ]
    },


    "9/8": {
        beats: 9,

        strengths: [
            "strong",
            "weak",
            "weak",

            "medium",
            "weak",
            "weak",

            "medium",
            "weak",
            "weak"
        ]
    },


    "12/8": {
        beats: 12,

        strengths: [
            "strong",
            "weak",
            "weak",

            "medium",
            "weak",
            "weak",

            "medium",
            "weak",
            "weak",

            "medium",
            "weak",
            "weak"
        ]
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





// CLASSIFICAÇÃO DO ANDAMENTO

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




// ATUALIZAÇÃO VISUAL DO BPM

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




// ALTERAÇÃO DO BPM

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





// PREPARAÇÃO DAS INTENSIDADES

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



// ALTERAÇÃO DA INTENSIDADE

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




// CRIAÇÃO DAS BARRAS DOS TEMPOS

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




// ALTERAÇÃO DA QUANTIDADE DE TEMPOS

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
        metronomeStatus.textContent = "Tocando em " + metronomeState.bpm + " BPM — " + limitedBeatCount + 
            (limitedBeatCount === 1 ? " tempo" : " tempos");

        restartMetronomeCycle();
    
    } else {

        metronomeStatus.textContent = "Tempos: " + limitedBeatCount;
    }
}




// PAINÉIS RÍTMICOS

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

    const settings = SUBDIVISION_SETTINGS[subdivision];

    if (!settings) {
        return;
    }

    metronomeState.subdivision = subdivision;

    subdivisionButtonSymbol.textContent = settings.symbol;

    subdivisionButtonName.textContent = settings.name;


    subdivisionOptions.forEach(function (option) {

            const isSelected = Number(option.dataset.subdivision) === subdivision;

            option.classList.toggle("selected", isSelected);


            option.setAttribute("aria-pressed", String(isSelected));
        }
    );

    if (metronomeState.running) {

        restartMetronomeCycle();
    }

    closeRhythmPanels();
}



function setTimeSignature(newTimeSignature) {

    const settings = TIME_SIGNATURE_SETTINGS[newTimeSignature];

    if (!settings) {
        return;
    }

    metronomeState.timeSignature = newTimeSignature;

    timeSignatureButtonValue.textContent = newTimeSignature;

    timeSignatureOptions.forEach(function (option) {

        const isSelected = option.dataset.timeSignature === newTimeSignature;

        option.classList.toggle("selected", isSelected);

        option.setAttribute("aria-pressed", String(isSelected));
        
    });

    setBeatsPerMeasure(settings.beats, settings.strengths);


    closeRhythmPanels();
}



function setCustomTimeSignature() {

    metronomeState.timeSignature = "custom";


    timeSignatureButtonValue.textContent = "Livre";


    timeSignatureOptions.forEach(function (option) {

        option.classList.remove("selected");

        option.setAttribute("aria-pressed", "false");

    });
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




// CONFIGURAÇÕES DO METRÔNOMO

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




// INICIALIZAÇÃO

export function initializeMetronome() {

    if (initialized) {
        return;
    }

    initialized = true;

    setMetronomeBpm(metronomeState.bpm);

    setBeatsPerMeasure(metronomeState.beatsPerMeasure);

    setSubdivision(metronomeState.subdivision);

    setTimeSignature(metronomeState.timeSignature);

    setMetronomeVolume(metronomeState.volume * 100);

    toggleMetronomeButton.disabled = false;

    metronomeBeatsInput.addEventListener("input", function () {

        setCustomTimeSignature();

        setBeatsPerMeasure(metronomeBeatsInput.value);
        
    });

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

    timeSignatureOptions.forEach(function (option) {

        option.addEventListener("click", function () {

            setTimeSignature(option.dataset.timeSignature);
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




// VOLUME DO METRÔNOMO

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

        throw new Error("A Web Audio API não é suportada neste navegador");
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

function scheduleTone(frequency, volume, scheduledTime, duration) {

    const audioContext = metronomeState.audioContext;

    if (audioContext === null || !metronomeState.running) {
        
        return;
    }

    const oscillator = audioContext.createOscillator();

    const gain = audioContext.createGain();

    oscillator.type = "square";


    oscillator.frequency.setValueAtTime(frequency, scheduledTime);


    gain.gain.setValueAtTime(0.0001, scheduledTime);

    gain.gain.exponentialRampToValueAtTime(volume, scheduledTime + 0.002);

    gain.gain.exponentialRampToValueAtTime(0.0001, scheduledTime + duration);

    oscillator.connect(gain);

    if (metronomeMasterGain !== null) {

        gain.connect(metronomeMasterGain);

    } else {

        gain.connect(audioContext.destination);
    }

    oscillator.start(scheduledTime);

    oscillator.stop(scheduledTime + duration + 0.01);

    scheduledOscillators.push(oscillator);

    oscillator.onended = function () {

        scheduledOscillators = scheduledOscillators.filter(function (activeOscillator) {

            return (activeOscillator !== oscillator);
        });


        try {

            oscillator.disconnect();

            gain.disconnect();

        } catch (error) {

        }

    };
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


    scheduleTone(strengthSettings.frequency, strengthSettings.volume, scheduledTime, CLICK_DURATION);


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





// INICIAR O METRÔNONO

async function startMetronome() {

    if (metronomeState.running || startRequestInProgress) {

        return;
    }

    startRequestInProgress = true;

    try {
        
        const audioContext = await getMetronomeAudioContext();

        metronomeState.running = true;

        metronomeState.currentBeat = 0;

        metronomeState.nextBeatTime = audioContext.currentTime + METRONOME_START_DELAY;

        visualBeatQueue = [];

        toggleMetronomeButton.textContent = "Parar";

        toggleMetronomeButton.setAttribute("aria-pressed", "true");

        toggleMetronomeButton.classList.add("active");

        metronomeStatus.textContent = "Tocando em " + metronomeState.bpm + " BPM — " + metronomeState.beatsPerMeasure + 
            (metronomeState.beatsPerMeasure === 1 ? " tempo" : " tempos"
        );
    
        scheduler();

        updateBeatAnimation();
    } catch (error) {

        console.error("Erro ao iniciar o metrônomo:", error);

        metronomeStatus.textContent = "Não foi possível iniciar o áudio";

        stopMetronome();
    } finally {

        startRequestInProgress = false;
    }
}




// PARAR O METRÔNOMO

export function stopMetronome() {

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

    metronomeStatus.textContent = "Tempos: " + metronomeState.beatsPerMeasure;

    resetBeatIndicators();
}
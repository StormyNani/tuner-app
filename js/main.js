import {
    TUNER_MODES,
    SMOOTHING_SAMPLES,
    PITCH_ANALYSIS_INTERVAL,
    SILENCE_HOLD_TIME
} from "./config.js";

import {
    appState,
    microphoneState,
    pitchState,
} from "./state.js";

import {
    autoCorrelate,
    frequencyToNote,
    frequencyToSelectedString,
    stabilizeOctave,
    stabilizeNoteChange,
    resetPitchState
} from "./pitchDetector.js";

import {
    playStringSound,
    toggleStringRepeat,
    stopStringRepeat,
    closeReferenceAudio
} from "./audio.js"; 

import {
    initializeMetronome,
    stopMetronome
} from "./metronome.js";





// ELEMENTOS DO HTML

const tunerButton = document.getElementById("tunerButton");

const metronomeButton = document.getElementById("metronomeButton");

const menu = document.getElementById("menu");

const tuner = document.getElementById("tuner");

const metronome = document.getElementById("metronome");

const backFromMetronome = document.getElementById("backFromMetronome");

const backToMenu = document.getElementById("backToMenu");

const currentNote = document.getElementById("currentNote");

const currentFrequency = document.getElementById("currentFrequency");

const currentCents = document.getElementById("currentCents");

const needle = document.getElementById("needle");

const tunerMeter = document.getElementById("tunerMeter");

const gaugeTicks = document.getElementById("gaugeTicks");

const canvas = document.getElementById("visualizer");

const ctx = canvas.getContext("2d");

const tuningStatus = document.getElementById("tuningStatus");

const tunerModeMenu = document.getElementById("tunerModeMenu");

const backToMainMenu = document.getElementById("backToMainMenu");

const tunerModeOptions = document.querySelectorAll(".tunerModeOption");

const tunerTitle = document.getElementById("tunerTitle");

const instrumentStrings = document.getElementById("instrumentStrings");

const openSettingsButton = document.getElementById("openSettings");

const settingsModal = document.getElementById("settingsModal");

const closeSettingsButton = document.getElementById("closeSettings");

const noteNameOptions = document.querySelectorAll('input[name="noteNames"]');

const accidentalOptions = document.querySelectorAll('input[name="accidentals"]');

const settingsReference = document.getElementById("settingsReference");

const showTechnicalInfo = document.getElementById("showTechnicalInfo");

const referenceSoundsEnabled = document.getElementById("referenceSoundsEnabled");


let lastFocusedElement = null;


showTechnicalInfo.checked = appState.showTechnicalInfo;
applyTechnicalInfoVisibility();


canvas.width = 300;
canvas.height = 100;

initializeMetronome();

window.addEventListener("resize", function () {

    createGaugeScale();
});





//EVENTOS

tunerButton.addEventListener("click", showTunerModeMenu);

metronomeButton.addEventListener("click", showMetronome);

backToMainMenu.addEventListener("click", showMainMenu);

backFromMetronome.addEventListener("click", showMainMenu);

backToMenu.addEventListener("click", returnToTunerModes);

openSettingsButton.addEventListener("click", openSettingsModal);

closeSettingsButton.addEventListener("click", closeSettingsModal);

settingsModal.addEventListener("click", function (event) {

    if (event.target === settingsModal) {
        closeSettingsModal();
    }
});



document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && appState.settingsOpen) {
        closeSettingsModal();
    }
});



noteNameOptions.forEach(function (option) {
    option.addEventListener("change", function () {
        if (!option.checked) {
            return;
        }

        appState.noteNameStyle = option.value;

        refreshDisplayedNoteNames();
    });
});



accidentalOptions.forEach(function (option) {
    option.addEventListener("change", function () {
        if (!option.checked) {
            return;
        }

        appState.accidentalStyle = option.value;

        refreshDisplayedNoteNames();
    });
});



settingsReference.addEventListener("input", function () {
    const newReference = Number(settingsReference.value);

    if (newReference >= 432 && newReference <= 446) {
        appState.referenceA4 = newReference;

        resetTunerDisplay();
    }
});



showTechnicalInfo.addEventListener("change", function () {
    appState.showTechnicalInfo = showTechnicalInfo.checked;

    applyTechnicalInfoVisibility();
});



referenceSoundsEnabled.addEventListener("change", function () {
    appState.referenceSoundEnabled = referenceSoundsEnabled.checked;

    if (!appState.referenceSoundEnabled) {
        closeReferenceAudio();

    }
        updateRepeatButtonVisibility();
});


tunerModeOptions.forEach(function (button) {
    button.addEventListener("click", 
        function () {
            const selectedMode = button.dataset.mode;

        openTunerMode(selectedMode);
    });
});





//JANELA DE CONFIGURAÇÕES

function openSettingsModal() {
    if (appState.settingsOpen) {
        return;

    }

    appState.settingsOpen = true;

    lastFocusedElement = document.activeElement;

    settingsModal.hidden = false;

    document.body.classList.add("settings-open");

    tuner.setAttribute("inert", "");

    openSettingsButton.setAttribute("aria-expanded", "true");

    requestAnimationFrame(function () {
        closeSettingsButton.focus();
    });
}





function closeSettingsModal() {
    if (!appState.settingsOpen) {
        return;

    }

    appState.settingsOpen = false;

    settingsModal.hidden = true;

    document.body.classList.remove("settings-open");

    tuner.removeAttribute("inert");

    openSettingsButton.setAttribute("aria-expanded", "false");

    if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();

    }

    lastFocusedElement = null;
}





//NAVEGAÇÃO

function showMetronome() {
    menu.hidden = true;

    tunerModeMenu.hidden = true;

    tuner.hidden = true;

    metronome.hidden = false;
}



function showTunerModeMenu() {

    stopMetronome();

    menu.hidden = true;
    
    metronome.hidden = true;
    
    tuner.hidden = true;
    tunerModeMenu.hidden = false;
}



function showMainMenu() {

    stopMetronome();

    tunerModeMenu.hidden = true;
    tuner.hidden = true;

    metronome.hidden = true;

    menu.hidden = false;
}



function openTunerMode(mode) {

    stopMetronome();

    appState.currentTunerMode = mode;
    appState.selectedString = null;

    menu.hidden = true;
    tunerModeMenu.hidden = true;
    tuner.hidden = false;

    metronome.hidden = true;

    configureTunerMode();

    requestAnimationFrame(function() {
        
        createGaugeScale();
    });

    startTuner();
}



function returnToTunerModes() {
    
    stopTuner();

    appState.currentTunerMode = null;
    appState.selectedString = null;

    instrumentStrings.innerHTML = "";
    instrumentStrings.hidden = true;

    menu.hidden = true;
    tuner.hidden = true;
    tunerModeMenu.hidden = false;
}





//MODOS E CORDAS DOS INSTRUMENTOS

function configureTunerMode() {
    const mode = TUNER_MODES[appState.currentTunerMode];

    tunerTitle.textContent = mode.title;

    if (appState.currentTunerMode === "chromatic") {
        instrumentStrings.innerHTML = "";
        instrumentStrings.hidden = true;

        resetTunerDisplay();

        return;
    }

    instrumentStrings.hidden = false;

    renderInstrumentStrings(mode.strings);
}



function renderInstrumentStrings(strings) {
    instrumentStrings.innerHTML = "";

    strings.forEach(function (stringData) {
        const row = document.createElement("div");

        row.className = "stringRow";

        const stringButton = document.createElement("button");

        stringButton.type = "button";

        stringButton.className = "instrumentString";

        const note = document.createElement("span");

        note.className = "stringNote";

        note.dataset.originalName = stringData.name;

        note.textContent = formatFullNoteName(stringData.name);

        const line = document.createElement("span");

        line.className = "stringLine";

        line.style.height = stringData.thickness + "px";

        const repeatButton = document.createElement("button");

        repeatButton.type = "button";

        repeatButton.className = "stringRepeatButton";
        
        repeatButton.textContent = "↻";

        repeatButton.hidden = true;

        repeatButton.title = "Repetir a cada quatro tempos";

        repeatButton.setAttribute("aria-label", "Repetir a nota " + stringData.name + " a cada quatro tempos"
        );

        repeatButton.setAttribute("aria-pressed", "false");

        stringButton.appendChild(note);
        stringButton.appendChild(line);

        stringButton.addEventListener("click",
            function () {
                selectInstrumentString(
                    stringData,
                    stringButton,
                    true
                );
            }
        );

        repeatButton.addEventListener("click",
            function (event) {
                event.stopPropagation();

                toggleStringRepeat(stringData, repeatButton);
            }
        );

        row.appendChild(stringButton);
        row.appendChild(repeatButton);

        instrumentStrings.appendChild(row);
    });

    const firstString = strings[0];

    const firstButton = instrumentStrings.querySelector(".instrumentString");

    selectInstrumentString(firstString, firstButton, false);
}



function selectInstrumentString(stringData, selectedButton, shouldPlaySound = true) {
    const isSameString = appState.selectedString !== null && appState.selectedString.noteNumber === stringData.noteNumber;

    if(!isSameString) {
        stopStringRepeat();
    }

    appState.selectedString = stringData;

    const stringButtons = instrumentStrings.querySelectorAll(".instrumentString");

    stringButtons.forEach(function (button) {
        button.classList.remove(
            "selected"
        );
    });

    const repeatButtons = instrumentStrings.querySelectorAll(".stringRepeatButton");

    repeatButtons.forEach(function (button) {
        button.hidden = true;
    });

    selectedButton.classList.add("selected");

    const selectedRow = selectedButton.closest(".stringRow");

    const selectedRepeatButton = selectedRow.querySelector(".stringRepeatButton");

    selectedRepeatButton.hidden = !appState.referenceSoundEnabled;

    resetTunerDisplay();

    if (shouldPlaySound && appState.referenceSoundEnabled) {
        playStringSound(stringData);
    }
}





//CONTROLE DO MICROFONE

async function startTuner() {
    if (appState.tunerRunning) {
        return;
    }

    appState.tunerRunning = true;

    appState.lastPitchAnalysisTime = 0;
    appState.lastValidFrequencyTime = 0;

    const currentSession = ++appState.tunerSessionId;

    tuner.hidden = false;
    menu.hidden = true;

    try {
        microphoneState.microphoneStream = await navigator.mediaDevices.getUserMedia({audio: true});

        if (!appState.tunerRunning || currentSession !== appState.tunerSessionId) {
            microphoneState
                .microphoneStream
                .getTracks()
                .forEach(
                    function (track) { 
                        track.stop();
                }
            );

            microphoneState.microphoneStream = null;

            return;
        }

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        microphoneState.audioContext = new AudioContextClass();

        if (microphoneState.audioContext.state === "suspended") {
            await microphoneState.audioContext.resume();
        }

        microphoneState.audioSource = microphoneState.audioContext.createMediaStreamSource(microphoneState.microphoneStream);

        microphoneState.analyser = microphoneState.audioContext.createAnalyser();

        microphoneState.analyser.fftSize = 2048;

        microphoneState.dataArray = new Float32Array (microphoneState.analyser.fftSize);

        microphoneState.audioSource.connect(microphoneState.analyser);

        console.log("Analisador de áudio ativo");

        appState.animationFrameId = requestAnimationFrame(update);

    } catch (error) {
        if (currentSession !== appState.tunerSessionId) { return };

        appState.tunerRunning = false;

        console.error("Erro ao acessar o microfone:", error);

        currentNote.textContent = "Não foi possível acessar o microfone";

        currentFrequency.textContent = "Frequência: --";

        currentCents.textContent = "Afinação: --";
    }
}



function stopTuner() {
    closeSettingsModal();

    appState.tunerRunning = false;

    appState.tunerSessionId++;

    tuner.hidden = true;
    menu.hidden = false;

    if (appState.animationFrameId !== null) {
        cancelAnimationFrame(appState.animationFrameId);

        appState.animationFrameId = null;
    }

    if (microphoneState.microphoneStream !== null) {

        microphoneState
        .microphoneStream
        .getTracks()
        .forEach(
            function (track) {
                track.stop();
            }
        );

        microphoneState.microphoneStream = null;
    }

    if ( microphoneState.audioSource !== null) {
        microphoneState.audioSource.disconnect();

        microphoneState.audioSource = null;
    }

    if (microphoneState.analyser !== null) {
        microphoneState.analyser.disconnect();

        microphoneState.analyser = null;
    }

    microphoneState.dataArray = null;

    if (microphoneState.audioContext !== null && microphoneState.audioContext.state !== "closed") {
        microphoneState.audioContext.close();
    }

    microphoneState.audioContext = null;
    
   closeReferenceAudio();

    resetTunerDisplay();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

}





//ATUALIZAÇÃO DO AFINADOR

function update(timestamp) {
    if (!appState.tunerRunning ||
        !microphoneState.analyser ||
        !microphoneState.dataArray 
    ) {
        return;
    }

    appState.animationFrameId = requestAnimationFrame(update);

    microphoneState.analyser.getFloatTimeDomainData(microphoneState.dataArray);

    if (timestamp >= appState.ignoreMicrophoneUntil && timestamp - appState.lastPitchAnalysisTime >= PITCH_ANALYSIS_INTERVAL) {
        appState.lastPitchAnalysisTime = timestamp;

        let frequency = autoCorrelate(microphoneState.dataArray, microphoneState.analyser.context.sampleRate);

        const rawFrequency = frequency;

        if (frequency !== -1) {
            appState.lastValidFrequencyTime = timestamp;

            frequency = stabilizeOctave(frequency);

            frequency = stabilizeNoteChange(frequency);

            pitchState.frequencyHistory.push(frequency);

            if (pitchState.frequencyHistory.length > SMOOTHING_SAMPLES) {
                pitchState.frequencyHistory.shift();
            }

            const sortedHistory = [...pitchState.frequencyHistory].sort(function (a, b) {
                return a - b;
                }
            );

            const middleIndex = Math.floor(sortedHistory.length / 2);

            let smoothedFrequency;

            if (sortedHistory.length % 2 === 0) {
                smoothedFrequency = (sortedHistory[middleIndex - 1]
                     + sortedHistory[middleIndex]) / 2;
            
            } else {
                smoothedFrequency = sortedHistory[middleIndex];
            }

            console.log({
                raw: rawFrequency.toFixed(2),

                stabilized: frequency.toFixed(2),

                smoothed: smoothedFrequency.toFixed(2)
            });

            const detectedNote = frequencyToNote(smoothedFrequency);

            let tuningResult;

            if (appState.currentTunerMode === "chromatic") {
                tuningResult = detectedNote;

            } else {
                tuningResult = frequencyToSelectedString(smoothedFrequency);
        
            }

            appState.lastDetectedNote = detectedNote;
            
            currentNote.textContent = formatNoteName(detectedNote.name) + detectedNote.octave;

            currentFrequency.textContent = "Frequência: " + smoothedFrequency.toFixed(2) + " Hz";

            currentCents.textContent = "Afinação: " + tuningResult.cents.toFixed(1) + " cents";

            updateNeedle(tuningResult.cents);

            updateNeedleColor(tuningResult.cents);

            updateNoteColor(tuningResult.cents);

            updateTuningStatus(tuningResult.cents);
        
        } else if (timestamp - appState.lastValidFrequencyTime >= SILENCE_HOLD_TIME) {
            resetTunerDisplay();

        }
    }

    drawWaveForm();
}



function drawWaveForm() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const sliceWidth = canvas.width / microphoneState.dataArray.length;

    let x = 0;

    ctx.beginPath();

    for (let i = 0; i < microphoneState.dataArray.length; i ++) {
        const y = (microphoneState.dataArray[i] * canvas.height / 2) + canvas.height / 2;

        if (i === 0) {
            ctx.moveTo(x, y);

        } else {
            ctx.lineTo(x, y);

        }

        x += sliceWidth;
    }

    ctx.stroke();
}





const NOTE_DISPLAY_NAMES = {
    letters: {
        sharps: {
            "C": "C",
            "C#": "C♯",
            "D": "D",
            "D#": "D♯",
            "E": "E",
            "F": "F",
            "F#": "F♯",
            "G": "G",
            "G#": "G♯",
            "A": "A",
            "A#": "A♯",
            "B": "B"
        },

        flats: {
            "C": "C",
            "C#": "D♭",
            "D": "D",
            "D#": "E♭",
            "E": "E",
            "F": "F",
            "F#": "G♭",
            "G": "G",
            "G#": "A♭",
            "A": "A",
            "A#": "B♭",
            "B": "B"
        }
    },

    solfege: {
        sharps: {
            "C": "Dó",
            "C#": "Dó♯",
            "D": "Ré",
            "D#": "Ré♯",
            "E": "Mi",
            "F": "Fá",
            "F#": "Fá♯",
            "G": "Sol",
            "G#": "Sol♯",
            "A": "Lá",
            "A#": "Lá♯",
            "B": "Si"
        },

        flats: {
             "C": "Dó",
            "C#": "Ré♭",
            "D": "Ré",
            "D#": "Mi♭",
            "E": "Mi",
            "F": "Fá",
            "F#": "Sol♭",
            "G": "Sol",
            "G#": "Lá♭",
            "A": "Lá",
            "A#": "Si♭",
            "B": "Si"
        }
    }
};



function formatNoteName(noteName) {
    return (NOTE_DISPLAY_NAMES[appState.noteNameStyle][appState.accidentalStyle][noteName] || noteName);

}



function formatFullNoteName(fullName) {
    const match = fullName.match(/^([A-G](?:#|b)?)(-?\d+)$/);

    if (!match) {
        return fullName;

    }

    const noteName = match[1];
    const octave = match[2];

    return (formatNoteName(noteName) + octave);
}



function refreshDisplayedNoteNames() {
    const stringNotes = document.querySelectorAll(".stringNote");

    stringNotes.forEach(function (noteElement) {
        noteElement.textContent = formatFullNoteName(noteElement.dataset.originalName);
    });

    if (appState.lastDetectedNote !== null) {
        currentNote.textContent = formatNoteName(appState.lastDetectedNote.name) +
        appState.lastDetectedNote.octave;
    }
}



function applyTechnicalInfoVisibility() {
    const shouldHide = !appState.showTechnicalInfo;

    currentFrequency.hidden = shouldHide;

    currentCents.hidden = shouldHide;

}



function updateRepeatButtonVisibility() {
    const repeatButtons = instrumentStrings.querySelectorAll(".stringRepeatButton");

    repeatButtons.forEach(function (button) {
        button.hidden = true;
    });

    if (!appState.referenceSoundEnabled || appState.selectedString === null) {
        return;

    }

    const selectedStringButton = instrumentStrings.querySelector(".instrumentString.selected");

    if (!selectedStringButton) {
        return;

    }

    const selectedRow = selectedStringButton.closest(".stringRow");

    const repeatButton = selectedRow.querySelector(".stringRepeatButton");

    repeatButton.hidden = false;
}





//INTERFACE DO AFINADOR

function resetTunerDisplay() {
    resetPitchState();

    appState.lastDetectedNote = null;

    currentFrequency.textContent = "Frequência: --";

    currentNote.textContent = "--";

    if (appState.currentTunerMode === "chromatic" ||
        appState.selectedString === null 
    
    ) {
        tuningStatus.textContent = "Toque uma nota";

    } else {
        tuningStatus.textContent = "Toque a corda selecionada";

    }

    currentCents.textContent = "Afinação: --";

    updateNeedle(0);

    needle.style.backgroundColor = "#888";

    currentNote.style.color = "#888"

    tuningStatus.className = "";
}



function createGaugeScale() {

    const meterWidth = tunerMeter.clientWidth;

    const meterHeight = tunerMeter.clientHeight;

    if (meterWidth <= 0 || meterHeight <= 0) {
        
        return;
    }

    gaugeTicks.innerHTML = "";
    
    /*Centro de rotação da agulha*/

    const centerX = meterWidth / 2;

    const centerY = meterHeight - 25;


    /*Distância das marcações em relação ao centro*/

    const tickRadius = Math.min(138, meterWidth / 2 - 25);

    const labelRadius = Math.min(168, meterWidth / 2 - 15);


    /*RISQUINHOS: um a cada 5 cents*/

    for (let cents = -50; cents <= 50; cents += 5) {
        
        const angleDegrees = (cents / 50) * 90;

        const angleRadians = angleDegrees * Math.PI / 180;

        const x = centerX + Math.sin(angleRadians) * tickRadius;

        const y = centerY - Math.cos(angleRadians) * tickRadius;

        const tick = document.createElement("span");

        tick.className = cents % 10 === 0 ? "gaugeTick gaugeTickMajor" : "gaugeTick";

        tick.style.left = x + "px";

        tick.style.top = y + "px";

        tick.style.transform = "translate(-50%, -50%) " + "rotate(" + angleDegrees + "deg)";

        gaugeTicks.appendChild(tick);
    }


    /*NÚMEROS: um a cada 10 cents*/

    for ( let cents = -50; cents <= 50; cents += 10) {
        
        const angleDegrees = (cents / 50) * 90;

        const angleRadians = angleDegrees * Math.PI / 180;

        const x = centerX + Math.sin(angleRadians) * labelRadius;

        const y = centerY - Math.cos(angleRadians) * labelRadius;

        const label = document.createElement("span");

        label.className = "gaugeLabel";

        label.textContent = cents > 0 ? "+" + cents : String(cents);

        label.style.left = x + "px";

        label.style.top = y + "px";

        gaugeTicks.appendChild(label);
    }
}



function updateNeedle(cents) {
    const limitedCents = Math.max(-50, Math.min(50, cents));

    const angle = (limitedCents / 50) * 90;

    needle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
}



function updateNeedleColor(cents) {
    const error = Math.abs(cents);

    if (error <= 5) {
        needle.style.backgroundColor = "#2ecc71"; 

    } else if (error <= 15) {
        needle.style.backgroundColor = "#f1c40f";

    } else { 
        needle.style.backgroundColor = "#e74c3c";

    }
}



function updateNoteColor(cents) {
    const error = Math.abs(cents);

    if (error <= 5) {
        currentNote.style.color = "#2ecc71";

    } else if (error <= 15) {
        currentNote.style.color = "#d4a900";

    } else {
        currentNote.style.color = "#e74c3c";
    }
}



function updateTuningStatus(cents) {
    const error = Math.abs(cents);

    if (error <= 5) {
        tuningStatus.textContent = "Afinado";

        tuningStatus.className = "tuned";

    } else if (cents < -15) {
        tuningStatus.textContent = "Muito grave";

        tuningStatus.className = "out-of-tune";

    } else if (cents < -5) {
        tuningStatus.textContent = "Um pouco grave";

        tuningStatus. className = "almost-tuned";

    } else if (cents > 15) {
        tuningStatus.textContent = "Muito agudo";

        tuningStatus.className = "out-of-tune";

    } else {
        tuningStatus.textContent = "Um pouco agudo";

        tuningStatus.className = "almost-tuned";
    }
}


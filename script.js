/*const tunerButton = document.getElementById("tunerButton");
const menu = document.getElementById("menu");
const tuner = document.getElementById("tuner");
const backToMenu = document.getElementById("backToMenu");

const currentNote = document.getElementById("currentNote");
const currentFrequency = document.getElementById("currentFrequency");
const currentCents = document.getElementById("currentCents");

const needle = document.getElementById("needle");

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

const tuningReference = document.getElementById("tuningReference");

const tuningStatus = document.getElementById("tuningStatus");

const tunerModeMenu = document.getElementById("tunerModeMenu");
const backToMainMenu = document.getElementById("backToMainMenu");
const tunerModeOptions = document.querySelectorAll(".tunerModeOption");
const tunerTitle = document.getElementById("tunerTitle");
const instrumentStrings = document.getElementById("instrumentStrings");

canvas.width = 300;
canvas.height = 100;

let analyser = null;
let dataArray = null;
let audioContext = null;

let audioSource = null;
let microphoneStream = null;

let animationFrameId = null;
let tunerRunning = false;

let tunerSessionId = 0;

let lastValidFrequencyTime = 0;

let referenceA4 = 442;

let acceptedNoteFrequency = null;
let pendingNoteNumber = null;
let pendingNoteCount = 0;

let lastPitchAnalysisTime = 0;

let frequencyHistory = [];
let trackedNoteNumber = null;

let stableFrequency = null;
let octaveCandidateNote = null;
let octaveCandidateCount = 0;

let currentTunerMode = null;
let selectedString = null;

let referenceAudioContext = null;
let activeReferenceOscillators = [];
let ignoreMicrophoneUntil = 0;
let stringRepeatIntervalId = null;
let activeRepeatButton = null; 





tunerButton.addEventListener("click", showTunerModeMenu);
backToMainMenu.addEventListener("click", showMainMenu);
backToMenu.addEventListener("click", returnToTunerModes);


tunerModeOptions.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const selectedMode =
                button.dataset.mode;

            openTunerMode(selectedMode);
        }
    );
});







tuningReference.addEventListener(
    "input",
    function() {
        
        const newReference =
            Number(tuningReference.value);
        
        if (
            newReference >= 432 &&
            newReference <= 446
        ) {

            referenceA4 = newReference;

           resetTunerDisplay();
        }
    }
);





function showTunerModeMenu() {

    menu.hidden = true;
    tuner.hidden = true;

    tunerModeMenu.hidden = false;
}





function showMainMenu() {

    tunerModeMenu.hidden = true;
    tuner.hidden = true;

    menu.hidden = false;
}





function openTunerMode(mode) {

    currentTunerMode = mode;
    selectedString = null;

    menu.hidden = true;
    tunerModeMenu.hidden = true;
    tuner.hidden = false;

    configureTunerMode();

    startTuner();
}





function returnToTunerModes() {

    stopTuner();

    currentTunerMode = null;
    selectedString = null;

    instrumentStrings.innerHTML = "";
    instrumentStrings.hidden = true;

    menu.hidden = true;
    tuner.hidden = true;
    tunerModeMenu.hidden = false;
}





function configureTunerMode() {

    const mode = TUNER_MODES[currentTunerMode];

    tunerTitle.textContent = mode.title;

    if (currentTunerMode === "chromatic") {

        instrumentStrings.innerHTML = "";
        instrumentStrings.hidden = true;

        resetTunerDisplay();

        return;
    } 

    instrumentStrings.hidden = false

    renderInstrumentString(mode.strings);
}





function renderInstrumentString(strings) {

    instrumentStrings.innerHTML = "";

    strings.forEach(function (stringData) {
        
        const row = document.createElement("div");

        row.className = "stringRow";

        const stringButton = document.createElement("button");

        stringButton.type = "button";

        stringButton.className = "instrumentString";

        const note = document.createElement("span");

        note.className = "stringNote";
        note.textContent = stringData.name;

        const line = document.createElement("span");

        line.className = "stringLine";

        line.style.height = stringData.thickness + "px";

        const repeatButton = document.createElement("button");

        repeatButton.type = "button";

        repeatButton.className = "stringRepeatButton";

        repeatButton.textContent = "↻";

        repeatButton.hidden = true;

        repeatButton.title = "Repetir a cada quatro tempos";

        repeatButton.setAttribute(
            "aria-label",
            "Repetir a nota " +
            stringData.name +
            " a cada quatro tempos"
        );

        repeatButton.setAttribute("aria-pressed", "false");

        stringButton.appendChild(note);
        stringButton.appendChild(line);

        stringButton.addEventListener("click", 
            
            function () {

                selectInstrumentString(stringData, stringButton, true);

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





function selectInstrumentString(
    stringData,
    selectedButton,
    shouldPlaySound = true
) {

    const isSameString = 
    selectedString !== null && 
    selectedString.noteNumber ===
    stringData.noteNumber;

    if (!isSameString) {

        stopStringRepeat();
    }

    selectedString = stringData;

    const stringButtons = instrumentStrings.querySelectorAll(".instrumentString");

    stringButtons.forEach(function (button) {

        button.classList.remove(
            "selected"
        );
    });
    
    const repeatButtons = instrumentStrings.querySelectorAll(
        ".stringRepeatButton"
    );

    repeatButtons.forEach(function (button) {

        button.hidden = true;
    });

    selectedButton.classList.add("selected");

    const selectedRow = selectedButton.closest(".stringRow");

    const selectedRepeatButton = selectedRow.querySelector(".stringRepeatButton");

    selectedRepeatButton.hidden = false;

    resetTunerDisplay();

    if (shouldPlaySound) {

        playReferenceTone(stringData.noteNumber);
    }
}





function noteNumberToFrequency(noteNumber) {

    return referenceA4 * Math.pow(2, (noteNumber -69) / 12);

}





function frequencyToSelectedString(frequency) {

    const targetFrequency = noteNumberToFrequency(selectedString.noteNumber);

    const cents = 1200 * Math.log2(frequency / targetFrequency);

    return {
        name: selectedString.name,
        frequency: targetFrequency,
        cents: cents
    };
}





async function startTuner() {
    
    if (tunerRunning) {
        return
    }

    tunerRunning = true;

    lastPitchAnalysisTime = 0;

    lastValidFrequencyTime = 0;

    const currentSession = ++tunerSessionId;

    tuner.hidden = false;
    menu.hidden = true;

    try {

        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: true
            });

        if (!tunerRunning || currentSession !== tunerSessionId) {

            microphoneStream.getTracks().forEach(function (track) {
                track.stop();
            });

            microphoneStream = null;

            return;
        }

        const AudioContextClass =
            window.AudioContext ||
            window.webkitAudioContext;

        audioContext = new AudioContextClass();

        if (audioContext.state === "suspended") {
            await audioContext.resume();
        }

        audioSource =
            audioContext.createMediaStreamSource(
                microphoneStream
        );

        analyser = audioContext.createAnalyser();

        analyser.fftSize = 2048;

        dataArray = new Float32Array(analyser.fftSize);

        audioSource.connect(analyser);

        console.log("Analisador de áudio ativo");

        animationFrameId =
            requestAnimationFrame(update);

    } catch (error) {

        if (currentSession !== tunerSessionId) {
            return;
        }

        tunerRunning = false;

        console.error(
            "Erro ao acessar o microfone:",
            error
        );

        currentNote.textContent = "Não foi possível acessar o microfone";

        currentFrequency.textContent = "Frequência: --";

        currentCents.textContent = "Afinação: --";
    }
}





function resetTunerDisplay() {
    
    frequencyHistory = [];

    trackedNoteNumber = null;

    stableFrequency = null;

    octaveCandidateNote = null;
    octaveCandidateCount = 0;

    acceptedNoteFrequency = null;

    pendingNoteNumber = null;
    pendingNoteCount = 0;

    currentFrequency.textContent = "Frequência: --";

    currentNote.textContent = "--";

    if ( currentTunerMode === "chromatic" ||selectedString === null) {

        tuningStatus.textContent = "Toque uma nota";

    } else {

        tuningStatus.textContent = "Toque a corda selecionada";
    }

    currentCents.textContent = "Afinação: --";

    updateNeedle(0);

    needle.style.backgroundColor = "#888";

    currentNote.style.color = "#888";

    tuningStatus.className = "";

}





function stopTuner() {

    tunerRunning = false;


    tunerSessionId++;

    tuner.hidden = true;
    menu.hidden = false;

    if (animationFrameId !== null) {

        cancelAnimationFrame(animationFrameId);

        animationFrameId = null;
    }

    if (microphoneStream !== null) {

        microphoneStream.getTracks().forEach(function (track) {
            track.stop();
        });

        microphoneStream = null;
    }

    if (audioSource !== null) {

        audioSource.disconnect();

        audioSource = null;

    }

    if (analyser !== null) {

        analyser.disconnect();

        analyser = null;
    }

    dataArray = null;

    if (audioContext !== null && 
        audioContext.state !== "closed"
    ) {
        audioContext.close();
    }

    audioContext = null;

    resetTunerDisplay();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    console.log("Afinador encerrado");

    stopStringRepeat();

    stopReferenceTone();

    ignoreMicrophoneUntil = 0;

    if (
        referenceAudioContext !== null &&
        referenceAudioContext.state !== "closed"
    ) {

        referenceAudioContext.close();
    }

    referenceAudioContext = null;
}





function update(timestamp){

    if ( !tunerRunning ||
         !analyser ||
         !dataArray
    ) {
        return;
    }

    animationFrameId =
        requestAnimationFrame(update);

        analyser.getFloatTimeDomainData(dataArray);

    if (
        timestamp >= ignoreMicrophoneUntil &&
        timestamp - lastPitchAnalysisTime >=
        PITCH_ANALYSIS_INTERVAL
    ) { 

        lastPitchAnalysisTime = timestamp
        
        let frequency = autoCorrelate(dataArray, analyser.context.sampleRate);

        const rawFrequency = frequency;

        if (frequency !== -1) {

            lastValidFrequencyTime = timestamp;

            frequency = stabilizeOctave(frequency);

            frequency = stabilizeNoteChange(frequency);

            frequencyHistory.push(frequency);

            if (frequencyHistory.length > SMOOTHING_SAMPLES) {
            frequencyHistory.shift();
            }
        
            const sortedHistory = [...frequencyHistory].sort(
                function (a, b) {
                    return a - b;

            }
       );

       const middleIndex = 
            Math.floor(sortedHistory.length / 2);

       let smoothedFrequency;

       if (sortedHistory.length % 2 === 0) {

        smoothedFrequency = (
            sortedHistory[middleIndex - 1] +
            sortedHistory[middleIndex]
        ) / 2;

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

       if (currentTunerMode === "chromatic") {

        tuningResult = detectedNote;

       } else {

        tuningResult = frequencyToSelectedString(smoothedFrequency);

       }

       currentNote.textContent = 
        detectedNote.name + 
        detectedNote.octave;

       currentFrequency.textContent = 
        "Frequência: " + 
        smoothedFrequency.toFixed(2) +
        " Hz";

       currentCents.textContent =
        "Afinação: " +
        tuningResult.cents.toFixed(1) +
        " cents";

       updateNeedle(
        tuningResult.cents
       );

       updateNeedleColor(
        tuningResult.cents
       );

       updateNoteColor(
        tuningResult.cents
       );

       updateTuningStatus(
        tuningResult.cents
       );

        } else if (

            timestamp - lastValidFrequencyTime >=
            SILENCE_HOLD_TIME
        ) {
           
            resetTunerDisplay();
        }
    }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        let sliceWidth = canvas.width / dataArray.length;
        let x = 0;

        ctx.beginPath();

        for (let i = 0; i < dataArray.length; i++) {
            
            let y = (dataArray[i] * canvas.height / 2) + canvas.height / 2;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }

        ctx.stroke();
}





function autoCorrelate (buffer, sampleRate) {

    const SIZE = buffer.length;

    const minSamples = Math.max(1, Math.floor(sampleRate / MAX_FREQUENCY));
    const maxSamples = Math.min(SIZE - 2, Math.floor(sampleRate / MIN_FREQUENCY));

    let bestOffset = -1

    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }

    rms = Math.sqrt(rms / SIZE);

    if (rms < 0.01) {
        return -1;
    }

    const nsdf = new Float32Array(SIZE);

    for (let tau = minSamples; tau <= maxSamples; tau++) {
        
        let acf = 0;
        let divisor = 0;

        for (let i = 0; i < SIZE - tau; i ++) {

            acf += buffer[i] * buffer[i + tau];

            divisor +=
                buffer[i] * buffer[i] +
                buffer[i + tau] * buffer[i + tau];
        }

        nsdf[tau] = divisor > 0 ? (2 * acf) / divisor : 0;
    }

    let highestPeak = 0

    for (let tau = minSamples + 1; tau < maxSamples; tau++) {

        const isLocalPeak =
            nsdf[tau] > nsdf[tau - 1] &&
            nsdf[tau] >=nsdf[tau + 1];

        if (isLocalPeak && nsdf[tau] > highestPeak) {
            highestPeak = nsdf[tau];
        }
    }

    if (highestPeak < NSDF_MIN_CLARITY) {
        return -1;
    }

    const peakThreshold = highestPeak * NSDF_PEAK_RATIO;

    for (let tau = minSamples + 1; tau < maxSamples; tau++) {

        const isLocalPeak = nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1];

        if (isLocalPeak && nsdf[tau] >= peakThreshold) {

        bestOffset = tau;
        break;
    }
}

    if (bestOffset === -1) {
        return -1;
    }

    const left = nsdf[bestOffset - 1];
    const center = nsdf[bestOffset];
    const right = nsdf[bestOffset + 1];

    const denominator = 2 * (left - (2 * center) + right);
    let delta = 0;

    if (Math.abs(denominator) > 0.000000000001) {
        delta = (left - right) / denominator;
    }

    const betterOffset = bestOffset + delta;

    return sampleRate / betterOffset;

}





function frequencyToNote(frequency) {

    const noteNumber = Math.round(12 * Math.log2(frequency / referenceA4) + 69);
 
    const noteName = NOTE_NAMES[noteNumber % 12]    
    
    const octave = Math.floor(noteNumber / 12) -1;

    const perfectFrequency = referenceA4 * Math.pow(2, (noteNumber - 69) / 12);

    const cents = 1200 * Math.log2(frequency / perfectFrequency);

    return {

        name: noteName,
        octave: octave,
        frequency: perfectFrequency,
        cents: cents
    };
}





function stabilizeOctave(frequency) {

    const detectedNoteNumber = Math.round(
        12 * Math.log2(frequency / referenceA4) + 69
    );

    if (stableFrequency === null) {
        
        stableFrequency = frequency;

        return frequency;
    }

    const stableNoteNumber = Math.round( 
        12 * Math.log2(stableFrequency / referenceA4) + 69
    );

    const noteDifference = Math.abs(
        detectedNoteNumber - stableNoteNumber
    );

    const isOctaveJump =
        noteDifference >= 12 &&
        noteDifference % 12 === 0;

    if (!isOctaveJump) {
        
        stableFrequency = frequency;

        octaveCandidateNote = null;
        octaveCandidateCount = 0;

        return frequency;
    }

    if (octaveCandidateNote === detectedNoteNumber) {

        octaveCandidateCount++;

    } else {

        octaveCandidateNote = detectedNoteNumber;
        octaveCandidateCount = 1;
    }

    if (
        octaveCandidateCount >=
        OCTAVE_CONFIRMATION_READINGS
    ) {

        stableFrequency = frequency;

        octaveCandidateNote = null;
        octaveCandidateCount = 0;

        return frequency;
    }

    return stableFrequency;
}





function stabilizeNoteChange(frequency) {

    const detectedNoteNumber = Math.round(
        12 * Math.log2(
            frequency / referenceA4
        ) + 69
    );

    if (trackedNoteNumber === null) {

        trackedNoteNumber = detectedNoteNumber;
        acceptedNoteFrequency = frequency;

        pendingNoteNumber = null;
        pendingNoteCount = 0;

        return frequency;
    }

    if (detectedNoteNumber === trackedNoteNumber) {

        acceptedNoteFrequency = frequency;

        pendingNoteNumber = null;
        pendingNoteCount = 0;

        return frequency
    }

    const noteDifference = Math.abs(
        detectedNoteNumber - trackedNoteNumber
    );

    const isConfirmedOctaveChange = 
        noteDifference >= 12 &&
        noteDifference % 12 === 0;

    if (isConfirmedOctaveChange) {

        trackedNoteNumber = detectedNoteNumber;
        acceptedNoteFrequency = frequency;

        frequencyHistory = [];

        pendingNoteNumber = null;
        pendingNoteCount = 0;

        return frequency;
    }

    if (pendingNoteNumber === detectedNoteNumber) {

        pendingNoteCount++;

    } else {

        pendingNoteNumber = detectedNoteNumber;
        pendingNoteCount = 1;

    }

    if (
        pendingNoteCount >=
        NOTE_CHANGE_CONFIRMATION_READINGS
    ) {

        trackedNoteNumber = detectedNoteNumber;
        acceptedNoteFrequency = frequency;

        frequencyHistory = [];

        pendingNoteNumber = null;
        pendingNoteCount = 0;

        return frequency;
    }

    return acceptedNoteFrequency;
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
        tuningStatus.className = "almost-tuned";
    
    } else if (cents > 15) {

        tuningStatus.textContent = "Muito agudo";
        tuningStatus.className = "out-of-tune";
    
    } else {

        tuningStatus.textContent = "Um pouco agudo";
        tuningStatus.className = "almost-tuned";
    }
}





function stopStringRepeat() {

    if (stringRepeatIntervalId !== null) {

        clearInterval(
            stringRepeatIntervalId
        );

        stringRepeatIntervalId = null;
    }

    if (activeRepeatButton !== null) {

        activeRepeatButton.textContent = "↻";

        activeRepeatButton.classList.remove(
            "active"
        );

        activeRepeatButton.setAttribute(
            "aria-pressed",
            "false"
        );

        activeRepeatButton.title =
            "Repetir a cada quatro tempos";
    }

    activeRepeatButton = null;
}





function toggleStringRepeat(
    stringData,
    repeatButton
) {

    const isAlreadyRepeating = activeRepeatButton === repeatButton && stringRepeatIntervalId !== null;

    if (isAlreadyRepeating) {
        
        stopStringRepeat();

        return;
    }

    stopStringRepeat();

    activeRepeatButton = repeatButton;

    repeatButton.textContent = "■";

    repeatButton.classList.add("active");

    repeatButton.setAttribute("aria-pressed", "true");

    repeatButton.title = "Parar repetição";

    playReferenceTone(stringData.noteNumber);

    stringRepeatIntervalId = setInterval(function () {

        playReferenceTone(stringData.noteNumber);
    },

        STRING_REPEAT_INTERVAL
    );
}





function stopReferenceTone() {

    activeReferenceOscillators.forEach(
        function (oscillator) {

            try {
                oscillator.stop();
            } catch (error) {

            }
        }
    );

    activeReferenceOscillators = [];
}





async function playReferenceTone(noteNumber) {
    
    const AudioContextClass = 
    window.AudioContext ||
    window.webkitAudioContext;

    if (
        referenceAudioContext === null ||
        referenceAudioContext.state === "closed"
    ) {
        referenceAudioContext = 
            new AudioContextClass();
    }

    if (
        referenceAudioContext.state === 
        "suspended"
    ) {

        await referenceAudioContext.resume();
    }

    stopReferenceTone();

    const frequency = noteNumberToFrequency(noteNumber);

    const now = referenceAudioContext.currentTime;

    const fundamental = referenceAudioContext.createOscillator();

    const harmonic = referenceAudioContext.createOscillator();

    const masterGain = referenceAudioContext.createGain();
    
    const harmonicGain = referenceAudioContext.createGain();

    fundamental.type = "triangle";

    fundamental.frequency.setValueAtTime(frequency, now);

    harmonic.type = "sine";

    harmonic.frequency.setValueAtTime(frequency * 2, now);

    harmonicGain.gain.setValueAtTime(0.12, now);

    masterGain.gain.setValueAtTime(0.0001, now);

    masterGain.gain.exponentialRampToValueAtTime(0.32, now + 0.02);

    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + REFERENCE_TONE_DURATION);

    fundamental.connect(masterGain);

    harmonic.connect(harmonicGain);
    harmonicGain.connect(masterGain);

    masterGain.connect(referenceAudioContext.destination);

    fundamental.start(now);
    harmonic.start(now);

    fundamental.stop(now + REFERENCE_TONE_DURATION);

    harmonic.stop(now + REFERENCE_TONE_DURATION);

    activeReferenceOscillators = [fundamental, harmonic];

    ignoreMicrophoneUntil = performance.now() + REFERENCE_TONE_DURATION * 1000 + 150;
}*/
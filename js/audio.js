import {
    REFERENCE_TONE_DURATION,
    REFERENCE_SAMPLE_A4,
    STRING_REPEAT_INTERVAL
} from "./config.js";

import {
    appState,
    referenceSoundState
} from "./state.js";

import {
    noteNumberToFrequency
} from "./pitchDetector.js";





//CRIAÇÃO DO AUDIO CONTEXT

async function getReferenceAudioContext() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        throw new Error("A Web Audio API não é suportada neste navegador");
    }

    if (referenceSoundState.audioContext === null || referenceSoundState.audioContext.state === "closed") {
        referenceSoundState.audioContext = new AudioContextClass();

    }

    if (referenceSoundState.audioContext.state === "suspended") {
        await referenceSoundState.audioContext.resume();

    }

    return referenceSoundState.audioContext;
}





//PARAR O SOM ATUAL

function stopCurrentPlayback() {
    referenceSoundState.activeOscillators.forEach(function (oscillator) {

        try {
            oscillator.stop();

        } catch (error) {

        }

        try {
            oscillator.disconnect();

        } catch (error) {

        }
    });

    referenceSoundState.activeOscillators = [];

    if (referenceSoundState.activeSampleSource !== null) {
        try {
            referenceSoundState.activeSampleSource.stop();

        } catch (error) {

        }

        try {
            referenceSoundState.activeSampleSource.disconnect();

        } catch (error) {

        }

        referenceSoundState.activeSampleSource = null;
    }
}



export function stopReferenceSound() {
    referenceSoundState.playbackRequestId++;

    stopCurrentPlayback();

    appState.ignoreMicrophoneUntil = 0;
}





//CARREGAMENTO DOS ARQUIVOS DE ÁUDIO

async function loadAudioBuffer(audioPath, audioContext) {
    if (referenceSoundState.sampleCache.has(audioPath)) {
        return await referenceSoundState.sampleCache.get(audioPath);

    }

    const loadingPromise = fetch(audioPath).then(function (response) {
        if (!response.ok) {
            throw new Error("Não foi possível carregar " + audioPath);

        }

        return response.arrayBuffer();

    }).then(
        function (arrayBuffer) {
            return audioContext.decodeAudioData(arrayBuffer);

        }
    );

    referenceSoundState.sampleCache.set(audioPath, loadingPromise);

    try {
        return await loadingPromise;

    } catch (error) {
        referenceSoundState.sampleCache.delete(audioPath);

        throw error;
    }
}





//SOM ELETRÔNICO 

function playSynthesizedTone(stringData, audioContext) {
    const frequency = noteNumberToFrequency(stringData.noteNumber);

    const now = audioContext.currentTime;

    const fundamental = audioContext.createOscillator();

    const harmonic = audioContext.createOscillator();

    const masterGain = audioContext.createGain();

    const harmonicGain = audioContext.createGain();

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

    masterGain.connect(audioContext.destination);

    fundamental.start(now);
    harmonic.start(now);

    fundamental.stop(now + REFERENCE_TONE_DURATION);

    harmonic.stop(now + REFERENCE_TONE_DURATION);

    referenceSoundState.activeOscillators = [fundamental, harmonic];

    appState.ignoreMicrophoneUntil = performance.now() + REFERENCE_TONE_DURATION * 1000 + 150;
}





//REPRODUÇÃO DE ÁUDIO GRAVADO

async function playRecordedSample(stringData, audioContext, requestId) {
    const audioBuffer = await loadAudioBuffer(stringData.audioPath, audioContext);

    if (requestId !== referenceSoundState.playbackRequestId) {

        return;
    }

    const source = audioContext.createBufferSource();

    const gain = audioContext.createGain();

    source.buffer = audioBuffer;

    const playbackRate = appState.referenceA4 / REFERENCE_SAMPLE_A4;

    source.playbackRate.setValueAtTime(playbackRate, audioContext.currentTime);

    const naturalDuration = audioBuffer.duration / playbackRate;

    const playbackDuration = Math.min(naturalDuration, REFERENCE_TONE_DURATION);

    const now = audioContext.currentTime;

    gain.gain.setValueAtTime(0.8, now + Math.max(0, playbackDuration - 0.06));

    gain.gain.linearRampToValueAtTime(0.0001, now + playbackDuration);

    source.connect(gain);

    gain.connect(audioContext.destination);

    referenceSoundState.activeSampleSource = source;

    source.onended = function () {
        if (referenceSoundState.activeSampleSource === source) {
            referenceSoundState.activeSampleSource = null;

        } try {
            source.disconnect();
            gain.disconnect();

        } catch (error) {

        }
    };

    source.start(now);

    source.stop(now + playbackDuration);

    appState.ignoreMicrophoneUntil = performance.now() + playbackDuration * 1000 + 150;

}





//FUNÇÃO PRINCIPAL DE REPRODUÇÃO

export async function playStringSound(stringData) {
    if (!appState.referenceSoundEnabled) {
        return;

    }

    const requestId = ++referenceSoundState.playbackRequestId;

    stopCurrentPlayback();

    let audioContext;

    try {
        audioContext = await getReferenceAudioContext();

    } catch (error) {
        console.error("Erro ao iniciar o sistema de áudio:", error);
        return;

    }

    if (requestId !== referenceSoundState.playbackRequestId) {
        return;

    }

    if (stringData.audioPath) {

        try {
            await playRecordedSample(stringData, audioContext, requestId);

            return;

        } catch (error) {
            console.warn(
                "O áudio da corda não pode ser carregado. " +
                "O som eletrônico será utilizado. ",
                error
            );
        }
    }

    if (requestId !== referenceSoundState.playbackRequestId) {
        return;

    } 

    playSynthesizedTone(stringData, audioContext);
}





//REPETIÇÃO DA CORDA

export function stopStringRepeat() {
   referenceSoundState.repeatSessionId++;

   if ( referenceSoundState.repeatTimeoutId !== null) {
        clearTimeout(referenceSoundState.repeatTimeoutId);

        referenceSoundState.repeatTimeoutId = null;
   }

   const repeatButton = referenceSoundState.activeRepeatButton;

   if (repeatButton !== null) {
        repeatButton.textContent = "↻";

        repeatButton.classList.remove("active");

        repeatButton.setAttribute("aria-pressed", "false");

        repeatButton.title = "Iniciar repetição";
    }

    referenceSoundState.activeRepeatButton = null

    stopReferenceSound();

}



export function toggleStringRepeat(stringData, repeatButton) {

    const isAlreadyRepeating = referenceSoundState.activeRepeatButton === repeatButton && referenceSoundState.repeatTimeoutId !== null;

    if (isAlreadyRepeating) {
        stopStringRepeat();

        return;
    }

    stopStringRepeat();

    referenceSoundState.activeRepeatButton = repeatButton;

    repeatButton.textContent = "■";

    repeatButton.classList.add("active");

    repeatButton.setAttribute("aria-pressed", "true");

    repeatButton.title = "Parar repetição";

    const currentRepeatSession = ++referenceSoundState.repeatSessionId;

    let nextPlayBackTime = performance.now();

    function playAndScheduleNext() {
        if (currentRepeatSession !== referenceSoundState.repeatSessionId) {
            return;
        }

        playStringSound(stringData);

        nextPlayBackTime += STRING_REPEAT_INTERVAL;

        const delay = Math.max(0, nextPlayBackTime - performance.now());

        referenceSoundState.repeatTimeoutId = setTimeout(playAndScheduleNext, delay);

    }

    playAndScheduleNext();
}





//ENCERRAMENTO DO SISTEMA DE ÁUDIO 

export function closeReferenceAudio() {
    stopStringRepeat();

    stopReferenceSound();

    if (referenceSoundState.audioContext !== null && referenceSoundState.audioContext.state !== "closed") {
        referenceSoundState.audioContext.close();

    }

    referenceSoundState.audioContext = null;

    referenceSoundState.sampleCache.clear();

    appState.ignoreMicrophoneUntil = 0;
}
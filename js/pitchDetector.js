import {
    MIN_FREQUENCY,
    MAX_FREQUENCY,
    NOTE_NAMES,
    NSDF_MIN_CLARITY,
    NSDF_PEAK_RATIO,
    OCTAVE_CONFIRMATION_READINGS,
    NOTE_CHANGE_CONFIRMATION_READINGS
} from "./config.js";

import {
    appState,
    pitchState
} from "./state.js";





// LIMPEZA DO DETECTOR

export function resetPitchState() {

    pitchState.frequencyHistory = [];

    pitchState.trackedNoteNumber = null;

    pitchState.stableFrequency = null;

    pitchState.octaveCandidateNote = null;
    pitchState.octaveCandidateCount = 0;

    pitchState.acceptedNoteFrequency = null;

    pitchState.pendingNoteNumber = null;
    pitchState.pendingNoteCount = 0;
}





// NÚMERO DA NOTA PARA FREQUÊNCIA

export function noteNumberToFrequency(noteNumber) {

    return (appState.referenceA4 * Math.pow(2, (noteNumber - 69) / 12)
    );
}





//CONVERSÕES MUSICAIS

export function frequencyToNote(frequency) {

    const noteNumber = Math.round(12 * Math.log2(frequency / appState.referenceA4) + 69);

    const noteIndex = ((noteNumber % 12) + 12) % 12;

    const noteName = NOTE_NAMES[noteIndex];

    const octave = Math.floor(noteNumber / 12) - 1;

    const perfectFrequency = noteNumberToFrequency(noteNumber);

    const cents = 1200 * Math.log2(frequency / perfectFrequency);

    return {
        name: noteName,
        octave: octave,
        frequency: perfectFrequency,
        cents: cents,
        noteNumber: noteNumber
    };
}



export function frequencyToSelectedString(frequency) {

    if (appState.selectedString === null) {

        return null;
    }

    const targetFrequency = noteNumberToFrequency(appState.selectedString.noteNumber);

    const cents = 1200 * Math.log2(frequency / targetFrequency);

    return {
        name: appState.selectedString.name,

        frequency: targetFrequency,

        cents: cents
    };
}





//DETECÇÃO DE FREQUÊNCIA

export function autoCorrelate(buffer, sampleRate) {
    
    const SIZE = buffer.length;

    const minSamples = Math.max(1, Math.floor(sampleRate / MAX_FREQUENCY));

    const maxSamples = Math.min(SIZE - 2, Math.floor(sampleRate / MIN_FREQUENCY));

    let bestOffset = -1;

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

        for (let i = 0; i < SIZE - tau; i++) {
            
            acf += buffer[i] * buffer[i + tau];

            divisor += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
        }

        nsdf[tau] = divisor > 0 ? (2 * acf) / divisor : 0;
    }

    let highestPeak = 0;

    for (let tau = minSamples + 1; tau < maxSamples; tau++) {

        const isLocalPeak = nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1];

        if (isLocalPeak && nsdf[tau] > highestPeak) {
            
            highestPeak = nsdf[tau];
        }
    }

    if (highestPeak < NSDF_MIN_CLARITY) {

        return -1;
    }

    const peakThreshold = highestPeak * NSDF_PEAK_RATIO;

    for (let tau = minSamples + 1; tau < maxSamples; tau++) {

        const isLocalPeak = nsdf[tau] > nsdf[tau - 1] && nsdf[tau] >= nsdf[tau +1];

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

    return (sampleRate / betterOffset);

}





//ESTABILAZAÇÃO DA LEITURA

export function stabilizeOctave(frequency) {

    const detectedNoteNumber = Math.round(12 * Math.log2(frequency / appState.referenceA4) + 69);

    if (pitchState.stableFrequency === null) {

        pitchState.stableFrequency = frequency;

        return frequency;
    }

    const stableNoteNumber = Math.round(12 * Math.log2(pitchState.stableFrequency / appState.referenceA4) + 69);

    const noteDifference = Math.abs(detectedNoteNumber - stableNoteNumber);

    const isOctaveJump = noteDifference >= 12 && noteDifference % 12 === 0;

    if (!isOctaveJump) {

        pitchState.stableFrequency = frequency;

        pitchState.octaveCandidateNote = null;

        pitchState.octaveCandidateCount = 0;

        return frequency;
    }

    if (pitchState.octaveCandidateNote === detectedNoteNumber) {

        pitchState.octaveCandidateCount++;
        
    } else {

        pitchState.octaveCandidateNote = detectedNoteNumber;
    
        pitchState.octaveCandidateCount = 1;
    }

    if (pitchState.octaveCandidateCount >= OCTAVE_CONFIRMATION_READINGS) {

        pitchState.stableFrequency = frequency;

        pitchState.octaveCandidateNote = null;

        pitchState.octaveCandidateCount = 0;

        return frequency;
    }

    return pitchState.stableFrequency;
}



export function stabilizeNoteChange(frequency) {
    
    const detectedNoteNumber = Math.round(12 * Math.log2(frequency / appState.referenceA4) + 69);

    if (pitchState.trackedNoteNumber === null) {
        
        pitchState.trackedNoteNumber = detectedNoteNumber;

        pitchState.acceptedNoteFrequency = frequency;

        pitchState.pendingNoteNumber = null

        pitchState.pendingNoteCount = 0;

        return frequency;
    }

    if (detectedNoteNumber === pitchState.trackedNoteNumber) {

        pitchState.acceptedNoteFrequency = frequency;

        pitchState.pendingNoteNumber = null

        pitchState.pendingNoteCount = 0;

        return frequency;
    }

    const noteDifference = Math.abs(detectedNoteNumber - pitchState.trackedNoteNumber);

    const isConfirmedOctaveChange = noteDifference >= 12 && noteDifference % 12 === 0;

    if (isConfirmedOctaveChange) {

        pitchState.trackedNoteNumber = detectedNoteNumber;

        pitchState.acceptedNoteFrequency = frequency;

        pitchState.frequencyHistory = [];

        pitchState.pendingNoteNumber = null;

        pitchState.pendingNoteCount = 0;

        return frequency;
    }

    if (pitchState.pendingNoteNumber === detectedNoteNumber) {

        pitchState.pendingNoteCount++;

    } else {
        
        pitchState.pendingNoteNumber = detectedNoteNumber;

        pitchState.pendingNoteCount = 1;
    }

    if (pitchState.pendingNoteCount >= NOTE_CHANGE_CONFIRMATION_READINGS) {

        pitchState.trackedNoteNumber = detectedNoteNumber;

        pitchState.acceptedNoteFrequency = frequency;

        pitchState.frequencyHistory = [];

        pitchState.pendingNoteNumber = null;

        pitchState.pendingNoteCount = 0;

        return frequency;
    }

    return (pitchState.acceptedNoteFrequency);
}


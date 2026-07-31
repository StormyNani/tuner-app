// CONFIGURAÇÕES DO DETECTOR

export const MIN_FREQUENCY = 40;
export const MAX_FREQUENCY = 1200;

export const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#",
"G", "G#", "A", "A#", "B"]

export const SMOOTHING_SAMPLES = 5;

export const NSDF_MIN_CLARITY = 0.6;
export const NSDF_PEAK_RATIO = 0.9;

export const OCTAVE_CONFIRMATION_READINGS = 3;
export const NOTE_CHANGE_CONFIRMATION_READINGS = 3;

export const PITCH_ANALYSIS_INTERVAL = 50;
export const SILENCE_HOLD_TIME = 300;



// CONFIGURAÇÕES DOS SONS DE REFERÊNCIA

export const REFERENCE_TONE_DURATION = 1.4; 


export const REFERENCE_SAMPLE_A4 = 442;

export const STRING_REPEAT_BPM = 160;
export const STRING_REPEAT_BEATS = 4;

export const STRING_REPEAT_INTERVAL = (60000 / STRING_REPEAT_BPM) * STRING_REPEAT_BEATS;



// MODOS DO AFINADOR

export const TUNER_MODES = {

    chromatic: {
        title: "Afinador cromático",
        strings: []
    },

    guitar: {
        title: "Afinador de violão",

        strings: [
            { name: "E4", noteNumber: 64, thickness: 2, audioPath: null },
            { name: "B3", noteNumber: 59, thickness: 3, audioPath: null },
            { name: "G3", noteNumber: 55, thickness: 4, audioPath: null },
            { name: "D3", noteNumber: 50, thickness: 5, audioPath: null },
            { name: "A2", noteNumber: 45, thickness: 6, audioPath: null },
            { name: "E2", noteNumber: 40, thickness: 7, audioPath: null }
        ]
    },

    ukulele: {
        title: "Afinador de ukulele",

        strings: [
            { name: "A4", noteNumber: 69, thickness: 2, audioPath: null },
            { name: "E4", noteNumber: 64, thickness: 3, audioPath: null },
            { name: "C4", noteNumber: 60, thickness: 5, audioPath: null },
            { name: "G4", noteNumber: 67, thickness: 2, audioPath: null }
        ]
    },

    violin: {
        title: "Afinador de violino",

        strings: [
            { name: "E5", noteNumber: 76, thickness: 2, audioPath: null },
            { name: "A4", noteNumber: 69, thickness: 3, audioPath: null },
            { name: "D4", noteNumber: 62, thickness: 4, audioPath: null },
            { name: "G3", noteNumber: 55, thickness: 5, audioPath: null }
        ]
    }
};
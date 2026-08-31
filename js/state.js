// ESTADO GERAL DO APLICATIVO

export const appState = {

    currentTunerMode: null,
    selectedString: null,

    settingsOpen: false,

    referenceA4: 442,

    noteNameStyle: "letters",
    accidentalStyle: "sharps",

    showTechnicalInfo: false,
    referenceSoundEnabled: true,

    lastDetectedNote: null,

    tunerRunning: false,
    tunerSessionId: 0,

    animationFrameId: null,

    lastPitchAnalysisTime: 0,
    lastValidFrequencyTime: 0,

    ignoreMicrophoneUntil: 0
};



// ESTADO DO MICROFONE

export const microphoneState = {

    analyser: null,
    dataArray: null,
    audioContext: null,

    audioSource: null,
    microphoneStream: null
};



// ESTADO DO DETECTOR DE NOTAS

export const pitchState = {

    frequencyHistory: [],

    trackedNoteNumber: null,

    stableFrequency: null,

    octaveCandidateNote: null,
    octaveCandidateCount: 0,

    acceptedNoteFrequency: null,

    pendingNoteNumber: null,
    pendingNoteCount: 0,
};



// ESTADO DOS SONS DE REFERÊNCIA

export const referenceSoundState = {

    audioContext: null,

    activeOscillators: [],

    activeSampleSource: null,

    repeatTimeoutId: null,
    repeatSessionId: 0,

    activeRepeatButton: null,

    sampleCache: new Map(),

    playbackRequestId: 0
};



// ESTADO DO METRÔNOMO

export const metronomeState = {
    
    running: false,

    bpm: 100,

    currentBeat: 0,

    beatsPerMeasure: 4,

    beatStrenghts: [],

    subdivision: 1,

    timeSignature: "4/4",

    volume: 1,

    audioContext: null,

    schedulerTimerId: null,

    animationFrameId: null,

    nextBeatTime: 0
};
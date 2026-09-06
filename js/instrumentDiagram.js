const SVG_NS =
    "http://www.w3.org/2000/svg";




function createSvgElement(
    tagName,
    attributes = {}
) {

    const element =
        document.createElementNS(
            SVG_NS,
            tagName
        );


    Object.entries(
        attributes
    ).forEach(
        function ([name, value]) {

            element.setAttribute(
                name,
                String(value)
            );
        }
    );


    return element;
}




function createNoteButton(
    stringData,
    formatFullNoteName,
    onSelect
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "instrumentString diagramNoteButton";


    button.dataset.noteNumber =
        String(
            stringData.noteNumber
        );


    button.setAttribute(
        "aria-pressed",
        "false"
    );


    button.setAttribute(
        "aria-label",
        "Selecionar corda " +
        stringData.name
    );


    const note =
        document.createElement(
            "span"
        );


    note.className =
        "stringNote";


    note.dataset.originalName =
        stringData.name;


    note.textContent =
        formatFullNoteName(
            stringData.name
        );


    button.appendChild(
        note
    );


    button.addEventListener(
        "click",
        function () {

            onSelect(
                stringData,
                button
            );
        }
    );


    return button;
}




function createStringColumn(
    strings,
    formatFullNoteName,
    onSelect,
    buttonByNoteNumber
) {

    const column =
        document.createElement(
            "div"
        );


    column.className =
        "diagramStringColumn";


    strings.forEach(
        function (stringData) {

            const button =
                createNoteButton(
                    stringData,
                    formatFullNoteName,
                    onSelect
                );


            buttonByNoteNumber.set(
                stringData.noteNumber,
                button
            );


            column.appendChild(
                button
            );
        }
    );


    return column;
}




function createGuitarSvg(
    lowToHighStrings,
    buttonByNoteNumber,
    onSelect
) {

    const svg =
        createSvgElement(
            "svg",
            {
                viewBox: "0 0 300 500",
                role: "img",
                "aria-label":
                    "Cabeça do violão com seis cordas"
            }
        );


    svg.classList.add(
        "guitarDiagramSvg"
    );


    /*
        PESCOÇO DO VIOLÃO
    */

    const neck =
        createSvgElement(
            "path",
            {
                d:
                    "M116 420 " +
                    "L184 420 " +
                    "L190 500 " +
                    "L110 500 Z"
            }
        );


   


    neck.classList.add(
        "guitarNeck"
    );


    svg.appendChild(
        neck
    );



    /*
        CORPO DA CABEÇA
    */

    const headstock =
        createSvgElement(
            "path",
            {
                d:
                    "M88 42 " +

                    "Q150 18 212 42 " +

                    "Q224 48 226 68 " +

                    "L232 310 " +

                    "Q233 340 211 368 " +

                    "L190 430 " +

                    "L110 430 " +

                    "L89 368 " +

                    "Q67 340 68 310 " +

                    "L74 68 " +

                    "Q76 48 88 42 Z"
            }
        );



    headstock.classList.add(
        "guitarHeadstockBody"
    );


    svg.appendChild(
        headstock
    );



    /*
        DETALHE INTERNO

        Não tem função no afinador.
        É apenas para o desenho não
        parecer uma forma chapada.
    */

    const innerDetail =
        createSvgElement(
            "path",
            {
                d:
                    "M104 78 " +

                    "Q150 56 196 78 " +

                    "L204 310 " +

                    "Q205 334 188 354 " +

                    "L174 398 " +

                    "L126 398 " +

                    "L112 354 " +

                    "Q95 334 96 310 Z"
            }
    );

    innerDetail.classList.add("guitarHeadstockInner");

    svg.appendChild(innerDetail);


    /*CAVIDADES DA CABEÇA DO VIOLÃO CLÁSSICO */

    const leftSlot = createSvgElement(
        "rect",
            {
                x: 104,
                y: 103,

                width: 27,
                height: 220,

                rx: 13
            }
    );


    leftSlot.classList.add("guitarHeadstockSlot");

    const rightSlot = createSvgElement(
        "rect",
            {
                x: 169,
                y: 103,

                width: 27,
                height: 220,

                rx: 13
            }   
    );

    rightSlot.classList.add("guitarHeadstockSlot");

    svg.appendChild(leftSlot);

    svg.appendChild(rightSlot);


    /*
        PESTANA
    */

    const nut =
        createSvgElement(
            "line",
            {
                x1: 112,
                y1: 448,

                x2: 188,
                y2: 448
            }
        );


    nut.classList.add(
        "guitarNut"
    );



    /*
        POSIÇÕES DAS CORDAS

        0 = E2
        1 = A2
        2 = D3
        3 = G3
        4 = B3
        5 = E4

        As cordas agora têm muito
        mais espaço entre si.
    */

    const positions = [

    {
        stringData:
            lowToHighStrings[0],

        startX: 124,

        pegX: 78,
        pegY: 330
    },

    {
        stringData:
            lowToHighStrings[1],

        startX: 134,

        pegX: 78,
        pegY: 235
    },

    {
        stringData:
            lowToHighStrings[2],

        startX: 144,

        pegX: 78,
        pegY: 140
    },

    {
        stringData:
            lowToHighStrings[3],

        startX: 156,

        pegX: 222,
        pegY: 140
    },

    {
        stringData:
            lowToHighStrings[4],

        startX: 166,

        pegX: 222,
        pegY: 235
    },

    {
        stringData:
            lowToHighStrings[5],

        startX: 176,

        pegX: 222,
        pegY: 330
    }
];


    /*
        FUNÇÃO AUXILIAR PARA
        SELECIONAR UMA CORDA
        PELO SVG
    */

    function selectSvgString(
        element,
        stringData
    ) {

        element.addEventListener(
            "click",
            function () {

                const button =
                    buttonByNoteNumber.get(
                        stringData.noteNumber
                    );


                onSelect(
                    stringData,
                    button
                );
            }
        );
    }



    positions.forEach(
        function (position) {

            const stringData =
                position.stringData;


            if (!stringData) {
                return;
            }


            const noteNumber =
                String(
                    stringData.noteNumber
                );


            const isLeft =
                position.pegX < 150;



            /*
                ÁREA DE CLIQUE
                DA CORDA

                Ela é invisível e bem
                mais grossa que a corda.
            */

            const hitLine =
                createSvgElement(
                    "line",
                    {
                        x1:
                            position.startX,

                        y1: 448,

                        x2:
                            position.pegX,

                        y2:
                            position.pegY
                    }
                );


            hitLine.classList.add(
                "diagramStringHit"
            );


            hitLine.dataset.noteNumber =
                noteNumber;


            selectSvgString(
                hitLine,
                stringData
            );



            /*
                CORDA ENTRE
                PESTANA E TARRAXA
            */

            const stringLine =
                createSvgElement(
                    "line",
                    {
                        x1:
                            position.startX,

                        y1: 448,

                        x2:
                            position.pegX,

                        y2:
                            position.pegY,

                        "stroke-width":
                            Math.max(
                                1.3,
                                stringData.thickness *
                                0.42
                            )
                    }
                );


            stringLine.classList.add(
                "diagramStringLine",
                "diagramStringPart"
            );


            stringLine.dataset.noteNumber =
                noteNumber;



            /*
                CONTINUAÇÃO DA CORDA
                NO BRAÇO DO VIOLÃO
            */

            const neckString =
                createSvgElement(
                    "line",
                    {
                        x1:
                            position.startX,

                        y1: 448,

                        x2:
                            position.startX,

                        y2: 500,

                        "stroke-width":
                            Math.max(
                                1.3,
                                stringData.thickness *
                                0.42
                            )
                    }
                );


            neckString.classList.add(
                "diagramStringLine",
                "diagramStringPart"
            );


            neckString.dataset.noteNumber =
                noteNumber;



            /*
                HASTE DA TARRAXA
            */

            const pegStem =
                createSvgElement(
                    "line",
                    {
                        x1:
                            position.pegX,

                        y1:
                            position.pegY,

                        x2:
                            isLeft
                                ? 58
                                : 242,

                        y2:
                            position.pegY
                    }
                );


            pegStem.classList.add(
                "diagramPegStem",
                "diagramStringPart"
            );


            pegStem.dataset.noteNumber =
                noteNumber;


            selectSvgString(
                pegStem,
                stringData
            );



            /*
                PEÇA EXTERNA DA TARRAXA
            */

            const pegKnob =
                createSvgElement(
                    "rect",
                    {
                        x:
                            isLeft
                                ? 28
                                : 242,

                        y:
                            position.pegY - 14,

                        width: 30,
                        height: 28,

                        rx: 8
                    }
                );


            pegKnob.classList.add(
                "diagramPegKnob",
                "diagramStringPart"
            );


            pegKnob.dataset.noteNumber =
                noteNumber;


            selectSvgString(
                pegKnob,
                stringData
            );



            /*
                PINO DA TARRAXA
            */

            const peg =
                createSvgElement(
                    "circle",
                    {
                        cx:
                            position.pegX,

                        cy:
                            position.pegY,

                        r: 11
                    }
                );


            peg.classList.add(
                "diagramPeg",
                "diagramStringPart"
            );


            peg.dataset.noteNumber =
                noteNumber;


            selectSvgString(
                peg,
                stringData
            );



            svg.appendChild(
                hitLine
            );


            svg.appendChild(
                stringLine
            );


            svg.appendChild(
                neckString
            );


            svg.appendChild(
                pegStem
            );


            svg.appendChild(
                pegKnob
            );


            svg.appendChild(
                peg
            );
        }
    );


    /*
        A pestana entra por último
        para ficar visualmente por
        cima das cordas.
    */

    svg.appendChild(
        nut
    );


    return svg;
}




export function renderGuitarDiagram({container, strings, formatFullNoteName, onSelect, onRepeat}) {

    container.innerHTML = "";

    container.classList.add("instrumentDiagramContainer");

    /*
        O desenho do violão exige exatamente seis cordas.
    */

    if (!Array.isArray(strings) || strings.length !== 6) {

        return null;
    }

    /*
        Atualmente o config está:

        E4
        B3
        G3
        D3
        A2
        E2

        Aqui invertemos para:

        E2
        A2
        D3
        G3
        B3
        E4
    */

    const lowToHighStrings =
        [...strings].reverse();



    const leftStrings = [

        lowToHighStrings[2],

        lowToHighStrings[1],

        lowToHighStrings[0]
    ];



    const rightStrings = [

        lowToHighStrings[3],

        lowToHighStrings[4],

        lowToHighStrings[5]
    ];



    const buttonByNoteNumber =
        new Map();



    const diagram =
        document.createElement(
            "div"
        );


    diagram.className =
        "guitarDiagram";



    const leftColumn =
        createStringColumn(
            leftStrings,
            formatFullNoteName,
            onSelect,
            buttonByNoteNumber
        );



    const rightColumn =
        createStringColumn(
            rightStrings,
            formatFullNoteName,
            onSelect,
            buttonByNoteNumber
        );



    const svg =
        createGuitarSvg(
            lowToHighStrings,
            buttonByNoteNumber,
            onSelect
        );



    diagram.appendChild(
        leftColumn
    );


    diagram.appendChild(
        svg
    );


    diagram.appendChild(
        rightColumn
    );



    /*
        BOTÃO DE REPETIÇÃO
        ÚNICO DO DIAGRAMA
    */

    const repeatArea =
        document.createElement(
            "div"
        );


    repeatArea.className =
        "diagramRepeatArea";


    const repeatButton =
        document.createElement(
            "button"
        );


    repeatButton.type =
        "button";


    repeatButton.className =
        "stringRepeatButton diagramRepeatButton";


    repeatButton.textContent =
        "↻";


    repeatButton.hidden =
        true;


    repeatButton.title =
        "Repetir nota";


    repeatButton.setAttribute(
        "aria-label",
        "Repetir nota selecionada"
    );


    repeatButton.setAttribute(
        "aria-pressed",
        "false"
    );


    repeatButton.addEventListener(
        "click",
        function () {

            const noteNumber =
                Number(
                    repeatButton
                        .dataset
                        .noteNumber
                );


            const stringData =
                strings.find(
                    function (item) {

                        return (
                            item.noteNumber ===
                            noteNumber
                        );
                    }
                );


            if (!stringData) {
                return;
            }


            onRepeat(
                stringData,
                repeatButton
            );
        }
    );


    repeatArea.appendChild(
        repeatButton
    );


    container.appendChild(
        diagram
    );


    container.appendChild(
        repeatArea
    );



    /*
        Retornamos o botão da primeira
        corda do config.

        Atualmente é E4.
    */

    return {

        firstButton:
            buttonByNoteNumber.get(
                strings[0].noteNumber
            ),

        repeatButton:
            repeatButton
    };
}











function createOrchestralSvg(
    lowToHighStrings,
    buttonByNoteNumber,
    onSelect
) {

    const svg =
        createSvgElement(
            "svg",
            {
                viewBox: "0 0 300 430",

                role: "img",

                "aria-label":
                    "Cabeça de instrumento de quatro cordas"
            }
        );


    svg.classList.add(
        "orchestralDiagramSvg"
    );



    /*
        BRAÇO DO INSTRUMENTO
    */

    const neck =
        createSvgElement(
            "path",
            {
                d:
                    "M116 292 " +
                    "L184 292 " +
                    "L192 430 " +
                    "L108 430 Z"
            }
        );


    neck.classList.add(
        "orchestralNeck"
    );


    svg.appendChild(
        neck
    );



    /*
        CABEÇA / CAIXA DAS CRAVELHAS

        O formato agora é frontal,
        curto e largo, inspirado
        na referência.
    */

    const pegbox =
        createSvgElement(
            "path",
            {
                d:
                    "M136 22 " +

                    "L164 22 " +

                    "L164 39 " +

                    "Q164 45 171 48 " +

                    "L184 52 " +

                    "Q191 55 189 64 " +

                    "L186 77 " +

                    "Q184 87 174 92 " +

                    "L168 95 " +

                    "Q178 105 178 124 " +

                    "L184 295 " +

                    "L116 295 " +

                    "L122 124 " +

                    "Q122 105 132 95 " +

                    "L126 92 " +

                    "Q116 87 114 77 " +

                    "L111 64 " +

                    "Q109 55 116 52 " +

                    "L129 48 " +

                    "Q136 45 136 39 " +

                    "Z"     
            }
        );


    pegbox.classList.add(
        "orchestralPegboxBody"
    );


    svg.appendChild(
        pegbox
    );




    
    const voluteCrown =
        createSvgElement(
            "path",
            {
                d:
                /*
                    TOPO CENTRAL
                */
                "M136 10 " +
                "Q132 10 132 15 " +

                "L132 30 " +

                /*
                    PRIMEIRO DEGRAU
                    ESQUERDO
                */
                "L117 30 " +
                "Q113 30 113 34 " +

                "L113 47 " +

                /*
                    SEGUNDO DEGRAU
                    ESQUERDO
                */
                "L101 47 " +
                "Q92 47 97 52 " +

                "L92 78 " +

                "Q92 84 103 84 " +

                "L114 84 " +

                /*
                    RETORNO INTERNO
                    ESQUERDO
                */
                "L114 96 " +

                "Q114 101 120 103 " +

                "L131 106 " +

                "Q136 108 139 113 " +

                /*
                    PARTE INFERIOR
                    CENTRAL
                */
                "Q144 119 150 120 " +

                "Q156 119 161 113 " +

                "Q164 108 169 106 " +

                /*
                    RETORNO INTERNO
                    DIREITO
                */
                "L180 103 " +

                "Q186 101 186 96 " +

                "L186 84 " +

                /*
                    SEGUNDO DEGRAU
                    DIREITO
                */
                "L197 84 " +

                "Q208 84 208 78 " +

                "L203 52 " +

                "Q208 47 199 47 " +

                "L187 47 " +

                /*
                    PRIMEIRO DEGRAU
                    DIREITO
                */
                "L187 34 " +

                "Q187 30 183 30 " +

                "L168 30 " +

                /*
                    VOLTA AO TOPO
                */
                "L168 15 " +

                "Q168 10 164 10 " +

                "Z"
        }
    );


    voluteCrown.classList.add(
        "orchestralVoluteCrown"
    );


    svg.appendChild(
        voluteCrown
    );   






    /*
        DETALHE CENTRAL ESCURO

        Ajuda a dar profundidade
        e separa visualmente
        as quatro cordas.
    */

    const pegboxInner =
        createSvgElement(
            "rect",
            {
                x: 141,
                y: 112,

                width: 18,
                height: 158,

                rx: 8
            }
        );


    pegboxInner.classList.add(
        "orchestralPegboxInner"
    );


    svg.appendChild(
        pegboxInner
    );



    /*
        DUAS FAIXAS DISCRETAS

        Aproximam o visual daquela
        cabeça estilizada da referência.
    */

    const upperBar =
        createSvgElement(
            "line",
            {
                x1: 126,
                y1: 176,

                x2: 174,
                y2: 176
            }
        );


    upperBar.classList.add(
        "orchestralPegboxBar"
    );


    const lowerBar =
        createSvgElement(
            "line",
            {
                x1: 126,
                y1: 248,

                x2: 174,
                y2: 248
            }
        );


    lowerBar.classList.add(
        "orchestralPegboxBar"
    );


    svg.appendChild(
        upperBar
    );


    svg.appendChild(
        lowerBar
    );



    /*
        PESTANA
    */

    const nut =
        createSvgElement(
            "line",
            {
                x1: 114,
                y1: 326,

                x2: 186,
                y2: 326
            }
        );


    nut.classList.add(
        "orchestralNut"
    );



    /*
        POSIÇÃO DAS CORDAS

        Para violino:

        esquerda:
        D4
        G3

        direita:
        A4
        E5
    */

    const positions = [

        /*
            G - esquerda inferior
        */

        {
            stringData:
                lowToHighStrings[0],

            startX: 134,

            pegX: 120,
            pegY: 240
        },


        /*
            D - esquerda superior
        */

        {
            stringData:
                lowToHighStrings[1],

            startX: 145,

            pegX: 120,
            pegY: 160
        },


        /*
            A - direita superior
        */

        {
            stringData:
                lowToHighStrings[2],

            startX: 155,

            pegX: 180,
            pegY: 140
        },


        /*
            E - direita inferior
        */

        {
            stringData:
                lowToHighStrings[3],

            startX: 166,

            pegX: 180,
            pegY: 220
        }
    ];



    /*
        CLIQUE EM QUALQUER
        PARTE DA CORDA
    */

    function selectOrchestralString(
        element,
        stringData
    ) {

        element.addEventListener(
            "click",
            function () {

                const button =
                    buttonByNoteNumber.get(
                        stringData.noteNumber
                    );


                onSelect(
                    stringData,
                    button
                );
            }
        );
    }



    positions.forEach(
        function (position) {

            const stringData =
                position.stringData;


            if (!stringData) {
                return;
            }


            const noteNumber =
                String(
                    stringData.noteNumber
                );


            const isLeft =
                position.pegX < 150;



            /*
                ÁREA INVISÍVEL
                DE CLIQUE
            */

            const hitLine =
                createSvgElement(
                    "polyline",
                        {
                            points:
                                position.startX + ",326 " +
                                position.startX + ",282 " +
                                position.pegX + "," +
                                position.pegY,

                            fill: "none"
                        }
                );


            hitLine.classList.add(
                "diagramStringHit"
            );


            hitLine.dataset.noteNumber =
                noteNumber;


            selectOrchestralString(
                hitLine,
                stringData
            );



            /*
                CORDA VISÍVEL
            */

            const stringLine =
                createSvgElement(
                    "polyline",
                    {
                        points:
                            position.startX + ",326 " +
                            position.startX + ",282 " +
                            position.pegX + "," +
                            position.pegY,

                        fill: "none",

                        "stroke-linejoin":
                            "round",

                        "stroke-width":
                            Math.max(
                                1.4,
                                stringData.thickness *
                                0.5
                            )
                    }
                );


            stringLine.classList.add(
                "diagramStringLine",
                "diagramStringPart"
            );


            stringLine.dataset.noteNumber =
                noteNumber;



            /*
                CONTINUAÇÃO PELO BRAÇO
            */

            const neckString =
                createSvgElement(
                    "line",
                    {
                        x1:
                            position.startX,

                        y1: 326,

                        x2:
                            position.startX,

                        y2: 430,

                        "stroke-width":
                            Math.max(
                                1.4,
                                stringData.thickness *
                                0.5
                            )
                    }
                );


            neckString.classList.add(
                "diagramStringLine",
                "diagramStringPart"
            );


            neckString.dataset.noteNumber =
                noteNumber;



            /*
                HASTE DA CRAVELHA

                Mantemos grande,
                como no violão.
            */

            const pegStem =
                createSvgElement(
                    "line",
                    {
                        x1:
                            position.pegX,

                        y1:
                            position.pegY,

                        x2:
                            isLeft
                                ? 90
                                : 210,

                        y2:
                            position.pegY
                    }
                );


            pegStem.classList.add(
                "diagramPegStem",
                "diagramStringPart"
            );


            pegStem.dataset.noteNumber =
                noteNumber;


            selectOrchestralString(
                pegStem,
                stringData
            );



            /*
                PEÇA EXTERNA

                Mesmo estilo visual
                das tarraxas do violão.
            */

            const pegKnob =
                createSvgElement(
                    "ellipse",
                    {
                        cx:
                            isLeft
                                ? 72
                                : 228,

                        cy:
                            position.pegY,

                        rx: 18,
                        ry: 13
                    }
                );


            pegKnob.classList.add(
                "diagramPegKnob",
                "diagramStringPart"
            );


            pegKnob.dataset.noteNumber =
                noteNumber;


            selectOrchestralString(
                pegKnob,
                stringData
            );



            /*
                PINO DA CRAVELHA
            */

            const peg =
                createSvgElement(
                    "circle",
                    {
                        cx:
                            position.pegX,

                        cy:
                            position.pegY,

                        r: 10
                    }
                );


            peg.classList.add(
                "diagramPeg",
                "diagramStringPart"
            );


            peg.dataset.noteNumber =
                noteNumber;


            selectOrchestralString(
                peg,
                stringData
            );



            svg.appendChild(
                hitLine
            );


            svg.appendChild(
                stringLine
            );


            svg.appendChild(
                neckString
            );


            svg.appendChild(
                pegStem
            );


            svg.appendChild(
                pegKnob
            );


            svg.appendChild(
                peg
            );
        }
    );


    svg.appendChild(
        nut
    );


    return svg;
}



export function renderOrchestralDiagram(
    {
        container,
        strings,
        formatFullNoteName,
        onSelect,
        onRepeat
    }
) {

    container.innerHTML = "";


    container.classList.add(
        "instrumentDiagramContainer"
    );


    /*
        O MODELO ORQUESTRAL
        EXIGE QUATRO CORDAS.
    */

    if (
        !Array.isArray(strings) ||
        strings.length !== 4
    ) {

        return null;
    }



    /*
        O config está organizado
        da corda mais aguda
        para a mais grave.

        Invertemos para trabalhar:

        grave → aguda
    */

    const lowToHighStrings =
        [...strings].reverse();



    /*
        Exemplo no violino:

        lowToHigh:

        G3
        D4
        A4
        E5

        esquerda:
        D4
        G3

        direita:
        A4
        E5
    */

    const leftStrings = [

        lowToHighStrings[1],

        lowToHighStrings[0]
    ];


    const rightStrings = [

        lowToHighStrings[2],

        lowToHighStrings[3]
    ];



    const buttonByNoteNumber =
        new Map();



    const diagram =
        document.createElement(
            "div"
        );


    diagram.className =
        "orchestralDiagram";



    const leftColumn =
        createStringColumn(
            leftStrings,
            formatFullNoteName,
            onSelect,
            buttonByNoteNumber
        );


    const rightColumn =
        createStringColumn(
            rightStrings,
            formatFullNoteName,
            onSelect,
            buttonByNoteNumber
        );


    const svg =
        createOrchestralSvg(
            lowToHighStrings,
            buttonByNoteNumber,
            onSelect
        );



    diagram.appendChild(
        leftColumn
    );


    diagram.appendChild(
        svg
    );


    diagram.appendChild(
        rightColumn
    );



    /*
        REPETIÇÃO
    */

    const repeatArea =
        document.createElement(
            "div"
        );


    repeatArea.className =
        "diagramRepeatArea";


    const repeatButton =
        document.createElement(
            "button"
        );


    repeatButton.type =
        "button";


    repeatButton.className =
        "stringRepeatButton diagramRepeatButton";


    repeatButton.textContent =
        "↻";


    repeatButton.hidden =
        true;


    repeatButton.title =
        "Repetir nota";


    repeatButton.setAttribute(
        "aria-label",
        "Repetir nota selecionada"
    );


    repeatButton.setAttribute(
        "aria-pressed",
        "false"
    );


    repeatButton.addEventListener(
        "click",
        function () {

            const noteNumber =
                Number(
                    repeatButton
                        .dataset
                        .noteNumber
                );


            const stringData =
                strings.find(
                    function (item) {

                        return (
                            item.noteNumber ===
                            noteNumber
                        );
                    }
                );


            if (!stringData) {
                return;
            }


            onRepeat(
                stringData,
                repeatButton
            );
        }
    );


    repeatArea.appendChild(
        repeatButton
    );


    container.appendChild(
        diagram
    );


    container.appendChild(
        repeatArea
    );



    return {

        firstButton:
            buttonByNoteNumber.get(
                strings[0].noteNumber
            ),

        repeatButton:
            repeatButton
    };
}
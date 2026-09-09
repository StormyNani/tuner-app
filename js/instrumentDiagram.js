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




export function renderUkuleleDiagram({
    container,
    strings,
    formatFullNoteName,
    onSelect,
    onRepeat
}) {
    if (!Array.isArray(strings) || strings.length !== 4) {
        return null;
    }

    container.replaceChildren();
    container.classList.add("instrumentDiagramContainer");

    // Ordem física das cordas, da esquerda para a direita.
    // Não ordenar por frequência: o G4 é mais agudo que C4 e E4.
    const [a, e, c, g] = strings;

    const buttonByNoteNumber = new Map();

    const diagram = document.createElement("div");
    diagram.className = "ukuleleDiagram";

    const leftColumn = createStringColumn(
        [c, g],
        formatFullNoteName,
        onSelect,
        buttonByNoteNumber
    );

    const rightColumn = createStringColumn(
        [e, a],
        formatFullNoteName,
        onSelect,
        buttonByNoteNumber
    );

    const svg = createSvgElement("svg", {
        viewBox: "0 0 300 430",
        class: "ukuleleDiagramSvg",
        "aria-hidden": "true",
        focusable: "false"
    });

    function shape(tag, attributes, className) {
        const element = createSvgElement(tag, attributes);

        if (className) {
            element.setAttribute("class", className);
        }

        svg.appendChild(element);
        return element;
    }

    function selectable(element, stringData) {
        element.classList.add("diagramStringPart");
        element.dataset.noteNumber = String(stringData.noteNumber);

        element.addEventListener("click", function () {
            onSelect(
                stringData,
                buttonByNoteNumber.get(stringData.noteNumber)
            );
        });

        return element;
    }

    const positions = [
        { string: g, x: 108, y: 270, endX: 123, side: -1 },
        { string: c, x: 108, y: 140, endX: 141, side: -1 },
        { string: e, x: 192, y: 140, endX: 159, side: 1 },
        { string: a, x: 192, y: 270, endX: 177, side: 1 }
    ];

    // Hastes: desenhadas antes da madeira.
    positions.forEach(function (position) {
        const left = position.side === -1;

        selectable(
            shape("line", {
                x1: left ? 51 : 249,
                y1: position.y,
                x2: position.x,
                y2: position.y
            }, "ukuleleStem"),
            position.string
        );

        selectable(
            shape("rect", {
                x: left ? 27 : 243,
                y: position.y - 17,
                width: 30,
                height: 34,
                rx: 10
            }, "ukuleleKnob"),
            position.string
        );
    });

    // Pequeno trecho do braço.
    shape("path", {
        d: "M 113 340 L 187 340 L 191 420 L 109 420 Z"
    }, "ukuleleNeck");

    // Cabeça: topo elevado no centro e ombros perto da pestana.
    shape("path", {
        d: `
            M 68 35
            Q 113 36 146 20
            Q 150 18 154 20
            Q 187 36 232 35
            Q 236 35 235 42

            L 230 276
            Q 230 291 222 305
            L 194 346
            Q 188 355 188 367

            L 112 367
            Q 112 355 106 346
            L 78 305
            Q 70 291 70 276

            L 65 42
            Q 64 35 68 35
            Z
        `
    }, "ukuleleWood");

    // Eixos frontais em dois tons de cinza.
    positions.forEach(function (position) {
        selectable(
            shape("circle", {
                cx: position.x,
                cy: position.y,
                r: 14
            }, "ukulelePostBase"),
            position.string
        );

        selectable(
            shape("circle", {
                cx: position.x,
                cy: position.y,
                r: 8
            }, "ukulelePost"),
            position.string
        );
    });

    // A pestana fica atrás das cordas.
    shape("line", {
        x1: 111,
        y1: 368,
        x2: 189,
        y2: 368
    }, "ukuleleNut");

    positions.forEach(function (position) {
        const path = `
            M ${position.x} ${position.y + 5}
            L ${position.endX} 368
            L ${position.endX} 420
        `;

        // Área de toque mais larga que a corda visível.
        const hit = shape("path", {
            d: path
        }, "ukuleleStringHit");

        hit.addEventListener("click", function () {
            onSelect(
                position.string,
                buttonByNoteNumber.get(position.string.noteNumber)
            );
        });

        const line = shape("path", {
            d: path,
            "stroke-width": 1.5
        }, "diagramStringLine diagramStringPart");

        line.dataset.noteNumber = String(position.string.noteNumber);
    });

    diagram.append(leftColumn, svg, rightColumn);

    const repeatArea = document.createElement("div");
    repeatArea.className = "diagramRepeatArea";

    const repeatButton = document.createElement("button");
    repeatButton.type = "button";
    repeatButton.className = "stringRepeatButton diagramRepeatButton";
    repeatButton.textContent = "↻";
    repeatButton.hidden = true;
    repeatButton.title = "Repetir nota selecionada";

    repeatButton.setAttribute(
        "aria-label",
        "Repetir nota selecionada"
    );

    repeatButton.setAttribute("aria-pressed", "false");

    repeatButton.addEventListener("click", function () {
        const selectedNote = Number(repeatButton.dataset.noteNumber);

        const stringData = strings.find(function (item) {
            return item.noteNumber === selectedNote;
        });

        if (stringData) {
            onRepeat(stringData, repeatButton);
        }
    });

    repeatArea.appendChild(repeatButton);
    container.append(diagram, repeatArea);

    return {
        firstButton: buttonByNoteNumber.get(strings[0].noteNumber),
        repeatButton
    };
}




function createClearInstrumentSvg(
    strings,
    buttonByNoteNumber,
    onSelect,
    orchestral
) {
    const svg = createSvgElement("svg", {
        viewBox: "0 0 300 430",
        class: "clearInstrumentSvg",
        "aria-hidden": "true",
        focusable: "false"
    });

    function draw(tag, attributes, className) {
        const element = createSvgElement(tag, attributes);

        if (className) {
            element.setAttribute("class", className);
        }

        svg.appendChild(element);
        return element;
    }

    function select(element, stringData) {
        element.classList.add("diagramStringPart");
        element.dataset.noteNumber = String(stringData.noteNumber);

        element.addEventListener("click", function () {
            onSelect(
                stringData,
                buttonByNoteNumber.get(stringData.noteNumber)
            );
        });

        return element;
    }

    function path(d, className) {
        return draw("path", { d }, className);
    }

    // O braço ocupa apenas a parte inferior do desenho.
    path(
        "M104 350 H196 L200 420 H100 Z",
        "clearNeck"
    );

    let positions;

    if (orchestral) {
        // Caixa das cravelhas: mais larga e com inclinação suave.
        path(
            "M116 98 Q150 88 184 98 L196 352 H104 Z",
            "clearWood"
        );

        // Rebaixo central com madeira visível nas laterais.
        path(
            "M128 112 Q150 104 172 112 " +
            "L180.7 320 " +
            "Q181 327 174 327 " +
            "H126 " +
            "Q119 327 119.3 320 Z",
            "clearCavity"
        );

        // Voluta em camadas, com divisões bem definidas.
        path(
            "M91 55 H209 L215 88 Q215 94 208 94 " +
            "H92 Q85 94 85 88 Z",
            "clearWood"
        );

        path(
            "M108 37 H192 L196 102 " +
            "Q174 111 150 124 Q126 111 104 102 Z",
            "clearWood"
        );

        path(
            "M131 22 Q131 18 136 18 H164 " +
            "Q169 18 169 22 L174 108 " +
            "Q164 117 150 124 Q136 117 126 108 Z",
            "clearWood"
        );

        path(
            "M150 20 V122",
            "clearScrollLine"
        );

        positions = [
            { data: strings[0], y: 276, x: 129, left: true },
            { data: strings[1], y: 188, x: 143, left: true },
            { data: strings[2], y: 144, x: 157, left: false },
            { data: strings[3], y: 232, x: 171, left: false }
        ];

        positions.forEach(function (position) {
            const { data, y, left } = position;

            // Borda externa da madeira nesta altura.
            const edge = 116 - (y - 98) * 12 / 254;

            // Limites do rebaixo nesta altura.
            const cavityLeft = 128 - (y - 112) * 9 / 215;
            const cavityRight = 300 - cavityLeft;

            // Haste externa curta.
            select(
                draw("line", {
                    x1: left ? edge - 24 : 300 - edge,
                    y1: y,
                    x2: left ? edge : 300 - edge + 24,
                    y2: y
                }, "clearStem clearViolinStem"),
                data
            );

            // Eixo visível dentro do rebaixo.
            select(
                draw("line", {
                    x1: cavityLeft,
                    y1: y,
                    x2: cavityRight,
                    y2: y
                }, "clearStem clearViolinStem"),
                data
            );

            // Cabeça da cravelha mais compacta e cheia.
            select(
                draw("ellipse", {
                    cx: left ? edge - 35 : 300 - edge + 35,
                    cy: y,
                    rx: 20,
                    ry: 21
                }, "clearKnob"),
                data
            );
        });
    } else {
        // Cabeça do violão mais ampla, com ombros definidos.
        path(
            "M67 42 " +
            "Q104 38 125 27 " +
            "Q150 12 175 27 " +
            "Q196 38 233 42 " +
            "L230 290 " +
            "Q230 305 219 318 " +
            "L198 342 " +
            "Q193 348 193 361 " +
            "H107 " +
            "Q107 348 102 342 " +
            "L81 318 " +
            "Q70 305 70 290 Z",
            "clearWood"
        );

        // Aberturas mais largas, com fundo superior sombreado.
        [87, 177].forEach(function (x) {
            draw("rect", {
                x,
                y: 86,
                width: 36,
                height: 219,
                rx: 17
            }, "clearSlotDepth");

            draw("rect", {
                x: x + 3,
                y: 99,
                width: 30,
                height: 203,
                rx: 13
            }, "clearSlot");
        });

        positions = [
            { data: strings[0], y: 285, anchor: 105, x: 115, left: true },
            { data: strings[1], y: 205, anchor: 105, x: 129, left: true },
            { data: strings[2], y: 125, anchor: 105, x: 143, left: true },
            { data: strings[3], y: 125, anchor: 195, x: 157, left: false },
            { data: strings[4], y: 205, anchor: 195, x: 171, left: false },
            { data: strings[5], y: 285, anchor: 195, x: 185, left: false }
        ];

        positions.forEach(function (position) {
            const { data, y, anchor, left } = position;

            select(
                draw("line", {
                    x1: left ? 54 : 246,
                    y1: y,
                    x2: left ? 68 : 232,
                    y2: y
                }, "clearStem"),
                data
            );

            select(
                draw("rect", {
                    x: left ? 28 : 242,
                    y: y - 15,
                    width: 30,
                    height: 30,
                    rx: 8
                }, "clearKnob"),
                data
            );

            select(
                draw("rect", {
                    x: anchor - 16,
                    y: y - 6,
                    width: 32,
                    height: 12,
                    rx: 4
                }, "clearRoller"),
                data
            );
        });
    }

    const nutY = 362;

    draw("line", {
        x1: 104,
        y1: nutY,
        x2: 196,
        y2: nutY,
        stroke: orchestral ? "#444444" : "#e2d9cc"
    }, "clearNut");

    positions.forEach(function (position) {
        const startX = orchestral ? position.x : position.anchor;

        const d =
            `M${startX} ${position.y} ` +
            `L${position.x} ${nutY} ` +
            `L${position.x} 420`;

        const hit = path(d, "clearStringHit");

        hit.addEventListener("click", function () {
            onSelect(
                position.data,
                buttonByNoteNumber.get(position.data.noteNumber)
            );
        });

        const stringLine = draw("path", {
            d,
            "stroke-width": 1.6
        }, "diagramStringLine diagramStringPart");

        stringLine.dataset.noteNumber =
            String(position.data.noteNumber);
    });

    return svg;
}




function createGuitarSvg(
    lowToHighStrings,
    buttonByNoteNumber,
    onSelect
) {
    return createClearInstrumentSvg(
        lowToHighStrings,
        buttonByNoteNumber,
        onSelect,
        false
    );
}




function createOrchestralSvg(
    lowToHighStrings,
    buttonByNoteNumber,
    onSelect
) {
    return createClearInstrumentSvg(
        lowToHighStrings,
        buttonByNoteNumber,
        onSelect,
        true
    );
}
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
    const svg = createSvgElement("svg", {
        viewBox: "0 29 300 471",
        role: "img",
        "aria-label": "Cabeça de violão com seis cordas"
    });

    svg.classList.add(
        "guitarDiagramSvg",
        "guitarReferenceDiagram"
    );

    // Cria um elemento e o adiciona à camada indicada.
    function shape(
        tag,
        attributes,
        className,
        parent = svg
    ) {
        const element = createSvgElement(tag, attributes);

        element.setAttribute("class", className);
        parent.appendChild(element);

        return element;
    }

    // Associa a peça à seleção de uma corda.
    function selectable(element, stringData) {
        element.dataset.noteNumber = String(
            stringData.noteNumber
        );

        element.classList.add("diagramStringPart");

        element.addEventListener("click", function () {
            const button = buttonByNoteNumber.get(
                stringData.noteNumber
            );

            onSelect(stringData, button);
        });
    }

    // BRAÇO
    shape(
        "path",
        {
            d:
                "M108 378 " +
                "L192 378 " +
                "L195 500 " +
                "L105 500 Z"
        },
        "guitarNeck"
    );

    // Ferragens atrás da madeira.
    const hardware = shape(
        "g",
        {},
        "guitarHardwareLayer"
    );

    // CABEÇA
    shape(
        "path",
        {
            d:
                "M78 62 " +
                "Q99 58 120 46 " +
                "Q137 39 150 39 " +
                "Q163 39 180 46 " +
                "Q201 58 222 62 " +

                "L215 304 " +
                "Q214 321 208 335 " +
                "L192 376 " +
                "L192 390 " +

                "L108 390 " +
                "L108 376 " +
                "L92 335 " +
                "Q86 321 85 304 Z"
        },
        "guitarHeadstockBody"
    );

    // PROFUNDIDADE DAS ABERTURAS
    shape(
        "path",
        {
            d:
                "M94 130 " +
                "Q92 112 109 110 " +
                "Q126 109 129 128 " +
                "L143 311 " +
                "Q144 328 127 329 " +
                "Q112 329 110 313 Z"
        },
        "guitarSlotDepth"
    );

    shape(
        "path",
        {
            d:
                "M206 130 " +
                "Q208 112 191 110 " +
                "Q174 109 171 128 " +
                "L157 311 " +
                "Q156 328 173 329 " +
                "Q188 329 190 313 Z"
        },
        "guitarSlotDepth"
    );

    // PARTE ABERTA
    shape(
        "path",
        {
            d:
                "M97 142 " +
                "Q95 126 110 125 " +
                "Q123 124 125 140 " +
                "L139 311 " +
                "Q140 322 127 323 " +
                "Q116 323 114 310 Z"
        },
        "guitarSlotOpening"
    );

    shape(
        "path",
        {
            d:
                "M203 142 " +
                "Q205 126 190 125 " +
                "Q177 124 175 140 " +
                "L161 311 " +
                "Q160 322 173 323 " +
                "Q184 323 186 310 Z"
        },
        "guitarSlotOpening"
    );

    const rollers = shape(
        "g",
        {},
        "guitarRollerLayer"
    );

    // PESTANA: fica abaixo das cordas.
    shape(
        "line",
        {
            x1: 106,
            y1: 390,
            x2: 194,
            y2: 390
        },
        "guitarNut"
    );

    const stringsLayer = shape(
        "g",
        {},
        "guitarStringsLayer"
    );

    // POSIÇÕES DAS SEIS CORDAS
    // x: posição na pestana e no braço.
    // anchor: posição de fixação no rolete.
    // y: altura do rolete.
    const positions = [
        {
            data: lowToHighStrings[0],
            x: 120,
            anchor: 114,
            y: 290,
            left: true
        },
        {
            data: lowToHighStrings[1],
            x: 132,
            anchor: 116,
            y: 220,
            left: true
        },
        {
            data: lowToHighStrings[2],
            x: 144,
            anchor: 106,
            y: 150,
            left: true
        },
        {
            data: lowToHighStrings[3],
            x: 156,
            anchor: 194,
            y: 150,
            left: false
        },
        {
            data: lowToHighStrings[4],
            x: 168,
            anchor: 184,
            y: 220,
            left: false
        },
        {
            data: lowToHighStrings[5],
            x: 180,
            anchor: 186,
            y: 290,
            left: false
        }
    ];

    positions.forEach(function (position) {
        if (!position.data) {
            return;
        }

        // HASTE DA TARRAXA
        const stem = shape(
            "line",
            {
                x1: position.left ? 66 : 234,
                y1: position.y,
                x2: position.anchor,
                y2: position.y
            },
            "diagramPegStem",
            hardware
        );

        selectable(stem, position.data);

        // PEQUENA PLACA LATERAL
        const plate = shape(
            "rect",
            {
                x: position.left ? 73 : 217,
                y: position.y - 14,
                width: 10,
                height: 28,
                rx: 4
            },
            "guitarMachinePlate",
            hardware
        );

        selectable(plate, position.data);

        // PEÇA EXTERNA DA TARRAXA
        const knob = shape(
            "rect",
            {
                x: position.left ? 48 : 234,
                y: position.y - 13,
                width: 18,
                height: 26,
                rx: 6
            },
            "diagramPegKnob",
            hardware
        );

        selectable(knob, position.data);

        // ROLETE: acompanha a inclinação da abertura.
        const center = position.left
            ? 112 + (position.y - 150) * 0.075
            : 188 - (position.y - 150) * 0.075;

        const roller = shape(
            "rect",
            {
                x: center - 15,
                y: position.y - 7,
                width: 30,
                height: 14,
                rx: 4
            },
            "guitarRoller",
            rollers
        );

        selectable(roller, position.data);

        // CORDA CONTÍNUA
        const string = shape(
            "polyline",
            {
                points:
                    `${position.anchor},${position.y} ` +
                    `${position.x},390 ` +
                    `${position.x},500`,

                fill: "none",

                "stroke-width": Math.max(
                    1.5,
                    position.data.thickness * 0.42
                )
            },
            "diagramStringLine diagramStringPart",
            stringsLayer
        );

        string.dataset.noteNumber = String(
            position.data.noteNumber
        );
    });

    // ÁREA ÚNICA DE CLIQUE
    // Seleciona a corda mais próxima do ponto clicado.
    const interaction = shape(
        "rect",
        {
            x: 94,
            y: 139,
            width: 112,
            height: 361,
            fill: "transparent"
        },
        "guitarStringInteraction"
    );

    interaction.addEventListener("click", function (event) {
        const matrix = svg.getScreenCTM();

        if (!matrix) {
            return;
        }

        // Converte a posição do clique para coordenadas do SVG.
        const point = svg.createSVGPoint();

        point.x = event.clientX;
        point.y = event.clientY;

        const local = point.matrixTransform(
            matrix.inverse()
        );

        let nearest = null;
        let distance = Infinity;

        positions.forEach(function (position) {
            if (
                !position.data ||
                local.y < position.y - 7
            ) {
                return;
            }

            const progress = Math.max(
                0,
                Math.min(
                    1,
                    (local.y - position.y) /
                    (390 - position.y)
                )
            );

            const stringX =
                position.anchor +
                (position.x - position.anchor) * progress;

            const currentDistance = Math.abs(
                local.x - stringX
            );

            if (currentDistance < distance) {
                distance = currentDistance;
                nearest = position;
            }
        });

        if (nearest && distance <= 9) {
            const button = buttonByNoteNumber.get(
                nearest.data.noteNumber
            );

            onSelect(nearest.data, button);
        }
    });

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

    const pegbox = createSvgElement("path", {
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

        // Laterais com abertura gradual.
        "Q181 105 181 124 " +
        "L185 295 " +
        "L115 295 " +
        "L119 124 " +
        "Q119 105 132 95 " +

        "L126 92 " +
        "Q116 87 114 77 " +
        "L111 64 " +
        "Q109 55 116 52 " +
        "L129 48 " +
        "Q136 45 136 39 Z"
    });

    pegbox.classList.add(
        "orchestralPegboxBody"
    );


    svg.appendChild(
        pegbox
    );




    
    const voluteCrown = createSvgElement("path", {
        d:
        // Topo.
        "M138 10 " +
        "Q132 10 132 16 " +
        "L132 30 " +

        // Degraus esquerdos.
        "L119 30 " +
        "Q113 30 113 36 " +
        "L113 47 " +
        "L103 47 " +
        "Q98 47 97 53 " +
        "L93 75 " +
        "Q91 84 101 84 " +
        "L114 84 " +

        // Transição inferior arredondada.
        "L114 94 " +
        "Q114 101 122 104 " +
        "L132 108 " +
        "Q138 111 142 115 " +
        "Q150 123 158 115 " +
        "Q162 111 168 108 " +
        "L178 104 " +
        "Q186 101 186 94 " +
        "L186 84 " +

        // Degraus direitos.
        "L199 84 " +
        "Q209 84 207 75 " +
        "L203 53 " +
        "Q202 47 197 47 " +
        "L187 47 " +
        "L187 36 " +
        "Q187 30 181 30 " +
        "L168 30 " +

        // Fechamento do topo.
        "L168 16 " +
        "Q168 10 162 10 Z"
    });


    voluteCrown.classList.add(
        "orchestralVoluteCrown"
    );


    svg.appendChild(
        voluteCrown
    );   

    // Divisórias verticais da voluta.
    const voluteDetails = createSvgElement("path", {
        d:
            // Divisória central.
            "M150 12 L150 118 " +

            // Divisórias internas ligeiramente inclinadas.
            "M134 30 Q133 68 130 106 " +
            "M166 30 Q167 68 170 106 " +

            // Divisórias externas.
            "M115 48 Q116 70 117 99 " +
            "M185 48 Q184 70 183 99 ",

        fill: "none",
        stroke: "#755442",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "pointer-events": "none"    
    });

    svg.appendChild(voluteDetails);






    /*
        DETALHE CENTRAL ESCURO

        Ajuda a dar profundidade
        e separa visualmente
        as quatro cordas.
    */

    const pegboxInner = createSvgElement("path", {
        d:
        "M134 124 " +
        "L166 124 " +
        "Q170 124 170 128 " +
        "L174 276 " +
        "Q174 280 170 280 " +
        "L130 280 " +
        "Q126 280 126 276 " +
        "L130 128 " +
        "Q130 124 134 124 Z"
    });

    pegboxInner.classList.add("orchestralPegboxInner");

    svg.appendChild(pegboxInner);

    // Eixos ficam atrás das cordas.
    const shaftLayer = createSvgElement("g");
    svg.appendChild(shaftLayer);

    const nut = createSvgElement("line", {
        x1: 114,
        y1: 326,
        x2: 186,
        y2: 326
    });

    nut.classList.add("orchestralNut");
    svg.appendChild(nut);

    // Cordas acima dos eixos e da pestana.
    const stringLayer = createSvgElement("g");
    svg.appendChild(stringLayer);

    const positions = [
        {
            stringData: lowToHighStrings[0],
            startX: 134,
            pegY: 240,
            isLeft: true
        },
        {
            stringData: lowToHighStrings[1],
            startX: 145,
            pegY: 160,
            isLeft: true
        },
        {
            stringData: lowToHighStrings[2],
            startX: 155,
            pegY: 140,
            isLeft: false
        },
        {
            stringData: lowToHighStrings[3],
            startX: 166,
            pegY: 220,
            isLeft: false
        }
    ];

    positions.forEach(function (position) {
        const stringData = position.stringData;

        if (!stringData) {
            return;
        }

        const noteNumber = String(stringData.noteNumber);
        const pegY = position.pegY;
        const knobX = position.isLeft ? 94 : 206;

        function makeSelectable(element) {
            element.dataset.noteNumber = noteNumber;

            element.addEventListener("click", function () {
                const button = buttonByNoteNumber.get(
                    stringData.noteNumber
                );

                onSelect(stringData, button);
            });
        }

        // Haste externa: entra por trás da madeira.
        const outerShaft = createSvgElement("line", {
            x1: knobX,
            y1: pegY,
            x2: 150,
            y2: pegY
        });

        outerShaft.classList.add(
            "diagramPegStem",
            "orchestralPegShaft",
            "diagramStringPart"
        );

        makeSelectable(outerShaft);

        // A caixa cobre a passagem da haste pela madeira.
        svg.insertBefore(outerShaft, pegbox);

        // Limites internos da cavidade nesta altura.
        const cavityProgress = (pegY - 128) / (276 - 128);
        const cavityLeft = 130 - 4 * cavityProgress;
        const cavityRight = 170 + 4 * cavityProgress;

        // Trecho do eixo que reaparece dentro da cavidade.
        const innerShaft = createSvgElement("line", {
            x1: cavityLeft + 1,
            y1: pegY,
            x2: cavityRight - 1,
            y2: pegY
        });

        innerShaft.classList.add(
            "diagramPegStem",
            "orchestralPegShaft",
            "orchestralInnerShaft",
            "diagramStringPart"
        );

        makeSelectable(innerShaft);
        shaftLayer.appendChild(innerShaft);

        // Peça oval mais próxima da caixa.
        const pegKnob = createSvgElement("ellipse", {
            cx: knobX,
            cy: pegY,
            rx: 15,
            ry: 18
        });

        pegKnob.classList.add(
            "diagramPegKnob",
            "diagramStringPart"
        );

        makeSelectable(pegKnob);
        svg.appendChild(pegKnob);

        // Área de clique acompanha toda a corda reta.
        const hitLine = createSvgElement("line", {
            x1: position.startX,
            y1: pegY,
            x2: position.startX,
            y2: 430
        });

        hitLine.classList.add("diagramStringHit");
        makeSelectable(hitLine);
        stringLayer.appendChild(hitLine);

        // Corda contínua: do eixo até o fim do braço.
        const stringLine = createSvgElement("line", {
            x1: position.startX,
            y1: pegY,
            x2: position.startX,
            y2: 430,
            "stroke-width": Math.max(
                1.4,
                stringData.thickness * 0.5
            )
        });

        stringLine.classList.add(
            "diagramStringLine",
            "diagramStringPart"
        );

        stringLine.dataset.noteNumber = noteNumber;
        stringLayer.appendChild(stringLine);
    });

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
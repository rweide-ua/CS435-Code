"use strict";

/*********
CS 435
Project #3
Lilly Eide

This program is a further exploration of interactivity, this time in 3D with a gas station sign.
Use the up and down buttons to increase or decrease the respective gasoline type.
Pressing the "stop" button" will pause the rotation. This will change the button to a "start" button, which will begin the rotation again

This program used cube.js from chapter 04 as a starting point.
*********/

var canvas;
var gl;

var vPosition;
var vColor;

var positions = [];
var colors = [];

var isRotating = true;

var unleadedPrice = 249;
var midgradePrice = 289;
var supremePrice = 329;

var signPost;
var signBoard;
var unleadedLetters = [];
var unleadedNumberVis = [];
var midgradeLetters = [];
var midgradeNumberVis = [];
var supremeLetters = [];
var supremeNumberVis = [];

var unleadedNumberPos = vec3(0.85, 1.4, 0.25);
var midgradeNumberPos = vec3(0.85, 0.6, 0.25);
var supremeNumberPos = vec3(0.85, -0.2, 0.25);
var letterSpacingXOffset;
var wordScale;


var globalCubeScale = 0.25;

var theta = [0, 0, 0];

var thetaLoc;

window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var colorLoc = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( colorLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );


    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    vPosition = gl.getAttribLocation( program, "aPosition" );
    vColor = gl.getAttribLocation( program, "aColor" );

    // Set up signpost and prices board
    signPost = new Cube(vec3(0, -2, 0), vec3(.25, 2, .25), vec4(0.5, 0.5, 0.5, 1.0));
    signPost.init();

    signBoard = new Cube(vec3(0, 0, 0), vec3(6, 4, .5), vec4(0.2, 0.0, 0.5, 1.0));
    signBoard.init();

    var unleadedWord = "Unleaded";
    var unleadedStartingPoint = vec3(-1.3, 1.4, 0.25);
    var midgradeWord = "Midgrade";
    var midgradeStartingPoint = vec3(-1.3, 0.6, 0.25);
    var supremeWord = "Supreme";
    var supremeStartingPoint = vec3(-1.3, -0.2, 0.25);

    
    var currentLetterX = unleadedStartingPoint[0];

    letterSpacingXOffset = 0.45;
    wordScale = vec3(0.08, 0.08, 0.08);

    var textColor = vec4(0.5, 0.5, 0.5, 1.0);

    // Create "unleaded" letters
    for (var i = 0; i < unleadedWord.length; i++) {
        unleadedLetters.push(new DotMatrixChar(add(unleadedStartingPoint, vec3(currentLetterX, 0, 0)), wordScale, vec3(1, 1, 1), textColor, unleadedWord.charAt(i)));
        currentLetterX += letterSpacingXOffset;
    }
    // Reset X offset for next word
    currentLetterX = midgradeStartingPoint[0];

    // Create "midgrade" letters
    for (var i = 0; i < midgradeWord.length; i++) {
        midgradeLetters.push(new DotMatrixChar(add(midgradeStartingPoint, vec3(currentLetterX, 0, 0)), wordScale, vec3(1, 1, 1), textColor, midgradeWord.charAt(i)));
        currentLetterX += letterSpacingXOffset;
    }

    // Reset X offset for next word
    currentLetterX = supremeStartingPoint[0];
    
    // Create "midgrade" letters
    for (var i = 0; i < supremeWord.length; i++) {
        supremeLetters.push(new DotMatrixChar(add(supremeStartingPoint, vec3(currentLetterX, 0, 0)), wordScale, vec3(1, 1, 1), textColor, supremeWord.charAt(i)));
        currentLetterX += letterSpacingXOffset;
    }

    // INITIALIZE NUMBERS

    // Unleaded initialization
    unleadedNumberVis = priceToLetters(unleadedNumberPos, unleadedPrice, textColor);

    // Midgrade initialization
    midgradeNumberVis = priceToLetters(midgradeNumberPos, midgradePrice, textColor);

    // Supreme initialization
    supremeNumberVis = priceToLetters(supremeNumberPos, supremePrice, textColor);

    // Run inits
    for (var i = 0; i < unleadedLetters.length; i++) {
        unleadedLetters[i].init();
    }
    
    for (var i = 0; i < midgradeLetters.length; i++) {
        midgradeLetters[i].init();
    }

    for (var i = 0; i < supremeLetters.length; i++) {
        supremeLetters[i].init();
    }
    
    //event listeners for buttons
    // Handle rotation by toggling rotation state on click
    document.getElementById( "startStopButton" ).onclick = function () {
        var button = document.getElementById("startStopButton");
        isRotating = !isRotating;
        if (isRotating) {
            button.innerText = "Stop";
        }
        else {
            button.innerText = "Start";
        }
    };

    document.getElementById("priceUpButton").onclick = function () {
        // Determine gas price type
        var priceType = parseInt(document.getElementById("gasType").value);
        switch (priceType) {
            case 0: // Unleaded
                unleadedPrice += 1;
                unleadedNumberVis = priceToLetters(unleadedNumberPos, unleadedPrice, textColor); // Clears out visual representation for this number and sets it to updated value
                break;
            case 1: // Midgrade
                midgradePrice += 1;
                midgradeNumberVis = priceToLetters(midgradeNumberPos, midgradePrice, textColor); // Clears out visual representation for this number and sets it to updated value
                break;
            case 2: // Supreme
                supremePrice += 1;
                supremeNumberVis = priceToLetters(supremeNumberPos, supremePrice, textColor); // Clears out visual representation for this number and sets it to updated value
                break;
            default:
                break;
        }
    }

    document.getElementById("priceDownButton").onclick = function () {
        var priceType = parseInt(document.getElementById("gasType").value);
        switch (priceType) {
            case 0: // Unleaded
                if (unleadedPrice <= 0) {
                    unleadedPrice = 0;
                } else {
                    unleadedPrice -= 1;
                }
                unleadedNumberVis = priceToLetters(unleadedNumberPos, unleadedPrice, textColor); // Clears out visual representation for this number and sets it to updated value
                break;
            case 1: // Midgrade
                if (midgradePrice <= 0) {
                    midgradePrice = 0;
                } else {
                    midgradePrice -= 1;
                }
                midgradeNumberVis = priceToLetters(midgradeNumberPos, midgradePrice, textColor); // Clears out visual representation for this number and sets it to updated value
                break;
            case 2: // Supreme
                if (supremePrice == 0) {
                    supremePrice = 0;
                } else {
                    supremePrice -= 1;
                }
                supremeNumberVis = priceToLetters(supremeNumberPos, supremePrice, textColor); // Clears out visual representation for this number and sets it to updated value
                break;
            default:
                break;
        }
    }

    render();
}

function priceToLetters(startPos, price, textColor) {
    // digitArray is an array of DotMatrixChar objects
    var digitArray = [];

    // Start at given X position and move right
    var currentLetterX = startPos[0];
    var priceString = price.toString();
    // Add leading zeros if needed
    if (price < 100) {
        priceString = "0" + priceString;
    }
    if (price < 10) {
        priceString = "0" + priceString;
    }
    // For each digit, create a new DotMatrix character and increase starting X position for next character
    for (var i = 0; i < priceString.length; i++) {
        digitArray.push(new DotMatrixChar(add(startPos, vec3(currentLetterX, 0, 0)), wordScale, vec3(1, 1, 1), textColor, priceString.charAt(i)));
        currentLetterX += letterSpacingXOffset;
    }

    // Initialize all newly created digits
    for (var i = 0; i < digitArray.length; i++) {
        digitArray[i].init();
    }

    return digitArray;
}

// origin is a vec3, scale is a vec3, color is a vec4
// color is applied to entire cube
function Cube(origin, scale, color) {
    this.positions = [];
    this.colors = [];
    this.quads = [];
    
    this.vBuffer=0;
    this.cBuffer=0;

    // Starting positions for cubes are shifted based on input scale and origin, as well as a global scale value
    this.vertices = [
        vec4(((scale[0] * -0.5) + origin[0]) * globalCubeScale, ((scale[1] * -0.5) + origin[1]) * globalCubeScale,  ((scale[2] * 0.5) + origin[2]) * globalCubeScale, 1.0),
        vec4(((scale[0] * -0.5) + origin[0]) * globalCubeScale,  ((scale[1] * 0.5) + origin[1]) * globalCubeScale,  ((scale[2] * 0.5) + origin[2]) * globalCubeScale, 1.0),
        vec4(((scale[0] * 0.5) + origin[0]) * globalCubeScale,  ((scale[1] * 0.5) + origin[1]) * globalCubeScale,  ((scale[2] * 0.5) + origin[2]) * globalCubeScale, 1.0),
        vec4(((scale[0] * 0.5) + origin[0]) * globalCubeScale, ((scale[1] * -0.5) + origin[1]) * globalCubeScale,  ((scale[2] * 0.5) + origin[2]) * globalCubeScale, 1.0),
        vec4(((scale[0] * -0.5) + origin[0]) * globalCubeScale, ((scale[1] * -0.5) + origin[1]) * globalCubeScale, ((scale[2] * -0.5) + origin[2]) * globalCubeScale, 1.0),
        vec4(((scale[0] * -0.5) + origin[0]) * globalCubeScale,  ((scale[1] * 0.5) + origin[1]) * globalCubeScale, ((scale[2] * -0.5) + origin[2]) * globalCubeScale, 1.0),
        vec4(((scale[0] * 0.5) + origin[0]) * globalCubeScale,  ((scale[1] * 0.5) + origin[1]) * globalCubeScale, ((scale[2] * -0.5) + origin[2]) * globalCubeScale, 1.0),
        vec4(((scale[0] * 0.5) + origin[0]) * globalCubeScale, ((scale[1] * -0.5) + origin[1]) * globalCubeScale, ((scale[2] * -0.5) + origin[2]) * globalCubeScale, 1.0)
    ];

    // Set up quads for this cube
    this.quad_1 = quad2(this.vertices, 1, 0, 3, 2);
    this.quad_2 = quad2(this.vertices, 2, 3, 7, 6);
    this.quad_3 = quad2(this.vertices, 3, 0, 4, 7);
    this.quad_4 = quad2(this.vertices, 6, 5, 1, 2);
    this.quad_5 = quad2(this.vertices, 4, 5, 6, 7);
    this.quad_6 = quad2(this.vertices, 5, 4, 0, 1);

    this.quads.push(this.quad_1);
    this.quads.push(this.quad_2);
    this.quads.push(this.quad_3);
    this.quads.push(this.quad_4);
    this.quads.push(this.quad_5);
    this.quads.push(this.quad_6);

    // Push quad verts to positions array
    for (var i = 0; i < this.quads.length; i++) {
        for (var j = 0; j < this.quads[i].length; j++) {
            this.positions.push(this.quads[i][j]);

            ///var colorToPush = add(vec4(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2, 1.0), color);
            //this.colors.push(colorToPush);

            this.colors.push(color);
        }
    }

    this.init = function() {

        this.vBuffer = gl.createBuffer();
  
        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
  
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.positions), gl.STATIC_DRAW );
  
        this.cBuffer = gl.createBuffer();
  
        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
  
        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );
  
      }
  
    this.draw = function() {
  
          gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
          gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
          gl.enableVertexAttribArray( vPosition );
  
  
          gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
          gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
          gl.enableVertexAttribArray( vColor );
          
          gl.drawArrays( gl.TRIANGLES, 0, this.positions.length);    
      }  
}

function quad2(vertices, a, b, c, d) {

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex
    var positions = [];
    
    var indices = [a, b, c, a, c, d];

    for ( var i = 0; i < indices.length; ++i ) {
        positions.push( vertices[indices[i]] );
    }
    return positions;
}

function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}

// A dot matrix character for 3D representation
// origin, scale, cubeScale are vec3s, color is a vec4, character is a string (expected to be a single letter or digit)
// origin determines where the character is placed, scale determines how large the character is, cubeScale determines how much space should sit between each block of the character
function DotMatrixChar(origin, scale, cubeScale, color, character) {
    // A collection of 3D cubes to represent the given character
    var cubes = [];
    
    // letterMaps is an array of bitmap representations of letters
    var letterMaps = [];
    //A = index 0, Z = index 25
    //number 0 = index 26, number 9 = index 35

    // A
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1   1",
            "11111",
            "1   1",
            "1   1",
            "1   1"
        ]
    );
    // B
    letterMaps.push(
        [
            "1111 ",
            "1   1",
            "1   1",
            "1111 ",
            "1   1",
            "1   1",
            "1111 "
        ]
    );
    // C
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1    ",
            "1    ",
            "1    ",
            "1   1",
            " 111 "
        ]
    );
    // D
    letterMaps.push(
        [
            "1111 ",
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            "1111 "
        ]
    );
    // E
    letterMaps.push(
        [
            "11111",
            "1    ",
            "1    ",
            "1111 ",
            "1    ",
            "1    ",
            "11111"
        ]
    );
    // F
    letterMaps.push(
        [
            "11111",
            "1    ",
            "1    ",
            "1111 ",
            "1    ",
            "1    ",
            "1    "
        ]
    );
    // G
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1    ",
            "1 111",
            "1   1",
            "1   1",
            " 111 "
        ]
    );
    // H
    letterMaps.push(
        [
            "1   1",
            "1   1",
            "1   1",
            "11111",
            "1   1",
            "1   1",
            "1   1"
        ]
    );
    // I
    letterMaps.push(
        [
            " 111 ",
            "  1  ",
            "  1  ",
            "  1  ",
            "  1  ",
            "  1  ",
            " 111 "
        ]
    );
    // J
    letterMaps.push(
        [
            "    1",
            "    1",
            "    1",
            "    1",
            "1   1",
            "1   1",
            " 111 "
        ]
    );
    // K
    letterMaps.push(
        [
            "1   1",
            "1  1 ",
            "1 1  ",
            "11   ",
            "1 1  ",
            "1  1 ",
            "1   1"
        ]
    );
    // L
    letterMaps.push(
        [
            "1    ",
            "1    ",
            "1    ",
            "1    ",
            "1    ",
            "1    ",
            "11111"
        ]
    );
    // M
    letterMaps.push(
        [
            "1   1",
            "11 11",
            "1 1 1",
            "1 1 1",
            "1   1",
            "1   1",
            "1   1"
        ]
    );
    // N
    letterMaps.push(
        [
            "1   1",
            "11  1",
            "1 1 1",
            "1  11",
            "1   1",
            "1   1",
            "1   1"
        ]
    );
    // O
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            " 111 "
        ]
    );
    // P
    letterMaps.push(
        [
            "1111 ",
            "1   1",
            "1   1",
            "1111 ",
            "1    ",
            "1    ",
            "1    "
        ]
    );
    // Q
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1   1",
            "1   1",
            "1 1 1",
            "1  1 ",
            " 11 1"
        ]
    );
    // R
    letterMaps.push(
        [
            "1111 ",
            "1   1",
            "1   1",
            "1111 ",
            "1 1  ",
            "1  1 ",
            "1   1"
        ]
    );
    // S
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1    ",
            " 111 ",
            "    1",
            "1   1",
            " 111 "
        ]
    );
    // T
    letterMaps.push(
        [
            "11111",
            "  1  ",
            "  1  ",
            "  1  ",
            "  1  ",
            "  1  ",
            "  1  "
        ]
    );
    // U
    letterMaps.push(
        [
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            " 111 "
        ]
    );
    // V
    letterMaps.push(
        [
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            "1   1",
            " 1 1 ",
            "  1  "
        ]
    );
    // W
    letterMaps.push(
        [
            "1   1",
            "1   1",
            "1   1",
            "1 1 1",
            "1 1 1",
            "11 11",
            "1   1"
        ]
    );
    // X
    letterMaps.push(
        [
            "1   1",
            "1   1",
            " 1 1 ",
            "  1  ",
            " 1 1 ",
            "1   1",
            "1   1"
        ]
    );
    // Y
    letterMaps.push(
        [
            "1   1",
            "1   1",
            " 1 1 ",
            "  1  ",
            "  1  ",
            "  1  ",
            "  1  "
        ]
    );
    // Z
    letterMaps.push(
        [
            "11111",
            "    1",
            "   1 ",
            "  1  ",
            " 1   ",
            "1    ",
            "11111"
        ]
    );
    // 0
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1  11",
            "1 1 1",
            "11  1",
            "1   1",
            " 111 "
        ]
    );
    // 1
    letterMaps.push(
        [
            "  1  ",
            " 11  ",
            "  1  ",
            "  1  ",
            "  1  ",
            "  1  ",
            " 111 "
        ]
    );
    // 2
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "    1",
            "   1 ",
            "  1  ",
            " 1   ",
            "11111"
        ]
    );
    // 3
    letterMaps.push(
        [
            "1111 ",
            "    1",
            "    1",
            " 111 ",
            "    1",
            "    1",
            "1111 "
        ]
    );
    // 4
    letterMaps.push(
        [
            "1   1",
            "1   1",
            "1   1",
            "11111",
            "    1",
            "    1",
            "    1"
        ]
    );
    // 5
    letterMaps.push(
        [
            "11111",
            "1    ",
            "1    ",
            "1111 ",
            "    1",
            "    1",
            "1111 "
        ]
    );
    // 6
    letterMaps.push(
        [
            " 111 ",
            "1    ",
            "1    ",
            "1111 ",
            "1   1",
            "1   1",
            " 111 "
        ]
    );
    // 7
    letterMaps.push(
        [
            "11111",
            "    1",
            "    1",
            "   1 ",
            "  1  ",
            "  1  ",
            "  1  "
        ]
    );
    // 8
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1   1",
            " 111 ",
            "1   1",
            "1   1",
            " 111 "
        ]
    );
    // 9
    letterMaps.push(
        [
            " 111 ",
            "1   1",
            "1   1",
            " 1111",
            "    1",
            "1   1",
            " 111 "
        ]
    );
    // among us for fun :)
    letterMaps.push(
        [
            " 1111",
            "11   ",
            "11   ",
            "11111",
            "11111",
            " 1111",
            " 1  1"
        ]
    );

    // Turns a given character index from the above bitmaps into a cube representation
    this.letterToCubes = function(letterIndex) {
        for (var i = 0; i < 7; i++) {
            for (var j = 0; j < 5; j++) {
                if (letterMaps[letterIndex][i][j] == "1") {
                    cubes.push(new Cube(vec3((scale[0] * (j - 2)) + origin[0], (scale[1] * (-i + 3)) + origin[1], (scale[2] * 0) + origin[2]), mult(cubeScale, scale), color));
                }
            }
        }
    }
    
    this.init = function() {
        var letterCode = 0;
        
        // Don't store any cubes, easy way to represent a space
        if (character == " ") {
            return;
        }
        else if (character == "*") { // among us easter egg
            letterCode = 36;
        }
        else if (isLetter(character)) {
            // Subtract 65 to find letter as code between 0 and 25
            letterCode = character.toUpperCase().charCodeAt(0) - 65;
        } else {
            if (parseInt(character) != NaN) {
                // character is a digit, subtract 48 to find actual number and then add offset of 26 to get to digits in letterMaps
                letterCode = character.charCodeAt(0) - 48 + 26;   
            } else {
                console.log("Character is not a number or letter! Writing \"A\" instead.");
            }
        }

        // Fill cubes array with cubes that represent this letter
        this.letterToCubes(parseInt(letterCode));

        // Init each cube as necessary
        for (var i = 0; i < cubes.length; i++) {
            cubes[i].init();
        }
    }

    this.draw = function() {
        for (var i = 0; i < cubes.length; i++) {
            cubes[i].draw();
        }
    }
}

function render()
{

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (isRotating) {
      theta[1] += 0.8;
    }
    gl.uniform3fv(thetaLoc, theta);

    signPost.draw();
    signBoard.draw();

    for (var i = 0; i < unleadedLetters.length; i++) {
        unleadedLetters[i].draw();
    }

    for (var i = 0; i < midgradeLetters.length; i++) {
        midgradeLetters[i].draw();
    }

    for (var i = 0; i < supremeLetters.length; i++) {
        supremeLetters[i].draw();
    }

    for (var i = 0; i < unleadedNumberVis.length; i++) {
        unleadedNumberVis[i].draw();
    }

    for (var i = 0; i < midgradeNumberVis.length; i++) {
        midgradeNumberVis[i].draw();
    }

    for (var i = 0; i < supremeNumberVis.length; i++) {
        supremeNumberVis[i].draw();
    }

    requestAnimationFrame(render);
}

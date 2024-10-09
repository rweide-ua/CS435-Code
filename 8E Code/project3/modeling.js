"use strict";

var canvas;
var gl;

var vPosition; // loc of attribute variables
var vColor;

var positions = [];
var colors = [];

var cubes = [];

var isRotating = true;

var unleadedPrice = 249;
var midgradePrice = 289;
var supremePrice = 329;

var unleadedElement;
var midgradeElement;
var supremeElement;

var signPost;
var signBoard;
var unleadedLetters = [];
var unleadedNumberVis = [];
var midgradeLetters = [];
var midgradeNumberVis = [];
var supremeLetters = [];
var supremeNumberVis = [];

var globalCubeScale = 0.25;

var theta = [0, 0, 0];

var thetaLoc;

window.onload = function init()
{
    // Init prices for debug view
    unleadedElement = document.getElementById("unleadedP");
    midgradeElement = document.getElementById("midgradeP");
    supremeElement = document.getElementById("supremeP");
    
    unleadedElement.innerText = "Unleaded: " + unleadedPrice;
    midgradeElement.innerText = "Midgrade: " + unleadedPrice;
    supremeElement.innerText = "Supreme: " + unleadedPrice;

    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //colorCube();

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
    signPost = new Cube(vec3(0, -2, 0), vec3(.125, 2, .125), vec4(0.5, 0.5, 0.5, 1.0));
    signPost.init();

    signBoard = new Cube(vec3(0, 0, 0), vec3(3, 2.5, .5), vec4(0.2, 0.0, 0.5, 1.0));
    signBoard.init();

    // Letters
    unleadedLetters.push(new DotMatrixChar(vec3(-3, 0, 0), vec3(.25, .25, .25), vec3(0.75, 0.75, 0.75), vec4(0.5, 0.5, 0.5, 1.0), "I"));
    unleadedLetters.push(new DotMatrixChar(vec3(-1.7, 0, 0), vec3(.25, .25, .25), vec3(0.75, 0.75, 0.75), vec4(0.5, 0.5, 0.5, 1.0), "J"));
    unleadedLetters.push(new DotMatrixChar(vec3(-0.3, 0, 0), vec3(.25, .25, .25), vec3(0.75, 0.75, 0.75), vec4(0.5, 0.5, 0.5, 1.0), "K"));
    unleadedLetters.push(new DotMatrixChar(vec3(1, 0, 0), vec3(.25, .25, .25), vec3(0.75, 0.75, 0.75), vec4(0.5, 0.5, 0.5, 1.0), "L"));
    unleadedLetters.push(new DotMatrixChar(vec3(2.5, 0, 0), vec3(.25, .25, .25), vec3(0.75, 0.75, 0.75), vec4(0.5, 0.5, 0.5, 1.0), "M"));
    for (var i = 0; i < unleadedLetters.length; i++) {
        unleadedLetters[i].init();
    }

    //cubes.push(new Cube(vec3(0, 0, 0), vec3(1, 1, 1), vec4(0.2, 0.0, 0.5, 1.0)));
    //cubes.push(new Cube(vec3(2, 0, 0), vec3(1, 1, 1), vec4(0.0, 0.0, 0.5, 1.0)));
    //cubes.push(new Cube(vec3(-2, 0, 0), vec3(1, 1, 1), vec4(0.0, 0.0, 0.5, 1.0)));
    for (var i = 0; i < cubes.length; i++) {
        cubes[i].init();
    }
    

    //event listeners for buttons

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
        var priceType = parseInt(document.getElementById("gasType").value);
        switch (priceType) {
            case 0: // Unleaded
                unleadedPrice += 1;
                break;
            case 1: // Midgrade
                midgradePrice += 1;
                break;
            case 2: // Supreme
                supremePrice += 1;
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
                break;
            case 1: // Midgrade
                if (midgradePrice <= 0) {
                    midgradePrice = 0;
                } else {
                    midgradePrice -= 1;
                }
                break;
            case 2: // Supreme
                if (supremePrice == 0) {
                    supremePrice = 0;
                } else {
                    supremePrice -= 1;
                }
                break;
            default:
                break;
        }
    }
    
    document.getElementById("deleteCubeButton").onclick = function() {
        unleadedLetters.pop();
    }

    render();
}

// origin is a vec3, scale is a vec3, color is a vec4
// color is applied to entire cube
function Cube(origin, scale, color) {
    this.positions = [];
    this.colors = [];
    this.quads = [];
    
    this.vBuffer=0;
    this.cBuffer=0;

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

    for (var i = 0; i < this.quads.length; i++) {
        for (var j = 0; j < this.quads[i].length; j++) {
            this.positions.push(this.quads[i][j]);
            var colorToPush = add(vec4(Math.random() * 0.2, Math.random() * 0.2, Math.random() * 0.2, 1.0), color);
            this.colors.push(colorToPush);
            //this.colors.push(colors);
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

function colorCube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d)
{
    var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(0.5,  0.5,  0.5, 1.0),
        vec4(0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(0.5,  0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

    var vertexColors = [
        vec4(0.0, 0.0, 0.0, 1.0),  // black
        vec4(1.0, 0.0, 0.0, 1.0),  // red
        vec4(1.0, 1.0, 0.0, 1.0),  // yellow
        vec4(0.0, 1.0, 0.0, 1.0),  // green
        vec4(0.0, 0.0, 1.0, 1.0),  // blue
        vec4(1.0, 0.0, 1.0, 1.0),  // magenta
        vec4(0.0, 1.0, 1.0, 1.0),  // cyan
        vec4(1.0, 1.0, 1.0, 1.0)   // white
    ];

    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    //vertex color assigned by the index of the vertex

    var indices = [a, b, c, a, c, d];

    for ( var i = 0; i < indices.length; ++i ) {
        positions.push( vertices[indices[i]] );
        //colors.push( vertexColors[indices[i]] );

        // for solid colored faces use
        colors.push(vertexColors[a]);
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

function DotMatrixChar(origin, scale, cubeScale, color, character) {
    var cubes = [];
    
    var letterMaps = [];
    //A = index 0, Z = index 25
    //number 0 = index 26, number 9 = index 35

    // A
    letterMaps.push(
        [
            "01110",
            "10001",
            "10001",
            "11111",
            "10001",
            "10001",
            "10001"
        ]
    );
    // B
    letterMaps.push(
        [
            "11110",
            "10001",
            "10001",
            "11110",
            "10001",
            "10001",
            "11110"
        ]
    );
    // C
    letterMaps.push(
        [
            "01110",
            "10001",
            "10000",
            "10000",
            "10000",
            "10001",
            "01110"
        ]
    );
    // D
    letterMaps.push(
        [
            "11110",
            "10001",
            "10001",
            "10001",
            "10001",
            "10001",
            "11110"
        ]
    );
    // E
    letterMaps.push(
        [
            "11111",
            "10000",
            "10000",
            "11110",
            "10000",
            "10000",
            "11111"
        ]
    );
    // F
    letterMaps.push(
        [
            "11111",
            "10000",
            "10000",
            "11110",
            "10000",
            "10000",
            "10000"
        ]
    );
    // G
    letterMaps.push(
        [
            "01110",
            "10001",
            "10000",
            "10111",
            "10001",
            "10001",
            "01110"
        ]
    );
    // H
    letterMaps.push(
        [
            "10001",
            "10001",
            "10001",
            "11111",
            "10001",
            "10001",
            "10001"
        ]
    );
    // I
    letterMaps.push(
        [
            "01110",
            "00100",
            "00100",
            "00100",
            "00100",
            "00100",
            "01110"
        ]
    );
    // J
    letterMaps.push(
        [
            "00001",
            "00001",
            "00001",
            "00001",
            "10001",
            "10001",
            "01110"
        ]
    );
    // K
    letterMaps.push(
        [
            "10001",
            "10010",
            "10100",
            "11000",
            "10100",
            "10010",
            "10001"
        ]
    );
    // L
    letterMaps.push(
        [
            "10000",
            "10000",
            "10000",
            "10000",
            "10000",
            "10000",
            "11111"
        ]
    );
    // M
    letterMaps.push(
        [
            "10001",
            "11011",
            "10101",
            "10101",
            "10001",
            "10001",
            "10001"
        ]
    );


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
        if (isLetter(character)) {
            letterCode = character.toUpperCase().charCodeAt(0) - 65;
        } else {
            if (parseInt(character) != NaN) {
                letterCode = character.charCodeAt(0) - 48 + 26;   
            } else {
                console.log("Not a number or letter!");
            }
        }

        this.letterToCubes(parseInt(letterCode));

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
    unleadedElement.innerText = "Unleaded: " + unleadedPrice;
    midgradeElement.innerText = "Midgrade: " + midgradePrice;
    supremeElement.innerText = "Supreme: " + supremePrice;

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (isRotating) {
      theta[1] += 0.8;
    }
    gl.uniform3fv(thetaLoc, theta);

    //signPost.draw();
    //signBoard.draw();

    for (var i = 0; i < unleadedLetters.length; i++) {
        unleadedLetters[i].draw();
    }

    for (var i = 0; i < cubes.length; i++) {
        cubes[i].draw();
    }

    requestAnimationFrame(render);
}

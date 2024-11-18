"use strict";

/*********
CS 435
Project #6
Lilly Eide

This program explores texture blending and transparency.
The only thing different from Project #5 is the addition of transparency.

This program used Project #5 as a starting point.

*********/

var canvas;
var gl;

var index = 0;

var positionsArray = [];
var normalsArray = [];

var isTVOn = false;
var isPlaying = true;
var ballIsEnabled = true;
var currentFrame = 0;
var numberOfFrames = 75;
var frameRate = 60;
var millisecondsBetweenFrames = 1000 / frameRate;
var lastRecordedTime;

var lightDirection;
// unused
var lightRotationX = 0.0;
var lightRotationY = 0.0;
// Limit is the "field of view" of the light
var limit = radians(80);

// Determines where the light should point
var lightLookAt = vec3(0, 0, 0);

// Set clipping planes and fov of camera
var near = 0.001;
var far = 100;
var fovy = 50;

var texCoordsArray = [];
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

// lightPosition is the current light position.
var lightPosition = vec3(0, 13, 9);

// Ambient light is a very dark gray
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);


var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var materialSpecular = vec4(0.0, 0.0, 0.0, 1.0);
var materialShininess = 500.0;

var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var worldInverseTransposeLocation;
var worldInverseMatrix;
var worldInverseTransposeMatrix;
var worldLocation;
var lightWorldPositionLocation;
var viewWorldPositionLocation;
var lightDirectionLocation;
var limitLocation;

var animationFrames = [];
var texture1;
var woodTexture;
var carpetTexture;
var brickTexture;
var blackTexture;
var blueTexture;
var cupTexture;
var transparentTexture;

var nMatrix, nMatrixLoc;

var eye = vec3(0, 8, 17);
// Look at center of room
var at = vec3(0.0, 5.0, 0.0);
var up = normalize(vec3(0.0, 1.0, 0.0));

function triangle(a, b, c) {

    var t1 = subtract(b, a);
    var t2 = subtract(c, a);
    var normal = normalize(cross(t2, t1));
    normal = vec4(normal[0], normal[1], normal[2], 0.0);

    normalsArray.push(normal);
    normalsArray.push(normal);
    normalsArray.push(normal);


    positionsArray.push(a);
    positionsArray.push(b);
    positionsArray.push(c);

    index += 3;
}

function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
         gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

// Quad, expecting vec4s in order of top left, top right, bottom right, bottom left
function quad(a, b, c, d) {
    triangle(a, b, c);
    texCoordsArray.push(texCoord[0]);
    texCoordsArray.push(texCoord[3]);
    texCoordsArray.push(texCoord[2]);
    
    triangle(a, c, d);
    texCoordsArray.push(texCoord[0]);
    texCoordsArray.push(texCoord[2]);
    texCoordsArray.push(texCoord[1]);
}

// Creates a cube centered at center, scaled on x, y and z by scale
// center and scale are vec3s
function cube(center, scale) {
    // Front face
    quad(vec4(-1 * scale[0] + center[0], 1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], 1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], -1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], -1 * scale[1] + center[1], 1 * scale[2] + center[2], 1));
    // left side
    quad(vec4(-1 * scale[0] + center[0], 1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], 1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], -1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], -1 * scale[1] + center[1], -1 * scale[2] + center[2], 1));
    // back side
    quad(vec4(1 * scale[0] + center[0], 1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], 1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], -1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], -1 * scale[1] + center[1], -1 * scale[2] + center[2], 1));
    // right side
    quad(vec4(1 * scale[0] + center[0], 1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], 1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], -1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], -1 * scale[1] + center[1], 1 * scale[2] + center[2], 1));
    // top side
    quad(vec4(-1 * scale[0] + center[0], 1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], 1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], 1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], 1 * scale[1] + center[1], 1 * scale[2] + center[2], 1));
    // bottom side
    quad(vec4(-1 * scale[0] + center[0], -1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], -1 * scale[1] + center[1], 1 * scale[2] + center[2], 1), vec4(1 * scale[0] + center[0], -1 * scale[1] + center[1], -1 * scale[2] + center[2], 1), vec4(-1 * scale[0] + center[0], -1 * scale[1] + center[1], -1 * scale[2] + center[2], 1));
}

window.onload = function init() {

    lastRecordedTime = new Date().getTime();
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);


    // ***** Room Definition *****
    // Floor
    var floorHeight = 0;
    var floorWidth = 5;
    var floorLength = 5;
    // Given as top left, top right, bottom right, bottom left
    quad(vec4(-floorWidth, floorHeight, -floorLength, 1), vec4(floorWidth, floorHeight, -floorLength, 1), vec4(floorWidth, floorHeight, floorLength, 1), vec4(-floorWidth, floorHeight, floorLength, 1));

    // Walls
    var wallHeight = 5;
    var wallWidth = 5;
    quad(vec4(-wallWidth, 2 * wallHeight, wallWidth, 1), vec4(-wallWidth, 2 * wallHeight, -wallWidth, 1), vec4(-wallWidth, 0, -wallWidth, 1), vec4(-wallWidth, 0, wallWidth, 1));
    quad(vec4(-wallWidth, 2 * wallHeight, -wallWidth, 1), vec4(wallWidth, 2 * wallHeight, -wallWidth, 1), vec4(wallWidth, 0, -wallWidth, 1), vec4(-wallWidth, 0, -wallWidth, 1));
    quad(vec4(wallWidth, 2 * wallHeight, -wallWidth, 1), vec4(wallWidth, 2 * wallHeight, wallWidth, 1), vec4(wallWidth, 0, wallWidth, 1), vec4(wallWidth, 0, -wallWidth, 1));

    // Table
    // Each cube contains 6 quads, keep this in mind
    // 5 cubes, so 30 quads
    cube(vec3(0, 3, 0), vec3(3, 0.2, 2));
    cube(vec3(-2.8, 1.4, 1.8), vec3(0.2, 1.4, 0.2));
    cube(vec3(2.8, 1.4, 1.8), vec3(0.2, 1.4, 0.2));
    cube(vec3(2.8, 1.4, -1.8), vec3(0.2, 1.4, 0.2));
    cube(vec3(-2.8, 1.4, -1.8), vec3(0.2, 1.4, 0.2));

    // TV (just a cube)
    cube(vec3(0, 4.6, 0), vec3(2, 1.5, 1));

    // TV screen
    quad(vec4(-1.8, 5.9, 1.1, 1), vec4(1.8, 5.9, 1.1, 1), vec4(1.8, 3.5, 1.1, 1), vec4(-1.8, 3.5, 1.1, 1));

    // "Ball"
    cube(vec3(2.5, 3.6, 1), vec3(0.2, 0.2, 0.2));

    // "Cup"
    cube(vec3(2.5, 3.2, 1), vec3(0.4, 0.05, 0.4));
    cube(vec3(2.2, 3.6, 1), vec3(0.05, 0.4, 0.4));
    cube(vec3(2.8, 3.6, 1), vec3(0.05, 0.4, 0.4));
    cube(vec3(2.5, 3.6, 0.7), vec3(0.4, 0.4, 0.05));
    cube(vec3(2.5, 3.6, 1.3), vec3(0.4, 0.4, 0.05));


    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( normalLoc);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");
    nMatrixLoc = gl.getUniformLocation(program, "uNormalMatrix");

    document.getElementById("tvOnOffButton").onclick = function () {
        isTVOn = !isTVOn;
        if (isTVOn) {
            document.getElementById("tvOnOffButton").innerText = "Turn TV Off";
        } else {
            document.getElementById("tvOnOffButton").innerText = "Turn TV On";
        }
    }

    document.getElementById("pausePlayButton").onclick = function () {
        isPlaying = !isPlaying;
        if (isPlaying) {
            document.getElementById("pausePlayButton").innerText = "Pause";
        } else {
            document.getElementById("pausePlayButton").innerText = "Play";
        }
    }

    document.getElementById("nextFrameButton").onclick = function () {
        currentFrame += 1;
        if (currentFrame > numberOfFrames - 1) {
            currentFrame = 0;
        }
    }

    document.getElementById("prevFrameButton").onclick = function () {
        currentFrame -= 1;
        if (currentFrame < 0) {
            currentFrame = numberOfFrames - 1;
        }
    }

    document.getElementById("toggleBallButton").onclick = function () {
        ballIsEnabled = !ballIsEnabled;
        if (ballIsEnabled) {
            document.getElementById("toggleBallButton").innerText = "Remove Ball";
        } else {
            document.getElementById("toggleBallButton").innerText = "Add Ball";
        }
    }

    document.getElementById("frameRateSelector").onchange = function () {
        var selectedFPS = parseInt(document.getElementById("frameRateSelector").value);
        // console.log("FPS: " + selectedFPS);
        frameRate = selectedFPS;
        millisecondsBetweenFrames = 1000 / frameRate;
    }
    
    gl.uniform4fv(gl.getUniformLocation(program,
       "uAmbientProduct"),flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
       "uDiffuseProduct"),flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
       "uSpecularProduct"),flatten(specularProduct));
    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"),materialShininess);
    
    // NEW STUFF
    worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
    worldLocation = gl.getUniformLocation(program, "u_world");
    lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
    viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");
    lightDirectionLocation = gl.getUniformLocation(program, "u_lightDirection");
    limitLocation = gl.getUniformLocation(program, "u_limit");

    // Initialize animation frames array based on frames from image sequence
    for (var i = 1; i <= numberOfFrames; i++) {
        var animImageID = "frame" + i.toString().padStart(2, '0');
        var frameTexture = document.getElementById(animImageID);
        animationFrames.push(configureTexture(frameTexture));
    }

    var img1 = document.getElementById("texWood");
    texture1 = configureTexture(img1);
    var img2 = document.getElementById("texWood");
    woodTexture = configureTexture(img2);
    var img3 = document.getElementById("texBrick");
    brickTexture = configureTexture(img3);
    var img4 = document.getElementById("texCarpet");
    carpetTexture = configureTexture(img4);
    var img5 = document.getElementById("texBlack");
    blackTexture = configureTexture(img5);
    var img6 = document.getElementById("texBlue"); // blue color for ball
    blueTexture = configureTexture(img6);
    var img7 = document.getElementById("texCup"); // transparent light red color for cup
    cupTexture = configureTexture(img7);
    var img8 = document.getElementById("texTransparent"); // fully transparent color for ball
    transparentTexture = configureTexture(img8);

    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 0);

    render();
}


function render() {
    
    // Frame delta system inspired by Unity's deltaTime system
    var currentTime = new Date().getTime();
    var timeElapsedSinceLastFrame = currentTime - lastRecordedTime;
    // Essentially, if the corrent amount of time has elapsed to display a new frame, we change the current frame index
    if (timeElapsedSinceLastFrame > millisecondsBetweenFrames) {
        lastRecordedTime = currentTime;
        if (isPlaying) {
            currentFrame += 1;
            // Frames are zero indexed, so we have to subtract from numberOfFrames by 1
            if (currentFrame > numberOfFrames - 1) {
                currentFrame = 0;
            }
        }
    }

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Recall that lookAt is where the camera is theoretically placed.
    // eye is where the camera is located relative to the world
    // at is where the camera is pointing at
    // up is the up direction, generally represented by the Y axis, but can be a different vector if camera rotation is changed

    modelViewMatrix = lookAt(eye, at, up);
    projectionMatrix = perspective(fovy, canvas.width / canvas.height, near, far);
    
    nMatrix = normalMatrix(modelViewMatrix, true );

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix) );

    var worldMatrix = rotateY(0);

    worldInverseMatrix = inverse(worldMatrix);
    worldInverseTransposeMatrix = transpose(worldInverseMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, flatten(worldInverseTransposeMatrix));

    gl.uniformMatrix4fv(worldLocation, false, flatten(worldMatrix));

    // lightRotationX += 0.3;
    // lightRotationY += 0.3;

    // determines the position in world space that the light should point at
    var lightLookAtPosition = lightLookAt;
    var lmat = lookAt(lightPosition, lightLookAtPosition, up);
    lmat = mult(rotateX(lightRotationX), lmat); // Rotate by given light rotation
    lmat = mult(rotateY(lightRotationY), lmat);
    lmat = flatten(lmat);
    // Get desired vector from lookAt matrix
    lightDirection = vec3(-lmat[2], -lmat[6], -lmat[10]);

    gl.uniform3fv(lightDirectionLocation, lightDirection);
    gl.uniform1f(limitLocation, Math.cos(limit));
    
    gl.uniform3fv(lightWorldPositionLocation, lightPosition);
    gl.uniform3fv(viewWorldPositionLocation, eye);
    
    // gl.bindTexture(gl.TEXTURE_2D, animationFrames[currentFrame]);

    // Order of quads:
    // Quad 1: floor
    // Quads 2, 3, and 4: walls
    // Quads 5 - 34: table
    // Quads 35 - 40: TV
    // Last quad: TV screen

    // go through index on a quad-by-quad basis
    for (var i = 0; i < index; i += 6) {
        var currentQuad = i / 6;
        // Determine what texture to use based on what quad is currently being handled
        switch (true) {
            case (currentQuad <= 0): // First quad, floor
                gl.bindTexture(gl.TEXTURE_2D, carpetTexture);
                break;
            case (currentQuad <= 3): // Second, third and fourth quads
                gl.bindTexture(gl.TEXTURE_2D, brickTexture);
                break;
            case (currentQuad <= 33): // Quads 5 - 34: table
                gl.bindTexture(gl.TEXTURE_2D, woodTexture);
                break;
            case (currentQuad <= 39): // TV shell
                gl.bindTexture(gl.TEXTURE_2D, blackTexture);
                break;
            case (currentQuad <= 40): // TV screen
                if (isTVOn) {
                    gl.bindTexture(gl.TEXTURE_2D, animationFrames[currentFrame]);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, blackTexture);
                }
                break;
            case (currentQuad <= 46):
                if (ballIsEnabled) {
                    gl.bindTexture(gl.TEXTURE_2D, blueTexture);
                } else {
                    gl.bindTexture(gl.TEXTURE_2D, transparentTexture);
                }
                
                break;
            case (currentQuad <= 76):
                gl.bindTexture(gl.TEXTURE_2D, cupTexture);
                break;
            default: // default to brick texture
                gl.bindTexture(gl.TEXTURE_2D, woodTexture);
                break;
        }

        gl.drawArrays( gl.TRIANGLES, i, 6 );
    }

    requestAnimationFrame(render);
}

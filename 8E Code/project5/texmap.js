"use strict";

/*********
CS 435
Project #4
Lilly Eide

This program demonstrates rudimentary lighting with a spot light.
The spot light can be placed in 5 distinct positions.
The camera can be placed in 6 distinct locations.
Using the buttons on the page, the user can point the left downwards, left, right, north and south.
The limit (or field of view) of the light can be increased or decreased as well.

This program used shadedSphere4.js from chapter 06 as a starting point, and heavily referenced the following link for how to actually set up the spot light.
https://webglfundamentals.org/webgl/lessons/webgl-3d-lighting-point.html

*********/

var canvas;
var gl;

var index = 0;

var positionsArray = [];
var normalsArray = [];

var isTVOn = false;
var isPlaying = true;
var currentFrame = 0;
var numberOfFrames = 75;
var frameRate = 12;
var millisecondsBetweenFrames = 1000 / frameRate;
var lastRecordedTime;

// Initialize camera positions
var cameraHeight = 8;
var camPosA = vec3(-6, cameraHeight, -3);
var camPosB = vec3(0, cameraHeight, -4.5);
var camPosC = vec3(6, cameraHeight, -3);
var camPosD = vec3(-6, cameraHeight, 6);
var camPosE = vec3(0, cameraHeight, 7.5);
var camPosF = vec3(6, cameraHeight, 6);
var camPosG = vec3(6, -cameraHeight, 6);
var camPositions = [camPosA, camPosB, camPosC, camPosD, camPosE, camPosF, camPosG];

// Initialize light positions
var lightHeight = 1;
var lightPos1 = vec3(-2, lightHeight, 2);
var lightPos2 = vec3(-2, lightHeight, 0);
var lightPos3 = vec3(0.001, lightHeight, 0.001);
var lightPos4 = vec3(2, lightHeight, 0);
var lightPos5 = vec3(2, lightHeight, 2);
var lightPos6 = vec3(20, 30, 50);
var lightPos7 = vec3(2, -lightHeight, 2);
var lightPositions = [lightPos1, lightPos2, lightPos3, lightPos4, lightPos5, lightPos6, lightPos7];
var lightDirection;
// unused
var lightRotationX = 0.0;
var lightRotationY = 0.0;
// Limit is the "field of view" of the light
var limit = radians(45);

// Positions in lightLookAt array are added to current light position to determine where the light should point
// Look downwards
// For looking straight downwards, a small amount has to be added to X or Z, otherwise light won't look in correct direction
var lightLookAt1 = vec3(0.001, -1.0, 0.001);
// Look left
var lightLookAt2 = vec3(-1.0, 0.0, 0.0);
// Look right
var lightLookAt3 = vec3(1.0, 0.0, 0.0);
// Look North? Up? idk
var lightLookAt4 = vec3(0.0, 0.0, -1.0);
// Look South/Down
var lightLookAt5 = vec3(0.0, 0.0, 1.0);
var lightLookAtArr = [lightLookAt1, lightLookAt2, lightLookAt3, lightLookAt4, lightLookAt5];
var lightLookAt = lightLookAtArr[0];

// Set clipping planes and fov of camera
var near = 0.001;
var far = 100;
var fovy = 50;

// var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
// lightPosition is the current light position. Initialize it to the first position
var lightPosition = lightPositions[0];

// Ambient light is a very dark gray
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// Environment is an orange color
var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.5, 0.0, 1.0);
var materialSpecular = vec4(0.0, 0.0, 0.0, 1.0);
var materialShininess = 500.0;

var ambientColor, diffuseColor, specularColor;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

// NEW STUFF
var worldInverseTransposeLocation;
var worldInverseMatrix;
var worldInverseTransposeMatrix;
var worldLocation;
var lightWorldPositionLocation;
var viewWorldPositionLocation;
var lightDirectionLocation;
var limitLocation;

var tvImageElement;

var nMatrix, nMatrixLoc;

var eye = camPositions[0];
// Look at center of room
var at = vec3(0.0, 0.0, 1.0);
var up = vec3(0.0, 1.0, 0.0);

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

function quad(a, b, c, d) {
    triangle(a, b, c);
    triangle(a, c, d);
}

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

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    var wallHeight = 2;

    
    // Floor, given in top left, top right, bottom right, bottom left
    quad(vec4(-3, 0, -1, 1), vec4(3, 0, -1, 1), vec4(1, 0, 1, 1), vec4(-1, 0, 1, 1));
    quad(vec4(-3, 0, -1, 1), vec4(-1, 0, 1, 1), vec4(-1, 0, 3, 1), vec4(-3, 0, 3, 1));
    quad(vec4(1, 0, 1, 1), vec4(3, 0, -1, 1), vec4(3, 0, 3, 1), vec4(1, 0, 3, 1));

    // "back" wall. Walls are of height 2
    quad(vec4(-3, 2, -1, 1), vec4(3, 2, -1, 1), vec4(3, 0, -1, 1), vec4(-3, 0, -1, 1));

    // Remaining walls, in clockwise order
    // (swap ordering of all of these? Maybe?)
    quad(vec4(3, wallHeight, -1, 1), vec4(3, wallHeight, 3, 1), vec4(3, 0, 3, 1), vec4(3, 0, -1, 1));
    quad(vec4(3, wallHeight, 3, 1), vec4(1, wallHeight, 3, 1), vec4(1, 0, 3, 1), vec4(3, 0, 3, 1));
    quad(vec4(1, wallHeight, 3, 1), vec4(1, wallHeight, 1, 1), vec4(1, 0, 1, 1), vec4(1, 0, 3, 1));
    quad(vec4(1, wallHeight, 1, 1), vec4(-1, wallHeight, 1, 1), vec4(-1, 0, 1, 1), vec4(1, 0, 1, 1));
    quad(vec4(-1, wallHeight, 1, 1), vec4(-1, wallHeight, 3, 1), vec4(-1, 0, 3, 1), vec4(-1, 0, 1, 1));
    quad(vec4(-1, wallHeight, 3, 1), vec4(-3, wallHeight, 3, 1), vec4(-3, 0, 3, 1), vec4(-1, 0, 3, 1));
    quad(vec4(-3, wallHeight, 3, 1), vec4(-3, wallHeight, -1, 1), vec4(-3, 0, -1, 1), vec4(-3, 0, 3, 1));
    

    // Cube centered at 0, 0, 0 with width 2
    // cube(vec3(0, 0, 0), vec3(1, 1, 1));
    
    // cube(vec3(lightPosition[0], lightPosition[1], lightPosition[2]), vec3(0.1, 0.1, 0.1));
    
    // Front face
    // quad(vec4(-1, 1, 1, 1), vec4(1, 1, 1, 1), vec4(1, -1, 1, 1), vec4(-1, -1, 1, 1));
    // // left side
    // quad(vec4(-1, 1, -1, 1), vec4(-1, 1, 1, 1), vec4(-1, -1, 1, 1), vec4(-1, -1, -1, 1));
    // // back side
    // quad(vec4(1, 1, -1, 1), vec4(-1, 1, -1, 1), vec4(-1, -1, -1, 1), vec4(1, -1, -1, 1));
    // // right side
    // quad(vec4(1, 1, 1, 1), vec4(1, 1, -1, 1), vec4(1, -1, -1, 1), vec4(1, -1, 1, 1));
    // // top side
    // quad(vec4(-1, 1, -1, 1), vec4(1, 1, -1, 1), vec4(1, 1, 1, 1), vec4(-1, 1, 1, 1));
    // // bottom side
    // quad(vec4(-1, -1, 1, 1), vec4(1, -1, 1, 1), vec4(1, -1, -1, 1), vec4(-1, -1, -1, 1));

    // Floor
    // var floorHeight = -3;
    // quad(vec4(-10, floorHeight, -10, 1), vec4(10, floorHeight, -10, 1), vec4(10, floorHeight, 10, 1), vec4(-10, floorHeight, 10, 1));

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
        tvImageElement.src = "tv_sequence/frame00" + (currentFrame + 1).toString().padStart(2, '0') + ".png";
    }

    document.getElementById("prevFrameButton").onclick = function () {
        currentFrame -= 1;
        if (currentFrame < 0) {
            currentFrame = numberOfFrames - 1;
        }
        tvImageElement.src = "tv_sequence/frame00" + (currentFrame + 1).toString().padStart(2, '0') + ".png";
    }

    document.getElementById("frameRateSelector").onchange = function () {
        var selectedFPS = parseInt(document.getElementById("frameRateSelector").value);
        console.log("FPS: " + selectedFPS);
        frameRate = selectedFPS;
        millisecondsBetweenFrames = 1000 / frameRate;
    }

    // document.getElementById("lightPos").onchange = function () {
    //     var selectedPos = parseInt(document.getElementById("lightPos").value);
    //     // console.log(selectedPos);
    //     lightPosition = lightPositions[selectedPos];
    // }

    // document.getElementById("lightFovIncrease").onclick = function () {
    //     // increase by 5 degrees
    //     limit += radians(5);
    //     if (limit > radians(90)) {
    //         limit = radians(90);
    //     }
    // }

    // document.getElementById("lightFovDecrease").onclick = function () {
    //     // increase by 5 degrees
    //     limit -= radians(5);
    //     if (limit <= radians(0)) {
    //         limit = radians(0);
    //     }
    // }

    // document.getElementById("lightDir1").onclick = function () {
    //     lightLookAt = lightLookAtArr[0];
    // }

    // document.getElementById("lightDir2").onclick = function () {
    //     lightLookAt = lightLookAtArr[1];
    // }

    // document.getElementById("lightDir3").onclick = function () {
    //     lightLookAt = lightLookAtArr[2];
    // }

    // document.getElementById("lightDir4").onclick = function () {
    //     lightLookAt = lightLookAtArr[3];
    // }

    // document.getElementById("lightDir5").onclick = function () {
    //     lightLookAt = lightLookAtArr[4];
    // }


    
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

    tvImageElement = document.getElementById("texImage");

    render();
}


function render() {
    
    // Frame delta system inspired by Unity's deltaTime system
    var currentTime = new Date().getTime();
    var timeElapsedSinceLastFrame = currentTime - lastRecordedTime;
    // Essentially, if the corrent amount of time has elapsed to display a new frame, we change the current frame index
    if (timeElapsedSinceLastFrame > millisecondsBetweenFrames) {
        // Change texture here
        //console.log("file name: " + "tv_sequence/frame00" + currentFrame.toString().padStart(2, '0'));
        //document.getElementById("texImage").src = "tv_sequence/frame00" + currentFrame.toString().padStart(2, '0');

        lastRecordedTime = currentTime;
        if (isPlaying) {
            currentFrame += 1;
            // Frames are zero indexed, so we have to subtract from numberOfFrames by 1
            if (currentFrame > numberOfFrames - 1) {
                currentFrame = 0;
            }
            //console.log("file name: " + "tv_sequence/frame00" + currentFrame.toString().padStart(2, '0'));
            tvImageElement.src = "tv_sequence/frame00" + (currentFrame + 1).toString().padStart(2, '0') + ".png";
        }
        
        
    }

    // console.log("Current frame: " + currentFrame);

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

    // NEW STUFF

    var worldMatrix = rotateY(0);

    worldInverseMatrix = inverse(worldMatrix);
    worldInverseTransposeMatrix = transpose(worldInverseMatrix);
    gl.uniformMatrix4fv(worldInverseTransposeLocation, false, flatten(worldInverseTransposeMatrix));

    gl.uniformMatrix4fv(worldLocation, false, flatten(worldMatrix));

    // lightRotationX += 0.3;
    // lightRotationY += 0.3;

    // determines the position in world space that the light should point at
    var lightLookAtPosition = add(lightPosition, lightLookAt);
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
    
    for( var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    requestAnimationFrame(render);
}

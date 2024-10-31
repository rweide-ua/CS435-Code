"use strict";

var canvas;
var gl;

var numPositions  = 36;

var texSize = 64;

var program;
var flag = false;

var positionsArray = [];
var colorsArray = [];
var texCoordsArray = [];

// var texture;
var texture1;
var texture2;

var numbersTextures = [];

var isPlaying = true;
var currentFrame = 0;
var numberOfFrames = 75;
var frameRate = 60;
var millisecondsBetweenFrames = 1000 / frameRate;
var lastRecordedTime;

var animationFrames = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var vertices = [
    vec4(-0.5, -0.5,  0.5, 1.0),
    vec4(-0.5,  0.5, 0.5, 1.0),
    vec4(0.5,  0.5, 0.5, 1.0),
    vec4(0.5, -0.5, 0.5, 1.0),
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
    vec4(1.0, 1.0, 1.0, 1.0),  // white
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = xAxis;
var theta = vec3(45.0, 45.0, 45.0);

var thetaLoc;

function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
         gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    // gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 0);

    return texture;
}


function quad(a, b, c, d) {
    positionsArray.push(vertices[a]);
    colorsArray.push(vertexColors[6]);
    texCoordsArray.push(texCoord[0]);

    positionsArray.push(vertices[b]);
    colorsArray.push(vertexColors[6]);
    texCoordsArray.push(texCoord[1]);

    positionsArray.push(vertices[c]);
    colorsArray.push(vertexColors[6]);
    texCoordsArray.push(texCoord[2]);

    positionsArray.push(vertices[a]);
    colorsArray.push(vertexColors[6]);
    texCoordsArray.push(texCoord[0]);

    positionsArray.push(vertices[c]);
    colorsArray.push(vertexColors[6]);
    texCoordsArray.push(texCoord[2]);

    positionsArray.push(vertices[d]);
    colorsArray.push(vertexColors[6]);
    texCoordsArray.push(texCoord[3]);
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
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    //
    // Initialize a texture
    //

    //var image = new Image();
    //image.onload = function() {
     //   configureTexture( image );
    //}
    //image.src = "SA2011_black.gif"


    // var image = document.getElementById("texImage");
    // configureTexture(image);

    var img1 = document.getElementById("Img1");
    // alert("width="+img1.naturalWidth+" height="+img1.naturalHeight);
    texture1 = configureTexture(img1);
    var img2 = document.getElementById("Img2");
    texture2 = configureTexture(img2);

    for (var i = 1; i <= 6; i++) {
        var textElementID = "ImgTest" + i;
        var numberTexture = document.getElementById(textElementID);
        numbersTextures.push(configureTexture(numberTexture));
    }

    /*
    var framesDiv = document.getElementById("animationFramesDiv");
    var framesElementsHTML = "";
    for (var i = 1; i <= numberOfFrames; i++) {
        var frameFilePath = "tv_sequence/frame00" + i.toString().padStart(2, '0') + ".png";
        console.log("Frame to load: " + frameFilePath);
        framesElementsHTML += "<img src=\"" + frameFilePath + "\" id=\"frame" + i.toString().padStart(2, '0') + "\" hidden> ";
    }
    
    // Load animation frames onto page
    framesDiv.innerHTML = framesElementsHTML;
    */

    // Populate textures array with textures
    for (var i = 1; i <= numberOfFrames; i++) {
        var animImageID = "frame" + i.toString().padStart(2, '0');
        console.log("Frame ID: " + animImageID);
        var frameTexture = document.getElementById(animImageID);
        animationFrames.push(configureTexture(frameTexture));
    }

    gl.uniform1i(gl.getUniformLocation(program, "uTextureMap"), 0);
        
    thetaLoc = gl.getUniformLocation(program, "uTheta");

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};

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
            // tvImageElement.src = "tv_sequence/frame00" + (currentFrame + 1).toString().padStart(2, '0') + ".png";
            // console.log("Update frame!");
        }
        
        
    }

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(flag) theta[axis] += 2.0;
    gl.uniform3fv(thetaLoc, theta);
    // gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    
    // Old code: VVVVVV

    /*
    // console.log(numPositions / 2);

    // The idea behind this is that we draw the first half of the triangles with a given texture, then we change the texture and draw the second half, it seems
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.drawArrays(gl.TRIANGLES, 0, numPositions/2);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    // Here, the second argument represents the starting point for which to draw the triangles
    // That is to say, after having drawn the first half of the triangles, this draws the second half
    gl.drawArrays(gl.TRIANGLES, numPositions/2, numPositions/2);

    */
    
    // Test: Can we swap textures repeatedly, drawing a single quad at a time?
    var quadIncrement = 6;
    var currentQuad = 0;

    for (var i = 0; i < numbersTextures.length; i++) {
        if (i == 0) {
            gl.bindTexture(gl.TEXTURE_2D, animationFrames[currentFrame]);
        } else {
            gl.bindTexture(gl.TEXTURE_2D, numbersTextures[i]);
        }
        gl.drawArrays(gl.TRIANGLES, currentQuad, quadIncrement);
        currentQuad += quadIncrement;
    }

    /*
    // This should draw the textures in a different order
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.drawArrays(gl.TRIANGLES, currentQuad, currentQuad + quadIncrement);
    currentQuad += quadIncrement;

    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.drawArrays(gl.TRIANGLES, currentQuad, currentQuad + quadIncrement);
    currentQuad += quadIncrement;

    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.drawArrays(gl.TRIANGLES, currentQuad, currentQuad + quadIncrement);
    currentQuad += quadIncrement;

    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.drawArrays(gl.TRIANGLES, currentQuad, currentQuad + quadIncrement);
    currentQuad += quadIncrement;

    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.drawArrays(gl.TRIANGLES, currentQuad, currentQuad + quadIncrement);
    currentQuad += quadIncrement;

    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.drawArrays(gl.TRIANGLES, currentQuad, currentQuad + quadIncrement);
    */
    

    requestAnimationFrame(render);
}

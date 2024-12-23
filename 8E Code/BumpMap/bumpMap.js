"use strict";

var canvas;
var gl;

// var texSize = 256;
var texSize = 512;

/*
// Bump Data

var data = new Array()
    for (var i = 0; i<= texSize; i++)  data[i] = new Array();
    for (var i = 0; i<= texSize; i++) for (var j=0; j<=texSize; j++)
        data[i][j] = 0.0;
    for (var i = texSize/4; i<3*texSize/4; i++) for (var j = texSize/4; j<3*texSize/4; j++)
        data[i][j] = 1.0;

// Bump Map Normals

var normalst = new Array()
    for (var i=0; i<texSize; i++)  normalst[i] = new Array();
    for (var i=0; i<texSize; i++) for ( var j = 0; j < texSize; j++)
        normalst[i][j] = new Array();
    for (var i=0; i<texSize; i++) for ( var j = 0; j < texSize; j++) {
        normalst[i][j][0] = data[i][j]-data[i+1][j];
        normalst[i][j][1] = data[i][j]-data[i][j+1];
        normalst[i][j][2] = 1;
    }

// Scale to Texture Coordinates

    for (var i=0; i<texSize; i++) for (var j=0; j<texSize; j++) {
       var d = 0;
       for(k=0;k<3;k++) d+=normalst[i][j][k]*normalst[i][j][k];
       d = Math.sqrt(d);
       for(k=0;k<3;k++) normalst[i][j][k]= 0.5*normalst[i][j][k]/d + 0.5;
    }

// Normal Texture Array

var normals = new Uint8Array(3*texSize*texSize);

    for ( var i = 0; i < texSize; i++ )
        for ( var j = 0; j < texSize; j++ )
           for(var k =0; k<3; k++)
                normals[3*texSize*i+3*j+k] = 255*normalst[i][j][k];
*/

var numPositions  = 6;

var positionsArray = [];
var texCoordsArray = [];

var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var vertices = [
    vec4(0.0, 0.0, 0.0, 1.0),
    vec4(1.0,  0.0,  0.0, 1.0),
    vec4(1.0,  0.0,  1.0, 1.0),
    vec4(0.0, 0.0,  1.0, 1.0)
];

var modelViewMatrix, projectionMatrix, nMatrix;

var eye = vec3(2.0, 2.0, 2.0);
var at = vec3(0.5, 0.0, 0.5);
var up = vec3(0.0, 1.0, 0.0);

var normal = vec4(0.0, 1.0, 0.0, 0.0);
var tangent = vec3(1.0, 0.0, 0.0);

var lightPosition = vec4(0.0, 2.0, 0.0, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);

var materialDiffuse = vec4(0.7, 0.7, 0.7, 1.0);

var program;

var time = 0;

/*
function configureTexture( image ) {
    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
}
*/

function configureTexture(img) {

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var imgWidth = img.width;
    var imgHeight = img.height;
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    context.drawImage(img, 0, 0);
    var imageData = context.getImageData(0, 0, imgWidth, imgHeight);

    // alert("imgWidth=" + imgWidth + " imgHeight=" + imgHeight);
    // alert("imageData.width=" + imageData.width + " imageData.height=" + imageData.height);

    var tex_sx=0, tex_sy=0;
    var img_sx=0, img_sy=0;
    var width2copy=texSize, height2copy=texSize;   
    if (imageData.width < texSize) {
        img_sx = 0;
        tex_sx = (texSize - imageData.width) / 2;
        width2copy = imageData.width;
    }
    else {
        img_sx = (imageData.width - texSize) / 2;
        tex_sx = 0;
        width2copy = texSize;
    }
    if (imageData.height < texSize) {
        img_sy = 0;
        tex_sy = (texSize - imageData.height) / 2;
        height2copy = imageData.height;
    }
    else {
        img_sy = (imageData.height - texSize) / 2;
        tex_sy = 0;
        height2copy = texSize;
    }

    // alert("img_sx=" + img_sx + " tex_sx=" + tex_sx + " width2copy=" + width2copy);
    // alert("img_sy=" + img_sy + " tex_sy=" + tex_sy + " height2copy=" + height2copy);

    // Bump Data

    var data = new Array();
    for (var i = 0; i <= texSize; i++) data[i] = new Array();
    for (var i = 0; i <= texSize; i++) for (var j = 0; j <= texSize; j++)
        data[i][j] = 0.0;
    // 
    //for (var i = texSize / 4; i < 3 * texSize / 4; i++) for (var j = texSize / 4; j < 3 * texSize / 4; j++)
    //    data[i][j] = 1.0;
    //

    for (var i = 0; i < height2copy; i++) for (var j = 0; j < width2copy; j++) {
        var index = 4*((img_sy+i) * imageData.width + (img_sx+j));
        var red = imageData.data[index];
        var green = imageData.data[index + 1];
        var blue = imageData.data[index + 2];
        var alpha = imageData.data[index + 3];
        // data[tex_sy + i][tex_sx + j] = 1.0 - (red+green+blue) / 767.0;
        // data[tex_sy + i][tex_sx + j] = 1.0 - blue / 255.0;
        data[tex_sy + i][tex_sx + j] = (blue > 127) ? 0.0 : 1.0;;
    }

    // Bump Map Normals

    var normalst = new Array();
    for (var i = 0; i < texSize; i++) normalst[i] = new Array();
    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++)
        normalst[i][j] = new Array();
    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
        normalst[i][j][0] = data[i][j] - data[i + 1][j];
        normalst[i][j][1] = data[i][j] - data[i][j + 1];
        normalst[i][j][2] = 1;
    }

    // Scale to Texture Coordinates

    for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
        var d = 0;
        for (k = 0; k < 3; k++) d += normalst[i][j][k] * normalst[i][j][k];
        d = Math.sqrt(d);
        for (k = 0; k < 3; k++) normalst[i][j][k] = 0.5 * normalst[i][j][k] / d + 0.5;
    }

    // Normal Texture Array

    var normals = new Uint8Array(3 * texSize * texSize);

    for (var i = 0; i < texSize; i++)
        for (var j = 0; j < texSize; j++)
            for (var k = 0; k < 3; k++)
                normals[3 * texSize * i + 3 * j + k] = 255 * normalst[i][j][k];

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, texSize, texSize, 0, gl.RGB, gl.UNSIGNED_BYTE, normals);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
                      gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function mesh() {
     positionsArray.push(vertices[0]);
     texCoordsArray.push(texCoord[0]);

     positionsArray.push(vertices[1]);
     texCoordsArray.push(texCoord[1]);

     positionsArray.push(vertices[2]);
     texCoordsArray.push(texCoord[2]);

     positionsArray.push(vertices[2]); ;
     texCoordsArray.push(texCoord[2]);

     positionsArray.push(vertices[3]);
     texCoordsArray.push(texCoord[3]);

     positionsArray.push(vertices[0]);
     texCoordsArray.push(texCoord[0]);
}



window.onload = function init() {

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

    modelViewMatrix  = lookAt(eye, at, up);
    projectionMatrix = ortho(-0.75,0.75,-0.75,0.75,-5.5,5.5);

    nMatrix = normalMatrix(modelViewMatrix, true);

    mesh();

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW);

    var texCoordLoc = gl.getAttribLocation( program, "aTexCoord");
    gl.vertexAttribPointer( texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(texCoordLoc);

    // configureTexture(normals);

    var img1 = document.getElementById("Img1");
    configureTexture(img1);
    // var img2 = document.getElementById("Img2");
    // configureTexture(img2);

    var diffuseProduct = mult(lightDiffuse, materialDiffuse);

    gl.uniform4fv( gl.getUniformLocation(program, "uDiffuseProduct"), diffuseProduct);
    gl.uniform4fv( gl.getUniformLocation(program, "uLightPosition"), lightPosition);
    gl.uniform4fv( gl.getUniformLocation(program, "uNormal"), normal);
    gl.uniform3fv( gl.getUniformLocation(program, "uObjTangent"), tangent);

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uModelViewMatrix"), false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"), false, flatten(projectionMatrix));
    gl.uniformMatrix3fv( gl.getUniformLocation(program, "uNormalMatrix"), false, flatten(nMatrix));

    render();
}

var render = function(){

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    lightPosition[0] = 5.5*Math.sin(0.01*time);
    lightPosition[2] = 5.5*Math.cos(0.01*time);

    time += 1;

    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"), lightPosition);

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    requestAnimationFrame(render);
}

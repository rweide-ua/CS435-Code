"use strict";

var canvas;
var gl;

var index = 0;

var positionsArray = [];
var normalsArray = [];

var cameraHeight = 8;
var camPosA = vec3(-6, cameraHeight, -3);
var camPosB = vec3(0, cameraHeight, -4.5);
var camPosC = vec3(6, cameraHeight, -3);
var camPosD = vec3(-6, cameraHeight, 6);
var camPosE = vec3(0, cameraHeight, 7.5);
var camPosF = vec3(6, cameraHeight, 6);
var camPosG = vec3(6, -cameraHeight, 6);
var camPositions = [camPosA, camPosB, camPosC, camPosD, camPosE, camPosF, camPosG];

var lightHeight = 1;
var lightPos1 = vec4(-2, lightHeight, 2, 1.0);
var lightPos2 = vec4(-2, lightHeight, 0, 1.0);
var lightPos3 = vec4(0, lightHeight, 0, 1.0);
var lightPos4 = vec4(2, lightHeight, 0, 1.0);
var lightPos5 = vec4(2, lightHeight, 2, 1.0);
var lightPos6 = vec4(20, 30, 50, 1.0);
var lightPos7 = vec4(2, -lightHeight, 2, 1.0);
var lightPositions = [lightPos1, lightPos2, lightPos3, lightPos4, lightPos5, lightPos6, lightPos7];
var lightCutoff = 0.6;
// angle measured from current light position
// if lightDirection = vec4(1, 0, 0, 1.0), then light is pointing along position X axis
// same for if lightDirection = vec4(0, -1, 0, 1.0), then light is pointing straight downwards
var lightDirection = vec4(0, -1, 0, 1.0);

var near = 0.001;
var far = 100;
var fovy = 50;
var radius = 1.5;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

var left = -4.0;
var right = 4.0;
var ytop = 4.0;
var bottom = -4.0;

// var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightPosition = lightPositions[5];
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.5, 0.0, 1.0);
var materialSpecular = vec4(0.0, 0.0, 0.0, 1.0);
var materialShininess = 500.0;

var ctm;
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

var nMatrix, nMatrixLoc;

var eye = camPositions[0];
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


function divideTriangle(a, b, c, count) {
    if (count > 0) {

        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        divideTriangle(a, ab, ac, count - 1);
        divideTriangle(ab, b, bc, count - 1);
        divideTriangle(bc, c, ac, count - 1);
        divideTriangle(ab, bc, ac, count - 1);
    }
    else {
        triangle(a, b, c);
    }
}


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
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

    /* 
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
    */

    // Cube centered at 0, 0, 0 with width 2
    cube(vec3(0, 0, 0), vec3(1, 1, 1));
    
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
    quad(vec4(-10, -5, -10, 1), vec4(10, -5, -10, 1), vec4(10, -5, 10, 1), vec4(-10, -5, 10, 1));

    
    

    //triangle(topleft, topright, bottomright);
    //tetrahedron(va, vb, vc, vd, numTimesToSubdivide);

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

    document.getElementById("cameraPos").onchange = function () {
        var selectedPos = parseInt(document.getElementById("cameraPos").value);
        // console.log(selectedPos);
        eye = camPositions[selectedPos];
        init();
    }

    document.getElementById("lightPos").onchange = function () {
        var selectedPos = parseInt(document.getElementById("lightPos").value);
        // console.log(selectedPos);
        lightPosition = lightPositions[selectedPos];
        init();
    }

    
    gl.uniform4fv(gl.getUniformLocation(program,
       "uAmbientProduct"),flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
       "uDiffuseProduct"),flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
       "uSpecularProduct"),flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
       "uLightPosition"),flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"),materialShininess);
    
    // NEW STUFF
    worldInverseTransposeLocation = gl.getUniformLocation(program, "u_worldInverseTranspose");
    worldLocation = gl.getUniformLocation(program, "u_world");
    lightWorldPositionLocation = gl.getUniformLocation(program, "u_lightWorldPosition");
    viewWorldPositionLocation = gl.getUniformLocation(program, "u_viewWorldPosition");

    render();
}


function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // eye = vec3(radius*Math.sin(theta)*Math.cos(phi),
    //     radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));

    //eye = vec3(0, 10, 0.1);
    // eye = camPosA;
    // eye = vec3(0, 0, 0);
    // Recall that lookAt is where the camera is theoretically placed.
    // eye is where the camera is located relative to the world
    // at is where the camera is pointing at
    // up is the up direction, generally represented by the Y axis, but can be a different vector if camera rotation is changed
    modelViewMatrix = lookAt(eye, at, up);
    // ortho is the perspective type used for this project
    // projectionMatrix = ortho(left, right, bottom, ytop, near, far);
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

    //console.log(rotate(0, vec3(1.0, 0.0, 0.0)));
    gl.uniformMatrix4fv(worldLocation, false, flatten(rotateY(0)));


    // var currentLightPosition = vec3(0.5, 0.7, 1);

    // get first three components of light position
    var currentLightPosition = lightPosition.slice(0, 3);

    //console.log(vec3(lightPosition[0], lightPosition[1], lightPosition[2]));
    
    gl.uniform3fv(lightWorldPositionLocation, currentLightPosition);
    gl.uniform3fv(viewWorldPositionLocation, eye);
    
    for( var i=0; i<index; i+=3)
        gl.drawArrays( gl.TRIANGLES, i, 3 );

    requestAnimationFrame(render);
}

"use strict"

/*********
CS 435
Project #7
Lilly Eide

This is the final project for CS 435.
It is a pixel art painting program, with the option to change brush color, change the grid size, and other useful options.

Project #2, the Tetris project, was used as a starting point for this file, before being heavily modified.
*********/

var canvas;
var gl;

var projection; // projection matrix uniform shader variable location
var transformation; // projection matrix uniform shader variable location
var vPosition; // loc of attribute variables
var vColor;

var Layers = [];

var tBlockSize = 25;

var gridLineSize = 1;
var GridLines = [];
var gridSnapping = true;

var currentTool; // Options are "brush" and "eraser"
var selectedColorVec;
var isMouseDown = false;
var showGrid = true;
var transparencyLocation;

var activeLayerIndex = 0;

var backgroundColor;
var backgroundOpacity = 1.0;

// Taken and modified from https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255
    } : null;
}

// Input: 8 points representing 4 vec2s
// Output: A list of vec2s for a triangle function
function Quad(x0, y0, x1, y1, x2, y2, x3, y3) {
    var a1 = vec2(x0, y0);
    var b1 = vec2(x1, y1);
    var c1 = vec2(x2, y2);
    var d1 = vec2(x3, y3);
    return [[a1, b1, c1], [a1, c1, d1]];
}

// Defining a quad with a bottom left position, a width and a height.
function Quad2(startX, startY, width, height) {
    var a1 = vec2(startX, startY);
    var b1 = vec2(startX, startY + height);
    var c1 = vec2(startX + width, startY + height);
    var d1 = vec2(startX + width, startY);
    return [[a1, b1, c1], [a1, c1, d1]];
}

function GridLine(pos, color, isVertical) {
    this.color = color;
    this.colors = [];
    this.origin = vec2(0, 0);
    this.OffsetX = pos[0];
    this.OffsetY = pos[1];
    this.Angle = 0;
    this.quads = [];
    this.triangles = [];
    this.points = [];

    for (var i=0; i<6; i++) this.colors.push(this.color);

    if (isVertical) {
        this.quads.push(new Quad2(this.origin[0] - (gridLineSize / 2), this.origin[1] - (gridLineSize / 2), gridLineSize, canvas.height));
    } else {
        this.quads.push(new Quad2(this.origin[0] - (gridLineSize / 2), this.origin[1] - (gridLineSize / 2), canvas.width, gridLineSize));
    }
    

    for (var i = 0; i < this.quads.length; i++) {
        this.triangles.push(this.quads[i][0]);
        this.triangles.push(this.quads[i][1]);
    }
    // For each triangle in our triangles list, push those positions to the positions array
    for (var i = 0; i < this.triangles.length; i++) {
        this.points.push(this.triangles[i][0]);
        this.points.push(this.triangles[i][1]);
        this.points.push(this.triangles[i][2]);
    }

    this.vBuffer=0;
    this.cBuffer=0;

    this.init = function() {

        this.vBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

        this.cBuffer = gl.createBuffer();

        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );

        gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );

    }

    this.draw = function() {
        gl.uniform1f(transparencyLocation, 1.0);

        var tm=translate(this.origin[0]+this.OffsetX, this.origin[1]+this.OffsetY, 0.0);
        tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.origin[0], -this.origin[1], 0.0));
        gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );


        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );
        
        gl.drawArrays( gl.TRIANGLES, 0, this.points.length );
        
    }
}

function CanvasPixel(offset, color) {
    this.color = color;
    this.origin = vec2(0, 0);
    this.OffsetX = offset[0];
    this.OffsetY = offset[1];
    this.bottomLeft = offset;
    this.Angle = 0;
    this.points = [];
    this.colors = [];
    this.quads = [];
    this.triangles = [];

    this.OffsetX += (0.5 * tBlockSize);
    this.OffsetY += (0.5 * tBlockSize);
    this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
    
    for (var i=0; i < 6; i++) this.colors.push(this.color);

    // For each triangle in the quad, push to triangle list
    for (var i = 0; i < this.quads.length; i++) {
        this.triangles.push(this.quads[i][0]);
        this.triangles.push(this.quads[i][1]);
    }

    // For each triangle in our triangles list, push those positions to the positions array
    for (var i = 0; i < this.triangles.length; i++) {
        this.points.push(this.triangles[i][0]);
        this.points.push(this.triangles[i][1]);
        this.points.push(this.triangles[i][2]);
    }

    this.vBuffer=0;
    this.cBuffer=0;
    
    this.UpdateOffset = function(dx, dy) {
        this.OffsetX += dx;
        this.OffsetY += dy;
    }

    this.SetOffset = function(dx, dy) {
        this.OffsetX = dx;
        this.OffsetY = dy;
    }

    this.UpdateAngle = function(deg) {
        this.Angle += deg;
    }

    this.SetAngle = function(deg) {
        this.Angle = deg;
    }

    // Return area of given triangle
    this.triArea = function(p1, p2, p3) {
        var x1 = p1[0];
        var y1 = p1[1];
        var x2 = p2[0];
        var y2 = p2[1];
        var x3 = p3[0];
        var y3 = p3[1];
        return Math.abs((x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2.0);
    }

    this.transform = function(x, y) {
        var theta = Math.PI/180*this.Angle;	// in radians
        var x2 = this.origin[0] + (x - this.origin[0]-this.OffsetX) * Math.cos(theta) - (y - this.origin[1]-this.OffsetY) * Math.sin(theta);
        var y2 = this.origin[1] + (x - this.origin[0]-this.OffsetX) * Math.sin(theta) + (y - this.origin[1]-this.OffsetY) * Math.cos(theta);
        return vec2(x2, y2);
    }

    this.isInside = function(x, y) {
        var p=this.transform(x, y);
        // Check each triangle and see if point is inside.
        // Taken and modified from https://www.geeksforgeeks.org/check-whether-a-given-point-lies-inside-a-triangle-or-not/

        for (var i = 0; i < this.triangles.length; i++) {
            var p1 = this.triangles[i][0];
            var p2 = this.triangles[i][1];
            var p3 = this.triangles[i][2];

            var A = this.triArea(p1, p2, p3);
 
            // Calculate area of triangle PBC 
            var A1 = this.triArea(p, p2, p3);
             
            // Calculate area of triangle PAC 
            var A2 = this.triArea(p1, p, p3);
             
            // Calculate area of triangle PAB 
            var A3 = this.triArea(p1, p2, p);
             
            // Check if sum of A1, A2 and A3 
            // is same as A
            if(A == A1 + A2 + A3) {
                return true;
            }
        }   
        return false;
    }

    this.init = function() {
      this.vBuffer = gl.createBuffer();

      gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );

      gl.bufferData( gl.ARRAY_BUFFER, flatten(this.points), gl.STATIC_DRAW );

      this.cBuffer = gl.createBuffer();

      gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );

      gl.bufferData( gl.ARRAY_BUFFER, flatten(this.colors), gl.STATIC_DRAW );

    }

    this.changeColor = function(newColor) {
        this.color = newColor;
        this.colors.length = 0;
        for (var i=0; i < 6; i++) this.colors.push(this.color);
        this.init();
    }

    this.draw = function() {
        var tm=translate(this.origin[0]+this.OffsetX, this.origin[1]+this.OffsetY, 0.0);
        tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.origin[0], -this.origin[1], 0.0));
        gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );


        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );
        
        gl.drawArrays( gl.TRIANGLES, 0, this.points.length );
    }    
}

// Maybe add layer name?
function Layer() {
    this.canvasPixels = [];
    this.opacity = 1.0;
    this.isEnabled = true;

    this.draw = function() {
        gl.uniform1f(transparencyLocation, this.opacity);
        for (var i = 0; i < this.canvasPixels.length; i++) {
            this.canvasPixels[i].draw();
        }
    }
}

function selectLayer(index) {
    const newSwitchButton = document.getElementById("layer" + (index + 1) + "switch");
    newSwitchButton.innerHTML = "Active Layer";
    newSwitchButton.disabled = true;
    document.getElementById("layer" + (index + 1)).classList.add("selected_layer");
}

function deselectLayer(index) {
    const oldSwitchButton = document.getElementById("layer" + (index + 1) + "switch");
    oldSwitchButton.innerHTML = "Switch to Layer";
    oldSwitchButton.disabled = false;
    document.getElementById("layer" + (index + 1)).classList.remove("selected_layer");
}

function switchToLayer(index) {
    selectLayer(index);
    deselectLayer(activeLayerIndex);
    // Change active layer index
    activeLayerIndex = index;
}

function clearLayer(index) {
    Layers[index].canvasPixels.length = 0;
    renderLayerPreview(index);
}

function toggleLayer(index) {
    Layers[index].isEnabled = !Layers[index].isEnabled;
    if (Layers[index].isEnabled) {
        document.getElementById("layer" + (index + 1) + "toggle").innerHTML = "Hide Layer";
    } else {
        document.getElementById("layer" + (index + 1) + "toggle").innerHTML = "Show Layer";
    }
}

function deleteLayer(index) {
    var indexToRemove = index;
    Layers.splice(indexToRemove, 1);

    // Delete all layers in layer list
    // Recreate all layers
    // Mark first layer as selected
    document.getElementById("layersDiv").innerHTML = "";

    for (var i = 0; i < Layers.length; i++) {
        addLayerHTML(i);
        renderLayerPreview(i);
    }

    if (Layers.length < 2) {
        document.getElementById("layer1delete").disabled = true;
    }

    selectLayer(0);

    activeLayerIndex = 0;
}

function addLayerHTML(layerIndex) {
    // Grab layer list div
    const layersListDiv = document.getElementById("layersDiv");

    // Make new layer div
    const newLayerDiv = document.createElement("div");
    const newLayerIndex = layerIndex;
    // Initialize div properties
    newLayerDiv.id = "layer" + (newLayerIndex + 1);
    newLayerDiv.classList.add('layer');
    newLayerDiv.innerHTML = "Layer " + (newLayerIndex + 1);

    newLayerDiv.appendChild(document.createElement("br"));

    // <div class="row">
    //     <label for="transparencySlider">Current layer opacity: </label>
    //     <input name="transparencySlider" type="range" min="0" max="1" value="1" step="0.01" class="slider" id="transparencySlider">
    // </div>
    const sliderDiv = document.createElement("div");
    sliderDiv.className = "row";
    const sliderLabel = document.createElement("label");
    sliderLabel.innerHTML = "Opacity: ";
    sliderLabel.setAttribute("for", "transparencySlider");
    sliderDiv.appendChild(sliderLabel);
    const sliderInput = document.createElement("input");
    sliderInput.setAttribute("name", "transparencySlider");
    sliderInput.setAttribute("type", "range");
    sliderInput.setAttribute("min", "0");
    sliderInput.setAttribute("max", "1");
    sliderInput.setAttribute("value", "1");
    sliderInput.setAttribute("step", "0.01");
    sliderInput.className = "slider";
    sliderInput.id = "layer" + (layerIndex + 1) + "transparencySlider";
    sliderInput.value = Layers[layerIndex].opacity;
    sliderInput.oninput = function() {
        Layers[layerIndex].opacity = sliderInput.value;
    }
    sliderDiv.appendChild(sliderInput);

    newLayerDiv.append(sliderDiv);

    // Layer image preview
    const imgTag = document.createElement("img");
    imgTag.id = "canvasPreview_layer" + (newLayerIndex + 1);
    imgTag.className = "layer_preview";
    imgTag.width = 200;
    imgTag.height = 150;
    newLayerDiv.appendChild(imgTag);

    newLayerDiv.appendChild(document.createElement("br"));
    
    // Switch to layer button
    const switchButton = document.createElement("button");
    switchButton.id = "layer" + (newLayerIndex + 1) + "switch";
    switchButton.innerHTML = "Switch to Layer";
    switchButton.onclick = function () {
        switchToLayer(layerIndex);
    }
    newLayerDiv.appendChild(switchButton);

    // Hide layer button
    const hideButton = document.createElement("button");
    hideButton.id = "layer" + (newLayerIndex + 1) + "toggle";
    hideButton.innerHTML = "Hide Layer";
    hideButton.onclick = function () {
        toggleLayer(layerIndex);
    }
    newLayerDiv.appendChild(hideButton);

    newLayerDiv.appendChild(document.createElement("br"));

    // Erase layer contents button
    const clearButton = document.createElement("button");
    clearButton.id = "layer" + (layerIndex + 1) + "clear";
    clearButton.innerHTML = "Clear Layer";
    clearButton.onclick = function() {
        clearLayer(layerIndex);
    }
    newLayerDiv.appendChild(clearButton);

    // Delete layer button
    const deleteButton = document.createElement("button");
    deleteButton.id = "layer" + (layerIndex + 1) + "delete";
    deleteButton.innerHTML = "Delete Layer";
    deleteButton.onclick = function() {
        deleteLayer(layerIndex);
    }
    newLayerDiv.appendChild(deleteButton);

    // Add layer div to layers list
    layersListDiv.appendChild(newLayerDiv);
}

function renderLayerPreview(layerIndex) {
    var currentGridState = showGrid;
    // Store states of all layers before disabling all layers and enabling currently edited layer
    var layerStates = [];
    layerStates.length = 0;
    for (var i = 0; i < Layers.length; i++) {
        layerStates.push(Layers[i].isEnabled);
        Layers[i].isEnabled = false;
    }
    Layers[layerIndex].isEnabled = true;
    var currentLayerOpacity = Layers[layerIndex].opacity;
    var currentBGOpacity = backgroundOpacity;
    backgroundOpacity = 0.0;
    Layers[layerIndex].opacity = 1.0;
    showGrid = false;
    drawScene();
    showGrid = currentGridState;

    let canvasImage = canvas.toDataURL('image/png');
    var image = document.getElementById("canvasPreview_layer" + (layerIndex + 1));
    image.src = canvasImage;

    // Restore layer states and re-render
    for (var i = 0; i < Layers.length; i++) {
        Layers[i].isEnabled = layerStates[i];
    }
    Layers[layerIndex].opacity = currentLayerOpacity;
    backgroundOpacity = currentBGOpacity;
    drawScene();
}

window.onload = function initialize() {
    GridLines.length = 0;
    Layers.length = 0;

    backgroundColor = hexToRgb(document.getElementById("bgcolor").value);

    Layers.push(new Layer());

    document.getElementById("layersDiv").innerHTML = "";
    addLayerHTML(0);
    selectLayer(0);
    activeLayerIndex = 0;

    canvas = document.getElementById("gl-canvas");
    if (document.getElementById("brushSelect").checked) {
        currentTool = "brush";
    } else if (document.getElementById("eraserSelect").checked) {
        currentTool = "eraser";
    }
    
    var selectedColor = hexToRgb(document.getElementById("brushcolor").value);
    selectedColorVec = vec4(selectedColor.r, selectedColor.g, selectedColor.b, 1.0);

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    document.getElementById("resetbutton").onclick = function() {
        initialize();
    };
    
    document.getElementById("gridSizeDropDown").onchange = function () {
        var selectedSize = parseInt(document.getElementById("gridSizeDropDown").value);
        tBlockSize = selectedSize;
        initialize();
    };

    document.getElementById("showGridLines").onchange = function () {
        showGrid = document.getElementById("showGridLines").checked;
    };

    document.getElementById("brushSelect").addEventListener('change', function() {
        currentTool = this.value;
    });

    document.getElementById("eraserSelect").addEventListener('change', function() {
        currentTool = this.value;
    });

    document.getElementById("brushcolor").addEventListener('input', function() {  // I tried also onchange
        // console.log(document.getElementById("brushcolor").value);
        selectedColor = hexToRgb(document.getElementById("brushcolor").value);
        selectedColorVec = vec4(selectedColor.r, selectedColor.g, selectedColor.b, 1.0);
    });

    document.getElementById("bgcolor").addEventListener('input', function() {  // I tried also onchange
        // console.log(document.getElementById("brushcolor").value);
        backgroundColor = hexToRgb(document.getElementById("bgcolor").value);
    });

    document.getElementById("bgOpacitySlider").oninput = function() {
        backgroundOpacity = document.getElementById("bgOpacitySlider").value;
    }
    
    document.getElementById("newLayerButton").onclick = function () {
        Layers.push(new Layer());
        addLayerHTML(Layers.length - 1);
        switchToLayer(Layers.length - 1);
        document.getElementById("layer1delete").disabled = false;
    }

    // Taken and modified from here https://stackoverflow.com/questions/8126623/downloading-canvas-element-to-an-image/56185896#56185896
    document.getElementById("saveButton").onclick = function() {
        var currentGridState = showGrid;
        showGrid = false;
        drawScene();
        showGrid = currentGridState;

        let canvasImage = canvas.toDataURL('image/png');
        
        // this can be used to download any image from webpage to local disk
        let xhr = new XMLHttpRequest();
        xhr.responseType = 'blob';
        xhr.onload = function () {
            let a = document.createElement('a');
            a.href = window.URL.createObjectURL(xhr.response);
            a.download = 'canvas_result.png';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            a.remove();
        };
        xhr.open('GET', canvasImage); // This is to download the canvas Image
        xhr.send();
    }
    
    canvas.addEventListener("mousedown", function(event){
        if (event.button!=0) return; // left button only
        isMouseDown = true;
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        y=canvas.height-y;
        
        if (currentTool == "brush") {
            //console.log("Making new piece in click!");
            // Place down pixel at current position if one doesn't exist
            for (var i = Layers[activeLayerIndex].canvasPixels.length - 1; i >= 0; i--) {
                if (Layers[activeLayerIndex].canvasPixels[i].isInside(x, y)) {
                    //console.log("Found pixel! Changing color...");
                    Layers[activeLayerIndex].canvasPixels[i].changeColor(selectedColorVec);
                    return;
                }
            }
            var calculatedX = Math.floor(x / tBlockSize) * tBlockSize;
            var calculatedY = Math.floor(y / tBlockSize) * tBlockSize;
            var newPiece = new CanvasPixel(add(vec2(calculatedX, calculatedY), vec2(0, 0)), selectedColorVec);
            newPiece.init();
            Layers[activeLayerIndex].canvasPixels.push(newPiece);
        }
    });

    canvas.addEventListener("mouseup", function(event){
        isMouseDown = false;
        // Update layer preview
        renderLayerPreview(activeLayerIndex);
        // var currentGridState = showGrid;
        // // Store states of all layers before disabling all layers and enabling currently edited layer
        // var layerStates = [];
        // layerStates.length = 0;
        // for (var i = 0; i < Layers.length; i++) {
        //     layerStates.push(Layers[i].isEnabled);
        //     Layers[i].isEnabled = false;
        // }
        // Layers[activeLayerIndex].isEnabled = true;
        // var currentLayerOpacity = Layers[activeLayerIndex].opacity;
        // var currentBGOpacity = backgroundOpacity;
        // backgroundOpacity = 0.0;
        // Layers[activeLayerIndex].opacity = 1.0;
        // showGrid = false;
        // drawScene();
        // showGrid = currentGridState;

        // let canvasImage = canvas.toDataURL('image/png');
        // var image = document.getElementById("canvasPreview_layer" + (activeLayerIndex + 1));
        // image.src = canvasImage;

        // // Restore layer states and re-render
        // for (var i = 0; i < Layers.length; i++) {
        //     Layers[i].isEnabled = layerStates[i];
        // }
        // Layers[activeLayerIndex].opacity = currentLayerOpacity;
        // backgroundOpacity = currentBGOpacity;
        // drawScene();
    });

    // Keep drawing while mouse is down
    canvas.addEventListener("mousemove", function(event){
        if (isMouseDown) {
            //console.log("Making new piece in drag!");
            var x = event.pageX - canvas.offsetLeft;
            var y = event.pageY - canvas.offsetTop;
            y=canvas.height-y;
            var calculatedX = Math.floor(x / tBlockSize) * tBlockSize;
            var calculatedY = Math.floor(y / tBlockSize) * tBlockSize;
            // Place down pixel at current position if one doesn't exist
            // console.log(calculatedX, calculatedY);
            if (currentTool == "brush") {
                for (var i = Layers[activeLayerIndex].canvasPixels.length - 1; i >= 0; i--) {
                    if (Layers[activeLayerIndex].canvasPixels[i].isInside(calculatedX + (0.5 * tBlockSize), calculatedY+ (0.5 * tBlockSize))) {
                        Layers[activeLayerIndex].canvasPixels[i].changeColor(selectedColorVec);
                        return;
                    }
                }
                // console.log("Creating new piece!");
                var newPiece = new CanvasPixel(add(vec2(calculatedX, calculatedY), vec2(0, 0)), selectedColorVec);
                newPiece.init();
                Layers[activeLayerIndex].canvasPixels.push(newPiece);
            } else {
                for (var i = Layers[activeLayerIndex].canvasPixels.length - 1; i >= 0; i--) {
                    if (Layers[activeLayerIndex].canvasPixels[i].isInside(calculatedX + (0.5 * tBlockSize), calculatedY+ (0.5 * tBlockSize))) {
                        deletePiece(i);
                        return;
                    }
                }
            }
        }
    });

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundOpacity );

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Add and init gridlines
    if (gridSnapping) {
        // Add vertical lines
        var maxSize = canvas.width / tBlockSize;
        for (var i = 0; i < maxSize; i++) {
            GridLines.push(new GridLine(vec2(i * tBlockSize, 0), vec4(0.0, 0.0, 0.0, 1.0), true));
            GridLines[i].init();
        }
        maxSize = canvas.height / tBlockSize;
        var offset = GridLines.length;

        // Add horizontal lines
        for (var i = 0; i < maxSize; i++) {
            GridLines.push(new GridLine(vec2(0, i * tBlockSize), vec4(0.0, 0.0, 0.0, 1.0), false));
            GridLines[i + offset].init();
        }
    }

    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.FALSE, flatten(pm) );

    transformation = gl.getUniformLocation( program, "transformation" );

    vPosition = gl.getAttribLocation( program, "aPosition" );
    vColor = gl.getAttribLocation( program, "aColor" );
    transparencyLocation = gl.getUniformLocation(program, "transparency");

    gl.uniform1f(transparencyLocation, 1.0);

    render();
}

// Deletes piece at given index from board
function deletePiece(index) {
    Layers[activeLayerIndex].canvasPixels.splice(index, 1);
}

function drawScene() {
    // console.log("Number of pixels: " + canvasPixels.length);
    gl.clearColor( backgroundColor.r, backgroundColor.g, backgroundColor.b, backgroundOpacity );
    gl.clear(gl.COLOR_BUFFER_BIT);
    

    for (var i = 0; i < Layers.length; i++) {
        if (Layers[i].isEnabled) {
            Layers[i].draw();
        }
    }

    // for (var i = 0; i < canvasPixels.length; i++) {
    //     canvasPixels[i].draw();
    // }

    if (showGrid) {
        for (var i = 0; i < GridLines.length; i++) {
            GridLines[i].draw();
        }
    }
}

function render() {
    drawScene();
    requestAnimationFrame(render);

}

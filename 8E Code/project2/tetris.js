"use strict"

/*********
CS 435
Project #2
Lilly Eide

This program is an exploration of user interactivity with the familiar Tetris blocks.
Clicking and dragging from one of the blocks at the top will duplicate said block.
Dragging one of these blocks to the bottom section of the screen will delete it.
Shift clicking a block will rotate it 90 degrees counterclockwise.
There is an optional variable for snapping, which will force blocks to move along a grid when dragging a block around.

Tangram.js was used as a starting point for this file, before being heavily modified to
fit the problem description as written.
*********/

var canvas;
var gl;

var projection; // projection matrix uniform shader variable location
var transformation; // projection matrix uniform shader variable location
var vPosition; // loc of attribute variables
var vColor;

// state representation
var BlockIdToBeMoved; // this black is moving
var MoveCount;
var OldX;
var OldY;

var tetriminoPieces = [];
var tBoardPieces = [];

var tBlockSize = 25;

var topBandYPos = 20 * tBlockSize;
var bottomBandYPos = 3 * tBlockSize;
var borderSize = 5;
var Borders = [];
var gridSnapping = false;

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

// Screen-wide border at a given y position
function Border(yPos, color) {
    this.color = color;
    this.colors = [];
    this.origin = vec2(0, 0);
    this.OffsetX = 0;
    this.OffsetY = yPos;
    this.Angle = 0;
    this.quads = [];
    this.triangles = [];
    this.points = [];

    for (var i=0; i<6; i++) this.colors.push(this.color);

    this.quads.push(new Quad2(this.origin[0], this.origin[1], canvas.width, borderSize));

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

// shapeIndex is an int between 0 and 6, offset is an initial offset that should be applied.
function TPiece(shapeIndex, offset) {
    this.shape = shapeIndex;
    this.color = vec4(1.0, 1.0, 1.0, 1.0);
    this.origin = vec2(0, 0);
    this.OffsetX = offset[0];
    this.OffsetY = offset[1];
    this.bottomLeft = offset;
    this.Angle = 0;
    this.points = [];
    this.colors = [];
    this.quads = [];
    this.triangles = [];

    /* Shape index:
    0: square
    1: line
    2: T piece
    3: L piece
    4: J piece
    5: S piece
    6: Z piece
    */
    // This switch statement defines the various shapes of the Tetriminos
    switch (this.shape) {
      case 0: // Square piece
          this.color = vec4(1.0, 1.0, 0.0, 1.0);
          this.OffsetX += (1 * tBlockSize);
          this.OffsetY += (1 * tBlockSize);
          this.quads.push(Quad2(this.origin[0] - 1 * tBlockSize, this.origin[1] - 1 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 1 * tBlockSize, this.origin[1] + 0 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0 * tBlockSize, this.origin[1] + 0 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0 * tBlockSize, this.origin[1] - 1 * tBlockSize, tBlockSize, tBlockSize));
          break;
      case 1: // Line piece
          this.color = vec4(0.0, 1.0, 1.0, 1.0);
          this.OffsetX += (2 * tBlockSize);
          this.OffsetY += (0 * tBlockSize);
          this.quads.push(Quad2(this.origin[0] - 2 * tBlockSize, this.origin[1] + 0 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 1 * tBlockSize, this.origin[1] + 0 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0 * tBlockSize, this.origin[1] + 0 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 1 * tBlockSize, this.origin[1] + 0 * tBlockSize, tBlockSize, tBlockSize));
          break;
      case 2: // T piece
          this.color = vec4(1.0, 0.0, 1.0, 1.0);
          this.OffsetX += (1.5 * tBlockSize);
          this.OffsetY += (0.5 * tBlockSize);
          this.quads.push(Quad2(this.origin[0] - 1.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] + 0.5 * tBlockSize, tBlockSize, tBlockSize));
          break;
      case 3: // L piece
          this.color = vec4(1.0, 0.5, 0.0, 1.0);
          this.OffsetX += (1.5 * tBlockSize);
          this.OffsetY += (0.5 * tBlockSize);
          this.quads.push(Quad2(this.origin[0] - 1.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0.5 * tBlockSize, this.origin[1] + 0.5 * tBlockSize, tBlockSize, tBlockSize));
          break;
      case 4: // J piece
          this.color = vec4(0.0, 0.0, 1.0, 1.0);
          this.OffsetX += (1.5 * tBlockSize);
          this.OffsetY += (0.5 * tBlockSize);
          this.quads.push(Quad2(this.origin[0] - 1.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 1.5 * tBlockSize, this.origin[1] + 0.5 * tBlockSize, tBlockSize, tBlockSize));
          break;
      case 5: // S piece
          this.color = vec4(0.0, 1.0, 0.0, 1.0);
          this.OffsetX += (1.5 * tBlockSize);
          this.OffsetY += (0.5 * tBlockSize);
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] + 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0.5 * tBlockSize, this.origin[1] + 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 1.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          break;
      case 6: // Z piece
          this.color = vec4(1.0, 0.0, 0.0, 1.0);
          this.OffsetX += (1.5 * tBlockSize);
          this.OffsetY += (0.5 * tBlockSize);
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] + 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] + 0.5 * tBlockSize, this.origin[1] - 0.5 * tBlockSize, tBlockSize, tBlockSize));
          this.quads.push(Quad2(this.origin[0] - 1.5 * tBlockSize, this.origin[1] + 0.5 * tBlockSize, tBlockSize, tBlockSize));
          break;
      default:
          console.log("Something isn't right... (Tetrimino color switch)");
          break;
    }
    // We know there's going to be 24 points that are defined, since 3 points per triangle, 2 triangles per quad, 4 quads per piece = 24 points (even though some are technically duplicated)
    for (var i=0; i<24; i++) this.colors.push(this.color);

    
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

    this.shouldBeDeleted = function() {
        //console.log("Y position: " + add(this.origin, vec2(this.OffsetX, this.OffsetY))[1]);
        // If Y position of origin is 2 blocks above delete position or lower
        if (add(this.origin, vec2(this.OffsetX, this.OffsetY))[1] <= (bottomBandYPos + 2 * tBlockSize)) {
            var theta = Math.PI / 180 * this.Angle;
            // Check through each point in points list and see if any are below bottom band Y pos
            for (var i = 0; i < this.points.length; i++) {
                var realYPos = (this.points[i][0] * Math.sin(theta)) + (this.points[i][1] * Math.cos(theta)) + this.OffsetY;
                //console.log(this.transform(this.points[i][0], this.points[i][1]));
                if (realYPos <= bottomBandYPos) {
                    return true;
                }
            }
            return false;
        } else {
            return false;
        }
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

window.onload = function initialize() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    var a = document.getElementById("mybutton")
    a.addEventListener("click", function(){
      for (var i=0; i<tetriminoPieces.length; i++) {
        tBoardPieces.length = 0;
        // window.requestAnimFrame(render);
        render();
      }
    });

  canvas.addEventListener("mousedown", function(event){
    if (event.button!=0) return; // left button only
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    y=canvas.height-y;
    // console.log("mousedown, x="+x+", y="+y);
    if (event.shiftKey) {  // with shift key, rotate counter-clockwise
        for (var i=tBoardPieces.length - 1; i>=0; i--) {	// search from last to first
            if (tBoardPieces[i].isInside(x, y)) {
                // move Blocks[i] to the top
                var temp=tBoardPieces[i];
                for (var j=i; j<tBoardPieces.length - 1; j++) tBoardPieces[j]=tBoardPieces[j+1];
                tBoardPieces[tBoardPieces.length - 1]=temp;
                // rotate the block
                tBoardPieces[tBoardPieces.length - 1].UpdateAngle(-90);

                // Check if current piece should be deleted
                if (tBoardPieces[tBoardPieces.length - 1].shouldBeDeleted()) {
                    //console.log("Piece is candidate for deletion");
                    deletePiece(tBoardPieces.length - 1);
                    render();
                }

                render();
                return;
            }
      }
      return;
    }
    if (event.altKey) { // with alternate key, rotate clockwise
      for (var i=tBoardPieces.length - 1; i>=0; i--) {	// search from last to first
        if (tBoardPieces[i].isInside(x, y)) {
            // move Blocks[i] to the top
            var temp=tBoardPieces[i];
            for (var j=i; j<tBoardPieces.length - 1; j++) tBoardPieces[j]=tBoardPieces[j+1];
            tBoardPieces[tBoardPieces.length - 1]=temp;
            // rotate the block
            tBoardPieces[tBoardPieces.length - 1].UpdateAngle(90);

            // Check if current piece should be deleted
            if (tBoardPieces[tBoardPieces.length - 1].shouldBeDeleted()) {
                //console.log("Piece is candidate for deletion");
                deletePiece(tBoardPieces.length - 1);
                render();
            }

            render();
            return;
        }
      }
      return;
    }
    // If clicking on piece at top of screen, spawn new piece at same location
    for (var i = tetriminoPieces.length - 1; i >= 0; i--) {	// search from last to first
        if (tetriminoPieces[i].isInside(x, y)) {
            console.log("Spawn new piece of shape " + i);
            var blockType = tetriminoPieces[i].shape;
            var newPiece = new TPiece(blockType, add(tetriminoPieces[i].bottomLeft, vec2(0, 0)));
            newPiece.init();
            tBoardPieces.push(newPiece);

            // remember the one to be moved
            BlockIdToBeMoved=tBoardPieces.length - 1;
            MoveCount=0;
            OldX=x;
            OldY=y;
            // redraw
            // window.requestAnimFrame(render);
            render();
            break;
        }
    }
    // Check through existing pieces on board instead if not clicking on piece at top
    for (var i = tBoardPieces.length - 1; i >= 0; i--) {
        if (tBoardPieces[i].isInside(x, y)) {
            console.log("Moving piece...");
            // Move clicked piece to end of render list
            var temp = tBoardPieces[i];
            for (var j=i; j<tBoardPieces.length - 1; j++) {
                tBoardPieces[j] = tBoardPieces[j+1];
            }
            tBoardPieces[tBoardPieces.length - 1] = temp;

            BlockIdToBeMoved = tBoardPieces.length - 1;
            MoveCount=0;
            // This code makes it so the blocks "snap" to the grid
            if (gridSnapping) {
                OldX = Math.floor(x / tBlockSize) * tBlockSize;
                OldY = Math.floor(y / tBlockSize) * tBlockSize;
            } else {
                OldX = x;
                OldY = y;
            }
            
            // redraw
            // window.requestAnimFrame(render);
            render();
            break;
        }
    }
  });

  // Drop block. Here we should check if the block should be deleted
  canvas.addEventListener("mouseup", function(event){
    if (BlockIdToBeMoved >= 0) {
        if (tBoardPieces[BlockIdToBeMoved].shouldBeDeleted()) {
            //console.log("Piece is candidate for deletion");
            deletePiece(BlockIdToBeMoved);
            render();
        }

      BlockIdToBeMoved = -1;
    }
  });

  // Drag block around
  canvas.addEventListener("mousemove", function(event){
    if (BlockIdToBeMoved >= 0) {  // if dragging
        var x = event.pageX - canvas.offsetLeft;
        var y = event.pageY - canvas.offsetTop;
        // This code makes it so the blocks "snap" to the grid
        if (gridSnapping) {
            x = Math.floor((event.pageX - canvas.offsetLeft) / tBlockSize) * tBlockSize;
            y = Math.floor((event.pageY - canvas.offsetTop) / tBlockSize) * tBlockSize;
        }
        y=canvas.height-y;
        tBoardPieces[BlockIdToBeMoved].UpdateOffset(x-OldX, y-OldY);
        MoveCount++;
        OldX=x;
        OldY=y;
        // window.requestAnimFrame(render);
        render();
    }
  });

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Add and init borders
    Borders.push(new Border(topBandYPos, vec4(1.0, 1.0, 1.0, 1.0)));
    Borders.push(new Border(bottomBandYPos, vec4(1.0, 0.0, 0.0, 1.0)));
    for (var i = 0; i < Borders.length; i++) {
        Borders[i].init();
    }

    // Pieces at top of screen
    tetriminoPieces.push(new TPiece(0, vec2((2 * tBlockSize), (21 * tBlockSize))));
    tetriminoPieces.push(new TPiece(1, vec2((5 * tBlockSize), (21 * tBlockSize))));
    tetriminoPieces.push(new TPiece(2, vec2((10 * tBlockSize), (21 * tBlockSize))));
    tetriminoPieces.push(new TPiece(3, vec2((14 * tBlockSize), (21 * tBlockSize))));
    tetriminoPieces.push(new TPiece(4, vec2((18 * tBlockSize), (21 * tBlockSize))));
    tetriminoPieces.push(new TPiece(5, vec2((22 * tBlockSize), (21 * tBlockSize))));
    tetriminoPieces.push(new TPiece(6, vec2((26 * tBlockSize), (21 * tBlockSize))));

    for (var i = 0; i < tetriminoPieces.length; i++) {
        tetriminoPieces[i].init();
    }
    

    BlockIdToBeMoved=-1; // no piece selected

    projection = gl.getUniformLocation( program, "projection" );
    var pm = ortho( 0.0, canvas.width, 0.0, canvas.height, -1.0, 1.0 );
    gl.uniformMatrix4fv( projection, gl.FALSE, flatten(pm) );

    transformation = gl.getUniformLocation( program, "transformation" );

    vPosition = gl.getAttribLocation( program, "aPosition" );
    vColor = gl.getAttribLocation( program, "aColor" );

    render();
}

// Deletes piece at given index from board
function deletePiece(index) {
    tBoardPieces.splice(index, 1);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < Borders.length; i++) {
        Borders[i].draw();
    }

    for (var i = 0; i < tetriminoPieces.length; i++) {
        tetriminoPieces[i].draw();
    }

    for (var i = 0; i < tBoardPieces.length; i++) {
        tBoardPieces[i].draw();
    }
}

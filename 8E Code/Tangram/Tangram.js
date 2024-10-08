"use strict"

var canvas;
var gl;

var projection; // projection matrix uniform shader variable location
var transformation; // projection matrix uniform shader variable location
var vPosition; // loc of attribute variables
var vColor;

// state representation
var Blocks; // seven blocks
var BlockIdToBeMoved; // this black is moving
var MoveCount;
var OldX;
var OldY;

var rotIndex = 1; // default
var rotDegrees = [ 1, 5, 10, 30, 45, 90];

function CPiece (n, color, x0, y0, x1, y1, x2, y2, x3, y3) {
    this.NumVertices = n;
    this.color = color;
    this.points=[];
    this.points.push(vec2(x0, y0));
    this.points.push(vec2(x1, y1));
    this.points.push(vec2(x2, y2));
    this.points.push(vec2(x3, y3));
    this.colors=[];
    for (var i=0; i<4; i++) this.colors.push(color);

    this.vBuffer=0;
    this.cBuffer=0;

    this.OffsetX=0;
    this.OffsetY=0;
    this.Angle=0;

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

    this.isLeft = function(x, y, id) {	// Is Point (x, y) located to the left when walking from id to id+1?
        var id1=(id+1)%this.NumVertices;
        return (y-this.points[id][1])*(this.points[id1][0]-this.points[id][0])>(x-this.points[id][0])*(this.points[id1][1]-this.points[id][1]);
    }

    this.transform = function(x, y) {
        var theta = -Math.PI/180*this.Angle;	// in radians
        var x2 = this.points[0][0] + (x - this.points[0][0]-this.OffsetX) * Math.cos(theta) - (y - this.points[0][1]-this.OffsetY) * Math.sin(theta);
        var y2 = this.points[0][1] + (x - this.points[0][0]-this.OffsetX) * Math.sin(theta) + (y - this.points[0][1]-this.OffsetY) * Math.cos(theta);
        return vec2(x2, y2);
    }

    this.isInside = function(x, y) {
        var p=this.transform(x, y);
        for (var i=0; i<this.NumVertices; i++) {
            if (!this.isLeft(p[0], p[1], i)) return false;
        }
        return true;
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
        var tm=translate(this.points[0][0]+this.OffsetX, this.points[0][1]+this.OffsetY, 0.0);
        tm=mult(tm, rotate(this.Angle, vec3(0, 0, 1)));
        tm=mult(tm, translate(-this.points[0][0], -this.points[0][1], 0.0));
        gl.uniformMatrix4fv( transformation, gl.FALSE, flatten(tm) );

        gl.bindBuffer( gl.ARRAY_BUFFER, this.vBuffer );
        gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vPosition );


        gl.bindBuffer( gl.ARRAY_BUFFER, this.cBuffer );
        gl.vertexAttribPointer( vColor, 4, gl.FLOAT, false, 0, 0 );
        gl.enableVertexAttribArray( vColor );

        if (this.NumVertices==3) {
            gl.drawArrays( gl.TRIANGLES, 0, this.NumVertices );
        }
        else {
            gl.drawArrays( gl.TRIANGLE_FAN, 0, this.NumVertices );
        }
    }

}

window.onload = function initialize() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    var m = document.getElementById("mymenu");
    m.selectedIndex=rotIndex;
    m.addEventListener("click", function() {
       rotIndex = m.selectedIndex;
    });

    var a = document.getElementById("mybutton")
    a.addEventListener("click", function(){
      for (var i=0; i<7; i++) {
        Blocks[i].SetAngle(0);
        Blocks[i].SetOffset(0, 0);
        // window.requestAnimFrame(render);
        render();
      }
    });

/* This does not work. click here is different from the traditional click
  canvas.addEventListener("click", function(event){
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    y=canvas.height-y;
    console.log("clicked, x="+x+", y="+y);

    for (var i=6; i>=0; i--) {	// search from last to first
      if (Blocks[i].isInside(x, y)) {
        // move Blocks[i] to the top
        var temp=Blocks[i];
        for (var j=i; j<6; j++) Blocks[j]=Blocks[j+1];
        Blocks[6]=temp;
        // rotate the block
        Blocks[6].UpdateAngle(rotDegrees[rotIndex]);
        // redraw
        render();
        break;
      }
    }
  });
*/
  canvas.addEventListener("mousedown", function(event){
    if (event.button!=0) return; // left button only
    var x = event.pageX - canvas.offsetLeft;
    var y = event.pageY - canvas.offsetTop;
    y=canvas.height-y;
    // console.log("mousedown, x="+x+", y="+y);
    if (event.shiftKey) {  // with shift key, rotate counter-clockwise
      for (var i=6; i>=0; i--) {	// search from last to first
        if (Blocks[i].isInside(x, y)) {
          // move Blocks[i] to the top
          var temp=Blocks[i];
          for (var j=i; j<6; j++) Blocks[j]=Blocks[j+1];
          Blocks[6]=temp;
          // rotate the block
          Blocks[6].UpdateAngle(rotDegrees[rotIndex]);
          // redraw
          // window.requestAnimFrame(render);
          render();
          return;
        }
      }
      return;
    }
    if (event.altKey) { // with alternate key, rotate clockwise
      for (var i=6; i>=0; i--) {	// search from last to first
        if (Blocks[i].isInside(x, y)) {
          // move Blocks[i] to the top
          var temp=Blocks[i];
          for (var j=i; j<6; j++) Blocks[j]=Blocks[j+1];
          Blocks[6]=temp;
          // rotate the block
          Blocks[6].UpdateAngle(-rotDegrees[rotIndex]);
          // redraw
          // window.requestAnimFrame(render);
          render();
          return;
        }
      }
      return;
    }
    for (var i=6; i>=0; i--) {	// search from last to first
      if (Blocks[i].isInside(x, y)) {
        // move Blocks[i] to the top
        var temp=Blocks[i];
        for (var j=i; j<6; j++) Blocks[j]=Blocks[j+1];
        Blocks[6]=temp;
        // remember the one to be moved
        BlockIdToBeMoved=6;
        MoveCount=0;
        OldX=x;
        OldY=y;
        // redraw
        // window.requestAnimFrame(render);
        render();
        break;
      }
    }
  });

  canvas.addEventListener("mouseup", function(event){
    if (BlockIdToBeMoved>=0) {
/*
      var x = event.pageX - canvas.offsetLeft;
      var y = event.pageY - canvas.offsetTop;
      y=canvas.height-y;
      console.log("mouseup, x="+x+", y="+y);
*/
      BlockIdToBeMoved=-1;
    }
  });

  canvas.addEventListener("mousemove", function(event){
    if (BlockIdToBeMoved>=0) {  // if dragging
      var x = event.pageX - canvas.offsetLeft;
      var y = event.pageY - canvas.offsetTop;
      y=canvas.height-y;
      Blocks[BlockIdToBeMoved].UpdateOffset(x-OldX, y-OldY);
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

    // Initial State
    Blocks=[];
    Blocks.push(new CPiece(3, vec4(1.0, 0.0, 0.0, 1.0), 400, 300, 300, 400, 300, 200, 0, 0));
    Blocks.push(new CPiece(3, vec4(0.0, 1.0, 0.0, 1.0), 400, 300, 300, 200, 500, 200, 0, 0));
    Blocks.push(new CPiece(3, vec4(0.0, 0.0, 1.0, 1.0), 500, 400, 400, 400, 500, 300, 0, 0));
    Blocks.push(new CPiece(3, vec4(1.0, 1.0, 0.0, 1.0), 400, 300, 450, 350, 350, 350, 0, 0));
    Blocks.push(new CPiece(3, vec4(1.0, 0.0, 1.0, 1.0), 450, 250, 500, 200, 500, 300, 0, 0));
    Blocks.push(new CPiece(4, vec4(0.0, 1.0, 1.0, 1.0), 400, 300, 450, 250, 500, 300, 450, 350));
    Blocks.push(new CPiece(4, vec4(0.0, 0.0, 0.0, 1.0), 300, 400, 350, 350, 450, 350, 400, 400));

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].init();
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

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i=0; i<Blocks.length; i++) {
        Blocks[i].draw();
    }
}

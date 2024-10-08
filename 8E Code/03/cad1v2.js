"use strict";

var canvas;
var gl;

var maxNumTriangles = 200;
var maxNumPositions  = 3*maxNumTriangles;
var index = 0;
var first = true;

// var t = [];
var mouse_down = false;

var t1, t2, t3, t4;

var cIndex = 0;

var colors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 8*maxNumPositions, gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 16*maxNumPositions, gl.STATIC_DRAW );

    var colorLoc = gl.getAttribLocation( program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    var m = document.getElementById("mymenu");

    m.addEventListener("click", function() {
       cIndex = m.selectedIndex;
      });

/*
    canvas.addEventListener("mousedown", function(event){
        gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
        if(first) {
          first = false;
          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer)
          t[0] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
        }

        else {
          first = true;
          t[2] = vec2(2*event.clientX/canvas.width-1,
            2*(canvas.height-event.clientY)/canvas.height-1);
          t[1] = vec2(t[0][0], t[2][1]);
          t[3] = vec2(t[2][0], t[0][1]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+i), flatten(t[i]));
          index += 4;

          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
          var tt = vec4(colors[cIndex]);
          for(var i=0; i<4; i++) gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index-4+i), flatten(tt));
        }
    });
  */

    canvas.addEventListener("mousedown", function(event){
      mouse_down = true;
      var x = event.pageX - canvas.offsetLeft;
      var y = event.pageY - canvas.offsetTop;
      t1 = vec2(2*x/canvas.width-1, 
                  2*(canvas.height-y)/canvas.height-1);
    });

    canvas.addEventListener("mouseup", function(event){
      mouse_down = false;
      index +=4;
    });

    canvas.addEventListener("mousemove", function(event){
        if (mouse_down) {
          //first = true;
          //t2 = vec2(2*event.clientX/canvas.width-1,
            //2*(canvas.height-event.clientY)/canvas.height-1);
          var x = event.pageX - canvas.offsetLeft;
          var y = event.pageY - canvas.offsetTop;
          t2 = vec2(2*x/canvas.width-1, 
                  2*(canvas.height-y)/canvas.height-1);
          t3 = vec2(t1[0], t2[1]);
          t4 = vec2(t2[0], t1[1]);

          gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, 8*index, flatten(t1));
          gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+1), flatten(t3));
          gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+2), flatten(t2));
          gl.bufferSubData(gl.ARRAY_BUFFER, 8*(index+3), flatten(t4));
          gl.bindBuffer( gl.ARRAY_BUFFER, cBuffer);
          // index += 4;

          var t = vec4(colors[cIndex]);

          gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index), flatten(t));
          gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index+1), flatten(t));
          gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index+2), flatten(t));
          gl.bufferSubData(gl.ARRAY_BUFFER, 16*(index+3), flatten(t));
          render();
        }
    } );
    
    render();

}


function render() {
/*
    gl.clear( gl.COLOR_BUFFER_BIT );
    for(var i = 0; i<index; i+=4)
        gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
    requestAnimationFrame(render);
*/
    gl.clear( gl.COLOR_BUFFER_BIT );

    for(var i = 0; i<index; i+=4)
        gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );

    if (mouse_down) gl.drawArrays( gl.TRIANGLE_FAN, index, 4 );
}

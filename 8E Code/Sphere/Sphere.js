
var canvas;
var gl;

var delta = 20;	// in degrees

var pointsArray = [];
var index = 0;

var theta = [45, 45, 0];

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
    index += 3;
}

function quad(a, b, c, d) {
    pointsArray.push(b);
    pointsArray.push(a);
    pointsArray.push(c);
    pointsArray.push(b);
    pointsArray.push(c);
    pointsArray.push(d);
    index += 6;
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
        
    // body
    {
            for (var phi=-90+delta/2; phi<90-delta/2; phi+=delta) {
                var phir=radians(phi);
                var phir2=radians(phi+delta);
                for (var theta=-180.0; theta<180.0; theta+=delta) {
                var thetar=radians(theta);
                var thetar2=radians(theta+delta);
                quad(vec4(Math.cos(thetar) * Math.cos(phir), Math.sin(thetar) * Math.cos(phir), Math.sin(phir), 1.0),
                     vec4(Math.cos(thetar) * Math.cos(phir2), Math.sin(thetar) * Math.cos(phir2), Math.sin(phir2), 1.0),
                     vec4(Math.cos(thetar2) * Math.cos(phir), Math.sin(thetar2) * Math.cos(phir), Math.sin(phir), 1.0),
                     vec4(Math.cos(thetar2) * Math.cos(phir2), Math.sin(thetar2) * Math.cos(phir2), Math.sin(phir2), 1.0));
            }
        }
    }

    {
        var sin_d2=Math.sin(radians(90-delta/2));
        var cos_d2 = Math.cos(radians(90 - delta / 2));

        // positive pole
        var p=vec4(0.0, 0.0, 1.0, 1.0);
        for (var theta=-180.0; theta<180.0; theta+=delta) {
            var thetar=radians(theta);
            var thetar2=radians(theta+delta);
            triangle(p, vec4(Math.cos(thetar)*cos_d2,  Math.sin(thetar)*cos_d2,  sin_d2, 1.0),
                        vec4(Math.cos(thetar2)*cos_d2, Math.sin(thetar2)*cos_d2, sin_d2, 1.0));
        }

        // negative pole
        p=vec4(0.0, 0.0, -1.0, 1.0);
        for (var theta=-180.0; theta<180.0; theta+=delta) {
            var thetar=radians(theta);
            var thetar2=radians(theta+delta);
            triangle(p, vec4(Math.cos(thetar)*cos_d2,  Math.sin(thetar)*cos_d2,  -sin_d2, 1.0),
                        vec4(Math.cos(thetar2)*cos_d2, Math.sin(thetar2)*cos_d2, -sin_d2, 1.0));
        }

    }

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    render();
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform3fv(thetaLoc, theta);

    for (var i = 0; i < index; i += 3) {
        gl.drawArrays(gl.LINE_LOOP, i, 3);
        //gl.drawArrays(gl.TRIANGLES, i, 3);
    }

    window.requestAnimFrame(render);
}

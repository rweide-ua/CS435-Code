
var canvas;
var gl;

var NumTimesToSubdivide = 3;

var pointsArray = [];
var index = 0;

function triangle(a, b, c) {
    pointsArray.push(a);
    pointsArray.push(b);
    pointsArray.push(c);
    index += 3;
}

function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        var ab = normalize(mix( a, b, 0.5), true);
        var ac = normalize(mix( a, c, 0.5), true);
        var bc = normalize(mix( b, c, 0.5), true);
                                
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { // draw triangle at end of recursion
        triangle(a, b, c);
    }
}

var X = .525731112119133606;
var Z = .850650808352039932;

var vdata = [
    vec4(-X, 0.0, Z, 1.0), vec4(X, 0.0, Z, 1.0), vec4(-X, 0.0, -Z, 1.0), vec4(X, 0.0, -Z, 1.0),
    vec4(0.0, Z, X, 1.0), vec4(0.0, Z, -X, 1.0), vec4(0.0, -Z, X, 1.0), vec4(0.0, -Z, -X, 1.0),
    vec4(Z, X, 0.0, 1.0), vec4(-Z, X, 0.0, 1.0), vec4(Z, -X, 0.0, 1.0), vec4(-Z, -X, 0.0, 1.0)
];

var tindices = [
	[0, 4, 1], [0, 9, 4], [9, 5, 4], [4, 5, 8], [4, 8, 1],
	[8, 10, 1], [8, 3, 10], [5, 3, 8], [5, 2, 3], [2, 7, 3],
	[7, 10, 3], [7, 6, 10], [7, 11, 6], [11, 0, 6], [0, 1, 6],
	[6, 1, 10], [9, 0, 11], [9, 11, 2], [9, 2, 5], [7, 2, 11]
];

function icosahedron() { 
    for (var i = 0; i < 20; i++) { 
        divideTriangle(vdata[tindices[i][0]], vdata[tindices[i][1]],
				  vdata[tindices[i][2]], NumTimesToSubdivide); 
    }
}

function tetrahedron() {
    var a = vec4(0.0, 0.0, -1.0, 1);
    var b = vec4(0.0, 0.942809, 0.333333, 1);
    var c = vec4(-0.816497, -0.471405, 0.333333, 1);
    var d = vec4(0.816497, -0.471405, 0.333333, 1);

    divideTriangle(a, b, c, NumTimesToSubdivide);
    divideTriangle(d, c, b, NumTimesToSubdivide);
    divideTriangle(a, d, b, NumTimesToSubdivide);
    divideTriangle(a, c, d, NumTimesToSubdivide);
}

window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    // gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
        
    icosahedron();
    // tetrahedron();

    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray( vPosition);
    
    render();
}


function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    for( var i=0; i<index; i+=3) {
        gl.drawArrays(gl.LINE_LOOP, i, 3);
        // gl.drawArrays(gl.TRIANGLES, i, 3);
    }

    window.requestAnimFrame(render);
}

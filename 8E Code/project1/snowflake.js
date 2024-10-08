"use strict";

/*********
CS 435
Project #1
Lilly Eide

This program constructs a Koch snowflake, which is described as a triangle
whose line segments are repeatedly subdivided and added onto using a specific formula:
A line segment of length L is divided into 3 line segments each of length L/3, 
then the middle segment is replaced with two segments both of length L/3 to
create an equilateral triangle in the middle of the original line segment.

gasket2.js was used as a starting point for this file, before being heavily modified to
fit the problem description as written.
*********/

var canvas;
var gl;

var positions = [];
var edgeList = [];

var numIterations = 4;

window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) { alert( "WebGL 2.0 isn't available" ); }

    // Note: this has been changed to be an equalateral triangle.
    // Additionally, the starting positions had to be halved so that
    // the additional points can fit on the default canvas.
    var vertices = [
        vec2( -1 / 2, -1 / 2 ),
        vec2(  0,  0.73205 / 2 ),
        vec2(  1 / 2, -1 / 2 )
    ];

    // Initialize edge list with positions from vertices array
    edgeList = [
        [vertices[0], vertices[1]],
        [vertices[1], vertices[2]],
        [vertices[2], vertices[0]]
    ]
    // Begin recursion
    snowflake2(numIterations);
    // Prepare edge list for rendering
    edgesToPositions(edgeList);

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram(program);

    // Load the data into the GPU

    var bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW );

    // Associate out shader variables with our data buffer

    var positionLoc = gl.getAttribLocation( program, "aPosition" );
    gl.vertexAttribPointer( positionLoc, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( positionLoc );

    render();
};

function edgesToPositions(edges) {
    for (let i = 0; i < edges.length; i++) {
        positions.push(edges[i][0]);
    }
}

function distance(p1, p2) {
    // For vec2, index 0 is X axis, index 1 is Y axis (assumedly)
    return Math.sqrt(Math.pow((p2[0] - p1[0]), 2) + Math.pow((p2[1] - p1[1]), 2));
}

function slope(p1, p2) {
    return (p2[1] - p1[1]) / (p2[0] - p1[0]);
}

function getAngle(p1, p2) {
    // If both points equal on Y axis
    if (p1[1] === p2[1]) {
        // If point 1 is to the left of point 2
        if (p1[0] < p2[0]) {
            return 0;
        } else { // If point 1 is to the right of point 2
            return Math.PI;
        }
    }
    // If both points equal on X axis
    if (p1[0] === p2[0]) {
        // If point 1 is below point 2
        if (p1[1] < p2[1]) {
            return Math.PI / 2;
        } else { // If point 1 is above point 2
            return 3 * (Math.PI / 2);
        }
    }
    // If points aren't on same axes
    return Math.atan(slope(p1, p2));
}

function snowflake2(count) {
    if (count === 1) {
        return;
    }
    console.log("Iter: " + count);
    var newEdgeList = [];
    for (var i = 0; i < edgeList.length; i++) {
        // Split edgeList[0] into 4 edges according to algorithm
        // Push these four new edges into the new edge list
        var a = edgeList[i][0];
        var b = edgeList[i][1];
        var currentLength = distance(a, b);
        // Each line segment needs to be 1/3rd of the current line's length
        var neededLength = currentLength / 3;

        // Generate points for line segments
        var ab1 = mix(a, b, 0.3333);
        var initAngleAB = getAngle(a, b);
        // Needed angle is 60d for equilateral triangle
        var desiredAngleAB = initAngleAB + (Math.PI / 3);
        
        // Use angle and sin/cos to determine new middle point
        var abmid = vec2(0, 0);
        abmid[0] = ab1[0] + (Math.cos(desiredAngleAB) * neededLength);
        abmid[1] = ab1[1] + (Math.sin(desiredAngleAB) * neededLength);
        
        var ab2 = mix(a, b, 0.6666);

        // Fix for weird rendering. Works but not sure how the issue is happening in the first place.
        if (distance(abmid, ab2) > neededLength) {
            abmid[0] = ab1[0] + (Math.cos(desiredAngleAB) * -neededLength);
            abmid[1] = ab1[1] + (Math.sin(desiredAngleAB) * -neededLength);
        }
        
        // Add new edges to list
        var edge1 = [a, ab1];
        var edge2 = [ab1, abmid];
        var edge3 = [abmid, ab2];
        var edge4 = [ab2, b];
        newEdgeList.push(edge1, edge2, edge3, edge4);
    }
    // Clear existing edge list (this feels wrong)
    edgeList.length = 0;
    // Copy new edge list over
    for (var i = 0; i < newEdgeList.length; i++) {
        edgeList.push(newEdgeList[i]);
    }
    snowflake2(count - 1);
}

function render()
{
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.LINE_LOOP, 0, positions.length );
}

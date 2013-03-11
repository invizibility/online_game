var kLong = 50;
var kLat = 50;

function Sphere(radius) { 
    this.o = new GLobject();

    for (var i = 0; i <= kLong; i++) {
	// From 0 to pi
	var theta = i / kLong * Math.PI;
	var y = Math.cos(theta);
	var sin_theta = Math.sin(theta);
	for (var j = 0; j <= kLat; j++) {
	    // From 0 to 2 pi
	    var phi = j * 2 / kLat * Math.PI;
	    // x = r sin theta cos phi
	    var x = sin_theta * Math.cos(phi);
	    var z = sin_theta * Math.sin(phi);

	    this.o.addNorms(x, y, z);
	    this.o.addPos(radius * x,
	                  radius * y,
			  radius * z);
	    this.o.addColors(x/2, y/2, z/2);
	}
    }

    // We have the vertices now - stitch them 
    //  into triangles
    // A  C 
    //        Two triangles: ABC and BDC
    // B  D   Longitude lines run through AB and  CD
    //        Array indices of C and D are A / B + 1
    for (var i = 0; i < kLat; i++) {
	var A = (i * (kLong + 1));
	var B = A + kLong + 1;
	var C = A + 1;
	var D = B + 1;
	for (var j = 0; j < kLong; j++) {
	    this.o.addQuadIndexes(A++,B++,C++,D++);
	}
    }
};

Sphere.prototype.initBuffers = function(gl_) {
    this.o.initBuffers(gl_);
}

Sphere.prototype.draw = function(gl_, shader_) {
    this.o.drawBuffers(gl_, shader_);
};

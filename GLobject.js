/**
 * GLobject abstracts away buffers and arrays of data, 
 *  allowing us to work at a high level without 
 *  tripping over low-level implementation details.
 */
function GLobject() {

    // Data to load into buffers
    this.normData = [];
    this.posData = [];
    this.colData = [];
    this.indexData = [];

    this.normBuff = null;
    this.posBuff = null;
    this.colBuff = null;
    this.indexBuff = null;

    // Quads use an index position counter
    this.indexPos = 0;

    // Position / scale / rotation data for this object
    // X-Y-Z position to translate
    this.position = [0,0,0];
    // X-Y-Z coords to rotate
    this.rotation = [0,0,0];
    this.scale = 1;

    this.texture = "favicon.ico";
}

/**
 * Pass 3 numbers into the object's internal arrays
 */
GLobject.prototype.addNorms = 
    function(x,y,z) { this.normData.push3(x,y,z); }
GLobject.prototype.addPos = 
    function(x,y,z) { this.posData.push3(x,y,z); }
GLobject.prototype.addColors = 
    function(x,y,z) { this.colData.push3(x,y,z); }
GLobject.prototype.addIndexes =
    function(a,b,c) { this.indexData.push3(a,b,c); }

/**
 * Or, pass a vec3 
 * (only with arrays that it makes sense for)
 */
GLobject.prototype.addNormVec = 
    function(vec) { this.normData.pushV(vec); }
GLobject.prototype.addPosVec = 
    function(vec) { this.posData.pushV(vec); }
GLobject.prototype.addColorVec = 
    function(vec) { this.colData.pushV(vec); }

/** 
 *  A---C 
 *  |  /|    Two triangles: ABC and BDC
 *  |/  |     
 *  B---D
 */
GLobject.prototype.addQuadIndexes = function(a,b,c,d) {
    this.indexData.push3(a,b,c); 
    this.indexData.push3(b,d,c); }

/**
   Buffers a quadrilateral.
 */
GLobject.prototype.Quad = function(a, b, c, d) { 
    this.addPosVec(a);
    this.addPosVec(b);   
    this.addPosVec(c);   
    this.addPosVec(d);

    var normalVec = crossVec3(subVec3(b,a), 
			      subVec3(c,a));
    for (var i = 0; i < 4; ++i) {
	this.addNormVec(normalVec);
	this.addColors(.3, .5, .7);
    }
    this.addQuadIndexes(this.indexPos++,
			this.indexPos++,
			this.indexPos++,
			this.indexPos++);
}

/**
 * Once the arrays are full, call to 
 *  buffer WebGL with their data
 */
GLobject.prototype.initBuffers = function(gl_) {
    if(!gl_) gl_ = thisGL;
    else thisGL = gl_;

    this.normBuff = gl_.createBuffer();
    this.posBuff = gl_.createBuffer();
    this.colBuff = gl_.createBuffer();
    this.indexBuff = gl_.createBuffer();

    gl_.bindBuffer(gl_.ARRAY_BUFFER, this.normBuff);
    gl_.bufferData(gl_.ARRAY_BUFFER, 
		  new Float32Array(this.normData), 
		  gl_.STATIC_DRAW);
    this.normBuff.itemSize = 3;
    this.normBuff.numItems = 
	this.normData.length / 3;

    this.posBuff = gl_.createBuffer();
    gl_.bindBuffer(gl_.ARRAY_BUFFER, this.posBuff);
    gl_.bufferData(gl_.ARRAY_BUFFER, 
		  new Float32Array(this.posData), 
		  gl_.STATIC_DRAW);
    this.posBuff.itemSize = 3;
    this.posBuff.numItems = 
	this.posData.length / 3;

    this.colBuff = gl_.createBuffer();
    gl_.bindBuffer(gl_.ARRAY_BUFFER, this.colBuff);
    gl_.bufferData(gl_.ARRAY_BUFFER, 
		  new Float32Array(this.colData), 
		  gl_.STATIC_DRAW);
    this.colBuff.itemSize = 3;
    this.colBuff.numItems = this.colData.length / 3;

    this.indexBuff = gl_.createBuffer();
    gl_.bindBuffer(gl_.ELEMENT_ARRAY_BUFFER, this.indexBuff);
    gl_.bufferData(gl_.ELEMENT_ARRAY_BUFFER, 
		  new Uint16Array(this.indexData), 
		  gl_.STATIC_DRAW);
    this.indexBuff.itemSize = 1;
    this.indexBuff.numItems = this.indexData.length;
}

GLobject.prototype.rotate = function(vec) {
    this.rotation[2] += vec[2]; 
    this.rotation[1] += vec[1]; 
    this.rotation[0] += vec[0]; 

}

GLobject.prototype.scale = function(number) {
    this.scale *= number; 
}

GLobject.prototype.translate = function(vec) {
    for(var i = 0; i < this.posData.length; i += 3) {
	this.posData[i] += vec[0]; 
	this.posData[i+1] += vec[1]; 
	this.posData[i+2] += vec[2]; 
    }
    this.initBuffers();
}

/**
 * Point to, and draw, the buffered triangles
 */
GLobject.prototype.drawBuffers = function(gl_) {

//    theMatrix.rotate(this.rotationM, this.rotation);
//    theMatrix.translate(this.position);
//    theMatrix.scale(this.scale);

    theMatrix.translate(this.position);

    if(this.rotation[2] != 0)
	theMatrix.rotate(1, [this.rotation[2], 0, 0]);
    if(this.rotation[1] != 0)
	theMatrix.rotate(1, [0, this.rotation[1], 0]);
    if(this.rotation[0] != 0)
	theMatrix.rotate(1, [0, 0, this.rotation[0]]);

    theMatrix.scale([this.scale, this.scale, this.scale]);

    gl_.bindBuffer(gl_.ARRAY_BUFFER, this.normBuff);
    gl_.vertexAttribPointer(shaders.vertexNormalAttribute, 
			   this.normBuff.itemSize, 
			   gl_.FLOAT, false, 0, 0);
    
    gl_.bindBuffer(gl_.ARRAY_BUFFER, this.posBuff);
    gl_.vertexAttribPointer(shaders.vertexPositionAttribute, 
			   this.posBuff.itemSize, 
			   gl_.FLOAT, false, 0, 0);
    
    gl_.bindBuffer(gl_.ARRAY_BUFFER, this.colBuff);
    gl_.vertexAttribPointer(shaders.vertexColorAttribute, 
			   this.colBuff.itemSize,
			   gl_.FLOAT, false, 0, 0);

    gl_.bindBuffer(gl_.ELEMENT_ARRAY_BUFFER, this.indexBuff);
    theMatrix.setUniforms(gl_);
    gl_.drawElements(gl_.TRIANGLES, 
		    this.indexBuff.numItems, 
		    gl_.UNSIGNED_SHORT, 0);
};
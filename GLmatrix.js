/**
   Internally handles matrixes that will be loaded to GL

   Functions manipulating these matrices set flags, ensuring we
   do not perform expensive matrix operations unless necessary
 */
function GLmatrix(gl_) {

    this.gl = gl_;

    this.matrices = new Float32Array(48);

    // Model, viewing, and light matrix
    this.mMatrix = this.matrices.subarray(0, 16);
    this.ivMatrix = this.matrices.subarray(16,32);
    this.nMatrix = this.matrices.subarray(32,48);

    mat4.identity(this.mMatrix);
    mat4.identity(this.ivMatrix);
    mat4.identity(this.nMatrix);
    this.vMatrix = mat4.create();
    this.pMatrix = mat4.create();
    this.lightMatrix = mat4.create();
    mat4.translate(this.lightMatrix,
		   this.lightMatrix, 
		   [0,400,0]); 

    // Contains rotation or translation that is applied to 
    // viewing matrix upon next frame (set externally)
    this.vMatrixNew = mat4.create();
    
    // Inverted viewing matrix, must be recomputed each
    // time the viewing matrix changes
//    this.ivMatrix = mat4.create();

    // Ditto wit hinverted lighting matrix
    this.ilMatrix = mat4.create();

    // Normal and modelview matrices, which need to be
    // recomputed each time the model matrix changes
//    this.nMatrix = mat4.create();   // normal
    this.mvMatrix = mat4.create();  // modelview

    // These flags tell us whether to update the matrixes above
    this.mMatrixChanged = true;
    this.vMatrixChanged = true;
    this.pMatrixChanged = true;
    this.vMatrixNewChanged = false;

    // Here is some random, unrelated stuff.
    this.r2 = Math.sqrt(2);
    this.mStack = [];

    this.distToMove = vec3.create();

    // Toggled by member function 'toggleSpeed'
    this.speedMode = 0;
}

var moveDist = 20.1; //default to maze
var lookDist = 1/10; //default to maze

/**
   Writes a perspective view into internal perspective matrix
*/
GLmatrix.prototype.perspective = function(zoom, aRatio, zNear, zFar) {
    mat4.perspective(this.pMatrix, zoom, aRatio, zNear, zFar); 
    this.pMatrixChanged = true;
};

/**
   Writes an orthogonal view into internal perspective matrix
*/
GLmatrix.prototype.ortho = function(left, right, bottom, top, near, far) {
    mat4.ortho(this.pMatrix, left, right, bottom, top, near, far); 
    this.pMatrixChanged = true;
};

GLmatrix.prototype.viewMaze = function() {
    this.vTranslate([20,2,9.0]);
    this.vRotate(Math.PI, [0, 1, 0]);
};

var StadiumInitSeqNum = 0;
GLmatrix.prototype.viewStadium = function() {
    this.vTranslate([-1500,1000,1500]);
    this.vRotate(-Math.PI/4, [0, 1, 0]);
};

GLmatrix.prototype.translate = function(vector) {
    mat4.translate(this.mMatrix, this.mMatrix, vector); 
    this.mMatrixChanged = true;
};

GLmatrix.prototype.rotate = function(angle, vector) {
    mat4.rotate(this.mMatrix, this.mMatrix, angle, vector); 
    this.mMatrixChanged = true;
};

GLmatrix.prototype.vTranslate = function(vector) {
    mat4.translate(this.vMatrixNew,
		   this.vMatrixNew, 
		   vector); 
    this.vMatrixNewChanged = true;
};

GLmatrix.prototype.translateN = function(vector) {
    mat4.translate(this.mMatrix, 
		   this.mMatrix,
		   [-vector[0], 
		    -vector[1], 
		    -vector[2]]); 
    this.mMatrixChanged = true;
};

GLmatrix.prototype.rotate = function(rads, vector) {
    mat4.rotate(this.mMatrix, this.mMatrix, rads, vector);
    this.mMatrixChanged = true;
};

GLmatrix.prototype.vRotate = function(rads, vector) {
    mat4.rotate(this.vMatrixNew, this.vMatrixNew, rads, vector);
    this.vMatrixNewChanged = true;
};

GLmatrix.prototype.scale = function(vector) {
    mat4.scale(this.mMatrix, this.mMatrix, vector); 
    this.mMatrixChanged = true;
};
GLmatrix.prototype.mul = function(m) {
    mat4.multiply(this.mMatrix, this.mMatrix, m); 
    this.mMatrixChanged = true;
};

GLmatrix.prototype.vMul = function(v) {
    mat4.multiply(this.vMatrix, this.vMatrix, v); 
    this.vMatrixChanged = true;
};

GLmatrix.prototype.lookUp = function() {
	radiansToRotate = (lookDist * 2 * Math.PI)/10;
	rotateCount = 10;
	vectorRotation = [1,0,0];
};

GLmatrix.prototype.lookDown = function() {
	radiansToRotate = (lookDist * 2 * Math.PI)/10;
	rotateCount = 10;
	vectorRotation = [-1,0,0];
};

GLmatrix.prototype.lookRight = function(distance) {
	radiansToRotate = (lookDist * distance * Math.PI)/10;
	rotateCount = 10;
	vectorRotation = [0,-1,0];
};

GLmatrix.prototype.turnAround = function(rads){
    radiansToRotate = rads/10;
    rotateCount = 10;
    vectorRotation = [0,1,0];
};

GLmatrix.prototype.moveForward = function() {
    if(moveCount !== 0  && moveAccel <= 5){
        moveAccel += 0.1;
    }
    else if(moveCount === 0){
        moveAccel = 1;
    }
    this.distToMove = [0,0,(-moveDist/10)*moveAccel];

    moveCount = 10;
};

GLmatrix.prototype.moveBack = function() {
    this.distToMove = [0,0,moveDist/10];
    moveCount = 10;
};

GLmatrix.prototype.moveInToPlay = function() {
	this.distToMove = [0,-1,-50/10];
	moveCount = 10;
};

GLmatrix.prototype.dropIn = function() {
    var thePos = vec4.fromValues(0,0,0,1);
    var newPos = vec4.fromValues(0,0,0,1);
    var curPos = vec4.fromValues(0,0,0,1);

    vec4.transformMat4(newPos, thePos, this.vMatrixNew);
    vec4.transformMat4(newPos, newPos, this.vMatrix);
    vec4.transformMat4(curPos, curPos, this.vMatrix);

    this.distToMove = [0,(-curPos[1]/100)+(12.5/100),-(curPos[2]+400)/100];
    moveCount = 100;
    StadiumInitSeqNum = 2;
};

/**
   Rotate between supported speed modes:
   0 = normal
   1 = slow (.1x)
   2 = fast (10x)
   'Shift' toggles between the modes
*/
GLmatrix.prototype.toggleSpeed = function() {
    this.speedMode += 1;
    this.speedMode %= 3;
    var keyboard = document.getElementById("keyboard");
    switch (this.speedMode) {
    case 1: // Slow speed
	keyboard.innerHTML = "Speed mode: SLOW";
	break;
    case 2: // Fast speed
	keyboard.innerHTML = "Speed mode: FAST";
	break;
    default:  // Normal speed
	keyboard.innerHTML = "Speed mode: NORMAL";
	break;
    }
};

var moveCount = 0;
var moveAccel = 1;

GLmatrix.prototype.gradualMove = function() {

    if(moveCount > 0) {
	switch (this.speedMode) {
	case 1: // Slow speed
	    this.vTranslate(
		vec3.scale(vec3.create(), this.distToMove, 0.1),
		this.distToMove);
	    break;
	case 2: // Fast speed
	    this.vTranslate(
		vec3.scale(vec3.create(), this.distToMove, 10.0),
		this.distToMove);
	    break;
	default:  // Normal speed
	    this.vTranslate(this.distToMove);
	    break;
	}
	moveCount -= 1;
    }
};

var rotateCount = 0;
var radiansToRotate = 0; 
var vectorRotation = [0,0,0];
GLmatrix.prototype.gradualRotate = function() {
    if(rotateCount > 0) {
	this.vRotate(radiansToRotate, vectorRotation);
	rotateCount -= 1;
    }
};


GLmatrix.prototype.newViewAllowed = function() {
    if(mazeMode)
	return myMaze.checkPosition();
    if(stadiumMode)
	return myStadium.checkPosition();
};

/**
 * Input: amount of time to go up for x squares.
 */
GLmatrix.prototype.update = function() {

    if(GLobject.has_collided > 0) GLobject.has_collided --;

    const x = 50.0;
    this.gradualMove();
    this.gradualRotate();
    if(this.vMatrixNewChanged === false) { return; }

    //Multiplies vMatrixNew * vMatrix
    //therefore if vMatrixNew==identity we have no movement
    this.vMul(this.vMatrixNew);
    this.vMatrixChanged = true;
    mat4.identity(this.vMatrixNew);
    return; 
};

/**
 * View / model / normal ops I got from:
 http://www.songho.ca/opengl/gl_transform.html
*/
GLmatrix.prototype.setViewUniforms = function(shader_) {

    if (this.pMatrixChanged === true) {
	this.gl.uniformMatrix4fv(shader_.unis["pMatU"], false, this.pMatrix);
	this.pMatrixChanged = false;
    }
    if (this.vMatrixChanged === true) {
	// models and lights are transformed by 
	//  inverse of viewing matrix
	mat4.invert(this.ivMatrix, this.vMatrix);
	mat4.mul(this.ilMatrix, this.vMatrix, this.lightMatrix);
	this.vMatrixChanged = false;
    }

    this.gl.uniformMatrix4fv(shader_.unis["mvnMatU"], false, this.matrices);
    this.gl.uniformMatrix4fv(shader_.unis["lMatU"], false, this.ilMatrix);
};



/**
 * Per-vertex uniforms must be set each time.
 */
GLmatrix.prototype.setVertexUniforms = function(shader_) {

    if (this.mMatrixChanged === true) { 
	// perceived normals: (inverse of modelview
	//  transposed) * object normals
	mat4.mul(this.mvMatrix, this.ivMatrix, this.mMatrix);
	mat4.invert(this.nMatrix, this.mvMatrix);
	mat4.transpose(this.nMatrix, this.nMatrix);
	this.mMatrixChanged = false;
    }

    this.gl.uniformMatrix4fv(shader_.unis["mvnMatU"], false, this.matrices);
};

GLmatrix.prototype.push = function() {
    var copy = mat4.clone(this.mMatrix);
    this.mStack.push(copy);
};

GLmatrix.prototype.pop = function() {
    if (this.mStack.length === 0) {
        throw "Invalid pop"; }
    mat4.copy(this.mMatrix, this.mStack.pop());
    this.mMatrixChanged = true;
};

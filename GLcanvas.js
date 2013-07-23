
/**
 * Object holding modelview and perspective matrices.
 */
var theMatrix;

/**
 * This is basically a wrapper class for the GL context.
 * It links together objects that are in scenes to things
 * defined within the context, such as shaders.
 */
function GLcanvas() {
    this.objects = [];
    this.textures = [];
    this.textureNums = [];
    this.frame_count = 0;
    this.canvas = document.getElementById("glcanvas");
    this.gl = null;
	
    // Create status bar
    var display = document.getElementById("display");
    display.innerHTML = "<p id=\"glcanvas_status\"></p>" + display.innerHTML;
	
    // if we have errors, don't keep trying to draw the scene
    this.has_errors = false;
    theMatrix = new GLmatrix();

    this.resizeCounter = 0;

    document.getElementById("stadium_name").focus();
    document.getElementById("stadium_name").value = "Hogarth";

    return this;
}

GLcanvas.prototype.init = function() {

    // Any command line params specified?
    var params = window.location.search;
    if(params.length > 1) this.start(params.substring(1));
}

GLcanvas.prototype.createScene = function(objToDraw) {

    mazeMode = 0;
    stadiumMode = 0;

    if(objToDraw == "cylinder") {
	this.objects.push(new Cylinder(1, 4, 5, 8, 3));
    } else if(objToDraw == "sphere") {
	this.objects.push(new Sphere(2));
    } else if(objToDraw == "skybox") {
	this.objects.push(new Skybox());
    } else if(objToDraw == "stool") {
	this.objects.push(new Stool());
    } else if(objToDraw == "jumbotron") {
	this.objects.push(new Jumbotron());
	this.objects.push(new Skybox());
    } else if(objToDraw == "shadow") {
	this.objects.push(new MazePiece(5, NO_LEFT, TILE_TEXTURE));
	this.objects.push(new Stool());
    } else if(objToDraw == "game") {
	this.objects.push(new Game());
    } else if(objToDraw == "text") {
	this.string1 = new GLstring("testing 1.", TEXT_TEXTURE);
	this.string2 = new GLstring("testing 2.", TEXT_TEXTURE2);
	this.objects.push(this.string1);
	this.objects.push(this.string2);
	this.objects.push(new Skybox());
	this.objects.push(new Quad(
	    [ 1.5, 0.8,-4.0],
	    [ 1.5,-0.8,-4.0],
	    [-1.5, 0.8,-4.0],
	    [-1.5,-0.8,-4.0]).setTexture(TEXT_TEXTURE).setShader(this.gl.shader_canvas));
	this.objects.push(new Quad(
	    [ 1.5, 2.4,-4.0],
	    [ 1.5, 0.8,-4.0],
	    [-1.5, 2.4,-4.0],
	    [-1.5, 0.8,-4.0]).setTexture(TEXT_TEXTURE2).setShader(this.gl.shader_player));

    } else if(objToDraw == "torus") {
	this.objects.push(new Torus(0.2, 2));
    }
};

GLcanvas.prototype.bufferModels = function() {
    for(var i = 0, max = this.objects.length;
	i < max; ++i) {
	this.objects[i].initBuffers(this.gl); 
    }
};

GLcanvas.prototype.drawModels = function() {
    for(var i = 0, max = this.objects.length;
	i < max; ++i) {
	this.objects[i].draw(this.gl); 
    } 
};

/**
 * Begins the canvas.
 */
GLcanvas.prototype.start = function(theScene) {

    if (this.gl === null) {

	// One-time display methods
	document.getElementById("header").style.display = "none";
	document.getElementById("title2").style.display = "none";
	document.getElementById("footer").style.display = "none";

	this.canvas.style.display = "inline-block";
	this.canvas.style.width = "100%";
	this.canvas.width = this.canvas.offsetWidth - 16;
	this.canvas.height = window.innerHeight - 25;

	if(this.initGL() !== 0) {
	    var theWindow = window.open(
		"GLerror.php", 
		"",
		"height=110,width=220,location=no,scrollbars=no");
	    theWindow.focus();
	    return;
	}

	this.shader_source = new GLshader;
	this.shader_count = 0;

	this.gl.shader = this.gl.createProgram();
	this.gl.shader_frame = this.gl.createProgram();
	this.gl.shader_color = this.gl.createProgram();
	this.gl.shader_canvas = this.gl.createProgram();
	this.gl.shader_player = this.gl.createProgram();
	if(this.initShaders(this.gl.shader,        "default",  "default") !== 0 ||
	   this.initShaders(this.gl.shader_frame,  "frame",    "default") !== 0 ||
	   this.initShaders(this.gl.shader_canvas, "canvas",   "default") !== 0 ||
	   this.initShaders(this.gl.shader_player, "player",   "player") !== 0 ||
	   this.initShaders(this.gl.shader_color,  "color",    "color") !== 0) {

	    var theWindow = window.open(
		"GLerror_shader.php", 
		"",
		"height=110,width=260,location=no,scrollbars=no");
	    theWindow.focus();
	    return;
	}

	this.gl.useProgram(this.gl.shader);
	this.active_shader = this.gl.shader;

	document.getElementById("glcanvas_status").innerHTML = 
	    "Shaders compiled.</br>";

	// Get rid of unused JS  memory
	this.shader_source.cleanup();

	// Set up to draw the scene periodically.
	document.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;

	this.objects = [];

    theMatrix.perspective(45,
			  this.canvas.clientWidth / 
			  Math.max(1, this.canvas.clientHeight),
			  0.1, 300000.0);

	// Instantiate models
	this.createScene(theScene);

	if(textures_loading !== 0) 
	    document.getElementById("glcanvas_status").innerHTML += 
	    "" + textures_loading + " textures.</br>";
	this.bufferModels();

	// Set background color, clear everything, and
	//  enable depth testing
	this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
	this.gl.clearDepth(1.0);
	this.gl.enable(this.gl.DEPTH_TEST);
    } else {
	// If we have started GL already, 
	//  just add the new model.
	this.createScene(theScene);
	this.bufferModels();
    }
    // After the scene is complete, see if we have textures to load..?
    // If not, let's draw right away
    if(textures_loading === 0) this.done_loading(1500);

};

GLcanvas.prototype.done_loading = function(timeout) { 

    // Wait 1.5 seconds for no reason
    setTimeout(tick,timeout); 
};


/*
 * Initialize WebGL, returning the GL context or null if
 * WebGL isn't available or could not be initialized.
 */
GLcanvas.prototype.initGL = function() {
    try {
	this.gl = this.canvas.getContext("experimental-webgl");
    }
    catch(e) { console.log("%s",e); }
    // If we don't have a GL context, give up now
    if (!this.gl) { return 1; }

    this.gl.active = 0;	
    // sets textures we have already loaded.
    // some of them don't have sources
    this.gl.tex_enum = [];
    this.gl.tex_enum[FRAME_BUFF] = -1;
    this.gl.tex_enum[NO_TEXTURE] = -1;
    this.gl.tex_enum[TEXT_TEXTURE] = -1;
    this.gl.tex_enum[TEXT_TEXTURE2] = -1;
    this.gl.tex_enum[TEXT_TEXTURE3] = -1;
    this.gl.tex_enum[TEXT_TEXTURE4] = -1;

    window.onresize = function() {
	theCanvas.resizeCounter = 30;
    };
    return 0;
};

GLcanvas.prototype.resize = function() {
    this.canvas.width = this.canvas.offsetWidth - 16;
    this.canvas.height = window.innerHeight - 25;
    this.gl.viewport(0, 0, this.gl.drawingBufferWidth, 
		     this.gl.drawingBufferHeight);
    theMatrix.perspective(45,
			  this.gl.drawingBufferWidth / 
			  this.gl.drawingBufferHeight,
			  0.1, 30000.0);

};

/**
 *  Draw the scene.
 */
GLcanvas.prototype.drawScene = function() {
    
    // Don't check context for errors. This is expensive.
    // Errors are evident in this stage as something 
    //  usually doesn't show up.

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | 
		  this.gl.DEPTH_BUFFER_BIT);

    // Draw all our objects
    theMatrix.push();
    this.drawModels();
    theMatrix.pop();

    // filter so we don't resize every frame
    if(this.resizeCounter > 0) {
	if((--this.resizeCounter) === 0) {
	    this.resize();
	}
    }
    
    this.frame_count++;
//    this.gl.clear(this.gl.STENCIL_BUFFER_BIT);

};

GLcanvas.prototype.disableAttribute = function(gl_shader, name) {

    if(gl_shader.attribs[name] === -1) return;
    this.gl.disableVertexAttribArray(gl_shader.attribs[name]);
    gl_shader.attrib_enabled[name] = false;
}

GLcanvas.prototype.initShaders = function(gl_shader, frag, vert) {

    if(this.shader_source.init(this.gl, gl_shader, frag, vert) !== 0) return -1;

    gl_shader.count = (++this.shader_count);

    gl_shader.sampler = 0;
    gl_shader.attribs = [];
    gl_shader.attrib_enabled = [];
    gl_shader.unis = [];


    this.initAttribute(gl_shader, "vPosA");

    this.initAttribute(gl_shader, "vNormA");
    this.initAttribute(gl_shader, "vColA");
    this.initAttribute(gl_shader, "textureA");

    this.initUniform(gl_shader, "frames_elapsed_u")
    this.initUniform(gl_shader, "hi_hat_u")
    this.initUniform(gl_shader, "ambient_coeff_u");
    this.initUniform(gl_shader, "diffuse_coeff_u");
    this.initUniform(gl_shader, "specular_coeff_u");
    this.initUniform(gl_shader, "specular_color_u");

    // 3 matrixes packed into a size 3 array.
    // [0] is model, [1] is view, [2] is normal.
    // Perspective never changes, so is left out.
    // Another reason it makes sense to pack these is if one
    // changes, they all do.
    this.initUniform(gl_shader, "mvnMatU"); 

    this.initUniform(gl_shader, "pMatU"); // Perspecctive matrix
//    this.initUniform(gl_shader, "mMatU"); // Model matrix
//    this.initUniform(gl_shader, "vMatU"); // Viewing matrix
//    this.initUniform(gl_shader, "nMatU"); // Model's normal matrix
    this.initUniform(gl_shader, "lMatU"); // Lighting matrix
    this.initUniform(gl_shader, "lightPosU"); // Initial light's position
    
    for(var i_ = 0; i_ < 11; ++i_) {
	this.initUniform(gl_shader, "sampler" + i_);
    }
    
    return 0;
};

/**
 * Some shaders won't have these attributes.
 *
 * If this is the case, they will not be added to the 
 * shaders' associative attributes list.
 */
GLcanvas.prototype.initAttribute = function(gl_shader, attr) {

    var theAttrib = this.gl.getAttribLocation(gl_shader, attr);
    gl_shader.attribs[attr] = theAttrib;
    gl_shader.attrib_enabled[attr] = false;
    if(theAttrib === -1) { return; }
    gl_shader.attrib_enabled[attr] = false;
};

/**
 * This is basically a wrapper for GLSL's 'useProgram' function that
 *  only disables an old program if it's not the same as the new one.
 */
GLcanvas.prototype.changeShader = function(new_shader) {

//    GLSL way of polling, it is costly

//    var old_shader = this.gl.getParameter(this.gl.CURRENT_PROGRAM);
//    if(old_shader === new_shader) return;

    // Our way
    if (new_shader.count === this.active_shader.count) return;

    this.disableAttribute(this.active_shader, "vPosA");
    this.disableAttribute(this.active_shader, "vNormA");
    this.disableAttribute(this.active_shader, "vColA");
    this.disableAttribute(this.active_shader, "textureA");

    this.gl.useProgram(new_shader);
    this.active_shader = new_shader;
};

GLcanvas.prototype.initUniform = function(gl_shader, uni) {
    gl_shader.unis[uni] = this.gl.getUniformLocation(gl_shader, uni);
};

var theCanvas;

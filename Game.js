/**
 * Creates and initializes a game.
 */
function Game(gl_) {  

    // Used in collision detection.
    var WALL_NONE = 0;
    var WALL_N = 1;
    var WALL_S = 2;
    var WALL_W = 3;
    var WALL_E = 4;

    var theTexture2 = new GLtexture(theCanvas.gl, BRICK_NORMAL_TEXTURE);
    var theTexture3 = new GLtexture(theCanvas.gl, HEAVEN_NORMAL_TEXTURE);

    var audio = new GLaudio();

    // createAudio(origin URL, destination node, loop[, loop offset, loop time])
    // These are at 120 BPM: 1 sec = 2 beats
    // 0. Low-pass input detects movement, occuring on the half-beat; slightly below 0.25s
    // 1. Non-looping sound, which will be triggered by the above sample
    // 2. Non-looping sound, which will be triggered by the above sample
    // 3. Rest of the song.
    audio.createAudio("music/beats.mp3", audio.low_pass, true, 1, 8);
    audio.createAudio("music/electro_hat.wav", audio.web_audio.destination, false);
    audio.createAudio("music/jump_open_hat.wav", audio.web_audio.destination, false);
    audio.createAudio("music/backing_beat.wav", audio.delay, true, 0, 8);

    audio.playMusic();

    var i; // for init loop

    var player = new Player(gl_, 50);

    // handles movement
    this.grid = 50;
    this.bg_movement = vec3.create();
    this.cam_movement = vec3.create();
    this.cam_left_count = 0;
    this.cam_right_count = 0;
    this.cam_in_left_move = false;
    this.cam_in_right_move = false;
    this.in_change = false;
    this.change_x = [];

    this.hi_hat = 0;

    // Jump distance is a vector of linear X values
    // When we increment y-pos by these array values, the effect is a parabolic jump

    // new shader effect
    this.floor_effect = 0;

    var floor_width = this.grid;
    this.floor = [];
    this.push_button = [];
    this.three_dee = [];
    theCanvas.matrix.vTranslate([0,300,750]);

    var wh = 1200;
    var l2= -20;
    this.background = new Quad([-wh, wh, l2],
			       [-wh,-wh, l2],
			       [ wh, wh, l2],
			       [ wh,-wh, l2])
	.setTexture(HEAVEN_TEXTURE)
	.setShader(theCanvas.gl.shader_canvas);

    for(var i=-11; i<=10; ++i) {
	var w_ = floor_width, h_ = -3 * floor_width, l_ = -1;
	this.floor.push(new Quad(
	    [-w_,  0, l_],
	    [-w_, h_, l_],
	    [ w_,  0, l_],
	    [ w_, h_, l_])
			.translate([i * 2 * w_, 0, 40])
			.setTexture(RUG_TEXTURE)
			.add2DCoords());
	this.three_dee.push(new SixSidedPrism(
	    [-w_,  0, l_],
	    [-w_, h_, l_],
	    [ w_, h_, l_],
	    [ w_,  0, l_],
	    [-w_,  0, l_ - floor_width],
	    [-w_, h_, l_ - floor_width],
	    [ w_, h_, l_ - floor_width],
	    [ w_,  0, l_ - floor_width])
			.translate([i * 2.0 * w_, 0, 40])
			.setTexture(RUG_TEXTURE));
	if(i === -11) { this.floor[0].translate([-12 * w_, 0, 0]).add2DCoords();
			this.three_dee[0].translate([-12 * w_, 0, 0]); }
    }

    var w = floor_width;
    var h = floor_width;
    l = -1;
    var v = 3 * h;
    var d = 12 * this.grid;
    this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	.setTexture(BRICK_TEXTURE).add2DCoords());
    this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	.setTexture(BRICK_TEXTURE).add2DCoords());
    v += 1 * this.grid;
    d += 2 * this.grid;
    this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	.setTexture(BRICK_TEXTURE).add2DCoords());
    this.push_button[1].magical = true;
    d += 2 * this.grid;
    v += 1 * this.grid;
    this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	.setTexture(BRICK_TEXTURE).add2DCoords());
    d += 2 * this.grid;
    v += 1 * this.grid;
    this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	.setTexture(BRICK_TEXTURE).add2DCoords());
    d += 2 * this.grid;
    v += 1 * this.grid;
    this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	.setTexture(BRICK_TEXTURE).add2DCoords());

    w /= 2;
    d += w;
    for(var j = 5; j < 16; ++j) {
	d += 2 * this.grid;
	this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	    .setTexture(BRICK_TEXTURE).add2DCoords());
    }
    v -= 2*w;
    d += 4 * this.grid;
    for(var j = 16; j < 19; ++j) {
	d -= 2 * this.grid;
	this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	    .setTexture(BRICK_TEXTURE).add2DCoords());
    }
    v += 2*w;
    d -= 4 * this.grid;
    for(var j = 19; j < 22; ++j) {
	d += 2 * this.grid;
	this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	    .setTexture(BRICK_TEXTURE).add2DCoords());
    }
    v -= 2*w;
    d += 4 * this.grid;
    for(var j = 22; j < 25; ++j) {
	d -= 2 * this.grid;
	this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	    .setTexture(BRICK_TEXTURE).add2DCoords());
    }
    v += 2*w;
    d -= 4 * this.grid;
    for(var j = 25; j < 28; ++j) {
	d += 2 * this.grid;
	this.push_button.push(new Quad([d-w,h+v,l],[d-w,v,l],[d+w,h+v,l],[d+w,v,l])
	    .setTexture(BRICK_TEXTURE).add2DCoords());
    }

    this.initBuffers = function(gl_) {
	
	this.mapKeys(); 

	GLobject.draw_optimized = true;

	// Basically in our game, we know this stuff only
	// ever gets called in certain patterns.
	theCanvas.changeShader(gl_.shader);
	theMatrix.setViewUniforms(gl_.shader);
	gl_.uniformMatrix4fv(gl_.shader.unis["pMatU"], false, theMatrix.pMatrix);
	theCanvas.changeShader(gl_.shader_canvas);
	theMatrix.setViewUniforms(gl_.shader_canvas);
	gl_.uniformMatrix4fv(gl_.shader_canvas.unis["pMatU"], false, theMatrix.pMatrix);

	player.initBuffers(gl_);
	this.background.initBuffers(gl_);

	for(i = 0; i < this.floor.length; ++i){
	    this.floor[i].initBuffers(gl_);
	}
	for(i = 0; i < this.push_button.length; ++i){
	    this.push_button[i].initBuffers(gl_);
	}
	for(i = 0; i < this.three_dee.length; ++i){
	    this.three_dee[i].initBuffers(gl_);
	}
    };

    this.draw = function(gl_) {

	if (audio.analyze() === true) this.hi_hat = 11;
	else if (this.hi_hat > 0) this.hi_hat -= 1;

	// Analyse movement, which draws upon sound, and activated moves.
	this.updateMovement();

	// The draw calls themself. Heavily optimize here by manually loading
	// matrices and setting shaders. This reduces redundant calls
	// to shader progs.

	//    this.player : gl_.shader_player
	//    this.background : gl_.shader_canvas
	//    this.floor : gl_.shader

	theCanvas.changeShader(gl_.shader);
	theMatrix.setViewUniforms(gl_.shader);
	var unis = gl_.shader.unis;
	gl_.uniform1f(unis["hi_hat_u"], this.hi_hat);
	gl_.uniform1f(unis["wall_hit_u"], this.floor_effect);
	gl_.uniform3fv(unis["lightPosU"], [200, 200, -400]);
	gl_.uniform1i(unis["sampler1"], gl_.tex_enum[BRICK_NORMAL_TEXTURE]);

	for(i = 0; i < this.floor.length; ++i){
	    this.floor[i].draw(gl_);
	}

	for(i = 0; i < this.push_button.length; ++i){
	    this.push_button[i].draw(gl_);
	}

	for(i = 0; i < this.three_dee.length; ++i){
	    this.three_dee[i].draw(gl_);
	}

	player.draw(gl_, this.hi_hat);

	theMatrix.push();
	theMatrix.translate(this.bg_movement);

	theCanvas.changeShader(gl_.shader_canvas);
	theMatrix.setVertexUniforms(gl_.shader_canvas);
	gl_.uniform1i(gl_.shader_canvas.unis["sampler1"], gl_.tex_enum[HEAVEN_NORMAL_TEXTURE]);

	this.background.draw(gl_);
	theMatrix.pop();

	
    };

    /**
     * Binds keys to document object.
     * This should be done as part of initialization.
     */
    this.mapKeys = function() {

	document.onkeyup = function(the_event) {

	    switch(the_event.keyCode) {
	    case 16: player.shift_key_down = false; break;
	    case 39: player.right_key_down = false; break;
	    case 37: player.left_key_down = false; break;
	    case 38: // up
		player.startJump();
		player.jump_key_down = false;
		break;
	    default:
		break;
	    }
	}

	document.onkeydown = function(the_event) {

	    switch(the_event.keyCode) {
	    case 16: // shift
		if(player.shift_key_down === true) break;
		player.shift_key_down = true;
		break;
	    case 39: // right
		if(player.right_key_down === true) break;
		player.right_key_down = true;
		player.startRightMove();
		break;
	    case 37: // left
		if(player.left_key_down === true) break;
		player.left_key_down = true;
		player.startLeftMove();
		break;
	    case 38: // up
		if(player.jump_key_down === true) break;
		player.jump_key_down = true;
		player.startJump();
		break;
	    case 40: // down
		audio.log_music = !(audio.log_music);
		break;
	    case 32: // Spacebar
		audio.pause();
		break;
	    default:
		break;
	    }
	};
    };

    this.startCameraLeftMove = function() {

	if (this.cam_in_left_move === true || this.cam_in_right_move === true) return;
	this.cam_movement[0] -= (15 * this.grid);
	this.cam_left_count = 30;
	this.cam_in_left_move = true;
    };

    this.startCameraRightMove = function() {

	if (this.cam_in_right_move === true || this.cam_in_left_move === true) return;
	this.cam_movement[0] += (15 * this.grid);
	this.cam_right_count = 30;
	this.cam_in_right_move = true;
    };
    var triggered = false;
    this.updateMovement = function() {

	var x_ = player.xPos();
	// TODO: restore functionality to these functions
	if(player.xPos() < this.cam_movement[0] - 400) this.startCameraLeftMove();
	else if(player.xPos() > this.cam_movement[0] + 400) this.startCameraRightMove();

	// Handle camera natively as it doesn't need much logic.
	if (this.cam_in_right_move === true) {
	    if ((--this.cam_right_count) < 0) this.cam_in_right_move = false;
	    else theMatrix.vTranslate([this.grid * 0.5, 0, 0]);
	}
	if (this.cam_in_left_move === true) {
	    if ((--this.cam_left_count) < 0) this.cam_in_left_move = false;
	    else theMatrix.vTranslate([-this.grid * 0.5, 0, 0]);
	}

	player.updateMovement(this.hi_hat === 10, audio.playSound);

	// Collision. How far should we go to be on grid?
	var i;
	var length1 = this.floor.length;

	for(i = length1 + this.push_button.length - 1; i >= 0; --i) { 

	    var object = (i < length1)? this.floor[i]: this.push_button[i - length1];
	    player.detectCollision(object);
	}

	player.movePostCollision();


	
	if(this.push_button[0].collided === WALL_N) {
	    if(triggered === false)     {
		audio.createAudio("music/clav_3.mp3", audio.delay, true, 0, 16);
		triggered = true;
		this.push_button[1].magical = false;
	    }
	    if (this.floor_effect !== 75) this.floor_effect ++;
	    else console.log("Max Power!");
	} else {
	    if (this.floor_effect > 0) this.floor_effect --;
	}

    };

    return this;
}


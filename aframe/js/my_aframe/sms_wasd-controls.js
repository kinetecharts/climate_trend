//var KEYCODE_TO_CODE = require('../constants').keyboardevent.KEYCODE_TO_CODE;
//var KEYCODE_TO_CODE = require('../constants').keyboardevent.KEYCODE_TO_CODE;
//var registerComponent = require('../core/component').registerComponent;
//var THREE = require('../lib/three');
//var utils = require('../utils/');

//var bind = utils.bind;
//var bind = AFRAME.utils.bind;
//var shouldCaptureKeyEvent = utils.shouldCaptureKeyEvent;

var CLAMP_VELOCITY = 0.00001;
var MAX_DELTA = 0.2;

function bind(fn, ctx) {
    return function bound() {
        return fn.apply(ctx, arguments);
    };
}

shouldCaptureKeyEvent = function (event) {
  if (event.shiftKey || event.metaKey || event.altKey || event.ctrlKey) {
    return false;
  }
  return document.activeElement === document.body;
};

/**
 * override of WASD component to control entities using WASD keys, get arrows working
 * and move in facing direction when button is pushed in cardboard.
 */
//module.exports.Component = AFRAME.registerComponent('sms_wasd-controls', {
AFRAME.registerComponent('sms_wasd-controls', {
  schema: {
    acceleration: {default: 65},
    adAxis: {default: 'x', oneOf: ['x', 'y', 'z']},
    adEnabled: {default: true},
    adInverted: {default: false},
    easing: {default: 20},
    enabled: {default: true},
    fly: {default: false},
    wsAxis: {default: 'z', oneOf: ['x', 'y', 'z']},
    wsEnabled: {default: true},
    wsInverted: {default: false}
  },

  init: function () {
    // To keep track of the pressed keys.
    this.keys = {};

    this.velocity = new THREE.Vector3();

    // Bind methods and add event listeners.
    this.onBlur = bind(this.onBlur, this);
    this.onFocus = bind(this.onFocus, this);
    this.onKeyDown = bind(this.onKeyDown, this);
    this.onKeyUp = bind(this.onKeyUp, this);
    this.onVisibilityChange = bind(this.onVisibilityChange, this);
    this.attachVisibilityEventListeners();
    
    // add mouse listeners
    //this onMouseDown = bind(this.onMouseDown, this);
    
    this.onMouseDown = bind(this.onMouseDown, this);
    this.onMouseMove = bind(this.onMouseMove, this);
    this.releaseMouse = bind(this.releaseMouse, this);
    this.onTouchStart = bind(this.onTouchStart, this);
    this.onTouchMove = bind(this.onTouchMove, this);
    this.onTouchEnd = bind(this.onTouchEnd, this);
    
    

    
  
  },
  
   tick: function (time, delta) {
    var data = this.data;
    var el = this.el;
    var movementVector;
    var position;
    var velocity = this.velocity;

    // Use seconds.
    delta = delta / 1000;

    // Get velocity.
    this.updateVelocity(delta);
    if (!velocity[data.adAxis] && !velocity[data.wsAxis]) { return; }

    // Get movement vector and translate position.
    movementVector = this.getMovementVector(delta);
    position = el.getComputedAttribute('position');
    el.setAttribute('position', {
      x: position.x + movementVector.x,
      y: position.y + movementVector.y,
      z: position.z + movementVector.z
    });
  },

  remove: function () {
    this.removeKeyEventListeners();
    this.removeVisibilityEventListeners();
  },

  play: function () {
    this.attachKeyEventListeners();
  },

  pause: function () {
    this.keys = {};
    this.removeKeyEventListeners();
  },

  updateVelocity: function (delta) {
    var acceleration;
    var adAxis;
    var adSign;
    var data = this.data;
    var keys = this.keys;
    var velocity = this.velocity;
    var wsAxis;
    var wsSign;

    adAxis = data.adAxis;
    wsAxis = data.wsAxis;

    // If FPS too low, reset velocity.
    if (delta > MAX_DELTA) {
      velocity[adAxis] = 0;
      velocity[wsAxis] = 0;
      return;
    }

    // Decay velocity.
    if (velocity[adAxis] !== 0) {
      velocity[adAxis] -= velocity[adAxis] * data.easing * delta;
    }
    if (velocity[wsAxis] !== 0) {
      velocity[wsAxis] -= velocity[wsAxis] * data.easing * delta;
    }

    // Clamp velocity easing.
    if (Math.abs(velocity[adAxis]) < CLAMP_VELOCITY) { velocity[adAxis] = 0; }
    if (Math.abs(velocity[wsAxis]) < CLAMP_VELOCITY) { velocity[wsAxis] = 0; }

    if (!data.enabled) { return; }


	//AFRAME.utils.isMobile()
	//if(AFRAME.utils.isMobile()){
	
    // Update velocity using keys pressed.
    acceleration = data.acceleration;
    if(AFRAME.utils.device.isMobile()){
	    if (data.adEnabled) {
	      adSign = data.adInverted ? -1 : 1;
	      if (keys.KeyA || keys.ArrowLeft ) { velocity[adAxis] -= adSign * acceleration * delta; }
	      if (keys.KeyD || keys.ArrowRight) { velocity[adAxis] += adSign * acceleration * delta; }
	    }
	    if (data.wsEnabled) {
	      wsSign = data.wsInverted ? -1 : 1;
	      if (keys.KeyW || keys.ArrowUp || this.touchStarted) 
	      { 
	      	velocity[wsAxis] -= wsSign * acceleration * delta; 
	      	//console.log("TRIGGER");	
	      }
	      if (keys.KeyS || keys.ArrowDown) { velocity[wsAxis] += wsSign * acceleration * delta; }
	    }
  	}
  	else{
	    if (data.adEnabled) {
	      adSign = data.adInverted ? -1 : 1;
	      if (keys.KeyA || keys.ArrowLeft) { velocity[adAxis] -= adSign * acceleration * delta; }
	      if (keys.KeyD || keys.ArrowRight) { velocity[adAxis] += adSign * acceleration * delta; }
	    }
	    if (data.wsEnabled) {
	      wsSign = data.wsInverted ? -1 : 1;
	      if (keys.KeyW || keys.ArrowUp || this.touchStarted) { 
	      	velocity[wsAxis] -= wsSign * acceleration * delta; 
	      	//console.log("TRIGGER DESK");
	      }
	      if (keys.KeyS || keys.ArrowDown) { velocity[wsAxis] += wsSign * acceleration * delta; }
	    }
  	
  	}
  },

  getMovementVector: (function () {
    var directionVector = new THREE.Vector3(0, 0, 0);
    var rotationEuler = new THREE.Euler(0, 0, 0, 'YXZ');

    return function (delta) {
      var rotation = this.el.getComputedAttribute('rotation');
      var velocity = this.velocity;

      directionVector.copy(velocity);
      directionVector.multiplyScalar(delta);

      // Absolute.
      if (!rotation) { return directionVector; }

      if (!this.data.fly) { rotation.x = 0; }

      // Transform direction relative to heading.
      rotationEuler.set(THREE.Math.degToRad(rotation.x), THREE.Math.degToRad(rotation.y), 0);
      directionVector.applyEuler(rotationEuler);
      return directionVector;
    };
  })(),

  attachVisibilityEventListeners: function () {
    window.addEventListener('blur', this.onBlur);
    window.addEventListener('focus', this.onFocus);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  },

  removeVisibilityEventListeners: function () {
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('focus', this.onFocus);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  },

  attachKeyEventListeners: function () {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    
    
    var sceneEl = this.el.sceneEl;
    var canvasEl = sceneEl.canvas;

    // listen for canvas to load.
    //if (!canvasEl) {
    //  sceneEl.addEventListener('render-target-loaded', bind(this.addEventListeners, this));
    //  return;
    //}
    // Mouse Events
    window.addEventListener('mousedown', this.onMouseDown, false );
    window.addEventListener('mousemove', this.onMouseMove, false);
    window.addEventListener('mouseup', this.releaseMouse, false);

    // Touch events
    window.addEventListener('touchstart', this.onTouchStart);
    window.addEventListener('touchmove', this.onTouchMove);
    window.addEventListener('touchend', this.onTouchEnd);
    
  },

  removeKeyEventListeners: function () {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  
  
    var sceneEl = this.el.sceneEl;
    var canvasEl = sceneEl && sceneEl.canvas;
    //if (!canvasEl) { return; }

    // Mouse Events
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.releaseMouse);
    window.removeEventListener('mouseout', this.releaseMouse);

    // Touch events
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  
  },

  onBlur: function () {
    this.pause();
  },

  onFocus: function () {
    this.play();
  },

  onVisibilityChange: function () {
    if (document.hidden) {
      this.onBlur();
    } else {
      this.onFocus();
    }
  },

  onKeyDown: function (event) {
    var code;
    if (!shouldCaptureKeyEvent(event)) { return; }
    code = event.code || KEYCODE_TO_CODE[event.keyCode];
    this.keys[code] = true;
  },

  onKeyUp: function (event) {
    var code;
    if (!shouldCaptureKeyEvent(event)) { return; }
    code = event.code || KEYCODE_TO_CODE[event.keyCode];
    this.keys[code] = false;
  },
  
   onTouchStart: function (e) {
    if (e.touches.length !== 1) { return; }
    this.touchStart = {
      x: e.touches[0].pageX,
      y: e.touches[0].pageY
    };
    this.touchStarted = true;
  },

  onTouchEnd: function () {
    this.touchStarted = false;
  },

  onMouseDown: function (event) {
    this.mouseDown = true;
    //this.previousMouseEvent = event;
    //console.log("MOUSE DOWN");
    //document.body.classList.add('a-grabbing');
  },

  onMouseMove: function (event) {    
    //console.log("MOUSE MOVE");
  },

  releaseMouse: function () {
    this.mouseDown = false;
    document.body.classList.remove('a-grabbing');
  }
});
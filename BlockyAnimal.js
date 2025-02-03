// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotationMat;
  uniform float u_Size;
  void main() {
    gl_Position = u_GlobalRotationMat * u_ModelMatrix * a_Position;
    gl_PointSize = u_Size;
  }`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`;

// global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_GlobalRotationMat;

// constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// animation variables
var g_shapesList = [];
var g_clockStart = performance.now() / 1000.0;
var g_clock = 0;
var g_bodyTrans = 0;
var g_upperAngle = 15;
var g_lowerAngle = 0;
var g_selectedColor = [1.0, 1.0, 1.0, 1.0];
var g_size = 5;
var g_selectedType = POINT;
var g_segments = 5;
var g_angle = 30;
var g_yellowAngle = 0;
var g_animation = true;
var g_upperLock = false;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addHtmlUIActions();
  
  canvas.onmousedown = handleClick;
 
  gl.clearColor(0.0, 0.0, 0.0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  renderAllShapes();
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }
  
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotationMat = gl.getUniformLocation(gl.program, 'u_GlobalRotationMat');
  if (!u_GlobalRotationMat) {
    console.log('Failed to get the storage location of u_GlobalRotationMat');
    return;
  }
}

function addHtmlUIActions() {
  document.getElementById('aniOn').onclick = function() {
    g_animation = true;
    g_clockStart = performance.now() / 1000.0;
  };
  
  document.getElementById('aniOff').onclick = function() {
    g_animation = false;
  };
  
  document.getElementById("upperSlider").addEventListener("mousemove", function() {
    g_upperLock = false;
    if(!g_animation){
      g_upperAngle = parseFloat(this.value);
    }
  });
  
  document.getElementById("lowerSlider").addEventListener("mousemove", function() { 
    if(!g_animation){
      g_lowerAngle = parseFloat(this.value);
      g_upperLock = true;
    }
  });
  
  document.getElementById("rotationSlider").addEventListener("mousemove", function() {
    g_angle = this.value;
    renderAllShapes();
  });
}

function handleClick(ev) {
  [x, y] = convertCoordinatesToGL(ev);
  
  let point;
  if(g_selectedType == POINT){
    point = new Point();
  }
  else if(g_selectedType == CIRCLE){
    point = new Circle();
  }
  else{
    point = new Triangle();
  }
  point.position = [x, y];
  point.color = g_selectedColor.slice();
  point.size = g_size;
  if(point.type == 'circle'){
    point.segments = g_segments;
  }
  g_shapesList.push(point);
  renderAllShapes();
}

function convertCoordinatesToGL(ev) {
  var x = ev.clientX; 
  var y = ev.clientY; 
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  
  return ([x, y]);
}

function tick() {
  g_clock = performance.now() / 1000.0 - g_clockStart;
  
  if (g_animation) {
    updateAnimation();
  }
  
  renderAllShapes();
  requestAnimationFrame(tick);
}

function updateAnimation() {
  g_upperAngle = 10 * Math.sin(10 * g_clock);
}

function renderAllShapes() {
  var startTime = performance.now();
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  g_shapesList = [];

  var globalRotationMat = new Matrix4().rotate(g_angle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotationMat, false, globalRotationMat.elements);

  // colors for caterpillar
  var bodyColor = [0.4, 0.8, 0.2, 1.0];
  var patternColor = [0.3, 0.6, 0.1, 1.0];
  var faceColor = [0.8, 0.5, 0.2, 1.0];

  // caterpillar body
  const numSegments = 8;
  for (let i = 0; i < numSegments; i++) {
    let yOffset = g_animation ? 0.05 * Math.sin(g_clock * 4 + i * 0.5) : 0;
    
    // body segment
    const segment = new Cube();
    segment.color = bodyColor;
    segment.matrix.translate(-0.4 + (i * 0.12), yOffset + 0.1, 0);
    if (g_animation) {
      segment.matrix.rotate(10 * Math.sin(g_clock * 4 + i * 0.5), 0, 0, 1);
    }
    segment.matrix.scale(0.1, 0.1, 0.1);
    g_shapesList.push(segment);

    // pattern on segment
    const pattern = new Cube();
    pattern.color = patternColor;
    pattern.matrix.translate(-0.4 + (i * 0.12), yOffset + 0.15, 0);
    if (g_animation) {
      pattern.matrix.rotate(10 * Math.sin(g_clock * 4 + i * 0.5), 0, 0, 1);
    }
    pattern.matrix.scale(0.04, 0.04, 0.04);
    g_shapesList.push(pattern);
  }

  // head of caterpillar
  const head = new Cube();
  head.color = faceColor;
  let headYOffset = g_animation ? 0.05 * Math.sin(g_clock * 4 - 0.5) : 0;
  head.matrix.translate(-0.4 + (-0.12), 0.1 + headYOffset, 0);
  if (g_animation) {
    head.matrix.rotate(10 * Math.sin(g_clock * 4 - 0.5), 0, 0, 1);
  }
  head.matrix.scale(0.12, 0.12, 0.12);
  g_shapesList.push(head);

  // eyes
  const leftEye = new Cube();
  leftEye.color = [0, 0, 0, 1];
  leftEye.matrix.translate(-0.53, 0.13, 0.05);
  leftEye.matrix.scale(0.02, 0.02, 0.02);
  g_shapesList.push(leftEye);

  const rightEye = new Cube();
  rightEye.color = [0, 0, 0, 1];
  rightEye.matrix.translate(-0.53, 0.13, -0.05);
  rightEye.matrix.scale(0.02, 0.02, 0.02);
  g_shapesList.push(rightEye);

  // antennae
  createCaterpillarAntenna(-0.52, 0.18, 0.03, 1, patternColor);
  createCaterpillarAntenna(-0.52, 0.18, -0.03, -1, patternColor);

  // legs
  for (let i = 0; i < numSegments; i++) {
    let yOffset = g_animation ? 0.05 * Math.sin(g_clock * 4 + i * 0.5) : 0;
    
    // left leg
    const leftLeg = new Cube();
    leftLeg.color = bodyColor;
    leftLeg.matrix.translate(-0.4 + (i * 0.12), yOffset + 0.05, 0.06);
    if (g_animation) {
      leftLeg.matrix.rotate(20 * Math.sin(g_clock * 8 + i * 0.5), 1, 0, 0);
    }
    leftLeg.matrix.scale(0.02, 0.06, 0.02);
    g_shapesList.push(leftLeg);

    // right leg
    const rightLeg = new Cube();
    rightLeg.color = bodyColor;
    rightLeg.matrix.translate(-0.4 + (i * 0.12), yOffset + 0.05, -0.06);
    if (g_animation) {
      rightLeg.matrix.rotate(20 * Math.sin(g_clock * 8 + i * 0.5 + Math.PI), 1, 0, 0);
    }
    rightLeg.matrix.scale(0.02, 0.06, 0.02);
    g_shapesList.push(rightLeg);
  }

  // render everything
  var len = g_shapesList.length;
  for (var i = 0; i < len; i++) {
    g_shapesList[i].render();
  }

  var duration = performance.now() - startTime;
  sendTextToHTML(" ms: " + Math.floor(duration) + " fps " + Math.floor(10000 / duration) / 10, "numdot");
}

function createCaterpillarAntenna(xOffset, yOffset, zOffset, side, color) {
  // base antenna
  const base = new Cube();
  base.color = color;
  base.matrix.translate(xOffset, yOffset, zOffset);
  if (g_animation) {
    base.matrix.rotate(side * (30 + 10 * Math.sin(g_clock * 3)), 0, 0, 1);
  } else {
    base.matrix.rotate(side * 30, 0, 0, 1);
  }
  base.matrix.scale(0.01, 0.08, 0.01);
  g_shapesList.push(base);

  // tip antenna
  const tip = new Cube();
  tip.color = color;
  tip.matrix = new Matrix4(base.matrix);
  tip.matrix.translate(0, 1, 0);
  tip.matrix.scale(2, 0.1, 2);
  g_shapesList.push(tip);
}

function sendTextToHTML(text, htmlID) {
  const htmlElm = document.getElementById(htmlID);
  if (htmlElm) {
    htmlElm.innerHTML = text;
  }
}
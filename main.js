/// -------------------------------------------------------------/// setup 
window.focus();
let world; 
let camera;
let scene;
let renderer; 
let prev;
let stack; 
let overhangs; 
let computer;
let end;
let difficulty; 
let boxHeight = 1.5; 
let boxInitHeight = 5; 
let score = document.getElementById("score");
let instruct = document.getElementById("instructions");
let outcome = document.getElementById("results");
const skyBox = new THREE.Color('skyblue');
init();




/// -------------------------------------------------------------/// Event Listeners for game start and resize
window.addEventListener("resize", () => {
  console.log("resize", window.innerWidth, window.innerHeight);
  const aspectect = window.innerWidth / window.innerHeight;
  const width = 10;
  const height = width / aspectect;
  camera.top = height / 3;
  camera.bottom = height / -3;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});

window.addEventListener("onClick", eventHandler);
window.addEventListener("touchstart", eventHandler);
window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    eventHandler();
    return;
  }
  if (event.key == "S" || event.key == "s") {
    event.preventDefault();
    startGame();
    return;
  }
});

/// -------------------------------------------------------------///

function setdifficulty() {
  difficulty = Math.random() * 1 - 0.5;
}

function init() { 
  computer = true; // computer starts game
  end = false;
  prev = 0;
  stack = [];
  overhangs = [];
  setdifficulty();
  world = new CANNON.World();
  world.gravity.set(0, -30, 0); 
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;


// -- camera -- //
  let aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(  // -- far away tilt allows whole tower to be seen
    100, 
    aspect, 
    1, 
    500 
  );
  camera.position.set(4, 4, 4);
  camera.lookAt(0, 0, 0);
  scene = new THREE.Scene();


  const density = 0.12;
  scene.fog = new THREE.FogExp2(skyBox, density); //-- fog
  scene.background = skyBox;                      //--background
  addBase(0, 0, 1000, 1000);                      // base-layer
  addSegment(-10, 0, boxInitHeight, boxInitHeight, "x");
  

  // -- scene lighting -- //
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); 
  scene.add(ambientLight);
  // const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
  // dirLight.position.set(10, 20, 0);
  // scene.add(dirLight);
  const light = new THREE.HemisphereLight(0xffffff, .01);
  scene.add(light);
  const light1 = new THREE.PointLight(0xffffff);
  light.position.set(0, 250, 0);
  scene.add(light1);
  



  renderer = new THREE.WebGLRenderer({ antialias: true }); // init renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animation);  
  document.body.appendChild(renderer.domElement);
  
}

function startGame() { //player starts game
  computer = false;
  end = false;
  prev = 0;
  stack = [];
  overhangs = [];
  if (instruct) instruct.style.display = "none";
  if (outcome) outcome.style.display = "none";
  if (score) score.innerText = 0;
  if (world) {
    while (world.bodies.length > 0) {
      world.remove(world.bodies[0]);
    }
  }
  if (scene) {
    while (scene.children.find((c) => c.type == "Mesh")) {
      const mesh = scene.children.find((c) => c.type == "Mesh");
      scene.remove(mesh);
    }
    addBase(0, 0, 1000, 1000);
    addSegment(-10, 0, boxInitHeight, boxInitHeight, "x");
  }
  if (camera) {
    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);
  }
}

/// -------------------------------------------------------------/// BASE LEVEL

function generateBase(x, y, z, width, depth, falls) {

  const geometry = new THREE.BoxGeometry(width, boxHeight, depth); //three.js
  const color = new THREE.Color(``);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box( //cannon.js
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
  );
  let mass = falls ? 5 : 0;
  mass *= width / boxInitHeight; 
  mass *= depth / boxInitHeight; 
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);
  return {
    threejs: mesh,
    cannonjs: body, // - cannon js shape must be returned as well else falling boxes don't catch on geometry
    width,
    depth
  };
}

function addBase(x, z, width, depth, direction) {
  const y = boxHeight * stack.length; 
  const layer = generateBase(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
}
/// -------------------------------------------------------------/// TOWER SEGMENTS

function generateSegment(x, y, z, width, depth, falls) {

  const geometry = new THREE.BoxGeometry(width, boxHeight, depth); //three.js
  const color = new THREE.Color(`hsl(${330 + stack.length * 20}, 84%, 80%)`);
  const material = new THREE.MeshLambertMaterial({ color } );
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  scene.add(mesh);

  const shape = new CANNON.Box( //cannon.js
    new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
  );
  let mass = falls ? 5 : 0;
  mass *= width / boxInitHeight; 
  mass *= depth / boxInitHeight; 
  const body = new CANNON.Body({ mass, shape });
  body.position.set(x, y, z);
  world.addBody(body);
  return {
    threejs: mesh,
    cannonjs: body,
    width,
    depth
  };
}
function addSegment(x, z, width, depth, direction) {
  const y = boxHeight * stack.length;
  const layer = generateSegment(x, y, z, width, depth, false);
  layer.direction = direction;
  stack.push(layer);
}
function overhang(x, z, width, depth) {
  const y = boxHeight * (stack.length - 1); 
  const overhang = generateSegment(x, y, z, width, depth, true);
  overhangs.push(overhang);
}



const geo = new THREE.PlaneBufferGeometry(1000, 1000, 80, 80);
const mat = new THREE.MeshBasicMaterial({ color: 0x2b5329, side: THREE.DoubleSide });
const plane = new THREE.Mesh(geo, mat);
plane.rotateX( - Math.PI / 2)
scene.add(plane);



/// -------------------------------------------------------------/// cut and split logic

function cut(activeSegment, overlap, size, delta) {
  const direction = activeSegment.direction;
  const newWidth = direction == "x" ? overlap : activeSegment.width;
  const newDepth = direction == "z" ? overlap : activeSegment.depth;
  activeSegment.width = newWidth;
  activeSegment.depth = newDepth;
  activeSegment.threejs.scale[direction] = overlap / size;
  activeSegment.threejs.position[direction] -= delta / 2;
  activeSegment.cannonjs.position[direction] -= delta / 2;
  const shape = new CANNON.Box(
    new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
  );
  activeSegment.cannonjs.shapes = [];
  activeSegment.cannonjs.addShape(shape);
}

function eventHandler() {
  if (computer) startGame();
  else split();
}
function split() {
  if (end) return;
  const activeSegment = stack[stack.length - 1];
  const prevLayer = stack[stack.length - 2];
  const direction = activeSegment.direction;
  const size = direction == "x" ? activeSegment.width : activeSegment.depth;
  const delta =
    activeSegment.threejs.position[direction] -
    prevLayer.threejs.position[direction];
  const overhangSize = Math.abs(delta);
  const overlap = size - overhangSize;
  if (overlap > 0) {
    cut(activeSegment, overlap, size, delta);
    const overhangShift = (overlap / 2 + overhangSize / 2) * Math.sign(delta);
    const overhangX =
      direction == "x"
        ? activeSegment.threejs.position.x + overhangShift
        : activeSegment.threejs.position.x;
    const overhangZ =
      direction == "z"
        ? activeSegment.threejs.position.z + overhangShift
        : activeSegment.threejs.position.z;
    const overhangWidth = direction == "x" ? overhangSize : activeSegment.width;
    const overhangDepth = direction == "z" ? overhangSize : activeSegment.depth;

    overhang(overhangX, overhangZ, overhangWidth, overhangDepth);
    const nextX = direction == "x" ? activeSegment.threejs.position.x : -10;
    const nextZ = direction == "z" ? activeSegment.threejs.position.z : -10;
    const newWidth = activeSegment.width; 
    const newDepth = activeSegment.depth; 
    const nextDirection = direction == "x" ? "z" : "x";

    if (score) score.innerText = stack.length - 1;
    addSegment(nextX, nextZ, newWidth, newDepth, nextDirection);
  } else {
    miss();
  }
}
function miss() {
  const activeSegment = stack[stack.length - 1];
  overhang(
    activeSegment.threejs.position.x,
    activeSegment.threejs.position.z,
    activeSegment.width,
    activeSegment.depth
  );
  world.remove(activeSegment.cannonjs);
  scene.remove(activeSegment.threejs);
  end = true;
  if (outcome && !computer) outcome.style.display = "flex";
}


/// -------------------------------------------------------------/// flying in animation logic

function animation(time) {
  if (prev) {
    const totalTime = time - prev;
    const speed = 0.008;                              // fly speed
    const activeSegment = stack[stack.length - 1];
    const prevLayer = stack[stack.length - 2];
    const boxShouldMove =
      !end &&
      (!computer ||
        (computer &&
          activeSegment.threejs.position[activeSegment.direction] <
          prevLayer.threejs.position[activeSegment.direction] +
          difficulty));
    if (boxShouldMove) {
      activeSegment.threejs.position[activeSegment.direction] += speed * totalTime;
      activeSegment.cannonjs.position[activeSegment.direction] += speed * totalTime;
      if (activeSegment.threejs.position[activeSegment.direction] > 10) {
        miss();
      }
    } else {
      if (computer) {
        split();
        setdifficulty();
      }
    }

    if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
      camera.position.y += speed * totalTime;
    }
    physics(totalTime);
    renderer.render(scene, camera);
  }
  prev = time;
}
function physics(totalTime) {
  world.step(totalTime / 1000);
  overhangs.forEach((element) => {
    element.threejs.position.copy(element.cannonjs.position);
    element.threejs.quaternion.copy(element.cannonjs.quaternion);
  });
}



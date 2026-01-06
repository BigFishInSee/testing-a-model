
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.129.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.129.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";

//Skypack broke right before submission. thanks skypack!
//import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
//import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
//import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";


let controlsTargetPos = null;

let panelOpen = false;

const modelToLoad = "Untitled"

const parts = {};
const presetCameras = {};
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let isMouseDown = false;

const originalMaterials = new Map();


let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

const panel = document.getElementById("infoPanel");
panel.style.display = "none"; 

const closeBtn = panel.querySelector(".close-btn");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalImage = document.getElementById("modalImage");


let object;

let controls;

let cameraTargetPos = null;
let cameraTargetQuat = null;



const DIM_COLOR = new THREE.Color(0x555555);
const HIGHLIGHT_COLOR = new THREE.Color(0x6fa8dc);
function resetMaterials() {
  Object.values(parts).forEach(mesh => {
    mesh.material = mesh.userData.originalMaterial.clone();
    mesh.material.transparent = false;
    mesh.material.opacity = 1;
  });
}

function focusOnPart(targetName) {
  Object.entries(parts).forEach(([name, mesh]) => {
    const mat = mesh.userData.originalMaterial.clone();

    if (name === targetName) { 
      mat.color = HIGHLIGHT_COLOR.clone(); 
      mat.emissive = HIGHLIGHT_COLOR.clone().multiplyScalar(0.4); 
      mat.emissiveIntensity = 0.6; 
      mat.transparent = false; 
      mat.opacity = 1; 
    } 
    else { 
      mat.color = DIM_COLOR.clone(); 
      mat.transparent = true; 
      mat.opacity = 0.15; 
    }

    mesh.material = mat;
  });
}


//settings
const cameraFocusMap = {
  SOLAR_PANEL_CAM: "SOLAR_PANEL",
  ION_BEAM_CAM: "ION_BEAM",
  FRAME_CAM: "FRAME",
  GYRO_CAM: "GYRO",
  ALTITUTE_SYSTEM_CAM: "ALTITUTE_SYSTEM",
  BATTERY_CAM:"BATTERY",
  FLIGHT_COMP_CAM: "FLIGHT_COMP",
  FOV_CAM: "FOV",
  FUEL_CAM: "FUEL",
  GNSS_CAM: "GNSS",
  IMU_CAM: "IMU",
  LIDAR_CAM: "LIDAR",
  PILASMA_CAM: "PILASMA",
  RADIO_CAM: "RADIO",
  STAR_TRACKER_CAM: "STAR_TRACKER",
  SUN_SENSOR_CAM: "SUN_SENSOR"
};


const CAMERA_LERP_SPEED = 0.09; 








let objToRender = 'Untitled';

const loader = new GLTFLoader();
const loadingScreen = document.getElementById("loadingScreen");
const loadingBar = document.getElementById("loadingBar");

loader.load(
  'Untitled.glb',

  //N LOAD
  function (gltf) {
    object = gltf.scene;
    scene.add(object);

    object.traverse((child) => {
    if (child.isMesh) {
      // Store original material ON the mesh itself
      child.userData.originalMaterial = child.material.clone();

      child.material = child.material.clone();
      child.material.needsUpdate = true;

      parts[child.name] = child;
    }

    if (child.isCamera) {
      presetCameras[child.name] = child;
    }
  });



    //hide 
    loadingScreen.style.opacity = "0";
    loadingScreen.style.pointerEvents = "none";

    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 500);
  },

  //PROGRESS
  function (xhr) {
    if (xhr.lengthComputable) {
      const percent = (xhr.loaded / xhr.total) * 100;
      loadingBar.style.width = percent + "%";
    }
  },

  //ERROR
  function (error) {
    console.error("GLTF load error:", error);
  }
);

function snapToPresetCamera(cameraName) {
  const preset = presetCameras[cameraName];
  if (!preset) return;

  cameraTargetPos = preset.getWorldPosition(new THREE.Vector3());
  cameraTargetQuat = preset.getWorldQuaternion(new THREE.Quaternion());

  const forward = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(cameraTargetQuat);

  controlsTargetPos = cameraTargetPos.clone().add(
    forward.multiplyScalar(10)
  );

  controls.enabled = false;

}


function blurAllExcept(partName) {
  Object.values(parts).forEach(mesh => {
    if (mesh.name === partName) {
      // focused part
      mesh.material.opacity = 1;
      mesh.material.color.set(0xffffff);
      mesh.material.roughness = 0.3;
      mesh.material.metalness = 0.6;
    } else {
      // blurred parts
      mesh.material.opacity = 0.15;
      mesh.material.color.set(0x555555);
      mesh.material.roughness = 1;
      mesh.material.metalness = 0;
    }
  });
}

function resetAllParts() {
  Object.entries(parts).forEach(([name, mesh]) => {
    const original = originalMaterials.get(mesh);
    if (original) {
      mesh.material.copy(original);
      mesh.material.transparent = true;
    }
  });
}

const renderer = new THREE.WebGLRenderer({ alpha: true }); 
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

document.getElementById("container3D").appendChild(renderer.domElement);

camera.position.z = objToRender === "Untitled" ? 25 : 500;

const topLight = new THREE.DirectionalLight(0xffffff, 1); 
topLight.position.set(500, 500, 500) 
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);





if (objToRender === "Untitled") {
  controls = new OrbitControls(camera, renderer.domElement);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


function animate() {
  
  requestAnimationFrame(animate);

  if (object && objToRender === "Untitled") {
    object.rotation.y = -3 + mouseX / window.innerWidth * 3;
    object.rotation.x = -1.2 + mouseY * 2.5 / window.innerHeight;
  }

 if (cameraTargetPos && cameraTargetQuat) {
  camera.position.lerp(cameraTargetPos, CAMERA_LERP_SPEED);
  camera.quaternion.slerp(cameraTargetQuat, CAMERA_LERP_SPEED);

  if (controlsTargetPos) {
    controls.target.lerp(controlsTargetPos, CAMERA_LERP_SPEED);
  }

  controls.update();

  const posDone =
    camera.position.distanceTo(cameraTargetPos) < 0.01;

  const rotDone =
    1 - camera.quaternion.dot(cameraTargetQuat) < 0.001;

  const targetDone =
    !controlsTargetPos ||
    controls.target.distanceTo(controlsTargetPos) < 0.01;

  if (posDone && rotDone && targetDone) {
    cameraTargetPos = null;
    cameraTargetQuat = null;
    controlsTargetPos = null;

    controls.enabled = true;

  }
}

  renderer.render(scene, camera);
}

window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});



document.querySelectorAll("#ui button").forEach(button => {
  button.addEventListener("click", async () => {
    const camName = button.dataset.camera;
    snapToPresetCamera(camName);

    // RESET
    if (button.textContent.includes("RESET")) {
      resetMaterials();
      panel.style.display = "none";
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // FOCUS
    const partName = cameraFocusMap[camName];
    if (partName) {
      focusOnPart(partName);
    }

    // INFO PANEL
    if (button.dataset.title) {
      modalTitle.textContent = button.dataset.title;
      modalText.innerHTML = button.dataset.text;
      modalImage.src = button.dataset.image;

      panelOpen = true;
      panel.style.display = "block";

      await sleep(500);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          panel.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }
  });
});

closeBtn.addEventListener("click", () => {
  panelOpen = false;

  window.scrollTo({ top: 0, behavior: "smooth" });

  setTimeout(() => {
    if (!panelOpen) {
      panel.style.display = "none";
    }
  }, 600);
});
document.getElementById("resetCameraBtn").addEventListener("click", () => {
  resetMaterials();
  snapToPresetCamera("ION_BEAM_CAM");

  panelOpen = false;
  panel.style.display = "none";

  window.scrollTo({ top: 0, behavior: "smooth" });
});

document.addEventListener("mouseup", (e) => {
  if (e.button === 0) {
    isMouseDown = false;
  }
});
document.addEventListener("mouseleave", () => {
  isMouseDown = false;
});
document.addEventListener("mousemove", (e) => {
  if (!isMouseDown) return;

  mouseX = e.clientX;
  mouseY = e.clientY;
});


//Start the 3D rendering
animate();









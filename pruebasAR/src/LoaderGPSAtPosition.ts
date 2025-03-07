//import * as THREE from 'three';
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import * as THREEx from './node_modules/@ar-js-org/ar.js/three.js/build/ar-threex-location-only.js';
import {
  GetPrizesAround, GetPrizesGS, CapturePrizeAround, CapturePrizeGS, Brand, ListPrizesAr,
  Prizes, DetailsEvent, PrizesAndPoints
} from './http-service.js';
import { AbsoluteDeviceOrientationControls } from './DeviceOrientaion.jsx';

//global variables
let firstSetup = true, firstGPSCall = true;
const companyId = new URLSearchParams(window.location.search).get('placeId') || '0';
const placeType = new URLSearchParams(window.location.search).get('placeType') || 'company';
const uid = new URLSearchParams(window.location.search).get('userId') || '0';
let isAround = new URLSearchParams(window.location.search).get('isAround') === 'true';
if (uid === '0' || companyId === '0') {
  isAround = true;
}
let brand: Brand | null = null;
let prizesAndPoints: PrizesAndPoints[] = [];
let detailsEvent: DetailsEvent[] | null = [];
let list_prizes_ar: ListPrizesAr[] = [];
let interactObjects = [] as THREE.Object3D[];
let totalPointsFromCurrentEvent = 0;
let tutorialNumber = 1;
let totalCapturePrizesOnCurrentSession = 0;
let raycastEnabled = false;
const spriteCompass = document.getElementById('compassChild') as HTMLImageElement;
const pointText = document.getElementById('Points') as HTMLSpanElement;
const ExplorerCanvas = document.getElementsByClassName('Explorer')[0] as HTMLElement;
const PrizeListCanvas = document.getElementsByClassName('PrizeList')[0] as HTMLElement;
const TutorialCanvas = document.getElementsByClassName('StartingTutorials')[0] as HTMLElement;
const PrizeCaptureResumeCanvas = document.getElementsByClassName('PrizeCaptureResume')[0] as HTMLElement;
const FinalScoreCanvas = document.getElementsByClassName('FinalScore')[0] as HTMLElement;
const GameOverCanvas = document.getElementsByClassName('GameOver')[0] as HTMLElement;
const inputPrizeList = document.getElementById('btnPrizeList');
const inputReturnToExplorer = document.getElementById('btnReturnToExplorer');
const aceptPrize = document.getElementById('btnAceptPrize');
const BtnNextTutorial = document.getElementById('BtnNextTutorial');
const FinalScorePoints = document.getElementById('FinalScorePoints');
const BtnExitFinalScore = document.getElementById('BtnExitFinalScore');
const ShowPrizeListGameOver = document.getElementById('ShowPrizeListGameOver');
const title_prizeCaptured = document.getElementById('title_prizeCaptured');
const title_captured_prizeCaptured = document.getElementById('title_captured_prizeCaptured');
const FinalPrizeCaptureAmountCurrentSession = document.getElementById('FinalPrizeCaptureAmountCurrentSession');
//#region ThreeJS setup
const canvas = document.getElementById('Canvas') as HTMLCanvasElement;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
const arjs = new THREEx.LocationBased(scene, camera); //this is our new scene
const cam = new THREEx.WebcamRenderer(renderer);
const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
const loader = new THREE.GLTFLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let DeviceOrientation = new AbsoluteDeviceOrientationControls(camera);
const isIOS = navigator.userAgent.match(/iPhone|iPad|iPod/i)
//#endregion

function Start() {

  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach(async (name) => {
        await caches.delete(name)
      })
    })
  }

  const FakeUserCanvas = document.getElementsByClassName('FakeUser')[0] as HTMLElement;

  if (uid === '0' || companyId === '0') {
    FakeUserCanvas.style.display = 'block';
  }
  else {
    TutorialCanvas.style.display = 'block';
  }

  inputPrizeList.addEventListener('click', () => {
    ExplorerCanvas.style.display = 'none';
    PrizeListCanvas.style.display = 'block';
    document.getElementById('rewardList').style.display = 'flex';
  });

  inputReturnToExplorer.addEventListener('click', () => {
    ExplorerCanvas.style.display = 'block';
    PrizeListCanvas.style.display = 'none';
    document.getElementById('rewardList').style.display = 'none';
    interactObjects.forEach((obj) => {
      obj.visible = true;
    });
  });

  ShowPrizeListGameOver.addEventListener('click', () => {
    GameOverCanvas.style.display = 'none';
    PrizeListCanvas.style.display = 'block';
    document.getElementById('rewardList').style.display = 'flex';
    inputReturnToExplorer.removeEventListener('click', () => { });
    inputReturnToExplorer.style.display = 'none';
  });

  aceptPrize.addEventListener('click', () => {
    const finalPrize = CheckMaxPrizesCapture();
    if (finalPrize) {
      return;
    }
    AcceptPrize();
  });

  BtnNextTutorial.addEventListener('click', () => {
    ChangeTutorialScreen();
    StartGPS();
  });

  document.getElementById('StartFakeUser').addEventListener('click', () => {
    FakeUserCanvas.style.display = 'none';
    TutorialCanvas.style.display = 'block';
    StartGPS();
  });

  window.addEventListener('camera-rotation-change', (event) => {
    if (isIOS) {
      spriteCompass.style.transform = `rotate(${event.detail.WebkitCompassHeading}deg)`;
    } else {
      spriteCompass.style.transform = `rotate(${-DeviceOrientation.deviceOrientation.alpha}deg)`;
    }
  });
}
Start();

function ChangeTutorialScreen() {
  const currentTutorial = document.getElementsByClassName('tutorial' + tutorialNumber)[0] as HTMLElement;
  const nextTutorial = document.getElementsByClassName('tutorial' + (tutorialNumber + 1))[0] as HTMLElement;
  if (currentTutorial == undefined || nextTutorial == undefined) {
    ExplorerCanvas.style.display = 'block';
    PrizeListCanvas.style.display = 'none';
    TutorialCanvas.style.display = 'none';
    raycastEnabled = true;
    DeviceOrientation.connect();
    interactObjects.forEach((obj) => {
      obj.visible = true;
    });
    return;
  }

  currentTutorial.style.display = 'none';
  nextTutorial.style.display = 'block';
  tutorialNumber++;
}

function StartGPS() {
  if (!firstGPSCall) return;
  firstGPSCall = false;

  if (navigator.geolocation) {
    BtnNextTutorial.style.display = 'none';
    document.getElementById('loadingGPS').style.display = 'block';
    
    if(window.location.hostname === "localhost")
      arjs.fakeGps(-0.72, 51.05);
    else
      arjs.startGps();
  }
}

function AcceptPrize() {
  PrizeCaptureResumeCanvas.style.display = 'none';
  ExplorerCanvas.style.display = 'block';
  raycastEnabled = true;
}

//#region ARJS setup

arjs.on('gpsupdate', function (event) {
  if (firstSetup) {
    firstSetup = false;

    BtnNextTutorial.style.display = 'block';
    document.getElementById('loadingGPS').style.display = 'none';

    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost || uid === '0' || companyId === '0') {
      GetPrizesByWSFake(event);
    } else {
      GetPrizesByWS(event);
      return null;
    }
  }
});

function GetPrizesByWS(event) {
  let prizesPromise: Promise<Prizes>;
  if (isAround) {
    prizesPromise = GetPrizesAround(uid, companyId, isAround);
  } else {
    prizesPromise = GetPrizesGS(uid, companyId, isAround);
  }

  prizesPromise.then(prizes => {
    if (isAround)
      list_prizes_ar = prizes.list_prizes_ar;
    else
      list_prizes_ar = prizes.list_prizes_ar_gs;

    detailsEvent = prizes.detailsEvent;
    prizesAndPoints = prizes.prizesAndPoints;
    brand = prizes.brand;

    if (list_prizes_ar.length === 0) {
      GameOverCanvas.style.display = 'block';
      TutorialCanvas.style.display = 'none';
      return;
    }

    if (!isAround)
      camera.far = list_prizes_ar[0].radio;

    //get total amount of prizes capture from the same event_uuid
    const totalPrizesCapture = prizesAndPoints.filter(prize => prize.idEvent === detailsEvent[0].idEvent).length;
    //add rewards to the list
    let totalPointAllEvents: number = 0;
    prizesAndPoints.forEach(prize => {
      addRewardItem("img/icon_trophy.svg", prize.nombrePremio, prize.mensajePremio, prize.fechaCapturadoPremio, prize.puntosPremio);
      totalPointAllEvents += prize.puntosPremio;
    });

    document.getElementById('GameOverTotalPoints').innerText = `+${totalPointAllEvents}`;

    if (
      totalPrizesCapture >= detailsEvent[0].prizeLimit
    ) {
      TutorialCanvas.style.display = 'none';
      GameOverCanvas.style.display = 'block';
      return;
    }

    document.getElementById('event_name').innerText = detailsEvent[0].descriptionEvent;

    //get total points from the same event_uuid
    totalPointsFromCurrentEvent = prizesAndPoints.filter(prize => prize.idEvent === detailsEvent[0].idEvent).reduce((acc, prize) => acc + prize.puntosPremio, 0);

    document.getElementById('GSName').innerText = brand?.name || '';
    document.getElementById('LogoGS').setAttribute('src', brand?.logo || '');
    document.getElementById('logoGSRewardScreen').setAttribute('src', brand?.logo || '');

    list_prizes_ar.forEach(individualPrize => {
      LoadAndInstanceARObjects(event.coords, individualPrize);
    });
    document.getElementById('maxPrizeCapture').innerText = `${list_prizes_ar.length} objetos en total para cazar. ¡Suerte!`;
    document.getElementById('maxPrizeCaptureSmall').innerText = `${list_prizes_ar.length}`;
  })
    .catch(error => {
      console.error('Error fetching prizes:', error);
    });
}

function GetPrizesByWSFake(event) {
  fetch('src/response.json')
    .then(response => {
      if (!response.ok) {
        console.log('Network response was not ok');
      }
      return response.json();
    })
    .then(prizes => {
      list_prizes_ar = prizes.data.list_prizes_ar;
      detailsEvent = prizes.data.detailsEvent;
      prizesAndPoints = prizes.data.prizesAndPoints;
      brand = prizes.data.brand;

      //get total amount of prizes capture from the same event_uuid
      const totalPrizesCapture = prizesAndPoints.filter(prize => prize.idEvent === detailsEvent[0].idEvent).length;
      //add rewards to the list
      let totalPointAllEvents: number = 0;
      prizesAndPoints.forEach(prize => {
        addRewardItem("img/icon_trophy.svg", prize.nombrePremio, prize.mensajePremio, prize.fechaCapturadoPremio, prize.puntosPremio);
        totalPointAllEvents += prize.puntosPremio;
      });

      document.getElementById('GameOverTotalPoints').innerText = `+${totalPointAllEvents}`;

      if (
        totalPrizesCapture >= detailsEvent[0].prizeLimit
      ) {
        TutorialCanvas.style.display = 'none';
        GameOverCanvas.style.display = 'block';
        return;
      }

      document.getElementById('event_name').innerText = detailsEvent[0].descriptionEvent;

      //get total points from the same event_uuid
      totalPointsFromCurrentEvent = prizesAndPoints.filter(prize => prize.idEvent === detailsEvent[0].idEvent).reduce((acc, prize) => acc + prize.puntosPremio, 0);

      document.getElementById('GSName').innerText = brand?.name || '';
      document.getElementById('LogoGS').setAttribute('src', brand?.logo || '');
      document.getElementById('logoGSRewardScreen').setAttribute('src', brand?.logo || '');

      list_prizes_ar.forEach(individualPrize => {
        LoadAndInstanceARObjects(event.coords, individualPrize);
      });
      document.getElementById('maxPrizeCapture').innerText = `${list_prizes_ar.length} objetos en total para cazar. ¡Suerte!`;
      document.getElementById('maxPrizeCaptureSmall').innerText = `${list_prizes_ar.length}`;
    })
    .catch(error => {
      console.error('Error fetching local prizes:', error);
    });
}

function LoadAndInstanceARObjects(coords: { latitude: number, longitude: number }, prizeData: ListPrizesAr) {
  loader.load(prizeData.url3d, function (gltf: any) {
    const mainglbObject = gltf.scene.children[0];
    mainglbObject.userData.isInteractable = true;
    mainglbObject.userData.prizeData = prizeData;
    const randomLatitude = randomNumber(-0.0001, 0.0001);
    const randomlongitude = randomNumber(-0.0001, 0.0001);
    mainglbObject.scale.set(3, 3, 3);
    if (isAround) {
      arjs.add(mainglbObject, coords.longitude + randomlongitude, coords.latitude + randomLatitude, randomNumber(-3, -3));
      console.log('around longitude-latitude', coords.longitude, coords.latitude);
    }
    else {
      arjs.add(mainglbObject, prizeData.longitude, prizeData.latitude, randomNumber(-3, -3));
      console.log('real longitude-latitude', prizeData.longitude, prizeData.latitude);
    }
    interactObjects.push(mainglbObject);
    mainglbObject.visible = false;
  }, undefined, function (error: any) {
    console.error(error);
  });
}

function randomNumber(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
//#endregion

//#region raycaster
window.addEventListener('touchstart', (event) => {
  // Calculate touch position in normalized device coordinates (-1 to +1) for both components
  const touch = event.touches[0];
  mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

  // Update the raycaster with the camera and touch position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the ray
  const intersects: THREE.Intersection[] = raycaster.intersectObjects(interactObjects, true);

  if (intersects.length > 0 && raycastEnabled) {
    for (let i = 0; i < intersects.length; i++) {
      // Use the recursive function to find an interactable object
      const interactableObject = findInteractableObject(intersects[i].object);
      if (interactableObject !== null && interactableObject.userData.isInteractable) {
        raycastEnabled = false;
        totalCapturePrizesOnCurrentSession++;
        ObjectSelected(interactableObject); // Pass the interactable object to ObjectSelected
        break;
      }
    }
  }
});

function findInteractableObject(object: THREE.Object3D): THREE.Object3D | null {
  // Base case: check if the current object has userData.isInteractable set
  if (object.userData.isInteractable) {
    return object;
  } else {
    // Recursive step: move to the parent and continue searching
    if (object.parent !== null) {
      return findInteractableObject(object.parent);
    } else {
      // If no parent has interactable property, return null
      return null;
    }
  }
}

function ObjectSelected(selectedObject: THREE.Object3D) {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (!isLocalhost && (uid !== '0' || companyId !== '0')) {
    if (isAround) {
      CapturePrizeAround(uid, companyId, selectedObject.userData.prizeData, isAround);
    }
    else
      CapturePrizeGS(uid, companyId, selectedObject.userData.prizeData, isAround);
  }

  addRewardItem("img/icon_trophy.svg", selectedObject.userData.prizeData.title,
    selectedObject.userData.prizeData.title_captured,
    (Date.now() / 1000).toString(),
    selectedObject.userData.prizeData.value_score);
  ExplorerCanvas.style.display = 'none';
  title_prizeCaptured.innerText = selectedObject.userData.prizeData.title;
  title_captured_prizeCaptured.innerText = selectedObject.userData.prizeData.title_captured;
  scene.remove(selectedObject);
  totalPointsFromCurrentEvent += selectedObject.userData.prizeData.value_score;
  pointText.innerText = `+${totalPointsFromCurrentEvent}`;
  PrizeCaptureResumeCanvas.style.display = 'block';
}
//#endregion

//#region Main Flow
function CheckMaxPrizesCapture() {
  if (totalCapturePrizesOnCurrentSession >= detailsEvent[0].prizeLimit) {
    FinalScoreCanvas.style.display = 'block';
    if (uid === '0' || companyId === '0')
      document.getElementById('keepPlayingLogin').innerHTML = 'Si quires capturar y redimir más premios, inicia sesión en la app';
    ExplorerCanvas.style.display = 'none';
    PrizeCaptureResumeCanvas.style.display = 'none';
    FinalScorePoints.innerText = `+${totalPointsFromCurrentEvent}`;
    FinalPrizeCaptureAmountCurrentSession.innerText = `${totalCapturePrizesOnCurrentSession}`;
    raycastEnabled = false;
    return true;
  } else {
    return false;
  }
}
//#endregion

//main loop
function animate() {
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    const aspect = canvas.clientWidth / canvas.clientHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
  cam.update();
  DeviceOrientation.update();
  interactObjects.forEach((obj) => {
    obj.lookAt(camera.position);
  });
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

function addRewardItem(iconSrc: string, title: string, description: string, date: string, value: number): void {

  const pointText = document.getElementById('TotalPointsFromAllEvents');
  const currentValue = pointText.innerHTML ? parseInt(pointText.innerHTML.replace('+', '')) : 0;
  const newTotal = currentValue + value;
  pointText.innerHTML = `+${newTotal}`;

  const rewardItem: HTMLDivElement = document.createElement('div');
  rewardItem.className = 'reward-item';

  const rewardIcon: HTMLImageElement = document.createElement('img');
  rewardIcon.className = 'reward-icon';
  rewardIcon.src = iconSrc;
  rewardIcon.alt = 'trophy';
  rewardItem.appendChild(rewardIcon);

  const parentDescription: HTMLDivElement = document.createElement('div');
  parentDescription.className = 'parent-description';
  rewardItem.appendChild(parentDescription);

  const rewardTitle: HTMLDivElement = document.createElement('div');
  rewardTitle.className = 'reward-title';
  rewardTitle.textContent = title;
  parentDescription.appendChild(rewardTitle);

  const rewardDescription: HTMLDivElement = document.createElement('div');
  rewardDescription.className = 'reward-description';
  rewardDescription.textContent = description;
  parentDescription.appendChild(rewardDescription);

  const dateContainer: HTMLDivElement = document.createElement('div');
  dateContainer.style.flex = '1 1 20%';
  rewardItem.appendChild(dateContainer);

  const dateTitle: HTMLDivElement = document.createElement('div');
  dateTitle.className = 'date-title';
  dateTitle.textContent = 'Capturado el día';
  dateContainer.appendChild(dateTitle);

  const dateCapture: HTMLDivElement = document.createElement('div');
  dateCapture.className = 'date-capture';
  if (date != null) {
    const datestamp = new Date(parseInt(date) * 1000);
    const day = ('0' + datestamp.getDate()).slice(-2);
    const month = ('0' + (datestamp.getMonth() + 1)).slice(-2);
    const year = datestamp.getFullYear();
    dateCapture.textContent = `${day}/${month}/${year}`;
  } else {
    dateCapture.textContent = `no hay fecha`;
  }

  dateContainer.appendChild(dateCapture);

  const rewardList: HTMLDivElement = document.querySelector('.rewar_list') as HTMLDivElement;
  rewardList.appendChild(rewardItem);
}

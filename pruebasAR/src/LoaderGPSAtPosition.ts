//import * as THREE from 'three';
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import * as THREEx from './node_modules/@ar-js-org/ar.js/three.js/build/ar-threex-location-only.js';
import { GetPrizes, CapturePrize, Brand, ListPrizesAr, DetailsEvent, PrizesAndPoints, Prizes } from './http-service.js';
import { AbsoluteDeviceOrientationControls } from './DeviceOrientaion.jsx';

//global variables
let firstSetup = true;
const companyId = new URLSearchParams(window.location.search).get('BigSurfaceId') || '0';
const uid = new URLSearchParams(window.location.search).get('uid') || '0';
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
const renderer = new THREE.WebGLRenderer({canvas: canvas});
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

function Start(){

    ExplorerCanvas.style.visibility = 'hidden';
    PrizeListCanvas.style.visibility = 'hidden';
    PrizeCaptureResumeCanvas.style.visibility = 'hidden';
    FinalScoreCanvas.style.visibility = 'hidden';
    TutorialCanvas.style.visibility = 'visible';

    inputPrizeList.addEventListener('click', () => {
      ExplorerCanvas.style.visibility = 'hidden';
      PrizeListCanvas.style.visibility = 'visible';
      document.getElementById('rewardList').style.display = 'flex';
    });

    inputReturnToExplorer.addEventListener('click', () => {
      ExplorerCanvas.style.visibility = 'visible';
      PrizeListCanvas.style.visibility = 'hidden';
      document.getElementById('rewardList').style.display = 'none';
      interactObjects.forEach((obj) => {
        obj.visible = true;
      });
    });

    ShowPrizeListGameOver.addEventListener('click', () => {
      GameOverCanvas.style.visibility = 'hidden';
      PrizeListCanvas.style.visibility = 'visible';
      document.getElementById('rewardList').style.display = 'flex';
      inputReturnToExplorer.removeEventListener('click', () => {});
      inputReturnToExplorer.style.display = 'none';
    });

    aceptPrize.addEventListener('click', () => {
      const finalPrize = CheckMaxPrizesCapture();
      if(finalPrize) {
        return;
      }
      AcceptPrize();
    });

    BtnNextTutorial.addEventListener('click', () => {
      ChangeTutorialScreen();
    });

    BtnExitFinalScore.addEventListener('click', () => {
      window.close();
    });

window.addEventListener('camera-rotation-change', (event) => {
  if(isIOS){
    spriteCompass.style.transform = `rotate(${event.detail.WebkitCompassHeading}deg)`;
  }else{
    spriteCompass.style.transform = `rotate(${-DeviceOrientation.deviceOrientation.alpha}deg)`;
  }
});
}
Start();

function ChangeTutorialScreen() {
  const currentTutorial = document.getElementsByClassName('tutorial' + tutorialNumber)[0] as HTMLElement;
  const nextTutorial = document.getElementsByClassName('tutorial' + (tutorialNumber + 1))[0] as HTMLElement; 
  if(currentTutorial == undefined || nextTutorial == undefined) {
    ExplorerCanvas.style.visibility = 'visible';
    PrizeListCanvas.style.visibility = 'hidden';
    TutorialCanvas.style.display = 'none';
    raycastEnabled = true;
    DeviceOrientation.connect();
    interactObjects.forEach((obj) => {
      obj.visible = true;
    });
    return;
  }
  
  currentTutorial.style.visibility = 'hidden';
  nextTutorial.style.visibility = 'visible';
  tutorialNumber++;
  if(navigator.geolocation){
    arjs.startGps(); //start the gps
    //arjs.fakeGps(-0.72, 51.05);
  }
}

function AcceptPrize() {
  PrizeCaptureResumeCanvas.style.visibility = 'hidden';
  ExplorerCanvas.style.visibility = 'visible';
  raycastEnabled = true;
}

//#region ARJS setup

arjs.on('gpsupdate', function (event) {
  if(firstSetup) {
    firstSetup = false;
    console.log(event.coords.latitude, event.coords.longitude);
    GetPrizesByWS(event);
    //GetPrizesByWSFake(event);

    //test fake object on random position around the user
    /*for (let i = 0; i < 20; i++) {
      loader.load("https://sasiteit.blob.core.windows.net/container-unity/ARWeb/models/24.glb", function (gltf: any) {
        const randomLatitude = randomNumber(-0.0001, 0.0001);
        const randomlongitude = randomNumber(-0.0001, 0.0001);
        gltf.scene.scale.set(3, 3, 3);
        arjs.add(gltf.scene, event.coords.longitude + randomlongitude, event.coords.latitude + randomLatitude, randomNumber(-3, -3)); //add the box to the scene at the given coordinates
        interactObjects.push(gltf.scene);
    }, undefined, function (error: any) {
        console.error(error);
    });
    }*/
  }
});

function GetPrizesByWS(event){
  GetPrizes(uid, companyId)
  .then(prizes => {
    list_prizes_ar = prizes.list_prizes_ar;
    detailsEvent = prizes.detailsEvent;
    prizesAndPoints = prizes.prizesAndPoints;
    brand = prizes.brand;

    //get total amount of prizes capture from the same event_uuid
    const totalPrizesCapture = prizesAndPoints.filter(prize => prize.idEvent === detailsEvent[0].idEvent).length;
    //add rewards to the list
    let totalPointAllEvents: number = 0;
    prizesAndPoints.forEach(prize => {
      addRewardItem("img/icon_trophy.svg", prize.nombrePremio, prize.mensajePremio, prize.fechaCapturadoPremio, prize.puntosPremio);
      totalPointAllEvents += prize.puntosPremio;
    });
  
    document.getElementById('GameOverTotalPoints').innerText = `+${totalPointAllEvents}`;

    if(
      totalPrizesCapture >= detailsEvent[0].prizeLimit
      ) {
      TutorialCanvas.style.display = 'none';
      GameOverCanvas.style.visibility = 'visible';
      return;
    }

    document.getElementById('event_name').innerText = detailsEvent[0].descriptionEvent;

    //get total points from the same event_uuid
    totalPointsFromCurrentEvent = prizesAndPoints.filter(prize => prize.idEvent === detailsEvent[0].idEvent).reduce((acc, prize) => acc + prize.puntosPremio, 0);

    document.getElementById('GSName').innerText = brand?.name || '';
    document.getElementById('LogoGS').setAttribute('src', brand?.logo || '');

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

function GetPrizesByWSFake(event){
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

    if(
      totalPrizesCapture >= detailsEvent[0].prizeLimit
      ) {
      TutorialCanvas.style.display = 'none';
      GameOverCanvas.style.visibility = 'visible';
      return;
    }

    document.getElementById('event_name').innerText = detailsEvent[0].descriptionEvent;

    //get total points from the same event_uuid
    totalPointsFromCurrentEvent = prizesAndPoints.filter(prize => prize.idEvent === detailsEvent[0].idEvent).reduce((acc, prize) => acc + prize.puntosPremio, 0);

    document.getElementById('GSName').innerText = brand?.name || '';
    document.getElementById('LogoGS').setAttribute('src', brand?.logo || '');

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

//create a box
/*const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
//move the cube to be in front of the camera
scene.add(cube);
cube.position.z = 5;*/

function LoadAndInstanceARObjects(coords: {latitude: number, longitude: number}, prizeData: ListPrizesAr) {
  loader.load(prizeData.url3d, function (gltf: any) {
    const mainglbObject = gltf.scene.children[0];
    mainglbObject.userData.isInteractable = true;
    mainglbObject.userData.prizeData = prizeData;
    mainglbObject.userData.prizeData = prizeData;//enviar datos del objeto ar actual (al interactuar acceder a los datos  del objeto)
    const randomLatitude = randomNumber(-0.0001, 0.0001);
    const randomlongitude = randomNumber(-0.0001, 0.0001);
    mainglbObject.scale.set(3, 3, 3); 
    arjs.add(mainglbObject, coords.longitude + randomlongitude, coords.latitude + randomLatitude, randomNumber(-3, -3)); //add the box to the scene at the given coordinates
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
  const intersects: THREE.Intersection[] = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0 && raycastEnabled) {
    for (let i = 0; i < intersects.length; i++) {
      if(intersects[i].object.parent.userData.isInteractable) {
        raycastEnabled = false;
        const object = intersects[i].object.parent;
        totalCapturePrizesOnCurrentSession++;
        ObjectSelected(object);
        break;
      }
    }
  }
});

function ObjectSelected(selectedObject: THREE.Object3D) {
  CapturePrize(uid, companyId, selectedObject.userData.prizeData);
  addRewardItem("img/icon_trophy.svg", selectedObject.userData.prizeData.title,
    selectedObject.userData.prizeData.title_captured,
    (Date.now() / 1000).toString(),
    selectedObject.userData.prizeData.value_score);
  ExplorerCanvas.style.visibility = 'hidden';
  title_prizeCaptured.innerText = selectedObject.userData.prizeData.title;
  title_captured_prizeCaptured.innerText = selectedObject.userData.prizeData.title_captured;
  scene.remove(selectedObject);
  totalPointsFromCurrentEvent += selectedObject.userData.prizeData.value_score;
  pointText.innerText = `+${totalPointsFromCurrentEvent}`;
  (document.getElementsByClassName('PrizeCaptureResume')[0] as HTMLElement).style.visibility = 'visible';
}
//#endregion

//#region Main Flow
function CheckMaxPrizesCapture() {
  if(totalCapturePrizesOnCurrentSession >= detailsEvent[0].prizeLimit) {
    FinalScoreCanvas.style.visibility = 'visible';
    ExplorerCanvas.style.visibility = 'hidden';
    PrizeCaptureResumeCanvas.style.visibility = 'hidden';
    FinalScorePoints.innerText = `+${totalPointsFromCurrentEvent}`;
    FinalPrizeCaptureAmountCurrentSession.innerText = `${totalCapturePrizesOnCurrentSession}`;
    raycastEnabled = false;
    return true;
  }else{
    return false;
  }
}
//#endregion

//main loop
function animate() {
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    const aspect = canvas.clientWidth/canvas.clientHeight;
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
  if(date != null){
    const datestamp = new Date(parseInt(date) * 1000);
    const day = ('0' + datestamp.getDate()).slice(-2);
    const month = ('0' + (datestamp.getMonth() + 1)).slice(-2);
    const year = datestamp.getFullYear();
    dateCapture.textContent = `${day}/${month}/${year}`;
  }else{
    dateCapture.textContent = `no hay fecha`;
  }

  dateContainer.appendChild(dateCapture);

  const rewardList: HTMLDivElement = document.querySelector('.rewar_list') as HTMLDivElement;
  rewardList.appendChild(rewardItem);
}
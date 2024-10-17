//import * as THREE from 'three';
//import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
//import * as THREEx from './node_modules/@ar-js-org/ar.js/three.js/build/ar-threex-location-only.js';
import { GetPrizes, CapturePrize, Brand, ListPrizesAr, DetailsEvent, PrizesAndPoints, Prizes } from './http-service.js';

//global variables
let firstSetup = true;
let brand: Brand | null = null;
let prizesAndPoints: PrizesAndPoints[] = [];
let detailsEvent: DetailsEvent[] | null = [];
let list_prizes_ar: ListPrizesAr[] = [];
//#region ThreeJS setup
const canvas = document.getElementById('canvas1') as HTMLCanvasElement;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, 1.33, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({canvas: canvas});
const arjs = new THREEx.LocationBased(scene, camera); //this is our new scene
const cam = new THREEx.WebcamRenderer(renderer); //this is our new camera
const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
scene.add(directionalLight);
//const loader = new THREE.GLTFLoader();
const deviceOrientationControls = new THREEx.DeviceOrientationControls(camera);

//#endregion

arjs.on('gpsupdate', function (event) {
  if(firstSetup) {
    firstSetup = false;

    /*const companyId = new URLSearchParams(window.location.search).get('BigSurfaceId') || '0';
    GetPrizes('52692', companyId)
      .then(prizes => {
      list_prizes_ar = prizes.list_prizes_ar;
      detailsEvent = prizes.detailsEvent;
      prizesAndPoints = prizes.prizesAndPoints;
      brand = prizes.brand;
    })
    .catch(error => {
      console.error('Error fetching prizes:', error);
    });*/

    //test fake object on random position around the user
    const geom = new THREE.BoxGeometry(1, 1, 1);
    const mtl = new THREE.MeshBasicMaterial({color: 0xff0000});
    const box = new THREE.Mesh(geom, mtl);
    const randomLatitude = randomNumber(-0.0001, 0.0001);
    const randomlongitude = randomNumber(-0.0001, 0.0001);
    arjs.add(box, event.coords.longitude + randomlongitude,
       event.coords.latitude + randomLatitude,
       randomNumber(-3, -3)); //add the box to the scene at the given coordinates 
  }
});

arjs.startGps(); //start the gps

//#region API calls
/*function fetchAPI(coords) {
  const apiUrl = 'https://as-siteit-pru.azurewebsites.net/api/gaming/prizes/ar';
  const headers = new Headers();
  var bigSurface = new URLSearchParams(window.location.search).get('BigSurfaceId');
  headers.append('cli','PUnity');//cliente, nunca cambia
  headers.append('dataListPrizesArAround','true');
  headers.append('companyId', bigSurface[0]);
  headers.append('uid', '52692');//usuario, no cambia

  fetch(apiUrl, { method: 'GET', headers: headers })
      .then(response => response.json())
      .then(data => ReceivedDataFromWS(data, coords))
      .catch(error =>
          console.error('Error fetching the API:', error)
      );
  }*/

  function ReceivedDataFromWS(data, coords) {
    const threads = data.data;
    const numObjects = threads.list_prizes_ar.length; // Set numObjects based on the API response
        for (let i = 0; i < numObjects; i++) {
          console.log(i);
            loader.load(threads.list_prizes_ar[i].url3d, function (gltf) {
                gltf.scene.scale.set(1,1,1);
                gltf.scene.userData.isTouchable = true;
                gltf.scene.userData.thread = threads.list_prizes_ar[i];//enviar datos del objeto ar actual (al interactuar acceder a los datos  del objeto)

                const randomLatitude = randomNumber(-0.001, 0.001);
                const randomlongitude = randomNumber(-0.001, 0.001);
                arjs.add(gltf.scene, coords.longitude + randomlongitude, coords.latitude + randomLatitude, randomNumber(-3, -3)); //add the box to the scene at the given coordinates

            }, undefined, function (error) {
                console.error(error);
            });
        }
  }

  function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
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
  deviceOrientationControls.update();
  cam.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/*function createModel3D() {
console.log("inicia la carga");

  let model = document.createElement('a-entity');            
  var randomLatitude = randomNumber(-0.0001, 0.0001);
  var randomlongitude = randomNumber(-0.0001, 0.0001);
  model.setAttribute('scale','5 5 5');
  model.setAttribute('rotation','0 0 0');
  //model.setAttribute('gltf-model', prize.url3d);
  model.setAttribute('gltf-model', 'https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/FredARWeb/buffalo-ar/models/ClubColombia.glb');
  //model.setAttribute('gps-entity-place', 'longitude:' + (prize.coords.longitude + randomlongitude) + '; latitude: ' + (prize.coords.latitude + randomLatitude) + ';');
  model.setAttribute('animation-mixer', '');
  modelEntity.addEventListener('model-loaded', function () {
    console.log('Modelo cargado correctamente.');
  });

  // Añadir un listener para capturar errores en la carga del modelo
  modelEntity.addEventListener('model-error', function (event) {
    console.error('Error al cargar el modelo:', event.detail.src);
  });
  const clickListener = function (ev) {
    ev.stopPropagation();
    ev.preventDefault();
    const el = ev.detail.intersection && ev.detail.intersection.object.el;
    if (el && el === ev.target) {
      showLoader()
      capturePrize(prize)
        .then((data) => {
          console.log(data);
          hiddenLoader()
          showMessageWin()
          model.setAttribute('scale','0 0 0')
           model.setAttribute('gltf-model', './models/texto.glb');
           model.setAttribute('scale', '1 1 1');
           model.object3D.lookAt(new THREE.Vector3( ));
           setTimeout(
             function() {
               model.setAttribute('scale','0 0 0');
               console.log();
             }, 15000);
        })
        .catch( error => {
          console.log(error);
          hiddenLoader()
          alert('No se pudo cazar el premio.')
        })

    }
  };
  model.addEventListener('click', clickListener);
  return model
}*/
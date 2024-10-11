var urlParameters = parseUrlParameters(window.location.href);
const product = urlParams.get('BigSurfaceId')
console.log(product);
function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}
function parseUrlParameters(url) {
  const params = {};
  const queryString = url.split('?')[1];

  if (queryString) {
      const paramPairs = queryString.split('&');

      paramPairs.forEach(pair => {
          const [key, value] = pair.split('=');
          params[key] = decodeURIComponent(value);
      });
  }
  console.log("url"+params.toString());
  return params;
}
function FetchAPI() {
  //const apiUrl = 'https://ms-web-app-production.up.railway.app/tockall/epithing';
  const apiUrl = 'https://as-siteit-pru.azurewebsites.net/api/gaming/prizes/ar';
  const headers = new Headers();
  //headers.append('company_id', '586-brand');
  var bigSurface = String(getUrlParameter("BigSurfaceId"));
  //headers.append('companyId', `${urlParameters['BigSurfaceId'].split('-')[0]}`);
  headers.append('companyId', bigSurface[0]);
  headers.append('uid', '52692');
  console.log("parametro de la url: "+bigSurface[0]);
  //headers.append('api-key', '$2b$10$8sh4oaJu43jfoye8AMrQDOBLIo3/BJAYq.gH1BSWbJnCMnsGWnFS6');

  fetch(apiUrl, { method: 'GET', headers: headers })
      .then(response => response.json())
      .then(data => ReceivedDataFromWS(data))
      .catch(error =>
          console.error('Error fetching the API:', error)
      );
      console.log(response.json());
}
/*AFRAME.registerComponent('gps_at_position_start',{
	init:function(){
    showLoader()
    navigator.geolocation.getCurrentPosition(function (position) {
      let scene = document.querySelector('a-scene');

      getPrizes()
        .then(prizes => {

          hiddenLoader()
          
          if(prizes.length == 0) alert('No hay premios que cargar')

          if(prizes.length > 0) {
            prizes.map(prize => {
              prize.coords = position.coords
              let model = createModel3D(prize)
              scene.appendChild(model)
            })
          }
        })
        .catch(error => {
          alert('Error al cargar los premios.')
          hiddenLoader()
        })
      },
      (err) => {
        hiddenLoader()
        console.error('Error al obtener la posición.', err)
      },
      {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 27000,
      }
    );
	}
});*/

function ReceivedDataFromWS(data) {
  const threads = data.data;
  const numObjects = threads.list_prizes_ar.length; // Set numObjects based on the API response
  const fontLoader = new FontLoader();
  fontLoader.load('fonts/Syne_Regular.json', function (font) { // Adjust the font path
      for (let i = 0; i < numObjects; i++) {
        console.log(i);
          loader.load(`./resources/thread${i + 1}.glb`, function (gltf) {
              gltf.scene.scale.set(1,1,1);
              gltf.scene.userData.isTouchable = true;
              gltf.scene.userData.thread = threads[i];
              scene.add(gltf.scene);
              const { x, y } = getRandomPosition();
              gltf.scene.position.set(x, y, Math.floor(Math.random() * -10) - 6);
              //gltf.scene.lookAt(camera.position);

              if (threads[i].name.includes(' ')) {
                  threads[i].name = threads[i].name.replace(' ', '\n');
              }
              const textGeometry = new TextGeometry(threads[i].name, {
                  font: font,
                  size: 0.3, // Adjust size as needed
                  depth: 0.05, // Adjust depth as needed
              });

              // Create a mesh for the text
              const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // Adjust color as needed
              const textMesh = new THREE.Mesh(textGeometry, textMaterial);

              // Adjust the text mesh position here if needed
              textMesh.position.set(-0.8, 0.15, 0.3); // Position the text relative to the object

              // Add the text mesh as a child of the object
              gltf.scene.add(textMesh);
          }, undefined, function (error) {
              console.error(error);
          });
      }

      //finished setting up threads
      //updateAndSendMessage('SceneReady', "{'key': 'value', 'key2': 'value2'}");
  });
}

function createModel3D() {
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
}
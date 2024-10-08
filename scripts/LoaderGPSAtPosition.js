function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

AFRAME.registerComponent('gps_at_position_start',{
	init:function(){
    showLoader()
    navigator.geolocation.getCurrentPosition(function (position) {
      let scene = document.querySelector('a-scene');

      /*getPrizes()
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
        })*/
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
});

function createModel3D() {
console.log("inicia la carga");

  let model = document.createElement('a-entity');            
  var randomLatitude = randomNumber(-0.0001, 0.0001);
  var randomlongitude = randomNumber(-0.0001, 0.0001);
  model.setAttribute('scale','5 5 5');
  model.setAttribute('rotation','0 0 0');
  //model.setAttribute('gltf-model', prize.url3d);
  model.setAttribute('gltf-model', 'https://sasiteit.blob.core.windows.net/container-unity/UnityBundles/webgl/FredARWeb/buffalo-ar/models/ClubColombia.glb');
  model.setAttribute('gps-entity-place', 'longitude:' + (prize.coords.longitude + randomlongitude) + '; latitude: ' + (prize.coords.latitude + randomLatitude) + ';');
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
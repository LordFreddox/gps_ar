function requestOrientationPermission() {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', (event) => {
              console.log('Device orientation granted');
            });
          } else {
            console.log('Permission denied');
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener('deviceorientation', (event) => {
        console.log('Device orientation supported without permission');
      });
    }
  }
  
  window.addEventListener('click', requestOrientationPermission);
  
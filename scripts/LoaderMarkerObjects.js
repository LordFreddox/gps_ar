function GetURLParameter(sParam)
{
  var sPageURL = window.location.search.substring(1);
  var sURLVariables = sPageURL.split('&');
  for (var i = 0; i < sURLVariables.length; i++) 
  {
    var sParameterName = sURLVariables[i].split('=');
    if (sParameterName[0] == sParam) 
    {
      return sParameterName[1];
    }
  }
  return "";
}

AFRAME.registerComponent('markers_start',{
	init:function(){
          let stringconact= './json/' + GetURLParameter("BigSurfaceId") + '.json';
          jQuery.getJSON( stringconact, function( json ) {

               let scene = document.querySelector('a-scene');
               for(var i = 0; i < json.length; i++) {
                    let marker = document.createElement('a-marker');
                    marker.setAttribute('preset', json[i].preset);
                    marker.setAttribute('type', json[i].type);
                    marker.setAttribute('url', json[i].url);
                    scene.appendChild(marker);
         
                    let model = document.createElement('a-entity');
                    model.setAttribute('position',json[i].position);
                    model.setAttribute('scale', json[i].scale);
                    model.setAttribute('gltf-model', json[i].model);
                    marker.appendChild(model);
                }
              });
	}
});
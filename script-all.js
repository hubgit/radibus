var App = {
  markers: [],

  init: function(){
    navigator.geolocation.getCurrentPosition(App.drawMap);
  },

  drawMap: function(position){
    App.map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      navigationControlOptions: { style: google.maps.NavigationControlStyle.ANDROID }
    });

    google.maps.event.addListener(App.map, 'click', function(event) { App.placeMarker(event.latLng); });
  },

  placeMarker: function(location){
     if (App.markers.length == 2){
       for (i in App.markers)
         App.markers[i].setMap(null);

       //App.line.setMap(null);
       App.markers = [];
     }

     App.markers.push(new google.maps.Marker({ position: location, map: App.map, draggable: true }));

     if (App.markers.length == 2){
         var points = [];
         for (i in App.markers)
             points.push(App.markers[i].getPosition());

         /*
         App.line = new google.maps.Polyline({
            path: points,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
          });

          App.line.setMap(App.map);
          */

          //App.getDirections();
          //App.calculateCentre(points);
          App.getStops(points);
     }
  },

  getStops: function(points){
    var dots = [points[0].lat(), points[0].lng(), points[1].lat(), points[1].lng()];
    $.getJSON("stops.php", { points: dots.join(",") }, App.drawStops);
  },

  drawStops: function(data, status){
    for (var route in data){
     var points = [];
     for (var i in data[route]){
        point = data[route][i];
        //console.log(point);
        var spot = new google.maps.LatLng(point.lat, point.lng);
        points.push(spot);
        //new google.maps.Marker({ position: spot, map: App.map });
      }
      App.line = new google.maps.Polyline({
        path: points,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2
      });

      App.line.setMap(App.map);
    }
  },

  /*getDirections: function(){
      if (typeof App.directionsService == "undefined"){
          App.directionsService = new google.maps.DirectionsService();
          App.directionsRenderer = new google.maps.DirectionsRenderer();
          App.directionsRenderer.setMap(App.map);
      }

      var request = {
        origin: App.markers[0].getPosition(),
        destination: App.markers[1].getPosition(),
        travelMode: google.maps.DirectionsTravelMode.WALKING
      };

      App.directionsService.route(request, function(result, status) {
        if (status == google.maps.DirectionsStatus.OK) {
          App.directionsRenderer.setDirections(result);
        }
      });
  },*/

  calculateCentre: function(points){
      var center = [
         (points[0].lat() + points[1].lat()) / 2,
         (points[0].lng() + points[1].lng()) / 2,
      ];

     new google.maps.Marker({ position: new google.maps.LatLng(center[0], center[1]), map: App.map, draggable: false });
  },*/
}

$().ready(App.init);


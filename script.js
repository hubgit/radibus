if (typeof console == "undefined")
  console = { log: function(){} };

var App = {
  markers: [],
  lines: [],
  routes: [],
  bookends: [],
  color: 0,

  init: function(){
    App.generateColors();
    navigator.geolocation.getCurrentPosition(App.drawMap);
  },

  generateColors: function(){
    App.colors = [];
    var  c = ["00", "33", "66", "99", "CC", "FF"];
    for (i=0; i<6; i++)
      for (j=0; j<6; j++)
        for (k=0; k<6; k++)
          App.colors.push(c[i] + c[j] + c[k]);

     App.colors.sort(function() {return 0.5 - Math.random()});
  },

  drawMap: function(position){
    App.map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      navigationControlOptions: { style: google.maps.NavigationControlStyle.ANDROID }
    });

    google.maps.event.addListener(App.map, 'click', function(event) { App.placeMarker(event.latLng); });
    $("#routes li:first").text("Click on the map to choose start and end points");
  },

  placeMarker: function(location){
     if (App.markers.length == 2){
       for (i in App.markers)
         App.markers[i].setMap(null);
       App.markers = [];

       for (i in App.lines)
         App.lines[i].setMap(null);
       App.lines = [];

       for (i in App.bookends)
         App.bookends[i].setMap(null);
       App.bookends = [];

       App.color = 0;
     }

     App.markers.push(new google.maps.Marker({ position: location, map: App.map, draggable: true, icon: "http://chart.apis.google.com/chart?chst=d_map_spin&chld=1|0|FFFFFF|10|_|" + (App.markers.length ? "end" : "start") }));

     if (App.markers.length == 2){
         var positions = [];
         for (i in App.markers)
           positions.push(App.markers[i].getPosition());
         App.getStops(positions[0], positions[1]);
     }
  },

  getStops: function(start, end){
    $("#routes").empty().append("<li class='loading'>Searching&hellip;</li>");

    App.bounds = new google.maps.LatLngBounds();
    App.bounds.extend(start);
    App.bounds.extend(end);

    $.getJSON("stops_mysql.php", { points: [start.lat(), start.lng(), end.lat(), end.lng()].join(",") }, App.drawStops);
  },

  drawStops: function(data, status){
    $("#routes").empty();

    //var center = new google.maps.LatLng(parseFloat(data["center"]["Latitude"]), parseFloat(data["center"]["Longitude"]));
    //App.drawCircle(center, data["radius"] * 55.5, 100);

    for (var routeId in data["stops"]){
      App.routes[routeId] = [];
      var route = data["stops"][routeId];

      //var color = "#" + Math.round(0xffffff * Math.random()).toString(16);
      var color = App.colors[App.color++];

      var count = 0;

      for (var i in route){
        var position = new google.maps.LatLng(parseFloat(route[i]["Latitude"]), parseFloat(route[i]["Longitude"]));
        App.routes[routeId].push(position);
        App.bounds.extend(position);

        if (count++ == 0)
          App.bookends.push(new google.maps.Marker({ position: position, map: App.map, draggable: true,  icon: "http://chart.apis.google.com/chart?chst=d_map_spin&chld=1|0|" + color + "|10|_|" + routeId }));

      }

      if (count > 1)
        App.bookends.push(new google.maps.Marker({ position: position, map: App.map, draggable: true, icon: "http://chart.apis.google.com/chart?chst=d_map_spin&chld=1|0|" + color + "|10|_|" + routeId }));

      App.drawRoute(routeId, color);
    }

    App.map.fitBounds(App.bounds);
  },

  drawRoute: function(routeId, color){
      var line = new google.maps.Polyline({
        path: App.routes[routeId],
        strokeColor: "#" + color,
        strokeOpacity: 0.5,
        strokeWeight: 4
      });

      line.setMap(App.map);
      App.lines[routeId] = line;

      App.listRoute(routeId, color);
  },

  listRoute: function(routeId, color){
    var li = $("<li class='route'/>").attr("id", "route-" + routeId).mouseover(App.highlightRoute).mouseout(App.unhighlightRoute);
    li.append(
      $("<span class='legend'/>").css("background-color", "#" + color)
    );
    li.append(
      $("<span class='route-text'/>").text(routeId)
    );
    $("#routes").append(li);
  },

  highlightRoute: function(e){
    var route = $(this).attr("id").match(/^route-(.+)/)[1];
    App.lines[route].setOptions({ strokeWeight: 8, strokeOpacity: 1.0 });
  },

  unhighlightRoute: function(e){
    var route = $(this).attr("id").match(/^route-(.+)/)[1];
    App.lines[route].setOptions({ strokeWeight: 4, strokeOpacity: 0.5 });
  },

   // Draw a circle on map around center (radius in miles)
   // Modified from a version by Jeremy Schneider based on http://maps.huge.info/dragcircle2.htm
   drawCircle: function(center, radius, numPoints){
        var lat = center.lat() ;
        var lng = center.lng() ;
        var d2r = Math.PI/180 ;                // degrees to radians
        var r2d = 180/Math.PI ;                // radians to degrees
        var Clat = (radius/3963) * r2d ;      //  using 3963 miles as earth's radius
        var Clng = Clat/Math.cos(lat*d2r);

        var poly = [] ;
        for (var i = 0 ; i < numPoints ; i++){
            var theta = Math.PI * (i / (numPoints / 2)) ;
            var Cx = lng + (Clng * Math.cos(theta)) ;
            var Cy = lat + (Clat * Math.sin(theta)) ;
            poly.push(new  google.maps.LatLng(Cy,Cx)) ;
        }

        //Add the first point to complete the circle
        poly.push(poly[0]) ;

        //Remove the old line if it exists
        if (App.circle)
          App.circle.setMap(null);

        //Create a line with teh points from poly, red, 3 pixels wide, 80% opaque
        App.circle = new google.maps.Polyline({
          path: poly,
          strokeColor: '#FF0000',
          strokeWeight: 3,
          strokeOpacity: 0.8
        }) ;

        App.circle.setMap(App.map);
    }
}

$().ready(App.init);

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


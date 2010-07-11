if (typeof console == "undefined")
  console = { log: function(){} };

var App = {
  markers: [],
  lines: [],
  routes: [],
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

    //for (var i = 1; i < 256; i++)
      //App.colors.push(Math.round(0xffffff/i).toString(16));

    App.colors.sort(function() {return 0.5 - Math.random()});
  },

  drawMap: function(position){
    App.map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      navigationControlOptions: { style: google.maps.NavigationControlStyle.ANDROID }
    });

    $("#routes li:first").text("Click on the map to choose start and end points");

    google.maps.event.addListener(App.map, 'click', function(event) { App.placeMarker(event.latLng); });
  },

  placeMarker: function(location){
     if (App.markers.length == 2){
       for (i in App.markers)
         App.markers[i].setMap(null);

       for (i in App.lines)
         App.lines[i].setMap(null);

       App.markers = [];
       App.lines = [];
       App.color = 0;
     }

     App.markers.push(new google.maps.Marker({ position: location, map: App.map, draggable: true, icon: "http://chart.apis.google.com/chart?chst=d_map_spin&chld=1|0|FFFF88|10|_|" + (App.markers.length ? "end" : "start") }));

     if (App.markers.length == 2){
         var points = [];
         for (i in App.markers)
             points.push(App.markers[i].getPosition());
         App.getStops(points);
     }
  },

  getStops: function(points){
    var dots = [points[0].lat(), points[0].lng(), points[1].lat(), points[1].lng()];
    $("#routes").empty().append("<li class='loading'>Searching&hellip;</li>");
    $.getJSON("stops.php", { points: dots.join(",") }, App.drawStops);
  },

  drawStops: function(data, status){
    $("#routes").empty();

    var bounds = new google.maps.LatLngBounds();

    for (var routeId in data){
      App.routes[routeId] = [];
      var route = data[routeId];

      for (var i in route){
        var position = new google.maps.LatLng(route[i]["Latitude"], route[i]["Longitude"]);
        App.routes[routeId].push(position);
        bounds.extend(position);
        //new google.maps.Marker({ position: position, map: App.map });
      }

      App.drawRoute(routeId);
    }

    App.map.fitBounds(bounds);
  },

  drawRoute: function(routeId){
      //var color = "#" + Math.round(0xffffff * Math.random()).toString(16);
      //var color = "#" + App.colors[App.color++];
      var color = App.colors[App.color++];
      //while (color.length < 6)
        //color = "0" + color;
      color = "#" + color;

      console.log(color);
      var line = new google.maps.Polyline({
        path: App.routes[routeId],
        strokeColor: color,
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
      $("<span class='legend'/>").css("background-color", color)
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



}

$().ready(App.init);


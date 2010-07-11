<?php

require '/opt/libapi/main.php';
Config::set('DEBUG', 'FIRE');

header('Content-Type: application/json;charset=utf-8');

$mongo = new Mongo;
$collection = $mongo->{'tfl'}->{'routes'};
$stopcollection = $mongo->{'tfl'}->{'stops'};

$collection->ensureIndex(array('Routes.Route' => 1, 'Routes.Run' => 1));
$stopcollection->ensureIndex(array('Location' => '2d'));

list($lat1, $long1, $lat2, $long2) = explode(',', $_GET['points']);

$center = array('Latitude' => (($lat1 + $lat2) / 2),  'Longitude' => (($long1 + $long2) / 2));
$radius = sqrt(pow($lat1 - $lat2, 2) + pow($long1 - $long2, 2)) / 2;
$mybearing = rad2deg(atan2(asin($long2-$long1)*cos($lat2),cos($lat1)*sin($lat2) - sin($lat1)*cos($lat2)*cos($long2-$long1)));
$mybearing = $mybearing < 0 ? 360 + $mybearing : $mybearing;

$stops = $stopcollection->find(array('Location' => array('$within' => array('$center' => array($center, $radius)))));
$routes = array();
foreach ($stops as $stop){
  //debug($stop);
  if (strpos($stop['Route'], 'N') === 0)
    continue;

   $routes[$stop['Route']][$stop['Run']][(int) $stop['Order']] = array('Latitude' => $stop['Location']['Latitude'], 'Longitude' => $stop['Location']['Longitude']);
}

//debug($routes);

$items = array();
foreach ($routes as $route_id => $runs){
   foreach ($runs as $run_id => $stops){
     ksort($stops);

     $first = array_slice($stops, 0, 1);

     $last = array_slice($stops, -1, 1);
     $bearing = bearing($first[0]['Latitude'], $first[0]['Longitude'], $last[0]['Latitude'], $last[0]['Longitude']);
     $diff = sqrt(pow($bearing - $mybearing, 2));

     if ($diff > 45)
      continue;

     $items[$route_id] = $stops;
  }
}

ksort($items);
print json_encode($items);

/*
$routes = $mongo->{'tfl'}->command(array("distinct" => "stops", "key" => "Route", 'query' => array('Location' => array('$within' => array('$center' => array($center, $radius))))));

$items = array();
foreach ($routes['values'] as $item){
  if (strpos($item, 'N') === 0)
    continue;

  $route = $collection->findOne(array('Routes.Route' => $item));

  foreach ($route['Routes'] as $r){
    $bearing = bearing($r['startPoint']['Latitude'], $r['startPoint']['Longitude'], $r['endPoint']['Latitude'], $r['endPoint']['Longitude']);
    $diff = sqrt(pow($bearing - $mybearing, 2));

    if ($diff > 90)
      continue;

    $stops = array();
    foreach ($route['Stops'] as $stop)
      $stops[$stop['StopId']] = array('lat' => $stop['Latitude'], 'lng' => $stop['Longitude']);

    $items[$r['Route']] = $stops;
  }
}
*/


function bearing(){
  $args = func_get_args();
  list($lat1, $long1, $lat2, $long2) =  array_map('deg2rad', $args);
  $bearing = rad2deg(atan2(asin($long2-$long1)*cos($lat2),cos($lat1)*sin($lat2) - sin($lat1)*cos($lat2)*cos($long2-$long1)));
  //debug($bearing);
  return $bearing < 0 ? 360 + $bearing : $bearing;
}


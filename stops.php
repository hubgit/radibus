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

$mybearing = bearing($lat1, $long1, $lat2, $long2);

$center = array('Latitude' => (($lat1 + $lat2) / 2),  'Longitude' => (($long1 + $long2) / 2));
$radius = sqrt(pow($lat1 - $lat2, 2) + pow($long1 - $long2, 2)) / 2;

$stops = $stopcollection->find(array('Location' => array('$within' => array('$center' => array($center, $radius)))));

$routes = array();
foreach ($stops as $stop){
  if (strpos($stop['Route'], 'N') !== 0)
    $routes[$stop['Route']][$stop['Run']][(int) $stop['Order']] = array('Latitude' => $stop['Location']['Latitude'], 'Longitude' => $stop['Location']['Longitude']);
}

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

function bearing($lat1, $long1, $lat2, $long2){
  $args = func_get_args();
  list($lat1, $long1, $lat2, $long2) =  array_map('deg2rad', $args);
  $bearing = rad2deg(atan2(asin($long2-$long1)*cos($lat2),cos($lat1)*sin($lat2) - sin($lat1)*cos($lat2)*cos($long2-$long1)));
  return $bearing < 0 ? 360 + $bearing : $bearing;
}


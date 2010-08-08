<?php

require '/opt/libapi/main.php';
require __DIR__ . '/config.php';
//Config::set('DEBUG', 'FIRE');

header('Content-Type: application/json;charset=utf-8');

list($lat1, $long1, $lat2, $long2) = explode(',', $_GET['points']);

$mybearing = bearing($lat1, $long1, $lat2, $long2);

$lat = (($lat1 + $lat2) / 2);
$lon = (($long1 + $long2) / 2);
$center = array('Latitude' => $lat,  'Longitude' => $lon);

$radius = sqrt(pow($lat1 - $lat2, 2) + pow($long1 - $long2, 2)) / 2;

$db = new DB;

$sql = "SELECT id, (%d * acos(cos(radians(%f)) * cos(radians(latitude)) * cos(radians(longitude) - radians(%f)) + sin(radians(%f)) * sin(radians(latitude)))) AS distance,
  latitude as Latitude, longitude as Longitude, route as Route, run as Run, `order` as `Order`
  FROM stops HAVING distance < (%f * 70) LIMIT 0,10000";

$factor = 3959; //  using 3959 miles as Earth's radius
$result = $db->query($sql, $factor, $lat, $lon, $lat, $radius);

$stops = array();
while ($item = mysql_fetch_array($result))
  $stops[] = $item;

$routes = array();
foreach ($stops as $stop){
  if (strpos($stop['Route'], 'N') !== 0)
    $routes[$stop['Route']][$stop['Run']][(int) $stop['Order']] = array('Latitude' => $stop['Latitude'], 'Longitude' => $stop['Longitude']);
}

$distances = array();

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

     $distances[$route_id] = distance($first[0]['Latitude'], $first[0]['Longitude'], $last[0]['Latitude'], $last[0]['Longitude']);
     $items[$route_id] = $stops;
  }
}

// TODO: fix the distance function and make sure sorting works - longest first

uksort($items, function($a, $b) use ($distances){
  return ($distances[$a] > $distances[$b]);
});

print json_encode(array(
  'center' => $center,
  'radius' => $radius,
  'stops' => $items,
  ));

function bearing($lat1, $long1, $lat2, $long2){
  $args = func_get_args();
  list($lat1, $long1, $lat2, $long2) =  array_map('deg2rad', $args);
  $bearing = rad2deg(atan2(asin($long2-$long1)*cos($lat2),cos($lat1)*sin($lat2) - sin($lat1)*cos($lat2)*cos($long2-$long1)));
  return $bearing < 0 ? 360 + $bearing : $bearing;
}

function distance($lat1, $long1, $lat2, $long2){
  $args = func_get_args();
  list($lat1, $long1, $lat2, $long2) =  array_map('deg2rad', $args);
  $dLat = $lat2 - $lat1;
  $dLon = $long2 - $long1;
  $a = sin($dLat/2) * sin($dLat/2) + cos($lat1) * cos($lat2) * sin($dLon/2) * sin($dLon/2);
  $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
  return 3959 * $c; // miles
}


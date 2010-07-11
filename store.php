<?php

$mongo = new Mongo;

$collection = $mongo->{'tfl'}->{'routes'};
$collection->drop();

$stopcollection = $mongo->{'tfl'}->{'stops'};
$stopcollection->drop();

require '/opt/libapi/main.php';
$api = new API;

$dir = $api->get_input_dir('tfl/bus/');

foreach (glob($dir . '*.js') as $file){
  debug($file);

  preg_match('/(.+?)-(\d+)/', basename($file, '.js'), $matches);
  list(,$route, $run) = $matches;

  $data = json_decode(file_get_contents($file), TRUE);
  $collection->insert($data, TRUE);

  $i = 1;
  foreach ($data['Stops'] as $stop){
    $stop['Location'] = array('Latitude' => $stop['Latitude'], 'Longitude' => $stop['Longitude']);
    $stop['Route'] = $route;
    $stop['Run'] = $run;
    $stop['Order'] = $i++;
    unset($stop['Latitude']);
    unset($stop['Longitude']);
    $stopcollection->insert($stop, TRUE);
  }
}

$mongo->close();


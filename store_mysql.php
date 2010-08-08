<?php

require '/opt/libapi/main.php';
require __DIR__ .'/config.php';

$api = new API;

$dir = $api->get_input_dir('tfl/bus/');

$db = new DB;

foreach (glob($dir . '*.js') as $file){
  debug($file);

  preg_match('/(.+?)-(\d+)/', basename($file, '.js'), $matches);
  list(,$route, $run) = $matches;

  $data = json_decode(file_get_contents($file), TRUE);

  $i = 1;
  foreach ($data['Stops'] as $stop)
    $db->query(
      "INSERT INTO `stops` (`id`, `stopcode`, `name`, `latitude`, `longitude`, `location`, `route`, `run`, `order`)
      VALUES ('%s', '%s', '%s', %f, %f, GeomFromText('POINT(%f %f)'), '%s', %d, '%s')",
      $stop['StopId'], $stop['StopCode'], $stop['StopName'], $stop['Latitude'],  $stop['Longitude'], $stop['Longitude'],  $stop['Latitude'],  $route, $run, $i++
    );
}

/*
CREATE TABLE IF NOT EXISTS `stops` (
  `id` varchar(32) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  `location` point NOT NULL,
  `route` varchar(32) NOT NULL,
  `run` int(3) NOT NULL,
  `order` int(11) NOT NULL,
  `stopcode` varchar(255) NOT NULL,
  `name` text NOT NULL,
  KEY `latitude` (`latitude`),
  KEY `longitude` (`longitude`)
) ENGINE=MyISAM DEFAULT CHARSET=utf-8;
*/


<?php

require '/opt/libapi/main.php';

$api = new API;
$dir = $api->get_output_dir('tfl/bus/');
$api->get_data('http://www.tfl.gov.uk/tfl/gettingaround/maps/buses/tfl-bus-map/dotnet/AllRoutes.aspx');
foreach ($api->data->AllRoutes as $item){
  foreach(array(1,2) as $run){
    $file = $dir . $item . '-' . $run . '.js';
    debug($file);
    if (!file_exists($file))
      file_put_contents($file, $api->get_data('http://www.tfl.gov.uk/tfl/gettingaround/maps/buses/tfl-bus-map/dotnet/FullRoute.aspx', array('route' => $item, 'run' => $run), 'raw'));
  }
}


<?php

include("list.php");
include("get.php");
include("put.php");

$root = "files/";

$path_info = @$_SERVER["PATH_INFO"];
$path_bits = explode("/", trim($path_info, "/"));
$command = array_shift($path_bits);
$path = join("/", $path_bits);

switch($command) {
	case "get":
		echo get($path);
		break;
	case "put":
		echo put($path, @$_REQUEST["content"]);
		break;
	case "list":
		echo listFiles($path);
		break;
}

?>
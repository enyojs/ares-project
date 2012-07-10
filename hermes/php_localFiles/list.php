<?php

function listFiles($inPath) {
	//
	// constants
	//
	global $root;
	$nolisting = array("." => true, ".." => true);
	//
	// access fs
	// TODO: whitelist input (e.g. do not accept "..")
	//
	$list = scandir($root . $inPath);
	//
	// process paths
	//
	$path = $inPath;
	$fs_path = $root;
	if (strlen($path) > 0) {
		// ensure trailing slash
		if (substr($path, -1) !== "/") {
			$path = $path . "/";
		}
		// our root is not the FS root, so remove prefix slash
		if ($path[0] == "/") {
			$path = substr($path, 1);
		}
		//echo "$path<br/>";
		// path on filesystem 
		$fs_path .= $path;
	}
	//
	// generate listings
	//
	$results = array();
	foreach($list as $file) {
		//echo "$file<br/>";
		if (!@$nolisting[$file]) {
			$result = array("id" => $path.$file, "path" => $path.$file, "name" => $file, "isDir" => is_dir($fs_path.$file));
			array_push($results, $result);
		}
	};
	$result = "{" . '"contents"' . ": " . json_encode($results) . "}";
	//
	return $result;
}

?>
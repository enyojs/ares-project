<?php

function put($inPath, $inContent) {
	//
	// constants
	//
	global $root;
	//
	// input
	//
	$path = @$_REQUEST["path"];
	$content = @$_REQUEST["content"];
	//
	// access fs
	//
	//echo $root.$path;
	//echo "<hr/>";
	//echo $content;
	//echo "<hr/>";
	// TODO: error handling
	//
	return file_put_contents($root.$path, $content);
}

?>
<?php

function get($inPath) {
	// constants
	global $root;
	// access fs
	return file_get_contents($root.$inPath);
}

?>
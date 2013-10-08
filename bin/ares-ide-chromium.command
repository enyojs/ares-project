#!/bin/bash

# the folder this script is in
BIN_DIR=$(cd `dirname $0` && pwd)

# script we are going to run
SCRIPT=${BIN_DIR}/ares-ide.sh

# find bundle browser path
ARES_BUNDLE_BROWSER=${BIN_DIR}/chromium/Chromium.app

if [ -e $ARES_BUNDLE_BROWSER ]; then
	export ARES_BUNDLE_BROWSER
fi

# run script with -B + imported params
$SCRIPT -B $@

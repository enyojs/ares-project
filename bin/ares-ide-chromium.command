#!/bin/bash

# the folder this script is in
BIN_DIR=$(cd `dirname $0` && pwd)

# script we are going to run
SCRIPT=${BIN_DIR}/ares-ide.sh

# run script with -B + imported params
$SCRIPT -B $@

#!/bin/bash

# the folder this script is in
BIN_DIR=$(cd `dirname $0` && pwd)

# additional binaries are in
ARCH=$(uname -m)

# node script we are going to run
SCRIPT=${BIN_DIR}/../lib/node_modules/ares-ide/ide.js

# check file path
if [ ! -e $SCRIPT ]; then
    SCRIPT=${BIN_DIR}/../ide.js
fi

# path to node modules
export NODE_PATH=$(cd ${BIN_DIR}/../lib && pwd)

# run node script with imported params
PATH=$BIN_DIR/$ARCH:$PATH node $SCRIPT $@

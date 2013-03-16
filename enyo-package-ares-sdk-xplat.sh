#!/bin/bash


## enyo-package-ares-sdk-xplat.sh
## shell script build step for https://gecko.palm.com/jenkins/view/Enyo/job/enyo-package-ares-sdk-xplat/
## not intended to be run outside Jenkins environment!


# do our dependencies exist in the path?
# if not, update the path
if [ -z "`which npm`" ] ; then
  export PATH=$HOME/local/bin:$PATH
  if [ -z "`which npm`" ] ; then
    echo "*** can't find npm, exiting ***"
    exit 1
  fi
fi

# exit on any error
set -e

# download specified node binaries
NODE_DIST=http://nodejs.org/dist/$NODE_VERSION
NODE_DARWIN_X64=`curl -Ls $NODE_DIST | grep darwin-x64 | cut -d \> -f 2 | cut -d \< -f 1`
NODE_LINUX_X64=`curl -Ls $NODE_DIST | grep linux-x64 | cut -d \> -f 2 | cut -d \< -f 1`
NODE_WIN=node.exe
wget -nv $NODE_DIST/$NODE_DARWIN_X64
wget -nv $NODE_DIST/$NODE_LINUX_X64
wget -nv $NODE_DIST/$NODE_WIN

# untar and delete node tarballs
tar -xzf $NODE_DARWIN_X64
rm $NODE_DARWIN_X64
tar -xzf $NODE_LINUX_X64
rm $NODE_LINUX_X64

# move nodes to generic "node" dirs
NODE_DIR_DARWIN_X64=`basename $NODE_DARWIN_X64 .tar.gz`
rm -rf node-mac
mv $NODE_DIR_DARWIN_X64 node-mac
NODE_DIR_LINUX_X64=`basename $NODE_LINUX_X64 .tar.gz`
rm -rf node-linux
mv $NODE_DIR_LINUX_X64 node-linux
## pev extracts version info from Windows exe: http://sourceforge.net/projects/pev/
NODE_DIR_WIN="node-`pev -p $NODE_WIN`-win-x86"
rm -rf node-win
mkdir node-win
mv $NODE_WIN node-win

# record which node version we are including
touch node-mac/$NODE_DIR_DARWIN_X64
touch node-linux/$NODE_DIR_LINUX_X64
touch node-win/$NODE_DIR_WIN

# install node dependencies and package nodejs-module-webos-ipkg
pushd nodejs-module-webos-ipkg
npm install
pushd bin
cp ares-ide.sh ares-ide.command
popd #bin
PACK_IPKG=`npm pack`
popd #nodejs-module-webos-ipkg

# install node dependencies and package ares-project
pushd ares-project
npm install
PACK_ARES=`npm pack`
popd #ares-project

# combine Ares + ipkg
npm install ares-project/${PACK_ARES}
mv nodejs-module-webos-ipkg node_modules/ares-ide
pushd node_modules
pushd ares-ide
npm install nodejs-module-webos-ipkg/${PACK_IPKG}
popd #ares-ide

# create dist packages
for PLAT in mac linux win; do
  rm -rf ares-ide/nodejs-module-webos-ipkg/node
  mv -f ../node-$PLAT ares-ide/nodejs-module-webos-ipkg/node
  tar -czf ../ares-webos-ide-$PLAT.tgz ares-ide/
  tar -czf ../ares-webos-cli-$PLAT.tgz ares-ide/nodejs-module-webos-ipkg
done
rm ../ares-webos-ide-win.tgz
rm ../ares-webos-cli-win.tgz
zip -qr ../ares-webos-ide-win.zip ares-ide/
zip -qr ../ares-webos-cli-win.zip ares-ide/nodejs-module-webos-ipkg
popd #node_modules

echo "***** DONE! *****"
echo

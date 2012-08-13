#### How to import ACE source code ####

 $ git clone git://github.com/ajaxorg/ace.git # Do that outside of the ares-project tree
 $ cd ace
 $ npm install
 $ make build
 $ cp "ace/build/src" into "ares-project/lib/foss/ace/assets/build"
 $ update the other files like ChangeLog.txt, LICENSE, package.json, Readme.md

#### NOTE ####

Previously, all the tree from git://github.com/ajaxorg/ace.git was
copied under the directory "ares-project/lib/foss/ace/assets"

This is useless, so now only a few files and "build/src" are copied
under "ares-project/lib/foss/ace/assets" after the ace build is done.

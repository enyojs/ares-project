# Ares Test Suite … Work in progress …

# Overview

### Brief Description

* Ares Test Suite is a Test Package based on the enyo.TestSuite, enyo.TestRunner and enyo.TestReporter kinds, code available under lib/extra/test.

* Ares Test Suite collapses tests results. These results are displayed by the Ares Test Reporter window (yellow for running state, green for success, red for failure, expandable stack trace and logging for failures)

* Cross window messaging is done using window.postMessage. This is a method for safely enabling cross-origin communication.

* Ares Test Reporter window is spawned by Ares Ide when the Ares Ide is launched in mode test.

* Ares Test Suite code is available under test directory.

###### Warning: As work still in progress … current implementation may change ...

# Run

###### Pre-req: Create a AresTests directory under the root of your local file-system access declared in ide.json (by default Home or My Documents directory).

This is  temporary solution. This will be fixed by ENYO-1473 - Create an Ares Test Service.

## Syntax Execution

* Start the IDE server using the command: 'node ide.js'
* Wait message:
ARES IDE is now running at <http://127.0.0.1:9009/ide/ares/index.html> Press CTRL + C to shutdown
* Connect to the Ares Ide in mode test using Google Chrome or Chromium, URL is:
<http://127.0.0.1:9009/ide/ares/test.html>

## Tests Executed

#### One test group available
1. HermesFileSystemTest.

####Test Suite related to this group:

1. testGetServicesFromRegistry
2. testGetHomeFromServices
3. testPropfindAndCreateFolder
4. testPropfindAndCreateFile
5. testDeleteFile
6. testDeleteFolder

#### Execution Environment Tested

* Today sucessfully tested on Chrome/Chromium.

###### Will be tested later on Safari, Firefox, Opera, IE



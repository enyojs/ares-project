:: Created by npm, please don't edit manually.
@SET SCRIPT="%~dp0\.\node_modules\ares-ide\ide.js"

@IF NOT EXIST %SCRIPT% (
    @SET SCRIPT="%~dp0\..\ide.js"
) 

@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  %SCRIPT% %*
) ELSE (
  node  %SCRIPT% %*
)

@IF EXIST "%~dp0\chromium\chrome.exe" (
	@SET ARES_BUNDLE_BROWSER=%~dp0\chromium\chrome.exe
)
%~dps0\ares-ide.cmd -B %*

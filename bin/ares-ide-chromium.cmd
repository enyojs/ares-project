@IF EXIST "%~dp0\chromium\chrome.exe" (
	@SET ARES_BUNDLE_BROWSER=%~dp0\chromium\chrome.exe
)
"%~dp0\ares-ide.cmd" -B %*

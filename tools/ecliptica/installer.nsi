; Ecliptica Overlay 설치 파일 (NSIS). tools/ecliptica_release.py 가 VERSION·PAYLOAD·OUTFILE 을 넘겨서 빌드함
; 내 계정 폴더(%LOCALAPPDATA%\Programs)에 설치 → 관리자 권한 필요 없음, 앱 안 업데이트가 파일을 바꿀 수 있음
Unicode true
SetCompressor /SOLID lzma
RequestExecutionLevel user

!define APPNAME "Ecliptica Overlay"
!define REGKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\EclipticaOverlay"

Name "${APPNAME}"
OutFile "${OUTFILE}"
InstallDir "$LOCALAPPDATA\Programs\EclipticaOverlay"
BrandingText "${APPNAME} ${VERSION}"
VIProductVersion "${VERSION}.0"
VIAddVersionKey /LANG=0 "ProductName" "${APPNAME}"
VIAddVersionKey /LANG=0 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=0 "FileDescription" "${APPNAME} Setup"
VIAddVersionKey /LANG=0 "LegalCopyright" "kuruma"

!include "MUI2.nsh"
!include "LogicLib.nsh"
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_FINISHPAGE_RUN "$INSTDIR\EclipticaOverlay.exe"
!define MUI_FINISHPAGE_NOREBOOTSUPPORT

!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Korean"
!insertmacro MUI_LANGUAGE "Japanese"
!insertmacro MUI_LANGUAGE "English"

LangString RUNNING ${LANG_KOREAN} "Ecliptica Overlay가 켜져 있어요.$\n오버레이를 끄고(⚙ 설정 → 오버레이 끄기) 다시 시도를 눌러 주세요."
LangString RUNNING ${LANG_JAPANESE} "Ecliptica Overlay が起動中です。$\nオーバーレイを終了して(⚙ 設定 → オーバーレイを終了)再試行を押してください。"
LangString RUNNING ${LANG_ENGLISH} "Ecliptica Overlay is running.$\nQuit the overlay (⚙ Settings → Quit overlay) and press Retry."
LangString DEMO ${LANG_KOREAN} "Ecliptica Overlay (미리보기)"
LangString DEMO ${LANG_JAPANESE} "Ecliptica Overlay (デモ)"
LangString DEMO ${LANG_ENGLISH} "Ecliptica Overlay (Demo)"

; 켜져 있으면 파일을 못 바꾸므로 먼저 끄게 함 (앱이 만드는 뮤텍스로 확인)
!macro WAIT_CLOSED
  check_running:
    System::Call 'kernel32::OpenMutexW(i 0x00100000, i 0, w "Local\EclipticaOverlaySingleton") p .r0'
    ${If} $0 P<> 0
      System::Call 'kernel32::CloseHandle(p r0)'
      MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "$(RUNNING)" IDRETRY check_running
      Abort
    ${EndIf}
!macroend

Function .onInit
  !insertmacro WAIT_CLOSED
FunctionEnd

Function un.onInit
  !insertmacro WAIT_CLOSED
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "${PAYLOAD}\*"
  File "icon.ico"
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  CreateShortCut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\EclipticaOverlay.exe" "" "$INSTDIR\icon.ico"
  CreateDirectory "$SMPROGRAMS\${APPNAME}"
  CreateShortCut "$SMPROGRAMS\${APPNAME}\${APPNAME}.lnk" "$INSTDIR\EclipticaOverlay.exe" "" "$INSTDIR\icon.ico"
  CreateShortCut "$SMPROGRAMS\${APPNAME}\$(DEMO).lnk" "$INSTDIR\EclipticaOverlay-Demo.exe" "" "$INSTDIR\icon.ico"

  WriteRegStr HKCU "${REGKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${REGKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${REGKEY}" "Publisher" "kuruma"
  WriteRegStr HKCU "${REGKEY}" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${REGKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${REGKEY}" "URLInfoAbout" "https://chatmdgus.github.io/kuruma-downloads/"
  WriteRegStr HKCU "${REGKEY}" "UninstallString" '"$INSTDIR\Uninstall.exe"'
  WriteRegDWORD HKCU "${REGKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${REGKEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  Delete "$DESKTOP\${APPNAME}.lnk"
  RMDir /r "$SMPROGRAMS\${APPNAME}"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${REGKEY}"
SectionEnd

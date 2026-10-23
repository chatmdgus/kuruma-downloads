# kuruma-downloads

kuruma가 만든 프로그램 다운로드 페이지 (GitHub Pages).

- Kuruma Overlay: 릴리스 `overlay-latest` → `KurumaOverlay-Setup.exe` (kuruma-overlay 저장소의 GitHub Actions가 자동으로 올림)
- Ecliptica Overlay: `files/EclipticaOverlay-Setup.exe` (설치 파일, 내 계정 폴더에 설치) + `files/EclipticaOverlay.zip` (설치 없이 쓰는 압축본)
  - 앱 안 업데이트: 앱이 `files/ecliptica-latest.json`을 보고 새 버전이면 ⚙ 설정 창 맨 위에 "업데이트" 버튼 → `files/ecliptica-app.zip`(app 폴더 프로그램 파일만)을 받아 교체 후 재시작
  - 새 버전 올리기: 원본(C:\dev\EclipticaOverlay)의 `APP_VERSION`을 올리고 `python tools/ecliptica_release.py <폴더나 zip>` → 커밋. 보통은 이것만 하면 됨 (예전 설치 파일로 깐 사람도 켜자마자 업데이트됨)
  - 설치 파일도 새로 만들 때: `--setup --booth-out <폴더>` (NSIS makensis 필요, `MAKENSIS` 환경변수). 런타임·exe가 바뀌었으면 `--full`
  - 설치 파일 스크립트·아이콘: `tools/ecliptica/`

페이지는 GitHub API로 각 릴리스의 버전·크기·날짜를 읽어서 보여줌.

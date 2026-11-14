# kuruma-downloads

kuruma가 만든 프로그램 다운로드 페이지 (GitHub Pages).

- Kuruma Overlay: 릴리스 `overlay-latest` → `KurumaOverlay-Setup.exe` (kuruma-overlay 저장소의 GitHub Actions가 자동으로 올림)
- Ecliptica Overlay: `files/EclipticaOverlay-Setup.exe` (설치 파일, 내 계정 폴더에 설치) + `files/EclipticaOverlay.zip` (설치 없이 쓰는 압축본)
  - 앱 안 업데이트: 앱이 `files/ecliptica-latest.json`을 보고 새 버전이면 ⚙ 설정 창 맨 위에 "업데이트" 버튼 → `files/ecliptica-app.zip`(app 폴더 프로그램 파일만)을 받아 교체 후 재시작
  - 새 버전 올리기: 원본(C:\dev\EclipticaOverlay)의 `APP_VERSION`을 올리고 `python tools/ecliptica_release.py <폴더나 zip>` → 커밋. 보통은 이것만 하면 됨 (예전 설치 파일로 깐 사람도 켜자마자 업데이트됨)
  - 설치 파일도 새로 만들 때: `--setup --booth-out <폴더>` (NSIS makensis 필요, `MAKENSIS` 환경변수). 런타임·exe가 바뀌었으면 `--full`
  - 설치 파일 스크립트·아이콘: `tools/ecliptica/`
- VRC Translator: 처음 받는 zip은 릴리스 `translator-latest` → `VRCTranslator-Friends.zip` (GPU 파일 제외)
  - 앱 안 업데이트: 앱이 `files/translator-latest.json`(모든 파일 sha256 + 묶음 주소)을 보고 바뀐 파일이 든 묶음만 받음
    - `files/translator-app.zip`: exe 등 자주 바뀌는 작은 파일 (보통은 이것만)
    - 릴리스 `translator-core.zip`(라이브러리), `translator-gpu.zip`(CUDA, 원하는 사람만): 안 바뀌면 다시 안 올림
  - 새 버전 올리기: vrc-translator에서 `version.py` 올리고 빌드 → `python release.py --site <이 저장소>` → 안내대로 릴리스에 큰 파일(있을 때만) 올린 뒤 커밋·푸시

페이지는 GitHub API로 각 릴리스의 버전·크기·날짜를 읽어서 보여줌.

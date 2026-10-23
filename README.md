# kuruma-downloads

kuruma가 만든 프로그램 다운로드 페이지 (GitHub Pages).

- Kuruma Overlay: 릴리스 `overlay-latest` → `KurumaOverlay-Setup.exe` (kuruma-overlay 저장소의 GitHub Actions가 자동으로 올림)
- Ecliptica Overlay: `files/EclipticaOverlay.zip` (사이트에서 바로 받음)
  - 앱 안 업데이트: 앱이 `files/ecliptica-latest.json`을 보고 새 버전이면 우클릭 메뉴에 "업데이트"가 뜸 → `files/ecliptica-app.zip`(app 폴더 프로그램 파일만)을 받아 교체 후 재시작
  - 새 버전 올리기: 원본(C:\dev\EclipticaOverlay)의 `APP_VERSION`을 올리고 개인 설정 json·`app\data\icons`를 뺀 전체 zip을 만든 뒤 `python tools/ecliptica_release.py <zip>` → 커밋. 런타임·exe가 바뀌면 `--full`

페이지는 GitHub API로 각 릴리스의 버전·크기·날짜를 읽어서 보여줌.

# kuruma-downloads

kuruma가 만든 프로그램 다운로드 페이지 (GitHub Pages).

- Kuruma Overlay: 릴리스 `overlay-latest` → `KurumaOverlay-Setup.exe` (kuruma-overlay 저장소의 GitHub Actions가 자동으로 올림)
- Ecliptica Overlay: `files/EclipticaOverlay.zip` (사이트에서 바로 받음. 새 버전은 파일을 바꾸고 index.html의 data-version·data-bytes·data-date 수정)

페이지는 GitHub API로 각 릴리스의 버전·크기·날짜를 읽어서 보여줌.

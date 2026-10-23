"""Ecliptica Overlay 새 버전 올리기.

사용: python tools/ecliptica_release.py <EclipticaOverlay.zip 전체본>
- 전체 zip 안의 app/ecliptica_overlay.py 에서 APP_VERSION 을 읽음
- files/EclipticaOverlay.zip      : 전체본 (처음 받는 사람용)
- files/ecliptica-app.zip         : app 폴더 프로그램 파일만 (앱 안 업데이트용)
- files/ecliptica-latest.json     : 버전·주소·sha256 (앱이 이걸 보고 업데이트)
- index.html 의 data-version·data-bytes·data-date 도 갱신
런타임(runtime/)이나 exe 가 바뀐 버전이면 --full 을 붙임 → 앱은 다운로드 페이지를 열어 줌.
"""
import datetime, hashlib, io, json, os, re, shutil, sys, zipfile

SITE = "https://chatmdgus.github.io/kuruma-downloads/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = os.path.join(ROOT, "files")
# 앱 안 업데이트에 넣을 파일 (app 폴더 기준). 설정 json·아이콘은 절대 넣지 않음
APP_FILES = ["ecliptica_overlay.py", "data/upgrades_en.json"]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    full = "--full" in sys.argv
    src = args[0]
    z = zipfile.ZipFile(src)
    prefix = next(n for n in z.namelist() if n.endswith("app/ecliptica_overlay.py"))[: -len("app/ecliptica_overlay.py")]
    code = z.read(prefix + "app/ecliptica_overlay.py").decode("utf-8")
    version = re.search(r'^APP_VERSION = "([^"]+)"', code, re.M).group(1)
    bad = [n for n in z.namelist() if n.endswith("ecliptica_overlay.json") or "/icons/" in n and not n.endswith("/")]
    if bad:
        sys.exit("전체 zip에 개인 설정이나 아이콘이 들어 있음: " + ", ".join(bad[:5]))

    shutil.copyfile(src, os.path.join(FILES, "EclipticaOverlay.zip"))
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as out:
        for name in APP_FILES:
            out.writestr(name, z.read(prefix + "app/" + name))
    app_zip = buf.getvalue()
    with open(os.path.join(FILES, "ecliptica-app.zip"), "wb") as f:
        f.write(app_zip)
    manifest = {
        "version": version,
        "app_zip": SITE + "files/ecliptica-app.zip?v=" + version,
        "app_sha256": hashlib.sha256(app_zip).hexdigest(),
        "full": full,
        "full_zip": SITE + "files/EclipticaOverlay.zip",
    }
    with open(os.path.join(FILES, "ecliptica-latest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
        f.write("\n")

    size = os.path.getsize(os.path.join(FILES, "EclipticaOverlay.zip"))
    today = datetime.date.today().isoformat()
    p = os.path.join(ROOT, "index.html")
    html = open(p, encoding="utf-8").read()
    html, n = re.subn(r'data-version="v[^"]*" data-bytes="\d+" data-date="[^"]*"',
                      f'data-version="v{version}" data-bytes="{size}" data-date="{today}"', html)
    if n != 1:
        sys.exit("index.html 에서 Ecliptica data-version 을 못 찾음")
    open(p, "w", encoding="utf-8").write(html)
    print(f"v{version} 준비됨 (전체 {size:,} bytes, 업데이트 {len(app_zip):,} bytes, full={full})")


if __name__ == "__main__":
    main()

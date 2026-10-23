"""Ecliptica Overlay 새 버전 올리기.

사용:
  python tools/ecliptica_release.py <전체 zip 또는 폴더> [--setup] [--full] [--booth-out 폴더]

항상 만드는 것 (앱 안 업데이트용, 작음):
  files/ecliptica-app.zip      app 폴더 프로그램 파일만 (py + 사전)
  files/ecliptica-latest.json  버전·주소·sha256. 앱이 이걸 보고 업데이트함

--setup (처음 받는 사람용 파일도 새로 만듦. 런타임·exe가 바뀌었거나 가끔 갱신할 때):
  files/EclipticaOverlay-Setup.exe   설치 파일 (NSIS, 내 계정 폴더에 설치)
  files/EclipticaOverlay.zip         압축본 (설치 없이 쓰는 사람용)
  <booth-out>/EclipticaOverlay-Setup-<버전>.zip   Booth 에 올릴 zip (저장소 밖)
  index.html 의 data-version·data-bytes·data-date 갱신
  makensis 위치는 환경변수 MAKENSIS (Linux 는 NSISDIR 도)

--full: 런타임·exe 가 바뀐 버전. 앱은 다운로드 페이지를 열어 줌 (프로그램 파일만으로는 업데이트 불가)

설치 파일을 새로 안 만들어도, 예전 설치 파일로 깐 사람은 켜자마자 앱 안 업데이트로 최신이 됨.
"""
import datetime, hashlib, io, json, os, re, shutil, subprocess, sys, tempfile, zipfile

SITE = "https://chatmdgus.github.io/kuruma-downloads/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = os.path.join(ROOT, "files")
HERE = os.path.join(ROOT, "tools", "ecliptica")
APP_FILES = ["ecliptica_overlay.py", "data/upgrades_en.json"]   # 설정 json·아이콘은 절대 넣지 않음


def load_source(src, work):
    """zip 이든 폴더든 work/EclipticaOverlay 로 펼침"""
    dst = os.path.join(work, "EclipticaOverlay")
    if os.path.isdir(src):
        shutil.copytree(src, dst)
    else:
        z = zipfile.ZipFile(src)
        z.extractall(work)
        top = {n.split("/")[0] for n in z.namelist()}
        if top != {"EclipticaOverlay"}:
            sys.exit("zip 안 최상위 폴더가 EclipticaOverlay 가 아님: " + ", ".join(sorted(top)))
    for bad in ("app/ecliptica_overlay.json", "app/error.log", "app/overlay_command.txt"):
        p = os.path.join(dst, *bad.split("/"))
        if os.path.exists(p):
            os.remove(p)   # 개인 설정·로그는 빼고 배포
    shutil.rmtree(os.path.join(dst, "app", "data", "icons"), ignore_errors=True)
    for dp, dn, fn in os.walk(dst):
        for f in fn:
            if f.endswith((".bak", ".pyc")):
                os.remove(os.path.join(dp, f))
        if "__pycache__" in dn:
            shutil.rmtree(os.path.join(dp, "__pycache__"))
            dn.remove("__pycache__")
    return dst


def zip_dir(folder, out_path, arc_root):
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        for dp, dn, fn in os.walk(folder):
            dn.sort()
            rel = os.path.relpath(dp, folder)
            z.write(dp, os.path.normpath(os.path.join(arc_root, rel)).replace("\\", "/") + "/")
            for f in sorted(fn):
                z.write(os.path.join(dp, f), os.path.normpath(os.path.join(arc_root, rel, f)).replace("\\", "/"))


def main():
    args = sys.argv[1:]
    setup, full = "--setup" in args, "--full" in args
    booth_out = None
    if "--booth-out" in args:
        booth_out = args[args.index("--booth-out") + 1]
    src = next(a for a in args if not a.startswith("--") and a != booth_out)

    work = tempfile.mkdtemp()
    try:
        app_root = load_source(src, work)
        code = open(os.path.join(app_root, "app", "ecliptica_overlay.py"), encoding="utf-8").read()
        version = re.search(r'^APP_VERSION = "([^"]+)"', code, re.M).group(1)

        # 앱 안 업데이트 묶음
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as out:
            for name in APP_FILES:
                out.write(os.path.join(app_root, "app", *name.split("/")), name)
        app_zip = buf.getvalue()
        open(os.path.join(FILES, "ecliptica-app.zip"), "wb").write(app_zip)
        manifest = {
            "version": version,
            "app_zip": SITE + "files/ecliptica-app.zip?v=" + version,
            "app_sha256": hashlib.sha256(app_zip).hexdigest(),
            "full": full,
            "setup": SITE + "files/EclipticaOverlay-Setup.exe",
        }
        with open(os.path.join(FILES, "ecliptica-latest.json"), "w", encoding="utf-8") as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
            f.write("\n")
        msg = [f"v{version} 앱 업데이트 {len(app_zip):,} bytes (full={full})"]

        if setup:
            makensis = os.environ.get("MAKENSIS", "makensis")
            setup_path = os.path.join(FILES, "EclipticaOverlay-Setup.exe")
            nsi_dir = os.path.join(work, "nsi")
            shutil.copytree(HERE, nsi_dir)
            subprocess.run([makensis, "-V2", f"-DVERSION={version}", f"-DPAYLOAD={app_root}",
                            f"-DOUTFILE={setup_path}", os.path.join(nsi_dir, "installer.nsi")], check=True)
            zip_dir(app_root, os.path.join(FILES, "EclipticaOverlay.zip"), "EclipticaOverlay")
            size = os.path.getsize(setup_path)
            if booth_out:
                os.makedirs(booth_out, exist_ok=True)
                bz = os.path.join(booth_out, f"EclipticaOverlay-Setup-{version}.zip")
                with zipfile.ZipFile(bz, "w", zipfile.ZIP_STORED) as z:
                    z.write(setup_path, "EclipticaOverlay-Setup.exe")
                msg.append(f"Booth용 {bz}")
            p = os.path.join(ROOT, "index.html")
            html = open(p, encoding="utf-8").read()
            html, n = re.subn(r'data-version="v[^"]*" data-bytes="\d+" data-date="[^"]*"',
                              f'data-version="v{version}" data-bytes="{size}" data-date="{datetime.date.today().isoformat()}"', html)
            if n != 1:
                sys.exit("index.html 에서 Ecliptica data-version 을 못 찾음")
            open(p, "w", encoding="utf-8").write(html)
            msg.append(f"설치 파일 {size:,} bytes")
        print(" · ".join(msg))
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()

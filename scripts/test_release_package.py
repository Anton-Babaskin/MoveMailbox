import hashlib
import importlib.util
import os
from pathlib import Path
import stat
import subprocess
import tarfile
import tempfile
import unittest
import warnings
import zipfile

spec = importlib.util.spec_from_file_location("smoke_release", Path(__file__).with_name("smoke-release.py"))
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)

TAG = "v0.5.0-rc.1"
COMMIT = "a" * 40


class ReleasePackageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.directory = Path(self.temp.name)

    def make_zip(self, changes=None):
        target = "windows/amd64"
        root = release.package_name(TAG, target)
        files = {name: b"instructions" for name in release.REQUIRED}
        files.update({name: b"launcher" for name in
                      ("START-DEMO.cmd", "START-DEMO-DEBUG.cmd", "START-REAL.cmd", "README-RU.txt")})
        files["movemailbox.exe"] = b"fixture only, not an executable"
        files["BUILD-INFO.txt"] = f"Version: {TAG}\nCommit: {COMMIT}\nPlatform: {target}\n".encode()
        files["BUILD-DEPENDENCIES.txt"] = b"github.com/Anton-Babaskin/MoveMailbox modernc.org/sqlite GOOS=windows GOARCH=amd64"
        if changes:
            files.update(changes)
        path = self.directory / (root + ".zip")
        with zipfile.ZipFile(path, "w") as archive:
            for name, data in files.items():
                archive.writestr(root + "/" + name, data)
        return path

    def test_complete_package_and_identity(self):
        path = self.make_zip()
        self.assertTrue(release.validate_package(path, TAG, COMMIT, "windows/amd64"))
        with self.assertRaises(ValueError):
            release.validate_package(path, TAG, "b" * 40, "windows/amd64")

    def test_reject_runtime_files_and_traversal(self):
        for name in ("history.db", ".env", "../secret"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                release.validate_package(self.make_zip({name: b"unwanted"}), TAG, COMMIT, "windows/amd64")

    def test_reject_wrong_platform_metadata(self):
        path = self.make_zip({"BUILD-DEPENDENCIES.txt": b"GOOS=linux GOARCH=arm64"})
        with self.assertRaises(ValueError):
            release.validate_package(path, TAG, COMMIT, "windows/amd64")

    def test_reject_duplicate_members_and_symlinks(self):
        path = self.make_zip()
        root = release.package_name(TAG, "windows/amd64")
        with zipfile.ZipFile(path, "a") as archive:
            link = zipfile.ZipInfo(root + "/link")
            link.create_system = 3
            link.external_attr = (stat.S_IFLNK | 0o777) << 16
            archive.writestr(link, "README.md")
        with self.assertRaises(ValueError):
            release.inventory(path, root)
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr(root + "/README.md", b"one")
            with warnings.catch_warnings():
                warnings.simplefilter("ignore", UserWarning)
                archive.writestr(root + "/README.md", b"two")
        with self.assertRaises(ValueError):
            release.inventory(path, root)

    def test_reject_tar_special_files(self):
        path = self.directory / "fixture.tar.gz"
        with tarfile.open(path, "w:gz") as archive:
            link = tarfile.TarInfo("package/link")
            link.type = tarfile.SYMTYPE
            link.linkname = "/etc/passwd"
            archive.addfile(link)
        with self.assertRaises(ValueError):
            release.inventory(path, "package")

    def test_checksum_inventory_and_tampering(self):
        lines = []
        for target in release.TARGETS:
            name = release.package_name(TAG, target) + (".zip" if target.startswith("windows/") else ".tar.gz")
            (self.directory / name).write_bytes(b"fixture")
            lines.append(hashlib.sha256(b"fixture").hexdigest() + "  " + name)
        sums = self.directory / "SHA256SUMS.txt"
        sums.write_text("\n".join(lines) + "\n")
        self.assertEqual(len(release.verify_checksums(self.directory, TAG)), 5)
        (self.directory / (release.package_name(TAG, "linux/amd64") + ".tar.gz")).write_bytes(b"changed")
        with self.assertRaises(ValueError):
            release.verify_checksums(self.directory, TAG)
        sums.write_text("\n".join(lines[:-1]) + "\n")
        with self.assertRaises(ValueError):
            release.verify_checksums(self.directory, TAG)

    @unittest.skipIf(os.name == "nt", "release build script runs on the Linux builder")
    def test_stable_build_refuses_missing_license_before_compiling(self):
        script = Path(__file__).with_name("build-release.sh").resolve()
        result = subprocess.run(["bash", str(script)], cwd=self.directory,
                                env=os.environ | {"RELEASE_TAG": "v1.0.0", "GITHUB_SHA": COMMIT},
                                capture_output=True, text=True, timeout=5)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("owner-approved LICENSE", result.stderr)
        self.assertFalse((self.directory / "dist").exists())


if __name__ == "__main__":
    unittest.main()

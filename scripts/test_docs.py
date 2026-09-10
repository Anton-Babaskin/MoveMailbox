"""Regression tests for the no-network documentation checker."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("check_docs", Path(__file__).with_name("check-docs.py"))
docs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(docs)


class DocumentationChecks(unittest.TestCase):
    def test_external_and_anchor_links_are_not_files(self):
        source = docs.ROOT / "README.md"
        self.assertIsNone(docs.local_target(source, "https://example.com/page"))
        self.assertIsNone(docs.local_target(source, "#getting-started"))
        self.assertEqual(docs.local_target(source, "docs/README.md"), docs.ROOT / "docs/README.md")

    def test_path_escape_is_rejected(self):
        with self.assertRaises(ValueError):
            docs.local_target(docs.ROOT / "README.md", "../outside.md")

    def test_passive_svg_and_unsafe_variants(self):
        valid = '<svg xmlns="http://www.w3.org/2000/svg"><title>Diagram</title><desc>Mail path</desc>{}</svg>'
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "test.svg"
            path.write_text(valid.format('<path fill="url(#accent)"/>'), encoding="utf-8")
            docs.check_svg(path)
            for unsafe in [
                '<script>alert(1)</script>',
                '<foreignObject/>',
                '<path onload="alert(1)"/>',
                '<image href="https://example.com/a.png"/>',
                '<path fill="url(https://example.com/a.svg)"/>',
            ]:
                with self.subTest(unsafe=unsafe):
                    path.write_text(valid.format(unsafe), encoding="utf-8")
                    with self.assertRaises(ValueError):
                        docs.check_svg(path)

    def test_repository_artwork_has_accessible_descriptions(self):
        for path in (docs.ROOT / "docs" / "assets").glob("*.svg"):
            with self.subTest(path=path.name):
                docs.check_svg(path)


if __name__ == "__main__":
    unittest.main()

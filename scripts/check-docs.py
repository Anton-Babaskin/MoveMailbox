#!/usr/bin/env python3
"""Check repository documentation links and passive, self-contained SVG artwork.

Uses only the standard library and git. No network requests; external link
availability, Markdown anchors and visual layout must be reviewed separately.
"""
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
LINK = re.compile(r"!?\[[^\]\n]*\]\(([^\s)]+)(?:\s+[^)]*)?\)")
HTML_LINK = re.compile(r"""(?:src|href)=["']([^"']+)["']""")
FORBIDDEN = {"script", "foreignObject", "iframe", "animate", "animateMotion", "animateTransform", "set"}


def local_target(source, value):
    value = value.strip("<>")
    url = urlsplit(value)
    if url.scheme or url.netloc or not url.path:
        return None
    target = (source.parent / unquote(url.path)).resolve()
    if not target.is_relative_to(ROOT):
        raise ValueError("link leaves repository")
    return target


def check_svg(path):
    raw = path.read_text(encoding="utf-8")
    if "<!DOCTYPE" in raw or "<!ENTITY" in raw:
        raise ValueError("SVG cannot declare entities")
    root = ET.fromstring(raw)
    if root.tag != "{http://www.w3.org/2000/svg}svg":
        raise ValueError("expected SVG root")
    if not root.findtext("{http://www.w3.org/2000/svg}title"):
        raise ValueError("SVG needs an accessible title")
    if not root.findtext("{http://www.w3.org/2000/svg}desc"):
        raise ValueError("SVG needs an accessible description")
    for element in root.iter():
        name = element.tag.split("}")[-1]
        if name in FORBIDDEN or name == "style":
            raise ValueError("SVG must be static and contain no executable/embedded content")
        for key, value in element.attrib.items():
            key = key.split("}")[-1]
            if key.lower().startswith("on"):
                raise ValueError("SVG event handler is forbidden")
            if key == "href" and not value.startswith("#"):
                raise ValueError("SVG external reference is forbidden")
            if "url(" in value and not re.fullmatch(r"url\(#[\w-]+\)", value):
                raise ValueError("SVG paint reference must be internal")


def main():
    listed = subprocess.run(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard",
         "--", "*.md", "docs", ".github"],
        cwd=ROOT, check=True, capture_output=True,
    ).stdout.decode("utf-8").split("\0")
    files = sorted({ROOT / name for name in listed if name and
                    not name.startswith("website/") and
                    ("/" not in name or name.startswith(("docs/", ".github/")))})
    errors, checked = [], 0
    for path in files:
        if path.suffix == ".md":
            # Fenced examples are documentation, not repository navigation.
            prose = re.sub(r"```.*?```", "", path.read_text(encoding="utf-8"), flags=re.S)
            for value in LINK.findall(prose) + HTML_LINK.findall(prose):
                try:
                    target = local_target(path, value)
                    if target is not None:
                        checked += 1
                        if not target.exists():
                            errors.append(f"{path.relative_to(ROOT)}: missing {value}")
                except ValueError as error:
                    errors.append(f"{path.relative_to(ROOT)}: {error}: {value}")
        elif path.suffix == ".svg" and path.parent == ROOT / "docs" / "assets":
            try:
                check_svg(path)
            except (ValueError, ET.ParseError) as error:
                errors.append(f"{path.relative_to(ROOT)}: {error}")
    for error in errors:
        print(error, file=sys.stderr)
    if errors:
        return 1
    print(f"PASS: {checked} local link references; documentation SVGs are passive and self-contained.")
    print("External URLs, anchors and visual layout are not checked by this script.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

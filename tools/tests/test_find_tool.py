"""Regression tests for find-tool.

Run: python3 -m pytest tools/tests/  (pytest optional — also runs with `python3 tools/tests/test_find_tool.py`)
"""
from __future__ import annotations

import importlib.util
import importlib.machinery
import sys
import tempfile
import unicodedata
from pathlib import Path

TOOL = Path(__file__).resolve().parents[1] / "find-tool"
loader = importlib.machinery.SourceFileLoader("find_tool", str(TOOL))
spec = importlib.util.spec_from_loader("find_tool", loader)
assert spec is not None
ft = importlib.util.module_from_spec(spec)
sys.modules["find_tool"] = ft
loader.exec_module(ft)


def _make_fixture(tmp: Path) -> Path:
    """Build a tiny fake ~/src/ tree and return its root."""
    root = tmp / "src"
    (root / "10_apps" / "alpha").mkdir(parents=True)
    (root / "70_プラッと" / "platto-automation" / "casting").mkdir(parents=True)
    (root / "_archive" / "old").mkdir(parents=True)
    (root / "devlog").mkdir()

    (root / "10_apps" / "alpha" / "CLAUDE.md").write_text(
        "# alpha\n\nThis is an alpha repo using whisper for transcription.\n",
        encoding="utf-8",
    )
    (root / "70_プラッと" / "platto-automation" / "casting" / "CLAUDE.md").write_text(
        "# casting-research\n\nplatto casting flow.\n",
        encoding="utf-8",
    )
    (root / "10_apps" / "alpha" / "README.md").write_text(
        "---\nname: alpha-readme\ndescription: Alpha README for whisper testing\n---\n# alpha readme\n",
        encoding="utf-8",
    )
    # Should be pruned
    (root / "_archive" / "old" / "CLAUDE.md").write_text("# archived\nwhisper here\n", encoding="utf-8")
    (root / "devlog" / "2026-05-27.md").write_text("# devlog\nworked on whisper today\n", encoding="utf-8")
    return root


def test_recursive_glob_finds_deep_claude_md(monkeypatch):
    with tempfile.TemporaryDirectory() as td:
        root = _make_fixture(Path(td))
        monkeypatch.setattr(ft, "SRC", root)
        monkeypatch.setattr(ft, "KIND_SPECS", {
            "claude": [(root, "CLAUDE.md", True)],
        })
        files = ft.collect_files("claude")
        names = {str(p.relative_to(root)) for p in files}
        assert "10_apps/alpha/CLAUDE.md" in names
        assert "70_プラッと/platto-automation/casting/CLAUDE.md" in names, "deep CLAUDE.md must be reachable"
        assert all("_archive" not in p.parts for p in files), "_archive must be pruned"


def test_filename_beats_body_only(monkeypatch):
    """Filename match (+100) must outscore body-only hits."""
    with tempfile.TemporaryDirectory() as td:
        root = _make_fixture(Path(td))
        (root / "whisper-tool.md").write_text("just body\n", encoding="utf-8")
        monkeypatch.setattr(ft, "HOME", root.parent)
        monkeypatch.setattr(ft, "SRC", root)
        monkeypatch.setattr(ft, "KIND_SPECS", {
            "claude": [(root, "CLAUDE.md", True)],
            "devlog": [(root / "devlog", "*.md", True)],
            "any": [(root, "whisper-tool.md", False)],
        })
        hits = ft.collect(["claude", "devlog", "any"], ["whisper"])
        body_only = [h for h in hits if h.path.name == "2026-05-27.md"]
        filename_match = [h for h in hits if h.path.name == "whisper-tool.md"]
        assert filename_match, "basename-match file must be in results"
        assert body_only, "body-only file must be in results"
        assert filename_match[0].score > body_only[0].score


def test_frontmatter_description_beats_body_only(monkeypatch):
    """frontmatter description match (+40) must outscore body-only hits (+5..50)
    when body has at most one match line."""
    with tempfile.TemporaryDirectory() as td:
        root = Path(td) / "src"
        root.mkdir()
        # File A: keyword only in frontmatter description, body has one mention
        (root / "alpha").mkdir()
        (root / "alpha" / "README.md").write_text(
            "---\nname: alpha\ndescription: This is about widgets\n---\n# alpha\nbody mentions widgets once.\n",
            encoding="utf-8",
        )
        # File B: keyword only in body, 1 line
        (root / "beta").mkdir()
        (root / "beta" / "README.md").write_text("# beta\nbody mentions widgets once and only here.\n", encoding="utf-8")
        monkeypatch.setattr(ft, "HOME", root.parent)
        monkeypatch.setattr(ft, "SRC", root)
        monkeypatch.setattr(ft, "KIND_SPECS", {"readme": [(root, "README.md", True)]})
        hits = ft.collect(["readme"], ["widgets"])
        by_name = {h.path.parent.name: h for h in hits}
        assert "alpha" in by_name and "beta" in by_name
        assert by_name["alpha"].score > by_name["beta"].score, "frontmatter description hit must outscore body-only"


def test_nfc_normalization_japanese_keyword(monkeypatch):
    with tempfile.TemporaryDirectory() as td:
        root = _make_fixture(Path(td))
        monkeypatch.setattr(ft, "HOME", root.parent)
        monkeypatch.setattr(ft, "SRC", root)
        monkeypatch.setattr(ft, "KIND_SPECS", {
            "claude": [(root, "CLAUDE.md", True)],
        })
        # NFD-decomposed keyword should still match the NFC-encoded path content
        kw_nfd = unicodedata.normalize("NFD", "プラッと")
        kw_norm = ft._norm(kw_nfd)
        hits = ft.collect(["claude"], [kw_norm])
        assert any("プラッと" in str(h.path) for h in hits), "NFC normalization must let NFD keyword match NFC content"


def test_relative_path_match_does_not_leak_home_segments(monkeypatch):
    """Searching for the temp-dir's own ancestor segment must NOT match all files.
    Tests that path-match is relative to HOME, not absolute."""
    with tempfile.TemporaryDirectory() as td:
        root = _make_fixture(Path(td))
        monkeypatch.setattr(ft, "HOME", root.parent)  # so relpath strips the temp-prefix
        monkeypatch.setattr(ft, "SRC", root)
        monkeypatch.setattr(ft, "KIND_SPECS", {
            "claude": [(root, "CLAUDE.md", True)],
        })
        # The HOME ancestor (Path(td)) might contain something like "var" or
        # "T" on macOS — assert these do NOT cause every file to match.
        for leak_candidate in ["var", "private", "tmp", "folders"]:
            if leak_candidate in str(root.parent).lower():
                hits = ft.collect(["claude"], [leak_candidate])
                assert not hits, f"path-match leaked HOME ancestor '{leak_candidate}'"
                break


def test_crlf_frontmatter_extracted():
    text = "---\r\nname: crlf-test\r\ndescription: a windows file\r\n---\r\n# body\r\n"
    title, desc = ft.extract_meta(text)
    assert title == "crlf-test"
    assert desc == "a windows file"


def test_and_match_requires_all_keywords(monkeypatch):
    """Positive case: alpha CLAUDE matches BOTH 'whisper' + 'alpha'."""
    with tempfile.TemporaryDirectory() as td:
        root = _make_fixture(Path(td))
        monkeypatch.setattr(ft, "HOME", root.parent)
        monkeypatch.setattr(ft, "SRC", root)
        monkeypatch.setattr(ft, "KIND_SPECS", {
            "claude": [(root, "CLAUDE.md", True)],
        })
        hits = ft.collect(["claude"], ["whisper", "alpha"])
        assert hits, "AND match should find at least the alpha file"
        for h in hits:
            text = h.path.read_text(encoding="utf-8").lower()
            relpath = str(h.path.relative_to(root.parent)).lower()
            assert "whisper" in (text + relpath)
            assert "alpha" in (text + relpath)


def test_and_match_negative_one_keyword_only(monkeypatch):
    """Negative case: a file with only one keyword (neither in path nor body)
    must NOT appear in the AND-match results."""
    with tempfile.TemporaryDirectory() as td:
        root = _make_fixture(Path(td))
        # The casting CLAUDE.md has 'platto casting' in body, neither 'whisper'
        # nor 'alpha' anywhere in body or path-rel-to-HOME.
        monkeypatch.setattr(ft, "HOME", root.parent)
        monkeypatch.setattr(ft, "SRC", root)
        monkeypatch.setattr(ft, "KIND_SPECS", {
            "claude": [(root, "CLAUDE.md", True)],
        })
        hits = ft.collect(["claude"], ["whisper", "alpha"])
        for h in hits:
            assert "casting" not in str(h.path), (
                f"casting CLAUDE.md should NOT match AND(whisper, alpha) but got {h.path}"
            )


if __name__ == "__main__":
    # Stand-alone runner so the test passes without pytest installed.
    class _Monkey:
        def __init__(self):
            self._patches: list[tuple[object, str, object]] = []
        def setattr(self, target, name, value):
            self._patches.append((target, name, getattr(target, name)))
            setattr(target, name, value)
        def undo(self):
            for target, name, old in reversed(self._patches):
                setattr(target, name, old)

    # Auto-discover fixture tests (those that accept a monkeypatch arg)
    fixture_tests = [
        v for k, v in sorted(globals().items())
        if k.startswith("test_") and callable(v) and k != "test_crlf_frontmatter_extracted"
    ]
    failed = 0
    for t in fixture_tests:
        mk = _Monkey()
        try:
            t(mk)
            print(f"PASS {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"FAIL {t.__name__}: {e}")
        finally:
            mk.undo()
    # CRLF test takes no fixture
    try:
        test_crlf_frontmatter_extracted()
        print("PASS test_crlf_frontmatter_extracted")
    except AssertionError as e:
        failed += 1
        print(f"FAIL test_crlf_frontmatter_extracted: {e}")

    sys.exit(1 if failed else 0)

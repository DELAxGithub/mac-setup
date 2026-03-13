#!/usr/bin/env python3
"""
sync-menubar: ~/src/ Git sync status in the macOS menu bar.

Periodically scans all git repos under ~/src/ and shows:
- 🔴 number of repos with uncommitted/unpushed changes
- 🟢 all clean

Click to see per-repo status. Push/Pull open a terminal with /sync.

Install: pip install rumps
Run:     python3 ~/src/mac-setup/tools/sync-menubar.py
Auto:    launchctl load ~/Library/LaunchAgents/com.delaxpro.sync-menubar.plist
"""

import os
import subprocess
import rumps

SRC_DIR = os.path.expanduser("~/src")
CHECK_INTERVAL = 300  # seconds (5 min)


def run_git(repo_path, *args):
    """Run a git command and return stdout, or None on error."""
    try:
        r = subprocess.run(
            ["git", "-C", repo_path] + list(args),
            capture_output=True, text=True, timeout=10,
        )
        return r.stdout.strip() if r.returncode == 0 else None
    except Exception:
        return None


def scan_repos():
    """Scan ~/src/ for git repos and return their status."""
    repos = []
    for name in sorted(os.listdir(SRC_DIR)):
        path = os.path.join(SRC_DIR, name)
        if not os.path.isdir(os.path.join(path, ".git")):
            continue

        # Dirty files
        status = run_git(path, "status", "--porcelain")
        dirty = len(status.splitlines()) if status else 0

        # Unpushed commits
        unpushed_out = run_git(path, "rev-list", "--count", "@{u}..HEAD")
        unpushed = int(unpushed_out) if unpushed_out and unpushed_out.isdigit() else 0

        # Behind remote
        run_git(path, "fetch", "--quiet")
        behind_out = run_git(path, "rev-list", "--count", "HEAD..@{u}")
        behind = int(behind_out) if behind_out and behind_out.isdigit() else 0

        repos.append({
            "name": name,
            "path": path,
            "dirty": dirty,
            "unpushed": unpushed,
            "behind": behind,
        })
    return repos


def status_icon(repo):
    if repo["dirty"] > 0 or repo["unpushed"] > 0:
        return "🔴"
    if repo["behind"] > 0:
        return "🔵"
    return "🟢"


def status_detail(repo):
    parts = []
    if repo["dirty"]:
        parts.append(f"{repo['dirty']} dirty")
    if repo["unpushed"]:
        parts.append(f"{repo['unpushed']} unpushed")
    if repo["behind"]:
        parts.append(f"{repo['behind']} behind")
    return ", ".join(parts) if parts else "clean"


def open_terminal_with(cmd):
    """Open Terminal.app and run a command."""
    script = f'tell application "Terminal" to do script "{cmd}"'
    subprocess.Popen(["osascript", "-e", script])


class SyncMenuBarApp(rumps.App):
    def __init__(self):
        super().__init__("🔄", quit_button=None)
        self.repos = []
        self.menu = [
            rumps.MenuItem("Scanning..."),
            None,  # separator
            rumps.MenuItem("Sync Push", callback=self.sync_push),
            rumps.MenuItem("Sync Pull", callback=self.sync_pull),
            None,
            rumps.MenuItem("Quit", callback=rumps.quit_application),
        ]
        # Initial scan after 2 seconds (let app start first)
        rumps.Timer(self.initial_scan, 2).start()
        # Periodic scan
        self.timer = rumps.Timer(self.refresh, CHECK_INTERVAL)
        self.timer.start()

    def initial_scan(self, _):
        self.refresh(None)

    def refresh(self, _):
        self.repos = scan_repos()
        dirty_count = sum(1 for r in self.repos if r["dirty"] > 0 or r["unpushed"] > 0)
        behind_count = sum(1 for r in self.repos if r["behind"] > 0)

        # Update title
        if dirty_count > 0:
            self.title = f"🔴{dirty_count}"
        elif behind_count > 0:
            self.title = f"🔵{behind_count}"
        else:
            self.title = "🟢"

        # Rebuild menu: remove old repo items, keep action items
        keys_to_remove = [k for k in self.menu.keys() if k not in (
            "Sync Push", "Sync Pull", "Quit", None
        )]
        for k in keys_to_remove:
            del self.menu[k]

        # Insert repo items at the top
        for i, repo in enumerate(self.repos):
            icon = status_icon(repo)
            detail = status_detail(repo)
            label = f"{icon} {repo['name']}  ({detail})"
            item = rumps.MenuItem(label)
            item.set_callback(None)
            self.menu.insert_before("Sync Push", item)

        # Insert separator before actions
        if self.repos:
            self.menu.insert_before("Sync Push", None)

    def sync_push(self, _):
        open_terminal_with("cd ~/src && claude /sync push")

    def sync_pull(self, _):
        open_terminal_with("cd ~/src && claude /sync pull")


if __name__ == "__main__":
    SyncMenuBarApp().run()

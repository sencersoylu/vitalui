# Qt Migration — Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a new PySide6 + QML application at `/Users/sencersoylu/Projects/MY_APP_QT/` that opens a themed fullscreen window (Phase 0) and exposes the full `AppState` plus four async clients — PLC, B-Control, Vital-Signs, REST — backing the future Dashboard page (Phase 1). No UI panels yet; Phase 2 starts after this plan.

**Architecture:** Single Python process. `qasync` bridges Qt's event loop and `asyncio` so `python-socketio` + `httpx` share the GUI loop. State lives in a single `AppState(QObject)` exposed to QML as `appState`. Network clients are also `QObject`s exposed to QML, so QML can call `plcClient.writeRegister(...)` directly.

**Tech Stack:** Python 3.11+, PySide6 6.6+, qasync 0.27+, python-socketio[asyncio_client] 5.11+, httpx 0.27+, pytest, pytest-asyncio, respx.

**Source-of-truth references** (the engineer should keep these open):
- Spec: `/Users/sencersoylu/Projects/MY_APP/docs/superpowers/specs/2026-05-29-qt-migration-design.md`
- React store (state model): `/Users/sencersoylu/Projects/MY_APP/renderer/store.ts`
- React dashboard (socket events): `/Users/sencersoylu/Projects/MY_APP/renderer/pages/dashboard.tsx`
- React vital-signs (vitals client): `/Users/sencersoylu/Projects/MY_APP/renderer/pages/home.tsx`
- React REST API: `/Users/sencersoylu/Projects/MY_APP/renderer/api/*.ts`
- PLC `data[]` index map: memory file `reference_socket_data_mapping.md` in `~/.claude/projects/-Users-sencersoylu-Projects-MY-APP/memory/`

**Spec deltas discovered while reading the React code + memory** (apply these in the plan, don't repeat the spec mistake):
1. `anteFssWarning: bool` exists in `renderer/store.ts:115` but was missed in spec §3.2. Include it.
2. `darkMode` default is `true` (`store.ts:170`), not `false`.
3. **Chiller comm-error marker is `data[27] === 10`, NOT `data[28]`** (memory file "Chiller link / run state (2026-05-26)"). The `store.ts:56` comment is misleading.
4. **Chiller set temp = `data[28] / 10`** when `data[27] !== 10`.
5. **Chiller running = `(data[29] & 1) === 1`**. The `running` field on the `chillerData` event is intentionally **ignored** — only its `currentTemp / 10` is used.
6. **Air tank pressure moved from `data[8]` (0–16 bar) to `data[30]` (0–400 bar)** on 2026-05-23. Use `data[30]`.
7. **Data array length:** ≥31 elements in current firmware. The plan must access higher indices safely with bounds checks.
8. **Chamber sensor fields** (`mainPressure`, `mainO2`, `mainTemp`, `mainHumidity`, `antePressure`, `anteO2`, `anteTemp`, `anteHumidity`, `techO2Pressure`, `anteFssNitrogenPressure`) are NOT in the Zustand store — they were kept in component-local state. The Qt port hoists them into `AppState` so QML pages can bind to them uniformly.
9. **`hp1Status` does NOT come from PLC `data[]`** — it's derived from B-Control telemetry (`status.operating` with `no === 3`). Phase 1 leaves `hp1Status` at its default; B-Control consumer in a later phase wires it.
10. **Raw passthrough vs. calibration:** Phase 1 stores **raw PLC integers** into AppState. The Zustand app applies per-sensor `linearConversion(...)` using calibration fetched from `json.php?i={main,tech}`. Phase 2 introduces the calibration layer — until then QML bindings see raw values.

---

## File Structure

After this plan, `MY_APP_QT/` will contain:

```
MY_APP_QT/
├── .gitignore
├── .python-version
├── README.md
├── pyproject.toml
├── main.py
├── app/
│   ├── __init__.py
│   ├── config.py           # URLs (PLC, B-Control, REST, vitals)
│   ├── state.py            # AppState QObject (single source of state)
│   ├── plc_data_map.py     # 27-element data[] index → field name + converter
│   ├── plc_client.py       # Socket.io :4000 — chamber/tech PLC
│   ├── bcontrol_client.py  # Socket.io :3001 — B-Control bridge
│   ├── vitals_client.py    # Socket.io (configurable URL) — vital signs
│   └── rest_client.py      # httpx async REST client
├── qml/
│   ├── Main.qml            # ApplicationWindow + F11 + empty Loader
│   └── Theme.qml           # pragma Singleton — palette, dark mode, radii
├── qmldir                  # registers Theme as singleton
├── assets/
│   └── fonts/
│       ├── Poppins-Regular.ttf
│       ├── Poppins-Medium.ttf
│       ├── Poppins-SemiBold.ttf
│       └── Poppins-Bold.ttf
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_state.py
    ├── test_plc_data_map.py
    ├── test_plc_client.py
    ├── test_bcontrol_client.py
    ├── test_vitals_client.py
    └── test_rest_client.py
```

Each file has one responsibility: `state.py` only holds state, `*_client.py` only does I/O, `plc_data_map.py` only does index→value translation. Clients write to `AppState`; QML reads from `AppState`. No client calls another client.

---

# Phase 0 — Repo + Empty Themed Window

Exit criterion: `python main.py` on macOS opens a fullscreen window with the Theme palette applied; `F11` toggles windowed/fullscreen; pressing a debug shortcut flips `appState.darkMode`. No state model or clients yet — just the chrome.

---

### Task 1: Create the sibling repo

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/` (new directory)
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/.gitignore`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/.python-version`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/README.md`

- [ ] **Step 1: Create directory and init git**

Run:
```bash
mkdir -p /Users/sencersoylu/Projects/MY_APP_QT
cd /Users/sencersoylu/Projects/MY_APP_QT
git init -b main
```

Expected: `Initialized empty Git repository in /Users/sencersoylu/Projects/MY_APP_QT/.git/`

- [ ] **Step 2: Write `.gitignore`**

Content:
```
# Python
__pycache__/
*.py[cod]
*.egg-info/
.pytest_cache/
.ruff_cache/
.mypy_cache/

# Virtualenv
.venv/
venv/

# Qt / QML cache
*.qmlc
*.jsc
qt_app.log

# OS
.DS_Store
Thumbs.db

# Editor
.vscode/
.idea/
*.swp
```

- [ ] **Step 3: Write `.python-version`**

Content: `3.11`

- [ ] **Step 4: Write `README.md`**

Content:
```markdown
# MY_APP_QT

PySide6 + QML port of the Nextron hyperbaric chamber HMI in `../MY_APP/`.

## Run (dev)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
python main.py
```

## Test

```bash
pytest
```

## Status

Phase 0–1: bootstrap + state + network clients. No UI panels yet.
See `../MY_APP/docs/superpowers/specs/2026-05-29-qt-migration-design.md`.
```

- [ ] **Step 5: Initial commit**

Run:
```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
git add .gitignore .python-version README.md
git commit -m "chore: init repo for Qt port"
```

Expected: `1 file changed` × 3, clean commit.

---

### Task 2: pyproject.toml + venv

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/pyproject.toml`

- [ ] **Step 1: Write `pyproject.toml`**

Content:
```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "rsp-qt"
version = "0.0.1"
description = "Qt port of the hyperbaric chamber HMI"
requires-python = ">=3.11"
dependencies = [
    "PySide6>=6.6",
    "python-socketio[asyncio_client]>=5.11",
    "qasync>=0.27",
    "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
    "respx>=0.20",
    "ruff>=0.4",
]

[tool.setuptools.packages.find]
include = ["app*"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]

[tool.ruff]
line-length = 100
target-version = "py311"
```

- [ ] **Step 2: Create venv and install**

Run:
```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e .[dev]
```

Expected (last lines): `Successfully installed PySide6-... httpx-... python-socketio-... qasync-... pytest-... ...`. If `python3.11` is not available, fall back to `python3` and accept the installed version as long as it's ≥3.11.

- [ ] **Step 3: Commit**

```bash
git add pyproject.toml
git commit -m "chore: add pyproject with PySide6 + asyncio stack"
```

---

### Task 3: Bundle Poppins font

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/fonts/Poppins-Regular.ttf`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/fonts/Poppins-Medium.ttf`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/fonts/Poppins-SemiBold.ttf`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/fonts/Poppins-Bold.ttf`

The Nextron app loads Poppins from Google Fonts. The Qt app must bundle the TTFs so RPi5 works offline.

- [ ] **Step 1: Check whether MY_APP ships any Poppins TTFs**

Run:
```bash
find /Users/sencersoylu/Projects/MY_APP -iname 'poppins*.ttf' -o -iname 'poppins*.woff*'
```

If TTFs are found, copy them. Otherwise download from the Google Fonts release: https://fonts.google.com/specimen/Poppins (Download family → unzip → use the four weights below).

- [ ] **Step 2: Place the four required weights**

Required filenames (exact):
- `assets/fonts/Poppins-Regular.ttf` (400)
- `assets/fonts/Poppins-Medium.ttf` (500)
- `assets/fonts/Poppins-SemiBold.ttf` (600)
- `assets/fonts/Poppins-Bold.ttf` (700)

```bash
mkdir -p /Users/sencersoylu/Projects/MY_APP_QT/assets/fonts
# copy or place the four files into that directory
ls /Users/sencersoylu/Projects/MY_APP_QT/assets/fonts
```

Expected: four `.ttf` files listed.

- [ ] **Step 3: Commit**

```bash
git add assets/fonts/
git commit -m "chore: bundle Poppins font (4 weights)"
```

---

### Task 4: Theme.qml singleton

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/Theme.qml`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/qmldir`

- [ ] **Step 1: Write `qml/qmldir` so QML registers Theme as a singleton**

Content:
```
module rsp
singleton Theme 1.0 Theme.qml
```

- [ ] **Step 2: Write `qml/Theme.qml`**

Content:
```qml
pragma Singleton
import QtQuick

QtObject {
    id: theme

    // ---- Dark mode (read from AppState if present, default true) ----
    property bool dark: typeof appState !== "undefined" ? appState.darkMode : true

    // ---- Tailwind slate scale ----
    readonly property color slate50:  "#f8fafc"
    readonly property color slate200: "#e2e8f0"
    readonly property color slate300: "#cbd5e1"
    readonly property color slate500: "#64748b"
    readonly property color slate700: "#334155"
    readonly property color slate800: "#1e293b"
    readonly property color slate900: "#0f172a"

    // ---- Semantic colors (Tailwind *-500) ----
    readonly property color emerald: "#10b981"   // safe / on
    readonly property color amber:   "#f59e0b"   // warning
    readonly property color rose:    "#f43f5e"   // danger
    readonly property color cyan:    "#06b6d4"   // chiller / special
    readonly property color sky:     "#0ea5e9"   // info

    // ---- Derived (dark-aware) ----
    readonly property color bg:       dark ? slate900 : "#ffffff"
    readonly property color bgPanel:  dark ? slate800 : slate50
    readonly property color text:     dark ? "#ffffff" : slate900
    readonly property color textMuted: dark ? slate300 : slate500
    readonly property color border:   dark ? slate700 : slate200
    readonly property color glass:    dark ? Qt.rgba(0, 0, 0, 0.32) : Qt.rgba(1, 1, 1, 0.80)

    // ---- Typography ----
    readonly property string fontFamily: "Poppins"
    readonly property int    fontSizeSm: 12
    readonly property int    fontSizeMd: 14
    readonly property int    fontSizeLg: 18
    readonly property int    fontSizeXl: 24

    // ---- Geometry ----
    readonly property int radiusSm: 6
    readonly property int radiusMd: 12
    readonly property int radiusLg: 20
    readonly property int spacingSm: 8
    readonly property int spacingMd: 12
    readonly property int spacingLg: 16

    // ---- Animation ----
    readonly property int animFast: 120
    readonly property int animMed:  200
    readonly property int animSlow: 400
}
```

- [ ] **Step 3: Commit**

```bash
git add qml/Theme.qml qml/qmldir
git commit -m "feat(qml): Theme singleton with Tailwind palette + dark mode"
```

---

### Task 5: Main.qml — fullscreen window with F11 + dark toggle

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/Main.qml`

- [ ] **Step 1: Write `qml/Main.qml`**

Content:
```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import "." as Rsp

ApplicationWindow {
    id: window
    width: 1280
    height: 720
    visibility: Window.FullScreen
    title: "RSP — Qt (Phase 0)"
    color: Rsp.Theme.bg

    FontLoader { source: "../assets/fonts/Poppins-Regular.ttf" }
    FontLoader { source: "../assets/fonts/Poppins-Medium.ttf" }
    FontLoader { source: "../assets/fonts/Poppins-SemiBold.ttf" }
    FontLoader { source: "../assets/fonts/Poppins-Bold.ttf" }

    // F11 → toggle fullscreen
    Shortcut {
        sequence: "F11"
        onActivated: window.visibility = (window.visibility === Window.FullScreen)
                                         ? Window.Windowed
                                         : Window.FullScreen
    }

    // Ctrl+D → toggle dark mode (debug shortcut for Phase 0)
    Shortcut {
        sequence: "Ctrl+D"
        onActivated: appState.darkMode = !appState.darkMode
    }

    // Empty themed body for Phase 0
    Rectangle {
        anchors.fill: parent
        color: Rsp.Theme.bg

        ColumnLayout {
            anchors.centerIn: parent
            spacing: Rsp.Theme.spacingMd

            Text {
                text: "RSP Qt — Phase 0"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeXl
                font.weight: Font.Bold
                Layout.alignment: Qt.AlignHCenter
            }
            Text {
                text: "F11: fullscreen   ·   Ctrl+D: dark mode toggle"
                color: Rsp.Theme.textMuted
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
                Layout.alignment: Qt.AlignHCenter
            }
            Text {
                text: "Dark mode: " + (Rsp.Theme.dark ? "ON" : "OFF")
                color: Rsp.Theme.emerald
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                Layout.alignment: Qt.AlignHCenter
            }
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add qml/Main.qml
git commit -m "feat(qml): Main window with F11 + dark-mode toggle"
```

---

### Task 6: main.py — minimal AppState stub + bootstrap

We need a placeholder `appState` so `Main.qml` (which reads `appState.darkMode` for `Ctrl+D`) has something to talk to. The real `AppState` lands in Phase 1, Task 8 — we'll replace this stub then.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/__init__.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/main.py`

- [ ] **Step 1: Create `app/__init__.py`**

Content: empty file.

- [ ] **Step 2: Write `main.py`**

Content:
```python
"""Phase 0 bootstrap: open a themed window. AppState is a temporary stub."""

import sys
from pathlib import Path

from PySide6.QtCore import QObject, Property, Signal
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlApplicationEngine

ROOT = Path(__file__).resolve().parent
QML_DIR = ROOT / "qml"


class _Phase0AppState(QObject):
    """Tiny stand-in so Main.qml can read/write darkMode in Phase 0.

    Replaced by app.state.AppState in Phase 1.
    """

    darkModeChanged = Signal()

    def __init__(self) -> None:
        super().__init__()
        self._dark = True

    @Property(bool, notify=darkModeChanged)
    def darkMode(self) -> bool:
        return self._dark

    @darkMode.setter
    def darkMode(self, v: bool) -> None:
        if self._dark != v:
            self._dark = v
            self.darkModeChanged.emit()


def main() -> int:
    app = QGuiApplication(sys.argv)
    state = _Phase0AppState()

    engine = QQmlApplicationEngine()
    engine.addImportPath(str(QML_DIR))
    engine.rootContext().setContextProperty("appState", state)
    engine.load(QML_DIR / "Main.qml")

    if not engine.rootObjects():
        return 1
    return app.exec()


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 3: Smoke-test the window**

Run:
```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py
```

Expected: a fullscreen window opens with "RSP Qt — Phase 0", "Dark mode: ON" in emerald, dark background.
- Press `Ctrl+D` → text flips to "Dark mode: OFF" and background goes white.
- Press `F11` → window becomes windowed (resizable).
- Close the window (Cmd+Q on macOS).

If the window does not open or QML import fails, check that `qml/qmldir` lists `singleton Theme 1.0 Theme.qml` and that `engine.addImportPath` points to the qml/ dir.

- [ ] **Step 4: Commit**

```bash
git add app/__init__.py main.py
git commit -m "feat: Phase 0 bootstrap — themed fullscreen window"
```

---

### Task 7: Phase 0 milestone tag

- [ ] **Step 1: Tag the milestone**

```bash
git tag phase-0-complete
git log --oneline
```

Expected: tag `phase-0-complete` on the most recent commit.

---

# Phase 1 — State + Async Clients

Exit criterion: All Python tests pass; `appState`, `plcClient`, `bcontrolClient`, `vitalsClient`, `restClient` are exposed to QML; `Main.qml` can read `appState.darkMode` and the value persists across restarts.

No new QML panels in Phase 1; the existing `Main.qml` stays as-is.

---

### Task 8: AppState (full field set + persistence)

The full field list is taken directly from `renderer/store.ts` (read it first if anything is unclear). One Python file, one comprehensive test file, one commit at the end.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/state.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/__init__.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/conftest.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/test_state.py`

- [ ] **Step 1: Write `tests/__init__.py`**

Empty file.

- [ ] **Step 2: Write `tests/conftest.py`**

Content:
```python
import pytest
from PySide6.QtCore import QCoreApplication, QSettings


@pytest.fixture(autouse=True)
def isolated_qsettings(tmp_path, monkeypatch):
    """Every test gets its own QSettings file under tmp_path."""
    QSettings.setDefaultFormat(QSettings.IniFormat)
    QSettings.setPath(QSettings.IniFormat, QSettings.UserScope, str(tmp_path))
    yield


@pytest.fixture(scope="session")
def qapp():
    """A single QCoreApplication for the whole test session."""
    app = QCoreApplication.instance() or QCoreApplication([])
    yield app
```

- [ ] **Step 3: Write failing test `tests/test_state.py`**

Content:
```python
from app.state import AppState


def test_default_values(qapp):
    s = AppState()
    # Verified against renderer/store.ts lines 170–228.
    assert s.darkMode is True
    assert s.connected is False
    assert s.lightStatus == 0
    assert s.fan1Status == 0
    assert s.fan2Status == 0
    assert s.autoMode is False
    assert s.airMode is False
    assert s.ventilMode == 0
    assert s.light2Status == 0
    assert s.valve1Status is False
    assert s.valve2Status is False
    assert s.playing is False
    assert s.showAuxPanel is False
    assert s.showCalibrationModal is False
    assert s.showErrorModal is False
    assert s.showSeatAlarmModal is False
    assert s.showChillerModal is False
    assert s.calibrationProgress == 0
    assert s.calibrationStatus == ""
    assert s.errorMessage == ""
    assert s.chillerRunning is False
    assert s.chillerCurrentTemp == 20.0
    assert s.chillerSetTemp == 20.0
    assert s.chillerCommError is False
    assert s.lp1Status is True
    assert s.lp2Status is True
    assert s.hp1Status is True
    assert s.hpCylinderPressure == 120
    assert s.airTankPressure == 12.1
    assert s.nitrogen1Pressure == 120
    assert s.nitrogen2Pressure == 120
    assert s.mainFssLevel == 60
    assert s.mainFssPressure == 12.1
    assert s.mainFssActive is True
    assert s.anteFssLevel == 60
    assert s.anteFssPressure == 12.1
    assert s.anteFssActive is False
    assert s.anteFssWarning is True
    assert s.primaryO2Pressure == 120
    assert s.secondaryO2Pressure == 120
    assert s.liquidO2Pressure == 120
    assert s.primaryO2Active is True
    assert s.secondaryO2Active is False
    assert s.liquidO2Active is False
    assert s.mainFssAlarm is False
    assert s.anteFssAlarm is False
    assert s.mainFlameDetected is False
    assert s.mainSmokeDetected is False
    assert s.anteSmokeDetected is False
    assert s.mainHighO2 is False
    assert s.anteHighO2 is False
    assert s.currentTime == ""
    assert s.currentTime2 == ""
    assert s.seatPressures == [0.5] * 12
    assert s.activeSeatAlarm is None
    # ---- New Qt-only fields (chamber sensors + tech) — start at 0.0 ----
    assert s.mainPressure == 0.0
    assert s.mainO2 == 0.0
    assert s.mainTemp == 0.0
    assert s.mainHumidity == 0.0
    assert s.antePressure == 0.0
    assert s.anteO2 == 0.0
    assert s.anteTemp == 0.0
    assert s.anteHumidity == 0.0
    assert s.techO2Pressure == 0.0
    assert s.anteFssNitrogenPressure == 0.0


def test_setter_emits_signal(qapp):
    s = AppState()
    calls = []
    s.darkModeChanged.connect(lambda: calls.append(s.darkMode))
    s.darkMode = False
    assert calls == [False]
    # No re-emit when value unchanged
    s.darkMode = False
    assert calls == [False]


def test_persistence_round_trip(qapp):
    s1 = AppState()
    s1.darkMode = False
    s1.lightStatus = 200
    s1.fan1Status = 128
    s1.autoMode = True
    s1.valve1Status = True

    s2 = AppState()
    assert s2.darkMode is False
    assert s2.lightStatus == 200
    assert s2.fan1Status == 128
    assert s2.autoMode is True
    assert s2.valve1Status is True


def test_ephemeral_not_persisted(qapp):
    s1 = AppState()
    s1.connected = True
    s1.calibrationProgress = 42
    s1.errorMessage = "boom"

    s2 = AppState()
    # Ephemeral fields reset to defaults
    assert s2.connected is False
    assert s2.calibrationProgress == 0
    assert s2.errorMessage == ""


def test_seat_pressures_list(qapp):
    s = AppState()
    captured = []
    s.seatPressuresChanged.connect(lambda: captured.append(list(s.seatPressures)))
    s.seatPressures = [1.0] * 12
    assert captured == [[1.0] * 12]
    assert s.seatPressures == [1.0] * 12


def test_active_seat_alarm(qapp):
    s = AppState()
    assert s.activeSeatAlarm is None
    s.activeSeatAlarm = {"seatNumber": 21}
    assert s.activeSeatAlarm == {"seatNumber": 21}
    s.activeSeatAlarm = None
    assert s.activeSeatAlarm is None
```

- [ ] **Step 4: Run tests — verify they fail**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
pytest tests/test_state.py -v
```

Expected: `ImportError: cannot import name 'AppState' from 'app.state'` or `ModuleNotFoundError`.

- [ ] **Step 5: Write `app/state.py`**

Content:
```python
"""Single source of UI state. Mirrors renderer/store.ts one-to-one."""

from __future__ import annotations

from typing import Any

from PySide6.QtCore import Property, QObject, QSettings, Signal


# Fields that survive restarts (matches Zustand `persist` behavior in store.ts).
_PERSISTED: set[str] = {
    "darkMode",
    "lightStatus",
    "light2Status",
    "fan1Status",
    "fan2Status",
    "autoMode",
    "airMode",
    "ventilMode",
    "valve1Status",
    "valve2Status",
    "playing",
    "chillerSetTemp",
}


def _signal_factory() -> Signal:
    """Build a parameterless Signal — used for every *Changed signal."""
    return Signal()


class AppState(QObject):
    """The Zustand store, ported to a single QObject.

    Each field is exposed as a QProperty + matching `<field>Changed` Signal.
    Persisted fields are written through `QSettings("soylu", "rsp-qt")`.
    """

    # -- signals declared once at class level so QML bindings can find them --
    darkModeChanged = Signal()
    connectedChanged = Signal()
    currentTimeChanged = Signal()
    currentTime2Changed = Signal()
    showAuxPanelChanged = Signal()
    showCalibrationModalChanged = Signal()
    showErrorModalChanged = Signal()
    showSeatAlarmModalChanged = Signal()
    showChillerModalChanged = Signal()
    calibrationProgressChanged = Signal()
    calibrationStatusChanged = Signal()
    errorMessageChanged = Signal()
    lightStatusChanged = Signal()
    light2StatusChanged = Signal()
    fan1StatusChanged = Signal()
    fan2StatusChanged = Signal()
    autoModeChanged = Signal()
    airModeChanged = Signal()
    ventilModeChanged = Signal()
    valve1StatusChanged = Signal()
    valve2StatusChanged = Signal()
    playingChanged = Signal()
    chillerRunningChanged = Signal()
    chillerCurrentTempChanged = Signal()
    chillerSetTempChanged = Signal()
    chillerCommErrorChanged = Signal()
    lp1StatusChanged = Signal()
    lp2StatusChanged = Signal()
    hp1StatusChanged = Signal()
    hpCylinderPressureChanged = Signal()
    airTankPressureChanged = Signal()
    nitrogen1PressureChanged = Signal()
    nitrogen2PressureChanged = Signal()
    mainFssLevelChanged = Signal()
    mainFssPressureChanged = Signal()
    mainFssActiveChanged = Signal()
    anteFssLevelChanged = Signal()
    anteFssPressureChanged = Signal()
    anteFssActiveChanged = Signal()
    anteFssWarningChanged = Signal()
    primaryO2PressureChanged = Signal()
    secondaryO2PressureChanged = Signal()
    liquidO2PressureChanged = Signal()
    primaryO2ActiveChanged = Signal()
    secondaryO2ActiveChanged = Signal()
    liquidO2ActiveChanged = Signal()
    mainFssAlarmChanged = Signal()
    anteFssAlarmChanged = Signal()
    mainFlameDetectedChanged = Signal()
    mainSmokeDetectedChanged = Signal()
    anteSmokeDetectedChanged = Signal()
    mainHighO2Changed = Signal()
    anteHighO2Changed = Signal()
    seatPressuresChanged = Signal()
    activeSeatAlarmChanged = Signal()
    # ---- New Qt-only fields ----
    mainPressureChanged = Signal()
    mainO2Changed = Signal()
    mainTempChanged = Signal()
    mainHumidityChanged = Signal()
    antePressureChanged = Signal()
    anteO2Changed = Signal()
    anteTempChanged = Signal()
    anteHumidityChanged = Signal()
    techO2PressureChanged = Signal()
    anteFssNitrogenPressureChanged = Signal()

    def __init__(self) -> None:
        super().__init__()
        self._settings = QSettings("soylu", "rsp-qt")
        # ---- Defaults from renderer/store.ts:170-228 ----
        defaults: dict[str, Any] = {
            "darkMode": True,
            "connected": False,
            "currentTime": "",
            "currentTime2": "",
            "showAuxPanel": False,
            "showCalibrationModal": False,
            "showErrorModal": False,
            "showSeatAlarmModal": False,
            "showChillerModal": False,
            "calibrationProgress": 0,
            "calibrationStatus": "",
            "errorMessage": "",
            "lightStatus": 0,
            "light2Status": 0,
            "fan1Status": 0,
            "fan2Status": 0,
            "autoMode": False,
            "airMode": False,
            "ventilMode": 0,
            "valve1Status": False,
            "valve2Status": False,
            "playing": False,
            "chillerRunning": False,
            "chillerCurrentTemp": 20.0,
            "chillerSetTemp": 20.0,
            "chillerCommError": False,
            "lp1Status": True,
            "lp2Status": True,
            "hp1Status": True,
            "hpCylinderPressure": 120,
            "airTankPressure": 12.1,
            "nitrogen1Pressure": 120,
            "nitrogen2Pressure": 120,
            "mainFssLevel": 60,
            "mainFssPressure": 12.1,
            "mainFssActive": True,
            "anteFssLevel": 60,
            "anteFssPressure": 12.1,
            "anteFssActive": False,
            "anteFssWarning": True,
            "primaryO2Pressure": 120,
            "secondaryO2Pressure": 120,
            "liquidO2Pressure": 120,
            "primaryO2Active": True,
            "secondaryO2Active": False,
            "liquidO2Active": False,
            "mainFssAlarm": False,
            "anteFssAlarm": False,
            "mainFlameDetected": False,
            "mainSmokeDetected": False,
            "anteSmokeDetected": False,
            "mainHighO2": False,
            "anteHighO2": False,
            # ---- New Qt-only chamber + tech sensor fields ----
            "mainPressure": 0.0,
            "mainO2": 0.0,
            "mainTemp": 0.0,
            "mainHumidity": 0.0,
            "antePressure": 0.0,
            "anteO2": 0.0,
            "anteTemp": 0.0,
            "anteHumidity": 0.0,
            "techO2Pressure": 0.0,
            "anteFssNitrogenPressure": 0.0,
        }
        for name, default in defaults.items():
            if name in _PERSISTED:
                value = self._settings.value(name, default, type=type(default))
            else:
                value = default
            setattr(self, f"_{name}", value)
        self._seatPressures: list[float] = [0.5] * 12
        self._activeSeatAlarm: dict | None = None

    # ---------- generic setter helper ----------
    def _set(self, name: str, value: Any, signal: Signal) -> None:
        attr = f"_{name}"
        if getattr(self, attr) == value:
            return
        setattr(self, attr, value)
        if name in _PERSISTED:
            self._settings.setValue(name, value)
            self._settings.sync()
        signal.emit()


# Programmatically attach a Property for each declared signal. This avoids
# 50 nearly-identical @Property blocks while keeping QML introspection happy.
_SCALAR_TYPES: dict[str, type] = {
    "darkMode": bool, "connected": bool, "currentTime": str, "currentTime2": str,
    "showAuxPanel": bool, "showCalibrationModal": bool, "showErrorModal": bool,
    "showSeatAlarmModal": bool, "showChillerModal": bool,
    "calibrationProgress": int, "calibrationStatus": str, "errorMessage": str,
    "lightStatus": int, "light2Status": int, "fan1Status": int, "fan2Status": int,
    "autoMode": bool, "airMode": bool, "ventilMode": int,
    "valve1Status": bool, "valve2Status": bool, "playing": bool,
    "chillerRunning": bool, "chillerCurrentTemp": float, "chillerSetTemp": float,
    "chillerCommError": bool,
    "lp1Status": bool, "lp2Status": bool, "hp1Status": bool,
    "hpCylinderPressure": float, "airTankPressure": float,
    "nitrogen1Pressure": float, "nitrogen2Pressure": float,
    "mainFssLevel": float, "mainFssPressure": float, "mainFssActive": bool,
    "anteFssLevel": float, "anteFssPressure": float, "anteFssActive": bool,
    "anteFssWarning": bool,
    "primaryO2Pressure": float, "secondaryO2Pressure": float, "liquidO2Pressure": float,
    "primaryO2Active": bool, "secondaryO2Active": bool, "liquidO2Active": bool,
    "mainFssAlarm": bool, "anteFssAlarm": bool,
    "mainFlameDetected": bool, "mainSmokeDetected": bool, "anteSmokeDetected": bool,
    "mainHighO2": bool, "anteHighO2": bool,
    # New Qt-only sensor fields (all raw floats; calibration in Phase 2)
    "mainPressure": float, "mainO2": float, "mainTemp": float, "mainHumidity": float,
    "antePressure": float, "anteO2": float, "anteTemp": float, "anteHumidity": float,
    "techO2Pressure": float, "anteFssNitrogenPressure": float,
}


def _make_property(name: str, py_type: type) -> Property:
    signal = getattr(AppState, f"{name}Changed")

    def _getter(self):
        return getattr(self, f"_{name}")

    def _setter(self, value):
        self._set(name, value, signal)

    return Property(py_type, _getter, _setter, notify=signal)


for _name, _ty in _SCALAR_TYPES.items():
    setattr(AppState, _name, _make_property(_name, _ty))


# seatPressures (list[float]) and activeSeatAlarm (dict|None) — handled as `object`
def _seat_pressures_getter(self):
    return list(self._seatPressures)


def _seat_pressures_setter(self, value):
    new = [float(x) for x in value]
    if new == self._seatPressures:
        return
    self._seatPressures = new
    self.seatPressuresChanged.emit()


AppState.seatPressures = Property(  # type: ignore[assignment]
    "QVariantList",
    _seat_pressures_getter,
    _seat_pressures_setter,
    notify=AppState.seatPressuresChanged,
)


def _alarm_getter(self):
    return self._activeSeatAlarm


def _alarm_setter(self, value):
    if value == self._activeSeatAlarm:
        return
    self._activeSeatAlarm = value
    self.activeSeatAlarmChanged.emit()


AppState.activeSeatAlarm = Property(  # type: ignore[assignment]
    "QVariant",
    _alarm_getter,
    _alarm_setter,
    notify=AppState.activeSeatAlarmChanged,
)
```

- [ ] **Step 6: Run tests — verify they pass**

```bash
pytest tests/test_state.py -v
```

Expected: 6 passed.

If a `QSettings` test fails because the value comes back as a string ("True"/"False"), confirm the `type=type(default)` hint in `__init__` matches the default; QSettings stores types implicitly on macOS .plist but as strings in .ini — the `type=` parameter forces the cast.

- [ ] **Step 7: Commit**

```bash
git add app/state.py tests/__init__.py tests/conftest.py tests/test_state.py
git commit -m "feat(state): AppState QObject mirroring Zustand store"
```

---

### Task 9: config.py — URLs in one place

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/config.py`

- [ ] **Step 1: Write `app/config.py`**

Content:
```python
"""Network endpoints. Edit here, not in client code."""

from __future__ import annotations

import os

PLC_URL: str = os.environ.get("PLC_URL", "http://192.168.77.100:4000")
BCONTROL_URL: str = os.environ.get("BCONTROL_URL", "http://localhost:3001")
REST_BASE_URL: str = os.environ.get("REST_BASE_URL", "http://localhost:3001/api")
# Currently the ngrok endpoint hard-coded in renderer/pages/home.tsx.
# Replace with the production URL when known.
VITAL_SIGNS_URL: str = os.environ.get(
    "VITAL_SIGNS_URL", "https://6b07-83-111-109-94.ngrok-free.app"
)

REST_TIMEOUT_SECONDS: float = 10.0
```

- [ ] **Step 2: Commit**

```bash
git add app/config.py
git commit -m "feat(config): centralize backend URLs"
```

---

### Task 10: plc_data_map.py — full `data[]` index map (all known indices)

The Nextron app applies per-sensor linear conversion using calibration values fetched from a separate REST endpoint. For Phase 1 we record the **raw** PLC integer into the corresponding `AppState` field — Phase 2 introduces the calibration layer. This task isolates the complete index→field knowledge from the network client.

The full mapping (source: memory file `reference_socket_data_mapping.md`, live-verified 2026-05-22 and 2026-05-26):

| Idx | AppState field | Notes |
|---|---|---|
| 0 | `mainPressure` | Main chamber pressure |
| 1 | `mainO2` | Main chamber O2 % |
| 2 | `mainTemp` | Main chamber temperature |
| 3 | `anteHumidity` | Live-verified, not unused |
| 4 | `antePressure` | Ante chamber pressure |
| 5 | `anteO2` | Ante chamber O2 % |
| 6 | `anteTemp` | Ante chamber temperature |
| 7 | `mainHumidity` | Main chamber humidity |
| 8 | (deprecated) | Old air-tank index; moved to 30 |
| 9 | `techO2Pressure` | Tech O2 pressure |
| 10 | `mainFssPressure` | |
| 11 | `mainFssLevel` | |
| 12 | `anteFssPressure` | |
| 13 | `anteFssLevel` | |
| 14 | unmapped | log at debug |
| 15 | `chillerCurrentTemp` | divide by 10; also from `chillerData` event |
| 16 | (handled by `seatAlarm` event) | seat alarm number |
| 17, 18 | unmapped | |
| 19 | alarm bitfield | bits 2..8, see below |
| 20 | `primaryO2Pressure` | O2 cylinder bank 1 |
| 21 | `secondaryO2Pressure` | O2 cylinder bank 2 |
| 22 | `nitrogen1Pressure` | Main FSS nitrogen #1 |
| 23 | `nitrogen2Pressure` | Main FSS nitrogen #2 |
| 24 | `anteFssNitrogenPressure` | Ante FSS nitrogen #1 |
| 25, 26 | unmapped | |
| 27 | chiller link status | `===10` → comm error, handled in `PlcClient` |
| 28 | chiller set temp ×10 | trust only when `data[27] !== 10`, handled in `PlcClient` |
| 29 | chiller status flag | bit 0 = running, handled in `PlcClient` |
| 30 | `airTankPressure` | Replaces the older `data[8]` |

The alarm bitfield at `data[19]`: bit 2 = MainFSS, 3 = AnteFSS, 4 = MainFlame, 5 = MainSmoke, 6 = AnteSmoke, 7 = MainHighO2, 8 = AnteHighO2.

Chiller indices 27/28/29 stay in `PlcClient` (not in this module) because they require correlated logic across three indices.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/plc_data_map.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/test_plc_data_map.py`

- [ ] **Step 1: Write failing test**

`tests/test_plc_data_map.py`:
```python
from app.plc_data_map import apply_data_array, DATA_INDEX
from app.state import AppState


def test_index_constants():
    # Verified against memory file reference_socket_data_mapping.md
    assert DATA_INDEX["mainPressure"] == 0
    assert DATA_INDEX["mainO2"] == 1
    assert DATA_INDEX["mainTemp"] == 2
    assert DATA_INDEX["anteHumidity"] == 3
    assert DATA_INDEX["antePressure"] == 4
    assert DATA_INDEX["anteO2"] == 5
    assert DATA_INDEX["anteTemp"] == 6
    assert DATA_INDEX["mainHumidity"] == 7
    assert DATA_INDEX["techO2Pressure"] == 9
    assert DATA_INDEX["mainFssPressure"] == 10
    assert DATA_INDEX["mainFssLevel"] == 11
    assert DATA_INDEX["anteFssPressure"] == 12
    assert DATA_INDEX["anteFssLevel"] == 13
    assert DATA_INDEX["chillerCurrentTempRaw"] == 15
    assert DATA_INDEX["primaryO2Pressure"] == 20
    assert DATA_INDEX["secondaryO2Pressure"] == 21
    assert DATA_INDEX["nitrogen1Pressure"] == 22
    assert DATA_INDEX["nitrogen2Pressure"] == 23
    assert DATA_INDEX["anteFssNitrogenPressure"] == 24
    assert DATA_INDEX["airTankPressure"] == 30
    # data[8] is NOT in the active map — it was deprecated on 2026-05-23
    assert "data8_deprecated" not in DATA_INDEX
    # data[16], 27, 28, 29 are NOT in the simple map; PlcClient handles them
    assert all(k not in DATA_INDEX for k in ("seatAlarmRaw", "chillerLink", "chillerSetTempRaw", "chillerStatusFlag"))


def test_apply_data_array_writes_chamber_fields(qapp):
    s = AppState()
    payload = [0.0] * 31
    payload[0] = 1.5         # mainPressure
    payload[1] = 21.0        # mainO2
    payload[2] = 22.5        # mainTemp
    payload[3] = 55.0        # anteHumidity
    payload[4] = 1.6         # antePressure
    payload[5] = 20.9        # anteO2
    payload[6] = 23.1        # anteTemp
    payload[7] = 50.0        # mainHumidity
    apply_data_array(s, payload)
    assert s.mainPressure == 1.5
    assert s.mainO2 == 21.0
    assert s.mainTemp == 22.5
    assert s.anteHumidity == 55.0
    assert s.antePressure == 1.6
    assert s.anteO2 == 20.9
    assert s.anteTemp == 23.1
    assert s.mainHumidity == 50.0


def test_apply_data_array_writes_tech_fields(qapp):
    s = AppState()
    payload = [0.0] * 31
    payload[9]  = 200       # techO2Pressure
    payload[10] = 4.2       # mainFssPressure
    payload[11] = 75        # mainFssLevel
    payload[12] = 4.0       # anteFssPressure
    payload[13] = 70        # anteFssLevel
    payload[20] = 250       # primaryO2Pressure
    payload[21] = 240       # secondaryO2Pressure
    payload[22] = 230       # nitrogen1Pressure
    payload[23] = 220       # nitrogen2Pressure
    payload[24] = 210       # anteFssNitrogenPressure
    payload[30] = 12.5      # airTankPressure
    apply_data_array(s, payload)
    assert s.techO2Pressure == 200
    assert s.mainFssPressure == 4.2
    assert s.mainFssLevel == 75
    assert s.anteFssPressure == 4.0
    assert s.anteFssLevel == 70
    assert s.primaryO2Pressure == 250
    assert s.secondaryO2Pressure == 240
    assert s.nitrogen1Pressure == 230
    assert s.nitrogen2Pressure == 220
    assert s.anteFssNitrogenPressure == 210
    assert s.airTankPressure == 12.5


def test_chiller_current_temp_from_data15_divided_by_10(qapp):
    s = AppState()
    payload = [0.0] * 31
    payload[15] = 185  # chiller raw → 18.5 °C
    apply_data_array(s, payload)
    assert s.chillerCurrentTemp == 18.5


def test_apply_data_array_short_payload_is_safe(qapp):
    s = AppState()
    # Only 10 elements — high indices are missing
    apply_data_array(s, [1.0] * 10)
    # No crash; high-index fields stay at defaults.
    assert s.nitrogen1Pressure == 120
    assert s.airTankPressure == 12.1


def test_apply_alarm_bits_unpacks_data19(qapp):
    s = AppState()
    payload = [0] * 31
    payload[19] = (1 << 2) | (1 << 5) | (1 << 8)
    apply_data_array(s, payload)
    assert s.mainFssAlarm is True
    assert s.anteFssAlarm is False
    assert s.mainSmokeDetected is True
    assert s.anteHighO2 is True
    assert s.mainFlameDetected is False


def test_data8_is_not_written_anymore(qapp):
    s = AppState()
    s.airTankPressure = 99.0  # set a sentinel
    payload = [0.0] * 31
    payload[8] = 1.0      # this should be ignored
    payload[30] = 8.0     # this is the real value
    apply_data_array(s, payload)
    assert s.airTankPressure == 8.0  # not 99.0, not 1.0
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest tests/test_plc_data_map.py -v
```

Expected: ImportError on `apply_data_array`.

- [ ] **Step 3: Write `app/plc_data_map.py`**

Content:
```python
"""PLC `data` event array → AppState field mapping.

Index source-of-truth: memory file `reference_socket_data_mapping.md`
(live-verified 2026-05-22 and 2026-05-26).

Raw PLC values are written through unchanged in Phase 1; per-sensor calibration
(linearConversion using `json.php?i=main,tech` records) is Phase 2's job. This
keeps `PlcClient` free of conversion logic.

Indices intentionally NOT in DATA_INDEX:
    8  — deprecated (air tank moved to 30 on 2026-05-23)
   14, 17, 18, 25, 26 — meaning still TBD per memory file
   16 — also carried by the `seatAlarm` event; PlcClient prefers that path
   27, 28, 29 — chiller link/setTemp/runFlag; correlated logic lives in
                PlcClient, not here
"""

from __future__ import annotations

import logging
from typing import Sequence

log = logging.getLogger(__name__)


# Pass-through (raw write to AppState attribute).
DATA_INDEX: dict[str, int] = {
    # ---- Main chamber ----
    "mainPressure":            0,
    "mainO2":                  1,
    "mainTemp":                2,
    # ---- Ante chamber ----
    "anteHumidity":            3,   # live-verified 2026-05-22 — not unused
    "antePressure":            4,
    "anteO2":                  5,
    "anteTemp":                6,
    "mainHumidity":            7,
    # ---- Tech ----
    "techO2Pressure":          9,
    "mainFssPressure":        10,
    "mainFssLevel":           11,
    "anteFssPressure":        12,
    "anteFssLevel":           13,
    # ---- O2 / Nitrogen banks ----
    "primaryO2Pressure":      20,   # O2 cylinder bank 1
    "secondaryO2Pressure":    21,   # O2 cylinder bank 2
    "nitrogen1Pressure":      22,   # Main FSS nitrogen #1
    "nitrogen2Pressure":      23,   # Main FSS nitrogen #2
    "anteFssNitrogenPressure": 24,  # Ante FSS nitrogen #1
    # ---- Air tank (moved 2026-05-23 from 8 → 30) ----
    "airTankPressure":        30,
}

# data[15] needs a /10 transform — handled separately.
_CHILLER_PV_INDEX = 15
_CHILLER_PV_DIVISOR = 10.0

# data[19] is a 16-bit reversed bitfield.
_ALARM_BITS_INDEX = 19
_ALARM_BITS: dict[int, str] = {
    2: "mainFssAlarm",
    3: "anteFssAlarm",
    4: "mainFlameDetected",
    5: "mainSmokeDetected",
    6: "anteSmokeDetected",
    7: "mainHighO2",
    8: "anteHighO2",
}

# Indices that exist in the live payload but have no current meaning.
_UNMAPPED_INDICES = (14, 17, 18, 25, 26)


def apply_data_array(state, payload: Sequence[float]) -> None:
    """Write every mapped index onto `state` in place. Safe with short payloads."""
    n = len(payload)
    for attr, idx in DATA_INDEX.items():
        if idx < n:
            setattr(state, attr, payload[idx])
    if _CHILLER_PV_INDEX < n:
        state.chillerCurrentTemp = float(payload[_CHILLER_PV_INDEX]) / _CHILLER_PV_DIVISOR
    if _ALARM_BITS_INDEX < n:
        _apply_alarm_bits(state, int(payload[_ALARM_BITS_INDEX]))
    # Log unmapped indices once per session would be ideal; for now just trace.
    if log.isEnabledFor(logging.DEBUG):
        for idx in _UNMAPPED_INDICES:
            if idx < n and payload[idx]:
                log.debug("PLC data[%d] = %r (still unmapped)", idx, payload[idx])


def _apply_alarm_bits(state, bits: int) -> None:
    for bit, attr in _ALARM_BITS.items():
        setattr(state, attr, bool(bits & (1 << bit)))
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_plc_data_map.py -v
```

Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add app/plc_data_map.py tests/test_plc_data_map.py
git commit -m "feat(plc): data[] index map with safe partial payloads"
```

---

### Task 11: PlcClient — connect, parse events, expose write slots

The client wraps `socketio.AsyncClient`. We test by constructing the client, hand-feeding it parsed payloads via its handler methods (no real socket connection in unit tests).

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/plc_client.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/test_plc_client.py`

- [ ] **Step 1: Write failing test `tests/test_plc_client.py`**

Content:
```python
import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.plc_client import PlcClient
from app.state import AppState


def test_data_event_writes_state(qapp):
    s = AppState()
    client = PlcClient(s)
    # Envelope shape from memory file: {isConnectedPLC: 1, data: [...]}
    payload = {"isConnectedPLC": 1, "data": [0.0] * 31}
    payload["data"][10] = 3.3      # mainFssPressure
    payload["data"][11] = 50       # mainFssLevel
    client._on_data_sync(payload)
    assert s.mainFssPressure == 3.3
    assert s.mainFssLevel == 50


def test_chiller_data_event_only_uses_current_temp(qapp):
    s = AppState()
    client = PlcClient(s)
    # `running` is intentionally ignored — comes from data[29] bit 0 instead.
    s.chillerRunning = False
    client._on_chiller_data_sync({"currentTemp": 185, "running": True})
    assert s.chillerCurrentTemp == 18.5  # 185 / 10
    assert s.chillerRunning is False     # NOT updated from this event


def test_chiller_comm_error_when_data27_is_10(qapp):
    s = AppState()
    client = PlcClient(s)
    # Per memory "Chiller link / run state (2026-05-26)": data[27] === 10 = comm error.
    payload = {"isConnectedPLC": 1, "data": [0.0] * 31}
    payload["data"][27] = 10
    payload["data"][28] = 55    # would translate to 5.5 °C but must be ignored
    payload["data"][29] = 1     # bit 0 set — would say running, must be ignored
    client._on_data_sync(payload)
    assert s.chillerCommError is True
    # When in comm error we do NOT overwrite chillerSetTemp / chillerRunning.


def test_chiller_set_temp_and_run_flag_from_data(qapp):
    s = AppState()
    client = PlcClient(s)
    payload = {"isConnectedPLC": 1, "data": [0.0] * 31}
    payload["data"][27] = 0      # link OK
    payload["data"][28] = 55     # set temp ×10 → 5.5 °C
    payload["data"][29] = 1      # bit 0 = running
    client._on_data_sync(payload)
    assert s.chillerCommError is False
    assert s.chillerSetTemp == 5.5
    assert s.chillerRunning is True


def test_chiller_not_running_when_data29_bit0_clear(qapp):
    s = AppState()
    client = PlcClient(s)
    payload = {"isConnectedPLC": 1, "data": [0.0] * 31}
    payload["data"][27] = 0
    payload["data"][28] = 200    # 20.0 °C
    payload["data"][29] = 0b10   # bit 1 set, bit 0 clear → stopped
    client._on_data_sync(payload)
    assert s.chillerRunning is False
    assert s.chillerSetTemp == 20.0


def test_chiller_pv_from_data15(qapp):
    s = AppState()
    client = PlcClient(s)
    payload = {"isConnectedPLC": 1, "data": [0.0] * 31}
    payload["data"][15] = 192    # 19.2 °C
    payload["data"][27] = 0
    client._on_data_sync(payload)
    assert s.chillerCurrentTemp == 19.2


def test_calibration_progress(qapp):
    s = AppState()
    client = PlcClient(s)
    client._on_calibration_sync({"progress": 42, "status": "Calibrating..."})
    assert s.calibrationProgress == 42
    assert s.calibrationStatus == "Calibrating..."


def test_seat_alarm(qapp):
    s = AppState()
    client = PlcClient(s)
    client._on_seat_alarm_sync({"seatNumber": 21})
    assert s.activeSeatAlarm == {"seatNumber": 21}
    assert s.showSeatAlarmModal is True


def test_connection_state_tracks_socket(qapp):
    s = AppState()
    client = PlcClient(s)
    client._on_connect_sync()
    assert s.connected is True
    client._on_disconnect_sync()
    assert s.connected is False


@pytest.mark.asyncio
async def test_write_register_emits(qapp):
    s = AppState()
    client = PlcClient(s)
    client._sio = MagicMock()
    client._sio.emit = AsyncMock()
    client.writeRegister("R01700", 200)
    # writeRegister schedules a task; wait briefly for it to land.
    await asyncio.sleep(0)
    await asyncio.sleep(0)
    client._sio.emit.assert_called_with(
        "writeRegister", {"register": "R01700", "value": 200}
    )


@pytest.mark.asyncio
async def test_write_bit_emits(qapp):
    s = AppState()
    client = PlcClient(s)
    client._sio = MagicMock()
    client._sio.emit = AsyncMock()
    client.writeBit("M0202", 1)
    await asyncio.sleep(0)
    await asyncio.sleep(0)
    client._sio.emit.assert_called_with(
        "writeBit", {"register": "M0202", "value": 1}
    )
```

- [ ] **Step 2: Run — expect import failure**

```bash
pytest tests/test_plc_client.py -v
```

Expected: ImportError.

- [ ] **Step 3: Write `app/plc_client.py`**

Content:
```python
"""Socket.io client for the PLC bridge at 192.168.77.100:4000.

Public surface (callable from QML):
- writeRegister(register: str, value: int)
- writeBit(register: str, value: int)

Inbound events update AppState via sync helpers (`_on_*_sync`) so they can be
unit-tested without an event loop.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import socketio
from PySide6.QtCore import QObject, Signal, Slot

from app import config
from app.plc_data_map import apply_data_array
from app.state import AppState

log = logging.getLogger(__name__)

# Chiller indices (memory: "Chiller link / run state (2026-05-26)").
_CHILLER_LINK_INDEX = 27          # === 10 → comm error
_CHILLER_LINK_COMM_ERROR = 10
_CHILLER_SET_TEMP_INDEX = 28      # raw / 10 = °C
_CHILLER_SET_TEMP_DIVISOR = 10.0
_CHILLER_STATUS_FLAG_INDEX = 29   # bit 0 = running


class PlcClient(QObject):
    connectionChanged = Signal(bool)

    def __init__(self, state: AppState) -> None:
        super().__init__()
        self._state = state
        self._sio: socketio.AsyncClient | None = None

    async def start(self, url: str | None = None) -> None:
        url = url or config.PLC_URL
        self._sio = socketio.AsyncClient(
            reconnection=True,
            reconnection_delay=1,
            reconnection_delay_max=5,
        )
        self._sio.on("connect", self._on_connect)
        self._sio.on("disconnect", self._on_disconnect)
        self._sio.on("data", self._on_data)
        self._sio.on("chillerData", self._on_chiller_data)
        self._sio.on("calibrationProgress", self._on_calibration)
        self._sio.on("seatAlarm", self._on_seat_alarm)
        try:
            await self._sio.connect(url, transports=["websocket", "polling"])
        except Exception:
            log.exception("PLC initial connect failed; library will keep retrying")

    # ---------- async wrappers (registered with socketio) ----------
    async def _on_connect(self) -> None:
        self._on_connect_sync()

    async def _on_disconnect(self) -> None:
        self._on_disconnect_sync()

    async def _on_data(self, payload: Any) -> None:
        self._on_data_sync(payload)

    async def _on_chiller_data(self, payload: Any) -> None:
        self._on_chiller_data_sync(payload)

    async def _on_calibration(self, payload: Any) -> None:
        self._on_calibration_sync(payload)

    async def _on_seat_alarm(self, payload: Any) -> None:
        self._on_seat_alarm_sync(payload)

    # ---------- sync handlers (unit-testable) ----------
    def _on_connect_sync(self) -> None:
        self._state.connected = True
        self.connectionChanged.emit(True)

    def _on_disconnect_sync(self) -> None:
        self._state.connected = False
        self.connectionChanged.emit(False)

    def _on_data_sync(self, payload: Any) -> None:
        if not isinstance(payload, dict):
            log.warning("PLC data: unexpected payload type %s", type(payload))
            return
        data = payload.get("data") or []
        if not isinstance(data, list):
            log.warning("PLC data: 'data' is not a list")
            return
        apply_data_array(self._state, data)
        self._apply_chiller_state(data)

    def _apply_chiller_state(self, data: list) -> None:
        """Three-index correlated logic for chiller link / set / run."""
        n = len(data)
        if n <= _CHILLER_LINK_INDEX:
            return
        if data[_CHILLER_LINK_INDEX] == _CHILLER_LINK_COMM_ERROR:
            # Bridge unreachable: hold last known set temp / running, flag the error.
            self._state.chillerCommError = True
            return
        self._state.chillerCommError = False
        if n > _CHILLER_SET_TEMP_INDEX:
            self._state.chillerSetTemp = (
                float(data[_CHILLER_SET_TEMP_INDEX]) / _CHILLER_SET_TEMP_DIVISOR
            )
        if n > _CHILLER_STATUS_FLAG_INDEX:
            self._state.chillerRunning = bool(int(data[_CHILLER_STATUS_FLAG_INDEX]) & 1)

    def _on_chiller_data_sync(self, payload: Any) -> None:
        """Only `currentTemp` is used. `running` is read from data[29] instead."""
        if not isinstance(payload, dict):
            return
        if "currentTemp" in payload:
            self._state.chillerCurrentTemp = float(payload["currentTemp"]) / 10.0

    def _on_calibration_sync(self, payload: Any) -> None:
        if not isinstance(payload, dict):
            return
        if "progress" in payload:
            self._state.calibrationProgress = int(payload["progress"])
        if "status" in payload:
            self._state.calibrationStatus = str(payload["status"])

    def _on_seat_alarm_sync(self, payload: Any) -> None:
        if not isinstance(payload, dict):
            return
        self._state.activeSeatAlarm = payload
        self._state.showSeatAlarmModal = True

    # ---------- QML-invokable slots ----------
    @Slot(str, int)
    def writeRegister(self, register: str, value: int) -> None:
        if self._sio is None:
            log.warning("writeRegister called before start()")
            return
        asyncio.create_task(
            self._sio.emit("writeRegister", {"register": register, "value": value})
        )

    @Slot(str, int)
    def writeBit(self, register: str, value: int) -> None:
        if self._sio is None:
            log.warning("writeBit called before start()")
            return
        asyncio.create_task(
            self._sio.emit("writeBit", {"register": register, "value": value})
        )
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_plc_client.py -v
```

Expected: 11 passed.

- [ ] **Step 5: Commit**

```bash
git add app/plc_client.py tests/test_plc_client.py
git commit -m "feat(plc): socket client with sync-testable handlers"
```

---

### Task 12: BControlClient — control / telemetry / status

The B-Control bridge at `localhost:3001`. Used by Compressor + TechnicalRoom + Sensors in later phases; we ship the client now so Phase 2 can just use it.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/bcontrol_client.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/test_bcontrol_client.py`

- [ ] **Step 1: Write failing test**

Content:
```python
import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.bcontrol_client import BControlClient


def test_telemetry_emits_signal(qapp):
    c = BControlClient()
    received = []
    c.telemetryReceived.connect(lambda payload: received.append(payload))
    c._on_telemetry_sync({"pressure": 1.4, "temp": 22.0})
    assert received == [{"pressure": 1.4, "temp": 22.0}]


def test_status_emits_signal(qapp):
    c = BControlClient()
    received = []
    c.statusReceived.connect(lambda payload: received.append(payload))
    c._on_status_sync({"connected": True, "profile": "default"})
    assert received == [{"connected": True, "profile": "default"}]


@pytest.mark.asyncio
async def test_control_emits_command(qapp):
    c = BControlClient()
    c._sio = MagicMock()
    c._sio.emit = AsyncMock()
    c.control("ON")
    await asyncio.sleep(0)
    await asyncio.sleep(0)
    c._sio.emit.assert_called_with("control", {"cmd": "ON"})
```

- [ ] **Step 2: Run — expect ImportError**

```bash
pytest tests/test_bcontrol_client.py -v
```

- [ ] **Step 3: Write `app/bcontrol_client.py`**

Content:
```python
"""B-Control bridge client at localhost:3001."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import socketio
from PySide6.QtCore import QObject, Signal, Slot

from app import config

log = logging.getLogger(__name__)


class BControlClient(QObject):
    telemetryReceived = Signal("QVariant")
    statusReceived = Signal("QVariant")
    connectionChanged = Signal(bool)

    def __init__(self) -> None:
        super().__init__()
        self._sio: socketio.AsyncClient | None = None

    async def start(self, url: str | None = None) -> None:
        url = url or config.BCONTROL_URL
        self._sio = socketio.AsyncClient(
            reconnection=True, reconnection_delay=1, reconnection_delay_max=5
        )
        self._sio.on("connect", lambda: self.connectionChanged.emit(True))
        self._sio.on("disconnect", lambda: self.connectionChanged.emit(False))
        self._sio.on("telemetry", self._on_telemetry)
        self._sio.on("status", self._on_status)
        try:
            await self._sio.connect(url, transports=["websocket", "polling"])
        except Exception:
            log.exception("B-Control initial connect failed")

    async def _on_telemetry(self, payload: Any) -> None:
        self._on_telemetry_sync(payload)

    async def _on_status(self, payload: Any) -> None:
        self._on_status_sync(payload)

    def _on_telemetry_sync(self, payload: Any) -> None:
        self.telemetryReceived.emit(payload)

    def _on_status_sync(self, payload: Any) -> None:
        self.statusReceived.emit(payload)

    @Slot(str)
    def control(self, cmd: str) -> None:
        if self._sio is None:
            log.warning("control called before start()")
            return
        asyncio.create_task(self._sio.emit("control", {"cmd": cmd}))
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_bcontrol_client.py -v
```

Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add app/bcontrol_client.py tests/test_bcontrol_client.py
git commit -m "feat(bcontrol): client for control/telemetry/status events"
```

---

### Task 13: VitalsClient — vital signs socket

Talks to the configurable URL (currently the ngrok endpoint). Events from `renderer/pages/home.tsx:61-114`: `data`, `serialData`, `vitalSigns`. Emit: `serialSend`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/vitals_client.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/test_vitals_client.py`

- [ ] **Step 1: Write failing test**

Content:
```python
import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.vitals_client import VitalsClient


def test_vital_signs_emits(qapp):
    c = VitalsClient()
    received = []
    c.vitalSignsReceived.connect(lambda p: received.append(p))
    c._on_vital_signs_sync({"heartRate": "72", "oxygenSaturation": "98", "bloodPressure": "120/80"})
    assert received == [
        {"heartRate": "72", "oxygenSaturation": "98", "bloodPressure": "120/80"}
    ]


def test_serial_data_emits(qapp):
    c = VitalsClient()
    received = []
    c.serialDataReceived.connect(lambda p: received.append(p))
    c._on_serial_data_sync("RAW123")
    assert received == ["RAW123"]


@pytest.mark.asyncio
async def test_send_command(qapp):
    c = VitalsClient()
    c._sio = MagicMock()
    c._sio.emit = AsyncMock()
    c.serialSend("M")
    await asyncio.sleep(0)
    await asyncio.sleep(0)
    c._sio.emit.assert_called_with("serialSend", "M")
```

- [ ] **Step 2: Run — expect failure, then write `app/vitals_client.py`**

```bash
pytest tests/test_vitals_client.py -v   # fails
```

Content of `app/vitals_client.py`:
```python
"""Vital-signs socket client (currently the ngrok endpoint)."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import socketio
from PySide6.QtCore import QObject, Signal, Slot

from app import config

log = logging.getLogger(__name__)


class VitalsClient(QObject):
    vitalSignsReceived = Signal("QVariant")
    serialDataReceived = Signal("QVariant")
    connectionChanged = Signal(bool)

    def __init__(self) -> None:
        super().__init__()
        self._sio: socketio.AsyncClient | None = None

    async def start(self, url: str | None = None) -> None:
        url = url or config.VITAL_SIGNS_URL
        self._sio = socketio.AsyncClient(
            reconnection=True, reconnection_delay=1, reconnection_delay_max=5
        )
        self._sio.on("connect", lambda: self.connectionChanged.emit(True))
        self._sio.on("disconnect", lambda: self.connectionChanged.emit(False))
        self._sio.on("vitalSigns", self._on_vital_signs)
        self._sio.on("serialData", self._on_serial_data)
        try:
            await self._sio.connect(url, transports=["websocket", "polling"])
        except Exception:
            log.exception("vitals initial connect failed")

    async def _on_vital_signs(self, payload: Any) -> None:
        self._on_vital_signs_sync(payload)

    async def _on_serial_data(self, payload: Any) -> None:
        self._on_serial_data_sync(payload)

    def _on_vital_signs_sync(self, payload: Any) -> None:
        self.vitalSignsReceived.emit(payload)

    def _on_serial_data_sync(self, payload: Any) -> None:
        self.serialDataReceived.emit(payload)

    @Slot(str)
    def serialSend(self, command: str) -> None:
        if self._sio is None:
            log.warning("serialSend called before start()")
            return
        asyncio.create_task(self._sio.emit("serialSend", command))
```

- [ ] **Step 3: Run — expect pass**

```bash
pytest tests/test_vitals_client.py -v
```

Expected: 3 passed.

- [ ] **Step 4: Commit**

```bash
git add app/vitals_client.py tests/test_vitals_client.py
git commit -m "feat(vitals): client for vitalSigns/serialData/serialSend"
```

---

### Task 14: RestClient — async httpx wrapper + Turkish errors

The full endpoint inventory is in `renderer/api/*.ts`. We expose one method per endpoint, return parsed JSON, and emit `errorOccurred(str)` with a Turkish message on any failure.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/app/rest_client.py`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/tests/test_rest_client.py`

- [ ] **Step 1: Write failing test**

Content:
```python
import pytest
import respx
from httpx import Response

from app.rest_client import RestClient


@pytest.mark.asyncio
async def test_get_chambers_returns_list(qapp):
    client = RestClient()
    with respx.mock(base_url="http://localhost:3001/api") as mock:
        mock.get("/chambers").mock(return_value=Response(200, json=[{"id": 1}]))
        result = await client.get_chambers()
        assert result == [{"id": 1}]


@pytest.mark.asyncio
async def test_get_chamber_by_id(qapp):
    client = RestClient()
    with respx.mock(base_url="http://localhost:3001/api") as mock:
        mock.get("/chambers/42").mock(return_value=Response(200, json={"id": 42}))
        result = await client.get_chamber(42)
        assert result == {"id": 42}


@pytest.mark.asyncio
async def test_get_latest_reading(qapp):
    client = RestClient()
    with respx.mock(base_url="http://localhost:3001/api") as mock:
        mock.get("/chambers/1/readings/latest").mock(
            return_value=Response(200, json={"o2": 21.0})
        )
        assert await client.get_latest_reading(1) == {"o2": 21.0}


@pytest.mark.asyncio
async def test_error_emits_turkish_message(qapp):
    client = RestClient()
    received = []
    client.errorOccurred.connect(lambda msg: received.append(msg))
    with respx.mock(base_url="http://localhost:3001/api") as mock:
        mock.get("/chambers").mock(return_value=Response(500, json={"error": "boom"}))
        result = await client.get_chambers()
        assert result is None
        assert received and "sunucu" in received[0].lower()


@pytest.mark.asyncio
async def test_network_error_emits_turkish_message(qapp):
    client = RestClient()
    received = []
    client.errorOccurred.connect(lambda msg: received.append(msg))
    with respx.mock(base_url="http://localhost:3001/api") as mock:
        mock.get("/chambers").mock(side_effect=ConnectionError("nope"))
        result = await client.get_chambers()
        assert result is None
        assert received and "bağlan" in received[0].lower()
```

- [ ] **Step 2: Run — expect failure**

```bash
pytest tests/test_rest_client.py -v
```

- [ ] **Step 3: Write `app/rest_client.py`**

Content:
```python
"""Async REST client. Endpoint inventory matches renderer/api/*.ts."""

from __future__ import annotations

import logging
from typing import Any

import httpx
from PySide6.QtCore import QObject, Signal

from app import config

log = logging.getLogger(__name__)


def _translate(exc: Exception) -> str:
    """Turkish error message — mirrors handleApiError() in renderer/api/index.ts."""
    if isinstance(exc, httpx.TimeoutException):
        return "Sunucu zaman aşımı (10 sn)."
    if isinstance(exc, httpx.ConnectError) or isinstance(exc, ConnectionError):
        return "Sunucuya bağlanılamadı."
    if isinstance(exc, httpx.HTTPStatusError):
        code = exc.response.status_code
        if code == 404:
            return "İstek bulunamadı (404)."
        if code >= 500:
            return f"Sunucu hatası ({code})."
        return f"İstek başarısız ({code})."
    return f"Bilinmeyen hata: {exc.__class__.__name__}"


class RestClient(QObject):
    errorOccurred = Signal(str)

    def __init__(self) -> None:
        super().__init__()
        self._client = httpx.AsyncClient(
            base_url=config.REST_BASE_URL, timeout=config.REST_TIMEOUT_SECONDS
        )

    async def _get(self, path: str) -> Any | None:
        try:
            r = await self._client.get(path)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            log.warning("GET %s failed: %s", path, exc)
            self.errorOccurred.emit(_translate(exc))
            return None

    async def _post(self, path: str, json: Any | None = None) -> Any | None:
        try:
            r = await self._client.post(path, json=json)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            log.warning("POST %s failed: %s", path, exc)
            self.errorOccurred.emit(_translate(exc))
            return None

    async def _put(self, path: str, json: Any | None = None) -> Any | None:
        try:
            r = await self._client.put(path, json=json)
            r.raise_for_status()
            return r.json()
        except Exception as exc:
            log.warning("PUT %s failed: %s", path, exc)
            self.errorOccurred.emit(_translate(exc))
            return None

    async def _delete(self, path: str) -> Any | None:
        try:
            r = await self._client.delete(path)
            r.raise_for_status()
            return r.json() if r.content else {}
        except Exception as exc:
            log.warning("DELETE %s failed: %s", path, exc)
            self.errorOccurred.emit(_translate(exc))
            return None

    # ---------------- Chambers ----------------
    async def get_chambers(self) -> Any | None:
        return await self._get("/chambers")

    async def get_chamber(self, chamber_id: int) -> Any | None:
        return await self._get(f"/chambers/{chamber_id}")

    async def create_chamber(self, body: dict) -> Any | None:
        return await self._post("/chambers", json=body)

    async def update_chamber(self, chamber_id: int, body: dict) -> Any | None:
        return await self._put(f"/chambers/{chamber_id}", json=body)

    async def delete_chamber(self, chamber_id: int) -> Any | None:
        return await self._delete(f"/chambers/{chamber_id}")

    async def get_latest_reading(self, chamber_id: int) -> Any | None:
        return await self._get(f"/chambers/{chamber_id}/readings/latest")

    async def get_chamber_readings(self, chamber_id: int) -> Any | None:
        return await self._get(f"/chambers/{chamber_id}/readings")

    async def update_alarm_level(self, chamber_id: int, body: dict) -> Any | None:
        return await self._put(f"/chambers/{chamber_id}/alarm-level", json=body)

    # ---------------- Alarms ----------------
    async def get_active_alarms(self) -> Any | None:
        return await self._get("/alarms")

    async def get_alarm_history(self) -> Any | None:
        return await self._get("/alarms/history")

    async def get_alarm_stats(self) -> Any | None:
        return await self._get("/alarms/stats")

    async def get_alarm(self, alarm_id: int) -> Any | None:
        return await self._get(f"/alarms/{alarm_id}")

    async def mute_alarm(self, alarm_id: int) -> Any | None:
        return await self._post(f"/alarms/{alarm_id}/mute")

    async def resolve_alarm(self, alarm_id: int) -> Any | None:
        return await self._post(f"/alarms/{alarm_id}/resolve")

    # ---------------- Settings / Calibration ----------------
    async def get_chamber_settings(self, chamber_id: int) -> Any | None:
        return await self._get(f"/settings/{chamber_id}")

    async def update_chamber_settings(self, chamber_id: int, body: dict) -> Any | None:
        return await self._put(f"/settings/{chamber_id}", json=body)

    async def get_active_calibration_points(self, chamber_id: int) -> Any | None:
        return await self._get(f"/settings/{chamber_id}/calibration-points")

    async def calibrate_reading(self, chamber_id: int, body: dict) -> Any | None:
        return await self._post(f"/settings/{chamber_id}/calibrate-reading", json=body)

    async def get_calibration_status(self, chamber_id: int) -> Any | None:
        return await self._get(f"/settings/{chamber_id}/calibration-status")

    # ---------------- Analytics ----------------
    async def get_dashboard_data(self) -> Any | None:
        return await self._get("/analytics/dashboard")

    async def get_o2_trends(self) -> Any | None:
        return await self._get("/analytics/trends")

    async def get_calibration_reports(self) -> Any | None:
        return await self._get("/analytics/reports/calibration-history")

    async def get_alarm_summary(self) -> Any | None:
        return await self._get("/analytics/reports/alarm-summary")
```

- [ ] **Step 4: Run — expect pass**

```bash
pytest tests/test_rest_client.py -v
```

Expected: 5 passed. If the Turkish-keyword assertions fail because the message text differs, update the assertions or the `_translate` mapping — both files should agree.

- [ ] **Step 5: Commit**

```bash
git add app/rest_client.py tests/test_rest_client.py
git commit -m "feat(rest): async httpx client with Turkish error mapping"
```

---

### Task 15: main.py — wire real AppState + clients + qasync loop

Replace the Phase 0 stub with the real `AppState` and start the async clients on the qasync loop. `Main.qml` is unchanged.

**Files:**
- Modify: `/Users/sencersoylu/Projects/MY_APP_QT/main.py` (full rewrite)

- [ ] **Step 1: Rewrite `main.py`**

Content:
```python
"""Phase 1 bootstrap: AppState + four async clients on the qasync loop."""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path

import qasync
from PySide6.QtGui import QGuiApplication
from PySide6.QtQml import QQmlApplicationEngine

from app.bcontrol_client import BControlClient
from app.plc_client import PlcClient
from app.rest_client import RestClient
from app.state import AppState
from app.vitals_client import VitalsClient

ROOT = Path(__file__).resolve().parent
QML_DIR = ROOT / "qml"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("rsp-qt")


def main() -> int:
    app = QGuiApplication(sys.argv)
    loop = qasync.QEventLoop(app)
    asyncio.set_event_loop(loop)

    state = AppState()
    plc = PlcClient(state)
    bcontrol = BControlClient()
    vitals = VitalsClient()
    rest = RestClient()

    engine = QQmlApplicationEngine()
    engine.addImportPath(str(QML_DIR))
    ctx = engine.rootContext()
    ctx.setContextProperty("appState", state)
    ctx.setContextProperty("plcClient", plc)
    ctx.setContextProperty("bcontrolClient", bcontrol)
    ctx.setContextProperty("vitalsClient", vitals)
    ctx.setContextProperty("restClient", rest)
    engine.load(QML_DIR / "Main.qml")

    if not engine.rootObjects():
        log.error("QML failed to load")
        return 1

    # Kick off the network clients.
    loop.create_task(plc.start())
    loop.create_task(bcontrol.start())
    loop.create_task(vitals.start())

    with loop:
        return loop.run_forever() or 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 2: Run the app**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py
```

Expected:
- Window opens (Phase 0 visual unchanged).
- Console logs from `python-socketio` showing reconnect attempts (the backends aren't running on the dev machine — that's fine).
- `Ctrl+D` still flips dark mode, and the new value persists across an app restart.

- [ ] **Step 3: Verify persistence by restarting**

Inside the running app press `Ctrl+D` so "Dark mode: OFF" is shown, then close the window (Cmd+Q). Run `python main.py` again. The window should open with "Dark mode: OFF" still set. Press `Ctrl+D` again to flip it back to ON before continuing.

- [ ] **Step 4: Run the full test suite**

```bash
pytest -q
```

Expected: All tests across `test_state`, `test_plc_data_map`, `test_plc_client`, `test_bcontrol_client`, `test_vitals_client`, `test_rest_client` pass.

- [ ] **Step 5: Commit**

```bash
git add main.py
git commit -m "feat: wire AppState + clients into qasync loop"
```

---

### Task 16: Phase 1 milestone tag

- [ ] **Step 1: Tag**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
git tag phase-1-complete
git log --oneline
```

Expected: tag `phase-1-complete` on the most recent commit, ~14 commits in total.

---

## Self-Review Notes (already applied above)

- **Spec coverage:** §2 layout → Tasks 1–3, 7; §3 AppState → Task 8; §4 clients → Tasks 10–13; §4.3 REST → Task 14; §4.4 event loop → Task 15. Phase 0 exit criterion verified in Task 6 Step 3; Phase 1 exit criterion verified in Task 15 Steps 2–4.
- **Placeholder scan:** every step contains either a command, a verbatim file body, or both. No TBD/TODO.
- **Type consistency:** method signatures `writeRegister(register, value)` and `writeBit(register, value)` match across the client, tests, and the corrected spec. `apply_data_array(state, payload)` signature matches between map and client.
- **Spec deltas folded in:** `anteFssWarning`; `darkMode=True` default; chiller correlated indices 27/28/29 (corrected from the wrong store.ts comment); air tank moved to `data[30]`; chamber sensor fields (`mainPressure`, `mainO2`, `mainTemp`, `mainHumidity`, `antePressure`, `anteO2`, `anteTemp`, `anteHumidity`) and tech fields (`techO2Pressure`, `anteFssNitrogenPressure`) hoisted from React component-local state into `AppState`; `data[3]` confirmed as `anteHumidity`; `chillerData` event now PV-only (running ignored). All reflected in code, tests, and the spec.

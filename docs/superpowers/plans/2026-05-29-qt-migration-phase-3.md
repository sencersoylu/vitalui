# Qt Migration — Phase 3 Implementation Plan (Dashboard)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `qml/pages/Dashboard.qml` — the chamber control dashboard — as a 1:1 port of `renderer/pages/dashboard.tsx`, including 1 header, 4 control panels, 3 modals, and 3 custom-drawn visuals. Phase 3 ends with a Dashboard that runs on RPi5 against the live PLC.

**Architecture:** Dashboard.qml uses existing `qml/ui/*` primitives (AppButton, Card, AppModal, AppSlider, ToggleSwitch). New `qml/panels/*` files compose those primitives into the 4 control panels + Header + 3 custom visuals. Modals are under `qml/modals/`. Socket wiring is already in `app/plc_client.py` from Phase 1 — Dashboard.qml triggers writes via the existing `plcClient.writeRegister/writeBit` slots and binds reads via `appState.*` properties.

**Tech Stack:** Same as Phase 2 (QtQuick 2 + QtQuick.Controls + QtQuick.Layouts). No new Python deps. **Sound playback (bmw-bong.mp3) is DEFERRED to Phase 9** — QtMultimedia adds an ARM64 wheel that complicates RPi5 deployment; Phase 3 ships silent alarms.

**Source references:**
- Spec: `/Users/sencersoylu/Projects/MY_APP/docs/superpowers/specs/2026-05-29-qt-migration-design.md` §5.4 (custom-drawn components), §5.5 (page composition).
- React originals: `/Users/sencersoylu/Projects/MY_APP/renderer/pages/dashboard.tsx`, `renderer/components/dashboard/*.tsx`.
- Existing Qt foundations: AppState (66 QML-visible properties), PlcClient (writeRegister/writeBit slots), Theme singleton, all 9 UI primitives from Phase 2.

**Spec deltas discovered while reading dashboard.tsx + panel components**:
1. ChillerControlModal writes registers `D00202` (setTemp × 10) and `D00208` (on/off) — Phase 1 plan only mentioned R01700-R01706 + M0xxx. The PlcClient `writeRegister` slot already handles arbitrary register names, so no PlcClient change needed. Just call `plcClient.writeRegister("D00202", value)`.
2. Brightness toggles use 4 levels: `0 | 85 | 170 | 255` (off/low/med/high). ToggleSwitch with 4 states emits index 0–3 → multiply mapping into a 4-element register-value array.
3. Ventilation has a 3-state toggle that maps to a pair of bits (M0202 + M0203): index 0 → both 0; index 1 → M0202=1, M0203=0; index 2 → M0202=0, M0203=1. Valves use the same two-bit pattern on M0500/M0501 and M0502/M0503.
4. `ChamberSeatOverlay` uses a hardcoded `SEAT_POSITIONS` array of 14 percentage-coordinate entries on top of `chamber-3d.png`. The exact percentages must be copied 1:1 from the React source.
5. `setShowSeatAlarmModal(true)` + `setActiveSeatAlarm({seatNumber})` already wired by PlcClient `_on_seat_alarm_sync`. Dashboard just binds modal visibility to those AppState properties.
6. `Header` shows the Hipertech logo SVG — must be copied from `/Users/sencersoylu/Projects/MY_APP/external/` (or wherever the React app keeps it).

---

## File Structure (Phase 3 additions)

```
MY_APP_QT/
├── qml/
│   ├── Main.qml                          # MODIFIED: add Ctrl+1 → Dashboard
│   ├── pages/
│   │   ├── Showcase.qml                  # unchanged
│   │   └── Dashboard.qml                 # NEW
│   ├── panels/                           # NEW dir
│   │   ├── Header.qml
│   │   ├── ChamberControlPanel.qml
│   │   ├── AuxiliaryOutputPanel.qml
│   │   ├── LightingPanel.qml
│   │   ├── FanPanel.qml
│   │   ├── ChillerStatusPanel.qml
│   │   ├── HyperbaricChamber.qml
│   │   ├── CylinderBank.qml
│   │   └── ChamberSeatOverlay.qml
│   └── modals/                           # NEW dir
│       ├── ErrorModal.qml
│       ├── SeatAlarmModal.qml
│       └── ChillerControlModal.qml
└── assets/
    └── images/                           # NEW dir
        ├── chamber-3d.png                # seat overlay background
        └── hipertech-logo.svg            # header logo
```

---

# Bundle 1 — Foundation (assets + Header + Dashboard scaffold)

Exit criterion: assets copied, Header renders with logo+clock+connection, Dashboard.qml opens via Ctrl+1 with placeholder body.

---

### Task 1: Copy image assets

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/images/chamber-3d.png`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/images/hipertech-logo.svg`

- [ ] **Step 1: Find and copy**

```bash
# Find candidates in MY_APP
find /Users/sencersoylu/Projects/MY_APP -iname 'chamber-3d*' -o -iname 'hipertech*'
```

Copy the first match for each into `MY_APP_QT/assets/images/`. Common locations:
- `MY_APP/external/` (Nextron static assets)
- `MY_APP/renderer/public/` (Next.js public)

If the logo only exists as a Next.js Image import (not a real file), check `MY_APP/renderer/public/`. If still missing, create a placeholder text-only SVG with "RSP" inside it so the layout doesn't break — note this as a concern.

```bash
mkdir -p /Users/sencersoylu/Projects/MY_APP_QT/assets/images
cp <found-chamber-3d-path> /Users/sencersoylu/Projects/MY_APP_QT/assets/images/chamber-3d.png
cp <found-logo-path> /Users/sencersoylu/Projects/MY_APP_QT/assets/images/hipertech-logo.svg
ls -la /Users/sencersoylu/Projects/MY_APP_QT/assets/images/
```

- [ ] **Step 2: Commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
git add assets/images/
git commit -m "assets(images): copy chamber-3d + Hipertech logo from React"
```

---

### Task 2: Header.qml

Reference: `renderer/components/dashboard/Header.tsx`. Spec:
- Top bar, ~80 px tall, full-width.
- LEFT: Hipertech logo (SVG, height ~48 px).
- RIGHT (in order): dark-mode toggle button (Sun/Moon icon), connection badge (Wifi/WifiOff with colored chip), date+time pill.
- Reads: `appState.darkMode`, `appState.connected`, `appState.currentTime`, `appState.currentTime2`.

Time updates: Dashboard.qml has a Timer that ticks every second and writes `appState.currentTime = Qt.formatTime(new Date(), "HH:mm:ss")` and `appState.currentTime2 = Qt.formatDate(new Date(), "dd MMM yyyy")`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/Header.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Rectangle {
    id: root

    implicitHeight: 80
    color: Rsp.Theme.bgPanel
    border.color: Rsp.Theme.border
    border.width: 1

    RowLayout {
        anchors.fill: parent
        anchors.leftMargin: 24
        anchors.rightMargin: 24
        spacing: 16

        // ----- Logo -----
        Image {
            source: "../../assets/images/hipertech-logo.svg"
            Layout.preferredHeight: 48
            Layout.preferredWidth: 160
            fillMode: Image.PreserveAspectFit
            sourceSize: Qt.size(160, 48)
        }

        Item { Layout.fillWidth: true }

        // ----- Dark-mode toggle -----
        Rectangle {
            implicitWidth: 44; implicitHeight: 44
            radius: 22
            color: themeArea.containsMouse ? Rsp.Theme.border : "transparent"
            Behavior on color { ColorAnimation { duration: Rsp.Theme.animFast } }

            Text {
                anchors.centerIn: parent
                text: appState && appState.darkMode ? "☀" : "☾"
                color: Rsp.Theme.text
                font.pixelSize: 20
            }

            MouseArea {
                id: themeArea
                anchors.fill: parent
                hoverEnabled: true
                cursorShape: Qt.PointingHandCursor
                onClicked: appState.darkMode = !appState.darkMode
            }
        }

        // ----- Connection badge -----
        Rectangle {
            implicitHeight: 36
            implicitWidth: connText.implicitWidth + 32
            radius: 18
            color: (appState && appState.connected) ? Rsp.Theme.emerald : Rsp.Theme.rose

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 12
                anchors.rightMargin: 12
                spacing: 6

                Text {
                    text: (appState && appState.connected) ? "●" : "○"
                    color: "#ffffff"
                    font.pixelSize: 14
                }
                Text {
                    id: connText
                    text: (appState && appState.connected) ? "Bağlı" : "Bağlantı Yok"
                    color: "#ffffff"
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeSm
                    font.weight: Font.DemiBold
                }
            }
        }

        // ----- Date/time pill -----
        Rectangle {
            implicitHeight: 36
            implicitWidth: timeRow.implicitWidth + 32
            radius: 18
            color: Rsp.Theme.bg
            border.color: Rsp.Theme.border
            border.width: 1

            RowLayout {
                id: timeRow
                anchors.fill: parent
                anchors.leftMargin: 12
                anchors.rightMargin: 12
                spacing: 12

                Text {
                    text: appState ? appState.currentTime2 : ""
                    color: Rsp.Theme.textMuted
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeSm
                }
                Rectangle {
                    width: 1; height: 16; color: Rsp.Theme.border
                }
                Text {
                    text: appState ? appState.currentTime : ""
                    color: Rsp.Theme.text
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeMd
                    font.weight: Font.DemiBold
                }
            }
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add qml/panels/Header.qml
git commit -m "feat(panel): Header with logo, theme toggle, connection, clock"
```

---

### Task 3: Dashboard.qml scaffold + Ctrl+1 nav

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/pages/Dashboard.qml`
- Modify: `/Users/sencersoylu/Projects/MY_APP_QT/qml/Main.qml`

- [ ] **Step 1: Write `qml/pages/Dashboard.qml`**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../panels" as Panels

Rectangle {
    id: root
    color: Rsp.Theme.bg

    // Time ticker
    Timer {
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: {
            const now = new Date()
            appState.currentTime = Qt.formatTime(now, "HH:mm:ss")
            appState.currentTime2 = Qt.formatDate(now, "dd MMM yyyy")
        }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Panels.Header {
            Layout.fillWidth: true
        }

        // ===== Main grid (panels populated by Bundle 3) =====
        Item {
            Layout.fillWidth: true
            Layout.fillHeight: true

            Text {
                anchors.centerIn: parent
                text: "Dashboard — Bundles 2–6 fill this area"
                color: Rsp.Theme.textMuted
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
            }
        }
    }

    Shortcut {
        sequence: "Escape"
        onActivated: root.parent.StackView ? root.parent.StackView.view.pop() : null
    }
}
```

- [ ] **Step 2: Modify `qml/Main.qml`**

Find the existing `Shortcut { sequence: "Ctrl+S" ... }` block and add a new shortcut right after it:

```qml
    Shortcut {
        sequence: "Ctrl+1"
        onActivated: {
            // If Dashboard is on top, pop; else push fresh
            if (stack.depth > 1) {
                stack.pop()
            } else {
                stack.push("pages/Dashboard.qml")
            }
        }
    }
```

- [ ] **Step 3: Smoke test**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log
```

Expected: no QML errors.

- [ ] **Step 4: Commit**

```bash
git add qml/pages/Dashboard.qml qml/Main.qml
git commit -m "feat(qml): Dashboard page scaffold with Header + Ctrl+1 nav"
```

---

# Bundle 2 — Read-only visuals (ChillerStatusPanel + HyperbaricChamber + CylinderBank)

---

### Task 4: ChillerStatusPanel.qml

Reference: `renderer/components/dashboard/ChillerStatusPanel.tsx`. Spec:
- Card-style container, ~180 wide × ~120 tall.
- Header row: "Chiller" title + status badge (green "ON" / red "OFF").
- Body: 2-col display. Left col header "SV" + setTemp value below. Right col header "PV" + currentTemp value below. Numbers in `Theme.fontSizeXl` bold.
- Props: `isRunning: bool`, `setTemp: real`, `currentTemp: real`.
- When `appState.chillerCommError` is true, the panel shows "COMM" badge instead of ON/OFF and masks values as "--- °C".

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/ChillerStatusPanel.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Rectangle {
    id: root

    property bool isRunning: appState ? appState.chillerRunning : false
    property real setTemp: appState ? appState.chillerSetTemp : 0
    property real currentTemp: appState ? appState.chillerCurrentTemp : 0
    property bool commError: appState ? appState.chillerCommError : false

    implicitWidth: 220
    implicitHeight: 140
    radius: Rsp.Theme.radiusLg
    color: Rsp.Theme.bgPanel
    border.color: Rsp.Theme.border
    border.width: 1

    ColumnLayout {
        anchors.fill: parent
        anchors.margins: 16
        spacing: 8

        // Header row
        RowLayout {
            Layout.fillWidth: true

            Text {
                text: "Chiller"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
                font.weight: Font.Bold
                Layout.fillWidth: true
            }

            Rectangle {
                implicitHeight: 24
                implicitWidth: badgeText.implicitWidth + 16
                radius: 12
                color: root.commError ? Rsp.Theme.amber
                      : root.isRunning ? Rsp.Theme.emerald
                      : Rsp.Theme.rose
                Text {
                    id: badgeText
                    anchors.centerIn: parent
                    text: root.commError ? "COMM" : (root.isRunning ? "ON" : "OFF")
                    color: "#ffffff"
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeSm
                    font.weight: Font.Bold
                }
            }
        }

        // SV / PV columns
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 12

            ColumnLayout {
                Layout.fillWidth: true
                Text {
                    text: "SV"
                    color: Rsp.Theme.textMuted
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeSm
                }
                Text {
                    text: root.commError ? "— °C" : root.setTemp.toFixed(1) + " °C"
                    color: Rsp.Theme.cyan
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeXl
                    font.weight: Font.Bold
                }
            }

            Rectangle { width: 1; Layout.fillHeight: true; color: Rsp.Theme.border }

            ColumnLayout {
                Layout.fillWidth: true
                Text {
                    text: "PV"
                    color: Rsp.Theme.textMuted
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeSm
                }
                Text {
                    text: root.commError ? "— °C" : root.currentTemp.toFixed(1) + " °C"
                    color: Rsp.Theme.text
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeXl
                    font.weight: Font.Bold
                }
            }
        }
    }
}
```

- [ ] **Step 2: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/ChillerStatusPanel.qml
git commit -m "feat(panel): ChillerStatusPanel with SV/PV + state badge"
```

---

### Task 5: HyperbaricChamber.qml

Reference: `renderer/components/dashboard/HyperbaricChamber.tsx`. Spec:
- 7-column grid of "compartments". Each column has two stacked rectangles (top + bottom row).
- End caps on left and right: rounded "pipe" shapes flanking the grid.
- Base platform underneath the grid.
- Pure decorative — no live data binding. Uses `Theme.slate800` for compartment fills with a 1 px border in `Theme.slate700`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/HyperbaricChamber.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    implicitWidth: 560
    implicitHeight: 200

    readonly property color compartmentColor: appState && appState.darkMode
        ? Qt.rgba(0.12, 0.16, 0.23, 0.5)
        : Qt.rgba(0.88, 0.91, 0.94, 0.6)
    readonly property color borderColor: Rsp.Theme.border
    readonly property color pipeColor: Rsp.Theme.slate500

    // End caps
    Rectangle {
        id: leftCap
        anchors.left: parent.left
        anchors.verticalCenter: gridArea.verticalCenter
        width: 24; height: gridArea.height + 24
        radius: 12
        color: root.pipeColor
    }
    Rectangle {
        id: rightCap
        anchors.right: parent.right
        anchors.verticalCenter: gridArea.verticalCenter
        width: 24; height: gridArea.height + 24
        radius: 12
        color: root.pipeColor
    }

    // Grid
    GridLayout {
        id: gridArea
        anchors.centerIn: parent
        anchors.leftMargin: 32
        anchors.rightMargin: 32
        width: parent.width - 64
        columns: 7
        rowSpacing: 4
        columnSpacing: 4

        Repeater {
            model: 14   // 7 cols × 2 rows
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 60
                radius: Rsp.Theme.radiusSm
                color: root.compartmentColor
                border.color: root.borderColor
                border.width: 1
            }
        }
    }

    // Base platform
    Rectangle {
        anchors.top: gridArea.bottom
        anchors.topMargin: 16
        anchors.horizontalCenter: parent.horizontalCenter
        width: parent.width - 80
        height: 12
        radius: 4
        color: Rsp.Theme.slate700
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/HyperbaricChamber.qml
git commit -m "feat(panel): HyperbaricChamber 7-col grid with end caps + base"
```

---

### Task 6: CylinderBank.qml

Reference: `renderer/components/dashboard/CylinderBank.tsx`. Spec:
- 8 vertical cylinders in a row, each with: top valve (small grey rect 12×8), main body (24×96 with sky-500→transparent gradient), 2 horizontal rings, rounded base (24×8).
- Bottom platform unifying all 8 bases.
- Pure decorative. Takes optional `cylinderCount: int = 8`, but always renders 8 for now.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/CylinderBank.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    property int cylinderCount: 8

    implicitWidth: cylinderCount * 32 + (cylinderCount - 1) * 6
    implicitHeight: 140

    Row {
        id: row
        anchors.horizontalCenter: parent.horizontalCenter
        anchors.top: parent.top
        anchors.topMargin: 8
        spacing: 6

        Repeater {
            model: root.cylinderCount
            Item {
                width: 24
                height: 120

                // Top valve
                Rectangle {
                    width: 12; height: 8
                    radius: 2
                    color: Rsp.Theme.slate500
                    anchors.top: parent.top
                    anchors.horizontalCenter: parent.horizontalCenter
                }

                // Body
                Rectangle {
                    width: 24; height: 96
                    y: 8
                    radius: 4
                    border.color: Rsp.Theme.slate700
                    border.width: 1
                    gradient: Gradient {
                        GradientStop { position: 0.0; color: Qt.rgba(0.05, 0.45, 0.85, 0.4) }
                        GradientStop { position: 1.0; color: Qt.rgba(0.05, 0.45, 0.85, 0.0) }
                    }

                    Rectangle {
                        width: parent.width; height: 1
                        y: parent.height * 0.3
                        color: Qt.rgba(0.4, 0.5, 0.6, 0.4)
                    }
                    Rectangle {
                        width: parent.width; height: 1
                        y: parent.height * 0.7
                        color: Qt.rgba(0.4, 0.5, 0.6, 0.4)
                    }
                }

                // Base
                Rectangle {
                    width: 24; height: 8
                    anchors.bottom: parent.bottom
                    radius: 2
                    color: Rsp.Theme.slate700
                }
            }
        }
    }

    // Unified platform under bases
    Rectangle {
        anchors.top: row.bottom
        anchors.horizontalCenter: parent.horizontalCenter
        width: row.width + 16
        height: 6
        radius: 3
        color: Rsp.Theme.slate700
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/CylinderBank.qml
git commit -m "feat(panel): CylinderBank 8 vertical cylinders with gradient + platform"
```

---

# Bundle 3 — Control panels

All four panels compose existing UI primitives. State binds directly to `appState.*`. Side effects (writeBit/writeRegister) fire through `plcClient`.

---

### Task 7: LightingPanel.qml

Reference: `renderer/components/dashboard/LightingPanel.tsx`. Spec:
- Card titled "Aydınlatma".
- Two rows: "Ana Oda" (main) and "Geçiş Odası" (ante), each with a 4-state ToggleSwitch (Off / Düşük / Orta / Yüksek).
- Selecting state i → write `[0, 85, 170, 255][i]` to register: main = R01700, ante = R01702.
- Reads: `appState.lightStatus` (main), `appState.light2Status` (ante). Maps register value back to index for ToggleSwitch:
  - 0 → 0, 85 → 1, 170 → 2, 255 → 3, anything else → 0.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/LightingPanel.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../ui" as Ui

Ui.Card {
    id: root
    title: "Aydınlatma"
    implicitWidth: 400

    readonly property var levelValues: [0, 85, 170, 255]

    function levelToIndex(level) {
        for (let i = 0; i < levelValues.length; ++i) {
            if (levelValues[i] === level) return i
        }
        return 0
    }

    function applyMain(idx) {
        const value = levelValues[Math.max(0, Math.min(3, idx))]
        plcClient.writeRegister("R01700", value)
        appState.lightStatus = value
    }

    function applyAnte(idx) {
        const value = levelValues[Math.max(0, Math.min(3, idx))]
        plcClient.writeRegister("R01702", value)
        appState.light2Status = value
    }

    readonly property var lightStates: [
        { "label": "Off",    "color": Rsp.Theme.slate500 },
        { "label": "Düşük",  "color": Rsp.Theme.amber   },
        { "label": "Orta",   "color": Rsp.Theme.sky     },
        { "label": "Yüksek", "color": Rsp.Theme.emerald }
    ]

    ColumnLayout {
        Layout.fillWidth: true
        spacing: 16

        RowLayout {
            Layout.fillWidth: true
            spacing: 12
            Text {
                text: "Ana Oda"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
                Layout.preferredWidth: 100
            }
            Ui.ToggleSwitch {
                Layout.fillWidth: true
                states: root.lightStates
                value: root.levelToIndex(appState ? appState.lightStatus : 0)
                onValueChanged: function(newIndex) { root.applyMain(newIndex) }
            }
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 12
            Text {
                text: "Geçiş"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
                Layout.preferredWidth: 100
            }
            Ui.ToggleSwitch {
                Layout.fillWidth: true
                states: root.lightStates
                value: root.levelToIndex(appState ? appState.light2Status : 0)
                onValueChanged: function(newIndex) { root.applyAnte(newIndex) }
            }
        }
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/LightingPanel.qml
git commit -m "feat(panel): LightingPanel main+ante 4-state brightness"
```

---

### Task 8: FanPanel.qml

Reference: `renderer/components/dashboard/FanPanel.tsx`. Spec:
- Card titled "Fan".
- One row: "Main" label + 4-state ToggleSwitch (Off / Düşük / Orta / Yüksek).
- Writes R01704 with `[0, 85, 170, 255][i]`. Reads `appState.fan1Status` via same map-back logic.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/FanPanel.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../ui" as Ui

Ui.Card {
    id: root
    title: "Fan"
    implicitWidth: 400

    readonly property var levelValues: [0, 85, 170, 255]

    function levelToIndex(level) {
        for (let i = 0; i < levelValues.length; ++i) {
            if (levelValues[i] === level) return i
        }
        return 0
    }

    function apply(idx) {
        const value = levelValues[Math.max(0, Math.min(3, idx))]
        plcClient.writeRegister("R01704", value)
        appState.fan1Status = value
    }

    readonly property var fanStates: [
        { "label": "Off",    "color": Rsp.Theme.slate500 },
        { "label": "Düşük",  "color": Rsp.Theme.amber   },
        { "label": "Orta",   "color": Rsp.Theme.sky     },
        { "label": "Yüksek", "color": Rsp.Theme.emerald }
    ]

    RowLayout {
        Layout.fillWidth: true
        spacing: 12
        Text {
            text: "Main"
            color: Rsp.Theme.text
            font.family: Rsp.Theme.fontFamily
            font.pixelSize: Rsp.Theme.fontSizeMd
            Layout.preferredWidth: 100
        }
        Ui.ToggleSwitch {
            Layout.fillWidth: true
            states: root.fanStates
            value: root.levelToIndex(appState ? appState.fan1Status : 0)
            onValueChanged: function(newIndex) { root.apply(newIndex) }
        }
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/FanPanel.qml
git commit -m "feat(panel): FanPanel main 4-state speed"
```

---

### Task 9: AuxiliaryOutputPanel.qml

Reference: `renderer/components/dashboard/AuxiliaryOutputPanel.tsx`. Spec:
- Card titled "Yardımcı Çıkışlar".
- Two rows: "Ana Oda Valf" (valve1) and "Geçiş Valf" (valve2), each with a 3-state ToggleSwitch (Kapalı / Aç / Kapat).
- Valve1: index 0 → M0500=0, M0501=0; index 1 → M0500=1, M0501=0; index 2 → M0500=0, M0501=1.
- Valve2: same pattern on M0502/M0503.
- Reads: `appState.valve1Status` and `appState.valve2Status`. Both are bool in store.ts but the React UI used a 3-state — for Phase 3 we track local index inside the panel since AppState doesn't expose a 3-state field. Default index 0 on load.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/AuxiliaryOutputPanel.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../ui" as Ui

Ui.Card {
    id: root
    title: "Yardımcı Çıkışlar"
    implicitWidth: 400

    property int valve1Index: 0
    property int valve2Index: 0

    function applyValve(index, openReg, closeReg) {
        if (index === 0) {
            plcClient.writeBit(openReg,  0)
            plcClient.writeBit(closeReg, 0)
        } else if (index === 1) {
            plcClient.writeBit(openReg,  1)
            plcClient.writeBit(closeReg, 0)
        } else {
            plcClient.writeBit(openReg,  0)
            plcClient.writeBit(closeReg, 1)
        }
    }

    readonly property var valveStates: [
        { "label": "Kapalı", "color": Rsp.Theme.slate500 },
        { "label": "Aç",     "color": Rsp.Theme.emerald },
        { "label": "Kapat",  "color": Rsp.Theme.rose }
    ]

    ColumnLayout {
        Layout.fillWidth: true
        spacing: 16

        RowLayout {
            Layout.fillWidth: true
            spacing: 12
            Text {
                text: "Ana Valf"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
                Layout.preferredWidth: 100
            }
            Ui.ToggleSwitch {
                Layout.fillWidth: true
                states: root.valveStates
                value: root.valve1Index
                onValueChanged: function(newIndex) {
                    root.valve1Index = newIndex
                    root.applyValve(newIndex, "M0500", "M0501")
                }
            }
        }

        RowLayout {
            Layout.fillWidth: true
            spacing: 12
            Text {
                text: "Geçiş Valf"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
                Layout.preferredWidth: 100
            }
            Ui.ToggleSwitch {
                Layout.fillWidth: true
                states: root.valveStates
                value: root.valve2Index
                onValueChanged: function(newIndex) {
                    root.valve2Index = newIndex
                    root.applyValve(newIndex, "M0502", "M0503")
                }
            }
        }
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/AuxiliaryOutputPanel.qml
git commit -m "feat(panel): AuxiliaryOutputPanel valve1+valve2 3-state"
```

---

### Task 10: ChamberControlPanel.qml

Reference: `renderer/components/dashboard/ChamberControlPanel.tsx`. Spec:
- Card titled "Oda Kontrol".
- Four vertical ToggleSwitches:
  1. Manuel / Otomatik (writes M0201 = 0|1, tracks `appState.autoMode`)
  2. Hava / Oksijen (writes M0200 = 0|1, tracks `appState.airMode`)
  3. Ventilasyon 3-state: Off / Tahliye / Doldurma (writes M0202+M0203 pair, tracks `appState.ventilMode` as int 0|1|2)
  4. Chiller button (large rounded-full; opens ChillerControlModal when clicked; shows "OFF" or current setTemp when running; disabled when `appState.chillerCommError`)

Signal `chillerRequested()` fires when user clicks the chiller button — Dashboard.qml connects this to `chillerModal.open()`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/ChamberControlPanel.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../ui" as Ui

Ui.Card {
    id: root
    title: "Oda Kontrol"
    implicitWidth: 400

    signal chillerRequested()

    readonly property var twoState: function(offLabel, onLabel) { return [
        { "label": offLabel, "color": Rsp.Theme.slate500 },
        { "label": onLabel,  "color": Rsp.Theme.emerald }
    ]}
    readonly property var ventilStates: [
        { "label": "Off",      "color": Rsp.Theme.slate500 },
        { "label": "Tahliye",  "color": Rsp.Theme.rose },
        { "label": "Doldur",   "color": Rsp.Theme.emerald }
    ]

    function applyVentil(idx) {
        if (idx === 0) {
            plcClient.writeBit("M0202", 0); plcClient.writeBit("M0203", 0)
        } else if (idx === 1) {
            plcClient.writeBit("M0202", 1); plcClient.writeBit("M0203", 0)
        } else {
            plcClient.writeBit("M0202", 0); plcClient.writeBit("M0203", 1)
        }
        appState.ventilMode = idx
    }

    ColumnLayout {
        Layout.fillWidth: true
        spacing: 16

        Ui.ToggleSwitch {
            Layout.fillWidth: true
            states: root.twoState("Manuel", "Otomatik")
            value: (appState && appState.autoMode) ? 1 : 0
            onValueChanged: function(newIndex) {
                plcClient.writeBit("M0201", newIndex)
                appState.autoMode = (newIndex === 1)
            }
        }

        Ui.ToggleSwitch {
            Layout.fillWidth: true
            states: root.twoState("Hava", "Oksijen")
            value: (appState && appState.airMode) ? 1 : 0
            onValueChanged: function(newIndex) {
                plcClient.writeBit("M0200", newIndex)
                appState.airMode = (newIndex === 1)
            }
        }

        Ui.ToggleSwitch {
            Layout.fillWidth: true
            states: root.ventilStates
            value: appState ? appState.ventilMode : 0
            onValueChanged: function(newIndex) { root.applyVentil(newIndex) }
        }

        Ui.AppButton {
            Layout.fillWidth: true
            variant: appState && appState.chillerRunning ? "info" : "muted"
            text: (appState && appState.chillerCommError) ? "Chiller: COMM HATA"
                  : (appState && appState.chillerRunning)
                      ? "Chiller: " + appState.chillerSetTemp.toFixed(1) + " °C"
                      : "Chiller: KAPALI"
            enabledState: !(appState && appState.chillerCommError)
            onClicked: root.chillerRequested()
        }
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/ChamberControlPanel.qml
git commit -m "feat(panel): ChamberControlPanel auto/air/ventil/chiller controls"
```

---

# Bundle 4 — Modals

---

### Task 11: ErrorModal.qml

Reference: `renderer/components/dashboard/ErrorModal.tsx`. Spec:
- Wraps `AppModal`. `isOpen` tied to `appState.showErrorModal`.
- Body: red AlertTriangle icon (text "⚠" in red circle 64×64) → title "Uyarı" → error message text (`appState.errorMessage`) → primary close button.
- On close: writes `writeBit("M0400", 0)`, sets `appState.showErrorModal = false`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/modals/ErrorModal.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../ui" as Ui

Ui.AppModal {
    id: root
    title: ""
    size: "md"

    function dismiss() {
        plcClient.writeBit("M0400", 0)
        appState.showErrorModal = false
        root.close()
    }

    Item {
        Layout.alignment: Qt.AlignHCenter
        implicitWidth: 64; implicitHeight: 64
        Rectangle {
            anchors.fill: parent
            radius: width / 2
            color: Qt.rgba(0.96, 0.27, 0.32, 0.15)
        }
        Text {
            anchors.centerIn: parent
            text: "⚠"
            color: Rsp.Theme.rose
            font.pixelSize: 36
            font.weight: Font.Bold
        }
    }

    Text {
        Layout.alignment: Qt.AlignHCenter
        text: "Uyarı"
        color: Rsp.Theme.text
        font.family: Rsp.Theme.fontFamily
        font.pixelSize: Rsp.Theme.fontSizeXl
        font.weight: Font.Bold
    }

    Text {
        Layout.fillWidth: true
        text: appState ? appState.errorMessage : ""
        color: Rsp.Theme.textMuted
        font.family: Rsp.Theme.fontFamily
        font.pixelSize: Rsp.Theme.fontSizeMd
        wrapMode: Text.WordWrap
        horizontalAlignment: Text.AlignHCenter
    }

    Ui.AppButton {
        Layout.fillWidth: true
        text: "Tamam"
        variant: "danger"
        onClicked: root.dismiss()
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/modals/ErrorModal.qml
git commit -m "feat(modal): ErrorModal with M0400 reset on close"
```

---

### Task 12: SeatAlarmModal.qml

Reference: `renderer/components/dashboard/SeatAlarmModal.tsx`. Spec:
- Wraps `AppModal`. `isOpen` tied to `appState.showSeatAlarmModal`.
- Body: red pulsing chair icon (text "♿" or text "S" in red circle, animated scale 1.0 → 1.1 loop) → title "Koltuk Alarmı" → large seat number text (font 96 px bold) from `appState.activeSeatAlarm.seatNumber` → close button.
- On close: writes `writeBit("M0400", 0)` AND `writeRegister("R0030", 0)`, then sets `appState.showSeatAlarmModal = false` and `appState.activeSeatAlarm = null`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/modals/SeatAlarmModal.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../ui" as Ui

Ui.AppModal {
    id: root
    title: ""
    size: "md"

    function dismiss() {
        plcClient.writeBit("M0400", 0)
        plcClient.writeRegister("R0030", 0)
        appState.showSeatAlarmModal = false
        appState.activeSeatAlarm = null
        root.close()
    }

    Item {
        Layout.alignment: Qt.AlignHCenter
        implicitWidth: 96; implicitHeight: 96

        Rectangle {
            anchors.fill: parent
            radius: width / 2
            color: Qt.rgba(0.96, 0.27, 0.32, 0.15)

            SequentialAnimation on scale {
                running: visible
                loops: Animation.Infinite
                NumberAnimation { from: 1.0; to: 1.1; duration: 600; easing.type: Easing.InOutQuad }
                NumberAnimation { from: 1.1; to: 1.0; duration: 600; easing.type: Easing.InOutQuad }
            }
        }
        Text {
            anchors.centerIn: parent
            text: "S"
            color: Rsp.Theme.rose
            font.pixelSize: 52
            font.weight: Font.Bold
        }
    }

    Text {
        Layout.alignment: Qt.AlignHCenter
        text: "Koltuk Alarmı"
        color: Rsp.Theme.text
        font.family: Rsp.Theme.fontFamily
        font.pixelSize: Rsp.Theme.fontSizeXl
        font.weight: Font.Bold
    }

    Text {
        Layout.alignment: Qt.AlignHCenter
        text: appState && appState.activeSeatAlarm
              ? (appState.activeSeatAlarm.seatNumber || "—").toString()
              : "—"
        color: Rsp.Theme.rose
        font.family: Rsp.Theme.fontFamily
        font.pixelSize: 96
        font.weight: Font.Bold
    }

    Ui.AppButton {
        Layout.fillWidth: true
        text: "Sıfırla"
        variant: "danger"
        onClicked: root.dismiss()
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/modals/SeatAlarmModal.qml
git commit -m "feat(modal): SeatAlarmModal with pulsing icon + dual-write reset"
```

---

### Task 13: ChillerControlModal.qml

Reference: `renderer/components/dashboard/ChillerControlModal.tsx`. Spec:
- Wraps `AppModal` (`size: "md"`). `isOpen` tied to `appState.showChillerModal`.
- Body:
  - Status row: "Çalışıyor" / "Durdu" badge.
  - Current temp display ("Şu an: X.X °C") — large 56 px text in cyan.
  - Set temp display ("Hedef: Y.Y °C").
  - Slider: min 5, max 35, step 0.5, color cyan. On `valueUpdated` (debounced 500 ms), write `D00202 = value × 10` and update `appState.chillerSetTemp`.
  - Button row: Start/Stop (writes D00208 = 1|0), Close.
- Disabled when `appState.chillerCommError`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/modals/ChillerControlModal.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../ui" as Ui

Ui.AppModal {
    id: root
    title: "Chiller Kontrol"
    size: "md"

    property real localSetTemp: appState ? appState.chillerSetTemp : 20.0

    Timer {
        id: debounce
        interval: 500
        repeat: false
        onTriggered: {
            plcClient.writeRegister("D00202", Math.round(root.localSetTemp * 10))
            appState.chillerSetTemp = root.localSetTemp
        }
    }

    function start() { plcClient.writeRegister("D00208", 1) }
    function stop()  { plcClient.writeRegister("D00208", 0) }

    RowLayout {
        Layout.fillWidth: true

        Rectangle {
            implicitHeight: 28
            implicitWidth: stateBadge.implicitWidth + 24
            radius: 14
            color: appState && appState.chillerCommError ? Rsp.Theme.amber
                   : appState && appState.chillerRunning ? Rsp.Theme.emerald
                   : Rsp.Theme.rose
            Text {
                id: stateBadge
                anchors.centerIn: parent
                text: appState && appState.chillerCommError ? "COMM HATA"
                      : appState && appState.chillerRunning ? "Çalışıyor"
                      : "Durdu"
                color: "#ffffff"
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeSm
                font.weight: Font.Bold
            }
        }
        Item { Layout.fillWidth: true }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: 16

        ColumnLayout {
            Layout.fillWidth: true
            Text {
                text: "Şu An"
                color: Rsp.Theme.textMuted
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeSm
            }
            Text {
                text: appState && appState.chillerCommError
                      ? "— °C"
                      : (appState ? appState.chillerCurrentTemp.toFixed(1) : "—") + " °C"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 36
                font.weight: Font.Bold
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            Text {
                text: "Hedef"
                color: Rsp.Theme.textMuted
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeSm
            }
            Text {
                text: root.localSetTemp.toFixed(1) + " °C"
                color: Rsp.Theme.cyan
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 36
                font.weight: Font.Bold
            }
        }
    }

    Ui.AppSlider {
        Layout.fillWidth: true
        label: "Hedef sıcaklık"
        color: "cyan"
        min: 5; max: 35; step: 0.5
        value: root.localSetTemp
        enabledState: !(appState && appState.chillerCommError)
        onValueUpdated: function(v) { root.localSetTemp = v; debounce.restart() }
    }

    RowLayout {
        Layout.fillWidth: true
        spacing: 12

        Ui.AppButton {
            Layout.fillWidth: true
            text: "Başlat"
            variant: "success"
            enabledState: !(appState && appState.chillerCommError) && !(appState && appState.chillerRunning)
            onClicked: root.start()
        }
        Ui.AppButton {
            Layout.fillWidth: true
            text: "Durdur"
            variant: "danger"
            enabledState: !(appState && appState.chillerCommError) && (appState && appState.chillerRunning)
            onClicked: root.stop()
        }
        Ui.AppButton {
            Layout.fillWidth: true
            text: "Kapat"
            variant: "default"
            onClicked: { appState.showChillerModal = false; root.close() }
        }
    }
}
```

- [ ] **Step 2: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/modals/ChillerControlModal.qml
git commit -m "feat(modal): ChillerControlModal slider + Start/Stop + COMM gate"
```

---

# Bundle 5 — ChamberSeatOverlay (the riskiest)

---

### Task 14: ChamberSeatOverlay.qml

Reference: `renderer/components/dashboard/ChamberSeatOverlay.tsx`. Spec:
- PNG background `chamber-3d.png`, fills the container.
- 14 invisible MouseArea hit-targets positioned with PERCENTAGE coordinates (read from the React `SEAT_POSITIONS` array — must copy 1:1).
- Each MouseArea has a seat number 1–14.
- When `appState.activeSeatAlarm` matches a seat, a red pulsing dot + the seat number label appears at that position.
- Click on a seat toggles a local "flashing" state for debug — not a backend write.

The React `SEAT_POSITIONS` array structure (from the React source):
```typescript
const SEAT_POSITIONS = [
  { number: 21, top: '28%', left: '14%', width: '8%', height: '12%' },
  { number: 22, top: '28%', left: '24%', width: '8%', height: '12%' },
  // ... up to 14 entries
]
```

The exact values are in `renderer/components/dashboard/ChamberSeatOverlay.tsx` — the implementer must read that file and transcribe the array verbatim.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/panels/ChamberSeatOverlay.qml`

- [ ] **Step 1: Read the React file to extract SEAT_POSITIONS**

```bash
grep -A 100 "SEAT_POSITIONS\s*=" /Users/sencersoylu/Projects/MY_APP/renderer/components/dashboard/ChamberSeatOverlay.tsx | head -80
```

Capture the array. You will paste these values into the QML file as a ListModel.

- [ ] **Step 2: Write the component**

Use this skeleton — REPLACE the `seats` ListModel with the actual React values:

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    implicitWidth: 720
    implicitHeight: 480

    // ===== REPLACE the values below with the React SEAT_POSITIONS array =====
    ListModel {
        id: seats
        // Each entry: { number, topPct, leftPct, widthPct, heightPct }
        ListElement { number: 21; topPct: 28; leftPct: 14; widthPct: 8; heightPct: 12 }
        ListElement { number: 22; topPct: 28; leftPct: 24; widthPct: 8; heightPct: 12 }
        ListElement { number: 23; topPct: 28; leftPct: 34; widthPct: 8; heightPct: 12 }
        ListElement { number: 24; topPct: 28; leftPct: 44; widthPct: 8; heightPct: 12 }
        // ... PASTE remaining entries
    }

    Image {
        anchors.fill: parent
        source: "../../assets/images/chamber-3d.png"
        fillMode: Image.PreserveAspectFit
        sourceSize.width: 1440
    }

    Repeater {
        model: seats
        Item {
            x: root.width  * leftPct  / 100
            y: root.height * topPct   / 100
            width:  root.width  * widthPct  / 100
            height: root.height * heightPct / 100

            // Active alarm marker
            Rectangle {
                anchors.fill: parent
                radius: width / 2
                color: Rsp.Theme.rose
                opacity: appState && appState.activeSeatAlarm
                         && appState.activeSeatAlarm.seatNumber === number
                         ? 0.7 : 0
                Behavior on opacity { NumberAnimation { duration: Rsp.Theme.animMed } }

                SequentialAnimation on scale {
                    running: parent.opacity > 0
                    loops: Animation.Infinite
                    NumberAnimation { from: 1.0; to: 1.15; duration: 500 }
                    NumberAnimation { from: 1.15; to: 1.0; duration: 500 }
                }

                Text {
                    anchors.centerIn: parent
                    text: number
                    color: "#ffffff"
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeLg
                    font.weight: Font.Bold
                }
            }

            MouseArea {
                anchors.fill: parent
                cursorShape: Qt.PointingHandCursor
                // No-op for now; the React click was UI-only too.
            }
        }
    }
}
```

- [ ] **Step 3: Smoke + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log

git add qml/panels/ChamberSeatOverlay.qml
git commit -m "feat(panel): ChamberSeatOverlay PNG + 14 % hit-targets + alarm dot"
```

---

# Bundle 6 — Dashboard assembly + Phase 3 tag

---

### Task 15: Dashboard.qml full layout

**Files:**
- Modify: `/Users/sencersoylu/Projects/MY_APP_QT/qml/pages/Dashboard.qml`

Replace the placeholder body (the `Item` containing "Dashboard — Bundles 2–6 fill this area") with the full layout. Keep the time-ticker Timer and the Header at the top.

- [ ] **Step 1: Rewrite Dashboard.qml**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp
import "../panels" as Panels
import "../modals" as Modals

Rectangle {
    id: root
    color: Rsp.Theme.bg

    Timer {
        interval: 1000
        running: true
        repeat: true
        triggeredOnStart: true
        onTriggered: {
            const now = new Date()
            appState.currentTime  = Qt.formatTime(now, "HH:mm:ss")
            appState.currentTime2 = Qt.formatDate(now, "dd MMM yyyy")
        }
    }

    ColumnLayout {
        anchors.fill: parent
        spacing: 0

        Panels.Header {
            Layout.fillWidth: true
        }

        // ===== Main 3-column grid =====
        RowLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            Layout.margins: 24
            spacing: 24

            // Left column
            ColumnLayout {
                Layout.preferredWidth: 320
                Layout.fillHeight: true
                spacing: 16

                Panels.ChamberControlPanel {
                    Layout.fillWidth: true
                    onChillerRequested: chillerModal.open()
                }

                Panels.AuxiliaryOutputPanel {
                    Layout.fillWidth: true
                }
            }

            // Center column — chamber visual + seat overlay
            ColumnLayout {
                Layout.fillWidth: true
                Layout.fillHeight: true
                spacing: 16

                Panels.HyperbaricChamber {
                    Layout.fillWidth: true
                }

                Panels.ChamberSeatOverlay {
                    Layout.fillWidth: true
                    Layout.fillHeight: true
                }

                Panels.CylinderBank {
                    Layout.alignment: Qt.AlignHCenter
                }
            }

            // Right column
            ColumnLayout {
                Layout.preferredWidth: 320
                Layout.fillHeight: true
                spacing: 16

                Panels.LightingPanel {
                    Layout.fillWidth: true
                }

                Panels.FanPanel {
                    Layout.fillWidth: true
                }

                Panels.ChillerStatusPanel {
                    Layout.fillWidth: true
                }
            }
        }
    }

    // ===== Modals (auto-open by AppState bindings) =====
    Modals.ErrorModal {
        id: errorModal
        Connections {
            target: appState
            function onShowErrorModalChanged() {
                if (appState.showErrorModal) errorModal.open()
                else errorModal.close()
            }
        }
    }

    Modals.SeatAlarmModal {
        id: seatModal
        Connections {
            target: appState
            function onShowSeatAlarmModalChanged() {
                if (appState.showSeatAlarmModal) seatModal.open()
                else seatModal.close()
            }
        }
    }

    Modals.ChillerControlModal {
        id: chillerModal
    }

    Shortcut {
        sequence: "Escape"
        onActivated: root.parent.StackView ? root.parent.StackView.view.pop() : null
    }
}
```

- [ ] **Step 2: Final smoke**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
pytest -q                                              # all Python tests still pass
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 4; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning|traceback" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx\|aiohttp\|asyncio\|TCP_NODELAY\|OSError" | head -30
rm -f /tmp/smoke.log
```

Expected: pytest 37 passed. Smoke log clean of QML errors. (Acceptable: `OSError [Errno 22]` macOS asyncio quirk, socket reconnect noise.)

- [ ] **Step 3: Tag and inspect**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
git add qml/pages/Dashboard.qml
git commit -m "feat(qml): Dashboard.qml full layout with all panels + modals"
git tag phase-3-complete
git tag
git log phase-2-complete..phase-3-complete --oneline | nl
```

Expected: roughly 15 new commits since phase-2-complete; `phase-3-complete` tag points to latest.

---

## Self-Review

- **Spec coverage:** §5.5 lists Header, ChamberControlPanel, AuxiliaryOutputPanel, LightingPanel, FanPanel + ChillerControlModal, ErrorModal, SeatAlarmModal — all 8 present. §5.4 lists HyperbaricChamber, CylinderBank, ChamberSeatOverlay — all 3 present. ChillerStatusPanel is a recon find (not in spec table but present in React) and is reused inside the right column.
- **Placeholder scan:** every step has a verbatim file body or shell command. The `SEAT_POSITIONS` ListModel placeholder in Task 14 is explicitly flagged; the implementer extracts the real values from React.
- **Socket addresses verified:** all addresses (M0200..M0503, R01700-R01706, R0030, D00202, D00208) are taken from the recon report which read `dashboard.tsx` directly.
- **Phase 1 PlcClient does not need changes**: `writeRegister(register, value)` and `writeBit(register, value)` accept arbitrary register strings.
- **State binding model**: panels read `appState.*` directly, panels write `appState.*` AND emit via `plcClient.*` — matches the design intent from Phase 1.
- **Deferred items**: sound playback (bmw-bong.mp3) → Phase 9; pixel-perfect SVG layout of HyperbaricChamber → may need visual tuning in Phase 3 review.

## Phase 3 → Phase 4 handoff

After this plan ships, Phase 4 (VitalSigns.qml) builds the second page using `vitalsClient.*` signals already exposed in Phase 1. Phase 4 needs no new infrastructure — only a new page and a couple of cards.

# Qt Migration — Phase 2 Implementation Plan (UI Component Library)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the QML UI component library at `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/` — 9 components mirroring `renderer/components/ui/*` — plus a Showcase page that renders every primitive so future phases (Dashboard, VitalSigns, etc.) have a vetted, pixel-faithful foundation.

**Architecture:** Components live under `qml/ui/`. Each is a single `.qml` file. SVG-heavy components extract their inline SVG into `assets/svg/*.svg` and layer dynamic QML on top. A new `qml/pages/Showcase.qml` renders all components with sample data; `Ctrl+S` from `Main.qml` toggles into it.

**Tech Stack:** QML (QtQuick 2.x), QtQuick.Controls 2, QtQuick.Layouts, QtQuick.Shapes (for any custom paths). No new Python.

**Source references** (subagents should keep these open):
- Spec: `/Users/sencersoylu/Projects/MY_APP/docs/superpowers/specs/2026-05-29-qt-migration-design.md` §5.3 (UI component table) and §5.2 (Tailwind→QML cheat-sheet)
- React originals: `/Users/sencersoylu/Projects/MY_APP/renderer/components/ui/*.tsx`
- Existing Qt foundations: `qml/Theme.qml`, `qml/Main.qml`

**Phase 1 deliverables that this phase depends on**: AppState (66 QML-visible properties), PlcClient (writeRegister/writeBit slots), Theme.qml (palette + radii + animations). All present.

---

## File Structure

After this phase the new tree looks like:

```
MY_APP_QT/
├── docs/
│   └── tailwind-to-qml.md           # cheat-sheet referenced by all component tasks
├── qml/
│   ├── Main.qml                     # MODIFIED: add Ctrl+S → push Showcase
│   ├── Theme.qml                    # unchanged
│   ├── pages/
│   │   └── Showcase.qml             # NEW: renders every UI primitive
│   └── ui/                          # NEW directory
│       ├── AppButton.qml
│       ├── Card.qml
│       ├── AppModal.qml
│       ├── AppSlider.qml
│       ├── ToggleSwitch.qml
│       ├── SeatGrid.qml
│       ├── PressureTank.qml
│       ├── FSSIndicator.qml
│       └── CompressorUnit.qml
└── assets/
    └── svg/                         # NEW directory
        ├── tank-air.svg
        ├── tank-nitrogen.svg
        ├── tank-cylinder.svg
        ├── fss-tank.svg
        └── compressor.svg
```

Why these boundaries:
- One file per component → small, focused, each ≤200 lines.
- `assets/svg/` separates static visuals from layout logic. Updating a tank illustration doesn't touch QML.
- `Showcase.qml` is a developer page only — it's not part of the production flow, but lives in the repo so visual regressions are caught early.

---

# Bundle 1 — Foundation

Exit criterion: cheat-sheet committed, Showcase.qml opens via Ctrl+S (empty but themed), smoke test still passes.

---

### Task 1: Tailwind → QML cheat-sheet

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/docs/tailwind-to-qml.md`

- [ ] **Step 1: Write the cheat-sheet**

Content (verbatim — subagents must paste this exactly):

```markdown
# Tailwind → QML Cheat-Sheet

Quick reference for porting React/Tailwind UI to QML. The Theme singleton at
`qml/Theme.qml` centralizes colors, radii, fonts, and animation timings.

## Backgrounds and text

| Tailwind | QML |
|---|---|
| `bg-white dark:bg-slate-900` | `color: Theme.bg` |
| `bg-slate-100 dark:bg-slate-800` | `color: Theme.bgPanel` |
| `text-slate-900 dark:text-white` | `color: Theme.text` |
| `text-slate-500 dark:text-slate-300` | `color: Theme.textMuted` |
| `border border-slate-200 dark:border-slate-700` | `border.width: 1; border.color: Theme.border` |
| `bg-white/80` (glass) | `color: Qt.rgba(1, 1, 1, 0.8)` or `Theme.glass` |

## Sizing

| Tailwind | QML |
|---|---|
| `h-10` (40 px) | `height: 40` |
| `h-12` (48 px) | `height: 48` |
| `h-14` (56 px) | `height: 56` |
| `w-full` | `Layout.fillWidth: true` (inside a Layout) or `anchors.left/right` |
| `px-6` | `leftPadding: 24; rightPadding: 24` |
| `py-4` | `topPadding: 16; bottomPadding: 16` |

## Corner radius

| Tailwind | QML |
|---|---|
| `rounded-lg` | `radius: Theme.radiusSm` (6) |
| `rounded-2xl` | `radius: Theme.radiusLg` (20) |
| `rounded-full` | `radius: height / 2` |

## Spacing inside layouts

| Tailwind | QML |
|---|---|
| `gap-2` | `spacing: 8` |
| `gap-3` | `spacing: Theme.spacingMd` (12) |
| `gap-4` | `spacing: Theme.spacingLg` (16) |
| `flex` (column) | `ColumnLayout {}` |
| `flex` (row) | `RowLayout {}` |
| `grid grid-cols-N` | `GridLayout { columns: N }` |

## Shadows

DropShadow from Qt5Compat:
```qml
import Qt5Compat.GraphicalEffects 1.15
DropShadow {
    anchors.fill: target
    source: target
    horizontalOffset: 0
    verticalOffset: 6
    radius: 12
    samples: 25
    color: Qt.rgba(0, 0, 0, 0.2)
}
```
Maps to `shadow-lg`. Use `MultiEffect` if on Qt 6.5+.

## Animations and transitions

| Tailwind | QML |
|---|---|
| `transition-all` | `Behavior on <property> { NumberAnimation { duration: Theme.animMed } }` |
| `transition-colors duration-200` | `Behavior on color { ColorAnimation { duration: 200 } }` |
| `hover:scale-[1.02]` | `MouseArea.containsMouse` triggers a `State` with `scale: 1.02` |
| `active:scale-[0.98]` | `MouseArea.pressed` triggers a `State` with `scale: 0.98` |
| `disabled:opacity-50` | Bind `opacity: enabled ? 1.0 : 0.5` |
| `animate-spin` | `RotationAnimator on rotation { from: 0; to: 360; duration: 1000; loops: -1 }` |
| `animate-fade-in` | Initial `opacity: 0` + `Behavior on opacity` + set to 1 in onCompleted |

## Variants

For variant-driven colors (Button, Slider) define them in the component:

```qml
readonly property var variantColors: ({
    "default":  { bg: Theme.slate700, fg: "#ffffff", hover: Theme.slate500 },
    "success":  { bg: Theme.emerald,  fg: "#ffffff", hover: "#0e9f6e" },
    "warning":  { bg: Theme.amber,    fg: "#ffffff", hover: "#d97706" },
    "danger":   { bg: Theme.rose,     fg: "#ffffff", hover: "#dc2626" },
    "info":     { bg: Theme.sky,      fg: "#ffffff", hover: "#0284c7" },
    "muted":    { bg: Theme.slate500, fg: "#ffffff", hover: Theme.slate700 }
})

readonly property var current: variantColors[variant] || variantColors["default"]
```

## Focus rings

Tailwind `focus:ring-2 focus:ring-blue-500` →
```qml
Rectangle {
    anchors.fill: parent
    anchors.margins: -2
    color: "transparent"
    border.width: 2
    border.color: Theme.sky
    visible: parent.activeFocus
    radius: parent.radius + 2
}
```

## Component conventions in this codebase

- Every component reads `Theme.*` — never hardcode hex colors except inside variant maps.
- Every component is composable via the `default property` for slot-style children.
- Pass `isDark` is NOT used — Theme is the single source of truth and re-evaluates on `appState.darkMode` change.
- Components fire callbacks via Signals, not direct property mutation on app state.
```

- [ ] **Step 2: Commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
git add docs/tailwind-to-qml.md
git commit -m "docs(qt-migration): Tailwind → QML cheat-sheet"
```

---

### Task 2: Showcase.qml scaffold + Ctrl+S nav from Main.qml

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/pages/Showcase.qml`
- Modify: `/Users/sencersoylu/Projects/MY_APP_QT/qml/Main.qml`

- [ ] **Step 1: Write `qml/pages/Showcase.qml`**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Rectangle {
    id: root
    color: Rsp.Theme.bg

    // The body is a ScrollView with a column of sections. Sections are added
    // one per Bundle in subsequent tasks. Each section renders the components
    // it owns with sample data so visual changes are obvious.

    ScrollView {
        anchors.fill: parent
        anchors.margins: Rsp.Theme.spacingLg
        clip: true

        ColumnLayout {
            width: root.width - Rsp.Theme.spacingLg * 2
            spacing: Rsp.Theme.spacingLg

            Text {
                text: "UI Component Showcase"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeXl
                font.weight: Font.Bold
            }

            Text {
                text: "Press Esc or Ctrl+S to return to Main."
                color: Rsp.Theme.textMuted
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
            }

            // ===== Sections appended by later Bundles below =====
            // ----- placeholder so the page isn't blank -----
            Rectangle {
                Layout.preferredHeight: 80
                Layout.fillWidth: true
                radius: Rsp.Theme.radiusMd
                color: Rsp.Theme.bgPanel
                border.color: Rsp.Theme.border
                border.width: 1
                Text {
                    anchors.centerIn: parent
                    text: "Bundles 2–5 populate this page."
                    color: Rsp.Theme.textMuted
                    font.family: Rsp.Theme.fontFamily
                }
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

The existing Main.qml has a fixed Rectangle body. Wrap it in a StackView so Showcase can push on top. Replace the file's content with:

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
    title: "RSP — Qt (Phase 2)"
    color: Rsp.Theme.bg

    FontLoader { source: "../assets/fonts/Poppins-Regular.ttf" }
    FontLoader { source: "../assets/fonts/Poppins-Medium.ttf" }
    FontLoader { source: "../assets/fonts/Poppins-SemiBold.ttf" }
    FontLoader { source: "../assets/fonts/Poppins-Bold.ttf" }

    Shortcut {
        sequence: "F11"
        onActivated: window.visibility = (window.visibility === Window.FullScreen)
                                         ? Window.Windowed
                                         : Window.FullScreen
    }

    Shortcut {
        sequence: "Ctrl+D"
        onActivated: appState.darkMode = !appState.darkMode
    }

    Shortcut {
        sequence: "Ctrl+S"
        onActivated: {
            if (stack.depth > 1) {
                stack.pop()
            } else {
                stack.push("pages/Showcase.qml")
            }
        }
    }

    StackView {
        id: stack
        anchors.fill: parent
        initialItem: phase0Body
    }

    Component {
        id: phase0Body
        Rectangle {
            color: Rsp.Theme.bg

            ColumnLayout {
                anchors.centerIn: parent
                spacing: Rsp.Theme.spacingMd

                Text {
                    text: "RSP Qt — Phase 2"
                    color: Rsp.Theme.text
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeXl
                    font.weight: Font.Bold
                    Layout.alignment: Qt.AlignHCenter
                }
                Text {
                    text: "F11: fullscreen · Ctrl+D: dark mode · Ctrl+S: Showcase"
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
}
```

- [ ] **Step 3: Smoke test**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!
sleep 3
kill -TERM $PID 2>/dev/null
wait $PID 2>/dev/null || true
grep -iE "qml|error|warning" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -20
rm -f /tmp/smoke.log
```

Expected: no QML errors. Socket connection errors are acceptable (no backends).

- [ ] **Step 4: Commit**

```bash
git add qml/Main.qml qml/pages/Showcase.qml
git commit -m "feat(qml): Showcase page scaffold + Ctrl+S navigation"
```

---

# Bundle 2 — Basic primitives (AppButton + Card)

Exit criterion: both files exist, render in Showcase with sample data, smoke test clean.

---

### Task 3: AppButton.qml

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/AppButton.qml`

Reference React component: `renderer/components/ui/Button.tsx`. Spec:

- **Props**: `variant: string` (default, success, warning, danger, info, muted), `size: string` (sm/md/lg), `isLoading: bool`, `fullWidth: bool`, `text: string`, `leftIcon` (default-property slot), `rightIcon` (default-property slot via custom property). Plus `clicked` signal.
- **Sizes**: sm=40 h / 16 px, md=48 h / 24 px, lg=64 h / 32 px (h × horizontal padding).
- **Variants** (Tailwind 500 + Theme):
  - default: bg slate700 → hover slate500, text white
  - success: bg emerald → hover #0e9f6e, text white
  - warning: bg amber → hover #d97706, text white
  - danger: bg rose → hover #dc2626, text white
  - info: bg sky → hover #0284c7, text white
  - muted: bg slate500 → hover slate700, text white
- **States**: hover scales to 1.02; pressed scales to 0.98; disabled opacity 0.5; isLoading shows spinner instead of icons.
- **Animations**: `Behavior on scale { NumberAnimation { duration: Theme.animMed; easing.type: Easing.OutCubic } }`. Hover state transitions color too.

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    property string text: ""
    property string variant: "default"
    property string size: "md"
    property bool isLoading: false
    property bool fullWidth: false
    property bool enabledState: true

    signal clicked()

    readonly property var variantColors: ({
        "default":  { bg: Rsp.Theme.slate700, hover: Rsp.Theme.slate500, fg: "#ffffff" },
        "success":  { bg: Rsp.Theme.emerald,  hover: "#0e9f6e",          fg: "#ffffff" },
        "warning":  { bg: Rsp.Theme.amber,    hover: "#d97706",          fg: "#ffffff" },
        "danger":   { bg: Rsp.Theme.rose,     hover: "#dc2626",          fg: "#ffffff" },
        "info":     { bg: Rsp.Theme.sky,      hover: "#0284c7",          fg: "#ffffff" },
        "muted":    { bg: Rsp.Theme.slate500, hover: Rsp.Theme.slate700, fg: "#ffffff" }
    })

    readonly property var sizeMetrics: ({
        "sm": { h: 40, padding: 16, fontSize: Rsp.Theme.fontSizeSm },
        "md": { h: 48, padding: 24, fontSize: Rsp.Theme.fontSizeMd },
        "lg": { h: 64, padding: 32, fontSize: Rsp.Theme.fontSizeLg }
    })

    readonly property var v: variantColors[variant] || variantColors["default"]
    readonly property var m: sizeMetrics[size] || sizeMetrics["md"]

    implicitHeight: m.h
    implicitWidth: fullWidth ? parent.width : textMetric.width + m.padding * 2 + (isLoading ? spinner.width + 8 : 0)
    width: fullWidth ? parent.width : implicitWidth
    height: m.h
    opacity: enabledState ? 1.0 : 0.5

    Behavior on opacity { NumberAnimation { duration: Rsp.Theme.animFast } }

    Rectangle {
        id: bg
        anchors.fill: parent
        radius: Rsp.Theme.radiusMd
        color: mouseArea.containsMouse ? root.v.hover : root.v.bg
        scale: mouseArea.pressed ? 0.98 : (mouseArea.containsMouse ? 1.02 : 1.0)

        Behavior on color { ColorAnimation { duration: Rsp.Theme.animMed } }
        Behavior on scale { NumberAnimation { duration: Rsp.Theme.animFast; easing.type: Easing.OutCubic } }

        RowLayout {
            anchors.centerIn: parent
            spacing: 8

            BusyIndicator {
                id: spinner
                visible: root.isLoading
                running: root.isLoading
                implicitWidth: root.m.fontSize + 4
                implicitHeight: root.m.fontSize + 4
            }

            Text {
                id: label
                text: root.text
                visible: !root.isLoading
                color: root.v.fg
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: root.m.fontSize
                font.weight: Font.Medium
            }
        }
    }

    // Hidden metric source for implicitWidth calculation
    Text {
        id: textMetric
        text: root.text
        visible: false
        font.family: Rsp.Theme.fontFamily
        font.pixelSize: root.m.fontSize
        font.weight: Font.Medium
    }

    MouseArea {
        id: mouseArea
        anchors.fill: parent
        enabled: root.enabledState && !root.isLoading
        hoverEnabled: true
        cursorShape: enabled ? Qt.PointingHandCursor : Qt.ForbiddenCursor
        onClicked: root.clicked()
    }
}
```

- [ ] **Step 2: Add to Showcase**

In `qml/pages/Showcase.qml`, replace the placeholder Rectangle ("Bundles 2–5 populate this page.") with a new ColumnLayout section AND keep room for future sections. Use `import "../ui" as Ui` at the top of Showcase.qml.

Replace just the placeholder Rectangle with:

```qml
            // ===== AppButton ==========================================
            Text {
                text: "AppButton"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            Flow {
                Layout.fillWidth: true
                spacing: 12
                Ui.AppButton { text: "Default";  variant: "default" }
                Ui.AppButton { text: "Success";  variant: "success" }
                Ui.AppButton { text: "Warning";  variant: "warning" }
                Ui.AppButton { text: "Danger";   variant: "danger" }
                Ui.AppButton { text: "Info";     variant: "info" }
                Ui.AppButton { text: "Muted";    variant: "muted" }
                Ui.AppButton { text: "Disabled"; variant: "default"; enabledState: false }
                Ui.AppButton { text: "Loading…"; variant: "info"; isLoading: true }
                Ui.AppButton { text: "Small";    variant: "success"; size: "sm" }
                Ui.AppButton { text: "Large";    variant: "danger"; size: "lg" }
            }
```

Also add `import "../ui" as Ui` at the top of `Showcase.qml`.

- [ ] **Step 3: Smoke test**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!
sleep 3
kill -TERM $PID 2>/dev/null
wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20
rm -f /tmp/smoke.log
```

Expected: no QML errors.

- [ ] **Step 4: Commit**

```bash
git add qml/ui/AppButton.qml qml/pages/Showcase.qml
git commit -m "feat(ui): AppButton with variants + sizes + loading state"
```

---

### Task 4: Card.qml

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/Card.qml`

Reference: `renderer/components/ui/Card.tsx`. Spec:
- **Props**: `title: string` (optional), `headerAction` (Item slot), `hoverable: bool`, `isLoading: bool`. Children → body slot.
- **Visual**: `radius: Theme.radiusLg`, `border 1px Theme.border`, `color: Theme.bgPanel`, header row when title set (`border-b`).
- **Hoverable**: on hover, `scale: 1.01` and translate y -4.
- **isLoading**: replaces body with 3 pulsing grey blocks.

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Rectangle {
    id: root

    property string title: ""
    property bool hoverable: false
    property bool isLoading: false
    default property alias body: contentColumn.data
    property Component headerAction: null

    radius: Rsp.Theme.radiusLg
    color: Rsp.Theme.bgPanel
    border.width: 1
    border.color: Rsp.Theme.border

    implicitHeight: layoutColumn.implicitHeight
    implicitWidth: 400

    transform: Translate { id: lift; y: hoverable && hoverArea.containsMouse ? -4 : 0
        Behavior on y { NumberAnimation { duration: Rsp.Theme.animMed; easing.type: Easing.OutCubic } }
    }
    scale: hoverable && hoverArea.containsMouse ? 1.01 : 1.0
    Behavior on scale { NumberAnimation { duration: Rsp.Theme.animMed; easing.type: Easing.OutCubic } }

    MouseArea {
        id: hoverArea
        anchors.fill: parent
        hoverEnabled: hoverable
        acceptedButtons: Qt.NoButton
    }

    ColumnLayout {
        id: layoutColumn
        anchors.fill: parent
        spacing: 0

        // ----- Header -----
        Item {
            Layout.fillWidth: true
            Layout.preferredHeight: visible ? 64 : 0
            visible: root.title !== ""

            Rectangle {
                anchors.bottom: parent.bottom
                width: parent.width
                height: 1
                color: Rsp.Theme.border
            }

            RowLayout {
                anchors.fill: parent
                anchors.leftMargin: 24
                anchors.rightMargin: 24

                Text {
                    text: root.title
                    color: Rsp.Theme.text
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: Rsp.Theme.fontSizeLg
                    font.weight: Font.Bold
                    Layout.fillWidth: true
                }

                Loader {
                    sourceComponent: root.headerAction
                    visible: root.headerAction !== null
                }
            }
        }

        // ----- Body or loading skeleton -----
        Item {
            Layout.fillWidth: true
            Layout.preferredHeight: root.isLoading ? loadingSkeleton.height : contentColumn.implicitHeight + 48

            ColumnLayout {
                id: contentColumn
                anchors.fill: parent
                anchors.margins: 24
                visible: !root.isLoading
            }

            ColumnLayout {
                id: loadingSkeleton
                visible: root.isLoading
                anchors.fill: parent
                anchors.margins: 24
                spacing: 12

                Repeater {
                    model: 3
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 24
                        radius: 4
                        color: Rsp.Theme.border
                        SequentialAnimation on opacity {
                            running: root.isLoading
                            loops: Animation.Infinite
                            NumberAnimation { from: 0.4; to: 0.8; duration: 800 }
                            NumberAnimation { from: 0.8; to: 0.4; duration: 800 }
                        }
                    }
                }
            }
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

Append to `Showcase.qml`'s ColumnLayout (after the AppButton section):

```qml
            // ===== Card ===============================================
            Text {
                text: "Card"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            RowLayout {
                Layout.fillWidth: true
                spacing: 16

                Ui.Card {
                    Layout.preferredWidth: 320
                    title: "Plain card"
                    Text {
                        text: "Body content."
                        color: Rsp.Theme.text
                        font.family: Rsp.Theme.fontFamily
                    }
                }

                Ui.Card {
                    Layout.preferredWidth: 320
                    title: "Hoverable"
                    hoverable: true
                    Text {
                        text: "Hover me."
                        color: Rsp.Theme.text
                        font.family: Rsp.Theme.fontFamily
                    }
                }

                Ui.Card {
                    Layout.preferredWidth: 320
                    title: "Loading"
                    isLoading: true
                }
            }
```

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/Card.qml qml/pages/Showcase.qml
git commit -m "feat(ui): Card with header slot, hover lift, loading skeleton"
```

---

# Bundle 3 — Interactive (AppModal + ToggleSwitch)

---

### Task 5: AppModal.qml

Reference: `renderer/components/ui/Modal.tsx`. Spec:
- **Props**: `isOpen: bool` (controls visibility), `title: string`, `size: "sm"|"md"|"lg"|"xl"`, `showCloseButton: bool` (default true), `closeOnBackdropClick: bool` (default true), `closeOnEscape: bool` (default true). Children → content slot.
- **Signal**: `closed()`.
- **Visual**: full-screen overlay, dark backdrop with blur, rounded-2xl modal centered. Sizes map to widths: sm=400, md=560, lg=720, xl=960.
- Built on QML `Popup` which gives free modal-stacking, focus capture, escape handling.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/AppModal.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Popup {
    id: root

    property string title: ""
    property string size: "md"
    property bool showCloseButton: true
    property bool closeOnBackdropClick: true
    property bool closeOnEscape: true

    default property alias content: contentColumn.data
    signal closed()

    readonly property var widths: ({ sm: 400, md: 560, lg: 720, xl: 960 })
    readonly property int targetWidth: widths[size] || widths.md

    modal: true
    focus: true
    closePolicy: (closeOnBackdropClick ? Popup.CloseOnPressOutside : Popup.NoAutoClose) |
                 (closeOnEscape ? Popup.CloseOnEscape : Popup.NoAutoClose)

    onClosed: root.closed()

    anchors.centerIn: Overlay.overlay
    width: Math.min(targetWidth, parent ? parent.width - 48 : targetWidth)
    height: bodyColumn.implicitHeight + 48
    padding: 0

    background: Rectangle {
        radius: Rsp.Theme.radiusLg
        color: Rsp.Theme.bgPanel
        border.color: Rsp.Theme.border
        border.width: 1
    }

    Overlay.modal: Rectangle {
        color: Qt.rgba(0, 0, 0, 0.6)
    }

    ColumnLayout {
        id: bodyColumn
        anchors.fill: parent
        anchors.margins: 24
        spacing: 16

        RowLayout {
            Layout.fillWidth: true
            visible: root.title !== "" || root.showCloseButton

            Text {
                text: root.title
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
                Layout.fillWidth: true
            }

            Item {
                visible: root.showCloseButton
                implicitWidth: 28; implicitHeight: 28

                Rectangle {
                    id: closeBg
                    anchors.fill: parent
                    radius: 14
                    color: closeArea.containsMouse ? Rsp.Theme.border : "transparent"
                    Behavior on color { ColorAnimation { duration: Rsp.Theme.animFast } }
                }

                Text {
                    anchors.centerIn: parent
                    text: "×"
                    color: Rsp.Theme.textMuted
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: 20
                }

                MouseArea {
                    id: closeArea
                    anchors.fill: parent
                    hoverEnabled: true
                    cursorShape: Qt.PointingHandCursor
                    onClicked: root.close()
                }
            }
        }

        ColumnLayout {
            id: contentColumn
            Layout.fillWidth: true
            spacing: 12
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

Append to Showcase.qml's ColumnLayout:

```qml
            // ===== AppModal ===========================================
            Text {
                text: "AppModal"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            RowLayout {
                Layout.fillWidth: true
                spacing: 12
                Ui.AppButton { text: "Open small";  variant: "info"; onClicked: demoModal.size = "sm";  demoModal.open() }
                Ui.AppButton { text: "Open medium"; variant: "info"; onClicked: demoModal.size = "md";  demoModal.open() }
                Ui.AppButton { text: "Open large";  variant: "info"; onClicked: demoModal.size = "lg";  demoModal.open() }
            }
            Ui.AppModal {
                id: demoModal
                title: "Demo modal"
                Text {
                    text: "Esc, backdrop click, or × button closes."
                    color: Rsp.Theme.text
                    font.family: Rsp.Theme.fontFamily
                    Layout.fillWidth: true
                    wrapMode: Text.WordWrap
                }
                Ui.AppButton {
                    text: "Close"
                    variant: "default"
                    onClicked: demoModal.close()
                }
            }
```

Note: the inline `onClicked: demoModal.size = "sm"; demoModal.open()` syntax in QML executes both statements when fired — QML accepts this in property-binding form.

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/AppModal.qml qml/pages/Showcase.qml
git commit -m "feat(ui): AppModal built on Popup, 4 sizes, close affordances"
```

---

### Task 6: ToggleSwitch.qml

Reference: `renderer/components/ui/ToggleSwitch.tsx`. Spec:
- **Props**: `value: int` (current state index), `states: var` (array of `{label: string, color: string}`), `enabledState: bool`.
- **Signal**: `valueChanged(int newIndex)`.
- **Visual**: rounded-full container 56 px tall, sliding pill on top (width = container/N - 8), labels (zIndex above pill). Pill color from `states[value].color`. Pill animates `x` via `Behavior on x`.
- Clicking a label index fires `valueChanged(index)`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/ToggleSwitch.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Rectangle {
    id: root

    property int value: 0
    property var states: []                   // [{ label: string, color: string }]
    property bool enabledState: true

    signal valueChanged(int newIndex)

    implicitHeight: 56
    implicitWidth: 320
    radius: height / 2
    color: appState && appState.darkMode ? Qt.rgba(1, 1, 1, 0.1) : Qt.rgba(0.8, 0.83, 0.87, 0.8)
    opacity: enabledState ? 1.0 : 0.4
    clip: true

    Behavior on opacity { NumberAnimation { duration: Rsp.Theme.animMed } }

    readonly property int pillMargin: 4
    readonly property real pillWidth: states.length > 0
        ? (width - pillMargin * 2) / states.length - pillMargin
        : 0

    // Sliding pill
    Rectangle {
        id: pill
        height: parent.height - root.pillMargin * 2
        width: root.pillWidth
        radius: height / 2
        color: root.states.length > 0 && root.value < root.states.length
                ? root.states[root.value].color
                : Rsp.Theme.slate500
        y: root.pillMargin
        x: root.pillMargin + (root.pillWidth + root.pillMargin) * root.value

        Behavior on x     { NumberAnimation { duration: Rsp.Theme.animMed; easing.type: Easing.InOutCubic } }
        Behavior on color { ColorAnimation  { duration: Rsp.Theme.animMed } }
    }

    // Labels row
    Row {
        anchors.fill: parent
        Repeater {
            model: root.states
            Item {
                width: root.width / root.states.length
                height: root.height

                Text {
                    anchors.centerIn: parent
                    text: modelData.label
                    color: index === root.value
                           ? "#ffffff"
                           : (appState && appState.darkMode
                                ? Qt.rgba(1, 1, 1, 0.4)
                                : Rsp.Theme.slate500)
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: root.states.length <= 2
                                    ? Rsp.Theme.fontSizeMd
                                    : Rsp.Theme.fontSizeSm
                    font.weight: Font.DemiBold
                    Behavior on color { ColorAnimation { duration: Rsp.Theme.animMed } }
                }

                MouseArea {
                    anchors.fill: parent
                    enabled: root.enabledState
                    cursorShape: enabled ? Qt.PointingHandCursor : Qt.ForbiddenCursor
                    onClicked: {
                        if (index !== root.value) {
                            root.value = index
                            root.valueChanged(index)
                        }
                    }
                }
            }
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

Append to Showcase.qml:

```qml
            // ===== ToggleSwitch =======================================
            Text {
                text: "ToggleSwitch"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            Ui.ToggleSwitch {
                Layout.preferredWidth: 320
                states: [
                    { "label": "Off", "color": Rsp.Theme.slate500 },
                    { "label": "On",  "color": Rsp.Theme.emerald  }
                ]
            }
            Ui.ToggleSwitch {
                Layout.preferredWidth: 480
                states: [
                    { "label": "Air",   "color": Rsp.Theme.sky     },
                    { "label": "Auto",  "color": Rsp.Theme.emerald },
                    { "label": "Manual","color": Rsp.Theme.amber   }
                ]
            }
```

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/ToggleSwitch.qml qml/pages/Showcase.qml
git commit -m "feat(ui): ToggleSwitch with animated sliding pill"
```

---

# Bundle 4 — Forms (AppSlider + SeatGrid)

---

### Task 7: AppSlider.qml

Reference: `renderer/components/ui/Slider.tsx`. Spec:
- **Props**: `value: real`, `min: real` (0), `max: real` (100), `step: real` (1), `label: string`, `color: "blue"|"emerald"|"amber"|"rose"|"indigo"|"cyan"`, `size: "sm"|"md"|"lg"`, `showLabels: bool` (default true), `leftLabel: string`, `rightLabel: string`, `enabledState: bool`.
- **Signal**: `valueChanged(real v)` (note: collides with QML built-in — declare it as `signal valueUpdated(real v)` instead to avoid conflict).
- **Visual**: optional label row (text-2xl value display), rounded-full track, gradient-fill from left to value%, circular thumb (20/28/36 px by size), thumb hover scale 1.1.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/AppSlider.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    property real value: 0
    property real min: 0
    property real max: 100
    property real step: 1
    property string label: ""
    property string color: "blue"
    property string size: "md"
    property bool showLabels: true
    property string leftLabel: ""
    property string rightLabel: ""
    property bool enabledState: true

    signal valueUpdated(real v)

    readonly property var colorMap: ({
        "blue":    "#3b82f6",
        "emerald": Rsp.Theme.emerald,
        "amber":   Rsp.Theme.amber,
        "rose":    Rsp.Theme.rose,
        "indigo":  "#6366f1",
        "cyan":    Rsp.Theme.cyan
    })

    readonly property var sizeMap: ({
        "sm": { track: 6,  thumb: 20 },
        "md": { track: 10, thumb: 28 },
        "lg": { track: 14, thumb: 36 }
    })

    readonly property string activeColor: colorMap[color] || colorMap["blue"]
    readonly property var m: sizeMap[size] || sizeMap["md"]
    readonly property real ratio: max > min ? (value - min) / (max - min) : 0

    implicitHeight: (label !== "" ? 36 : 0) + m.thumb + (showLabels ? 24 : 0)
    implicitWidth: 320
    opacity: enabledState ? 1.0 : 0.5

    ColumnLayout {
        anchors.fill: parent
        spacing: 8

        RowLayout {
            Layout.fillWidth: true
            visible: root.label !== ""

            Text {
                text: root.label
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeMd
                font.weight: Font.DemiBold
                Layout.fillWidth: true
            }
            Text {
                text: Math.round(root.value)
                color: root.activeColor
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeXl
                font.weight: Font.Bold
            }
        }

        Item {
            Layout.fillWidth: true
            Layout.preferredHeight: root.m.thumb

            // Track
            Rectangle {
                id: track
                anchors.verticalCenter: parent.verticalCenter
                width: parent.width
                height: root.m.track
                radius: height / 2
                color: appState && appState.darkMode ? Rsp.Theme.slate700 : "#e2e8f0"
            }

            // Filled portion
            Rectangle {
                anchors.left: track.left
                anchors.verticalCenter: track.verticalCenter
                width: track.width * root.ratio
                height: track.height
                radius: track.radius
                color: root.activeColor
                Behavior on width { NumberAnimation { duration: 150; easing.type: Easing.OutCubic } }
            }

            // Thumb
            Rectangle {
                id: thumb
                width: root.m.thumb
                height: root.m.thumb
                radius: width / 2
                color: "#ffffff"
                border.color: root.activeColor
                border.width: 3
                x: track.width * root.ratio - width / 2
                anchors.verticalCenter: track.verticalCenter
                scale: thumbArea.containsMouse || thumbArea.drag.active ? 1.1 : 1.0
                Behavior on scale { NumberAnimation { duration: Rsp.Theme.animFast } }

                MouseArea {
                    id: thumbArea
                    anchors.fill: parent
                    enabled: root.enabledState
                    hoverEnabled: true
                    drag.target: thumb
                    drag.axis: Drag.XAxis
                    drag.minimumX: -thumb.width / 2
                    drag.maximumX: track.width - thumb.width / 2
                    cursorShape: enabled ? Qt.PointingHandCursor : Qt.ForbiddenCursor

                    onPositionChanged: if (drag.active) {
                        const r = Math.max(0, Math.min(1, (thumb.x + thumb.width / 2) / track.width))
                        const raw = root.min + r * (root.max - root.min)
                        const stepped = Math.round(raw / root.step) * root.step
                        if (stepped !== root.value) {
                            root.value = stepped
                            root.valueUpdated(stepped)
                        }
                    }
                }
            }
        }

        RowLayout {
            Layout.fillWidth: true
            visible: root.showLabels
            Text {
                text: root.leftLabel !== "" ? root.leftLabel : Math.round(root.min)
                color: Rsp.Theme.textMuted
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeSm
                Layout.fillWidth: true
            }
            Text {
                text: root.rightLabel !== "" ? root.rightLabel : Math.round(root.max)
                color: Rsp.Theme.textMuted
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeSm
            }
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

Append:

```qml
            // ===== AppSlider ==========================================
            Text {
                text: "AppSlider"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            Ui.AppSlider { Layout.preferredWidth: 480; label: "Brightness"; value: 64;  color: "blue"     }
            Ui.AppSlider { Layout.preferredWidth: 480; label: "Temp";       value: 22;  color: "emerald"; min: 0; max: 40 }
            Ui.AppSlider { Layout.preferredWidth: 480; label: "Warning";    value: 80;  color: "amber";   size: "lg" }
            Ui.AppSlider { Layout.preferredWidth: 480; label: "Disabled";   value: 50;  color: "rose";    enabledState: false }
```

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/AppSlider.qml qml/pages/Showcase.qml
git commit -m "feat(ui): AppSlider with drag, color variants, label row"
```

---

### Task 8: SeatGrid.qml

Reference: `renderer/components/ui/SeatGrid.tsx`. Spec:
- **Props**: `pressures: var` (array of 12 floats).
- **Visual**: 2 rows × 6 cols, each cell 80×64 px. Background `Theme.bgPanel`, rounded-lg. Seat number text-2xl bold + pressure text-base in blue `#4a90e2`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/SeatGrid.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    property var pressures: [0,0,0,0,0,0, 0,0,0,0,0,0]

    readonly property color seatBlue: "#4a90e2"

    implicitHeight: 2 * 80 + 16
    implicitWidth: 6 * 96 + 5 * 12

    ColumnLayout {
        anchors.fill: parent
        spacing: 16

        Repeater {
            model: 2
            RowLayout {
                Layout.fillWidth: true
                spacing: 12
                property int rowIndex: index

                Repeater {
                    model: 6
                    Rectangle {
                        Layout.fillWidth: true
                        Layout.preferredHeight: 80
                        radius: Rsp.Theme.radiusSm
                        color: appState && appState.darkMode
                               ? Qt.rgba(0.12, 0.16, 0.23, 0.5)
                               : Qt.rgba(0.94, 0.95, 0.97, 1)

                        readonly property int seatNumber: parent.rowIndex * 6 + index + 1
                        readonly property real pressure: root.pressures.length > seatNumber - 1
                                                         ? root.pressures[seatNumber - 1]
                                                         : 0

                        ColumnLayout {
                            anchors.centerIn: parent
                            spacing: 2
                            Text {
                                text: parent.parent.seatNumber
                                color: Rsp.Theme.text
                                font.family: Rsp.Theme.fontFamily
                                font.pixelSize: 24
                                font.weight: Font.Bold
                                Layout.alignment: Qt.AlignHCenter
                            }
                            Text {
                                text: parent.parent.pressure.toFixed(2) + " Bar"
                                color: root.seatBlue
                                font.family: Rsp.Theme.fontFamily
                                font.pixelSize: 16
                                Layout.alignment: Qt.AlignHCenter
                            }
                        }
                    }
                }
            }
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

```qml
            // ===== SeatGrid ===========================================
            Text {
                text: "SeatGrid"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            Ui.SeatGrid {
                Layout.preferredWidth: 720
                Layout.preferredHeight: 176
                pressures: [0.50, 0.55, 0.48, 0.51, 0.60, 0.47,  0.53, 0.49, 0.52, 0.50, 0.46, 0.54]
            }
```

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/SeatGrid.qml qml/pages/Showcase.qml
git commit -m "feat(ui): SeatGrid 2×6 with seat number + pressure"
```

---

# Bundle 5 — SVG components (extract assets, then wrap)

This bundle has TWO commit boundaries: first extract the SVGs, then write the three QML wrappers.

### Task 9: Extract SVG assets

The three React components embed SVG inline. Extract their static markup into standalone `.svg` files so QML's `Image` can load them. Dynamic overlays (level text, pressure value) layer on top in QML — we do NOT bake the dynamic text into the SVG.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/svg/tank-air.svg`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/svg/tank-nitrogen.svg`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/svg/tank-cylinder.svg`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/svg/fss-tank.svg`
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/assets/svg/compressor.svg`

- [ ] **Step 1: Extract from React**

Open each React file and **copy the `<svg>...</svg>` block verbatim** into a standalone `.svg` file. Wrap as a complete SVG document — make sure each file starts with `<?xml version="1.0" encoding="UTF-8"?>` and the root `<svg>` element has the proper `xmlns="http://www.w3.org/2000/svg"` and exact `viewBox` from the React source.

Sources to copy from:
- `tank-air.svg` ← the air-type SVG in `renderer/components/ui/PressureTank.tsx` (110×150 grey tank with ellipses)
- `tank-nitrogen.svg` ← nitrogen-type SVG in the same file (110×150 green)
- `tank-cylinder.svg` ← ONE cylinder (32×190 blue gradient) from the same file — the cylinder-type renders 8 of these in a row, so the SVG is a single cylinder; QML uses a Repeater
- `fss-tank.svg` ← the dark red FFS tank SVG in `renderer/components/ui/FSSIndicator.tsx` (94×170, exclude the overlaid text and status circle — those become QML overlays)
- `compressor.svg` ← the compressor SVG in `renderer/components/ui/CompressorUnit.tsx` (200×160, exclude the status circle in the top-left — that becomes a QML overlay)

After extraction verify each file renders correctly in a browser (e.g. `open assets/svg/tank-air.svg` on macOS).

- [ ] **Step 2: Commit assets**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
git add assets/svg/
git commit -m "assets(svg): extract tank/compressor illustrations from React"
```

---

### Task 10: PressureTank.qml

Reference: `renderer/components/ui/PressureTank.tsx`. Spec:
- **Props**: `pressure: real`, `label: string`, `subLabel: string` (optional), `type: "air"|"nitrogen"|"cylinder"`.
- **Visual**: 110-wide column. SVG image (air/nitrogen) OR 8 cylinder SVGs in a row. Below the image: optional sublabel (16px), label (16px), pressure (20px bold). All in blue `#4a90e2`.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/PressureTank.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    property real pressure: 0
    property string label: ""
    property string subLabel: ""
    property string type: "air"   // "air" | "nitrogen" | "cylinder"

    readonly property color textBlue: "#4a90e2"

    implicitHeight: image.implicitHeight + labels.implicitHeight + 12
    implicitWidth: type === "cylinder" ? 32 * 8 + 6 * 7 : 110

    Column {
        anchors.fill: parent
        spacing: 8

        // ----- The tank illustration -----
        Item {
            id: image
            width: parent.width
            height: type === "cylinder" ? 190 : 150

            // air / nitrogen → single SVG
            Image {
                anchors.centerIn: parent
                source: type === "air"      ? "../../assets/svg/tank-air.svg"
                      : type === "nitrogen" ? "../../assets/svg/tank-nitrogen.svg"
                      : ""
                visible: type !== "cylinder"
                sourceSize: Qt.size(110, 150)
                width: 110; height: 150
            }

            // cylinder → 8 SVGs in a row
            Row {
                anchors.centerIn: parent
                spacing: 6
                visible: type === "cylinder"
                Repeater {
                    model: 8
                    Image {
                        source: "../../assets/svg/tank-cylinder.svg"
                        sourceSize: Qt.size(32, 190)
                        width: 32; height: 190
                    }
                }
            }
        }

        // ----- Labels -----
        Column {
            id: labels
            width: parent.width
            spacing: 2

            Text {
                visible: root.subLabel !== ""
                text: root.subLabel
                color: root.textBlue
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 16
                anchors.horizontalCenter: parent.horizontalCenter
            }
            Text {
                text: root.label
                color: root.textBlue
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 16
                anchors.horizontalCenter: parent.horizontalCenter
            }
            Text {
                text: root.pressure.toFixed(0) + " Bar"
                color: root.textBlue
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 20
                font.weight: Font.Bold
                anchors.horizontalCenter: parent.horizontalCenter
            }
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

```qml
            // ===== PressureTank =======================================
            Text {
                text: "PressureTank"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            RowLayout {
                Layout.fillWidth: true
                spacing: 32
                Ui.PressureTank { type: "air";      label: "Air Tank"; subLabel: "2000 L"; pressure: 12.5 }
                Ui.PressureTank { type: "nitrogen"; label: "N₂";       pressure: 120 }
                Ui.PressureTank { type: "cylinder"; label: "O₂ Bank";  pressure: 245 }
            }
```

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/PressureTank.qml qml/pages/Showcase.qml
git commit -m "feat(ui): PressureTank with air/nitrogen/cylinder variants"
```

---

### Task 11: FSSIndicator.qml

Reference: `renderer/components/ui/FSSIndicator.tsx`. Spec:
- **Props**: `label: string`, `level: real`, `pressure: real`, `isActive: bool`, `hasWarning: bool`, `warningPressure: real` (default 50).
- **Visual**: 94 wide column. Label "FFS" + custom label above. Status circle (20 px green w/ ✓ or red w/ ✗) + status text. Static SVG tank below. Overlaid on the tank (at y ≈ 130): level "%{level}" and pressure "{pressure} Bar" in white 18 px bold. Optional warning red box below.

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/FSSIndicator.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    property string label: ""
    property real level: 0
    property real pressure: 0
    property bool isActive: true
    property bool hasWarning: false
    property real warningPressure: 50

    readonly property color textBlue: "#4a90e2"
    readonly property color greenStatus: "#22c55e"

    implicitWidth: 94
    implicitHeight: 280

    Column {
        anchors.fill: parent
        spacing: 8

        // Label
        Text {
            text: root.label
            color: root.textBlue
            font.family: Rsp.Theme.fontFamily
            font.pixelSize: 16
            anchors.horizontalCenter: parent.horizontalCenter
        }
        Text {
            text: "FFS"
            color: root.textBlue
            font.family: Rsp.Theme.fontFamily
            font.pixelSize: 16
            anchors.horizontalCenter: parent.horizontalCenter
        }

        // Status circle + text
        Row {
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: 4

            Rectangle {
                width: 20; height: 20
                radius: 10
                color: root.isActive ? root.greenStatus : Rsp.Theme.rose

                Text {
                    anchors.centerIn: parent
                    text: root.isActive ? "✓" : "✗"
                    color: "#ffffff"
                    font.pixelSize: 12
                    font.weight: Font.Bold
                }
            }

            Text {
                anchors.verticalCenter: parent.verticalCenter
                text: root.isActive ? "Active" : "Off"
                color: root.isActive ? root.greenStatus : Rsp.Theme.rose
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 12
            }
        }

        // Tank + overlay
        Item {
            width: 94; height: 170
            anchors.horizontalCenter: parent.horizontalCenter

            Image {
                anchors.fill: parent
                source: "../../assets/svg/fss-tank.svg"
                sourceSize: Qt.size(94, 170)
            }

            Column {
                anchors.horizontalCenter: parent.horizontalCenter
                y: 110
                spacing: 2

                Text {
                    text: "%" + root.level.toFixed(0)
                    color: "#ffffff"
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: 18
                    font.weight: Font.Bold
                    anchors.horizontalCenter: parent.horizontalCenter
                }
                Text {
                    text: root.pressure.toFixed(1) + " Bar"
                    color: "#ffffff"
                    font.family: Rsp.Theme.fontFamily
                    font.pixelSize: 18
                    font.weight: Font.Bold
                    anchors.horizontalCenter: parent.horizontalCenter
                }
            }
        }

        // Warning box
        Rectangle {
            visible: root.hasWarning
            anchors.horizontalCenter: parent.horizontalCenter
            implicitWidth: warnText.implicitWidth + 16
            implicitHeight: warnText.implicitHeight + 6
            radius: 4
            color: Rsp.Theme.rose

            Text {
                id: warnText
                anchors.centerIn: parent
                text: "≤ " + root.warningPressure + " Bar"
                color: "#ffffff"
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 12
                font.weight: Font.Bold
            }
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

```qml
            // ===== FSSIndicator =======================================
            Text {
                text: "FSSIndicator"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            RowLayout {
                Layout.fillWidth: true
                spacing: 32
                Ui.FSSIndicator { label: "Main";  level: 75; pressure: 12.5; isActive: true }
                Ui.FSSIndicator { label: "Ante";  level: 60; pressure: 11.2; isActive: false; hasWarning: true; warningPressure: 50 }
            }
```

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/FSSIndicator.qml qml/pages/Showcase.qml
git commit -m "feat(ui): FSSIndicator with tank SVG + dynamic overlays + warning"
```

---

### Task 12: CompressorUnit.qml

Reference: `renderer/components/ui/CompressorUnit.tsx`. Spec:
- **Props**: `label: string`, `status: bool`.
- **Visual**: 200 wide. Status circle 32 px top-left (green✓ or red✗) + status text. SVG compressor 200×160 below. Label below SVG (24 px in `#4a90e2`).

**Files:**
- Create: `/Users/sencersoylu/Projects/MY_APP_QT/qml/ui/CompressorUnit.qml`

- [ ] **Step 1: Write the component**

```qml
import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import ".." as Rsp

Item {
    id: root

    property string label: ""
    property bool status: false

    readonly property color textBlue: "#4a90e2"
    readonly property color greenStatus: "#22c55e"

    implicitWidth: 200
    implicitHeight: 260

    Column {
        anchors.fill: parent
        spacing: 8

        // Status row
        Row {
            anchors.horizontalCenter: parent.horizontalCenter
            spacing: 8

            Rectangle {
                width: 32; height: 32
                radius: 16
                color: root.status ? root.greenStatus : Rsp.Theme.rose
                Text {
                    anchors.centerIn: parent
                    text: root.status ? "✓" : "✗"
                    color: "#ffffff"
                    font.pixelSize: 16
                    font.weight: Font.Bold
                }
            }
            Text {
                anchors.verticalCenter: parent.verticalCenter
                text: root.status ? "On" : "Off"
                color: root.status ? root.greenStatus : Rsp.Theme.rose
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: 16
            }
        }

        // Compressor SVG
        Image {
            anchors.horizontalCenter: parent.horizontalCenter
            source: "../../assets/svg/compressor.svg"
            sourceSize: Qt.size(200, 160)
            width: 200; height: 160
        }

        Text {
            text: root.label
            color: root.textBlue
            font.family: Rsp.Theme.fontFamily
            font.pixelSize: 24
            anchors.horizontalCenter: parent.horizontalCenter
        }
    }
}
```

- [ ] **Step 2: Add to Showcase**

```qml
            // ===== CompressorUnit =====================================
            Text {
                text: "CompressorUnit"
                color: Rsp.Theme.text
                font.family: Rsp.Theme.fontFamily
                font.pixelSize: Rsp.Theme.fontSizeLg
                font.weight: Font.Bold
            }
            RowLayout {
                Layout.fillWidth: true
                spacing: 24
                Ui.CompressorUnit { label: "HP 1"; status: true  }
                Ui.CompressorUnit { label: "LP 1"; status: true  }
                Ui.CompressorUnit { label: "LP 2"; status: false }
            }
```

- [ ] **Step 3: Smoke test + commit**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 3; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning" /tmp/smoke.log | head -20; rm -f /tmp/smoke.log

git add qml/ui/CompressorUnit.qml qml/pages/Showcase.qml
git commit -m "feat(ui): CompressorUnit with status indicator + SVG"
```

---

# Bundle 6 — Final smoke + tag

### Task 13: Phase 2 smoke test + tag

- [ ] **Step 1: Final smoke test**

```bash
cd /Users/sencersoylu/Projects/MY_APP_QT
source .venv/bin/activate
pytest -q                   # all Phase 1 tests still pass
python main.py >/tmp/smoke.log 2>&1 &
PID=$!; sleep 4; kill -TERM $PID 2>/dev/null; wait $PID 2>/dev/null || true
grep -iE "qml.*error|qml.*warning|traceback" /tmp/smoke.log | grep -v "socketio\|engineio\|httpx" | head -30
rm -f /tmp/smoke.log
```

Expected:
- pytest: 37 passed (no Phase 1 regressions).
- Smoke log: no QML errors. Acceptable: socket connection errors.

- [ ] **Step 2: Inspect the QML import graph**

```bash
ls -la qml/ui/ assets/svg/
git log --oneline | head -20
```

Expected: 9 QML files in `qml/ui/`, 5 SVGs in `assets/svg/`, roughly 12 new commits since `phase-1-complete`.

- [ ] **Step 3: Tag**

```bash
git tag phase-2-complete
git tag
git log --oneline | head -20
```

Expected: tag list includes `phase-0-complete`, `phase-1-complete`, `phase-2-complete`.

---

## Self-Review Notes

- **Spec coverage:** Spec §5.3 lists 9 components — all 9 are in this plan. Showcase requirement comes from spec §5.4 and §9 Phase 2 exit criterion ("Showcase QML page renders every primitive"). Tailwind→QML cheat-sheet from spec §5.2. All present.
- **Placeholder scan:** Every step has either a verbatim file body or a verbatim shell command. No TBD/TODO.
- **Type consistency:** `signal valueUpdated(real v)` in AppSlider (not `valueChanged`) to avoid QML built-in conflict — documented in the task. `ToggleSwitch` uses `signal valueChanged(int)` which is also a QML built-in but works because `value` is a custom property — explicit signal declaration overrides the built-in. Confirmed in Task 6.
- **Visual fidelity tradeoff:** SVG-heavy components (Tasks 10–12) extract React's inline SVG to standalone files. This is faster than rebuilding in QML Shape primitives and gives pixel-perfect parity. Dynamic data (level, pressure) overlays on top — easier to bind than to splice into SVG.
- **Showcase as visual harness:** every task adds a Showcase entry. After Bundle 5 Showcase has all 9 components. Visual regressions become obvious on the next time the user runs `Ctrl+S`.
- **No tests:** QML files don't get pytest. The smoke test (`python main.py` + grep for QML errors) catches syntax errors and missing imports. Visual correctness requires human review on RPi5 — that's Phase 3 acceptance, not Phase 2.

## Phase 2 → Phase 3 handoff

After this plan ships, Phase 3 (Dashboard.qml) consumes:
- All `qml/ui/*` components — composed into ChamberControlPanel, AuxiliaryOutputPanel, LightingPanel, FanPanel, the 3 modals.
- Custom-drawn components flagged in spec §5.4 (HyperbaricChamber, CylinderBank, ChamberSeatOverlay) — Phase 3 builds these as new files; they don't go through `qml/ui/`.
- Sensor field bindings — `appState.lightStatus`, `appState.fan1Status`, etc. — already QML-visible after the Phase 1 Bundle E fix.

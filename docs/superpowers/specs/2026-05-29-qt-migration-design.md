# Qt Migration Design — MY_APP → MY_APP_QT

**Date:** 2026-05-29
**Status:** Approved design, ready for Phase 0–3 implementation plan
**Source app:** `/Users/sencersoylu/Projects/MY_APP` (Nextron / Electron + Next.js + React + Tailwind + Zustand)
**Target app:** `/Users/sencersoylu/Projects/MY_APP_QT` (new sibling repo, own git history)

## 1. Goal and Scope

Port the active surface of the hyperbaric chamber / O2 monitoring HMI from Nextron to **PySide6 + QML**, preserving pixel-level visual fidelity and 1:1 behavioral parity, while keeping the existing Nextron app untouched until the new app reaches full feature parity.

**In scope (active pages only):**
- `dashboard.tsx` → `qml/pages/Dashboard.qml` — the chamber control dashboard (Zustand-backed, uses Header / ChamberControlPanel / AuxiliaryOutputPanel / LightingPanel / FanPanel and 3 modals; talks to PLC at `192.168.77.100:4000`)
- `home.tsx` → `qml/pages/VitalSigns.qml` — vital-signs page (heart rate / SpO2 / blood pressure; local state, talks to a separate Socket.io server at a configurable URL — currently an ngrok endpoint hard-coded as `https://6b07-...ngrok-free.app`; will be moved to config)
- `o2-analyzer.tsx` → `qml/pages/O2Analyzer.qml`
- `technical-room.tsx` → `qml/pages/TechnicalRoom.qml`
- `patient-monitor.tsx` → `qml/pages/PatientMonitor.qml`
- `compressor.tsx` → `qml/pages/Compressor.qml`
- `sensors.tsx` → `qml/pages/Sensors.qml`

**Out of scope:** `-old`, `-v2`, `-backup`, `dashboardtr`, `home_dik`, `next`, `slider-example`, `test.html` variants.

**Backends are unchanged.** The Qt app talks to the same servers as Nextron:
- Socket.io PLC bridge: `http://192.168.77.100:4000` (used by Dashboard, TechnicalRoom, Sensors)
- Socket.io B-Control bridge + REST: `http://localhost:3001` (REST under `/api`; B-Control used by Compressor, TechnicalRoom, Sensors)
- Socket.io vital-signs server: configurable URL (currently the ngrok endpoint hard-coded in `home.tsx`; moved into `app/config.py` as `VITAL_SIGNS_URL`) — used only by VitalSigns page

**Target platforms:**
- Production: Raspberry Pi 5 (Linux ARM64, labwc/XWayland, fullscreen kiosk)
- Development: macOS and Linux desktop

## 2. Architecture

**Chosen stack:** PySide6 + QML (Qt 6 Quick), with `qasync` bridging Qt's event loop and `asyncio` so `python-socketio` and `httpx` run in the same loop as the GUI.

**Why not Qt Widgets:** glassmorphism, dark-mode palette transitions, custom gauges, and gradient layering required for pixel-level fidelity are painful in QSS but native in QML.

**Why not C++:** event volume (a handful of `data` frames per second, ~30-element payload) is well within Python's headroom on RPi5. Single-language codebase is a stronger win than the marginal perf delta.

### 2.1 Repository layout

The new app lives in a separate sibling directory with its own git repo:

```
/Users/sencersoylu/Projects/
  MY_APP/      (existing Nextron — untouched, deleted only after Phase 9)
  MY_APP_QT/   (new repo — git init from scratch)
```

```
MY_APP_QT/
  pyproject.toml
  main.py
  app/
    state.py             # AppState QObject (Zustand store equivalent)
    plc_client.py        # Socket.io :4000 PLC bridge
    bcontrol_client.py   # Socket.io :3001 B-Control bridge
    vitals_client.py     # Socket.io vital-signs (configurable URL)
    rest_client.py       # httpx async REST client
    config.py            # URLs (PLC, B-Control, REST, vital-signs)
    plc_data_map.py      # Indexed mapping of the 30-element `data` array
    persistence.py       # QSettings wrapper (localStorage equivalent)
    router.py            # StackView page navigation helper
  qml/
    Main.qml
    Theme.qml            # pragma Singleton — colors, font, dark-mode
    pages/
      Dashboard.qml        # port of dashboard.tsx (chamber control)
      VitalSigns.qml       # port of home.tsx (vital signs)
      O2Analyzer.qml
      TechnicalRoom.qml
      PatientMonitor.qml
      Compressor.qml
      Sensors.qml
    panels/              # equivalents of renderer/components/dashboard/*
      Header.qml
      ChamberControlPanel.qml
      AuxiliaryOutputPanel.qml
      LightingPanel.qml
      FanPanel.qml
      HyperbaricChamber.qml
      CylinderBank.qml
      CompressorGauge.qml
      ChamberSeatOverlay.qml
      ...
    ui/                  # equivalents of renderer/components/ui/*
      AppButton.qml
      Card.qml
      AppModal.qml
      AppSlider.qml
      ToggleSwitch.qml
      SeatGrid.qml
      PressureTank.qml
      FSSIndicator.qml
    modals/
      ChillerModal.qml
      ErrorModal.qml
      SeatAlarmModal.qml
  assets/
    fonts/Poppins-*.ttf  # bundled, no Google Fonts dependency
    images/              # copied PNG/SVG assets from MY_APP
    svg/
  scripts/
    dev.sh
    deploy-rpi.sh
    rpi-autostart.sh
  tests/
    test_state.py
    test_plc_client.py
    test_rest_client.py
    qml/                 # qmltestrunner cases for custom-drawn components
  docs/
    tailwind-to-qml.md   # cheat-sheet referenced during porting
```

## 3. State Model

Single `AppState(QObject)` mirrors the existing Zustand store one-to-one. QML accesses it as a context property named `appState`.

### 3.1 Property pattern

Every field is exposed as a `Property` with a paired `Changed` `Signal`. Setters write through `QSettings` for persisted fields and emit the change signal so all QML bindings refresh automatically.

```python
@Property(bool, notify=darkModeChanged)
def darkMode(self): return self._darkMode

@darkMode.setter
def darkMode(self, v):
    if self._darkMode != v:
        self._darkMode = v
        self._settings.setValue("darkMode", v)
        self.darkModeChanged.emit()
```

### 3.2 Field inventory

| Category | Fields | Persisted |
|---|---|---|
| Theme | `darkMode` | yes |
| Connection | `connected` | no |
| Lighting/Fan | `lightStatus`, `light2Status`, `fan1Status`, `fan2Status` | yes |
| Ventilation | `autoMode`, `airMode`, `playing`, `ventilMode` | yes |
| Valves | `valve1Status`, `valve2Status` | yes |
| Modals | `showAuxPanel`, `showCalibrationModal`, `showErrorModal`, `showSeatAlarmModal`, `showChillerModal` | no |
| Calibration | `calibrationProgress`, `calibrationStatus` | no |
| Chiller | `chillerRunning`, `chillerCurrentTemp`, `chillerSetTemp`, `chillerCommError` | mixed |
| Chamber sensors | `mainPressure`, `mainO2`, `mainTemp`, `mainHumidity`, `antePressure`, `anteO2`, `anteTemp`, `anteHumidity` (new for Qt — Zustand kept these in component-local state) | no |
| Tech sensors | `lp1Status`, `lp2Status`, `hp1Status` (HP1 comes from B-Control, not PLC), `hpCylinderPressure`, `airTankPressure` (now from `data[30]`, not `data[8]`), `nitrogen1Pressure`, `nitrogen2Pressure`, `techO2Pressure` (new — `data[9]`), `anteFssNitrogenPressure` (new — `data[24]`) | no |
| FSS | `mainFssActive`, `mainFssAlarm`, `mainFssLevel`, `mainFssPressure`, `anteFssActive`, `anteFssAlarm`, `anteFssWarning`, `anteFssLevel`, `anteFssPressure` | no |
| O2 | `primaryO2Active`, `primaryO2Pressure`, `secondaryO2Active`, `secondaryO2Pressure`, `liquidO2Active`, `liquidO2Pressure`, `mainHighO2`, `anteHighO2` | no |
| Detectors | `mainFlameDetected`, `mainSmokeDetected`, `anteSmokeDetected` | no |
| Alarms | `activeSeatAlarm` (dict\|None), `seatPressures` (list[12]) | no |
| Errors | `errorMessage` | no |
| Time | `currentTime`, `currentTime2` | no |

Persistence key namespace: `QSettings("soylu", "rsp-qt")`. (The Nextron app uses `dashboard-storage-${windowId}` via Zustand `persist`; the Qt app is single-window so a single namespace is enough.)

### 3.3 Command vs state separation

UI does **not** mutate state to trigger device writes. The contract is:

- **UI → device:** QML calls `plcClient.writeRegister(addr, value)` or `plcClient.writeBit(addr, value)` directly.
- **Device → UI:** PLC `data` event handler updates `AppState`, which fires `Changed` signals, which refresh QML bindings.

This matches Zustand's existing pattern and avoids feedback loops.

## 4. Data Flow

### 4.1 PLC Socket Client (`192.168.77.100:4000`)

`app/plc_client.py` wraps `socketio.AsyncClient` with auto-reconnect (1s → 5s exponential backoff, unbounded retries).

**Inbound events:**
- `data` — envelope `{isConnectedPLC: 0|1, data: number[]}`. The array is ≥31 numeric elements in current firmware (live-verified 2026-05-22 and 2026-05-26). Full index map in `app/plc_data_map.py`, derived from `reference_socket_data_mapping.md`. Highlights:
    - `0..2` main chamber pressure / O2 / temperature
    - `3` ante chamber humidity (live-verified, not unused)
    - `4..6` ante chamber pressure / O2 / temperature
    - `7` main chamber humidity
    - `9` tech O2 pressure
    - `10..13` main/ante FSS pressure and level
    - `14`, `17`, `18`, `25`, `26` unmapped (logged at debug level)
    - `15` chiller PV (current temp) — divide by 10
    - `16` seat alarm number (also delivered as `seatAlarm` event)
    - `19` alarm bitfield (bits: 2=MainFSS, 3=AnteFSS, 4=MainFlame, 5=MainSmoke, 6=AnteSmoke, 7=MainHighO2, 8=AnteHighO2)
    - `20..21` O2 cylinder bank 1 / 2
    - `22..23` main FSS nitrogen #1 / #2
    - `24` ante FSS nitrogen #1
    - `27` chiller link status — `=== 10` means **comm error** (Phase 1 plan corrected from `data[28]`)
    - `28` chiller set temp × 10 (only trusted when `data[27] !== 10`)
    - `29` chiller status flag 1; bit 0 = running
    - `30` air tank pressure (replaces the older `data[8]` mapping)
- `chillerData` — only `currentTemp` / 10 is used. The `running` field on this event is intentionally ignored (run state is read from `data[29]` bit 0).
- `calibrationProgress` — progress percentage + status string
- `seatAlarm` — `{seatNumber: int, ...}`

**Outbound (QML-invokable `@Slot`s):**
- `writeRegister(register: str, value: int)` — analog (0–255), registers `R01700` / `R01702` / `R01704` / `R01706`. Payload sent: `{"register": <str>, "value": <int>}` (verified against `dashboard.tsx:326`).
- `writeBit(register: str, value: int)` — binary (0/1), bits `M0200`–`M0503`. Payload: `{"register": <str>, "value": <int>}` (verified against `dashboard.tsx:367`).

Each outbound call schedules `sio.emit(...)` on the qasync loop with `asyncio.create_task(...)` so QML stays non-blocking.

### 4.1a Vital-Signs Socket Client (configurable URL)

`app/vitals_client.py` — Socket.io client used only by VitalSigns page.

- **Inbound:** `vitalSigns` (heart rate, SpO2, blood pressure), `serialData` (raw payload parsed for calibration / seat alarm cues — see `home.tsx:65`)
- **Outbound:** `serialSend` (string command, e.g. `"M"` — see `home.tsx:73`)
- **URL:** `config.VITAL_SIGNS_URL` (currently the ngrok endpoint; change in one place when the production URL is known)

### 4.2 B-Control Socket Client (`localhost:3001`)

`app/bcontrol_client.py` — same pattern, scoped to compressor.qml and sensors.qml:
- **Emit:** `control` (`ON` / `OFF` / `RESET`)
- **Listen:** `telemetry`, `status`

### 4.3 REST Client (`localhost:3001/api`)

`app/rest_client.py` wraps `httpx.AsyncClient(base_url=..., timeout=10.0)`. Method groups:

- **Chambers** (8): list, create, get, update, delete, latest reading, history, alarm-level
- **Alarms** (6): list, history, stats, get, mute, resolve
- **Settings / Calibration** (5): get, update, calibration-points, calibrate-reading, calibration-status, calibration stats
- **Analytics** (4): dashboard, trends, calibration-history, alarm-summary

A central `_handle_error(exc)` translates exceptions to Turkish messages (1:1 port of `handleApiError`) and emits `errorOccurred(str)`, which `ErrorModal` listens to.

### 4.4 Event loop bootstrap

`main.py` initializes Qt + qasync + clients, then loads `qml/Main.qml`:

```python
app = QGuiApplication(sys.argv)
loop = qasync.QEventLoop(app)
asyncio.set_event_loop(loop)

state = AppState()
plc = PlcClient(state)
bcontrol = BControlClient(state)
rest = RestClient()

engine = QQmlApplicationEngine()
engine.rootContext().setContextProperty("appState", state)
engine.rootContext().setContextProperty("plcClient", plc)
engine.rootContext().setContextProperty("bcontrolClient", bcontrol)
engine.rootContext().setContextProperty("restClient", rest)
engine.load("qml/Main.qml")

with loop:
    loop.create_task(plc.start())
    loop.create_task(bcontrol.start())
    loop.run_forever()
```

### 4.5 Reconnect and error behavior

- Socket library handles reconnect; `connect`/`disconnect` events flip `appState.connected`, which drives the header connection icon.
- Partial / malformed `data` payloads are logged and dropped; state is never half-updated.
- REST errors propagate as Turkish-text `errorOccurred` signal → ErrorModal.

## 5. UI Mapping (Tailwind / React → QML)

### 5.1 Theme singleton

`qml/Theme.qml` (`pragma Singleton`) centralizes the Tailwind palette (slate scale + emerald / amber / rose / cyan semantic colors), dark-mode-derived properties (`bg`, `bgPanel`, `text`, `border`, `glass`), typography (`Poppins`), corner radius scale, and shadow profiles. All QML files read `Theme.*` — no inline hex colors.

### 5.2 Tailwind utility → QML cheat-sheet

A standing reference at `docs/tailwind-to-qml.md`:

| Tailwind | QML |
|---|---|
| `bg-white dark:bg-slate-900` | `color: Theme.bg` |
| `text-slate-900 dark:text-white` | `color: Theme.text` |
| `rounded-2xl` | `radius: Theme.radiusLg` |
| `p-4` | `padding: 16` |
| `gap-3` | `spacing: 12` |
| `border border-slate-200` | `border.width: 1; border.color: Theme.border` |
| `shadow-lg` | `DropShadow` / `MultiEffect` |
| `bg-white/80` (glass) | `color: Qt.rgba(1,1,1,0.8)`, optional `MultiEffect blur` |
| `transition-all` | `Behavior on <prop> { NumberAnimation { duration: 200; easing.type: Easing.OutCubic } }` |
| `hover:bg-emerald-600` | `MouseArea.containsMouse` + state |
| `grid grid-cols-7` | `GridLayout { columns: 7 }` |
| `flex flex-col` | `ColumnLayout` |

### 5.3 UI component equivalents

| React (`components/ui/`) | QML (`qml/ui/`) | Notes |
|---|---|---|
| `Button.tsx` | `AppButton.qml` | `variant: "primary"\|"danger"\|"ghost"`; theme via singleton, not `isDark` prop |
| `Card.tsx` | `Card.qml` | header / body / footer via default-property slots |
| `Modal.tsx` | `AppModal.qml` | `Popup` with blur backdrop |
| `Slider.tsx` | `AppSlider.qml` | Custom handle/track on `Slider` |
| `ToggleSwitch.tsx` | `ToggleSwitch.qml` | Animated thumb |
| `SeatGrid.tsx` | `SeatGrid.qml` | `Repeater` × 12, alarm state from `appState.activeSeatAlarm` |
| `PressureTank.tsx` | `PressureTank.qml` | `Canvas` (cylinder + animated fluid level) |
| `FSSIndicator.tsx` | `FSSIndicator.qml` | `Shape` (water level indicator) |
| `CompressorUnit.tsx` | `CompressorUnit.qml` | Image + state overlay |

### 5.4 Custom-drawn components

Four Tailwind-layered visuals re-implemented with QML primitives or `Canvas` / `Shape`:

1. **HyperbaricChamber** — `GridLayout columns: 7`, each cell a `Rectangle` with border + gradient fill. No `Canvas` needed.
2. **CylinderBank** — `Repeater` × 8 of `Rectangle` with `LinearGradient` (sky-500/40 → transparent), or `Shape { ShapePath }` if richer geometry is needed.
3. **CompressorGauge** — `Canvas` (arc + 12 ticks) + `Shape` needle; needle bound to a `rotation` property with `Behavior on rotation { NumberAnimation { duration: 200 } }`.
4. **ChamberSeatOverlay** — `Image` (PNG isometric room) + `Repeater` of seat dots; alarm state animates `color` and `scale`.

Seven SVG-backed visuals (PatientSilhouette, DetectorPanel gauges, TankSystemPanel, TechRoomHeader schematic, FSSPanel, ChillerStatusPanel, O2PressureCard sparklines): SVGs copied to `assets/svg/`, loaded via `Image`, dynamic overlays (gauge needles, sparklines) drawn with `Canvas` / `Shape`.

### 5.5 Page → panel composition

| Page | Top-level layout | Panels / modals |
|---|---|---|
| `Dashboard.qml` | `RowLayout` | Header, ChamberControlPanel, AuxiliaryOutputPanel, LightingPanel, FanPanel + ChillerControlModal, ErrorModal, SeatAlarmModal |
| `VitalSigns.qml` | `ColumnLayout` | Vital-signs cards (heart rate, SpO2, blood pressure), calibration modal, error modal, seat-alarm modal. Local state (not bound to `AppState`); subscribes to `vitalsClient` |
| `O2Analyzer.qml` | `GridLayout` | `O2AnalyzerCard` × N, O2AnalyzerSettings modal; REST polling every 5s |
| `TechnicalRoom.qml` | Fixed 1280×720 `Item`, scaled to viewport | TechRoomHeader + SVG/PNG overlays (HP1, chiller, tanks) |
| `PatientMonitor.qml` | `GridLayout columns: 4` | `PatientCard` × 12, SessionInfoPanel, PatientSilhouette |
| `Compressor.qml` | `ColumnLayout` | MetricTile, CountChip, MessageRow, ControlButton |
| `Sensors.qml` | `GridLayout` | SensorCard, ChamberSeatOverlay |

### 5.6 Navigation

QML `StackView` in `Main.qml` replaces Next.js routing. Header buttons call `stack.push("pages/<Page>.qml")`.

### 5.7 Fullscreen / kiosk

```qml
ApplicationWindow {
    visibility: Window.FullScreen
    Shortcut {
        sequence: "F11"
        onActivated: visibility = visibility === Window.FullScreen
                                   ? Window.Windowed
                                   : Window.FullScreen
    }
}
```

## 6. Error Handling

- **Socket reconnect:** library-handled (1s → 5s backoff). State never half-updated on partial payloads.
- **REST errors:** centralized Turkish messages via `_handle_error`, surfaced through `errorOccurred(str)` signal.
- **QML runtime:** `QML_IMPORT_TRACE=1` during dev; Python `logging` to `~/.local/share/rsp-qt/app.log` with daily rotation.
- **Crash recovery:** `QSettings` writes on every persisted setter; relaunch restores state.

## 7. Testing

| Layer | Tooling | Scope |
|---|---|---|
| `AppState` | `pytest` | Property/Signal behavior, persistence, ephemeral separation |
| `plc_client`, `bcontrol_client` | `pytest-asyncio` + `python-socketio` test server | `data` parse, register/bit emit, reconnect |
| `rest_client` | `pytest` + `respx` | Endpoint coverage, Turkish error mapping |
| QML | `qmltestrunner` (`TestCase`) | Custom-drawn components (gauge, seat overlay), critical bindings |
| E2E | Manual on RPi5 | Per-phase acceptance — page-by-page parity vs. Nextron |

Target ≥ 80% coverage on Python layer (state + clients). QML tests only on custom-drawn components.

## 8. Packaging and Deployment

### 8.1 Development

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .[dev]
python main.py
```

### 8.2 RPi5 deployment

System Python + venv + labwc autostart (no PyInstaller bundle — too fragile on ARM64 with Qt plugins):

```
~/rsp-qt/
  .venv/         # PySide6 ARM64 wheel
  app/
  qml/
  assets/
  run.sh         # source .venv/bin/activate && python main.py
```

- `~/.config/labwc/autostart` runs `~/rsp-qt/run.sh &` instead of the Electron app.
- `scripts/deploy-rpi.sh` rsyncs source; venv is created once on the Pi.

### 8.3 Dependencies (`pyproject.toml`)

```toml
[project]
dependencies = [
  "PySide6>=6.6",
  "python-socketio[asyncio_client]>=5.11",
  "qasync>=0.27",
  "httpx>=0.27",
]
[project.optional-dependencies]
dev = ["pytest", "pytest-asyncio", "respx", "ruff"]
```

## 9. Phased Migration Plan

Per the user's choice ("staged: skeleton first + one page"), the work is split into nine phases. **This spec scopes Phases 0–3 only.** Phase 3 ends with one live page (Home) running on RPi5 against the real PLC — the moment to validate before committing to the rest. Each subsequent phase gets its own spec + plan cycle.

| Phase | Content | Exit criterion |
|---|---|---|
| **0** | Repo init, `pyproject.toml`, folder skeleton, `Theme.qml`, `Main.qml`, Poppins font bundle | Empty window opens; dark/light toggle works |
| **1** | `AppState` (full field set), `PlcClient`, `BControlClient`, `RestClient`, QSettings persistence, reconnect | Headless tests pass; QML reads `appState.darkMode` |
| **2** | `ui/` component library + tailwind-to-qml cheat-sheet | Showcase QML page renders every primitive |
| **3** | `Dashboard.qml` + 4 panels + 3 modals + HyperbaricChamber / CylinderBank / ChamberSeatOverlay | Runs on RPi5 against live PLC; visual parity confirmed |
| 4 | `VitalSigns.qml` + `vitals_client.py` | Separate spec |
| 5 | `O2Analyzer.qml` + REST polling | Separate spec |
| 6 | `TechnicalRoom.qml` (scaled 1280×720) | Separate spec |
| 7 | `PatientMonitor.qml` | Separate spec |
| 8 | `Compressor.qml` + B-Control HMI | Separate spec |
| 9 | `Sensors.qml` | Separate spec |
| 10 | RPi5 deploy script + labwc autostart + final acceptance | Old Nextron app removed |

## 10. Risks

| Risk | Mitigation |
|---|---|
| `qasync` + `python-socketio` event-loop interaction | Phase 1 starts with a one-day spike: connect, parse a `data` payload, bind one field to a QML label |
| Pixel-level fidelity for Tailwind glassmorphism | Phase 2 side-by-side comparison vs. Nextron; fall back to `Qt5Compat.GraphicalEffects` blur + alpha layering |
| Missing Poppins font on RPi5 | Bundled in `assets/fonts/`, loaded via `FontLoader` |
| 30-element `data` array index drift | Constants table in `app/plc_data_map.py` derived from `reference_socket_data_mapping.md`, covered by unit test |
| Custom QML `Canvas` performance (rotating gauge needle) | `renderTarget: Canvas.FramebufferObject` + `Behavior on rotation` |

## 11. Out of Scope

- Migrating archived page variants (`-old`, `-v2`, `-backup`, `dashboardtr`, `home_dik`, etc.)
- Changing backend protocols, endpoints, or register addresses
- C++ optimizations (deferred unless Phase 3 profiling shows a bottleneck)
- Cross-compiling / packaging as AppImage (system Python + venv is the deployment model)

## 12. Acceptance for Phases 0–3

The implementation plan covering Phases 0–3 is complete when:

1. `MY_APP_QT/` is a standalone git repo that opens an empty themed window on macOS / Linux / RPi5.
2. `AppState` exposes every field listed in §3.2 with persistence behavior matching Zustand.
3. `PlcClient`, `BControlClient`, and `RestClient` connect, reconnect, and round-trip a write under unit tests.
4. The `ui/` component library renders every primitive in a showcase page.
5. `Dashboard.qml` runs on RPi5 against the live PLC with visual parity confirmed by side-by-side comparison.

Phases 4–10 are planned in subsequent specs.

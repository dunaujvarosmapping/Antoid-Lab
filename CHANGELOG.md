# Changelog

All notable public changes to Antoid Lab are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic version numbers.

## [5.0.0-beta.1] - 2026-08-28

Release name: **Antoid Lab v5.0.0 Public Beta**

### Added

- Antoid SUPCer as a third complete Lab environment with a physical PC tower, monitor, keyboard, mouse, rear I/O, cables, power controls, openable side panel, and visible internal components.
- Hardware-aware POST, startup, firmware diagnostics, BIOS tabs, boot order, component detection, graphics-output routing, SATA detection, temperature, fans, and monitor signal states.
- Compatible RAM slot and PCIe component handling, retention latches, an inventory mat, branded replacement parts, power-budget checks, and parts acquisition.
- Antoid OS 7 desktop with persistent windows, taskbar, Start menu, lock and power actions, personalization, files and Recycle Bin.
- Working Files, Browser, Paint, Media Player, Text Editor, Calculator, System Information, System Monitor, Control Panel, playable Orbital Blocks and Circuit Pairs games, and `.ant` package installer experiences.
- Shared ANRouter with local administration, configurable Wi-Fi, LAN/DHCP, WAN, bands, client naming and blocking, network conditions, and phone/UTV/SUPCer clients.
- SUPCer Controller Lab controls for system power, CPU load, memory, storage, graphics, cooling, network, monitor, peripherals, POST faults, and BIOS restart.
- Schema 9 persisted-state migrations and SUPCer/router regression coverage.

### Changed

- Product identity and all current release surfaces now identify **Antoid Lab v5.0.0 Public Beta** as a pre-release.
- Phone and UTV Wi-Fi now use the shared configurable ANRouter instead of an isolated fixed access point.
- Router bandwidth, latency, reliability, packet loss, WAN, DHCP, credentials, and blocking now affect simulated connectivity.
- GitHub documentation, package metadata, keywords, and release notes now describe the complete v5 beta scope.

### Preserved

- The existing Antoid 1, UTV, DVB-T2, Decoder, DVD, carrier, physical hardware, application, and persistence systems remain available.
- Older recoverable local state is migrated rather than discarded.

### Known Public Beta limitations

- SUPCer models physical and firmware consequences through application state; it is not a native hardware emulator or virtual machine.
- Antoid Browser pages and `.ant` packages remain deliberately local and declarative, with no arbitrary external-site embedding or native-code execution.
- Simulated state persists in the local browser profile and does not yet provide cloud or multi-user synchronization.

## [4.0.0] - 2026-08-28

### Added

- Antoid Lab device entry experience and a shared physical world for Antoid 1 and Antoid UTV 1.
- Antoid UTV 1, physical unboxing, antenna selection, cable patching, first-time setup, Live TV, inputs, settings, channel list, and full EPG.
- Four independent Hungarian DVB-T2 transmitter sites with exact-frequency tuning and the canonical MUX A–E service map.
- Free and coded service discovery, persistent LCN management, service overrides, radio playback, diagnostics, and realistic RF degradation.
- Antoid Decoder Box with provider access cards, independent tuner storage, system information, firmware updating, controlled failure modes, and recovery tools.
- Antoid DVD Player with physical discs, tray timing, region checks, optical-read behavior, chapters, playback controls, and HDMI/SCART/composite connections.
- UTV Controller Lab sections for hardware, connections, reception, multiplexes, channels, weather, network, Decoder, DVD, and fault testing.
- Shared HDMI output behavior between source-device views and the UTV input view.

### Changed

- Expanded persistent Lab state and migrations for UTV, broadcast, Decoder, DVD, and physical-world data.
- Channel scans now progress frequency by frequency and derive results from receivable tower and multiplex transmissions.
- Channel resolution, aspect ratio, audio mode, subtitles, encryption, provider authorization, and broadcast state now affect actual tuner and playback behavior.
- Channel-number conflicts use deterministic swaps, and channel reorder controls persist their results.
- Perfect RF conditions now produce a clean stream without artificial corruption.

### Fixed

- Repaired dead or misleading UTV, remote, Decoder, DVD, and physical cable controls.
- Repaired click-to-connect behavior for loose physical cable plugs.
- Repaired Decoder recovery metadata so restored firmware version, build, and date remain consistent.
- Repaired radio presentation, HDMI audio faults, DVD unavailable-control states, tuning transitions, and live diagnostics.

## [3.2.5]

### Added

- FM radio simulation, RS Controller features, wired audio, and related Controller Lab controls.

## [3.2.0]

### Added

- Extended physical disassembly, damage, touch-input, hardware, laptop, and full-reset simulations.

## [2.0.0]

### Added

- Expanded Antoid OS architecture, persistent state, connectivity, carrier, battery, hardware, and application simulations.

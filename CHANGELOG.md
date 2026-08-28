# Changelog

All notable public changes to Antoid Lab are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses semantic version numbers.

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

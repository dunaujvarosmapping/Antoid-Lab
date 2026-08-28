import React from "react";
import { useOS } from "../state/OSContext.jsx";
import {
  PhoneApp,
  MessagesApp,
  MessengerApp,
  ContactsApp,
} from "./CommunicationApps.jsx";
import { CameraApp, GalleryApp, BrowserApp } from "./MediaApps.jsx";
import { SettingsApp } from "./SettingsApp.jsx";
import {
  ClockApp,
  NotesApp,
  WeatherApp,
  CalendarApp,
  FilesApp,
} from "./UtilityApps.jsx";
import { CalculatorV2 } from "./CalculatorV2.jsx";
import { StoreApp } from "./StoreApp.jsx";
import { SpeedtestApp } from "./SpeedtestApp.jsx";
import {
  YouTubeApp,
  FacebookApp,
  GmailApp,
  SpotifyApp,
  InstagramApp,
} from "./DownloadableApps.jsx";
import { MobileDataDebugApp } from "./MobileDataDebugApp.jsx";
import { MaintenanceApp, StreetLightApp } from "./HardwareApps.jsx";
import { FMRadioApp } from "./FMRadioApp.jsx";

const routes = {
  phone: PhoneApp,
  messages: MessagesApp,
  messenger: MessengerApp,
  contacts: ContactsApp,
  camera: CameraApp,
  gallery: GalleryApp,
  browser: BrowserApp,
  settings: SettingsApp,
  clock: ClockApp,
  calculator: CalculatorV2,
  notes: NotesApp,
  weather: WeatherApp,
  calendar: CalendarApp,
  files: FilesApp,
  store: StoreApp,
  speedtest: SpeedtestApp,
  "fm-radio": FMRadioApp,
  youtube: YouTubeApp,
  facebook: FacebookApp,
  gmail: GmailApp,
  spotify: SpotifyApp,
  instagram: InstagramApp,
  "mobile-debug": MobileDataDebugApp,
  maintenance: MaintenanceApp,
  streetlight: StreetLightApp,
};
export function AppRouter() {
  const { state } = useOS();
  const C = routes[state.screen.app];
  return (
    <section className={`app-window app-${state.screen.app}`}>
      {C ? <C /> : <div>App unavailable</div>}
    </section>
  );
}

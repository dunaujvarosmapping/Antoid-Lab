const clamp = (value, min, max) =>
  Math.max(min, Math.min(max, Number(value) || 0));

export const DESIGN_CAPACITY_MAH = 4800;

export function cycleHealthCeiling(cycles) {
  const count = Math.max(0, Number(cycles) || 0);
  const normalWear = Math.min(750, Math.max(0, count - 50)) * 0.018;
  const oldAgeWear = Math.max(0, count - 800) * 0.026;
  return clamp(100 - normalWear - oldAgeWear, 20, 100);
}

export function temperatureCapacityFactor(temperature) {
  const value = Number(temperature) || 0;
  if (value < 0) return 0.55;
  if (value < 10) return 0.72 + value * 0.023;
  if (value <= 40) return 1;
  if (value <= 45) return 1 - (value - 40) * 0.012;
  if (value <= 52) return 0.94 - (value - 45) * 0.025;
  return Math.max(0.52, 0.765 - (value - 52) * 0.04);
}

export function thermalProfile(temperature) {
  const value = Number(temperature) || 0;
  if (value >= 58)
    return { state: "Critical", severity: 4, chargeFactor: 0, performanceLimit: 35, drainMultiplier: 1.5, chargingPaused: true, protectiveShutdown: true };
  if (value >= 52)
    return { state: "Very Hot", severity: 3, chargeFactor: 0, performanceLimit: 52, drainMultiplier: 1.34, chargingPaused: true, protectiveShutdown: false };
  if (value >= 46)
    return { state: "Hot", severity: 2, chargeFactor: 0.38, performanceLimit: 72, drainMultiplier: 1.2, chargingPaused: false, protectiveShutdown: false };
  if (value >= 42)
    return { state: "Warm", severity: 1, chargeFactor: 0.7, performanceLimit: 88, drainMultiplier: 1.08, chargingPaused: false, protectiveShutdown: false };
  if (value <= 0)
    return { state: "Very Cold", severity: 2, chargeFactor: 0, performanceLimit: 58, drainMultiplier: 1.45, chargingPaused: true, protectiveShutdown: false };
  if (value < 10)
    return { state: "Cold", severity: 1, chargeFactor: 0.45, performanceLimit: 82, drainMultiplier: 1.2, chargingPaused: false, protectiveShutdown: false };
  return { state: "Normal", severity: 0, chargeFactor: 1, performanceLimit: 100, drainMultiplier: 1, chargingPaused: false, protectiveShutdown: false };
}

export function batteryModel(state, options = {}) {
  const battery = state.battery || {};
  const hardware = state.hardware?.components?.battery || {};
  const cycles = Math.max(0, Number(battery.cycles) || 0) + clamp(battery.cycleProgress, 0, 0.999999);
  const health = clamp(
    Math.min(Number(battery.health) || 100, cycleHealthCeiling(cycles)),
    20,
    100,
  );
  const designCapacityMah = Math.max(250, Number(hardware.capacityMah) || DESIGN_CAPACITY_MAH);
  const hardwareCondition = clamp(hardware.condition ?? 100, 0, 100);
  const hardwareFactor =
    hardwareCondition >= 40
      ? 1
      : 0.55 + (hardwareCondition / 40) * 0.45;
  const effectiveCapacityMah = designCapacityMah * (health / 100) * hardwareFactor;
  const temperature = Number(options.temperature ?? battery.temperature ?? 25);
  const thermal = thermalProfile(temperature);
  const temperatureFactor = temperatureCapacityFactor(temperature);
  const usableCapacityMah = effectiveCapacityMah * temperatureFactor;
  const capacityRatio = usableCapacityMah / DESIGN_CAPACITY_MAH;
  const level = clamp(battery.level, 0, 100);
  const saverFactor = battery.extremeSaver ? 2.55 : battery.saver ? 1.5 : 1;
  const loadMultiplier = Math.max(0.1, Number(options.loadMultiplier) || 1);
  const estimatedRuntimeMinutes =
    (level * 180 * capacityRatio * saverFactor) /
    (60 * loadMultiplier * thermal.drainMultiplier);
  const instabilityThreshold =
    health < 45 && options.demanding
      ? clamp(Math.ceil((45 - health) / 5), 1, 6)
      : 0;
  return {
    designCapacityMah,
    health,
    cycles,
    cycleHealthCeiling: cycleHealthCeiling(cycles),
    effectiveCapacityMah,
    usableCapacityMah,
    storedChargeMah: usableCapacityMah * level / 100,
    capacityRatio: Math.max(0.08, capacityRatio),
    temperature,
    temperatureFactor,
    thermal,
    estimatedRuntimeMinutes,
    instabilityThreshold,
  };
}

export function formatRuntime(minutes) {
  if (!Number.isFinite(minutes) || minutes <= 0) return "Less than a minute";
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) return `About ${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return `About ${hours} h${mins ? ` ${mins} min` : ""}`;
}

export function agingPerEquivalentCycle(temperature) {
  const hotMultiplier = temperature >= 55 ? 4 : temperature >= 48 ? 2.5 : temperature >= 43 ? 1.5 : 1;
  return 0.018 * hotMultiplier;
}

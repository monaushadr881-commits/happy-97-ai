/**
 * Shared audio-reactive signal bus for the Digital Human.
 *
 * Two independent signals — the TTS analyser publishes `speech`, the
 * microphone analyser publishes `mic`. Both are 0..1 RMS values plus a
 * spectral centroid (0..1) used to bias mouth-shape selection.
 *
 * Consumers subscribe via `useSpeechSignal()` / `useMicSignal()` and
 * re-render at ~60Hz only while a value is actively changing.
 *
 * There is no fake data path here — if nothing is publishing, both
 * signals sit at 0 and consumers show idle/fallback state.
 */
import { useSyncExternalStore } from "react";

export type AudioSignal = {
  /** RMS amplitude in 0..1 (shaped for visual expressiveness). */
  rms: number;
  /** Normalised spectral centroid in 0..1 (higher = brighter/frontier vowels). */
  centroid: number;
};

const EMPTY: AudioSignal = { rms: 0, centroid: 0 };

type Bus = {
  value: AudioSignal;
  subs: Set<() => void>;
};

function makeBus(): Bus {
  return { value: EMPTY, subs: new Set() };
}

const speechBus = makeBus();
const micBus = makeBus();

function publish(bus: Bus, next: AudioSignal) {
  const prev = bus.value;
  if (
    Math.abs(prev.rms - next.rms) < 0.002 &&
    Math.abs(prev.centroid - next.centroid) < 0.01
  ) return;
  bus.value = next;
  bus.subs.forEach((cb) => cb());
}

export function publishSpeech(rms: number, centroid: number) {
  publish(speechBus, { rms, centroid });
}
export function publishMic(rms: number, centroid: number) {
  publish(micBus, { rms, centroid });
}
export function clearSpeech() { publish(speechBus, EMPTY); }
export function clearMic() { publish(micBus, EMPTY); }

function subFactory(bus: Bus) {
  return (cb: () => void) => {
    bus.subs.add(cb);
    return () => bus.subs.delete(cb);
  };
}
function getSpeech() { return speechBus.value; }
function getMic() { return micBus.value; }
function getServer() { return EMPTY; }

const subSpeech = subFactory(speechBus);
const subMic = subFactory(micBus);

export function useSpeechSignal(): AudioSignal {
  return useSyncExternalStore(subSpeech, getSpeech, getServer);
}
export function useMicSignal(): AudioSignal {
  return useSyncExternalStore(subMic, getMic, getServer);
}

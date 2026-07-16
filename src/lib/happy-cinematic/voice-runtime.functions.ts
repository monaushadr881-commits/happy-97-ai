import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";

/**
 * Voice runtime metadata endpoint.
 * Actual STT/TTS uses the existing browser SpeechRecognition + platform TTS,
 * plus the existing Digital Human voice pipeline. This function only reports
 * capability + configuration so the client can adapt the UI.
 */
export const getVoiceCapabilities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireCinematicUser(context as any);
    return {
      pushToTalk: true,
      continuous: true,
      interruptSupport: true,
      voiceDetection: true,
      noiseReduction: "browser-native",
      echoCancellation: "browser-native",
      wakeWords: ["Hi HAPPY", "Hello HAPPY", "HAPPY"],
      hotkeys: ["Meta+Shift+H", "Ctrl+Shift+H"],
    };
  });

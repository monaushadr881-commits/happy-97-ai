import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requireCinematicUser } from "./gate";
import { detectEmotion, emotionToPose } from "./emotion";

export const resolveEmotion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { text: string }) => d)
  .handler(async ({ data, context }) => {
    await requireCinematicUser(context as any);
    const emotion = detectEmotion(data.text);
    return { emotion, pose: emotionToPose(emotion) };
  });

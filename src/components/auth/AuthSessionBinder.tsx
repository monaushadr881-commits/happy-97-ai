/**
 * R114.2 — Auth session binder.
 * Runs at root: on every SIGNED_IN, records device + session + login history
 * via the canonical happy-id server fns. Zero UI. Zero duplicate runtime.
 */
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import {
  registerDevice, registerSession, recordLoginEvent, remoteLogoutAllOthers,
  getEffectiveSessionPolicy,
} from "@/lib/happy-id.functions";
import { detectDeviceInfo, getSessionKey } from "@/lib/happy-id/device";

export function AuthSessionBinder() {
  const regDevice = useServerFn(registerDevice);
  const regSession = useServerFn(registerSession);
  const logEvent = useServerFn(recordLoginEvent);
  const logoutOthers = useServerFn(remoteLogoutAllOthers);
  const getPolicy = useServerFn(getEffectiveSessionPolicy);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        try {
          const info = detectDeviceInfo();
          const dev = await regDevice({ data: info });
          const key = getSessionKey(session.access_token);
          await regSession({ data: {
            session_key: key,
            device_id: dev?.id,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : undefined,
          }});
          await logEvent({ data: {
            event_type: "signin",
            provider: (session.user.app_metadata?.provider as string) ?? "email",
            device_id: dev?.id,
            user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 400) : undefined,
            success: true,
          }});
          const policy = await getPolicy();
          if ((policy?.max_active_sessions ?? 1) <= 1) {
            await logoutOthers({ data: { keep_session_key: key } });
          }
        } catch (e) {
          console.warn("[AuthSessionBinder] register failed", e);
        }
      }
      if (event === "SIGNED_OUT") {
        try { await logEvent({ data: { event_type: "signout", success: true } }); } catch { /* ignore */ }
      }
    });
    return () => { sub.subscription.unsubscribe(); };
  }, [regDevice, regSession, logEvent, logoutOthers, getPolicy]);

  return null;
}

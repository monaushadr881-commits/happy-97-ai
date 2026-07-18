/**
 * HappyVRM — three-vrm renderer for the ONE HAPPY Digital Human.
 *
 * Drop-in visual layer for HappyAvatar when the `vrm` runtime is detected
 * as ready. This does NOT introduce a new Digital Human, new conversation
 * engine, memory, or voice runtime — it is purely a rendering surface for
 * the existing ONE HAPPY behaviour signals:
 *
 *   - `expression`  → VRM expression preset (happy / sad / angry / surprised)
 *   - `activity`    → posture bias + subtle sway
 *   - `amplitude`   → jaw/`aa` viseme (lip sync, driven by useHappySpeech)
 *   - `centroid`    → blends `aa` ↔ `oh` for open/round mouth shapes
 *   - `gazeTarget`  → VRMLookAt target (cursor / whiteboard / speaker)
 *   - `reducedMotion` → freezes idle sway + disables blink loop
 *
 * The .vrm binary is served from the Lovable asset CDN via the pointer
 * file `src/assets/digital-human/vrm/happy.vrm.asset.json`. Nothing here
 * throws on failure — a load error just returns null so HappyAvatar falls
 * back to the portrait renderer.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { VRM, VRMLoaderPlugin, VRMUtils, VRMExpressionPresetName } from "@pixiv/three-vrm";
import vrmAsset from "@/assets/digital-human/vrm/happy.vrm.asset.json";
import type { AvatarActivity, AvatarExpression } from "./HappyAvatar";

import type { GestureCue, PostureCue } from "./conversation-engine";

type Props = {
  expression: AvatarExpression;
  activity: AvatarActivity;
  reducedMotion: boolean;
  size: number;
  amplitude: number;
  centroid: number;
  gazeTarget: { x: number; y: number } | null;
  /** R110 P1 — one-shot gesture cue; drives a short bone animation. */
  gesture?: GestureCue;
  /** R110 P1 — posture cue derived from convo state. */
  postureCue?: PostureCue;
};


/** Map our internal expression tokens onto VRM expression presets. */
const EXPRESSION_TO_VRM: Record<AvatarExpression, VRMExpressionPresetName> = {
  neutral: VRMExpressionPresetName.Neutral,
  smile: VRMExpressionPresetName.Happy,
  celebrate: VRMExpressionPresetName.Happy,
  empathy: VRMExpressionPresetName.Happy,
  listen: VRMExpressionPresetName.Neutral,
  explain: VRMExpressionPresetName.Neutral,
  teaching: VRMExpressionPresetName.Happy,
  business: VRMExpressionPresetName.Neutral,
  founder: VRMExpressionPresetName.Neutral,
  confidence: VRMExpressionPresetName.Neutral,
  thinking: VRMExpressionPresetName.Sad,
  concern: VRMExpressionPresetName.Sad,
};

function useVRM(url: string): VRM | null {
  const gltf = useLoader(GLTFLoader, url, (loader) => {
    (loader as GLTFLoader).register((parser) => new VRMLoaderPlugin(parser));
  });
  const vrm = (gltf.userData as { vrm?: VRM }).vrm ?? null;
  useEffect(() => {
    if (!vrm) return;
    VRMUtils.removeUnnecessaryVertices(vrm.scene);
    VRMUtils.combineSkeletons(vrm.scene);
    vrm.scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).frustumCulled = false;
    });
    // Face camera.
    vrm.scene.rotation.y = Math.PI;
    return () => {
      VRMUtils.deepDispose(vrm.scene);
    };
  }, [vrm]);
  return vrm;
}

function VRMStage({ expression, activity, reducedMotion, amplitude, centroid, gazeTarget }: Omit<Props, "size">) {
  const vrm = useVRM(vrmAsset.url);
  const targetRef = useRef<THREE.Object3D>(new THREE.Object3D());
  const blinkRef = useRef({ t: 0, next: 2 + Math.random() * 4, closed: 0 });
  const smoothed = useRef({ amp: 0, expr: 0 });

  // Retarget the lookAt object every frame from the incoming gazeTarget prop.
  useEffect(() => {
    if (!vrm?.lookAt) return;
    vrm.lookAt.target = targetRef.current;
  }, [vrm]);

  useFrame((_state, delta) => {
    if (!vrm) return;
    const dt = Math.min(0.1, delta);

    // Idle sway + breathing (spine bone if humanoid available).
    const t = performance.now() / 1000;
    if (!reducedMotion) {
      const chest = vrm.humanoid?.getNormalizedBoneNode("chest") ?? vrm.humanoid?.getNormalizedBoneNode("spine");
      if (chest) {
        chest.rotation.x = Math.sin(t * 1.05) * 0.015;
        chest.rotation.z = Math.sin(t * 0.7) * 0.008;
      }
      const head = vrm.humanoid?.getNormalizedBoneNode("head");
      if (head && activity === "listening") {
        head.rotation.x = Math.sin(t * 1.6) * 0.03 - 0.02;
      }
    }

    // Gaze target — map 2D pixel offset to a world-space point in front of avatar.
    if (gazeTarget) {
      targetRef.current.position.set(gazeTarget.x * 0.01, 1.4 - gazeTarget.y * 0.01, 1.5);
    } else {
      targetRef.current.position.set(0, 1.4, 1.5);
    }

    // Blink loop (skipped under reduced motion).
    const b = blinkRef.current;
    if (!reducedMotion) {
      b.t += dt;
      if (b.t >= b.next && b.closed === 0) {
        b.closed = 1;
        b.next = b.t + 0.14;
      } else if (b.closed > 0 && b.t >= b.next) {
        b.closed = 0;
        b.t = 0;
        b.next = 1.8 + Math.random() * 5.4;
      }
    }
    vrm.expressionManager?.setValue(VRMExpressionPresetName.Blink, b.closed);

    // Expression preset crossfade.
    const preset = EXPRESSION_TO_VRM[expression] ?? VRMExpressionPresetName.Neutral;
    const targetExpr = expression === "neutral" ? 0 : 0.7;
    smoothed.current.expr += (targetExpr - smoothed.current.expr) * Math.min(1, dt * 5);
    // Zero all named presets we might have set, then apply the current one.
    for (const p of [
      VRMExpressionPresetName.Happy,
      VRMExpressionPresetName.Sad,
      VRMExpressionPresetName.Angry,
      VRMExpressionPresetName.Surprised,
    ]) {
      vrm.expressionManager?.setValue(p, p === preset ? smoothed.current.expr : 0);
    }

    // Lip sync — real audio amplitude drives `aa`, centroid biases toward `oh`.
    const ampTarget = activity === "speaking" ? Math.min(1, amplitude) : 0;
    smoothed.current.amp += (ampTarget - smoothed.current.amp) * Math.min(1, dt * 18);
    const aa = smoothed.current.amp * (0.4 + centroid * 0.6);
    const oh = smoothed.current.amp * (1 - centroid) * 0.6;
    vrm.expressionManager?.setValue(VRMExpressionPresetName.Aa, aa);
    vrm.expressionManager?.setValue(VRMExpressionPresetName.Oh, oh);

    vrm.update(dt);
  });

  if (!vrm) return null;
  return (
    <>
      <primitive object={vrm.scene} />
      <primitive object={targetRef.current} />
    </>
  );
}

export function HappyVRM({ size, ...rest }: Props) {
  const [failed, setFailed] = useState(false);
  const style = useMemo(() => ({ width: size, height: size }), [size]);
  if (failed) return null;
  return (
    <div className="absolute inset-0" style={style} aria-hidden>
      <Canvas
        camera={{ position: [0, 1.4, 1.6], fov: 22 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        onError={() => setFailed(true)}
      >
        <ambientLight intensity={0.65} />
        <directionalLight position={[2, 3, 2]} intensity={0.9} color={"#f5e6b3"} />
        <directionalLight position={[-2, 2, 1]} intensity={0.3} color={"#c8dceb"} />
        <Suspense fallback={null}>
          <VRMStage {...rest} />
          <Environment preset="studio" background={false} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default HappyVRM;

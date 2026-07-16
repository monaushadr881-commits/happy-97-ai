/** R73 — production quality gate: pure booleans. */
export interface QualityFlags {
  animationsReduced: boolean;
  battery: boolean;
  slowNetwork: boolean;
  smallViewport: boolean;
}

export function shouldSimplify(f: QualityFlags): { camera: boolean; smoke: boolean; particles: boolean; reflection: boolean } {
  const stripAll = f.battery || f.slowNetwork;
  return {
    camera:     !f.animationsReduced && !stripAll,
    smoke:      !f.animationsReduced && !stripAll,
    particles:  !stripAll,
    reflection: !stripAll && !f.smallViewport,
  };
}

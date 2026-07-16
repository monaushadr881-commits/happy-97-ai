import type { Emotion } from "./contracts";

const KEYWORDS: Array<[Emotion, RegExp]> = [
  ["celebrating", /\b(great|awesome|shipped|deployed|success|launched|nice work)\b/i],
  ["concerned", /\b(error|failed|broken|down|bug|urgent|critical)\b/i],
  ["thinking", /\b(analy[sz]e|plan|research|investigate|figure out)\b/i],
  ["focused", /\b(build|generate|refactor|migrate|write)\b/i],
  ["supportive", /\b(help|stuck|confused|not sure|guide me)\b/i],
  ["motivational", /\b(let's go|ship it|next|onward|keep going)\b/i],
  ["calm", /\b(pause|later|break|slow down)\b/i],
  ["professional", /\b(report|summary|status|kpi|revenue|invoice)\b/i],
  ["happy", /\b(hi|hello|hey|good (morning|evening|afternoon))\b/i],
];

export function detectEmotion(text: string): Emotion {
  for (const [emo, re] of KEYWORDS) if (re.test(text)) return emo;
  return "neutral";
}

export function emotionToPose(emotion: Emotion) {
  switch (emotion) {
    case "celebrating": return { smile: 0.9, brow: 0.2, tilt: 0.05 };
    case "concerned":   return { smile: 0.1, brow: -0.4, tilt: -0.05 };
    case "thinking":    return { smile: 0.2, brow: -0.1, tilt: 0.1 };
    case "focused":     return { smile: 0.15, brow: -0.15, tilt: 0 };
    case "supportive":  return { smile: 0.6, brow: 0.1, tilt: 0.05 };
    case "motivational":return { smile: 0.7, brow: 0.15, tilt: 0.02 };
    case "calm":        return { smile: 0.4, brow: 0, tilt: 0 };
    case "professional":return { smile: 0.25, brow: 0, tilt: 0 };
    case "happy":       return { smile: 0.8, brow: 0.1, tilt: 0 };
    default:            return { smile: 0.35, brow: 0, tilt: 0 };
  }
}

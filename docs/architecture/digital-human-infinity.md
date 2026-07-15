# HAPPY Digital Human Infinity

Runtime layered ABOVE the existing `HappyAvatar` portrait. The portrait is
never replaced; overlays and drivers add life on top.

## Layers
1. Portrait (existing `HappyAvatar` component — unchanged).
2. Body: breathing, weight shift, shoulders, neck, chest, balance, idle
   relaxation.
3. Face: smile variants, professional/business/teaching/thinking/research
   faces, concern, celebrate, empathy, confidence.
4. Eyes: random/double/triple blink, cursor / whiteboard / presentation
   tracking, moisture, saccades, conversation focus.
5. Voice: real / word / sentence / phoneme lip sync, waveform sync,
   caption sync, breathing sync.
6. Hands: wave, point, explain, welcome, open palm, approval, thank you,
   presentation, teaching, future-ready.

## Live states
idle · greeting · listening · thinking · speaking · teaching ·
presentation · whiteboard · research · founder · celebration · concern ·
paused · interrupted · waiting.

## Drivers
- `useHappySpeech` exposes activity + expression + posture.
- `conversation-engine` publishes state transitions.
- Audio-reactive lip sync is driven by an `AnalyserNode` RMS signal, mapped
  to mouth glow / mouth-open intensity.

All additions are overlays; the portrait, base animation loop, and props
contract remain frozen.

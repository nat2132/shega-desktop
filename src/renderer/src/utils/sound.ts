let enabled = true

const SOUNDS = {
  nice: new Audio('sounds/nice.mp3'),
  bad: new Audio('sounds/bad.mp3'),
  reminder: new Audio('sounds/reminder.mp3'),
  start: new Audio('sounds/start.mp3'),
}

export async function initSound() {
  try {
    const prefs: any[] = await window.api?.getNotificationPreferences?.() ?? [];
    if (prefs.length > 0) {
      enabled = prefs.some(p => p.sound === 1);
    }
  } catch (_) {
    enabled = true
  }
}

export function setSoundEnabled(v: boolean) {
  enabled = v
}

export function playSound(type: 'nice' | 'bad' | 'reminder' | 'start') {
  if (!enabled) return
  try {
    const audio = SOUNDS[type]
    audio.currentTime = 0
    audio.play().catch(() => {})
  } catch (_) {}
}

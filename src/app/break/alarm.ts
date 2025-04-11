// This is a utility script to demonstrate how the alarm sound was created.
// The actual MP3 file should be placed in the public directory.

export function createAlarmSound() {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Set up the sound parameters
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
  
  // Create the beeping pattern
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  
  // Three beeps
  for (let i = 0; i < 3; i++) {
    // Beep on
    gainNode.gain.setValueAtTime(0.7, now + i * 0.4);
    // Beep off
    gainNode.gain.setValueAtTime(0, now + i * 0.4 + 0.2);
  }

  oscillator.start(now);
  oscillator.stop(now + 1.2);
} 
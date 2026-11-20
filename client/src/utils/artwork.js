// Beautiful Spotify-style gradient artwork generator for songs and albums without cover images

const GRADIENTS = [
  'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
  'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)',
  'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)',
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
  'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
  'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
  'linear-gradient(135deg, #654ea3 0%, #eaafc8 100%)',
  'linear-gradient(135deg, #200122 0%, #6f0000 100%)',
  'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
];

export function getArtworkBackground(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

export function formatDuration(seconds) {
  if (isNaN(seconds) || seconds === null || seconds === undefined || seconds < 0) {
    return '0:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

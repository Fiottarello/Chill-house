export const getTier = (staysCount) => {
  if (staysCount >= 5) return { name: 'Goat', color: '#8b5cf6', icon: '🐐', min: 5, next: null };
  if (staysCount === 4) return { name: 'Legend', color: '#ef4444', icon: '🔥', min: 4, next: 5 };
  if (staysCount === 3) return { name: 'Platinum', color: '#0ea5e9', icon: '💎', min: 3, next: 4 };
  if (staysCount === 2) return { name: 'Gold', color: '#eab308', icon: '⭐', min: 2, next: 3 };
  return { name: 'Novellino', color: '#94a3b8', icon: '🌱', min: 0, next: 2 };
};

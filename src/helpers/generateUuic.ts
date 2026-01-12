export function generateUuic() {
  return `K${Math.floor(Math.random() * 10000)}-R∞-${Date.now()}`;
}

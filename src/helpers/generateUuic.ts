export function generateUuic() {
  return `K${Math.floor(Math.random() * 10000)}-R∞-${Date.now()}`; // TODO: użyć gpt api do wygenerowania tego na podstawie corzona usera
}

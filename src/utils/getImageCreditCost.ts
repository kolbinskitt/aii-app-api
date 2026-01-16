// gpt-image-1 costs per image as of Jan 2026 (USD)
export default function getImageCreditCost(size: string): number {
  switch (size) {
    case '1024x1024':
      return 0.04; // $0.04 per image
    case '1024x1792':
    case '1792x1024':
      return 0.08; // $0.08 per image
    case 'auto':
      return 0.04; // assume default to 1024x1024
    default:
      return 0.04; // fallback to default size
  }
}

export default function getImageCreditCost(size: string): number {
  switch (size) {
    case '1024x1024':
      return 0.002; // ≈ 4x gpt-4-turbo
    case '1024x1536':
    case '1536x1024':
      return 0.003;
    case 'auto':
      return 0.002;
    default:
      return 0.002; // fallback
  }
}

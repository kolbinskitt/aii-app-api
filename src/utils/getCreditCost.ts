export default function getCreditCost(model: string): number {
  switch (model) {
    case 'gpt-4o':
      return 0.005; // $0.005 per 1K tokens (input + output)
    case 'gpt-3.5-turbo-1106':
      return 0.001; // $0.001 per 1K tokens (input + output)
    default:
      return 0.005; // fallback to more expensive one
  }
}

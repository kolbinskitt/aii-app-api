export default function getCreditCost(model: string): number {
  switch (model) {
    case 'gpt-4':
      return 0.001;
    case 'gpt-4-32k':
      return 0.002;
    case 'gpt-4-turbo':
      return 0.0005;
    case 'gpt-3.5-turbo':
      return 0.00015;
    case 'TheBloke/Mistral-7B-Instruct-v0.1-AWQ':
      return 0.00004;
    default:
      return 0.001; // fallback
  }
}

export const getTextStats = (text: string) => {
  const characters = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const sentences = text.trim()
    ? text.split(/[.!?]+/).filter(s => s.trim()).length
    : 0;
  return { characters, words, sentences };
};

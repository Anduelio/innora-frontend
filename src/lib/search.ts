/** Heq theksat dhe shkronjat e mëdha: "Klientët" gjendet me "klientet", "Çmimi" me "cmimi". */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ç/gi, 'c')
    .replace(/ë/gi, 'e')
    .toLowerCase()
}

/** Çdo fjalë e kërkimit duhet të gjendet diku në tekst (në çfarëdo radhe). */
export function matchesText(haystack: string, query: string): boolean {
  const words = fold(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const text = fold(haystack)
  return words.every((word) => text.includes(word))
}

/** Sa mirë përputhet titulli: 0 fillon me kërkimin, 1 përmban fjalën në fillim të fjalës, 2 vetëm diku. */
export function titleRank(title: string, query: string): number {
  const text = fold(title)
  const needle = fold(query).trim()
  if (text.startsWith(needle)) return 0
  if (text.includes(` ${needle}`)) return 1
  return 2
}

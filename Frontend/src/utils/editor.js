export function stripHtml(html) {
  if (!html) return ""
  const doc = new DOMParser().parseFromString(html, "text/html")
  return doc.body.textContent || ""
}

export function textToHtml(text) {
  const paragraphs = text.split("\n").filter(Boolean)
  return paragraphs.map((p) => `<p>${p}</p>`).join("")
}

export function randomTime() {
  const h = String(Math.floor(Math.random() * 24)).padStart(2, "0")
  const m = String(Math.floor(Math.random() * 60)).padStart(2, "0")
  return `${h}:${m}`
}

export function randomDateNear(base) {
  if (!base) return base
  const d = new Date(base + "T00:00:00")
  d.setDate(d.getDate() + Math.floor(Math.random() * 5) - 2)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function getUniqueTitle(baseTitle, existingJournals, excludeId = null) {
  if (!existingJournals) return baseTitle
  const existingTitles = new Set(
    existingJournals.filter((j) => j.id !== excludeId).map((j) => j.title)
  )
  if (!existingTitles.has(baseTitle)) return baseTitle
  let num = 2
  while (existingTitles.has(`${baseTitle} #${num}`)) num++
  return `${baseTitle} #${num}`
}

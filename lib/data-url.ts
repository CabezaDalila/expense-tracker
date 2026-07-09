// Convierte un data URL (base64) en un blob URL para visualizarlo.
// Chrome ignora los data: URLs de más de ~2 MB en iframes/navegaciones,
// así que los comprobantes grandes quedaban en blanco. Los blob: URLs
// no tienen ese límite.
export function dataUrlToObjectUrl(dataUrl: string): string {
  const comma = dataUrl.indexOf(",")
  const head = dataUrl.slice(0, comma)
  const base64 = dataUrl.slice(comma + 1)
  const mime = head.match(/^data:([^;]+)/)?.[1] || "application/octet-stream"
  const bytes = atob(base64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return URL.createObjectURL(new Blob([arr], { type: mime }))
}

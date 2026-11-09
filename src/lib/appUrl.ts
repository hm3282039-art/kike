export const IS_STATIC_BUILD = import.meta.env.VITE_STATIC_BUILD === 'true'

export function appRoute(page: 'pets' | 'dice' | 'poker') {
  if (!IS_STATIC_BUILD) return `/${page}`
  // HTMLPreview injects a <base> pointing at raw.githubusercontent.com.
  // A full same-preview URL prevents hash links from opening the raw source file.
  const previewUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
  return `${previewUrl}#${page}`
}

export function assetUrl(path: string) {
  const clean = path.replace(/^\/+/, '')
  return IS_STATIC_BUILD ? `./${clean}` : `/${clean}`
}

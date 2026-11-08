export const IS_STATIC_BUILD = import.meta.env.VITE_STATIC_BUILD === 'true'

export function appRoute(page: 'pets' | 'dice') {
  return IS_STATIC_BUILD ? `#${page}` : `/${page}`
}

export function assetUrl(path: string) {
  const clean = path.replace(/^\/+/, '')
  return IS_STATIC_BUILD ? `./${clean}` : `/${clean}`
}

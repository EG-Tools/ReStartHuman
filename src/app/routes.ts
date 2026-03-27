export const appRoutes = {
  start: 'start',
  question: 'question',
  ad: 'ad',
  result: 'result',
} as const

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes]

export const appRoutes = {
  start: 'start',
  question: 'question',
  result: 'result',
} as const

export type AppRoute = (typeof appRoutes)[keyof typeof appRoutes]

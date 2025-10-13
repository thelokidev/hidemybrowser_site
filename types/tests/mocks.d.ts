declare module '@/lib/supabase/admin' {
  export const createAdminClient: any
  // test-only helper supplied via vi.mock factory in tests
  export const __setClient: (client: any) => void
}

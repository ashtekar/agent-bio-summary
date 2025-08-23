// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = 'AIzaSyDv2F2U20LlMxNs4Y94NhDtxfraTU7DD0o'
process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = 'a455f7dec024043f9'

// Increase timeout for network requests
jest.setTimeout(30000)

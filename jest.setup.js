// Mock environment variables for testing
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'
process.env.GOOGLE_CUSTOM_SEARCH_API_KEY = 'test-google-api-key'
process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID = 'test-search-engine-id'

// Increase timeout for network requests
jest.setTimeout(30000)

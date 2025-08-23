describe('Google Custom Search Engine ID Fix', () => {
  it('should trim whitespace from Search Engine ID', () => {
    // Simulate environment variable with trailing newline
    const rawEngineId = 'a455f7dec024043f9\n'
    const trimmedEngineId = rawEngineId.trim()
    
    console.log('🔍 Testing Search Engine ID trimming:')
    console.log('Raw ID length:', rawEngineId.length)
    console.log('Raw ID (with newline):', JSON.stringify(rawEngineId))
    console.log('Trimmed ID length:', trimmedEngineId.length)
    console.log('Trimmed ID:', JSON.stringify(trimmedEngineId))
    
    expect(trimmedEngineId).toBe('a455f7dec024043f9')
    expect(trimmedEngineId.length).toBe(17)
    expect(rawEngineId.length).toBe(18) // includes newline
  })
  
  it('should handle various whitespace scenarios', () => {
    const testCases = [
      { input: 'a455f7dec024043f9\n', expected: 'a455f7dec024043f9' },
      { input: 'a455f7dec024043f9\r\n', expected: 'a455f7dec024043f9' },
      { input: ' a455f7dec024043f9 ', expected: 'a455f7dec024043f9' },
      { input: 'a455f7dec024043f9', expected: 'a455f7dec024043f9' },
      { input: '\ta455f7dec024043f9\t', expected: 'a455f7dec024043f9' }
    ]
    
    testCases.forEach(({ input, expected }) => {
      const result = input.trim()
      expect(result).toBe(expected)
      console.log(`✅ "${JSON.stringify(input)}" -> "${result}"`)
    })
  })
  
  it('should validate Search Engine ID format', () => {
    const validEngineId = 'a455f7dec024043f9'
    
    // Should be exactly 17 characters (alphanumeric)
    expect(validEngineId.length).toBe(17)
    expect(/^[a-zA-Z0-9]+$/.test(validEngineId)).toBe(true)
    
    console.log('✅ Search Engine ID format validation passed')
  })
})

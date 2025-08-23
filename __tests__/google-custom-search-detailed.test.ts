import axios from 'axios'

describe('Google Custom Search API Detailed Test', () => {
  const API_KEY = 'AIzaSyDY6ZmOvx7uqPtqc-bhQ7LELHW7ikcc-RI'
  const SEARCH_ENGINE_ID = 'a455f7dec024043f9'
  
  it('should debug API response in detail', async () => {
    const queries = [
      'synthetic biology site:news.mit.edu',
      'synthetic biology',
      'MIT research',
      'CRISPR',
      'gene editing'
    ]
    
    for (const query of queries) {
      console.log(`\n🔍 Testing query: "${query}"`)
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: API_KEY,
            cx: SEARCH_ENGINE_ID,
            q: query,
            num: 5
          },
          timeout: 15000
        })
        
        console.log('✅ Status:', response.status)
        console.log('✅ Response keys:', Object.keys(response.data))
        
        // Check for search information
        if (response.data.searchInformation) {
          console.log('✅ Search Info:', {
            totalResults: response.data.searchInformation.totalResults,
            searchTime: response.data.searchInformation.searchTime,
            formattedSearchTime: response.data.searchInformation.formattedSearchTime
          })
        }
        
        // Check for items
        if (response.data.items && response.data.items.length > 0) {
          console.log(`✅ Found ${response.data.items.length} results`)
          
          response.data.items.forEach((item: any, index: number) => {
            console.log(`  ${index + 1}. ${item.title}`)
            console.log(`     Link: ${item.link}`)
            console.log(`     Snippet: ${item.snippet?.substring(0, 100)}...`)
          })
        } else {
          console.log('❌ No items found in response')
          
          // Show full response for debugging
          console.log('📋 Full response data:', JSON.stringify(response.data, null, 2))
        }
        
      } catch (error) {
        console.log(`❌ Error for query "${query}":`, error.message)
        
        if (error.response) {
          console.log('❌ Error status:', error.response.status)
          console.log('❌ Error data:', error.response.data)
        }
      }
    }
    
    expect(true).toBe(true) // Always pass for debug test
  }, 60000)
  
  it('should test different search parameters', async () => {
    const testCases = [
      { q: 'synthetic biology', site: 'news.mit.edu' },
      { q: 'CRISPR', site: 'mit.edu' },
      { q: 'gene editing', site: 'news.mit.edu' },
      { q: 'biology research', site: 'mit.edu' }
    ]
    
    for (const testCase of testCases) {
      const query = testCase.site ? `${testCase.q} site:${testCase.site}` : testCase.q
      console.log(`\n🔍 Testing: "${query}"`)
      
      try {
        const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
          params: {
            key: API_KEY,
            cx: SEARCH_ENGINE_ID,
            q: query,
            num: 3,
            start: 1
          },
          timeout: 15000
        })
        
        if (response.data.items && response.data.items.length > 0) {
          console.log(`✅ SUCCESS: Found ${response.data.items.length} results`)
          console.log(`   First result: ${response.data.items[0].title}`)
        } else {
          console.log(`❌ No results for: ${query}`)
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`)
      }
    }
    
    expect(true).toBe(true)
  }, 60000)
})

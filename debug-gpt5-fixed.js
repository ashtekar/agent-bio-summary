require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testGPT5Fixed() {
  console.log('🔧 Testing GPT-5 with FIXED parameters')
  console.log('=====================================')
  
  // Test with the same prompt structure as our production code
  const testArticle = {
    title: 'New CRISPR Technology Shows Promise in Treating Genetic Disorders',
    source: 'Nature Biotechnology',
    url: 'https://example.com/article1',
    content: 'Scientists have developed a novel CRISPR-based gene editing technology that shows remarkable potential for treating genetic disorders. The new approach, called "precision CRISPR," allows for more accurate targeting of specific genes while minimizing off-target effects.'
  }
  
  const prompt = `You are an expert science educator writing for college sophomores.
  
  Create a concise summary of this synthetic biology article:
  
  Title: ${testArticle.title}
  Source: ${testArticle.source}
  URL: ${testArticle.url}
  Content: ${testArticle.content}
  
  Requirements:
  1. Use simple, clear language
  2. Explain complex terms when they appear
  3. Focus on the main findings and their importance
  4. Make it engaging and interesting
  5. Keep it concise (2-3 paragraphs)
  6. Content of your response will be used in an email newsletter

  Please provide a simplified explanation that maintains scientific accuracy while being accessible to a college sophomore.`

  const params = {
    model: 'gpt-5',
    messages: [
      {
        role: 'system',
        content: 'You are a science educator who specializes in making complex scientific concepts accessible to college students. Write clearly and engagingly. Respond with well-structured HTML suitable for direct use in an email. Do not use markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]
  }

  // FIXED: Don't set max_completion_tokens for GPT-5
  console.log('Using FIXED GPT-5 parameters (no max_completion_tokens)')
  console.log(`Request params:`, {
    model: params.model,
    messages_count: params.messages.length
  })

  try {
    const response = await openai.chat.completions.create(params)
    
    const content = response.choices[0]?.message?.content
    console.log(`✅ FIXED GPT-5 Response: "${content}"`)
    console.log(`Usage:`, response.usage)
    console.log(`Finish reason:`, response.choices[0]?.finish_reason)
    
    return { success: true, content }
  } catch (error) {
    console.log(`❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

async function testComparisonWithGPT4o() {
  console.log('\n🔍 Comparing with GPT-4o')
  console.log('========================')
  
  const testArticle = {
    title: 'New CRISPR Technology Shows Promise in Treating Genetic Disorders',
    source: 'Nature Biotechnology',
    url: 'https://example.com/article1',
    content: 'Scientists have developed a novel CRISPR-based gene editing technology that shows remarkable potential for treating genetic disorders. The new approach, called "precision CRISPR," allows for more accurate targeting of specific genes while minimizing off-target effects.'
  }
  
  const prompt = `You are an expert science educator writing for college sophomores.
  
  Create a concise summary of this synthetic biology article:
  
  Title: ${testArticle.title}
  Source: ${testArticle.source}
  URL: ${testArticle.url}
  Content: ${testArticle.content}
  
  Requirements:
  1. Use simple, clear language
  2. Explain complex terms when they appear
  3. Focus on the main findings and their importance
  4. Make it engaging and interesting
  5. Keep it concise (2-3 paragraphs)
  6. Content of your response will be used in an email newsletter

  Please provide a simplified explanation that maintains scientific accuracy while being accessible to a college sophomore.`

  const params = {
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a science educator who specializes in making complex scientific concepts accessible to college students. Write clearly and engagingly. Respond with well-structured HTML suitable for direct use in an email. Do not use markdown.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  }

  try {
    const response = await openai.chat.completions.create(params)
    
    const content = response.choices[0]?.message?.content
    console.log(`✅ GPT-4o Response: "${content}"`)
    console.log(`Usage:`, response.usage)
    
    return { success: true, content }
  } catch (error) {
    console.log(`❌ Error:`, error.message)
    return { success: false, error: error.message }
  }
}

async function runFixedTests() {
  const gpt5Result = await testGPT5Fixed()
  const gpt4oResult = await testComparisonWithGPT4o()
  
  console.log('\n📊 Comparison Summary')
  console.log('=====================')
  console.log(`GPT-5 (FIXED): ${gpt5Result.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`GPT-4o: ${gpt4oResult.success ? '✅ Success' : '❌ Failed'}`)
  
  if (gpt5Result.success && gpt4oResult.success) {
    console.log(`\nGPT-5 response length: ${gpt5Result.content.length}`)
    console.log(`GPT-4o response length: ${gpt4oResult.content.length}`)
  }
}

if (require.main === module) {
  runFixedTests().catch(console.error)
}

module.exports = { testGPT5Fixed, testComparisonWithGPT4o }

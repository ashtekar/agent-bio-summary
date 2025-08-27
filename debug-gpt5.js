const OpenAI = require('openai')

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Test article data (similar to what we use in the app)
const testArticle = {
  id: 'test-article-1',
  title: 'New CRISPR Technology Shows Promise in Treating Genetic Disorders',
  url: 'https://example.com/article1',
  source: 'Nature Biotechnology',
  publishedDate: '2024-01-15',
  content: `Scientists have developed a novel CRISPR-based gene editing technology that shows remarkable potential for treating genetic disorders. The new approach, called "precision CRISPR," allows for more accurate targeting of specific genes while minimizing off-target effects.

The research team, led by Dr. Sarah Chen at Stanford University, demonstrated that their technique achieved 95% accuracy in gene editing, compared to the 70-80% accuracy typically seen with traditional CRISPR methods. This improvement is particularly significant for therapeutic applications where precision is crucial.

The study involved testing the technology on human cells in vitro, where it successfully corrected mutations associated with sickle cell anemia and cystic fibrosis. The researchers also found that the new method reduced the risk of unintended genetic changes by approximately 60%.

"These results are very promising," said Dr. Chen. "We're now planning to move forward with animal studies to further validate the safety and efficacy of this approach."

The technology works by using a modified guide RNA that provides better specificity for target sequences. Additionally, the researchers incorporated a novel protein component that helps ensure the editing machinery only activates when it's properly bound to the correct target site.

This advancement could potentially accelerate the development of gene therapies for a wide range of genetic disorders, including muscular dystrophy, Huntington's disease, and certain types of cancer. However, the researchers caution that more studies are needed before this technology can be used in human clinical trials.

The findings were published in the latest issue of Nature Biotechnology and have already generated significant interest from pharmaceutical companies and research institutions worldwide.`,
  summary: 'New CRISPR technology with improved accuracy shows promise for treating genetic disorders.',
  relevanceScore: 0.95,
  keywords: ['CRISPR', 'gene editing', 'genetic disorders', 'precision medicine']
}

// Test function to compare different models
async function testModel(model, article, testName) {
  console.log(`\n=== Testing ${testName} (${model}) ===`)
  
  try {
    const prompt = `You are an expert science educator writing for college sophomores.
    
    Create a concise summary of this synthetic biology article:
    
    Title: ${article.title}
    Source: ${article.source}
    URL: ${article.url}
    Content: ${article.content}
    
    Requirements:
    1. Use simple, clear language
    2. Explain complex terms when they appear
    3. Focus on the main findings and their importance
    4. Make it engaging and interesting
    5. Keep it concise (2-3 paragraphs)
    6. Content of your response will be used in an email newsletter

    Please provide a simplified explanation that maintains scientific accuracy while being accessible to a college sophomore.`

    const params = {
      model: model,
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

    // Set model-specific parameters
    if (model.includes('gpt-5')) {
      params.max_completion_tokens = 500
      console.log('Using GPT-5 parameters: max_completion_tokens = 500')
    } else {
      params.max_tokens = 500
      params.temperature = 0.7
      console.log('Using GPT-4 parameters: max_tokens = 500, temperature = 0.7')
    }

    console.log(`Sending request to OpenAI with model: ${model}`)
    console.log(`Request params:`, {
      model: params.model,
      max_completion_tokens: params.max_completion_tokens,
      max_tokens: params.max_tokens,
      temperature: params.temperature,
      messages_count: params.messages.length,
      content_length: article.content.length
    })

    const startTime = Date.now()
    const response = await openai.chat.completions.create(params)
    const endTime = Date.now()

    const content = response.choices[0]?.message?.content
    console.log(`✅ Success! Response time: ${endTime - startTime}ms`)
    console.log(`Response details:`, {
      content_length: content?.length || 0,
      content_preview: content?.substring(0, 150) + '...' || 'No content',
      usage: response.usage,
      finish_reason: response.choices[0]?.finish_reason
    })

    return {
      success: true,
      content: content,
      usage: response.usage,
      responseTime: endTime - startTime
    }

  } catch (error) {
    console.log(`❌ Error with ${model}:`)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      status: error.status,
      type: error.type
    })
    
    return {
      success: false,
      error: error.message,
      code: error.code
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting GPT-5 Debug Tests')
  console.log('================================')
  
  // Test 1: GPT-4o-mini (should work)
  const gpt4Result = await testModel('gpt-4o-mini', testArticle, 'GPT-4o-mini')
  
  // Test 2: GPT-5 (the problematic one)
  const gpt5Result = await testModel('gpt-5', testArticle, 'GPT-5')
  
  // Test 3: GPT-5o (alternative GPT-5 model)
  const gpt5oResult = await testModel('gpt-5o', testArticle, 'GPT-5o')
  
  // Test 4: GPT-5o-mini (smaller GPT-5 model)
  const gpt5oMiniResult = await testModel('gpt-5o-mini', testArticle, 'GPT-5o-mini')
  
  // Summary
  console.log('\n📊 Test Summary')
  console.log('================')
  console.log(`GPT-4o-mini: ${gpt4Result.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`GPT-5: ${gpt5Result.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`GPT-5o: ${gpt5oResult.success ? '✅ Success' : '❌ Failed'}`)
  console.log(`GPT-5o-mini: ${gpt5oMiniResult.success ? '✅ Success' : '❌ Failed'}`)
  
  if (gpt4Result.success && gpt5Result.success) {
    console.log('\n🔍 Comparing successful responses:')
    console.log(`GPT-4o-mini response length: ${gpt4Result.content.length}`)
    console.log(`GPT-5 response length: ${gpt5Result.content.length}`)
    console.log(`GPT-4o-mini tokens used: ${gpt4Result.usage?.total_tokens}`)
    console.log(`GPT-5 tokens used: ${gpt5Result.usage?.total_tokens}`)
  }
}

// Run the tests
if (require.main === module) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    process.exit(1)
  }
  
  runTests().catch(console.error)
}

module.exports = { testModel, runTests }

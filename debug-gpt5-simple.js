require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai')

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testSimpleCall(model) {
  console.log(`\n🔍 Testing simple call with ${model}`)
  
  try {
    const params = {
      model: model,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, this is a test"'
        }
      ]
    }

    // Add model-specific parameters
    if (model.includes('gpt-5')) {
      params.max_completion_tokens = 50
      console.log('Using GPT-5 parameters: max_completion_tokens = 50')
    } else {
      params.max_tokens = 50
      console.log('Using GPT-4 parameters: max_tokens = 50')
    }

    console.log(`Sending simple request to ${model}...`)
    const response = await openai.chat.completions.create(params)
    
    const content = response.choices[0]?.message?.content
    console.log(`✅ Success! Response: "${content}"`)
    console.log(`Usage:`, response.usage)
    
    return { success: true, content }
    
  } catch (error) {
    console.log(`❌ Error with ${model}:`)
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      status: error.status,
      type: error.type
    })
    
    return { success: false, error: error.message }
  }
}

async function testContentLength(model, contentLength) {
  console.log(`\n📏 Testing ${model} with content length: ${contentLength}`)
  
  try {
    // Create content of specified length
    const content = 'A'.repeat(contentLength)
    
    const params = {
      model: model,
      messages: [
        {
          role: 'user',
          content: `Summarize this text: ${content}`
        }
      ]
    }

    if (model.includes('gpt-5')) {
      params.max_completion_tokens = 100
    } else {
      params.max_tokens = 100
    }

    console.log(`Sending request with ${contentLength} character content...`)
    const response = await openai.chat.completions.create(params)
    
    const result = response.choices[0]?.message?.content
    console.log(`✅ Success! Response length: ${result?.length || 0}`)
    
    return { success: true, responseLength: result?.length || 0 }
    
  } catch (error) {
    console.log(`❌ Error with ${model} at content length ${contentLength}:`)
    console.error('Error:', error.message)
    
    return { success: false, error: error.message }
  }
}

async function runSimpleTests() {
  console.log('🚀 Starting Simple GPT-5 Debug Tests')
  console.log('=====================================')
  
  // Test 1: Simple calls
  await testSimpleCall('gpt-4o-mini')
  await testSimpleCall('gpt-5')
  await testSimpleCall('gpt-5o')
  
  // Test 2: Different content lengths
  const contentLengths = [100, 1000, 4000, 8000]
  
  for (const length of contentLengths) {
    await testContentLength('gpt-4o-mini', length)
    await testContentLength('gpt-5', length)
  }
}

// Run the tests
if (require.main === module) {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is required')
    process.exit(1)
  }
  
  runSimpleTests().catch(console.error)
}

module.exports = { testSimpleCall, testContentLength, runSimpleTests }

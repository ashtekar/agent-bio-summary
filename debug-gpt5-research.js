require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function researchGPT5API() {
  console.log('🔬 Researching GPT-5 API Usage')
  console.log('==============================')
  
  // Test 1: Check if GPT-5 exists and what models are available
  console.log('\n📋 Checking available models...')
  try {
    const models = await openai.models.list()
    const gpt5Models = models.data.filter(model => model.id.includes('gpt-5'))
    console.log('Available GPT-5 models:', gpt5Models.map(m => m.id))
  } catch (error) {
    console.log('Error fetching models:', error.message)
  }
  
  // Test 2: Try different parameter combinations based on documentation
  const testCases = [
    {
      name: 'GPT-5 with only required parameters',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Hello' }]
      }
    },
    {
      name: 'GPT-5 with max_completion_tokens (no temperature)',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Hello' }],
        max_completion_tokens: 50
      }
    },
    {
      name: 'GPT-5 with temperature=1 (default)',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Hello' }],
        max_completion_tokens: 50,
        temperature: 1
      }
    },
    {
      name: 'GPT-5 with temperature=0',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Hello' }],
        max_completion_tokens: 50,
        temperature: 0
      }
    },
    {
      name: 'GPT-5 with system message',
      params: {
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' }
        ],
        max_completion_tokens: 50
      }
    },
    {
      name: 'GPT-5 with longer max_completion_tokens',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Hello' }],
        max_completion_tokens: 100
      }
    },
    {
      name: 'GPT-5 with different prompt structure',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Please respond with: Hello, this is a test' }],
        max_completion_tokens: 50
      }
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`)
    try {
      const response = await openai.chat.completions.create(testCase.params)
      const content = response.choices[0]?.message?.content
      console.log(`✅ Response: "${content}"`)
      console.log(`Usage:`, response.usage)
      console.log(`Finish reason:`, response.choices[0]?.finish_reason)
      
      // Check if there are any special fields in the response
      if (response.choices[0]?.message?.tool_calls) {
        console.log(`Tool calls:`, response.choices[0].message.tool_calls)
      }
      if (response.choices[0]?.message?.function_call) {
        console.log(`Function call:`, response.choices[0].message.function_call)
      }
    } catch (error) {
      console.log(`❌ Error:`, error.message)
      if (error.response) {
        console.log(`Response details:`, error.response.data)
      }
    }
  }
}

// Test with different model names that might exist
async function testDifferentModelNames() {
  console.log('\n🔍 Testing different GPT-5 model names')
  console.log('=====================================')
  
  const possibleModels = [
    'gpt-5',
    'gpt-5o',
    'gpt-5o-mini',
    'gpt-5-turbo',
    'gpt-5-4o',
    'gpt-5-4o-mini'
  ]
  
  for (const model of possibleModels) {
    console.log(`\n🧪 Testing model: ${model}`)
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_completion_tokens: 50
      })
      
      const content = response.choices[0]?.message?.content
      console.log(`✅ ${model} Response: "${content}"`)
    } catch (error) {
      console.log(`❌ ${model} Error:`, error.message)
    }
  }
}

async function runResearch() {
  await researchGPT5API()
  await testDifferentModelNames()
}

if (require.main === module) {
  runResearch().catch(console.error)
}

module.exports = { researchGPT5API, testDifferentModelNames }

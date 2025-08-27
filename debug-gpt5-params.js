require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testGPT5Parameters() {
  console.log('🔧 Testing GPT-5 with different parameters')
  console.log('==========================================')
  
  const testCases = [
    {
      name: 'GPT-5 with max_completion_tokens only',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Say "Hello, this is a test"' }],
        max_completion_tokens: 50
      }
    },
    {
      name: 'GPT-5 with max_tokens instead',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Say "Hello, this is a test"' }],
        max_tokens: 50
      }
    },
    {
      name: 'GPT-5 with temperature',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Say "Hello, this is a test"' }],
        max_completion_tokens: 50,
        temperature: 0.7
      }
    },
    {
      name: 'GPT-5 with lower max_completion_tokens',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'Say "Hello, this is a test"' }],
        max_completion_tokens: 10
      }
    },
    {
      name: 'GPT-5 with system message',
      params: {
        model: 'gpt-5',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello, this is a test"' }
        ],
        max_completion_tokens: 50
      }
    },
    {
      name: 'GPT-5 with different prompt',
      params: {
        model: 'gpt-5',
        messages: [{ role: 'user', content: 'What is 2+2?' }],
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
    } catch (error) {
      console.log(`❌ Error:`, error.message)
    }
  }
}

// Test GPT-5o-mini as alternative
async function testGPT5oMini() {
  console.log('\n🔍 Testing GPT-5o-mini as alternative')
  console.log('=====================================')
  
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5o-mini',
      messages: [{ role: 'user', content: 'Say "Hello, this is a test"' }],
      max_tokens: 50
    })
    
    const content = response.choices[0]?.message?.content
    console.log(`✅ GPT-5o-mini Response: "${content}"`)
    console.log(`Usage:`, response.usage)
  } catch (error) {
    console.log(`❌ GPT-5o-mini Error:`, error.message)
  }
}

async function runParameterTests() {
  await testGPT5Parameters()
  await testGPT5oMini()
}

if (require.main === module) {
  runParameterTests().catch(console.error)
}

module.exports = { testGPT5Parameters, testGPT5oMini }

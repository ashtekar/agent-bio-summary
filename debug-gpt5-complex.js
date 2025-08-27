require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function testComplexPrompts() {
  console.log('🧠 Testing GPT-5 with complex prompts')
  console.log('=====================================')
  
  const testPrompts = [
    {
      name: 'Simple reasoning task',
      messages: [
        { role: 'user', content: 'Think step by step: What is 15 + 27? Show your work and give the final answer.' }
      ]
    },
    {
      name: 'Analysis task',
      messages: [
        { role: 'user', content: 'Analyze this statement: "The sky is blue because of Rayleigh scattering." Explain why this is true or false.' }
      ]
    },
    {
      name: 'Creative task',
      messages: [
        { role: 'user', content: 'Write a short story about a robot learning to paint. Make it exactly 3 sentences long.' }
      ]
    },
    {
      name: 'Code generation',
      messages: [
        { role: 'user', content: 'Write a Python function that calculates the factorial of a number.' }
      ]
    },
    {
      name: 'Multi-step reasoning',
      messages: [
        { role: 'user', content: 'If a train travels 60 miles per hour and needs to go 180 miles, how long will it take? Show your calculation.' }
      ]
    }
  ]
  
  for (const test of testPrompts) {
    console.log(`\n🧪 ${test.name}`)
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages: test.messages,
        max_completion_tokens: 200
      })
      
      const content = response.choices[0]?.message?.content
      console.log(`✅ Response: "${content}"`)
      console.log(`Usage:`, response.usage)
      console.log(`Finish reason:`, response.choices[0]?.finish_reason)
    } catch (error) {
      console.log(`❌ Error:`, error.message)
    }
  }
}

async function testAlternativeModels() {
  console.log('\n🔍 Testing alternative models')
  console.log('=============================')
  
  const models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo']
  
  for (const model of models) {
    console.log(`\n🧪 Testing ${model}`)
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'Say "Hello, this is a test"' }],
        max_tokens: 50
      })
      
      const content = response.choices[0]?.message?.content
      console.log(`✅ ${model} Response: "${content}"`)
    } catch (error) {
      console.log(`❌ ${model} Error:`, error.message)
    }
  }
}

async function runComplexTests() {
  await testComplexPrompts()
  await testAlternativeModels()
}

if (require.main === module) {
  runComplexTests().catch(console.error)
}

module.exports = { testComplexPrompts, testAlternativeModels }

# GPT-5 Debug Scripts

This directory contains debug scripts to help troubleshoot GPT-5 API issues.

## Prerequisites

1. Make sure you have your `OPENAI_API_KEY` environment variable set
2. Ensure you have access to GPT-5 models in your OpenAI account

## Available Scripts

### 1. Simple GPT-5 Test (`debug-gpt5-simple.js`)

Tests basic API calls and different content lengths to isolate issues.

```bash
npm run debug:gpt5-simple
```

**What it tests:**
- Simple "Hello" messages with different models
- Different content lengths (100, 1000, 4000, 8000 characters)
- Compares GPT-4o-mini vs GPT-5 vs GPT-5o

### 2. Full GPT-5 Test (`debug-gpt5.js`)

Tests the exact same prompt and content structure used in the application.

```bash
npm run debug:gpt5
```

**What it tests:**
- Full article summarization with the same prompt as the app
- Compares all GPT-5 variants (gpt-5, gpt-5o, gpt-5o-mini)
- Shows detailed response comparisons
- Uses the same parameters as the production code

## Expected Output

### Successful Test
```
🚀 Starting GPT-5 Debug Tests
================================

=== Testing GPT-4o-mini (gpt-4o-mini) ===
Using GPT-4 parameters: max_tokens = 500, temperature = 0.7
Sending request to OpenAI with model: gpt-4o-mini
✅ Success! Response time: 1234ms
Response details: {
  content_length: 456,
  content_preview: "<p>Scientists have developed a novel CRISPR-based gene editing technology...",
  usage: { prompt_tokens: 123, completion_tokens: 456, total_tokens: 579 },
  finish_reason: "stop"
}

=== Testing GPT-5 (gpt-5) ===
Using GPT-5 parameters: max_completion_tokens = 500
Sending request to OpenAI with model: gpt-5
✅ Success! Response time: 2345ms
...
```

### Failed Test
```
=== Testing GPT-5 (gpt-5) ===
Using GPT-5 parameters: max_completion_tokens = 500
Sending request to OpenAI with model: gpt-5
❌ Error with gpt-5:
Error details: {
  code: "model_not_found",
  message: "The model `gpt-5` does not exist",
  status: 404,
  type: "invalid_request_error"
}
```

## Common Issues and Solutions

### 1. Model Not Found
**Error:** `The model 'gpt-5' does not exist`
**Solution:** Check if you have access to GPT-5 models in your OpenAI account

### 2. Insufficient Quota
**Error:** `You exceeded your current quota`
**Solution:** Check your OpenAI billing and usage limits

### 3. Invalid API Key
**Error:** `Incorrect API key provided`
**Solution:** Verify your `OPENAI_API_KEY` environment variable

### 4. Content Too Long
**Error:** `This model's maximum context length is X tokens`
**Solution:** Reduce content length or use a model with larger context

## Interpreting Results

### If GPT-4o-mini works but GPT-5 doesn't:
- Check GPT-5 model availability in your account
- Verify GPT-5 is enabled for your API key
- Check if there are any regional restrictions

### If both work but GPT-5 is slower:
- This is normal - GPT-5 is typically slower than GPT-4o-mini
- Consider using GPT-5o or GPT-5o-mini for better performance

### If GPT-5 returns empty responses:
- Check the `finish_reason` in the response
- Verify the `max_completion_tokens` parameter
- Try reducing the input content length

## Next Steps

1. Run the simple test first: `npm run debug:gpt5-simple`
2. If that works, run the full test: `npm run debug:gpt5`
3. Compare the results with your Vercel console logs
4. Update the production code based on findings

## Troubleshooting Production Issues

If the debug scripts work locally but fail in production:

1. Check Vercel environment variables
2. Verify the OpenAI API key is correctly set in Vercel
3. Check Vercel function timeout limits
4. Review Vercel console logs for detailed error messages

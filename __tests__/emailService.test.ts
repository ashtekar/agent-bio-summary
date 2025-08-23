import { EmailService } from '../lib/emailService'

describe('EmailService HTML Content Cleaning', () => {
  let emailService: EmailService

  beforeEach(() => {
    emailService = new EmailService('test-api-key')
  })

  it('should remove markdown code block markers from HTML content', () => {
    const testCases = [
      {
        input: '```html\n<h2>Test Title</h2>\n<p>Test content</p>\n```',
        expected: '<h2>Test Title</h2>\n<p>Test content</p>'
      },
      {
        input: '```\n<h2>Test Title</h2>\n<p>Test content</p>\n```',
        expected: '<h2>Test Title</h2>\n<p>Test content</p>'
      },
      {
        input: '```HTML\n<h2>Test Title</h2>\n<p>Test content</p>\n```',
        expected: '<h2>Test Title</h2>\n<p>Test content</p>'
      },
      {
        input: '<h2>Test Title</h2>\n<p>Test content</p>',
        expected: '<h2>Test Title</h2>\n<p>Test content</p>'
      },
      {
        input: '```html\n<h2>Test Title</h2>\n<p>Test content</p>',
        expected: '<h2>Test Title</h2>\n<p>Test content</p>'
      }
    ]

    testCases.forEach(({ input, expected }) => {
      // Access the private method using any type assertion
      const result = (emailService as any).cleanHtmlContent(input)
      expect(result).toBe(expected)
      console.log(`✅ "${input.substring(0, 30)}..." -> "${result.substring(0, 30)}..."`)
    })
  })

  it('should handle edge cases', () => {
    const edgeCases = [
      { input: '', expected: '' },
      { input: '   ```html\n<p>test</p>\n```   ', expected: '<p>test</p>' },
      { input: '```html\n```', expected: '' },
      { input: '```\n```', expected: '' }
    ]

    edgeCases.forEach(({ input, expected }) => {
      const result = (emailService as any).cleanHtmlContent(input)
      expect(result).toBe(expected)
      console.log(`✅ Edge case: "${JSON.stringify(input)}" -> "${JSON.stringify(result)}"`)
    })
  })

  it('should preserve valid HTML content', () => {
    const validHtml = `
      <h2>Top 10 Articles Summary</h2>
      <p>Here are the key findings from today's research:</p>
      <ul>
        <li><strong>Article 1:</strong> Breakthrough in CRISPR technology</li>
        <li><strong>Article 2:</strong> New protein synthesis method</li>
      </ul>
      <p>These discoveries show the exciting future of synthetic biology.</p>
    `

    const result = (emailService as any).cleanHtmlContent(validHtml)
    expect(result).toBe(validHtml.trim())
    console.log('✅ Valid HTML preserved correctly')
  })
})

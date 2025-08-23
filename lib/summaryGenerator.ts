import OpenAI from 'openai'
import { Article, SummaryGenerationRequest } from './types'

function isGpt5Model(model: string) {
  return model.startsWith('gpt-5') || model.startsWith('gpt-5o')
}

export class SummaryGenerator {
  private openai: OpenAI
  private targetAudience: string
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.openai = new OpenAI({ apiKey })
    this.targetAudience = 'College sophomore with a good foundation in basic biology'
    this.model = model
  }

  async generateDailySummary(articles: Article[]): Promise<string> {
    try {
      const topArticles = articles.slice(0, 10)
      const articlesText = topArticles.map(article => 
        `Title: ${article.title}\nSummary: ${article.summary}\nSource: ${article.source}\n\n`
      ).join('')

      const prompt = `You are an expert science educator writing for ${this.targetAudience}. 
      
      Below are the top 10 synthetic biology articles from the past 24 hours. Create a comprehensive daily summary that:
      
      1. Explains the major themes and breakthroughs in simple terms
      2. Highlights the most important discoveries and their potential impact
      3. Add a few sentences on how the discovery or novel approach mentioned in the article was achieved. Student is looking for key inisghts that led to the discovery.
      4. Content of your response will be used in an email newsletter
      5. Respond with well-structured HTML suitable for direct use in an email. Do not use markdown.
      6. Add source of the article in the summary. Include the URL provided in the article object.
      
      Articles:
      ${articlesText}
      
      Please provide a well-structured daily summary that captures the excitement and importance of these developments in synthetic biology.`

      const params: any = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a science educator who specializes in making complex synthetic biology concepts accessible to college students.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }
      if (isGpt5Model(this.model)) {
        params.max_completion_tokens = 1000
        // Do not set temperature for GPT-5 models
      } else {
        params.max_tokens = 1000
        params.temperature = 0.7
      }

      const response = await this.openai.chat.completions.create(params)

      const content = response.choices[0]?.message?.content
      console.log('OpenAI response content length:', content?.length || 0)
      console.log('OpenAI response content preview:', content?.substring(0, 100) || 'No content')
      return content || 'Unable to generate summary'
    } catch (error) {
      console.error('Error generating daily summary:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota') {
        return 'OpenAI API quota exceeded. Please check your billing or try again later.'
      }
      return 'Error generating summary'
    }
  }

  async generateTop10Summary(articles: Article[]): Promise<string> {
    try {
      const top10Articles = articles.slice(0, 10)
      const articlesText = top10Articles.map((article, index) => 
        `${index + 1}. ${article.title}\n   ${article.summary}\n   Source: ${article.source}\n   URL: ${article.url}\n`
      ).join('\n')

      const prompt = `You are an expert science educator writing for ${this.targetAudience}.
      
      Below are the top 10 synthetic biology articles from today. Create a comprehensive summary that covers ALL 10 articles:
      
      1. For each article, provide a brief but complete summary (2-3 sentences)
      2. Highlight the key scientific findings and their significance
      3. Explain the methodology or approach used in each discovery
      4. Connect the articles to show broader trends in synthetic biology
      5. Use well-structured HTML with clear article separations
      6. Include source attribution and links for each article
      7. Make it engaging and educational for college students
      
      IMPORTANT: Ensure you cover ALL 10 articles completely. Do not truncate or skip any articles.
      
      Top 10 Articles:
      ${articlesText}
      
      Please provide a comprehensive summary of ALL 10 articles that would interest and educate a college sophomore.`

      const params: any = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a science educator who makes synthetic biology exciting and accessible to college students.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }
      if (isGpt5Model(this.model)) {
        params.max_completion_tokens = 2000
        // Do not set temperature for GPT-5 models
      } else {
        params.max_tokens = 2000
        params.temperature = 0.7
      }

      const response = await this.openai.chat.completions.create(params)

      const content = response.choices[0]?.message?.content
      console.log('OpenAI top 10 response content length:', content?.length || 0)
      console.log('OpenAI top 10 response content preview:', content?.substring(0, 100) || 'No content')
      
      // Debug: Check if all 10 articles are mentioned
      if (content) {
        const articleNumbers = content.match(/\d+\./g) || []
        console.log('Found article numbers in response:', articleNumbers)
        console.log('Number of articles covered:', articleNumbers.length)
        
        if (articleNumbers.length < 10) {
          console.warn('⚠️ WARNING: Only', articleNumbers.length, 'articles covered out of 10')
        } else {
          console.log('✅ SUCCESS: All 10 articles covered')
        }
      }
      
      return content || 'Unable to generate top 10 summary'
    } catch (error) {
      console.error('Error generating top 10 summary:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota') {
        return 'OpenAI API quota exceeded. Please check your billing or try again later.'
      }
      return 'Error generating summary'
    }
  }

  async simplifyArticleContent(article: Article): Promise<string> {
    try {
      const prompt = `You are an expert science educator writing for ${this.targetAudience}.
      
      Please simplify and explain this scientific article in a way that a high school student would understand:
      
      Title: ${article.title}
      Content: ${article.content}
      
      Requirements:
      1. Use simple, clear language
      2. Explain complex terms when they appear
      3. Focus on the main findings and their importance
      4. Make it engaging and interesting
      5. Keep it concise (2-3 paragraphs)
      6. Content of your response will be used in an email newsletter

      Please provide a simplified explanation that maintains scientific accuracy while being accessible to a college sophomore.`

      const params: any = {
        model: this.model,
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
      if (isGpt5Model(this.model)) {
        params.max_completion_tokens = 500
        // Do not set temperature for GPT-5 models
      } else {
        params.max_tokens = 500
        params.temperature = 0.7
      }

      const response = await this.openai.chat.completions.create(params)

      return response.choices[0]?.message?.content || article.summary
    } catch (error) {
      console.error('Error simplifying article content:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota') {
        return 'OpenAI API quota exceeded. Using original summary.'
      }
      return article.summary
    }
  }

  async generateEducationalContext(articles: Article[]): Promise<string> {
    try {
      const keywords = new Set<string>()
      articles.forEach(article => {
        article.keywords.forEach(keyword => keywords.add(keyword))
      })

      const prompt = `You are an expert science educator writing for ${this.targetAudience}.
      
      Based on these synthetic biology articles, create a brief educational context that:
      
      1. Explains the basic concepts that students should understand
      2. Provides background information on synthetic biology
      3. Connects the articles to broader scientific themes
      4. Suggests why this field is important and exciting
      5. Content of your response will be used in an email newsletter
      
      Key topics from the articles: ${Array.from(keywords).join(', ')}
      
      Please provide a brief educational context that helps students understand the significance of these developments.`

      const params: any = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a science educator who helps students understand the broader context and importance of scientific discoveries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      }
      if (isGpt5Model(this.model)) {
        params.max_completion_tokens = 400
        // Do not set temperature for GPT-5 models
      } else {
        params.max_tokens = 400
        params.temperature = 0.7
      }

      const response = await this.openai.chat.completions.create(params)

      return response.choices[0]?.message?.content || 'Educational context unavailable'
    } catch (error) {
      console.error('Error generating educational context:', error)
      if (error && typeof error === 'object' && 'code' in error && error.code === 'insufficient_quota') {
        return 'OpenAI API quota exceeded. Educational context unavailable.'
      }
      return 'Educational context unavailable'
    }
  }
}

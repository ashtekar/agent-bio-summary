import OpenAI from 'openai'
import { Article, SummaryGenerationRequest } from './types'

export class SummaryGenerator {
  private openai: OpenAI
  private targetAudience: string

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
    this.targetAudience = '15-year-old high school student with a good foundation in basic biology'
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
      2. Uses basic biology terminology that a high school student would understand
      3. Highlights the most important discoveries and their potential impact
      4. Makes complex concepts accessible and engaging
      5. Is written in clear, concise language
      
      Articles:
      ${articlesText}
      
      Please provide a well-structured daily summary that captures the excitement and importance of these developments in synthetic biology.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a science educator who specializes in making complex synthetic biology concepts accessible to high school students. Write in clear, engaging language that builds excitement for science.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || 'Unable to generate summary'
    } catch (error) {
      console.error('Error generating daily summary:', error)
      if (error.code === 'insufficient_quota') {
        return 'OpenAI API quota exceeded. Please check your billing or try again later.'
      }
      return 'Error generating summary'
    }
  }

  async generateTop10Summary(articles: Article[]): Promise<string> {
    try {
      const top10Articles = articles.slice(0, 10)
      const articlesText = top10Articles.map((article, index) => 
        `${index + 1}. ${article.title}\n   ${article.summary}\n   Source: ${article.source}\n`
      ).join('\n')

      const prompt = `You are an expert science educator writing for ${this.targetAudience}.
      
      Below are the top 10 synthetic biology articles from today. Create a concise summary that:
      
      1. Highlights the key findings from each article
      2. Explains why these discoveries are important
      3. Uses simple language that a high school student can understand
      4. Connects the articles to show broader trends in synthetic biology
      5. Makes the science exciting and relevant
      
      Top 10 Articles:
      ${articlesText}
      
      Please provide a compelling summary of these top 10 articles that would interest and educate a high school student.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a science educator who makes synthetic biology exciting and accessible to high school students. Focus on the wonder and potential of these discoveries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || 'Unable to generate top 10 summary'
    } catch (error) {
      console.error('Error generating top 10 summary:', error)
      if (error.code === 'insufficient_quota') {
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
      
      Please provide a simplified explanation that maintains scientific accuracy while being accessible to a high school student.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a science educator who specializes in making complex scientific concepts accessible to high school students. Write clearly and engagingly.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || article.summary
    } catch (error) {
      console.error('Error simplifying article content:', error)
      if (error.code === 'insufficient_quota') {
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
      
      Key topics from the articles: ${Array.from(keywords).join(', ')}
      
      Please provide a brief educational context that helps students understand the significance of these developments.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a science educator who helps students understand the broader context and importance of scientific discoveries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })

      return response.choices[0]?.message?.content || 'Educational context unavailable'
    } catch (error) {
      console.error('Error generating educational context:', error)
      if (error.code === 'insufficient_quota') {
        return 'OpenAI API quota exceeded. Educational context unavailable.'
      }
      return 'Educational context unavailable'
    }
  }
}

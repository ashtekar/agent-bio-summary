import axios from 'axios'
import * as cheerio from 'cheerio'
import { Article, SearchSettings } from './types'

export class WebSearchModule {
  private settings: SearchSettings

  constructor(settings: SearchSettings) {
    this.settings = settings
  }

  async searchArticles(): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      // Search multiple sources
      const searchPromises = [
        this.searchPubMed(),
        this.searchArxiv(),
        this.searchNewsSources()
      ]

      const results = await Promise.allSettled(searchPromises)
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          articles.push(...result.value)
        }
      })

      // Sort by relevance score and take top articles
      articles.sort((a, b) => b.relevanceScore - a.relevanceScore)
      return articles.slice(0, this.settings.maxArticles)

    } catch (error) {
      console.error('Error searching articles:', error)
      return []
    }
  }

  private async searchPubMed(): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      const keywords = this.settings.keywords.join(' AND ')
      const url = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(keywords)}&filter=dates.2024-01-01-2024-12-31`
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const $ = cheerio.load(response.data)
      
      $('.result-item').each((index, element) => {
        if (index >= 10) return // Limit to first 10 results
        
        const title = $(element).find('.title').text().trim()
        const url = $(element).find('a').attr('href')
        const abstract = $(element).find('.abstract').text().trim()
        
        if (title && url) {
          articles.push({
            id: `pubmed-${Date.now()}-${index}`,
            title,
            url: `https://pubmed.ncbi.nlm.nih.gov${url}`,
            source: 'PubMed',
            publishedDate: new Date().toISOString(),
            content: abstract,
            summary: abstract.substring(0, 200) + '...',
            relevanceScore: this.calculateRelevanceScore(title, abstract),
            keywords: this.extractKeywords(title + ' ' + abstract)
          })
        }
      })

    } catch (error) {
      console.error('Error searching PubMed:', error)
    }

    return articles
  }

  private async searchArxiv(): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      const keywords = this.settings.keywords.join(' OR ')
      const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(keywords)}&start=0&max_results=20&sortBy=submittedDate&sortOrder=descending`
      
      const response = await axios.get(url)
      const $ = cheerio.load(response.data, { xmlMode: true })
      
      $('entry').each((index, element) => {
        const title = $(element).find('title').text().trim()
        const summary = $(element).find('summary').text().trim()
        const published = $(element).find('published').text()
        const id = $(element).find('id').text()
        
        if (title && summary) {
          articles.push({
            id: `arxiv-${Date.now()}-${index}`,
            title,
            url: id,
            source: 'arXiv',
            publishedDate: published,
            content: summary,
            summary: summary.substring(0, 200) + '...',
            relevanceScore: this.calculateRelevanceScore(title, summary),
            keywords: this.extractKeywords(title + ' ' + summary)
          })
        }
      })

    } catch (error) {
      console.error('Error searching arXiv:', error)
    }

    return articles
  }

  private async searchNewsSources(): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      // Search Science Daily
      const scienceDailyUrl = `https://www.sciencedaily.com/news/computers_math/synthetic_biology/`
      const response = await axios.get(scienceDailyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })

      const $ = cheerio.load(response.data)
      
      $('.latest-head').each((index, element) => {
        if (index >= 5) return // Limit to first 5 results
        
        const title = $(element).find('a').text().trim()
        const url = $(element).find('a').attr('href')
        const summary = $(element).find('.brief').text().trim()
        
        if (title && url) {
          articles.push({
            id: `sciencedaily-${Date.now()}-${index}`,
            title,
            url: `https://www.sciencedaily.com${url}`,
            source: 'Science Daily',
            publishedDate: new Date().toISOString(),
            content: summary,
            summary: summary.substring(0, 200) + '...',
            relevanceScore: this.calculateRelevanceScore(title, summary),
            keywords: this.extractKeywords(title + ' ' + summary)
          })
        }
      })

    } catch (error) {
      console.error('Error searching news sources:', error)
    }

    return articles
  }

  private calculateRelevanceScore(title: string, content: string): number {
    const text = (title + ' ' + content).toLowerCase()
    let score = 0

    // Check for synthetic biology keywords
    const syntheticBiologyKeywords = [
      'synthetic biology', 'synthetic biology', 'genetic engineering',
      'crispr', 'gene editing', 'bioengineering', 'biotechnology',
      'metabolic engineering', 'synthetic genome', 'synthetic cell'
    ]

    syntheticBiologyKeywords.forEach(keyword => {
      const count = (text.match(new RegExp(keyword, 'gi')) || []).length
      score += count * 2
    })

    // Check for recent developments
    const recentKeywords = [
      'breakthrough', 'discovery', 'novel', 'new', 'advance',
      'innovation', 'development', 'progress', 'achievement'
    ]

    recentKeywords.forEach(keyword => {
      const count = (text.match(new RegExp(keyword, 'gi')) || []).length
      score += count
    })

    // Normalize score to 0-10 range
    return Math.min(10, Math.max(0, score))
  }

  private extractKeywords(text: string): string[] {
    const keywords = new Set<string>()
    const syntheticBiologyTerms = [
      'synthetic biology', 'crispr', 'gene editing', 'bioengineering',
      'genetic engineering', 'metabolic engineering', 'synthetic genome'
    ]

    const lowerText = text.toLowerCase()
    syntheticBiologyTerms.forEach(term => {
      if (lowerText.includes(term)) {
        keywords.add(term)
      }
    })

    return Array.from(keywords)
  }
}

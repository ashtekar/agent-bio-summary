import axios from 'axios'
import * as cheerio from 'cheerio'
import { Article, SearchSettings } from './types'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export class WebSearchModule {
  private settings: SearchSettings

  constructor(settings: SearchSettings) {
    this.settings = settings
  }

  async searchArticles(): Promise<Article[]> {
    let articles: Article[] = []
    
    try {
      // Get active search sites from database
      const { data: activeSites, error: sitesError } = await supabase
        .from('search_sites')
        .select('domain, display_name')
        .eq('is_active', true)

      if (sitesError) {
        console.error('Error fetching active search sites:', sitesError)
        return []
      }

      if (!activeSites || activeSites.length === 0) {
        console.log('No active search sites found')
        return []
      }

      console.log(`Searching ${activeSites.length} active sites:`, activeSites.map(s => s.domain))

      // Search each active site
      const searchPromises = activeSites.map(site => 
        this.searchSite(site.domain, site.display_name)
      )

      const results = await Promise.allSettled(searchPromises)
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          articles.push(...result.value)
          console.log(`Found ${result.value.length} articles from ${activeSites[index].domain}`)
        } else {
          console.error(`Error searching ${activeSites[index].domain}:`, result.reason)
        }
      })

      // Filter by relevance threshold, sort by relevance score, and take top articles
      const threshold = this.settings.relevance_threshold ?? 6.0
      const filteredArticles = articles.filter(article => article.relevanceScore >= threshold)
      console.log(`Filtered ${articles.length} articles to ${filteredArticles.length} articles above threshold ${threshold}`)
      
      filteredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)
      return filteredArticles.slice(0, this.settings.maxArticles)

    } catch (error) {
      console.error('Error searching articles:', error)
      return []
    }
  }

  private async searchSite(domain: string, displayName: string): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      // Use site-specific handlers for known sites
      const siteHandler = this.getSiteHandler(domain)
      if (siteHandler) {
        return await siteHandler()
      }

      // Generic search for unknown sites
      return await this.searchGenericSite(domain, displayName)

    } catch (error) {
      console.error(`Error searching ${domain}:`, error)
      return []
    }
  }

  private getSiteHandler(domain: string): (() => Promise<Article[]>) | null {
    const handlers: Record<string, () => Promise<Article[]>> = {
      'pubmed.ncbi.nlm.nih.gov': () => this.searchPubMed(),
      'arxiv.org': () => this.searchArxiv(),
      'sciencedaily.com': () => this.searchScienceDaily(),
      'www.sciencedaily.com': () => this.searchScienceDaily(),
    }

    return handlers[domain] || null
  }

  private async searchGenericSite(domain: string, displayName: string): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      // Google Custom Search API credentials from environment variables
      const API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY
      const SEARCH_ENGINE_ID = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
      
      if (!API_KEY || !SEARCH_ENGINE_ID) {
        console.error('Google Custom Search API credentials not configured')
        return articles
      }
      
      // Construct search query with site restriction
      const searchQuery = `${this.settings.keywords.join(' ')} site:${domain}`
      
      console.log(`Searching Google Custom Search API for: ${searchQuery}`)
      
      const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
        params: {
          key: API_KEY,
          cx: SEARCH_ENGINE_ID,
          q: searchQuery,
          num: 10 // Number of results
        },
        timeout: 15000
      })
      
      if (response.data.items && response.data.items.length > 0) {
        response.data.items.forEach((item: any, index: number) => {
          const article: Article = {
            id: `google-api-${domain}-${index}`,
            title: item.title || '',
            url: item.link || '',
            source: displayName,
            publishedDate: new Date().toISOString(), // Google API doesn't always provide dates
            content: item.snippet || '',
            summary: item.snippet || '',
            relevanceScore: this.calculateRelevanceScore(item.title, item.snippet),
            keywords: this.extractKeywords(item.title + ' ' + item.snippet)
          }
          
          articles.push(article)
        })
        
        console.log(`Found ${articles.length} articles from ${displayName}`)
      } else {
        console.log(`No results found for ${displayName}`)
      }
      
    } catch (error) {
      console.error(`Error in Google Custom Search API for ${domain}:`, error)
    }

    return articles
  }

  private async searchPubMed(): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      const keywords = this.settings.keywords.join(' AND ')
      const url = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(keywords)}&filter=dates.2024-01-01-2024-12-31`
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)
      
      $('.result-item').each((index, element) => {
        if (index >= 10) return
        
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
      
      const response = await axios.get(url, {
        timeout: 10000
      })
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

  private async searchScienceDaily(): Promise<Article[]> {
    const articles: Article[] = []
    
    try {
      const scienceDailyUrl = `https://www.sciencedaily.com/news/top/technology/`
      const response = await axios.get(scienceDailyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })

      const $ = cheerio.load(response.data)
      
      $('.latest-head').each((index, element) => {
        if (index >= 5) return
        
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
      console.error('Error searching Science Daily:', error)
    }

    return articles
  }

  private calculateRelevanceScore(title: string, content: string): number {
    const text = (title + ' ' + content).toLowerCase()
    let score = 0

    // Check for synthetic biology keywords
    const syntheticBiologyKeywords = [
      'synthetic biology', 'molecular biology', 'cellular biology','genetic engineering',
      'crispr', 'gene editing', 'bioengineering', 'biotechnology', 'mRNA', 'CRISPR',
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
      'synthetic biology', 'molecular biology', 'cellular biology','genetic engineering',
      'crispr', 'gene editing', 'bioengineering', 'biotechnology', 'mRNA', 'CRISPR',
      'metabolic engineering', 'synthetic genome', 'synthetic cell'
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

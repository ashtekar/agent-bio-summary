import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ComparisonService } from '../lib/comparisonService'
import { DailySummaryExtractor } from '../lib/summaryExtractor'

// Mock the dependencies
vi.mock('../lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'test-summary-id',
              date: '2024-08-27',
              daily_overview: 'Test daily overview content',
              top_10_summary: 'Test top 10 summary',
              featured_articles: ['article1', 'article2'],
              article_ids: ['article1', 'article2', 'article3']
            },
            error: null
          }))
        })),
        in: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              data: [
                {
                  id: 'article1',
                  title: 'Test Article 1',
                  source: 'Nature',
                  published_date: '2024-08-27',
                  content: 'Test content 1',
                  relevance_score: 8.5
                },
                {
                  id: 'article2',
                  title: 'Test Article 2',
                  source: 'Science',
                  published_date: '2024-08-27',
                  content: 'Test content 2',
                  relevance_score: 7.8
                },
                {
                  id: 'article3',
                  title: 'Test Article 3',
                  source: 'Cell',
                  published_date: '2024-08-27',
                  content: 'Test content 3',
                  relevance_score: 7.2
                }
              ],
              error: null
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        error: null
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            error: null
          }))
        }))
      }))
    }))
  }
}))

vi.mock('../lib/summaryGenerator', () => ({
  SummaryGenerator: vi.fn().mockImplementation(() => ({
    generateDailySummary: vi.fn(() => Promise.resolve('Generated summary content'))
  }))
}))

describe('ComparisonService', () => {
  let comparisonService: ComparisonService

  beforeEach(() => {
    comparisonService = new ComparisonService()
  })

  describe('createSession', () => {
    it('should create a comparison session successfully', async () => {
      const recipientId = 'test-recipient-id'
      const summaryId = 'test-summary-id'

      const result = await comparisonService.createSession(recipientId, summaryId)

      expect(result).toBeDefined()
      expect(result.session_id).toBeDefined()
      expect(result.recipient_id).toBe(recipientId)
      expect(result.summary_id).toBe(summaryId)
      expect(result.total_comparisons).toBe(3)
      expect(result.completed_comparisons).toBe(0)
    })
  })
})

describe('DailySummaryExtractor', () => {
  let extractor: DailySummaryExtractor

  beforeEach(() => {
    extractor = new DailySummaryExtractor()
  })

  describe('validateExtraction', () => {
    it('should validate extracted summaries correctly', () => {
      const validSummaries = [
        {
          article_id: '',
          title: 'CRISPR Breakthrough',
          source: '',
          published_date: '',
          summary: 'Researchers have developed a new CRISPR-based gene editing technique that shows improved precision and reduced off-target effects.'
        },
        {
          article_id: '',
          title: 'AI-Powered Drug Discovery',
          source: '',
          published_date: '',
          summary: 'A novel AI system has been developed to accelerate drug discovery processes in synthetic biology.'
        },
        {
          article_id: '',
          title: 'Quantum Computing in Bioinformatics',
          source: '',
          published_date: '',
          summary: 'Scientists are exploring the potential of quantum computing to solve complex bioinformatics problems.'
        }
      ]

      const result = extractor.validateExtraction(validSummaries)
      expect(result).toBe(true)
    })

    it('should reject invalid extractions', () => {
      const invalidSummaries = [
        {
          article_id: '',
          title: 'Short',
          source: '',
          published_date: '',
          summary: 'Too short'
        }
      ]

      const result = extractor.validateExtraction(invalidSummaries)
      expect(result).toBe(false)
    })
  })
})

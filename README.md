# AgentBioSummary

**Version:** 1.3.0 | **Latest Release:** January 2025

An automated agent system that performs daily web searches for synthetic biology content, creates educational summaries for high school students, and sends them via email. The system captures end user feedback on the summaries and uses this feedback to fine tune a model.

## 🎉 What's New in v1.3

### 🚀 **Enhanced Feedback System with A/B Comparisons**
- **A/B Comparison Interface** - Users can now compare two different AI-generated summaries side-by-side
- **Direct Preference Optimization (DPO)** - Collect structured preference data for model fine-tuning
- **Flexible Article Comparison** - Support for 1-3 articles per feedback session
- **Dedicated Feedback Page** - Seamless feedback flow from email links

### 🤖 **GPT-5 Integration & Optimization**
- **Fixed GPT-5 API Usage** - Resolved empty response issues with proper parameter handling
- **Database-Driven Model Selection** - Configurable comparison models via system settings
- **Enhanced Content Processing** - Better HTML rendering and content mapping
- **Improved Error Handling** - Comprehensive OpenAI API error management

### 🧪 **Testing Framework Migration**
- **Jest to Vitest Migration** - Better compatibility with modern React components
- **Comprehensive Debug Scripts** - Tools for GPT-5 testing and troubleshooting
- **Enhanced Test Coverage** - Better testing infrastructure for new features

### 🔧 **Technical Improvements**
- **Enhanced Logging & Debugging** - Comprehensive console logging throughout the system
- **Database Optimizations** - New `feedback_comparisons` table with proper indexing
- **Better Error Handling** - Graceful fallbacks and specific error messages
- **Improved Security** - Enhanced input validation and configuration management

[📋 Full Release Notes](RELEASE_NOTES_V1.3.md)

## 🎯 Project Overview

AgentBioSummary is designed to bridge the gap between cutting-edge synthetic biology research and high school students. It automatically:

1. **Searches** for the most relevant synthetic biology articles from the past 24 hours
2. **Analyzes** and ranks articles based on relevance, impact, and novelty
3. **Generates** educational summaries written for 15-year-old high school students
4. **Emails** daily digests to specified recipients
5. **Collects human feedback** on summaries and articles via thumbs up/down links in emails
6. **🆕 A/B Comparison System** - Users can compare different AI-generated summaries side-by-side for Direct Preference Optimization (DPO) fine-tuning

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React** components for interactive UI

### Backend
- **Vercel Edge Functions** for serverless processing
- **OpenAI GPT-4o-mini & GPT-5** for intelligent summarization and A/B comparisons
- **Google Custom Search API** for reliable web search
- **Resend** for email delivery
- **Web scraping** with Cheerio and Axios
- **Enhanced Feedback API** for A/B comparison and preference collection

### Infrastructure
- **Vercel** for hosting and deployment
- **Vercel Cron Triggers** for daily execution
- **Environment variables** for secure configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key
- Google Custom Search API key (optional for enhanced search)
- Resend API key (optional for email functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Agent-BioSummary
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_CUSTOM_SEARCH_API_KEY=your_google_search_api_key_here
   GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id_here
   RESEND_API_KEY=your_resend_api_key_here
   DEFAULT_RECIPIENT_EMAIL=student@school.edu
   ADMIN_EMAIL=admin@school.edu
   NEXT_PUBLIC_BASE_URL=https://your-production-url.vercel.app
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### API Quota Management

**Important**: The system uses OpenAI's GPT-4o-mini model for summarization. If you encounter quota exceeded errors:

1. **Check your OpenAI billing** at https://platform.openai.com/account/billing
2. **Upgrade your plan** if needed for higher usage limits
3. **Monitor usage** in your OpenAI dashboard
4. **Consider rate limiting** for production deployments

The system gracefully handles quota errors and will display appropriate messages to users.

### Google Custom Search API Setup

For enhanced search functionality:

1. **Enable Google Custom Search API** at https://console.cloud.google.com/apis/library/customsearch.googleapis.com
2. **Create API credentials** and get your API key
3. **Set up a Custom Search Engine** at https://cse.google.com/
4. **Configure the search engine** to search the entire web or specific sites
5. **Add credentials** to your environment variables

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini access | Yes |
| `GOOGLE_CUSTOM_SEARCH_API_KEY` | Google Custom Search API key | No |
| `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` | Google Custom Search Engine ID | No |
| `RESEND_API_KEY` | Resend API key for email delivery | No |
| `DEFAULT_RECIPIENT_EMAIL` | Default email for testing | No |
| `ADMIN_EMAIL` | Admin email for error notifications | No |
| `NEXT_PUBLIC_BASE_URL` | Base URL for feedback links in emails | Yes |

### Search Settings

The system searches for articles with these default keywords:
- synthetic biology
- CRISPR
- gene editing
- bioengineering

Sources include:
- PubMed
- arXiv
- Phys.org
- Nature
- MIT News
- Academic OUP
- Wired
- And more via configurable search sites

## 🔄 A/B Comparison System

### **Direct Preference Optimization (DPO)**
The system now supports A/B comparison of AI-generated summaries to collect structured preference data for model fine-tuning:

#### **How It Works**
1. **Email Trigger** - Users click feedback links in emails
2. **Comparison Session** - System creates a comparison session with 1-3 articles
3. **A/B Interface** - Users see two summaries side-by-side (current vs. advanced model)
4. **Preference Collection** - Users select their preferred summary
5. **Data Storage** - Preferences are stored for DPO training

#### **New API Endpoints**
- `POST /api/feedback/start-comparison` - Initialize comparison session
- `GET /api/feedback/comparison/[sessionId]/[order]` - Get comparison data
- `POST /api/feedback/submit-comparison` - Record user preferences
- `GET /api/feedback/session/[sessionId]/summary` - Get session summary

#### **Database Schema**
```sql
-- New feedback_comparisons table
CREATE TABLE feedback_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  summary_id UUID NOT NULL,
  article_id UUID NOT NULL,
  current_summary TEXT NOT NULL,
  advanced_summary TEXT NOT NULL,
  user_preference VARCHAR(1) CHECK (user_preference IN ('A', 'B')),
  current_model VARCHAR(50) NOT NULL,
  advanced_model VARCHAR(50) NOT NULL,
  comparison_order INTEGER NOT NULL,
  extraction_method VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📧 Email Configuration
1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add it to your environment variables
4. Configure your domain for sending emails

### Email Templates
The system generates beautiful HTML emails with:
- Daily overview of synthetic biology developments
- Top 10 articles summary
- Educational context for students
- **Thumbs up/down feedback links** for both summaries and articles (using inline SVGs for maximum compatibility)
- **Dark mode**: black background, white text, and consistent styling for all content

## 🕐 Scheduling

The system runs automatically every day at 8:00 AM UTC via Vercel Cron Triggers. You can modify the schedule in `vercel.json`.

## 🧪 Testing

### Manual Search
Use the dashboard to trigger manual searches and test the system.

### Test Email
Send test emails to verify email configuration.

### Automated Testing
Run the test suite to verify functionality:
```bash
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm test -- --coverage     # Run tests with coverage report
```

#### **🆕 Debug Scripts**
```bash
npm run debug:gpt5          # Test GPT-5 integration
npm run debug:gpt5-simple   # Basic GPT-5 API testing
```

### API Endpoints

- `POST /api/search` - Manual article search
- `POST /api/summarize` - Generate summaries
- `POST /api/email` - Send emails
- `GET /api/cron/daily-summary` - Daily cron job
- `GET /api/feedback` - **Silent feedback endpoint for thumbs up/down links in emails. Records recipient, summary/article, and feedback value. Returns 204 No Content.**

#### **🆕 A/B Comparison Endpoints**
- `POST /api/feedback/start-comparison` - Initialize A/B comparison session
- `GET /api/feedback/comparison/[sessionId]/[order]` - Retrieve comparison data
- `POST /api/feedback/submit-comparison` - Record user preferences
- `GET /api/feedback/session/[sessionId]/summary` - Get session summary

## 🗄️ Database & Data Retention

### Schema
- **Articles**: Retained for 30 days
- **Daily Summaries**: Retained for 30 days
- **Feedback**: Linked to recipient, summary, and article. Retained for at least 30 days for model fine-tuning.
- **🆕 Feedback Comparisons**: A/B comparison data for DPO training. Retained for model fine-tuning.
- **Recipients, Settings, etc.**: Permanent

### Feedback Table
| Field         | Type    | Description                                 |
|--------------|---------|---------------------------------------------|
| id           | UUID    | Primary key                                 |
| recipient_id | UUID    | References email_recipients(id)             |
| summary_id   | UUID    | References daily_summaries(id) (nullable)   |
| article_id   | UUID    | References articles(id) (nullable)          |
| feedback_type| TEXT    | 'summary' or 'article'                      |
| feedback_value| TEXT   | 'up' or 'down'                              |
| created_at   | TIMESTAMP | Feedback timestamp                        |

### Data Retention Policy
- **Articles, summaries, and feedback are retained for 30 days by default.**
- You can adjust this in the database cleanup functions if needed.

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
   ```bash
   npx vercel
   ```

2. **Set environment variables** in Vercel dashboard

3. **Deploy**
   ```bash
   npx vercel --prod
   ```

### Environment Variables in Vercel

Add these to your Vercel project settings:
- `OPENAI_API_KEY`
- `GOOGLE_CUSTOM_SEARCH_API_KEY` (optional)
- `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` (optional)
- `RESEND_API_KEY`
- `DEFAULT_RECIPIENT_EMAIL`
- `ADMIN_EMAIL`
- `NEXT_PUBLIC_BASE_URL`

## 📊 Monitoring

- **Vercel Analytics** for performance monitoring
- **Built-in error tracking** via Vercel
- **Email notifications** for system errors
- **Console logging** for debugging

## 🔒 Security

- **API key management** via environment variables
- **Rate limiting** on API endpoints
- **Input validation** on all endpoints
- **Error handling** with proper logging
- **Content sanitization** with DOMPurify for XSS prevention
- **Secure test environment** with mock credentials

## 🛠️ Development

### Project Structure
```
Agent-BioSummary/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/             # React components
├── lib/                   # Core libraries
│   ├── types.ts           # TypeScript types
│   ├── webSearch.ts       # Web scraping module
│   ├── summaryGenerator.ts # OpenAI integration
│   └── emailService.ts    # Email service
├── public/                # Static assets
└── README.md              # This file
```

### Adding New Features

1. **New Search Sources**: Add to `WebSearchModule` in `lib/webSearch.ts` or configure via settings
2. **Email Templates**: Modify `EmailService` in `lib/emailService.ts`
3. **UI Components**: Add to `components/` directory
4. **API Endpoints**: Create new routes in `app/api/`
5. **Tests**: Add corresponding test files in `__tests__/` directory

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the documentation and release notes
2. Review the debug logs for detailed error information
3. Verify environment variable configuration
4. Run the test suite to check system health
5. Open an issue on GitHub with detailed information

### Troubleshooting

**Common Issues:**
- **Search not working**: Check Google Custom Search API credentials
- **Email formatting issues**: Verify HTML content cleaning is working
- **Summary truncation**: Check OpenAI token limits and API quota
- **Environment variables**: Ensure all required variables are set in Vercel

## 🎓 Educational Impact

This system is specifically designed to:
- Make complex synthetic biology research accessible to high school students
- Build excitement for science and biotechnology
- Provide daily exposure to cutting-edge developments
- Support STEM education initiatives

---

**Built with ❤️ for science education**

# AgentBioSummary

An automated agent system that performs daily web searches for synthetic biology content, creates educational summaries for high school students, and sends them via email.

## 🎯 Project Overview

AgentBioSummary is designed to bridge the gap between cutting-edge synthetic biology research and high school students. It automatically:

1. **Searches** for the most relevant synthetic biology articles from the past 24 hours
2. **Analyzes** and ranks articles based on relevance, impact, and novelty
3. **Generates** educational summaries written for 15-year-old high school students
4. **Emails** daily digests to specified recipients
5. **Collects human feedback** on summaries and articles via thumbs up/down links in emails for future model fine-tuning

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **React** components for interactive UI

### Backend
- **Vercel Edge Functions** for serverless processing
- **OpenAI GPT-5-nano-2025-08-07** for intelligent summarization
- **Resend** for email delivery
- **Web scraping** with Cheerio and Axios
- **Feedback API** for silent human feedback collection

### Infrastructure
- **Vercel** for hosting and deployment
- **Vercel Cron Triggers** for daily execution
- **Environment variables** for secure configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key
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

**Important**: The system uses OpenAI's GPT-5-nano-2025-08-07 model for summarization. If you encounter quota exceeded errors:

1. **Check your OpenAI billing** at https://platform.openai.com/account/billing
2. **Upgrade your plan** if needed for higher usage limits
3. **Monitor usage** in your OpenAI dashboard
4. **Consider rate limiting** for production deployments

The system gracefully handles quota errors and will display appropriate messages to users.

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for GPT-4/5 access | Yes |
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
- Science Daily
- Nature
- Science
- Cell
- PNAS

## 📧 Email Configuration

### Resend Setup
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

### API Endpoints

- `POST /api/search` - Manual article search
- `POST /api/summarize` - Generate summaries
- `POST /api/email` - Send emails
- `GET /api/cron/daily-summary` - Daily cron job
- `GET /api/feedback` - **Silent feedback endpoint for thumbs up/down links in emails. Records recipient, summary/article, and feedback value. Returns 204 No Content.**

## 🗄️ Database & Data Retention

### Schema
- **Articles**: Retained for 30 days
- **Daily Summaries**: Retained for 30 days
- **Feedback**: Linked to recipient, summary, and article. Retained for at least 30 days for model fine-tuning.
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

1. **New Search Sources**: Add to `WebSearchModule` in `lib/webSearch.ts`
2. **Email Templates**: Modify `EmailService` in `lib/emailService.ts`
3. **UI Components**: Add to `components/` directory
4. **API Endpoints**: Create new routes in `app/api/`

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
1. Check the documentation
2. Review the code comments
3. Open an issue on GitHub

## 🎓 Educational Impact

This system is specifically designed to:
- Make complex synthetic biology research accessible to high school students
- Build excitement for science and biotechnology
- Provide daily exposure to cutting-edge developments
- Support STEM education initiatives

---

**Built with ❤️ for science education**

# NL2SQL Chat Application

A modern Next.js 14 application that allows users to interact with PostgreSQL databases using natural language queries. Built with shadcn/ui, Framer Motion, Sequelize, and Google Gemini API.

## Features

- 🗄️ **Database Connection**: Secure PostgreSQL connection with credential validation
- 💬 **Natural Language Queries**: Convert plain English to SQL using Google Gemini API
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- 🌙 **Dark/Light Theme**: Toggle between themes with smooth transitions
- ✨ **Smooth Animations**: Framer Motion animations throughout the app
- 🔒 **Security**: SQL injection prevention and query validation
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Real-time Schema**: Dynamic database schema discovery and display

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Database**: PostgreSQL with Sequelize ORM
- **AI**: Google Gemini API (gemini-pro model)
- **State Management**: React hooks + localStorage
- **Session Management**: HTTP-only cookies

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Google Gemini API key

## Installation

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd nl2sql-chat-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   \`\`\`env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   \`\`\`

4. **Initialize shadcn/ui** (if not already done)
   \`\`\`bash
   npx shadcn@latest init
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### 1. Database Connection
- Navigate to `/connect` or click "Connect to Database" on the home page
- Enter your PostgreSQL credentials:
  - Host (e.g., localhost)
  - User (e.g., postgres)
  - Password
  - Database name
  - Port (default: 5432)
- Click "Test Connection" to verify credentials
- Click "Connect & Continue" to proceed to the chat interface

### 2. Chat Interface
- View your database schema in the right panel
- Type natural language queries in the chat input
- Examples:
  - "Show me all users"
  - "What's the total revenue for 2023?"
  - "How many orders were placed last month?"
- Click on AI responses to view the generated SQL query
- Chat history is automatically saved to localStorage

## API Routes

### `/api/connect` (POST)
- Validates and tests PostgreSQL connection
- Creates secure session with connection details
- Returns success/error status

### `/api/session` (GET)
- Checks if user has active database session
- Used for authentication and routing

### `/api/schema` (GET)
- Fetches database schema dynamically
- Returns tables and column information
- Requires active session

### `/api/query` (POST)
- Processes natural language queries
- Generates SQL using Gemini API
- Executes queries safely with validation
- Returns human-like responses

## Security Features

- **SQL Injection Prevention**: Parameterized queries with Sequelize
- **Query Validation**: Blocks destructive operations (DROP, DELETE, etc.)
- **Session Security**: HTTP-only cookies with secure settings
- **Input Validation**: Comprehensive form and API validation
- **Connection Pooling**: Efficient database connection management

## Project Structure

\`\`\`
├── app/
│   ├── api/
│   │   ├── connect/route.ts      # Database connection API
│   │   ├── session/route.ts      # Session management API
│   │   ├── schema/route.ts       # Schema fetching API
│   │   └── query/route.ts        # Query processing API
│   ├── connect/
│   │   └── page.tsx              # Database connection page
│   ├── chat/
│   │   └── page.tsx              # Chat interface page
│   ├── layout.tsx                # Root layout with theme provider
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── theme-provider.tsx        # Theme context provider
│   └── theme-toggle.tsx          # Dark/light mode toggle
├── lib/
│   └── utils.ts                  # Utility functions
├── .env.local                    # Environment variables
├── tailwind.config.ts            # Tailwind configuration
├── next.config.mjs               # Next.js configuration
└── package.json                  # Dependencies and scripts
\`\`\`

## Environment Variables

Create a `.env.local` file with:

\`\`\`env
# Required
GEMINI_API_KEY=your_google_gemini_api_key

# Optional (for production)
NODE_ENV=production
\`\`\`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
1. Build the application: `npm run build`
2. Start the production server: `npm start`
3. Ensure environment variables are set

## Common Issues & Solutions

### Connection Issues
- Verify PostgreSQL server is running
- Check firewall settings for database port
- Ensure credentials are correct
- Test connection from command line first

### API Key Issues
- Verify Gemini API key is valid
- Check API quotas and billing
- Ensure key has proper permissions

### Build Issues
- Clear `.next` folder and rebuild
- Check Node.js version compatibility
- Verify all dependencies are installed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information

## Roadmap

- [ ] Query result visualization (charts/graphs)
- [ ] Query history with search
- [ ] Multiple database support
- [ ] Export query results
- [ ] Advanced SQL query builder
- [ ] User authentication and multi-tenancy
- [ ] Query performance analytics

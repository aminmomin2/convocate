# Convocate

A powerful chat application that allows users to upload conversation transcripts and create AI personas that can chat in the style of the original participants. Built with Next.js, TypeScript, and OpenAI.

## Features

- 🔄 **Multi-Format Support**: Import conversations from various formats:
  - WhatsApp export (TXT)
  - CSV with headers (sender,message,timestamp)
  - JSON arrays of messages
  - SMS Backup & Restore XML format

- 👥 **Persona Creation**: 
  - Create up to 2 personas per IP (yourself + one other person)
  - Automatic style analysis using GPT-3.5
  - Captures tone, formality, pacing, vocabulary, and unique quirks

- 💬 **Interactive Chat**:
  - Chat with AI personas that match the original conversation style
  - Real-time style scoring and improvement tips
  - Context-aware responses using conversation history

- 🔒 **Built-in Limits**:
  - 40 messages per IP address
  - 1MB file size limit
  - Rate limiting and usage tracking

## Getting Started

### Prerequisites

- Node.js 18+ 
- OpenAI API key

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/convocate.git
cd convocate
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create a \`.env.local\` file in the root directory:
\`\`\`env
OPENAI_API_KEY=your_api_key_here
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

The application will be available at [http://localhost:3000](http://localhost:3000).

## Usage

### Uploading Conversations

1. Navigate to the dashboard
2. Drag and drop your conversation file(s)
3. Supported formats:
   - TXT (WhatsApp format): \`[MM/DD/YY, HH:MM] Sender: Message\`
   - CSV: Headers \`sender,message,timestamp\`
   - JSON: Array of \`{sender, message, timestamp}\`
   - XML: SMS Backup & Restore format

### Creating Personas

- System automatically identifies the two most active participants
- Analyzes up to 75 messages per persona for style profiling
- Creates detailed style profiles including:
  - Overall tone
  - Formality level
  - Message pacing
  - Common vocabulary
  - Unique quirks

### Chatting

- Select a persona from the dashboard
- Start chatting naturally
- System maintains context from original conversations
- Receive style scores and improvement tips
- Monitor usage limits in real-time

## API Routes

### POST /api/upload

Upload conversation files and create personas.

- **Body**: FormData with \`files\` field
- **Response**: 
  \`\`\`typescript
  {
    sessionId: string;
    personas: StoredPersona[];
    autoSelectionInfo: any;
  }
  \`\`\`

### POST /api/chat

Send messages to a persona.

- **Body**:
  \`\`\`typescript
  {
    personaName: string;
    transcript: Msg[];
    chatHistory: Msg[];
    userMessage: string;
    styleProfile: StyleProfile;
  }
  \`\`\`
- **Response**:
  \`\`\`typescript
  {
    twinReply: string;
    score: number;
    tips: string[];
    usage: {
      totalMessagesUsed: number;
      maxMessagesPerIP: number;
      contextMessagesUsed: number;
    }
  }
  \`\`\`

## Limitations

- 2 personas per IP address (permanent limit)
- 40 total messages per IP address
- 1MB maximum file size
- In-memory rate limiting (resets on server restart)
- 20 messages maximum context window

## Development

### Scripts

- \`npm run dev\`: Start development server with Turbopack
- \`npm run build\`: Build for production
- \`npm run start\`: Start production server
- \`npm run lint\`: Run ESLint

### Project Structure

\`\`\`
convocate/
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/         # API routes
│   │   └── dashboard/   # Dashboard pages
│   ├── components/      # React components
│   ├── lib/            # Shared libraries
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
└── package.json        # Dependencies and scripts
\`\`\`

## Contributing

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/my-feature\`
3. Commit your changes: \`git commit -am 'Add my feature'\`
4. Push to the branch: \`git push origin feature/my-feature\`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
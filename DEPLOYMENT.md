# Production Deployment Guide

## Prerequisites

- Node.js 18+ 
- OpenAI API key with sufficient credits
- A hosting platform (Vercel, Netlify, Railway, etc.)

## Environment Setup

1. Copy `env.example` to `.env.local` and configure:
   ```bash
   cp env.example .env.local
   ```

2. Set your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_actual_api_key_here
   NODE_ENV=production
   ```

## Deployment Options

### Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel --prod
   ```

3. Set environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`

### Railway

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Netlify

1. Build command: `npm run build`
2. Publish directory: `.next`
3. Set environment variables in Netlify dashboard

### Docker

1. Create Dockerfile:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Build and run:
   ```bash
   docker build -t convocate .
   docker run -p 3000:3000 -e OPENAI_API_KEY=your_key convocate
   ```

## Production Considerations

### Security
- ✅ API keys are server-side only
- ✅ Rate limiting implemented
- ✅ File size limits enforced
- ✅ Input validation in place

### Performance
- ✅ Next.js optimized build
- ✅ Static generation where possible
- ✅ Efficient API calls with context limits

### Monitoring
- Monitor OpenAI API usage
- Track error rates
- Monitor response times

### Scaling
- Consider Redis for rate limiting in production
- Implement proper logging
- Set up monitoring and alerts

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version (18+ required)
2. **API errors**: Verify OpenAI API key and credits
3. **Rate limiting**: Check IP-based limits
4. **File upload fails**: Verify file size limits

### Support

For issues, check:
1. Browser console for client errors
2. Server logs for API errors
3. OpenAI API dashboard for usage/errors

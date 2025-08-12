# Deployment Guide 🚀

This guide provides comprehensive instructions for deploying Convocate to various platforms and environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
- [Docker Deployment](#docker-deployment)
- [AWS Deployment](#aws-deployment)
- [Google Cloud Platform](#google-cloud-platform)
- [Azure Deployment](#azure-deployment)
- [Self-Hosted Deployment](#self-hosted-deployment)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Analytics](#monitoring--analytics)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- **Node.js** 18+ (LTS recommended)
- **Git** for version control
- **OpenAI API Key** with GPT-5 Mini access
- **Domain name** (optional but recommended)
- **SSL certificate** (handled automatically by most platforms)

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_NAME=Convocate
NEXT_PUBLIC_APP_DESCRIPTION=AI-Powered Digital Twin Platform

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
```

### Environment Variable Descriptions

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key with GPT-5 Mini access |
| `NEXT_PUBLIC_APP_URL` | No | Public URL of your application |
| `NEXT_PUBLIC_APP_NAME` | No | Application name for meta tags |
| `NEXT_PUBLIC_APP_DESCRIPTION` | No | Application description for meta tags |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics tracking ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog analytics key |
| `SENTRY_DSN` | No | Sentry error tracking DSN |

## Vercel Deployment (Recommended)

Vercel is the recommended deployment platform for Next.js applications.

### Quick Deploy

1. **Connect your repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   ```

2. **Deploy from CLI**
   ```bash
   # Navigate to your project directory
   cd convocate
   
   # Deploy
   vercel --prod
   ```

3. **Set environment variables**
   ```bash
   vercel env add OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   ```

### GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

### Vercel Configuration

Create a `vercel.json` file in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

## Docker Deployment

### Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
# Use the official Node.js runtime as the base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
```

### Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  convocate:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - convocate
    restart: unless-stopped
```

### Build and Run

```bash
# Build the Docker image
docker build -t convocate .

# Run with Docker Compose
docker-compose up -d

# Or run directly with Docker
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key convocate
```

## AWS Deployment

### AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB application**
   ```bash
   eb init convocate --platform node.js --region us-east-1
   ```

3. **Create environment**
   ```bash
   eb create convocate-prod --envvars OPENAI_API_KEY=your_key
   ```

4. **Deploy**
   ```bash
   eb deploy
   ```

### AWS ECS with Fargate

1. **Create ECR repository**
   ```bash
   aws ecr create-repository --repository-name convocate
   ```

2. **Build and push image**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
   docker build -t convocate .
   docker tag convocate:latest your-account.dkr.ecr.us-east-1.amazonaws.com/convocate:latest
   docker push your-account.dkr.ecr.us-east-1.amazonaws.com/convocate:latest
   ```

3. **Create ECS cluster and service**
   ```bash
   # Create cluster
   aws ecs create-cluster --cluster-name convocate-cluster
   
   # Create task definition and service
   # (Use AWS Console or CloudFormation for this step)
   ```

## Google Cloud Platform

### Google Cloud Run

1. **Install Google Cloud CLI**
   ```bash
   # Follow instructions at https://cloud.google.com/sdk/docs/install
   gcloud init
   ```

2. **Enable required APIs**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   ```

3. **Deploy to Cloud Run**
   ```bash
   gcloud run deploy convocate \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars OPENAI_API_KEY=your_key
   ```

## Azure Deployment

### Azure App Service

1. **Install Azure CLI**
   ```bash
   # Follow instructions at https://docs.microsoft.com/en-us/cli/azure/install-azure-cli
   az login
   ```

2. **Create App Service**
   ```bash
   az group create --name convocate-rg --location eastus
   az appservice plan create --name convocate-plan --resource-group convocate-rg --sku B1
   az webapp create --name convocate --resource-group convocate-rg --plan convocate-plan --runtime "NODE|18-lts"
   ```

3. **Deploy**
   ```bash
   az webapp deployment source config-local-git --name convocate --resource-group convocate-rg
   git remote add azure <git-url-from-previous-command>
   git push azure main
   ```

## Self-Hosted Deployment

### Ubuntu Server Setup

1. **Install dependencies**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm nginx certbot python3-certbot-nginx
   ```

2. **Clone and setup application**
   ```bash
   git clone https://github.com/yourusername/convocate.git
   cd convocate
   npm install
   npm run build
   ```

3. **Setup PM2 for process management**
   ```bash
   npm install -g pm2
   pm2 start npm --name "convocate" -- start
   pm2 startup
   pm2 save
   ```

4. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/convocate
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Enable site and SSL**
   ```bash
   sudo ln -s /etc/nginx/sites-available/convocate /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d your-domain.com
   ```

## Performance Optimization

### Build Optimization

1. **Enable Next.js optimizations**
   ```javascript
   // next.config.ts
   const nextConfig = {
     output: 'standalone',
     experimental: {
       optimizeCss: true,
       optimizePackageImports: ['lucide-react'],
     },
     compress: true,
     poweredByHeader: false,
   };
   ```

2. **Image optimization**
   ```javascript
   // next.config.ts
   const nextConfig = {
     images: {
       formats: ['image/webp', 'image/avif'],
       deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
       imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
     },
   };
   ```

### Caching Strategy

1. **API Route caching**
   ```typescript
   // src/app/api/upload/route.ts
   export const runtime = 'nodejs';
   export const maxDuration = 30;
   
   // Add caching headers
   const response = NextResponse.json(data);
   response.headers.set('Cache-Control', 'public, max-age=3600');
   return response;
   ```

2. **Static asset caching**
   ```javascript
   // next.config.ts
   const nextConfig = {
     async headers() {
       return [
         {
           source: '/static/:path*',
           headers: [
             {
               key: 'Cache-Control',
               value: 'public, max-age=31536000, immutable',
             },
           ],
         },
       ];
     },
   };
   ```

## Monitoring & Analytics

### Error Tracking

1. **Sentry Integration**
   ```bash
   npm install @sentry/nextjs
   ```

   ```javascript
   // sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     tracesSampleRate: 1.0,
   });
   ```

2. **Health Check Endpoint**
   ```typescript
   // src/app/api/health/route.ts
   import { NextResponse } from 'next/server';

   export async function GET() {
     return NextResponse.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       version: process.env.npm_package_version || '1.0.0',
     });
   }
   ```

### Performance Monitoring

1. **Google Analytics**
   ```typescript
   // src/app/layout.tsx
   import Script from 'next/script';

   export default function RootLayout({ children }) {
     return (
       <html>
         <head>
           <Script
             src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
             strategy="afterInteractive"
           />
           <Script id="google-analytics" strategy="afterInteractive">
             {`
               window.dataLayer = window.dataLayer || [];
               function gtag(){dataLayer.push(arguments);}
               gtag('js', new Date());
               gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
             `}
           </Script>
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

## Security Considerations

### Environment Variables

- Never commit API keys to version control
- Use environment-specific configuration
- Rotate API keys regularly
- Use secrets management services

### API Security

1. **Rate Limiting**
   ```typescript
   // src/middleware.ts
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   const rateLimit = new Map();

   export function middleware(request: NextRequest) {
     const ip = request.ip || 'unknown';
     const now = Date.now();
     const windowMs = 15 * 60 * 1000; // 15 minutes
     const maxRequests = 100;

     if (!rateLimit.has(ip)) {
       rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
     } else {
       const user = rateLimit.get(ip);
       if (now > user.resetTime) {
         user.count = 1;
         user.resetTime = now + windowMs;
       } else if (user.count >= maxRequests) {
         return NextResponse.json(
           { error: 'Rate limit exceeded' },
           { status: 429 }
         );
       } else {
         user.count++;
       }
     }

     return NextResponse.next();
   }

   export const config = {
     matcher: '/api/:path*',
   };
   ```

2. **CORS Configuration**
   ```typescript
   // src/app/api/upload/route.ts
   export async function POST(request: Request) {
     // Add CORS headers
     const response = NextResponse.json(data);
     response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
     response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
     response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
     return response;
   }
   ```

### Content Security Policy

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.openai.com;"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

2. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

3. **API Timeouts**
   ```typescript
   // Increase timeout in API routes
   export const maxDuration = 60; // 60 seconds
   ```

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check environment variables
echo $OPENAI_API_KEY

# Test API endpoints
curl -X POST http://localhost:3000/api/health
```

### Logs

```bash
# Vercel logs
vercel logs

# Docker logs
docker logs convocate

# PM2 logs
pm2 logs convocate
```

---

For additional support, please refer to the [README.md](README.md) or create an issue on GitHub.

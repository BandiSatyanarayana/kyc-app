# 🚀 Deployment Guide - Bharat KYC App on Render

## 📋 Overview

This guide will walk you through deploying the **Bharat KYC App** to Render, a modern cloud platform that offers seamless deployment for web services, databases, and static sites.

## 🎯 What We're Deploying

- **Main Web Service**: Node.js API server with Express
- **PostgreSQL Database**: For data storage
- **Redis Cache**: For session management and caching
- **Static Documentation**: Project docs and wireframes
- **SDK Files**: Source code and modules

## 🛠️ Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in the GitHub repo
3. **Environment Variables**: Prepare your secrets and configuration

## 📦 Deployment Files Created

- `render.yaml` - Render service configuration
- `src/backend/server.js` - Main server application
- `Dockerfile` - Container configuration
- `docker-compose.yml` - Local development setup
- `nginx.conf` - Reverse proxy configuration
- `deploy.sh` - Deployment script

## 🚀 Step-by-Step Deployment

### Step 1: Connect GitHub Repository

1. **Log into Render Dashboard**
2. **Click "New +"** → **"Blueprint"**
3. **Connect your GitHub account**
4. **Select repository**: `BandiSatyanarayana/kyc-app`
5. **Choose "render.yaml"** for blueprint deployment

### Step 2: Configure Environment Variables

In Render Dashboard, add these environment variables:

#### Required Variables:
```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
```

#### Database Variables (will be auto-generated):
```bash
DATABASE_URL=postgresql://user:password@host:port/database
REDIS_URL=redis://user:password@host:port
```

#### Optional Variables:
```bash
CORS_ORIGIN=https://your-domain.onrender.com
LOG_LEVEL=info
API_VERSION=v1
```

### Step 3: Deploy Services

The `render.yaml` will automatically create:

1. **bharat-kyc-app** (Web Service)
   - Environment: Node.js
   - Plan: Starter ($7/month)
   - Auto-deploy: Enabled

2. **bharat-kyc-db** (PostgreSQL)
   - Environment: PostgreSQL
   - Plan: Starter ($7/month)
   - Auto-deploy: Enabled

3. **bharat-kyc-redis** (Redis)
   - Environment: Redis
   - Plan: Starter ($7/month)
   - Auto-deploy: Enabled

4. **bharat-kyc-docs** (Static Site)
   - Environment: Static Site
   - Plan: Free
   - Auto-deploy: Enabled

### Step 4: Verify Deployment

After deployment, verify these endpoints:

```bash
# Health Check
https://bharat-kyc-app.onrender.com/health

# API Status
https://bharat-kyc-app.onrender.com/api/v1/status

# SDK Information
https://bharat-kyc-app.onrender.com/api/v1/sdk

# Documentation
https://bharat-kyc-docs.onrender.com

# Wireframes
https://bharat-kyc-app.onrender.com/wireframes

# SDK Files
https://bharat-kyc-app.onrender.com/sdk
```

## 🔧 Local Development Setup

### Using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/BandiSatyanarayana/kyc-app.git
cd kyc-app

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f bharat-kyc-app

# Stop services
docker-compose down
```

### Using Node.js directly:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Monitoring & Logs

### Render Dashboard:
- **Logs**: View real-time application logs
- **Metrics**: Monitor CPU, memory, and network usage
- **Health Checks**: Automatic health monitoring
- **Deployments**: Track deployment history

### Application Logs:
```bash
# View application logs
curl https://bharat-kyc-app.onrender.com/health

# Check API status
curl https://bharat-kyc-app.onrender.com/api/v1/status
```

## 🔒 Security Considerations

### Environment Variables:
- ✅ Never commit secrets to Git
- ✅ Use Render's secure environment variable storage
- ✅ Rotate JWT secrets regularly
- ✅ Use strong passwords for databases

### Security Headers:
- ✅ Helmet.js for security headers
- ✅ CORS configuration
- ✅ Rate limiting with nginx
- ✅ Input validation and sanitization

## 📈 Scaling & Performance

### Render Plans:
- **Starter**: $7/month (good for development)
- **Standard**: $25/month (production ready)
- **Pro**: $100/month (high traffic)

### Performance Optimization:
- ✅ Gzip compression enabled
- ✅ Static file caching
- ✅ Database connection pooling
- ✅ Redis caching layer

## 🚨 Troubleshooting

### Common Issues:

1. **Build Failures**:
   ```bash
   # Check build logs in Render dashboard
   # Verify package.json dependencies
   # Check Node.js version compatibility
   ```

2. **Database Connection Issues**:
   ```bash
   # Verify DATABASE_URL format
   # Check database service status
   # Ensure proper network connectivity
   ```

3. **Health Check Failures**:
   ```bash
   # Check application logs
   # Verify PORT configuration
   # Test health endpoint locally
   ```

### Debug Commands:
```bash
# Check application status
curl -v https://bharat-kyc-app.onrender.com/health

# Test API endpoints
curl https://bharat-kyc-app.onrender.com/api/v1/status

# View deployment logs
# (Use Render dashboard for this)
```

## 🔄 Continuous Deployment

### Automatic Deployments:
- ✅ Push to `master` branch triggers deployment
- ✅ Environment variables are preserved
- ✅ Zero-downtime deployments
- ✅ Automatic rollback on failures

### Manual Deployments:
```bash
# Trigger manual deployment from Render dashboard
# Or push a new commit to trigger auto-deploy
git add .
git commit -m "Update deployment configuration"
git push origin master
```

## 📞 Support & Resources

### Render Documentation:
- [Render Docs](https://render.com/docs)
- [Node.js Deployment](https://render.com/docs/deploy-node-express-app)
- [PostgreSQL Setup](https://render.com/docs/create-a-postgresql-database)
- [Redis Setup](https://render.com/docs/create-a-redis-instance)

### Application URLs:
- **Main App**: `https://bharat-kyc-app.onrender.com`
- **Documentation**: `https://bharat-kyc-docs.onrender.com`
- **API Docs**: `https://bharat-kyc-app.onrender.com/api/docs`

## ✅ Success Checklist

- [ ] All services deployed successfully
- [ ] Health checks passing
- [ ] Environment variables configured
- [ ] Database connections working
- [ ] API endpoints responding
- [ ] Documentation accessible
- [ ] Wireframes loading
- [ ] SDK files available
- [ ] Monitoring set up
- [ ] Security measures in place

---

**🎉 Your Bharat KYC App is now live on Render!**

*For additional support, refer to the Render documentation or contact the development team.*

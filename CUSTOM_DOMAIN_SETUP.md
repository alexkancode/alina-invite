# Custom Domain Setup Guide

This guide provides step-by-step instructions for setting up a custom domain using Namecheap domain registration, Cloudflare DNS management, and Railway hosting integration.

## Overview

**Recommended Architecture:**
- **Domain Registrar**: Namecheap (cost-effective, reliable)
- **DNS Management**: Cloudflare (free tier includes CDN, SSL, DDoS protection)
- **Hosting**: Railway (current deployment platform)

## Prerequisites

- Access to Railway project: `party-app`
- Domain name decided (example: `yourparty.com`)
- Credit card for domain registration

## Step-by-Step Setup

### Phase 1: Domain Registration (Namecheap)

1. **Register Domain**
   ```bash
   # Go to https://www.namecheap.com
   # Search for your desired domain
   # Complete purchase (typically $8-15/year for .com)
   ```

2. **Set Nameservers to Cloudflare**
   - Login to Namecheap dashboard
   - Go to Domain List > Manage
   - Under "Nameservers", select "Custom DNS"
   - Set to Cloudflare nameservers:
     ```
     ayla.ns.cloudflare.com
     ivan.ns.cloudflare.com
     ```

### Phase 2: Cloudflare Setup

1. **Add Site to Cloudflare**
   ```bash
   # Go to https://cloudflare.com
   # Sign up for free account
   # Click "Add a Site"
   # Enter your domain: yourparty.com
   # Select "Free" plan
   ```

2. **Configure DNS Records**
   - Cloudflare will scan existing records
   - Delete any placeholder records
   - Add these records:

   **For Railway Integration:**
   ```
   Type: CNAME
   Name: @
   Content: <your-railway-domain>.railway.app
   Proxy: Enabled (Orange cloud)

   Type: CNAME  
   Name: www
   Content: <your-railway-domain>.railway.app
   Proxy: Enabled (Orange cloud)
   ```

   **Get Railway domain:**
   ```bash
   # In your project directory:
   railway service link party-app
   railway domain
   # This will show your current Railway URL like: party-app-production-xxxx.up.railway.app
   ```

3. **SSL/TLS Configuration**
   - Go to SSL/TLS > Overview
   - Set to "Flexible" or "Full (strict)" if Railway has SSL
   - Enable "Always Use HTTPS" under Edge Certificates

### Phase 3: Railway Configuration

1. **Add Custom Domain to Railway**
   ```bash
   # Connect to your Railway project
   railway service link party-app
   
   # Add your domain
   railway domain add yourparty.com
   railway domain add www.yourparty.com
   ```

2. **Update Environment Variables (if needed)**
   ```bash
   # If your app checks domain/origin
   railway env set ALLOWED_ORIGINS="https://yourparty.com,https://www.yourparty.com"
   
   # Update any domain-specific configs
   railway env set DOMAIN="yourparty.com"
   ```

3. **Deploy with Domain**
   ```bash
   # Ensure latest deployment
   npm run build
   railway up --detach
   ```

### Phase 4: Verification & Testing

1. **DNS Propagation Check**
   ```bash
   # Check if DNS has propagated (may take 24-48 hours)
   nslookup yourparty.com
   dig yourparty.com
   
   # Online tools:
   # https://dnschecker.org
   # https://www.whatsmydns.net
   ```

2. **SSL Certificate Verification**
   ```bash
   # Check SSL certificate
   openssl s_client -connect yourparty.com:443 -servername yourparty.com
   
   # Or visit: https://www.ssllabs.com/ssltest/
   ```

3. **Application Testing**
   - Visit `https://yourparty.com`
   - Test photo uploads
   - Test admin panel: `https://yourparty.com/admin?password=admin123`
   - Test all API endpoints
   - Verify mobile responsiveness

## Railway Domain Management Commands

```bash
# List current domains
railway domain

# Add domain
railway domain add yourparty.com

# Remove domain  
railway domain remove yourparty.com

# Check deployment status
railway service status

# View deployment logs
railway logs --follow
```

## Cloudflare Optimization Settings

### Recommended Settings for Performance

1. **Speed > Optimization**
   - Auto Minify: Enable CSS, JavaScript, HTML
   - Rocket Loader: Enable
   - Mirage: Enable (for images)

2. **Caching > Configuration**
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours
   - Development Mode: Off (for production)

3. **Security > Settings**
   - Security Level: Medium
   - Challenge Passage: 30 minutes
   - Browser Integrity Check: On

### Page Rules for Photo System

Add these page rules for optimal performance:

```
1. Pattern: yourparty.com/alina/thumbs/*
   Settings: 
   - Cache Level: Cache Everything
   - Edge Cache TTL: 1 month
   - Browser Cache TTL: 1 day

2. Pattern: yourparty.com/api/*
   Settings:
   - Cache Level: Bypass
   - Disable Performance features
```

## Troubleshooting

### Common Issues

1. **"This site can't be reached"**
   ```bash
   # Check DNS propagation
   nslookup yourparty.com 8.8.8.8
   
   # Verify Railway domain is added
   railway domain list
   ```

2. **SSL Certificate Errors**
   - Wait 15-30 minutes for certificate generation
   - Check Cloudflare SSL/TLS settings
   - Ensure "Always Use HTTPS" is enabled

3. **404 Errors on Railway App**
   ```bash
   # Verify deployment
   railway logs | tail -50
   
   # Check service status
   railway service status
   
   # Redeploy if needed
   railway up --detach
   ```

4. **Cloudflare "Too Many Redirects"**
   - Change SSL/TLS setting from "Flexible" to "Full"
   - Check origin server (Railway) SSL configuration

### Testing Commands

```bash
# Quick domain test script
curl -I https://yourparty.com
curl -I https://www.yourparty.com

# Test specific endpoints
curl https://yourparty.com/api/health
curl https://yourparty.com/admin

# Check response headers
curl -I https://yourparty.com | grep -E "(server|cf-|x-)"
```

## Cost Breakdown

- **Domain (Namecheap)**: $8-15/year
- **Cloudflare**: Free tier sufficient
- **Railway**: Existing cost (no additional domain fees)

**Total Additional Cost**: ~$10-15/year

## Security Considerations

1. **Admin Panel Protection**
   - Change default password in `/src/pages/admin/index.astro`
   - Consider IP whitelisting for admin access
   - Set up proper authentication in production

2. **Cloudflare Security**
   - Enable Bot Fight Mode
   - Set up rate limiting rules
   - Consider enabling Under Attack mode during high traffic

3. **Railway Environment**
   - Rotate sensitive environment variables
   - Enable deployment protection
   - Review access logs regularly

## Next Steps After Domain Setup

1. **Update Application Configuration**
   - Update any hardcoded URLs
   - Configure CORS policies
   - Update social media sharing metadata

2. **SEO & Analytics**
   - Set up Google Analytics
   - Configure Google Search Console
   - Add meta tags and Open Graph data

3. **Monitoring**
   - Set up Cloudflare analytics
   - Configure uptime monitoring
   - Set up error alerting

---

## Support Contacts

- **Namecheap**: https://www.namecheap.com/support/
- **Cloudflare**: https://support.cloudflare.com/
- **Railway**: https://help.railway.app/

For any issues with this setup process, check the troubleshooting section first, then consult the relevant service's support documentation.
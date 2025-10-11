# Deployment Guide - HideMyBrowser on Vercel

## ✅ Deployment Status

Your HideMyBrowser application has been successfully deployed to Vercel!

### Live URLs

- **Production**: https://hidemybrowser-lokeshaps-projects.vercel.app
- **Git Branch**: https://hidemybrowser-git-main-lokeshaps-projects.vercel.app

## 🌐 Adding Your Custom Domain (hidemybrowser.com)

### Step 1: Add Domain in Vercel

1. Go to your Vercel project dashboard:
   ```
   https://vercel.com/lokeshaps-projects/hidemybrowser/settings/domains
   ```

2. Click **"Add Domain"**

3. Enter your domain: `hidemybrowser.com`

4. Click **"Add"**

### Step 2: Get DNS Configuration from Vercel

Vercel will provide you with DNS records. Typically, these will be:

- **A Record**: 
  - Type: `A`
  - Name: `@`
  - Value: `76.76.21.21` (Vercel's IP)
  
- **CNAME Record** (for www subdomain):
  - Type: `CNAME`
  - Name: `www`
  - Value: `cname.vercel-dns.com`

### Step 3: Update DNS in Hostinger

1. Log in to your Hostinger account

2. Go to **DNS / Nameservers** for `hidemybrowser.com`

3. **Update/Add the A Record**:
   - Delete the existing A record pointing to `84.32.84.32`
   - Add new A record:
     - Type: `A`
     - Name: `@`
     - Points to: `76.76.21.21`
     - TTL: `300` (or leave default)

4. **Update the CNAME Record**:
   - Update the existing CNAME record for `www`:
     - Type: `CNAME`
     - Name: `www`
     - Points to: `cname.vercel-dns.com`
     - TTL: `300`

5. **Keep the CAA Records**: These are fine and allow SSL certificates from various providers including Let's Encrypt which Vercel uses.

### Step 4: Wait for DNS Propagation

- DNS changes can take anywhere from **5 minutes to 48 hours** to propagate globally
- You can check DNS propagation status at: https://www.whatsmydns.net/
- Vercel will automatically provision an SSL certificate once DNS is verified

## 🔐 Configure Environment Variables

**CRITICAL**: Your application needs environment variables to function properly!

### Step 1: Go to Environment Variables Settings

```
https://vercel.com/lokeshaps-projects/hidemybrowser/settings/environment-variables
```

### Step 2: Add the Following Variables

Add each variable for **Production**, **Preview**, and **Development** environments:

#### Supabase Configuration

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
   - Available in: Supabase Dashboard → Project Settings → API

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Value: Your Supabase anonymous/public key
   - Available in: Supabase Dashboard → Project Settings → API

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (keep secret!)
   - Available in: Supabase Dashboard → Project Settings → API
   - ⚠️ **Important**: Only select **Production** for this one!

#### DodoPayments Configuration

4. **DODOPAYMENTS_API_KEY**
   - Value: Your DodoPayments API key
   - Available in: DodoPayments Dashboard → API Keys
   - ⚠️ **Important**: Only select **Production** for this one!

5. **NEXT_PUBLIC_DODOPAYMENTS_BUSINESS_ID**
   - Value: Your DodoPayments Business ID
   - Available in: DodoPayments Dashboard

#### Application URLs

6. **NEXT_PUBLIC_SITE_URL**
   - For Production: `https://hidemybrowser.com`
   - For Preview: `https://hidemybrowser-git-main-lokeshaps-projects.vercel.app`
   - For Development: `http://localhost:3000`

### Step 3: Redeploy After Adding Variables

After adding all environment variables:

1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

## 🔄 Update Supabase Auth Redirect URLs

### In Supabase Dashboard

1. Go to: **Authentication → URL Configuration**

2. Add these **Site URL** and **Redirect URLs**:
   ```
   https://hidemybrowser.com
   https://hidemybrowser-lokeshaps-projects.vercel.app
   https://hidemybrowser.com/auth/callback
   https://hidemybrowser-lokeshaps-projects.vercel.app/auth/callback
   ```

3. Save changes

## 🔔 Update DodoPayments Webhook URL

### In DodoPayments Dashboard

1. Go to: **Settings → Webhooks**

2. Update/Add webhook endpoint:
   ```
   https://hidemybrowser.com/api/webhooks/dodopayments
   ```

3. Ensure these events are selected:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `payment.succeeded`
   - `payment.failed`

4. Save the webhook configuration

## 🎉 Verification Checklist

Once everything is configured, verify:

- [ ] Custom domain resolves to Vercel (check whatsmydns.net)
- [ ] SSL certificate is active (https:// works)
- [ ] All environment variables are set in Vercel
- [ ] Application loads without errors
- [ ] Authentication works (sign in/sign up)
- [ ] Payment checkout flow works
- [ ] Webhooks are received from DodoPayments

## 📊 Monitoring Your Deployment

### Vercel Dashboard

- **Analytics**: https://vercel.com/lokeshaps-projects/hidemybrowser/analytics
- **Logs**: https://vercel.com/lokeshaps-projects/hidemybrowser/logs
- **Deployments**: https://vercel.com/lokeshaps-projects/hidemybrowser/deployments

### Useful Commands

```bash
# View deployment logs
npx vercel logs

# Check deployment status
npx vercel inspect [deployment-url]

# Force redeploy
git commit --allow-empty -m "chore: Force redeploy"
git push
```

## 🚨 Troubleshooting

### Domain Not Working

- **Check DNS propagation**: Use whatsmydns.net
- **Verify DNS records**: Ensure A record points to correct Vercel IP
- **Wait**: DNS can take up to 48 hours to fully propagate

### Build Failures

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify `vercel.json` configuration is correct

### Environment Variables Not Working

- Redeploy after adding environment variables
- Check variable names match exactly (case-sensitive)
- Verify variables are enabled for correct environments

### Authentication Issues

- Verify Supabase redirect URLs include your Vercel domain
- Check that `NEXT_PUBLIC_SITE_URL` is set correctly
- Clear browser cookies and try again

### Payment/Webhook Issues

- Verify DodoPayments webhook URL is updated
- Check webhook logs in DodoPayments dashboard
- Ensure `DODOPAYMENTS_API_KEY` is set correctly

## 📝 Automatic Deployments

Your repository is now connected to Vercel. Every time you push to the `main` branch:

1. Vercel automatically detects the push
2. Runs the build process
3. Deploys the new version
4. Your site updates automatically!

### Branch Deployments

- Each branch gets its own preview deployment
- Pull requests get unique preview URLs
- Perfect for testing before merging to `main`

## 🎯 Next Steps

1. ✅ Add custom domain DNS records in Hostinger
2. ✅ Configure all environment variables in Vercel
3. ✅ Update Supabase redirect URLs
4. ✅ Update DodoPayments webhook URL
5. ✅ Test the complete user flow
6. ✅ Monitor logs and analytics

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Custom Domains Guide](https://vercel.com/docs/concepts/projects/domains)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [DodoPayments Documentation](https://dodopayments.com/docs)

---

**Congratulations!** 🎉 Your HideMyBrowser application is now deployed to production!


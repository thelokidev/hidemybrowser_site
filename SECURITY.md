# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an email to the repository owner. All security vulnerabilities will be promptly addressed.

Please do not open public issues for security vulnerabilities.

## Security Best Practices

### Environment Variables

This project uses environment variables to store sensitive information. **Never commit the following files:**

- `.env.local` - Local environment configuration
- `.env` - Environment files
- `mcp.json` - MCP configuration with API tokens

### Required Environment Variables

The following environment variables must be set:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# DodoPayments Configuration
DODOPAYMENTS_API_KEY=your-dodopayments-api-key
NEXT_PUBLIC_DODOPAYMENTS_BUSINESS_ID=your-dodopayments-business-id

# Application URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### API Keys and Tokens

- **Never commit API keys, tokens, or secrets** to version control
- Use `.env.local` for local development secrets
- Use environment variables in your deployment platform for production
- Rotate API keys and tokens regularly
- Use the principle of least privilege when creating API keys

### GitHub Personal Access Tokens

If you use the GitHub MCP server:

1. Create a personal access token with minimal required permissions
2. Store it in `mcp.json` (which is gitignored)
3. Use `mcp.json.example` as a template
4. Never commit `mcp.json` to version control

### Supabase Security

- Enable Row Level Security (RLS) on all tables
- Use service role key only in server-side code
- Never expose service role key to the client
- Implement proper authentication and authorization

### DodoPayments Webhooks

- Verify webhook signatures
- Use HTTPS for webhook endpoints in production
- Validate all webhook payload data
- Implement idempotency for webhook processing

## Secure Development Workflow

1. **Before Committing:**
   - Review your changes for secrets
   - Run `git status` and verify no sensitive files are staged
   - Use `git diff --staged` to review changes

2. **If You Accidentally Commit a Secret:**
   - **Immediately revoke/rotate the exposed secret**
   - Remove it from git history (see below)
   - Force push the cleaned history
   - Never assume the secret is safe

3. **Removing Secrets from Git History:**
   ```bash
   # Remove file from all commits
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (coordinate with team first!)
   git push origin --force --all
   ```

## Dependencies

- Keep all dependencies up to date
- Regularly run `npm audit` to check for vulnerabilities
- Review dependency updates before applying them
- Use `npm audit fix` to automatically fix vulnerabilities

## Authentication

This application uses:
- Supabase Auth with PKCE flow
- OAuth providers (Google, GitHub)
- Magic link email authentication

Ensure all authentication flows are tested and secure.

## HTTPS

- Always use HTTPS in production
- Configure proper SSL/TLS certificates
- Enable HSTS headers
- Use secure cookies (httpOnly, secure, sameSite)

## Content Security Policy

Consider implementing CSP headers in production to prevent XSS attacks.

## Regular Security Audits

- Review access logs regularly
- Monitor for suspicious activity
- Keep all systems and dependencies updated
- Perform security reviews before major releases

## Contact

For security concerns, contact the repository owner directly through GitHub.


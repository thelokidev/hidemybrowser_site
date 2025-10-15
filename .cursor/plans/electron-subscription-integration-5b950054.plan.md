<!-- 5b950054-4060-4cc3-9a34-51e0710d1aa0 dff1610d-b778-4696-b52d-6eea6192cae6 -->
# Web App Codebase Analysis Plan

## Overview

Before implementing desktop app integration, we need to thoroughly analyze your existing web app to understand:

1. Current file structure and organization
2. Supabase client setup and usage patterns
3. Authentication flow implementation
4. Database schema and table relationships
5. API route patterns and conventions
6. TypeScript types and interfaces
7. Error handling patterns
8. Environment variable usage

This analysis will ensure the desktop integration plan matches your exact codebase structure and conventions.

---

## Phase 1: Project Structure Discovery

### 1.1 Root Directory Analysis

**Goal:** Understand project layout and framework setup

**Files to examine:**

- `package.json` - Dependencies, scripts, project metadata
- `next.config.js` or `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `.env.local` or `.env.example` - Environment variables
- `middleware.ts` - Route protection and middleware logic
- `README.md` - Project documentation

**Questions to answer:**

- What Next.js version is being used?
- What dependencies are installed (Supabase, payment libraries, etc.)?
- What build scripts are available?
- What environment variables are required?
- Are there any custom middleware configurations?

### 1.2 App Directory Structure

**Goal:** Map out the App Router structure

**Directories to explore:**

```
app/
├─ (auth)/          # Auth-related routes
├─ (marketing)/     # Public pages (landing, pricing)
├─ (app)/           # Protected app routes
├─ api/             # API routes
├─ admin/           # Admin routes
└─ ...
```

**Files to examine:**

- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page
- Route group structures
- Loading and error boundaries

**Questions to answer:**

- How are routes organized (route groups)?
- What layouts are used?
- Are there any special route handlers?
- How is the app structured (marketing vs app vs admin)?

---

## Phase 2: Authentication Implementation

### 2.1 Supabase Client Setup

**Goal:** Understand how Supabase is initialized and used

**Files to examine:**

- `lib/supabase/client.ts` or similar
- `lib/supabase/server.ts` or similar
- `lib/supabase/middleware.ts` or similar
- `utils/supabase/` directory

**Questions to answer:**

- How is the Supabase client created (client-side vs server-side)?
- What authentication methods are configured?
- Are there custom Supabase utilities?
- How are cookies handled?
- Is there a singleton pattern or factory function?

### 2.2 Authentication Flow

**Goal:** Map the current authentication implementation

**Files to examine:**

- `app/(auth)/auth/page.tsx` - Auth page UI
- `app/(auth)/auth/callback/route.ts` - OAuth callback handler
- `app/(auth)/login/` - Login components
- `app/(auth)/signup/` - Signup components
- `components/auth/` - Auth-related components

**Questions to answer:**

- What OAuth providers are configured (Google, GitHub)?
- How is the auth callback currently handled?
- What happens after successful authentication?
- Are there any custom auth components?
- How are auth errors handled?
- What is the redirect flow after login?

### 2.3 Session Management

**Goal:** Understand how user sessions are managed

**Files to examine:**

- `middleware.ts` - Session validation
- `hooks/useUser.ts` or similar - User state management
- `contexts/AuthContext.tsx` - Auth context (if exists)
- Server components using `supabase.auth.getUser()`

**Questions to answer:**

- How are sessions validated on protected routes?
- Where is user data stored (context, hooks, server components)?
- How are tokens refreshed?
- What happens when a session expires?

---

## Phase 3: Database Schema & Subscriptions

### 3.1 Database Schema

**Goal:** Document the exact database structure

**Files to examine:**

- `supabase/migrations/` - Migration files
- `lib/database.types.ts` - Generated TypeScript types
- `types/database.ts` - Custom database types

**Tables to document:**

```
customers
├─ id
├─ user_id (FK to auth.users)
├─ email
├─ dodo_customer_id
└─ ...

subscriptions
├─ id
├─ user_id (FK to auth.users)
├─ customer_id (FK to customers)
├─ product_id
├─ status
├─ current_period_start
├─ current_period_end
├─ cancel_at_period_end
└─ ...

products (if exists)
├─ id
├─ name
├─ price_amount
└─ ...
```

**Questions to answer:**

- What are the exact table names and column names?
- What are the relationships between tables?
- Are there any views or functions?
- What are the primary and foreign keys?
- Are there any RLS (Row Level Security) policies?

### 3.2 Subscription Logic

**Goal:** Understand how subscriptions are queried and validated

**Files to examine:**

- `lib/subscription.ts` - Subscription utilities
- `app/api/subscription/` - Subscription API routes
- `hooks/useSubscription.ts` - Subscription hooks
- `utils/subscription.ts` - Helper functions

**Questions to answer:**

- How is subscription status checked?
- What statuses are considered "active"?
- How are subscription tiers mapped?
- Are there any grace periods?
- How are plan changes handled?

---

## Phase 4: API Routes & Patterns

### 4.1 Existing API Routes

**Goal:** Understand API route structure and patterns

**Files to examine:**

```
app/api/
├─ webhooks/
│  └─ dodopayments/
│     └─ route.ts
├─ subscription/
│  └─ route.ts
├─ admin/
│  └─ ...
└─ ...
```

**Questions to answer:**

- What API routes currently exist?
- What is the naming convention?
- How are requests authenticated?
- What response format is used?
- How are errors handled?
- Are there any middleware or guards?

### 4.2 API Response Patterns

**Goal:** Match the existing response format

**Example patterns to identify:**

```typescript
// Pattern 1: Success/Error wrapper
{ success: boolean, data?: any, error?: string }

// Pattern 2: Direct data return
{ id: string, name: string, ... }

// Pattern 3: NextResponse with status
NextResponse.json({ ... }, { status: 200 })
```

**Questions to answer:**

- What is the standard response structure?
- How are errors formatted?
- What HTTP status codes are used?
- Are there any custom headers?

---

## Phase 5: Payment Integration

### 5.1 DodoPayments Setup

**Goal:** Understand payment flow and webhook handling

**Files to examine:**

- `app/api/webhooks/dodopayments/route.ts` - Webhook handler
- `lib/dodopayments.ts` - DodoPayments utilities
- `components/payment/` - Payment components
- `app/(app)/pricing/` - Pricing page

**Questions to answer:**

- How are DodoPayments webhooks processed?
- What events are handled?
- How are product IDs stored?
- What is the payment modal implementation?
- How are subscriptions created/updated?

### 5.2 Product Configuration

**Goal:** Get exact product IDs and pricing

**Data to extract:**

- Product IDs for each tier (weekly, monthly, 3-month, 6-month)
- Price amounts
- Product names
- Billing intervals

**Sources:**

- Database query: `SELECT * FROM products`
- Environment variables
- Configuration files
- Pricing page component

---

## Phase 6: TypeScript Types & Interfaces

### 6.1 Type Definitions

**Goal:** Understand existing type structure

**Files to examine:**

- `types/` directory
- `lib/database.types.ts` - Supabase generated types
- `types/supabase.ts` - Custom Supabase types
- Component prop types

**Types to document:**

```typescript
// User types
interface User { ... }

// Subscription types
interface Subscription { ... }
interface SubscriptionStatus { ... }

// Customer types
interface Customer { ... }

// API response types
interface ApiResponse<T> { ... }
```

**Questions to answer:**

- What naming conventions are used?
- Are types or interfaces preferred?
- How are database types generated?
- Are there shared type definitions?

---

## Phase 7: Error Handling & Logging

### 7.1 Error Patterns

**Goal:** Match existing error handling

**Files to examine:**

- `lib/errors.ts` - Error utilities
- `app/error.tsx` - Error boundaries
- API route error handling
- Try-catch patterns

**Questions to answer:**

- How are errors logged?
- What error types are used?
- How are user-facing errors formatted?
- Are there custom error classes?
- Is there error tracking (Sentry, etc.)?

---

## Phase 8: Environment & Configuration

### 8.1 Environment Variables

**Goal:** Document all required env vars

**Files to examine:**

- `.env.local`
- `.env.example`
- `next.config.js`

**Variables to document:**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# DodoPayments
DODOPAYMENTS_API_KEY=
DODOPAYMENTS_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

**Questions to answer:**

- What environment variables are required?
- Which are public vs private?
- Are there different configs for dev/prod?

---

## Phase 9: Testing & Quality

### 9.1 Testing Setup

**Goal:** Understand testing patterns

**Files to examine:**

- `__tests__/` directory
- `*.test.ts` or `*.spec.ts` files
- `vitest.config.ts` or `jest.config.js`

**Questions to answer:**

- What testing framework is used?
- Are there existing API tests?
- How are Supabase calls mocked?
- What is the test coverage?

---

## Deliverable: Analysis Report

After completing this analysis, create a comprehensive report with:

### Section 1: Project Overview

- Framework versions
- Key dependencies
- Project structure diagram
- Build and deployment process

### Section 2: Authentication Architecture

- Supabase client initialization code
- Auth flow diagram
- Current callback implementation
- Session management approach

### Section 3: Database Schema

- Complete ERD (Entity Relationship Diagram)
- Table definitions with exact column names
- Relationships and foreign keys
- Product ID mappings

### Section 4: API Patterns

- Existing API route structure
- Request/response formats
- Authentication patterns
- Error handling conventions

### Section 5: Code Conventions

- TypeScript patterns
- Naming conventions
- File organization
- Import patterns

### Section 6: Integration Points

- Where to add desktop subscription API
- How to modify auth callback
- Required type definitions
- Testing requirements

---

## Analysis Checklist

### Discovery Phase

- [ ] Clone/access the web app repository
- [ ] Install dependencies and run locally
- [ ] Review package.json dependencies
- [ ] Examine project structure
- [ ] Read existing documentation

### Authentication Analysis

- [ ] Find Supabase client initialization
- [ ] Locate auth callback route
- [ ] Identify OAuth configuration
- [ ] Document session management
- [ ] Test current auth flow

### Database Analysis

- [ ] Access Supabase dashboard
- [ ] Export database schema
- [ ] Query subscriptions table
- [ ] Get product IDs
- [ ] Document table relationships

### Code Analysis

- [ ] Review API route patterns
- [ ] Examine TypeScript types
- [ ] Study error handling
- [ ] Check environment variables
- [ ] Identify testing patterns

### Documentation

- [ ] Create architecture diagram
- [ ] Document database schema
- [ ] List all product IDs
- [ ] Map API endpoints
- [ ] Write integration recommendations

---

## Tools Needed

1. **Code Editor**: VS Code with TypeScript support
2. **Database Access**: Supabase dashboard or SQL client
3. **API Testing**: Postman, curl, or Thunder Client
4. **Diagramming**: Excalidraw, draw.io, or Mermaid
5. **Documentation**: Markdown editor

---

## Timeline Estimate

- **Phase 1-2** (Structure & Auth): 1-2 hours
- **Phase 3-4** (Database & API): 1-2 hours
- **Phase 5-6** (Payments & Types): 1 hour
- **Phase 7-9** (Errors, Env, Testing): 1 hour
- **Documentation**: 1-2 hours

**Total**: 5-8 hours for complete analysis

---

## Next Steps After Analysis

Once the analysis is complete:

1. **Review findings** with team
2. **Create refined integration plan** based on actual codebase
3. **Identify any blockers** or required changes
4. **Estimate implementation time** accurately
5. **Begin implementation** with confidence

---

## Questions to Prepare

Before starting analysis, gather:

1. Repository access credentials
2. Supabase project access
3. DodoPayments dashboard access
4. Environment variable values (for local testing)
5. Any existing documentation
6. Contact for questions (if needed)

---

## Output Format

The analysis should produce:

1. **Architecture Document** (Markdown)

   - Project structure
   - Authentication flow
   - Database schema
   - API patterns

2. **Integration Specification** (Markdown)

   - Exact file paths to create/modify
   - Code snippets matching your patterns
   - Type definitions needed
   - Test cases

3. **Implementation Checklist** (Markdown)

   - Step-by-step tasks
   - Dependencies between tasks
   - Testing requirements
   - Deployment steps

This will serve as the foundation for creating a perfectly tailored desktop integration plan.

### To-dos

- [ ] Create hidemybrowser/main/auth-manager.js with secure token storage using safeStorage
- [ ] Create hidemybrowser/main/subscription-manager.js with validation and background checks
- [ ] Create hidemybrowser/js/util/subscription-gate.js for feature gating
- [ ] Create hidemybrowser/pages/auth/auth-window.html for authentication UI
- [ ] Modify hidemybrowser/main/main.js to add auth check and protocol handler
- [ ] Update hidemybrowser/package.json to add node-fetch dependency
- [ ] Create app/api/desktop/subscription/route.ts for subscription validation endpoint
- [ ] Modify app/(auth)/auth/callback/route.ts to handle desktop authentication
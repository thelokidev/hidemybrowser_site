# HideMyBrowser

A modern SaaS application for browser privacy protection built with Next.js 15, Supabase, and DodoPayments.

## 🚀 Features

- **User Authentication**: Secure authentication with Supabase (OAuth, Magic Links)
- **Subscription Management**: Integrated payment processing with DodoPayments
- **Modern UI**: Beautiful, responsive interface built with shadcn/ui and Tailwind CSS
- **Type-Safe**: Full TypeScript support with proper type definitions
- **Server-Side Rendering**: Optimized performance with Next.js 15
- **Database**: PostgreSQL with Supabase for reliable data storage

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **Authentication**: [Supabase Auth](https://supabase.com/docs/guides/auth)
- **Database**: [Supabase (PostgreSQL)](https://supabase.com/)
- **Payments**: [DodoPayments](https://dodopayments.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or higher
- npm or pnpm
- A Supabase account and project
- A DodoPayments account

## 🔧 Installation

1. **Clone the repository**

```bash
git clone https://github.com/thelokidev/hidemybrowser_site.git
cd hidemybrowser_site
```

2. **Install dependencies**

```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

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

4. **Set up Supabase**

Run the migrations in the `supabase/migrations` folder to set up your database schema:

```bash
# Apply migrations using Supabase CLI or SQL editor
```

5. **Run the development server**

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
hidemybrowser/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── pricing/           # Pricing pages
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── dodopayments/    # DodoPayments integration
│   └── supabase/        # Supabase clients
├── supabase/            # Supabase configuration
│   └── migrations/      # Database migrations
├── types/               # TypeScript type definitions
└── public/              # Static assets
```

## 🔐 Authentication

The application uses Supabase Auth with PKCE (Proof Key for Code Exchange) flow for secure authentication:

- OAuth providers (Google, GitHub)
- Magic link email authentication
- Secure session management

## 💳 Payments

DodoPayments integration handles:

- Subscription creation and management
- Webhook processing for payment events
- Customer synchronization

## 🚢 Deployment

### Deploy to Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/thelokidev/hidemybrowser_site)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set all required environment variables in your production environment:

- Update `NEXT_PUBLIC_SITE_URL` to your production domain
- Configure webhook URLs in DodoPayments dashboard
- Set up proper CORS and redirect URLs in Supabase

## 📝 Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Test locally
4. Commit with descriptive messages
5. Push to GitHub
6. Create a Pull Request

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 🐛 Known Issues

- None currently

## 📞 Support

For support, please open an issue in the GitHub repository.

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [DodoPayments Documentation](https://dodopayments.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

---

Built with ❤️ by [thelokidev](https://github.com/thelokidev)


# 🌟 Blunari Discovery

A gamified restaurant discovery platform with curated trails, daily drops, and Passport XP system.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
cd apps/web
npm install

# Set up environment variables
# See apps/web/ENV_VARIABLES.md for required variables

# Run dev server
npm run dev

# App will be available at http://localhost:4000
```

### Vercel Deployment

See **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** for complete deployment instructions.

**Quick version:**
1. Import repo to Vercel
2. Set root directory: `apps/web`
3. Add 8 environment variables (see `apps/web/ENV_VARIABLES.md`)
4. Deploy!

---

## 📁 Project Structure

```
create-anything/
├── apps/
│   ├── web/              # React Router v7 web app
│   │   ├── src/
│   │   │   ├── app/      # Pages and API routes
│   │   │   ├── components/  # UI components
│   │   │   └── utils/    # Client hooks
│   │   ├── supabase/     # Database migrations & RLS policies
│   │   └── package.json
│   │
│   └── mobile/           # React Native + Expo mobile app
│       └── src/
│
├── VERCEL_DEPLOYMENT_GUIDE.md      # Vercel deployment instructions
├── SUPABASE_MIGRATION_REPORT.md    # Database migration plan
└── MIGRATION_STATUS.md              # Current migration status
```

---

## 🛠️ Tech Stack

### Web App
- **Framework**: React Router v7 (SSR)
- **Database**: Neon Postgres (migrating to Supabase)
- **Storage**: Supabase Storage
- **Auth**: Auth.js with credentials + Google OAuth
- **Styling**: Tailwind CSS
- **State**: Zustand + React Query
- **Animations**: Motion (Framer Motion successor)

### Mobile App
- **Framework**: React Native + Expo
- **Router**: Expo Router
- **UI**: Native components + Reanimated

---

## 🎮 Features

### Core Features
- 🍽️ **Restaurant Discovery** - Curated restaurants with rich metadata
- 🗺️ **City-based Navigation** - Multi-city support (currently Atlanta)
- ⭐ **Favorites & Stamps** - Save and mark restaurants as visited
- 🎯 **Passport System** - Earn XP, level up, collect badges
- 🎁 **Daily Drops** - Limited-time offers with countdown timers
- 🏃 **Trails** - Multi-step restaurant challenges
- 📹 **Video Feed** - TikTok-style restaurant videos
- 👥 **Referral System** - Invite friends, earn XP

### Admin Features
- 📊 Dashboard with analytics
- 🍽️ Restaurant CRUD with image uploads
- 🎁 Drop scheduling and management
- 🏆 Badge configuration
- 🎬 Video moderation
- 🗺️ City management
- 📝 List curation
- 🤖 AI tools (enrich, translate, vision)

---

## 🔐 Security

- ✅ **Row Level Security (RLS)** enabled on all user tables
- ✅ **Secure authentication** with Auth.js
- ✅ **Service role isolation** (API routes only)
- ✅ **Rate limiting** on sensitive endpoints
- ✅ **SQL injection protection** via parameterized queries
- ✅ **XSS protection** via React's built-in escaping
- ✅ **HTTPS only** in production

---

## 📦 Database

### Current State
- **Auth & Legacy Data**: Neon Postgres
- **Storage**: Supabase Storage
- **Target**: Full migration to Supabase Postgres

### Migration Progress
- ✅ Supabase schema created (28 tables)
- ✅ RLS policies applied
- ⏳ Data migration pending (see `MIGRATION_STATUS.md`)

---

## 🧪 Testing

```bash
# Run tests
cd apps/web
npm run test

# Type checking
npm run typecheck

# Build for production
npm run build
```

---

## 📚 Documentation

- **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** - Deploy to Vercel
- **[SUPABASE_MIGRATION_REPORT.md](./SUPABASE_MIGRATION_REPORT.md)** - Database migration plan
- **[MIGRATION_STATUS.md](./MIGRATION_STATUS.md)** - Current migration status
- **[apps/web/ENV_VARIABLES.md](./apps/web/ENV_VARIABLES.md)** - Environment variable reference
- **[apps/web/supabase/README.md](./apps/web/supabase/README.md)** - Supabase migration guide

---

## 🤝 Contributing

This is a production application. Please follow these guidelines:

1. **Never commit secrets** - Use .env.local (gitignored)
2. **Follow existing patterns** - Match naming conventions and code style
3. **Test before deploying** - Run build and tests locally
4. **Document changes** - Update relevant docs
5. **Respect RLS** - Never bypass security policies

---

## 📄 License

Private project - All rights reserved

---

## 🆘 Support

For issues or questions:
1. Check documentation in `/docs/`
2. Review migration guides
3. Check Vercel function logs
4. Review Supabase dashboard

---

## 🎯 Roadmap

### Completed ✅
- Core restaurant discovery
- Gamification system (XP, badges, trails, drops)
- Video feed
- Admin panel
- RLS security
- GitHub repository

### In Progress ⏳
- Neon → Supabase data migration
- Build optimization

### Planned 📋
- Email verification
- Push notifications (mobile)
- Advanced analytics
- Restaurant self-service onboarding
- Payment integration (Stripe)
- Multi-language support

---

**Built with ❤️ for food lovers in Atlanta**


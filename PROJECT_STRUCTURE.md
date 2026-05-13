# ilkaii Project Structure Guide

## Complete File Tree

```
ilkaii/
│
├── 📄 README.md                          # Project overview & setup
├── 📄 SETUP.md                           # Detailed setup & deployment guide
├── 📄 DATABASE_SCHEMA.md                 # Prisma schema reference
├── 📄 COMPONENTS.md                      # Component documentation
├── 📄 package.json                       # Dependencies & scripts
├── 📄 tsconfig.json                      # TypeScript config
├── 📄 next.config.ts                     # Next.js config
├── 📄 tailwind.config.ts                 # Tailwind theme
├── 📄 postcss.config.js                  # PostCSS plugins
├── 📄 .env.example                       # Environment variables template
├── 📄 .env.local.example                 # Local development env
├── 📄 .gitignore                         # Git ignore rules
│
├── 📁 prisma/
│   └── 📄 schema.prisma                  # Database schema (MySQL)
│
├── 📁 src/
│   ├── 📁 app/                           # Next.js 15 App Router
│   │   ├── 📄 layout.tsx                 # Root layout with Navbar/Drawer
│   │   ├── 📄 page.tsx                   # Home page
│   │   └── 📄 globals.css                # Global styles
│   │
│   ├── 📁 components/                    # Reusable components
│   │   ├── 📄 Navbar.tsx                 # Main navigation bar
│   │   ├── 📄 MobileDrawer.tsx           # Mobile menu drawer
│   │   ├── 📄 Hero.tsx                   # Hero section
│   │   └── 📄 FeaturedCategories.tsx     # Category showcase
│   │
│   ├── 📁 lib/                           # Utility functions
│   │   └── 📄 cn.ts                      # classname combiner
│   │
│   ├── 📁 store/                         # Zustand state stores
│   │   └── 📄 uiStore.ts                 # UI state (drawer, etc)
│   │
│   ├── 📁 types/                         # TypeScript types
│   │   └── 📄 index.ts                   # Type definitions
│   │
│   └── 📁 styles/                        # Global styles
│       └── 📄 globals.css                # Tailwind & custom CSS
│
├── 📁 public/                            # Static assets
│   ├── 📄 favicon.ico
│   └── 📁 images/
│       └── (hero images, product images, etc)
│
├── 📁 .next/                             # Build output (gitignored)
└── 📁 node_modules/                      # Dependencies (gitignored)
```

---

## File Descriptions

### Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Node.js dependencies & scripts |
| `tsconfig.json` | TypeScript compiler options |
| `next.config.ts` | Next.js settings (images, compression) |
| `tailwind.config.ts` | Tailwind CSS theme & colors |
| `postcss.config.js` | CSS processing pipeline |
| `.env.example` | Template for environment variables |
| `.gitignore` | Files to ignore in git |

### Database

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | MySQL database schema definition |

### Application (src/)

| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js pages & layouts |
| `components/` | Reusable React components |
| `lib/` | Utility functions |
| `store/` | Zustand state management |
| `types/` | TypeScript interfaces |
| `styles/` | Global CSS |

---

## Key Files to Know

### Home Page
**File**: `src/app/page.tsx`

- Main landing page
- Imports Hero component
- Dynamic import of FeaturedCategories
- Newsletter signup section
- Footer with links

### Root Layout
**File**: `src/app/layout.tsx`

- HTML structure
- Metadata & SEO
- Navbar & Mobile Drawer wrappers
- Global styles import
- Mobile viewport config

### Database Schema
**File**: `prisma/schema.prisma`

- 10+ models (User, Product, Order, etc)
- OTP-based authentication
- Stock management
- Order tracking
- Reviews & ratings

---

## Development Workflow

### Adding a New Page

1. **Create file**: `src/app/[feature]/page.tsx`

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title | ilkaii',
  description: 'Page description',
};

export default function Page() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Page content */}
    </div>
  );
}
```

2. **Import components**:
```typescript
import { Hero } from '@/components/Hero';
import { FeaturedCategories } from '@/components/FeaturedCategories';
```

3. **Use Tailwind classes** for styling

4. **Access from**: `http://localhost:3000/feature`

### Adding a New Component

1. **Create file**: `src/components/ComponentName.tsx`

```typescript
'use client'; // If interactive

import { cn } from '@/lib/cn';

export function ComponentName() {
  return (
    <div className={cn('classes')}>
      {/* Content */}
    </div>
  );
}
```

2. **Import in page**:
```typescript
import { ComponentName } from '@/components/ComponentName';

export default function Page() {
  return <ComponentName />;
}
```

### Adding Database Model

1. **Edit**: `prisma/schema.prisma`

```prisma
model MyModel {
  id    String  @id @default(cuid())
  name  String
}
```

2. **Create migration**:
```bash
npm run db:migrate -- --name "add_my_model"
```

3. **Query in component**:
```typescript
const items = await prisma.myModel.findMany();
```

---

## Directory Naming Conventions

```
✓ src/components/           Component folder (PascalCase files)
✓ src/app/[route]/         Routes (kebab-case folders, .tsx files)
✓ src/lib/                 Utilities (camelCase files)
✓ src/store/               Zustand stores (camelCase files)
✓ src/types/               Types (index.ts or domain.ts)
✓ prisma/                  Database (schema.prisma)
✓ public/                  Static files
```

---

## Quick Reference

### Running Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database
npm run db:migrate          # Create migration
npm run db:push             # Sync schema
npm run db:studio           # Open GUI

# Linting
npm run lint
```

### Accessing Pages

```
http://localhost:3000/              → Home
http://localhost:3000/shop          → Shop (to be created)
http://localhost:3000/collections   → Collections (to be created)
http://localhost:3000/about         → About (to be created)
```

### Default Ports

```
3000    → Next.js app
5555    → Prisma Studio (npm run db:studio)
3306    → MySQL (local)
```

---

## File Size Reference

### Component Sizes (Lines of Code)

| Component | LOC |
|-----------|-----|
| Navbar | ~100 |
| MobileDrawer | ~120 |
| Hero | ~110 |
| FeaturedCategories | ~140 |

### Configuration Files

| File | Lines |
|------|-------|
| package.json | ~40 |
| tailwind.config.ts | ~60 |
| prisma/schema.prisma | ~400+ |
| tsconfig.json | ~40 |

---

## Next Steps for Development

1. **Setup (5 min)**
   ```bash
   npm install
   npm run db:push
   npm run dev
   ```

2. **Create Shop Page** (30 min)
   - `src/app/shop/page.tsx`
   - Query products from database
   - Product grid component

3. **Create Product Detail Page** (30 min)
   - `src/app/products/[slug]/page.tsx`
   - Product images gallery
   - Add to cart functionality

4. **Implement Authentication** (1 hour)
   - OTP verification flow
   - User session management
   - Protected routes

5. **Setup Payment** (1-2 hours)
   - Payment gateway integration
   - Order creation
   - Email notifications

6. **Deploy** (1 hour)
   - Setup Liara or VPS
   - Configure database
   - Environment variables
   - Domain & SSL

---

## Module Paths (tsconfig.json)

```typescript
// Instead of: ../../../lib/cn
// Use:
import { cn } from '@/lib/cn';

// Available paths:
@/components/*       → src/components
@/app/*              → src/app
@/lib/*              → src/lib
@/store/*            → src/store
@/types/*            → src/types
```

---

## Build Output

After `npm run build`:

```
.next/
├── cache/              # Build cache
├── static/
│   ├── chunks/        # JS chunks
│   └── css/           # CSS bundles
├── server/            # Server code
└── app-render-manifest.json
```

---

## Environment Variables

**Required for development:**
```
DATABASE_URL=mysql://...
NODE_ENV=development
```

**Optional:**
```
NEXT_PUBLIC_API_URL=http://localhost:3000
DEBUG=true
```

**Production:**
```
DATABASE_URL=mysql://... (production server)
NEXT_PUBLIC_API_URL=https://ilkaii.com
NODE_ENV=production
```

---

## Important Notes

⚠️ **Never commit:**
- `.env` (local secrets)
- `node_modules/`
- `.next/` build folder

✅ **Always commit:**
- `src/` code
- `prisma/schema.prisma`
- `package.json` & `package-lock.json`
- Configuration files

---

## Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev)
- [Zustand](https://zustand-demo.vercel.app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

This structure is production-ready and follows Next.js 15 best practices!

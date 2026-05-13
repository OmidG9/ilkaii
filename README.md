# ilkaii - Luxury Stock Clothing E-commerce

**Premium women's clothing e-commerce platform built with Next.js 15, MySQL, and Tailwind CSS.**

## 🎯 Project Overview

ilkaii is a luxury stock clothing e-commerce platform designed with:
- **Mobile-first responsive design** with 44px+ touch targets
- **High-performance architecture** using Next.js 15 Server Components
- **Luxury design system** with custom color palette
- **Stock-specific database schema** for inventory management
- **OTP-based authentication** for secure user access
- **Node.js compatible** hosting (Liara, VPS, etc.)

---

## 📁 Project Structure

```
ilkaii/
├── src/
│   ├── app/                      # Next.js 15 App Router
│   │   ├── layout.tsx            # Root layout with Navbar & Drawer
│   │   ├── page.tsx              # Home page with Hero & Categories
│   │   └── globals.css           # Global styles & animations
│   │
│   ├── components/               # Reusable React components
│   │   ├── Navbar.tsx            # Mobile-responsive navigation
│   │   ├── MobileDrawer.tsx       # Mobile menu drawer
│   │   ├── Hero.tsx              # Hero section with CTA
│   │   └── FeaturedCategories.tsx # Category showcase grid
│   │
│   ├── lib/
│   │   └── cn.ts                 # Utility for classname combining
│   │
│   ├── store/
│   │   └── uiStore.ts            # Zustand UI state management
│   │
│   ├── types/
│   │   └── index.ts              # TypeScript type definitions
│   │
│   └── styles/
│       └── globals.css           # Global CSS with Tailwind
│
├── prisma/
│   └── schema.prisma             # MySQL database schema
│
├── public/                       # Static assets
│
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS theme
├── postcss.config.js             # PostCSS plugins
├── .env.example                  # Environment variables template
└── .gitignore                    # Git ignore rules
```

---

## 🎨 Design System

### Luxury Color Palette

| Color | Value | Usage |
|-------|-------|-------|
| **Primary** | #6B5E57 | Main buttons, links, headings |
| **Secondary** | #A89C94 | Accents, badges, hover states |
| **Background** | #F5F1ED | Page background |
| **Text** | #2B2B2B | Body text, dark content |
| **Border** | #E8E3DE | Dividers, card borders |
| **Hover** | #5A4D46 | Primary button hover state |

### Typography

- **Serif Font**: Playfair Display (headings)
- **Sans-serif**: Poppins (body text)
- **Responsive sizing** with mobile-first scaling

### Touch Targets

- All interactive elements: **minimum 44px x 44px**
- Proper spacing for thumb accessibility
- Tailwind config includes `touch-target` class (44px)

---

## 🗄️ Database Schema (Prisma + MySQL)

### Core Models

1. **User** - OTP-based authentication
   - Phone number + OTP verification
   - Multiple addresses
   - Orders, wishlist, cart, reviews

2. **Product** - Stock clothing items
   - SKU-based inventory
   - Multiple images with WebP support
   - Variants (size, color)
   - Categories & reviews

3. **Category** - Hierarchical organization
   - Parent-child relationships
   - Icon support (Lucide icons)

4. **Order** - Complete order management
   - Payment & shipping status
   - Line items with variants
   - Address tracking

5. **Related Models**:
   - ProductImage, ProductVariant
   - WishlistItem, CartItem
   - Review, Address

See `prisma/schema.prisma` for complete schema details.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd ilkaii
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
# DATABASE_URL="mysql://user:password@localhost:3306/ilkaii"
```

4. **Set up the database**
```bash
npm run db:generate  # Generate Prisma client
npm run db:push     # Create tables in MySQL
# OR for migrations
npm run db:migrate  # Create migration files
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Create database migrations |
| `npm run db:push` | Sync schema to database |
| `npm run db:studio` | Open Prisma Studio GUI |

---

## 🎯 Key Features

### Performance Optimizations

✅ **Next.js Image Component** with WebP/AVIF support  
✅ **Dynamic Imports** for heavy components  
✅ **Server Components** for data fetching  
✅ **Minimal client-side state** with Zustand  
✅ **Automatic code splitting** and lazy loading  
✅ **Image optimization** with responsive sizes  

### Mobile-First Design

✅ Responsive Navbar with mobile drawer  
✅ Touch-friendly buttons (44px+)  
✅ Mobile-optimized images  
✅ Safe area insets for notched devices  
✅ Efficient CSS with Tailwind  

### Component Breakdown

#### **Navbar** (`src/components/Navbar.tsx`)
- Sticky navigation bar
- Mobile hamburger menu (< 768px)
- Shopping cart with badge
- Search functionality
- Responsive layout

#### **MobileDrawer** (`src/components/MobileDrawer.tsx`)
- Smooth slide-in menu
- Navigation links
- Quick action buttons (Wishlist, Cart, Account)
- Sign in/signup options
- Overlay backdrop

#### **Hero** (`src/components/Hero.tsx`)
- Full-width hero section with image
- Prominent CTA buttons
- Trust indicators
- Gradient overlays
- Responsive text scaling

#### **FeaturedCategories** (`src/components/FeaturedCategories.tsx`)
- 4-column grid (responsive to 1-2 columns on mobile)
- Image hover effects
- Category cards with descriptions
- Link to collection pages
- Bottom CTA section

---

## 🔒 Security & Best Practices

- ✅ Environment variables for sensitive data
- ✅ TypeScript for type safety
- ✅ SQL injection prevention via Prisma ORM
- ✅ Responsive images for security (no external manipulation)
- ✅ CSP headers ready (add to next.config.ts)

---

## 📱 Mobile Optimization Checklist

- ✅ Viewport meta tags configured
- ✅ 44px+ touch targets for all buttons
- ✅ WebP image format with fallbacks
- ✅ Mobile drawer for navigation
- ✅ Safe area support for notched devices
- ✅ Touch-optimized spacing
- ✅ Efficient bundle size with dynamic imports
- ✅ Font optimization with Google Fonts

---

## 🛠️ Development Tips

### Adding New Pages

1. Create file in `src/app/[page]/page.tsx`
2. Use layout inheritance from root layout
3. Import components from `src/components/`

### Adding New Components

1. Create file in `src/components/ComponentName.tsx`
2. Use `'use client'` directive if interactivity needed
3. Import and use in pages/layouts

### Using the UI Store (Zustand)

```typescript
import { useUIStore } from '@/store/uiStore';

export function MyComponent() {
  const { isDrawerOpen, toggleDrawer } = useUIStore();
  // Use hooks for state management
}
```

### Database Queries

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// In Server Components
const products = await prisma.product.findMany({
  include: { category: true, images: true }
});
```

---

## 🌐 Deployment

### Liara (Node.js)

1. Connect your GitHub repository
2. Set environment variables in dashboard:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_API_URL`
3. Deploy main branch (automatic)

### VPS (Ubuntu/Debian)

1. Install Node.js 18+
2. Clone repository
3. Set up `.env` file
4. Run `npm install && npm run build`
5. Use PM2 or systemd for process management:

```bash
npm install -g pm2
pm2 start "npm start" --name "ilkaii"
pm2 save
```

### Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📦 Dependencies

### Core
- **next@15**: React framework
- **react@19**: UI library
- **prisma@5**: ORM for MySQL
- **tailwindcss@3**: Styling

### Icons & UI
- **lucide-react**: Icon library
- **zustand**: State management

### Dev Tools
- **typescript**: Type safety
- **eslint**: Code linting

---

## 📝 Notes

- All colors strictly follow the luxury palette
- Images use Unsplash API (replace with your CDN)
- Database uses MySQL 8.0+ syntax
- Compatible with Node.js 16+ environments
- Ready for production deployment

---

## 📄 License

MIT License - Feel free to use for commercial projects.

---

## 🤝 Support

For questions or issues, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind Documentation](https://tailwindcss.com/docs)
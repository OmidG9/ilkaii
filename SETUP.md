# Setup & Configuration Guide

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database Connection
DATABASE_URL="mysql://user:password@localhost:3306/ilkaii"

# Application Settings
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

### Production Example (Liara)

```env
DATABASE_URL="mysql://root:your_secure_password@mysql.liara.ir:3306/ilkaii"
NEXT_PUBLIC_API_URL="https://ilkaii.liara.run"
NODE_ENV="production"
```

---

## Database Setup

### Local MySQL Setup

1. **Install MySQL** (if not already installed)

2. **Create database**

```sql
CREATE DATABASE ilkaii;
```

3. **Create user (optional but recommended)**

```sql
CREATE USER 'ilkaii_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON ilkaii.* TO 'ilkaii_user'@'localhost';
FLUSH PRIVILEGES;
```

4. **Update .env**

```env
DATABASE_URL="mysql://ilkaii_user:secure_password@localhost:3306/ilkaii"
```

5. **Initialize Prisma**

```bash
npm run db:push
```

### Liara MySQL Addon

1. Add MySQL addon in Liara dashboard
2. Copy connection string to `.env`
3. Run migrations

---

## Prisma Migrations

### Creating a Migration

```bash
# After schema.prisma changes
npm run db:migrate -- --name "add_new_field"
```

### Applying Migrations

```bash
# In production
npm run db:migrate
```

### Viewing Database (GUI)

```bash
npm run db:studio
```

Opens Prisma Studio at `http://localhost:5555`

---

## Image Configuration

### Using Next.js Image Component

✅ **Optimized with WebP**

```tsx
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Description"
  width={300}
  height={300}
  priority // For hero images
  quality={85}
/>;
```

### Supported Domains

Edit `next.config.ts`:

```typescript
images: {
  domains: ['images.unsplash.com', 'cdn.yourdomain.com'],
}
```

### Image Optimization Tips

- Use WebP format (automatic conversion)
- Set proper `sizes` attribute for responsive images
- Use `priority` only for above-the-fold images
- Lazy load images below the fold

---

## Development Workflow

### Starting Development

```bash
npm run dev
```

- Opens `http://localhost:3000`
- Hot reload enabled
- TypeScript checking enabled

### Building for Production

```bash
npm run build
npm start
```

### Code Quality

```bash
npm run lint
```

---

## Component Development

### Creating a New Component

**File**: `src/components/MyComponent.tsx`

```typescript
'use client';

import { cn } from '@/lib/cn';

interface MyComponentProps {
  title: string;
  // ... other props
}

export function MyComponent({ title }: MyComponentProps) {
  return (
    <div className={cn(
      'p-4 rounded-lg',
      'bg-luxury-background border border-luxury-border',
      'hover:border-luxury-primary transition-colors'
    )}>
      {title}
    </div>
  );
}
```

### Best Practices

1. **'use client'** directive only when needed
2. Use **Server Components** by default for data fetching
3. Leverage **dynamic imports** for heavy components:

```typescript
const HeavyComponent = dynamic(
  () => import('./HeavyComponent').then(mod => ({ default: mod.HeavyComponent })),
  { loading: () => <div>Loading...</div> }
);
```

4. Always use **TypeScript** types
5. Use **Tailwind** classes with `cn()` helper

---

## Styling Guide

### Using Tailwind Colors

Luxury palette available via config:

```tsx
// Primary color
<div className="bg-luxury-primary text-white">
<div className="text-luxury-primary">

// Secondary
<div className="bg-luxury-secondary">
<div className="text-luxury-secondary">

// Background
<div className="bg-luxury-background">

// Text
<div className="text-luxury-text">

// Custom sizes
<button className="w-touch-target h-touch-target">
```

### Responsive Design

Mobile-first approach:

```tsx
<div className="text-base sm:text-lg md:text-xl lg:text-2xl">
  Responsive text
</div>
```

Breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## State Management with Zustand

### Creating a Store

**File**: `src/store/myStore.ts`

```typescript
import { create } from "zustand";

interface MyStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useMyStore = create<MyStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));
```

### Using the Store

```typescript
'use client';

import { useMyStore } from '@/store/myStore';

export function MyComponent() {
  const { count, increment } = useMyStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

---

## Database Operations

### Querying Data (Server Component)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: 'ACTIVE' },
    include: { category: true, images: true },
    take: 10,
  });

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### Creating Data

```typescript
const newProduct = await prisma.product.create({
  data: {
    name: "Premium Dress",
    slug: "premium-dress",
    basePrice: 150,
    categoryId: "category-1",
    sku: "DRESS-001",
    totalStock: 50,
    status: "ACTIVE",
  },
});
```

### Updating Data

```typescript
const updated = await prisma.product.update({
  where: { id: productId },
  data: { salePrice: 100 },
});
```

### Deleting Data

```typescript
await prisma.product.delete({
  where: { id: productId },
});
```

---

## Deployment Guides

### Liara Deployment

1. **Connect GitHub**
   - Sign in to Liara dashboard
   - Create new app
   - Connect GitHub repository

2. **Configure Environment**
   - Go to Settings > Environment Variables
   - Add all variables from `.env`

3. **Add MySQL**
   - Services > Add MySQL
   - Copy connection string

4. **Deploy**
   - Push to main branch
   - Liara auto-deploys

### VPS Deployment (Ubuntu 22.04)

1. **Install Node.js**

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install MySQL**

```bash
sudo apt-get install -y mysql-server
```

3. **Clone Repository**

```bash
cd /opt
git clone https://github.com/yourname/ilkaii.git
cd ilkaii
```

4. **Install Dependencies**

```bash
npm install
```

5. **Setup Environment**

```bash
cp .env.example .env
# Edit .env with production values
```

6. **Build Project**

```bash
npm run build
```

7. **Install PM2**

```bash
npm install -g pm2
pm2 start "npm start" --name "ilkaii"
pm2 startup
pm2 save
```

8. **Setup Nginx** (Reverse Proxy)

Create `/etc/nginx/sites-available/ilkaii`:

```nginx
server {
    listen 80;
    server_name ilkaii.com www.ilkaii.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/ilkaii /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

9. **SSL Certificate (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ilkaii.com -d www.ilkaii.com
```

---

## Performance Optimization Checklist

- [ ] Image optimization (WebP conversion)
- [ ] Dynamic imports for heavy components
- [ ] Server Components for data fetching
- [ ] Minimal client-side state
- [ ] Database query optimization (indexes)
- [ ] Caching strategies
- [ ] Code minification & splitting
- [ ] CSS purging (Tailwind)
- [ ] Font optimization

---

## Testing & Quality

### Run Linter

```bash
npm run lint
```

### TypeScript Check

```bash
npx tsc --noEmit
```

### Build Test

```bash
npm run build
```

---

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**

- Check MySQL is running
- Verify DATABASE_URL in .env
- Test connection: `mysql -u user -p`

### Image Optimization Error

**Solution:**

- Add domain to `next.config.ts` images.domains
- Check image URL is accessible
- Verify WebP support in browser

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind Docs](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
- [Zustand Docs](https://zustand-demo.vercel.app)

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Setup database: `npm run db:push`
3. ✅ Start development: `npm run dev`
4. ✅ Create products in database
5. ✅ Build shop pages (`/shop`, `/products/[id]`)
6. ✅ Implement authentication
7. ✅ Setup payment gateway
8. ✅ Deploy to production

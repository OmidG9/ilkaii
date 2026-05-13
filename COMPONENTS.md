# Component Documentation

Comprehensive guide to ilkaii's UI components and their usage.

## Component Overview

| Component          | Location                                | Type   | Purpose                |
| ------------------ | --------------------------------------- | ------ | ---------------------- |
| Navbar             | `src/components/Navbar.tsx`             | Client | Main navigation bar    |
| MobileDrawer       | `src/components/MobileDrawer.tsx`       | Client | Mobile menu drawer     |
| Hero               | `src/components/Hero.tsx`               | Client | Hero section with CTA  |
| FeaturedCategories | `src/components/FeaturedCategories.tsx` | Client | Category showcase grid |

---

## Navbar Component

**File**: `src/components/Navbar.tsx`

### Features

✅ Sticky positioning (z-40)  
✅ Mobile hamburger menu (< 768px)  
✅ Desktop navigation links (≥ 768px)  
✅ Search functionality  
✅ Shopping cart badge  
✅ Wishlist link  
✅ Responsive button sizing  
✅ Touch-friendly (44px buttons)

### Props

No props required - uses global state (Zustand).

### State Management

```typescript
const { toggleDrawer } = useUIStore();
// Controls mobile drawer open/close
```

### Responsive Behavior

| Screen      | Mobile   | Tablet   | Desktop |
| ----------- | -------- | -------- | ------- |
| Menu Button | ✓        | Hidden   | Hidden  |
| Search Bar  | Dropdown | Dropdown | Inline  |
| Nav Links   | Hidden   | Hidden   | ✓       |
| Cart Badge  | ✓        | ✓        | ✓       |

### Usage Example

```typescript
import { Navbar } from '@/components/Navbar';

export default function Layout() {
  return (
    <>
      <Navbar />
      {/* Other content */}
    </>
  );
}
```

### Customization

**Change Navigation Links:**

Edit the navigation links section:

```typescript
<Link href="/shop" className="...">Shop</Link>
<Link href="/collections" className="...">Collections</Link>
// Add more links as needed
```

**Customize Logo:**

```typescript
<Link href="/" className="...">
  ilkaii {/* Change to your logo */}
</Link>
```

**Update Cart Count:**

```typescript
<span className="absolute top-2 right-2 w-5 h-5 bg-luxury-secondary ...">
  {cartCount} {/* Get from Zustand store */}
</span>
```

---

## MobileDrawer Component

**File**: `src/components/MobileDrawer.tsx`

### Features

✅ Slide-in animation from left  
✅ Overlay backdrop  
✅ Navigation menu items  
✅ Quick action buttons  
✅ Sign in/signup section  
✅ Touch-optimized spacing  
✅ Escape key & click-outside support

### Props

No props required - uses global state (Zustand).

### State Management

```typescript
const { isDrawerOpen, closeDrawer } = useUIStore();
// Controls drawer visibility
```

### Menu Items

```typescript
const menuItems = [
  { label: "Shop All", href: "/shop" },
  { label: "Women", href: "/shop/women" },
  { label: "New Arrivals", href: "/shop/new" },
  { label: "Sale", href: "/shop/sale" },
  { label: "Collections", href: "/collections" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];
```

### Usage Example

```typescript
import { MobileDrawer } from '@/components/MobileDrawer';

export default function Layout() {
  return (
    <>
      <Navbar /> {/* Triggers drawer */}
      <MobileDrawer /> {/* The drawer itself */}
    </>
  );
}
```

### Customization

**Add More Menu Items:**

```typescript
const menuItems = [
  // ... existing items
  { label: "Lookbook", href: "/lookbook" },
  { label: "Gift Guide", href: "/gifts" },
];
```

**Add Quick Actions:**

```typescript
<Link href="/account" className="...">
  <User size={20} />
  <span>My Account</span>
</Link>
```

---

## Hero Component

**File**: `src/components/Hero.tsx`

### Features

✅ Full-width hero section  
✅ Next.js optimized image  
✅ WebP with fallback  
✅ Responsive text scaling  
✅ Dual CTA buttons  
✅ Trust indicators (stats)  
✅ Decorative gradient elements  
✅ Priority image loading

### Props

No props required - uses hardcoded content.

### Image Optimization

```typescript
<Image
  src="https://images.unsplash.com/photo-..."
  alt="Luxury women's fashion collection"
  fill
  priority          // Load immediately
  quality={85}      // 85% JPEG quality
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```

### Responsive Layout

| Screen  | Layout             | Image      |
| ------- | ------------------ | ---------- |
| Mobile  | Stack (text above) | Full width |
| Tablet  | Side-by-side       | 50% width  |
| Desktop | Grid (2 cols)      | 50% width  |

### Trust Indicators

Currently displays:

- 500+ Premium Items
- 10K+ Happy Customers
- 100% Authentic

**To Make Dynamic:**

```typescript
const stats = [
  { number: productCount, label: 'Premium Items' },
  { number: customerCount, label: 'Happy Customers' },
  { number: '100%', label: 'Authentic' },
];

{stats.map(stat => (
  <div key={stat.label}>
    <p className="text-2xl font-bold">{stat.number}</p>
    <p className="text-sm">{stat.label}</p>
  </div>
))}
```

### Usage Example

```typescript
import { Hero } from '@/components/Hero';

export default function Home() {
  return <Hero />;
}
```

### Customization

**Change Hero Image:**

```typescript
<Image
  src="/images/luxury-dress.webp" // Your image
  alt="Your description"
  // ... other props
/>
```

**Change Heading Text:**

```typescript
<h1>Your Heading Here</h1>
<p>Your description here</p>
```

**Modify CTA Buttons:**

```typescript
<Link href="/custom-path" className="...">
  Custom Button Text
</Link>
```

---

## FeaturedCategories Component

**File**: `src/components/FeaturedCategories.tsx`

### Features

✅ Responsive grid (1-2-4 columns)  
✅ Hover image zoom effect  
✅ Category cards with descriptions  
✅ Icon + image combination  
✅ Bottom promotional section  
✅ Link to collection pages  
✅ Mobile-optimized spacing

### Props

No props required - uses hardcoded category data.

### Category Data Structure

```typescript
interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}
```

### Current Categories

1. Dresses
2. Tops & Blouses
3. Bottoms
4. Outerwear

### Responsive Grid

```
Mobile (< 640px):  1 column
Tablet (640-1024): 2 columns
Desktop (> 1024):  4 columns
```

### Usage Example

```typescript
import dynamic from 'next/dynamic';

const FeaturedCategories = dynamic(
  () => import('@/components/FeaturedCategories')
    .then(mod => ({ default: mod.FeaturedCategories })),
  { loading: () => <div>Loading...</div> }
);

export default function Home() {
  return <FeaturedCategories />;
}
```

### Customization

**Use Database Categories:**

```typescript
'use client';

export function FeaturedCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch from API
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  return (
    // Map over categories
    {categories.map(category => (
      // Category card
    ))}
  );
}
```

**Add Category:**

```typescript
const FEATURED_CATEGORIES: Category[] = [
  // ... existing
  {
    id: "5",
    name: "Accessories",
    slug: "accessories",
    image: "https://...",
    description: "Belts, scarves, and more",
  },
];
```

---

## Creating New Components

### Component Template

**File**: `src/components/MyComponent.tsx`

```typescript
'use client'; // Only if interactive

import React from 'react';
import Link from 'next/link';
import { SomeIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MyComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

export function MyComponent({
  title,
  description,
  onAction
}: MyComponentProps) {
  return (
    <div className={cn(
      'p-4 rounded-lg',
      'bg-luxury-background border border-luxury-border',
      'hover:border-luxury-primary transition-colors'
    )}>
      <h3 className="text-lg font-serif font-bold text-luxury-primary">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-luxury-text/70 mt-2">
          {description}
        </p>
      )}
      {onAction && (
        <button
          onClick={onAction}
          className={cn(
            'mt-4 px-4 py-2 rounded-lg',
            'bg-luxury-primary text-white',
            'hover:bg-luxury-hover transition-colors',
            'touch-target'
          )}
        >
          Action
        </button>
      )}
    </div>
  );
}
```

### Usage

```typescript
import { MyComponent } from '@/components/MyComponent';

export function Page() {
  return (
    <MyComponent
      title="Example"
      description="Component description"
      onAction={() => console.log('Action!')}
    />
  );
}
```

---

## Styling Utilities

### cn() Helper

Safely combine class names:

```typescript
import { cn } from "@/lib/cn";

const buttonClass = cn(
  "px-4 py-2 rounded-lg", // Base
  "bg-luxury-primary text-white", // Style
  isActive && "opacity-50", // Conditional
  "hover:bg-luxury-hover", // Hover
  "transition-all duration-200", // Animation
);
```

### Tailwind Colors

```typescript
// Text colors
className = "text-luxury-primary";
className = "text-luxury-secondary";
className = "text-luxury-text";

// Background colors
className = "bg-luxury-primary";
className = "bg-luxury-background";
className = "bg-light";

// Border colors
className = "border-luxury-border";
className = "border-luxury-primary";

// Touch targets
className = "touch-target"; // 44px min height/width
```

### Responsive Classes

```typescript
// Mobile first approach
className = "text-base sm:text-lg md:text-xl lg:text-2xl";
className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";
className = "hidden md:flex"; // Show on medium+ screens
className = "md:hidden"; // Hide on medium+ screens
```

---

## Icons (Lucide React)

### Using Icons

```typescript
import {
  Menu,
  ShoppingCart,
  Heart,
  Search,
  ChevronRight
} from 'lucide-react';

<Menu size={24} strokeWidth={1.5} />
<ShoppingCart size={20} />
<Heart size={18} className="text-luxury-secondary" />
```

### Common Icons in Project

| Icon         | Usage              |
| ------------ | ------------------ |
| Menu         | Mobile menu button |
| ShoppingCart | Cart link          |
| Heart        | Wishlist link      |
| Search       | Search button      |
| X            | Close drawer       |
| ChevronRight | CTA indicators     |
| User         | Account link       |
| Settings     | Settings link      |

### All Available Icons

See [Lucide Icons](https://lucide.dev) for complete list.

---

## State Management (Zustand)

### Using the UI Store

```typescript
'use client';

import { useUIStore } from '@/store/uiStore';

export function MyComponent() {
  const isDrawerOpen = useUIStore(state => state.isDrawerOpen);
  const toggleDrawer = useUIStore(state => state.toggleDrawer);

  return (
    <button onClick={toggleDrawer}>
      {isDrawerOpen ? 'Close' : 'Open'} Drawer
    </button>
  );
}
```

### Creating a New Store

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

---

## Performance Best Practices

### Dynamic Imports

```typescript
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('./HeavyComponent')
    .then(mod => ({ default: mod.HeavyComponent })),
  {
    loading: () => <div className="animate-shimmer h-96" />,
    ssr: false, // Optional: disable SSR if not needed
  }
);
```

### Image Optimization

```typescript
<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority={isBelowFold ? false : true}
  quality={85}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### Memoization

```typescript
import { memo } from 'react';

const MyComponent = memo(function MyComponent({ data }) {
  return <div>{data}</div>;
});

export default MyComponent;
```

---

## Accessibility

### Touch Targets

All interactive elements should be at least 44x44px:

```typescript
<button className="min-h-touch min-w-touch">
  Touch me
</button>

// Or use touch-target class
<button className="touch-target">
  Touch me
</button>
```

### ARIA Labels

```typescript
<button aria-label="Open menu">
  <Menu size={24} />
</button>

<button aria-label="Add to cart">
  <ShoppingCart size={24} />
</button>
```

### Semantic HTML

```typescript
<nav>Navigation</nav>
<section>Section</section>
<article>Article</article>
<button>Click</button> {/* Not <div onClick> */}
```

---

## Testing Components

### Example Test

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders with title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('calls onAction when button clicked', () => {
    const mockFn = jest.fn();
    render(<MyComponent onAction={mockFn} />);
    screen.getByRole('button').click();
    expect(mockFn).toHaveBeenCalled();
  });
});
```

---

End of Component Documentation

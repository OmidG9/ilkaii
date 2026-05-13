'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}

const FEATURED_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Dresses',
    slug: 'dresses',
    image: 'https://images.unsplash.com/photo-1572804419928-bb6eb6ebea10?w=500&h=500&fit=crop',
    description: 'Elegant dresses for every occasion',
  },
  {
    id: '2',
    name: 'Tops & Blouses',
    slug: 'tops',
    image: 'https://images.unsplash.com/photo-1566070570912-1b12fa6650a0?w=500&h=500&fit=crop',
    description: 'Premium blouses and tops',
  },
  {
    id: '3',
    name: 'Bottoms',
    slug: 'bottoms',
    image: 'https://images.unsplash.com/photo-1542272604-787c62d465d1?w=500&h=500&fit=crop',
    description: 'Stylish trousers and skirts',
  },
  {
    id: '4',
    name: 'Outerwear',
    slug: 'outerwear',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=500&h=500&fit=crop',
    description: 'Sophisticated jackets and coats',
  },
];

export function FeaturedCategories() {
  return (
    <section className="w-full py-16 md:py-24 bg-luxury-background">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
          <div className="space-y-3">
            <p className="text-luxury-secondary text-sm md:text-base font-semibold uppercase tracking-widest">
              Collections
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-5xl font-serif font-bold text-luxury-primary leading-tight">
              Shop by Category
            </h2>
            <p className="text-luxury-text/70 text-base md:text-lg max-w-2xl">
              Explore our curated selection of premium women's fashion, handpicked for quality and style.
            </p>
          </div>

          <Link
            href="/shop"
            className={cn(
              'inline-flex items-center gap-2',
              'px-6 py-3 rounded-lg',
              'bg-luxury-primary text-white font-semibold',
              'hover:bg-luxury-hover active:scale-95',
              'transition-all duration-200',
              'touch-target whitespace-nowrap'
            )}
          >
            View All
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              href={`/shop/${category.slug}`}
              className={cn(
                'group relative h-80 rounded-lg overflow-hidden',
                'bg-white border border-luxury-border',
                'hover:border-luxury-primary transition-all duration-300',
                'flex flex-col'
              )}
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden bg-luxury-background">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  quality={80}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className={cn(
                    'object-cover object-center w-full h-full',
                    'group-hover:scale-110 transition-transform duration-500'
                  )}
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-luxury-primary/0 group-hover:bg-luxury-primary/20 transition-colors duration-300" />
              </div>

              {/* Content */}
              <div className="flex-1 p-4 flex flex-col justify-end space-y-2">
                <h3 className={cn(
                  'text-xl font-serif font-bold text-luxury-primary',
                  'group-hover:text-luxury-hover transition-colors'
                )}>
                  {category.name}
                </h3>
                <p className="text-sm text-luxury-text/70">
                  {category.description}
                </p>
                <div className="flex items-center gap-1 text-luxury-secondary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  Explore
                  <ArrowRight size={16} />
                </div>
              </div>

              {/* Hover Border Effect */}
              <div className={cn(
                'absolute inset-0 border-2 border-transparent pointer-events-none',
                'group-hover:border-luxury-primary rounded-lg',
                'transition-colors duration-300'
              )} />
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 py-12 px-6 rounded-lg bg-luxury-primary/5 border border-luxury-border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-luxury-primary mb-2">
                Discover New Arrivals
              </h3>
              <p className="text-luxury-text/70">
                Fresh collections added weekly. Don't miss out on the latest luxury styles.
              </p>
            </div>
            <Link
              href="/shop/new-arrivals"
              className={cn(
                'inline-flex items-center justify-center gap-2',
                'px-8 py-3.5 rounded-lg',
                'bg-luxury-primary text-white font-semibold',
                'hover:bg-luxury-hover active:scale-95',
                'transition-all duration-200',
                'touch-target whitespace-nowrap',
                'min-w-max'
              )}
            >
              Shop New Arrivals
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { X, Heart, ShoppingCart, LogOut, User, Settings } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/cn';

export function MobileDrawer() {
  const { isDrawerOpen, closeDrawer } = useUIStore();

  const menuItems = [
    { label: 'Shop All', href: '/shop' },
    { label: 'Women', href: '/shop/women' },
    { label: 'New Arrivals', href: '/shop/new' },
    { label: 'Sale', href: '/shop/sale' },
    { label: 'Collections', href: '/collections' },
    { label: 'About Us', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden transition-opacity duration-300"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 w-80 max-w-[90vw]',
          'bg-luxury-background border-r border-luxury-border',
          'transform transition-transform duration-300 ease-in-out',
          'md:hidden overflow-y-auto',
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-luxury-border">
          <h2 className="text-xl font-serif font-bold text-luxury-primary">Menu</h2>
          <button
            onClick={closeDrawer}
            className={cn(
              'flex items-center justify-center',
              'w-12 h-12 rounded-lg hover:bg-luxury-primary/5',
              'transition-colors duration-200 active:scale-95'
            )}
            aria-label="Close menu"
          >
            <X size={24} className="text-luxury-primary" strokeWidth={1.5} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="py-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={cn(
                'block px-6 py-3 text-luxury-text hover:bg-luxury-primary/5',
                'hover:text-luxury-primary transition-colors duration-200',
                'font-medium border-b border-luxury-border/50'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-luxury-border" />

        {/* Quick Actions */}
        <div className="px-6 py-4 space-y-3">
          <Link
            href="/wishlist"
            onClick={closeDrawer}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg',
              'bg-white border border-luxury-border',
              'hover:bg-luxury-primary/5 transition-colors duration-200',
              'text-luxury-text font-medium touch-target'
            )}
          >
            <Heart size={20} className="text-luxury-secondary" />
            <span>Wishlist</span>
          </Link>

          <Link
            href="/cart"
            onClick={closeDrawer}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg',
              'bg-white border border-luxury-border',
              'hover:bg-luxury-primary/5 transition-colors duration-200',
              'text-luxury-text font-medium touch-target'
            )}
          >
            <ShoppingCart size={20} className="text-luxury-secondary" />
            <span>Shopping Cart</span>
          </Link>

          <Link
            href="/account"
            onClick={closeDrawer}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg',
              'bg-white border border-luxury-border',
              'hover:bg-luxury-primary/5 transition-colors duration-200',
              'text-luxury-text font-medium touch-target'
            )}
          >
            <User size={20} className="text-luxury-secondary" />
            <span>My Account</span>
          </Link>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-luxury-border bg-luxury-background space-y-3">
          <button
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-luxury-primary text-white font-medium',
              'hover:bg-luxury-hover transition-colors duration-200',
              'touch-target text-base'
            )}
          >
            Sign In
          </button>
          <p className="text-xs text-luxury-text/60 text-center">
            Don't have an account?{' '}
            <Link href="/signup" className="text-luxury-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}

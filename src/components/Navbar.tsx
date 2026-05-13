"use client";

import React from "react";
import Link from "next/link";
import { Menu, ShoppingCart, Heart, Search } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/cn";

export function Navbar() {
  const { toggleDrawer } = useUIStore();
  const [isSearchActive, setIsSearchActive] = React.useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-luxury-background border-b border-luxury-border">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleDrawer}
            className={cn(
              "flex md:hidden items-center justify-center",
              "w-12 h-12 rounded-lg hover:bg-luxury-primary/5",
              "transition-colors duration-200 active:scale-95",
            )}
            aria-label="Open menu"
          >
            <Menu size={24} className="text-luxury-primary" strokeWidth={1.5} />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className={cn(
              "absolute left-1/2 transform -translate-x-1/2 md:static md:transform-none",
              "text-2xl sm:text-3xl font-serif font-bold",
              "text-luxury-primary tracking-wide",
              "hover:opacity-80 transition-opacity",
            )}
          >
            ilkaii
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/shop"
              className="text-luxury-text hover:text-luxury-primary transition-colors font-medium"
            >
              Shop
            </Link>
            <Link
              href="/collections"
              className="text-luxury-text hover:text-luxury-primary transition-colors font-medium"
            >
              Collections
            </Link>
            <Link
              href="/about"
              className="text-luxury-text hover:text-luxury-primary transition-colors font-medium"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-luxury-text hover:text-luxury-primary transition-colors font-medium"
            >
              Contact
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Search - Responsive */}
            <button
              onClick={() => setIsSearchActive(!isSearchActive)}
              className={cn(
                "flex items-center justify-center",
                "w-12 h-12 rounded-lg hover:bg-luxury-primary/5",
                "transition-colors duration-200 active:scale-95",
              )}
              aria-label="Search"
            >
              <Search
                size={24}
                className="text-luxury-primary"
                strokeWidth={1.5}
              />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className={cn(
                "hidden sm:flex items-center justify-center",
                "w-12 h-12 rounded-lg hover:bg-luxury-primary/5",
                "transition-colors duration-200 active:scale-95",
              )}
              aria-label="Wishlist"
            >
              <Heart
                size={24}
                className="text-luxury-primary"
                strokeWidth={1.5}
              />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className={cn(
                "flex items-center justify-center",
                "w-12 h-12 rounded-lg hover:bg-luxury-primary/5",
                "transition-colors duration-200 active:scale-95",
                "relative",
              )}
              aria-label="Shopping cart"
            >
              <ShoppingCart
                size={24}
                className="text-luxury-primary"
                strokeWidth={1.5}
              />
              <span className="absolute top-2 right-2 w-5 h-5 bg-luxury-secondary text-white text-xs rounded-full flex items-center justify-center font-semibold">
                0
              </span>
            </Link>
          </div>
        </div>

        {/* Search Bar - Mobile */}
        {isSearchActive && (
          <div className="pb-4 animate-slide-up md:hidden">
            <input
              type="search"
              placeholder="Search products..."
              className={cn(
                "w-full px-4 py-3 rounded-lg",
                "bg-white border border-luxury-border",
                "text-luxury-text placeholder-gray-500",
                "focus:outline-none focus:border-luxury-primary",
                "text-base",
              )}
              autoFocus
            />
          </div>
        )}
      </div>
    </nav>
  );
}

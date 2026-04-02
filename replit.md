# LumynGo — Delivery Management System

## Overview

Full-stack delivery management platform for Kenya. Consists of a Next.js 15 web app + an Expo React Native mobile app sharing the same PostgreSQL backend.

## Architecture

### Web App (`lumyngo/`)

- **Framework**: Next.js 15 App Router + TypeScript
- **Database**: PostgreSQL via Prisma ORM v6
- **Auth**: Clerk v6 (keyless dev mode; add keys via Secrets tab)
- **Real-time**: Socket.io v4 (custom `server.ts`, path `/api/socketio`)
- **Payments**: PesaPal (graceful fallback when not configured)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Start command**: `cd lumyngo && npm run dev` (runs `tsx server.ts`)
- **Port**: reads `PORT` env var, defaults to 3000

### Mobile App (`artifacts/lumyngo-mobile/` + `lumyngo-mobile/`)

- **Framework**: Expo SDK 54 + React Native + Expo Router v6
- **Auth**: Phone-based (no Clerk) — phone + name stored in AsyncStorage, backend creates/finds User by phone
- **API**: Calls `https://$EXPO_PUBLIC_DOMAIN/api/mobile/*` with `x-mobile-user-id` header
- **Theme**: Dark navy (#0f172a) matching the web app
- **Tabs**: Customer (Orders, New, Profile) | Rider (Available, Deliveries, Earnings, Profile)
- **Workflow**: `artifacts/lumyngo-mobile: expo`

## User Roles

| Role       | Access                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| `CUSTOMER` | Create orders, track deliveries, view order history                           |
| `RIDER`    | Accept orders, update delivery status, live location broadcast, view earnings |
| `ADMIN`    | System dashboard, manage users & orders, view revenue stats                   |

Admin role determined by `ADMIN_USER_IDS` env var (comma-separated Clerk user IDs).

## Project Structure

```
lumyngo/
├── server.ts                     # Custom HTTP server with Socket.io
├── prisma/schema.prisma          # Full DB schema
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout (Clerk provider)
│   │   ├── (auth)/               # Sign in/sign up pages
│   │   ├── (customer)/           # Customer dashboard, orders, track
│   │   ├── (rider)/              # Rider dashboard, orders, earnings
│   │   ├── (admin)/              # Admin dashboard, users, orders
│   │   └── api/                  # All API routes
│   │       ├── auth/sync/        # Clerk→DB user sync
│   │       ├── orders/           # CRUD + estimate
│   │       ├── rider/            # Accept, status, location, earnings
│   │       ├── admin/            # Dashboard stats, users, orders
│   │       ├── payment/          # PesaPal initiate & callback
│   │       ├── ratings/          # Order ratings
│   │       ├── promo/            # Promo code validation
│   │       └── mobile/           # Mobile-specific API routes (no Clerk)
│   │           ├── auth/         # Register/login by phone
│   │           ├── orders/       # Customer orders CRUD
│   │           └── rider/        # Rider: orders, accept, update, earnings
│   ├── lib/
│   │   ├── auth.ts               # Clerk + Prisma user sync + admin check
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── pricing.ts            # Distance-based pricing + surge
│   │   ├── pesapal.ts            # PesaPal payment integration
│   │   └── utils.ts              # Formatters, color helpers, cn()
│   ├── hooks/
│   │   ├── useSocket.ts          # Socket.io hooks for order tracking
│   │   └── useLocation.ts        # Rider GPS broadcast hook
│   ├── services/                 # Client-side API service functions
│   ├── features/orders/          # CreateOrderModal component
│   ├── components/shared/        # AppNav shared navigation
│   ├── types/index.ts            # Shared TypeScript types
│   └── middleware.ts             # Clerk auth + role routing (/api/mobile/* is public)

artifacts/lumyngo-mobile/         # Expo mobile app (also mirrored in lumyngo-mobile/)
├── app/
│   ├── _layout.tsx               # Root layout with AuthProvider
│   ├── (tabs)/index.tsx          # Auth gate — redirects based on login state
│   ├── onboarding.tsx            # Registration (name, phone, role)
│   ├── (customer)/               # Customer tabs: Orders, New Order, Profile
│   ├── (rider)/                  # Rider tabs: Available, Deliveries, Earnings, Profile
│   └── track/[id].tsx            # Order tracking screen (auto-refreshes)
├── context/AuthContext.tsx        # AsyncStorage-based auth (phone/name/role)
└── lib/api.ts                    # Typed fetch client for /api/mobile/*
```

## Pricing Logic

- Base: KES 50
- Per km: KES 20
- Surge: 1.5× when ≥5 concurrent active orders
- Rider earns 80% of delivery price

## Environment Variables Required

| Secret                              | Purpose                                          |
| ----------------------------------- | ------------------------------------------------ |
| `SESSION_SECRET`                    | Already set                                      |
| `CLERK_SECRET_KEY`                  | Clerk backend auth                               |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend auth                              |
| `ADMIN_USER_IDS`                    | Comma-separated Clerk user IDs with admin access |
| `DATABASE_URL`                      | Auto-provided by Replit PostgreSQL               |
| `PESAPAL_CONSUMER_KEY`              | PesaPal payments (optional)                      |
| `PESAPAL_CONSUMER_SECRET`           | PesaPal payments (optional)                      |
| `GOOGLE_MAPS_API_KEY`               | Maps (optional, for future enhancement)          |

## Database Schema

7 models: `User`, `RiderProfile`, `Order`, `Payment`, `LocationTracking`, `Rating`, `PromoCode`

## Development

```bash
cd lumyngo
npm install
npm run db:push      # Push schema to DB
npm run dev          # Start app (port 3000)
```

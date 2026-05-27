# Seoul Aura

> Premium Korean & Dubai import e-commerce platform — built with Next.js, MongoDB, Tailwind CSS.

A full-stack web application for an import business specializing in Korean cosmetics and Dubai specialty foods. Supports e-commerce orders, monthly subscription plans, and a complete customer review ecosystem.

## Features

### Storefront
- **Homepage** — Hero, product carousels (New Arrivals, Best Sellers, K-Beauty, Hair Care), Shop by Skin Concern, brand grid, trust badges, and a beautiful review carousel pulling top-rated feedback.
- **Shop** — Filterable catalog by Type / Subtype / Origin (Korea / Dubai) with search, sort, and responsive product grid.
- **Product Detail** — Image gallery, pricing, stock status, add-to-bag with quantity, and a full **Review System**:
  - Aggregate rating summary with visual breakdown bar (1-5 stars)
  - Filter reviews by star rating
  - Sort by recent / highest / lowest
  - Scrollable review list with verified buyer badge, name, rating, date
  - Interactive "Write a Review" form with star selection and validation
- **Subscriptions** — Pricing grid with 4 monthly plans (K-Beauty Essentials, K-Beauty Luxe, Dubai Snack Box, Mixed). Benefits section and FAQ.
- **Cart & Checkout** — Persistent cart (localStorage), slide-in drawer, full cart page, multi-step checkout (Information → Shipping → Payment → Review) supporting both standard orders and subscription setups.

### Admin Dashboard
- **Metrics Overview** — Total orders, revenue, registered users, products, pending orders, pending reviews.
- **Product Management** — Add/edit/delete products with type, subtype, origin, price, stock, images, tags, and flags (featured / bestseller / new).
- **Dynamic Category Management** — Create new types (e.g., Food) and add subtypes (Snacks, Ramen, Beverages) on the fly.
- **Review Moderation** — Tabbed view (Pending / Approved / Flagged / All) with one-click Approve, Flag, or Delete. Auto-recalculates product average rating on approval.
- **Order Management** — Sortable order list with status badges and customer details.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | MongoDB + Mongoose |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Carousel | Embla Carousel |
| Typography | Cormorant Garamond (display) + Jost (body) |

## Project Structure

```
seoul-aura/
├── app/
│   ├── layout.tsx                 # Root layout with CartProvider
│   ├── page.tsx                   # Homepage
│   ├── globals.css                # Tailwind + design tokens
│   ├── shop/
│   │   ├── page.tsx               # Catalog with filters
│   │   └── [id]/
│   │       ├── page.tsx           # Product detail + reviews
│   │       └── AddToBag.tsx       # Client add-to-bag
│   ├── subscriptions/page.tsx     # Subscription plans
│   ├── cart/page.tsx              # Cart page
│   ├── checkout/page.tsx          # Multi-step checkout
│   ├── admin/
│   │   ├── layout.tsx             # Sidebar layout
│   │   ├── page.tsx               # Dashboard metrics
│   │   ├── products/page.tsx      # Inventory CRUD
│   │   ├── categories/page.tsx    # Dynamic categories
│   │   ├── reviews/page.tsx       # Review moderation
│   │   └── orders/page.tsx        # Orders list
│   └── api/
│       ├── products/route.ts + [id]/route.ts
│       ├── reviews/route.ts  + [id]/route.ts
│       ├── categories/route.ts + [id]/route.ts
│       ├── orders/route.ts
│       └── admin/stats/route.ts
├── components/
│   ├── layout/ (Header, Footer, CartDrawer)
│   ├── home/   (HeroBanner, ProductSection, SkinConcerns, ReviewCarousel, BrandSection, TrustBadges, Newsletter, FeatureBanner, TrendingSection)
│   ├── shop/   (ProductCard, ProductFilters)
│   ├── product/(ReviewSection, StarRating, WriteReview)
│   └── admin/  (Sidebar)
├── models/
│   ├── User.ts                    # Name, email, subscription status
│   ├── Product.ts                 # Catalog item
│   ├── Review.ts                  # Customer review (productId, rating, comment, isApproved…)
│   ├── Category.ts                # Type + subtypes
│   └── Order.ts                   # Order with items
├── context/CartContext.tsx        # Cart state + localStorage
├── lib/
│   ├── mongodb.ts                 # Cached Mongo connection
│   └── utils.ts                   # Formatting helpers
├── scripts/seed.ts                # Seed sample data
└── types/index.ts                 # Shared TypeScript types
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy or edit `.env.local`:

```env
MONGODB_URI=mongodb://localhost:27017/seoul-aura
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Seed sample data (optional but recommended)

```bash
npm run seed
```

This creates 2 categories, 10 products, ~25 reviews, and 3 sample users.

### 4. Run the dev server

```bash
npm run dev
```

Visit:
- **Storefront**: http://localhost:3000
- **Admin**: http://localhost:3000/admin

## Mongoose Schemas (`/models`)

| Model | Key Fields |
|-------|-----------|
| **User** | name, email, subscriptionStatus (none / active / paused / cancelled), addresses |
| **Product** | name, slug, description, price, comparePrice, origin (Korea/Dubai/Other), type, subtype, images, stock, tags, isFeatured/BestSeller/NewArrival, averageRating, reviewCount |
| **Review** | productId, userName, rating (1-5), title, comment, isApproved, isVerifiedBuyer, flagged |
| **Category** | type, slug, subtypes [{name, slug}] |
| **Order** | orderNumber, customerName, items[], subtotal, shippingFee, total, status, orderType (standard/subscription), shippingAddress, paymentMethod, paymentStatus |

## Key API Endpoints

```
GET    /api/products            ?type=&subtype=&origin=&featured=&search=
POST   /api/products            (admin: create product)
GET    /api/products/[id]       (by id or slug)
PUT    /api/products/[id]       (admin: update)
DELETE /api/products/[id]       (admin: delete)

GET    /api/reviews             ?productId=&approved=&top=&limit=
POST   /api/reviews             (submit; defaults isApproved=false)
PATCH  /api/reviews/[id]        (admin: approve / flag / unflag)
DELETE /api/reviews/[id]        (admin: delete; recalculates rating)

GET    /api/categories
POST   /api/categories          (admin: create category w/ subtypes)
PUT    /api/categories/[id]
PATCH  /api/categories/[id]     (admin: add a single subtype)
DELETE /api/categories/[id]

GET    /api/orders              ?status=&page=&limit=
POST   /api/orders              (checkout)

GET    /api/admin/stats         (dashboard metrics)
```

## Review Submission Flow

1. Customer fills the **Write a Review** form on a product page (`WriteReview.tsx`).
2. `POST /api/reviews` creates the review with `isApproved: false`.
3. Admin sees it in `/admin/reviews` under **Pending** tab.
4. `PATCH /api/reviews/[id]` with `{ isApproved: true }` approves it.
5. The API auto-recalculates the product's `averageRating` and `reviewCount` from all approved reviews.
6. The review now appears publicly on the product page and may be pulled into the homepage `ReviewCarousel`.

## Design System

- **Palette**: rose (#D4375E) for accents, ink (charcoal) for text, gold for ratings, soft rose backgrounds for elevation.
- **Typography**: Cormorant Garamond (italic-friendly serif) for headings, Jost for body and UI.
- **Aesthetic**: clean, minimalist, premium — generous whitespace, restrained color, subtle animations.

## License

Private — for internal use.

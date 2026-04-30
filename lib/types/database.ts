import type { UserRole } from "@/lib/types/domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          clinic_name: string | null;
          created_at?: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          role?: UserRole;
          clinic_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          role?: UserRole;
          clinic_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      pet_measurements: {
        Row: {
          user_id: string;
          neck_cm: number;
          chest_cm: number;
          back_length_cm: number;
          leg_girth_cm: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          neck_cm: number;
          chest_cm: number;
          back_length_cm: number;
          leg_girth_cm: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          neck_cm?: number;
          chest_cm?: number;
          back_length_cm?: number;
          leg_girth_cm?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pet_measurements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          price_huf: number;
          hero_image_url: string;
          material: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          price_huf: number;
          hero_image_url: string;
          material: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      vet_articles: {
        Row: {
          id: string;
          slug: string;
          question: string;
          answer: string;
          category: string;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          question: string;
          answer: string;
          category?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          question?: string;
          answer?: string;
          category?: string;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          additional_price_cents: number;
          stock: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          additional_price_cents?: number;
          stock?: number;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_cents: number;
          status: string;
          stripe_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_cents: number;
          status?: string;
          stripe_session_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price_cents: number;
          measurements: Json;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price_cents: number;
          measurements?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

/*
Suggested Supabase schema (run in SQL editor and adapt as needed):

create type user_role as enum ('customer', 'vet', 'admin');
create type order_status as enum ('pending', 'paid', 'processing', 'shipped', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null default 'customer',
  clinic_name text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  price_huf integer not null check (price_huf >= 0),
  hero_image_url text not null,
  material text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.vet_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  question text not null,
  answer text not null,
  category text not null default 'General',
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_vet_articles_updated_at
before update on public.vet_articles
for each row execute procedure public.set_timestamp_updated_at();

create table public.pet_measurements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  neck_cm numeric(6,2) not null check (neck_cm > 0),
  chest_cm numeric(6,2) not null check (chest_cm > 0),
  back_length_cm numeric(6,2) not null check (back_length_cm > 0),
  leg_girth_cm numeric(6,2) not null check (leg_girth_cm > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_pet_measurements_updated_at
before update on public.pet_measurements
for each row execute procedure public.set_timestamp_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null,
  additional_price_cents integer not null default 0,
  stock integer not null default 0,
  unique(product_id, size)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  total_cents integer not null,
  status order_status not null default 'pending',
  stripe_session_id text,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  variant_id uuid references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null,
  measurements jsonb not null default '{}'::jsonb
);

alter table public.profiles enable row level security;
alter table public.vet_articles enable row level security;
alter table public.pet_measurements enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Example policies to start:
-- products readable by everyone, mutable by admin
-- vet_articles readable by everyone when published, mutable by admin
-- orders and order_items readable/mutable by owner and admin
-- profiles readable by owner/admin
-- pet_measurements readable/mutable by owner and admin
*/

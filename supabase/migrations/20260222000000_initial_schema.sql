-- Sets / expansions
create table groups (
  group_id     int primary key,
  name         text not null,
  abbreviation text not null,
  synced_at    timestamptz
);

-- Cards
create table products (
  product_id   int primary key,
  group_id     int references groups(group_id),
  name         text not null,
  clean_name   text,
  image_url    text,
  url          text,

  card_number  text,
  card_type    text,

  colors       text[],
  rarity       text,
  cost         int,
  power        int,
  life         int,
  attribute    text,
  subtypes     text[],
  counter_plus int,
  description  text,
  tags         text[],

  is_alt_art   boolean default false,
  is_manga     boolean default false,
  is_sp        boolean default false,

  synced_at    timestamptz
);

-- Price history (append-only)
create table prices (
  id            bigserial primary key,
  product_id    int references products(product_id),
  sub_type_name text,
  low_price     numeric(10,2),
  mid_price     numeric(10,2),
  market_price  numeric(10,2),
  high_price    numeric(10,2),
  recorded_at   timestamptz default now()
);

-- Indexes
create index on products(group_id);
create index on products(card_number);
create index on products(rarity);
create index on products(card_type);
create index on products(cost);
create index on products using gin(colors);
create index on products using gin(subtypes);
create index on products using gin(tags);
create index on prices(product_id, recorded_at desc);
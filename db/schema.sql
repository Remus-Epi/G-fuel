-- Schema and seed data. Safe to run more than once.

-- Categories are the parents of products; the slug is the stable identifier in URLs/the API.
CREATE TABLE IF NOT EXISTS categories (
  id   SERIAL PRIMARY KEY,
  slug VARCHAR(50)  NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

-- The catalog stores the price as a number in the database and links each product to a category.
CREATE TABLE IF NOT EXISTS products (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER       NOT NULL REFERENCES categories(id),
  name        VARCHAR(150)  NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  image_url   VARCHAR(255),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Accounts: the password is never stored in plain text, only as password_hash (bcrypt).
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name    VARCHAR(100),
  last_name     VARCHAR(100),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
-- Emails are unique regardless of letter case.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

-- Idempotent seed: ON CONFLICT allows re-running without duplicates.
INSERT INTO categories (slug, name) VALUES
  ('drinks',      'Drinks'),
  ('t-shirts',    'Tricouri'),
  ('accessories', 'Accesorii')
ON CONFLICT (slug) DO NOTHING;

-- Existing shop products go into 'drinks'. Prices are placeholders.
INSERT INTO products (category_id, name, description, price, image_url)
SELECT c.id, p.name, p.description, p.price, p.image_url
FROM categories c
CROSS JOIN (VALUES
  ('Bahama Mama',         'Bahama Mama G-Fuel tub',         35.99, '/shop/(1)bahamamama.png'),
  ('Battle Juice',        'Battle Juice G-Fuel tub',        35.99, '/shop/(2)battleJ_front.png'),
  ('Black on Blackberry', 'Black on Blackberry G-Fuel tub', 35.99, '/shop/(3)BlackonBlackberry.png'),
  ('Blue Ice',            'Blue Ice G-Fuel tub',            35.99, '/shop/(4)Blueice.png'),
  ('Boysenberry',         'Boysenberry G-Fuel tub',         35.99, '/shop/(5)boysenberry.png'),
  ('Bubble Gum',          'Bubble Gum G-Fuel tub',          35.99, '/shop/(6)bubbleGum.png'),
  ('FaZeberry',           'FaZeberry G-Fuel tub',           35.99, '/shop/(7)fazeberry.png'),
  ('FaZe X',              'FaZe X G-Fuel tub',              35.99, '/shop/(8)FaZeXx.png')
) AS p(name, description, price, image_url)
WHERE c.slug = 'drinks'
ON CONFLICT (name) DO NOTHING;

-- More products in every category. Images and prices are placeholders.
INSERT INTO products (category_id, name, description, price, image_url)
SELECT c.id, p.name, p.description, p.price, p.image_url
FROM categories c
JOIN (VALUES
  ('drinks',      'Mango Tango',         'Mango and passion fruit energy formula',      34.99, '/products/mango-tango.svg'),
  ('drinks',      'Cherry Limeade',      'Sour cherry and lime energy formula',         34.99, '/products/cherry-limeade.svg'),
  ('drinks',      'Lemon Lime Zap',      'Crisp lemon lime energy formula',             34.99, '/products/lemon-lime-zap.svg'),
  ('drinks',      'Cotton Candy Cloud',  'Sweet cotton candy energy formula',           34.99, '/products/cotton-candy-cloud.svg'),
  ('t-shirts',    'Classic Logo Tee',    'Cotton tee with the classic logo print',      39.99, '/products/classic-logo-tee.svg'),
  ('t-shirts',    'Night Mode Tee',      'Black tee with a reflective front print',     44.99, '/products/night-mode-tee.svg'),
  ('t-shirts',    'Summit Tee',          'Lightweight tee for training days',           42.99, '/products/summit-tee.svg'),
  ('accessories', 'Shaker Bottle',       '700 ml shaker with a mixing ball',            12.99, '/products/shaker-bottle.svg'),
  ('accessories', 'Snapback Cap',        'Adjustable cap with embroidered logo',        24.99, '/products/snapback-cap.svg'),
  ('accessories', 'Gym Towel',           'Quick-dry microfiber towel',                  14.99, '/products/gym-towel.svg')
) AS p(slug, name, description, price, image_url) ON p.slug = c.slug
ON CONFLICT (name) DO NOTHING;

-- Messages from the "Keep in touch" form. Kept even if the email fails to send.
-- Messages are persisted before the email is sent, so they are not lost if SMTP is down.
CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(255)  NOT NULL,
  phone      VARCHAR(30)   NOT NULL,
  message    VARCHAR(5000) NOT NULL,
  email_sent BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Shopping cart for logged-in users. Guests keep their cart in the browser.
-- The authenticated cart has one row per user/product pair.
-- The composite key makes it possible to update the same line via UPSERT.
CREATE TABLE IF NOT EXISTS cart_items (
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER     NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER     NOT NULL CHECK (quantity BETWEEN 1 AND 99),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- Password reset tokens. Only a SHA-256 hash of the token is stored.
-- For resets, the token's hash is persisted, not the secret token sent by email.
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64)    NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);

# G-Fuel Demo Shop

A small demo storefront for G-Fuel energy drink flavors, built with Node.js and Express.

> This is a non-commercial practice project. It is not affiliated with G FUEL or FaZe Clan. Product names, images and logos belong to their respective owners.

## Stack

- **Backend:** Node.js 22, Express
- **Database:** PostgreSQL 18 (`pg`)
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5
- **Run locally:** Docker Compose (web app + database)

## Project structure

```
Dockerfile, docker-compose.yml  Web app and database containers
server.js                       Express server
src/routes/                     Auth, catalog, cart and contact API routes
src/utils/db.js                 PostgreSQL connection pool
src/utils/mailer.js             SMTP email (optional)
db/schema.sql, db/init.js       Tables and seed data
scripts/backup-db.sh            Dumps the database to backups/
public/
  index.html                    Homepage and contact form
  login.js                      Login widget (shared by all pages)
  cart/                         Cart page
  product/                      Product detail page
  register/                     Registration page
  password/forgot/, reset/      Password reset pages
  shop/                         Product listing, search, filters and sorting
  products/                     Placeholder product images
```

## Run with Docker (recommended)

Requirements: Docker with Compose v2.

1. Create your settings file and set `JWT_SECRET`:

   ```bash
   cp .env.example .env
   ```

   `.env` is git-ignored. Its `DATABASE_URL` is not used by the Docker setup, because `docker-compose.yml` points the web container at the local database.

2. Start both containers:

   ```bash
   docker compose up -d --build
   ```

3. Open <http://localhost:3001>.

On the first start, the database is created from `db/schema.sql`, which also adds the seed products. On later starts the data is kept.

### Where the data lives

- Database data is in the named volume `g-fuel_gfuel_pgdata` (Docker keeps it in its own storage, not in the project folder).
- `docker compose down` and `docker compose restart` keep the data.
- `docker compose down -v` deletes the volume and all data. It asks for no confirmation, so run it only when you want a clean database.
- After schema changes on an existing database, run `npm run db:init` against it, or restore a fresh dump. Changes in `schema.sql` are not applied automatically to a volume that already has data.

### Backups

```bash
./scripts/backup-db.sh
```

This writes `backups/gfuel-<timestamp>.sql`. To restore a dump into the local database:

```bash
docker compose exec -T db psql -U gfuel -d gfuel < backups/<file>.sql
```

`backups/` is git-ignored. Dumps contain user emails and password hashes, so do not share them.

### Ports

- The web app uses `WEB_PORT`, which defaults to `3001`. For example: `WEB_PORT=3002 docker compose up -d`.
- The database is bound to `127.0.0.1:5432` only. If you already run PostgreSQL on that port, stop it or change the mapping in `docker-compose.yml`.

## Run without Docker

You need Node.js 22 and a PostgreSQL 18 database that you can reach.

```bash
npm install
cp .env.example .env     # set DATABASE_URL, JWT_SECRET, and DATABASE_SSL=true for hosted databases that require SSL
npm run db:init
npm start
```

Open <http://localhost:3001>. Use `npm run dev` to restart automatically on changes.

## Configuration

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_SSL` | `true` to use SSL with certificate checks disabled (for hosted databases). Default `false` |
| `JWT_SECRET` | Required. Signs login tokens |
| `POSTGRES_PASSWORD` | Password for the Docker database user `gfuel` (default `gfuel_dev_password`, local development only) |
| `WEB_PORT` | Host port for the web app in Docker (default `3001`) |
| `APP_URL` | Public address, used in password reset links |
| `SMTP_*`, `CONTACT_TO` | Email for the contact form and password reset (optional) |

The server requires `JWT_SECRET`. All `/api` routes except `/api/hello` need the database.

## API

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/api/hello`    | Returns a test message                   |
| GET    | `/api/db-query` | Returns the current time from the database |
| POST   | `/api/auth/register` | Creates a user. Body: `email`, `password` (8-72 chars), optional `firstName`, `lastName`. Returns `user` and `token` (201, 409 if the email exists) |
| POST   | `/api/auth/login` | Body: `email`, `password`. Returns `user` and a JWT `token` valid 1 hour (401 on bad credentials) |
| POST   | `/api/auth/forgot-password` | Body: `email`. Always returns the same message, so it does not reveal which emails are registered. Sends a reset link valid 1 hour. Max 5 per IP per 10 minutes |
| POST   | `/api/auth/reset-password` | Body: `token`, `password` (8-72 chars). Single-use token; returns 400 if it is invalid, used or expired |
| GET    | `/api/products` | Lists products with their category. Optional `?category=<slug>` |
| GET    | `/api/products/{id}` | Returns one product (404 if missing) |
| GET    | `/api/categories` | Lists categories with product counts |
| GET    | `/api/cart` | The logged-in user's cart with totals. Requires `Authorization: Bearer <token>` (all `/api/cart` routes) |
| PUT    | `/api/cart/items/{productId}` | Body: `quantity` (0-99, 0 removes the item). Returns the cart |
| DELETE | `/api/cart/items/{productId}` | Removes one product. Returns the cart |
| DELETE | `/api/cart` | Empties the cart |
| POST   | `/api/cart/merge` | Body: `items: [{productId, quantity}]`. Adds a guest cart after login |
| POST   | `/api/contact` | Body: `name`, `email`, `phone`, `message`. Saves the message to `contact_messages` and emails it to `CONTACT_TO` when SMTP is configured. Max 5 per IP per 10 minutes |

Categories: `drinks`, `t-shirts`, `accessories`. Product prices and images in the seed data are placeholders.

Pages: product details at `/product/index.html?id=<productId>`, password reset at `/password/forgot/` and `/password/reset/`.

## Current limitations

- Contact and password reset emails need the `SMTP_*` settings. Without SMTP, in development the reset link is printed in the server log.
- Guests keep the cart in the browser; it moves to the account on login. There is no checkout yet.
- The rate limits for contact and password reset are kept in memory, so they reset on restart and do not apply across several containers.

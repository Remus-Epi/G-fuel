# G-Fuel Demo Shop

A small demo storefront for G-Fuel energy drink flavors, built with Node.js and Express.

> This is a non-commercial practice project. It is not affiliated with G FUEL or FaZe Clan. Product names, images and logos belong to their respective owners.

## Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (`pg`)
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5

## Project structure

```
server.js                      Express server
src/routes/                    Auth and catalog API routes
db/schema.sql, db/init.js      Tables and seed data
src/utils/RenderDbConnection.js  PostgreSQL connection pool
public/
  index.html                   Homepage and contact form
  login.js                     Login placeholder
  submitGetInTouch.js          Contact form behavior
  cart/                        Cart page
  register/                    Registration page (calls /api/auth/register)
  shop/
    index.html                 Product listing
    shop.js                    Search and basket
```

## Getting started

1. Install the dependencies:

   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.

3. Create the tables and seed data (safe to rerun):

   ```
   npm run db:init
   ```

4. Start the server:

   ```
   npm start
   ```

5. Open <http://localhost:3001>. Set `PORT` to use a different port.

The server requires `JWT_SECRET`. All `/api` routes except `/api/hello` need the database, and the connection requires SSL.

Use `npm run dev` to restart the server automatically on changes.

## API

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/api/hello`    | Returns a test message                   |
| GET    | `/api/db-query` | Returns the current time from the database |
| POST   | `/api/auth/register` | Creates a user. Body: `email`, `password` (8-72 chars), optional `firstName`, `lastName`. Returns `user` and `token` (201, 409 if the email exists) |
| POST   | `/api/auth/login` | Body: `email`, `password`. Returns `user` and a JWT `token` valid 1 hour (401 on bad credentials) |
| GET    | `/api/products` | Lists products with their category. Optional `?category=<slug>` |
| GET    | `/api/products/{id}` | Returns one product (404 if missing) |
| GET    | `/api/categories` | Lists categories with product counts |
| GET    | `/api/cart` | The logged-in user's cart with totals. Requires `Authorization: Bearer <token>` (all `/api/cart` routes) |
| PUT    | `/api/cart/items/{productId}` | Body: `quantity` (0-99, 0 removes the item). Returns the cart |
| DELETE | `/api/cart/items/{productId}` | Removes one product. Returns the cart |
| DELETE | `/api/cart` | Empties the cart |
| POST   | `/api/cart/merge` | Body: `items: [{productId, quantity}]`. Adds a guest cart after login |
| POST   | `/api/contact` | Body: `name`, `email`, `phone`, `message`. Saves the message to `contact_messages` and emails it to `CONTACT_TO` when SMTP is configured. Max 5 per IP per 10 minutes |
| POST   | `/api/auth/forgot-password` | Body: `email`. Always returns the same message, so it does not reveal which emails are registered. Sends a reset link valid 1 hour (needs `SMTP_*` and `APP_URL`). Max 5 per IP per 10 minutes |
| POST   | `/api/auth/reset-password` | Body: `token`, `password` (8-72 chars). Single-use token; returns 400 if it is invalid, used or expired |

Categories: `drinks`, `t-shirts`, `accessories`. Product prices and images in the seed data are placeholders.

Product pages: `/product/index.html?id=<productId>`. Password reset pages: `/password/forgot/` and `/password/reset/`.

## Current limitations

- Contact emails and password reset emails need the `SMTP_*` settings from `.env.example`. Without SMTP, in development the reset link is printed in the server log. Set `APP_URL` to the public address of the site.
- Guests keep the cart in the browser; it moves to the account on login. There is no checkout yet.
- Guests keep the cart in the browser; it moves to the account on login. There is no checkout yet.

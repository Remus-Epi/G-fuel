# G-Fuel Demo Shop

A small demo storefront for G-Fuel energy drink flavors, built with Node.js and Express.

> This is a non-commercial practice project. It is not affiliated with G FUEL or FaZe Clan. Product names, images and logos belong to their respective owners.

## Stack

- **Backend:** Node.js, Express
- **Database:** PostgreSQL (`pg`)
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5

## Project structure

```
server.js                      Express server and API routes
src/utils/RenderDbConnection.js  PostgreSQL connection pool
public/
  index.html                   Homepage and contact form
  login.js                     Login placeholder
  submitGetInTouch.js          Contact form behavior
  shop/
    index.html                 Product listing
    shop.js                    Search and basket
```

## Getting started

1. Install the dependencies:

   ```
   npm install
   ```

2. Start the server, setting `DATABASE_URL` to your PostgreSQL connection string (see `.env.example` for the format):

   ```
   DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE" npm start
   ```

3. Open <http://localhost:3001>. Set `PORT` to use a different port.

The pages load without a database. Only `/api/db-query` needs `DATABASE_URL`, and the connection requires SSL.

Use `npm run dev` to restart the server automatically on changes.

## API

| Method | Path            | Description                              |
|--------|-----------------|------------------------------------------|
| GET    | `/api/hello`    | Returns a test message                   |
| GET    | `/api/db-query` | Returns the current time from the database |

## Current limitations

- Login, registration and the contact form are not connected to a backend yet.
- The basket is stored only in the browser, and there is no checkout.

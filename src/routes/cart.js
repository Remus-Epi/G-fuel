const express = require('express');
const pool = require('../utils/RenderDbConnection.js');
const requireAuth = require('../middleware/requireAuth.js');

const router = express.Router();
router.use(requireAuth);

const MAX_QTY = 99;

async function cartFor(userId, db = pool) {
  const result = await db.query(
    `SELECT p.id AS "productId", p.name, p.price::float AS price, p.image_url AS "imageUrl",
            ci.quantity, (p.price * ci.quantity)::float AS "lineTotal"
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = $1
     ORDER BY p.id`,
    [userId]
  );
  const items = result.rows;
  return {
    items,
    totalQuantity: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: Math.round(items.reduce((sum, i) => sum + i.lineTotal, 0) * 100) / 100,
  };
}

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 && id <= 2147483647 ? id : null;
}

function handleError(res, error, label) {
  if (error.code === '23503') {
    return res.status(404).json({ error: 'Product not found' });
  }
  console.error(`${label}:`, error);
  res.status(500).json({ error: 'Cart request failed' });
}

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    res.json(await cartFor(req.userId));
  } catch (error) {
    handleError(res, error, 'Cart get error');
  }
});

// PUT /api/cart/items/:productId  body: { quantity }  (0 removes the item)
router.put('/items/:productId', async (req, res) => {
  const productId = parseId(req.params.productId);
  const quantity = (req.body || {}).quantity;
  if (!productId) {
    return res.status(400).json({ error: 'Product id must be a positive integer' });
  }
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QTY) {
    return res.status(400).json({ error: `Quantity must be an integer from 0 to ${MAX_QTY}` });
  }
  try {
    if (quantity === 0) {
      await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.userId, productId]);
    } else {
      await pool.query(
        `INSERT INTO cart_items (user_id, product_id, quantity) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = NOW()`,
        [req.userId, productId, quantity]
      );
    }
    res.json(await cartFor(req.userId));
  } catch (error) {
    handleError(res, error, 'Cart update error');
  }
});

// DELETE /api/cart/items/:productId
router.delete('/items/:productId', async (req, res) => {
  const productId = parseId(req.params.productId);
  if (!productId) {
    return res.status(400).json({ error: 'Product id must be a positive integer' });
  }
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [req.userId, productId]);
    res.json(await cartFor(req.userId));
  } catch (error) {
    handleError(res, error, 'Cart remove error');
  }
});

// DELETE /api/cart  (empties the cart)
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [req.userId]);
    res.json(await cartFor(req.userId));
  } catch (error) {
    handleError(res, error, 'Cart clear error');
  }
});

// POST /api/cart/merge  body: { items: [{ productId, quantity }] }
// Adds a guest cart to the user's cart after login. Unknown products are skipped.
router.post('/merge', async (req, res) => {
  const items = (req.body || {}).items;
  if (!Array.isArray(items) || items.length > 100) {
    return res.status(400).json({ error: 'items must be an array of at most 100 entries' });
  }
  const valid = items.filter(
    (i) => i && parseId(i.productId) && Number.isInteger(i.quantity) && i.quantity > 0
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of valid) {
      await client.query(
        `INSERT INTO cart_items (user_id, product_id, quantity)
         SELECT $1, id, LEAST($3::int, ${MAX_QTY}) FROM products WHERE id = $2
         ON CONFLICT (user_id, product_id)
         DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, ${MAX_QTY}), updated_at = NOW()`,
        [req.userId, item.productId, item.quantity]
      );
    }
    await client.query('COMMIT');
    res.json(await cartFor(req.userId));
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    handleError(res, error, 'Cart merge error');
  } finally {
    client.release();
  }
});

module.exports = router;

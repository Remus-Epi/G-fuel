const express = require('express');
const pool = require('../utils/RenderDbConnection.js');

const router = express.Router();

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.description, p.price::float AS price, p.image_url AS "imageUrl",
         json_build_object('id', c.id, 'slug', c.slug, 'name', c.name) AS category
  FROM products p
  JOIN categories c ON c.id = p.category_id`;

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.slug, c.name, COUNT(p.id)::int AS "productCount"
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.id`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

// GET /api/products  (optional ?category=<slug>)
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    const result = category
      ? await pool.query(`${PRODUCT_SELECT} WHERE c.slug = $1 ORDER BY p.id`, [category])
      : await pool.query(`${PRODUCT_SELECT} ORDER BY p.id`);
    res.json(result.rows);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// GET /api/products/:id
router.get('/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ error: 'Product id must be a positive integer' });
  }
  try {
    const result = await pool.query(`${PRODUCT_SELECT} WHERE p.id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ error: 'Failed to load product' });
  }
});

module.exports = router;

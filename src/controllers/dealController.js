const { db } = require('../config/database');

function getAllDeals(req, res) {
  try {
    const { category, search, sort } = req.query;

    let query = 'SELECT * FROM deals WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND LOWER(category) = LOWER(?)';
      params.push(category);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query += ' AND (title LIKE ? OR platform LIKE ? OR author LIKE ? OR description LIKE ?)';
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (sort === 'discount') {
      query += ' ORDER BY discount DESC';
    } else if (sort === 'ending-soon') {
      query += ' ORDER BY ends ASC';
    } else if (sort === 'upvotes') {
      query += ' ORDER BY upvotes DESC';
    } else {
      query += ' ORDER BY id DESC';
    }

    const stmt = db.prepare(query);
    const deals = stmt.all(...params);

    return res.status(200).json({
      success: true,
      count: deals.length,
      deals
    });
  } catch (error) {
    console.error('[DealController.getAllDeals]', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving deals' });
  }
}

function getDealById(req, res) {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM deals WHERE id = ?');
    const deal = stmt.get(id);

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    return res.status(200).json({ success: true, deal });
  } catch (error) {
    console.error('[DealController.getDealById]', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving deal' });
  }
}

function createDeal(req, res) {
  try {
    // 1. Must be authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please sign in to post trackers.'
      });
    }

    // 2. Check if user is verified or admin
    const user = db.prepare('SELECT id, is_verified, role, name FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found' });
    }

    const isVerified = (user.is_verified === 1 || user.role === 'admin');
    if (!isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Verification required: Unverified users cannot post trackers. Please verify your account first.'
      });
    }

    const {
      title,
      discount,
      platform,
      category,
      ends,
      original_price,
      sale_price,
      deal_url,
      description
    } = req.body;

    if (!title || discount === undefined || !platform || !category || !ends) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, discount, platform, category, and ends date are required'
      });
    }

    const uploader = user.name || 'Community Member';
    const numDiscount = Number(discount) || 0;
    const origPrice = Number(original_price) || 0;
    const sPrice = Number(sale_price) || 0;

    const stmt = db.prepare(`
      INSERT INTO deals (
        title, discount, platform, category, ends, author, user_id,
        original_price, sale_price, deal_url, description, upvotes, is_verified
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
    `);

    const info = stmt.run(
      title.trim(),
      numDiscount,
      platform.trim(),
      category.trim(),
      ends.trim(),
      uploader,
      user.id,
      origPrice,
      sPrice,
      (deal_url && deal_url.trim()) || '',
      (description && description.trim()) || ''
    );

    const newDeal = db.prepare('SELECT * FROM deals WHERE id = ?').get(info.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Sale tracker created successfully',
      deal: newDeal
    });
  } catch (error) {
    console.error('[DealController.createDeal]', error);
    return res.status(500).json({ success: false, message: 'Server error creating deal' });
  }
}

function updateDeal(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && existing.user_id && existing.user_id === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only administrators and the deal owner can edit this tracker'
      });
    }

    const {
      title,
      discount,
      platform,
      category,
      ends,
      original_price,
      sale_price,
      deal_url,
      description
    } = req.body;

    const stmt = db.prepare(`
      UPDATE deals
      SET title = COALESCE(?, title),
          discount = COALESCE(?, discount),
          platform = COALESCE(?, platform),
          category = COALESCE(?, category),
          ends = COALESCE(?, ends),
          original_price = COALESCE(?, original_price),
          sale_price = COALESCE(?, sale_price),
          deal_url = COALESCE(?, deal_url),
          description = COALESCE(?, description)
      WHERE id = ?
    `);

    stmt.run(
      title ? title.trim() : null,
      discount !== undefined ? Number(discount) : null,
      platform ? platform.trim() : null,
      category ? category.trim() : null,
      ends ? ends.trim() : null,
      original_price !== undefined ? Number(original_price) : null,
      sale_price !== undefined ? Number(sale_price) : null,
      deal_url !== undefined ? deal_url.trim() : null,
      description !== undefined ? description.trim() : null,
      id
    );

    const updated = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);

    return res.status(200).json({
      success: true,
      message: 'Deal updated successfully',
      deal: updated
    });
  } catch (error) {
    console.error('[DealController.updateDeal]', error);
    return res.status(500).json({ success: false, message: 'Server error updating deal' });
  }
}

function deleteDeal(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Sale tracker not found' });
    }

    // Allowed if current user is admin OR current user is the owner of this tracker
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && existing.user_id && existing.user_id === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only administrators or the creator of this tracker can delete it.'
      });
    }

    db.prepare('DELETE FROM deals WHERE id = ?').run(id);

    return res.status(200).json({
      success: true,
      message: 'Sale tracker deleted successfully'
    });
  } catch (error) {
    console.error('[DealController.deleteDeal]', error);
    return res.status(500).json({ success: false, message: 'Server error deleting deal' });
  }
}

function upvoteDeal(req, res) {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    db.prepare('UPDATE deals SET upvotes = upvotes + 1 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT id, upvotes FROM deals WHERE id = ?').get(id);

    return res.status(200).json({
      success: true,
      message: 'Deal verified/upvoted',
      upvotes: updated.upvotes
    });
  } catch (error) {
    console.error('[DealController.upvoteDeal]', error);
    return res.status(500).json({ success: false, message: 'Server error upvoting deal' });
  }
}

function getStats(req, res) {
  try {
    const totalRow = db.prepare('SELECT COUNT(*) as count, AVG(discount) as avgDiscount FROM deals').get();
    const categoriesRows = db.prepare('SELECT category, COUNT(*) as count FROM deals GROUP BY category').all();
    const platformsRows = db.prepare('SELECT platform, COUNT(*) as count FROM deals GROUP BY platform ORDER BY count DESC LIMIT 1').get();

    return res.status(200).json({
      success: true,
      stats: {
        totalTrackers: totalRow.count || 0,
        averageDiscount: Math.round(totalRow.avgDiscount || 0),
        topPlatform: platformsRows ? platformsRows.platform : 'N/A',
        categoryBreakdown: categoriesRows
      }
    });
  } catch (error) {
    console.error('[DealController.getStats]', error);
    return res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
}

module.exports = {
  getAllDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
  upvoteDeal,
  getStats
};


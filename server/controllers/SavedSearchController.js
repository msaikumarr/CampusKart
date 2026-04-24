const SavedSearch = require('../models/SavedSearch');
const Item = require('../models/Item');

const toNumberOrNull = (value) => {
  if (value === '' || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getEmailDomain = (email) => {
  const normalized = String(email || '').trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  return atIndex >= 0 ? normalized.slice(atIndex + 1) : '';
};

const buildItemQuery = (search, userId) => {
  const query = {
    isSold: { $ne: true },
    approvalStatus: 'approved',
  };

  if (search.mine) {
    query.createdBy = userId;
  }

  if (search.category && search.category !== 'All') {
    query.category = search.category;
  }

  const priceQuery = {};
  if (search.priceMin !== null && search.priceMin !== undefined) {
    priceQuery.$gte = search.priceMin;
  }
  if (search.priceMax !== null && search.priceMax !== undefined) {
    priceQuery.$lte = search.priceMax;
  }
  if (Object.keys(priceQuery).length > 0) {
    query.price = priceQuery;
  }

  if (search.query) {
    const regex = new RegExp(search.query, 'i');
    query.$or = [
      { title: regex },
      { category: regex },
      { description: regex },
    ];
  }

  return query;
};

const enrichSearch = async (search, userId, userEmail) => {
  const createdAfter = search.createdAt ? new Date(search.createdAt) : null;
  const filter = buildItemQuery(search, userId);
  if (createdAfter) {
    filter.createdAt = { $gte: createdAfter };
  }

  const matchingItems = await Item.find(filter)
    .populate('createdBy', '_id username email')
    .sort(search.sort === 'price_asc'
      ? { price: 1 }
      : search.sort === 'price_desc'
        ? { price: -1 }
        : search.sort === 'oldest'
          ? { createdAt: 1 }
          : { createdAt: -1 })
    .limit(3);

  const userDomain = getEmailDomain(userEmail);
  const matchingByCampus = search.campusOnly && userDomain
    ? matchingItems.filter((item) => getEmailDomain(item?.createdBy?.email) === userDomain)
    : matchingItems;

  return {
    ...search.toObject(),
    matchingCount: matchingByCampus.length,
    matchingItems: matchingByCampus,
  };
};

exports.getSavedSearches = async (req, res) => {
  try {
    const searches = await SavedSearch.find({ user: req.user._id }).sort({ createdAt: -1 });
    const enriched = await Promise.all(searches.map((search) => enrichSearch(search, req.user._id, req.user.email)));
    res.json(enriched);
  } catch (error) {
    console.error('Get saved searches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveSearch = async (req, res) => {
  try {
    const payload = {
      user: req.user._id,
      name: String(req.body.name || '').trim(),
      query: String(req.body.query || '').trim(),
      category: req.body.category || 'All',
      mine: req.body.mine === true || req.body.mine === 'true',
      campusOnly: req.body.campusOnly === true || req.body.campusOnly === 'true',
      priceMin: toNumberOrNull(req.body.priceMin),
      priceMax: toNumberOrNull(req.body.priceMax),
      sort: req.body.sort || 'newest',
    };

    const search = await SavedSearch.create(payload);
    const enriched = await enrichSearch(search, req.user._id, req.user.email);
    res.status(201).json({ search: enriched });
  } catch (error) {
    console.error('Save search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSearch = async (req, res) => {
  try {
    const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!search) {
      return res.status(404).json({ message: 'Search not found' });
    }

    res.json({ message: 'Saved search deleted' });
  } catch (error) {
    console.error('Delete search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
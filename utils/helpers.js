// The rating categories every cafe rating is broken down into.
const CATEGORIES = ['ambiance', 'service', 'food', 'drinks'];
const CATEGORY_LABELS = { ambiance: 'Ambiance', service: 'Service', food: 'Food', drinks: 'Drinks & Taste' };

function avg(nums) {
  if (!nums.length) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

// Given an array of rating docs (each with a `categories` object), returns
// the average for each category, e.g. { ambiance: 4.3, service: 4.0, ... }
function categoryAverages(ratings) {
  const result = {};
  CATEGORIES.forEach(cat => {
    const vals = ratings.map(r => r.categories && r.categories[cat]).filter(v => typeof v === 'number');
    result[cat] = avg(vals);
  });
  return result;
}

// A single "overall" number derived from the category averages, used for
// general sorting (top 10 cafes) when no specific category is requested.
function overallFromCategories(catAvgs) {
  const vals = CATEGORIES.map(c => catAvgs[c]).filter(v => v > 0);
  return avg(vals);
}

function isSameMonth(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function wordCount(str) {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

module.exports = { avg, isSameMonth, wordCount, CATEGORIES, CATEGORY_LABELS, categoryAverages, overallFromCategories };

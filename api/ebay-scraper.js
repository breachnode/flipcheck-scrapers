// 🔥 FlipCheck Famous Build — Latest Update (with Supabase Scraper Integration)

// ✅ eBay Scraper Integration (Pushes to Supabase)
// Scheduled via Vercel cron jobs (configured in vercel.json)
// Uses: eBay Browse API + Supabase Insert

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  'https://gtcgramfcdllhuoszoah.supabase.co',
  process.env.SUPABASE_ANON_KEY
);

const EBAY_AUTH_TOKEN = process.env.EBAY_AUTH_TOKEN;

export default async function handler(req, res) {
  const keywords = req.query.q ? [req.query.q] : ['iphone'];
  const logs = [];

  for (const query of keywords) {
    try {
      const ebayURL = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=5`;

      const ebayRes = await fetch(ebayURL, {
        headers: {
          Authorization: `Bearer ${EBAY_AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await ebayRes.json();
      const items = data.itemSummaries || [];

      for (const item of items) {
        const { title, price, itemWebUrl } = item;
        const { value, currency } = price || {};

        const { error } = await supabase.from('deals').insert([
          {
            title,
            price: value,
            currency,
            url: itemWebUrl,
            source: 'eBay',
            scraped_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          logs.push(`Insert error: ${error.message}`);
        } else {
          logs.push(`Inserted: ${title}`);
        }
      }
    } catch (err) {
      logs.push(`Query error for ${query}: ${err.message}`);
    }
  }

  return res.status(200).json({ message: 'eBay data sync complete', logs });
}

// ✅ Add to vercel.json:
/*
{
  "functions": {
    "api/ebay-scraper.js": {
      "runtime": "nodejs18.x"
    }
  },
  "crons": [
    {
      "path": "/api/ebay-scraper.js",
      "schedule": "@every 15m"
    }
  ]
}
*/

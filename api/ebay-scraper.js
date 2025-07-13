// 🔥 FlipCheck Famous Build — Updated eBay Scraper (15min Scheduler + Dynamic Keywords)

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  'https://gtcgramfcdllhuoszoah.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0Y2dyYW1mY2RsbGh1b3N6b2FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Mjc0NjUsImV4cCI6MjA2NjEwMzQ2NX0.Pb9zid48Anu3VVX7Pb6d5AlzCCc3Dv8Uk5AdGOvx7ok'
);

const EBAY_AUTH_TOKEN = 'v^1.1#i^1#p^3#r^0#f^0#I^3#t^H4sYAAAAAAABnAQAABlZPwGfPVR0zMwA2MjUxNg**';

export default async function handler(req, res) {
  const { data: keywords, error: keywordErr } = await supabase
    .from('search_terms')
    .select('term')
    .order('created_at', { ascending: false })
    .limit(5);

  if (keywordErr || !keywords) {
    console.error('Error fetching keywords:', keywordErr);
    return res.status(500).json({ message: 'Failed to fetch keywords' });
  }

  for (const { term } of keywords) {
    const ebayURL = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${encodeURIComponent(term)}&limit=5`;

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
          keyword: term,
          scraped_at: new Date().toISOString(),
        },
      ]);

      if (error) console.error('Insert error:', error);
    }
  }

  res.status(200).json({ message: 'eBay data synced to Supabase' });
}

// ✅ Update vercel.json:
/*
{
  "functions": {
    "api/ebay-scraper.js": {
      "runtime": "nodejs18.x",
      "schedule": "@every 15m"
    }
  }
}
*/

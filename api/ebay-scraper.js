// api/ebay-scraper.js

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  'https://gtcgramfcdllhuoszoah.supabase.co',
  'your-anon-key' // Replace this with your real anon key again if removed
);

const EBAY_AUTH_TOKEN = 'your-ebay-token'; // Replace with real token
const keywords = ['iphone', 'macbook', 'nintendo'];

export default async function handler(req, res) {
  console.log('📦 Starting eBay scraper job');

  for (const query of keywords) {
    console.log(`🔍 Searching eBay for: ${query}`);
    const ebayURL = `https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=5`;

    try {
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
          console.error('❌ Supabase insert error:', error);
        } else {
          console.log(`✅ Inserted: ${title}`);
        }
      }
    } catch (err) {
      console.error(`❌ eBay fetch error for "${query}":`, err);
    }
  }

  console.log('🏁 Scraper job finished');
  res.status(200).json({ message: 'eBay data pushed to Supabase' });
}

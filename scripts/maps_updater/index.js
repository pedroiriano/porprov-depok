const { Client } = require('pg');
const { chromium } = require('playwright');

// SECURITY: Connection credentials must be supplied by the operator and must
// never be committed to source control.
const connectionString = process.env.MAPS_UPDATER_DATABASE_URL;

if (!connectionString) {
  throw new Error('MAPS_UPDATER_DATABASE_URL is required');
}

(async () => {
  const client = new Client({ connectionString });
  await client.connect();

  const res = await client.query(`
    SELECT id, title, map_route_url
    FROM city_guides
    WHERE title NOT IN (
      '3Sons Coffee', 'A Lot of Coffee Depok', 'Alin Apartemen',
      'Apartemen Margonda Residence 2 by Andrew',
      'Apartemen Margonda Residence 2 by Patrick',
      'Apartemen Royal Garden', 'Artivator', 'Department Sports Lab'
    )
    ORDER BY id ASC
  `);

  const places = res.rows;
  console.log(`Found ${places.length} places to update.`);

  const browser = await chromium.launch({ headless: true });

  // Create 5 concurrent workers
  const CONCURRENCY = 5;
  let index = 0;

  async function worker(workerId) {
    const context = await browser.newContext();
    const page = await context.newPage();

    while (true) {
      const currentIndex = index++;
      if (currentIndex >= places.length) break;

      const place = places[currentIndex];
      try {
        const query = encodeURIComponent(`${place.title} Depok`);
        const searchUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

        await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });

        // Wait briefly for redirect
        await page.waitForTimeout(1500);

        let finalUrl = page.url();
        if (finalUrl.includes('consent.google.com')) {
          await page.click('button:has-text("Accept all"), button:has-text("I agree")').catch(() => {});
          await page.waitForTimeout(1000);
          finalUrl = page.url();
        }

        let cleanUrl = finalUrl;
        if (finalUrl.includes('/maps/place/')) {
          const urlObj = new URL(finalUrl);
          urlObj.search = '';
          cleanUrl = urlObj.toString();
        } else {
          cleanUrl = searchUrl;
        }

        await client.query('UPDATE city_guides SET map_route_url = $1 WHERE id = $2', [cleanUrl, place.id]);
        console.log(`[Worker ${workerId}] [${currentIndex + 1}/${places.length}] Updated ${place.title} -> ${cleanUrl}`);
      } catch (error) {
        console.error(`[Worker ${workerId}] Failed for ${place.title}: ${error.message}`);
      }
    }

    await context.close();
  }

  const workers = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    workers.push(worker(i));
  }

  await Promise.all(workers);

  await browser.close();
  await client.end();
  console.log('Done updating!');
})();

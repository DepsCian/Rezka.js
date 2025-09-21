import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';
import fs from 'fs';
import path from 'path';

describe('Search Parser', () => {
  it('should get paginated search results and all results', async () => {
    const scraper = new Scraper();

    const paginatedResult = await scraper.search.get({ query: 'Во', page: 1, pageSize: 10 });

    expect(paginatedResult.data).toBeInstanceOf(Array);
    expect(paginatedResult.data.length).toBeGreaterThan(0);
    expect(paginatedResult.meta.currentPage).toBe(1);
    expect(paginatedResult.meta.pageSize).toBe(10);

    const allMovies = await scraper.search.getAll({ query: 'Во' });
    const outputPath = path.join(process.cwd(), 'search.json');
    fs.writeFileSync(outputPath, JSON.stringify(allMovies, null, 2));

    console.log(`Saved ${allMovies.length} movies to ${outputPath}`);
    expect(allMovies.length).toBeGreaterThan(paginatedResult.data.length);
  }, 30000);
});

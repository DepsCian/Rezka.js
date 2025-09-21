import { describe, it, expect } from 'bun:test';
import { Scraper } from '@/scraper';
import { Genre, Filter } from '@/types';

describe('Movies Parser', () => {
  it('should get a list of series and save all to a file', async () => {
    const scraper = new Scraper();

    const paginatedResult = await scraper.movies.get({
      genre: Genre.SERIES,
      filter: Filter.WATCHING,
      page: 1,
      pageSize: 5,
    });

    expect(paginatedResult.data).toBeInstanceOf(Array);
    expect(paginatedResult.data.length).toBe(5);
    expect(paginatedResult.meta.currentPage).toBe(1);

    // const allMovies = await scraper.movies.getAll({
    //   genre: Genre.SERIES,
    //   filter: Filter.WATCHING,
    // });

    // const outputPath = path.join(process.cwd(), 'movies.json');
    // fs.writeFileSync(outputPath, JSON.stringify(allMovies, null, 2));

    // console.log(`Saved ${allMovies.length} movies to ${outputPath}`);
    // expect(allMovies.length).toBeGreaterThan(0);
  }, 30000);
});

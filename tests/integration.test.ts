import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';
import { ContentType } from '../src/types';
import fs from 'fs';
import path from 'path';

describe('Integration Test', () => {
  it(
    'should get genres, then get movies from the first series subgenre',
    async () => {
      const scraper = new Scraper();

      const allGenres = await scraper.genres.getAll();
      const seriesGenres = allGenres[ContentType.SERIES];
      expect(seriesGenres).toBeArray();
      if (!seriesGenres || seriesGenres.length === 0) {
        throw new Error('No series genres found');
      }

      const firstSubgenre = seriesGenres[0];
      if (!firstSubgenre) {
        throw new Error('First subgenre is undefined');
      }
      const firstSubgenreUrl = firstSubgenre.url;
      expect(firstSubgenreUrl).toBeString();

      const movies = await scraper.movies.get({
        genreUrl: firstSubgenreUrl,
      });

      const outputPath = path.join(process.cwd(), 'integration_movies.json');
      fs.writeFileSync(outputPath, JSON.stringify(movies.data, null, 2));
      console.log(`Saved ${movies.data.length} movies to ${outputPath}`);

      expect(movies.data.length).toBeGreaterThan(0);
    },
    {
      timeout: 60000,
    }
  );
});

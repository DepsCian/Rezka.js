import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';
import { ContentType } from '../src/types';
import fs from 'fs';
import path from 'path';

describe('Genres Parser', () => {
  it('should get all genres and save to a file', async () => {
    const scraper = new Scraper();
    const genres = await scraper.genres.getAll();

    const outputPath = path.join(process.cwd(), 'genres.json');
    fs.writeFileSync(outputPath, JSON.stringify(genres, null, 2));
    console.log(`Saved genres to ${outputPath}`);

    expect(genres[ContentType.FILMS]).toBeArray();
    expect(genres[ContentType.SERIES]).toBeArray();
    expect(genres[ContentType.CARTOONS]).toBeArray();
    expect(genres[ContentType.ANIME]).toBeArray();

    if (genres[ContentType.FILMS]) {
      expect(genres[ContentType.FILMS].length).toBeGreaterThan(0);
    }
  }, {
    timeout: 30000
  });
});
import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';
import fs from 'fs';
import path from 'path';

describe('Continue Parser', () => {
  it('should get a list of watched movies after login and save to a file', async () => {
    // IMPORTANT: To run this test, you must provide your own credentials.
    const login = process.env.TEST_LOGIN;
    const password = process.env.TEST_PASSWORD;

    if (!login || !password) {
      console.warn(
        'Skipping "continue" test: HDREZKA_LOGIN and HDREZKA_PASSWORD environment variables are not set.'
      );
      return;
    }

    const scraper = new Scraper();
    const loginResult = await scraper.auth.login(login, password);

    expect(loginResult.success).toBe(true);

    const watchedMovies = await scraper.continue.extract();

    expect(watchedMovies).toBeInstanceOf(Array);
    expect(watchedMovies.length).toBeGreaterThan(0);

    const firstMovie = watchedMovies[0];
    if (firstMovie) {
      expect(firstMovie).toHaveProperty('id');
      expect(firstMovie).toHaveProperty('url');
      expect(firstMovie).toHaveProperty('title');
      expect(firstMovie).toHaveProperty('lastWatchedInfo');
      expect(firstMovie).toHaveProperty('lastWatchedAt');
      expect(firstMovie.lastWatchedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }

    const outputPath = path.join(process.cwd(), 'continue.json');
    fs.writeFileSync(outputPath, JSON.stringify(watchedMovies, null, 2));

    console.log(`Saved ${watchedMovies.length} watched movies to ${outputPath}`);
  }, 30000);
});

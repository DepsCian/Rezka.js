import { describe, it } from 'bun:test';
import { Scraper } from '../src/scraper';
import fs from 'fs';
import path from 'path';

describe('Movie Parser', () => {
  it('should get detailed information for a movie and save to a file', async () => {
    const login = process.env.TEST_LOGIN;
    const password = process.env.TEST_PASSWORD;
    
    if (!login || !password) {
      console.warn('Skipping "movie" test: TEST_LOGIN and TEST_PASSWORD environment variables are not set.');
      return;
    }

    const scraper = new Scraper();
    await scraper.auth.login(login, password);

    const movieDetails = await scraper.movie.get(80082);

    if (movieDetails.currentWatch && movieDetails.seasons) {
      const { streams, subtitles } = await scraper.stream.get(movieDetails.id, movieDetails.currentWatch.translatorId, movieDetails.currentWatch.season, movieDetails.currentWatch.episode);
      const seasonIndex = movieDetails.currentWatch.season - 1;
      const episodeIndex = movieDetails.currentWatch.episode - 1;

      if (movieDetails.seasons[seasonIndex] && movieDetails.seasons[seasonIndex].episodes[episodeIndex]) {
        movieDetails.seasons[seasonIndex].episodes[episodeIndex].streams = streams;
        movieDetails.seasons[seasonIndex].episodes[episodeIndex].subtitles = subtitles;
      }
    }

    const outputPath = path.join(process.cwd(), 'movie.json');
    fs.writeFileSync(outputPath, JSON.stringify(movieDetails, null, 2));

    console.log(`Saved movie details to ${outputPath}`);
  }, {
    timeout: 60000,
  });
});
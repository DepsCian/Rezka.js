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

    const movieDetails = await scraper.movie.get(79659);

    // console.log(movieDetails)
      const season = movieDetails.seasons[0];
      const episode = season.episodes[0];
      console.log(season)
      console.log(episode)
      if (season && episode) {
        console.log('PARSING')
        const { streams, subtitles } = await scraper.stream.get(movieDetails.id, 59, season.id, episode.id);
        episode.streams = streams;
        episode.subtitles = subtitles;
      }

    const outputPath = path.join(process.cwd(), 'movie.json');
    fs.writeFileSync(outputPath, JSON.stringify(movieDetails, null, 2));

    console.log(`Saved movie details to ${outputPath}`);
  }, {
    timeout: 60000,
  });
});
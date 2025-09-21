import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';
import fs from 'fs';
import path from 'path';

describe('Person Parser', () => {
  it('should get detailed information for a person and save to a file', async () => {
    const scraper = new Scraper();
    // Person ID: 10144 (Анна Ганн), Movie ID: 646 (Во все тяжкие)
    const personDetails = await scraper.person.get({ personId: 657, movieId: 646 });

    const outputPath = path.join(process.cwd(), 'person.json');
    fs.writeFileSync(outputPath, JSON.stringify(personDetails, null, 2));
    console.log(`Saved person details to ${outputPath}`);

    expect(personDetails.id).toBe(10144);
    expect(personDetails.name).toBe('Анна Ганн');
    expect(personDetails.url).toContain('10144-anna-gann');
  }, {
    timeout: 30000
  });
});
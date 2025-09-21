import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';
import fs from 'fs';
import path from 'path';

describe('Person Parser', () => {
  it(
    'should get detailed information for a person and save to a file',
    async () => {
      const scraper = new Scraper();
      const personDetails = await scraper.person.get({ personId: 657, movieId: 646 });

      const outputPath = path.join(process.cwd(), 'person.json');
      fs.writeFileSync(outputPath, JSON.stringify(personDetails, null, 2));
      console.log(`Saved person details to ${outputPath}`);

      expect(personDetails.id).toBe(657);
      expect(personDetails.name).toBe('Брайан Крэнстон');
      expect(personDetails.url).toContain('657-brayan-krenston');
    },
    {
      timeout: 30000,
    }
  );
});

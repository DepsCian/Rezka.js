import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';
import fs from 'fs';
import path from 'path';

describe('Comments Parser', () => {
  it('should get comments for a movie, like a comment and get likes', async () => {
    const scraper = new Scraper();
    const comments = await scraper.comments.get(1743, 1);

    expect(comments.data).toBeInstanceOf(Array);
    expect(comments.data.length).toBeGreaterThan(0);
    expect(comments.meta.currentPage).toBe(1);
    expect(comments.meta.pageSize).toBe(comments.data.length);

    const firstComment = comments.data[0];
    if (firstComment) {
      await scraper.comments.like(firstComment.id);
      const likes = await scraper.comments.getLikes(firstComment.id);
      expect(likes).toBeInstanceOf(Array);
    }

    const outputPath = path.join(process.cwd(), 'comments.json');
    fs.writeFileSync(outputPath, JSON.stringify(comments, null, 2));
    console.log(`Saved ${comments.data.length} comments to ${outputPath}`);
  });
});
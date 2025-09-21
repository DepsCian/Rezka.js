import type { Scraper } from './scraper';
import { load } from 'cheerio';
import type { CheerioAPI } from 'cheerio';

export abstract class Page<T> {
  protected readonly scraper: Scraper;

  constructor(scraper: Scraper) {
    this.scraper = scraper;
  }

  protected parse(html: string): CheerioAPI {
    return load(html);
  }

  public abstract extract(): Promise<T>;
}
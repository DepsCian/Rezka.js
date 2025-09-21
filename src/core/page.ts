import type { Scraper } from './scraper';
import { load } from 'cheerio';
import type { CheerioAPI, Cheerio } from 'cheerio';
import type { Element } from 'domhandler';
import { ParsingError } from '../errors';

export abstract class Page<T> {
  protected readonly scraper: Scraper;

  constructor(scraper: Scraper) {
    this.scraper = scraper;
  }

  protected parse(html: string): CheerioAPI {
    return load(html);
  }

  protected extractText($: CheerioAPI, context: Cheerio<Element> | string, selector?: string): string {
    const element = typeof context === 'string' ? $(context) : context;
    const target = selector ? element.find(selector) : element;
    
    if (!target.length) {
      throw new ParsingError(`Could not find text for selector: "${selector ?? context}"`);
    }
    
    return target.text().trim();
  }

  protected extractAttribute($: CheerioAPI, context: Cheerio<Element> | string, attribute: string, selector?: string): string {
    const element = typeof context === 'string' ? $(context) : context;
    const target = selector ? element.find(selector) : element;

    if (!target.length) {
      throw new ParsingError(`Could not find attribute "${attribute}" for selector: "${selector ?? context}"`);
    }
    
    const attr = target.attr(attribute);

    if (!attr) {
      throw new ParsingError(`Attribute "${attribute}" is empty for selector: "${selector ?? context}"`);
    }

    return attr;
  }

  public abstract extract(): Promise<T>;
}
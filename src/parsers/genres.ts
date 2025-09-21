import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import { ContentType } from '../types';
import type { GenreInfo } from '../types';

export class Genres extends Page<Record<ContentType, GenreInfo[]>> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async getAll(): Promise<{ [key in ContentType]?: GenreInfo[] }> {
    const response = await this.scraper.get('');
    const $ = this.parse(response.body);
    const result: { [key in ContentType]?: GenreInfo[] } = {};

    $('#topnav-menu .b-topnav__item').each((_, item) => {
      const $item = $(item);
      const categoryText = this.extractText($, $item, '.b-topnav__item-link');
      const contentType = Object.values(ContentType).find((c) => c === categoryText);

      if (contentType) {
        const genres: GenreInfo[] = [];
        $item.find('.b-topnav__sub ul.left a').each((_, genreEl) => {
          const $genreEl = $(genreEl);
          genres.push({
            name: this.extractText($, $genreEl),
            url: this.extractAttribute($, $genreEl, 'href'),
          });
        });
        result[contentType] = genres;
      }
    });

    return result;
  }

  public async extract(): Promise<Record<ContentType, GenreInfo[]>> {
    throw new Error('This method is not applicable for the Genres parser. Use getAll() instead.');
  }
}

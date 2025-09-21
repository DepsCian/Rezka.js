import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import { ContentType } from '../types';
import type { GenreInfo } from '../types';

export class Genres extends Page<any> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async getAll(): Promise<{ [key in ContentType]?: GenreInfo[] }> {
    const response = await this.scraper.get('');
    const $ = this.parse(response.body);
    const result: { [key in ContentType]?: GenreInfo[] } = {};

    $('#topnav-menu .b-topnav__item').each((_, item) => {
      const $item = $(item);
      const categoryText = $item.find('.b-topnav__item-link').text().trim();
      const contentType = Object.values(ContentType).find(c => c === categoryText);

      if (contentType) {
        const genres: GenreInfo[] = [];
        $item.find('.b-topnav__sub ul.left a').each((_, genreEl) => {
          const $genreEl = $(genreEl);
          genres.push({
            name: $genreEl.text(),
            url: $genreEl.attr('href') || ''
          });
        });
        result[contentType] = genres;
      }
    });

    return result;
  }

  public async extract(): Promise<any> {
    throw new Error('This method is not applicable for the Genres parser. Use getAll() instead.');
  }
}
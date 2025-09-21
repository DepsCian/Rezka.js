import { Page } from '@/core/page';
import type { Scraper } from '@/core/scraper';
import type { Movie, Paginated } from '@/types';
import { parseMovies } from './utils';

export class Search extends Page<Movie[]> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async get({
    query,
    page = 1,
    pageSize = 36,
  }: {
    query: string;
    page?: number;
    pageSize?: number;
  }): Promise<Paginated<Movie>> {
    const response = await this.scraper.get('search/', {
      searchParams: {
        do: 'search',
        subaction: 'search',
        q: query,
        page: String(page),
      },
    });

    const $ = this.parse(response.body);
    const moviesOnPage = parseMovies($, {
      extractText: this.extractText.bind(this),
      extractAttribute: this.extractAttribute.bind(this),
    });

    return {
      data: moviesOnPage.slice(0, pageSize),
      meta: {
        currentPage: page,
        pageSize,
      },
    };
  }

  public async getAll({ query }: { query: string }): Promise<Movie[]> {
    const allMovies: Movie[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const response = await this.scraper.get('search/', {
        searchParams: {
          do: 'search',
          subaction: 'search',
          q: query,
          page: String(page),
        },
      });

      const $ = this.parse(response.body);
      const moviesOnPage = parseMovies($, {
        extractText: this.extractText.bind(this),
        extractAttribute: this.extractAttribute.bind(this),
      });

      if (moviesOnPage.length === 0) {
        hasNextPage = false;
        break;
      }

      allMovies.push(...moviesOnPage);

      const nextButton = $('.b-navigation__next');
      if (nextButton.length === 0 || nextButton.parent().is('span')) {
        hasNextPage = false;
      }

      page++;
    }

    return allMovies;
  }

  public async extract(): Promise<Movie[]> {
    throw new Error(
      'This method is not applicable for the Search parser. Use get() or getAll() instead.'
    );
  }
}

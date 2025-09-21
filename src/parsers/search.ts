import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import type { Movie, Paginated } from '../types';
import { parseMovies } from './utils';

export class Search extends Page<Movie[]> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async get({ query, page = 1, pageSize = 36 }: { query: string, page?: number, pageSize?: number }): Promise<Paginated<Movie>> {
    const allMovies = await this.getAll({ query });
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = allMovies.slice(startIndex, endIndex);

    return {
      data,
      meta: {
        currentPage: page,
        pageSize,
        total: allMovies.length,
        totalPages: Math.ceil(allMovies.length / pageSize),
      }
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
      const moviesOnPage = parseMovies($);

      if (moviesOnPage.length === 0) {
        hasNextPage = false;
        break;
      }

      allMovies.push(...moviesOnPage);

      if ($('.b-navigation__next').length === 0) {
        hasNextPage = false;
      }
      
      page++;
    }

    return allMovies;
  }

  public async extract(): Promise<Movie[]> {
    throw new Error('This method is not applicable for the Search parser. Use get() or getAll() instead.');
  }
}
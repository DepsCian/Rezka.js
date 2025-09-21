import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import { Genre, Filter } from '../types';
import type { Movie, Paginated } from '../types';
import { parseMovies } from './utils';

type MoviesParams = { genre?: Genre, genreUrl?: string, filter?: Filter };

export class Movies extends Page<Movie[]> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async get({ page = 1, pageSize = 36, ...rest }: { page?: number, pageSize?: number } & MoviesParams): Promise<Paginated<Movie>> {
    const allMovies = await this.getAll(rest);
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

  public async getAll({ genre, genreUrl, filter }: MoviesParams): Promise<Movie[]> {
    const allMovies: Movie[] = [];
    let page = 1;
    let hasNextPage = true;

    const genrePaths: { [key in Genre]?: string } = {
      [Genre.FILMS]: 'films',
      [Genre.SERIES]: 'series',
      [Genre.CARTOONS]: 'cartoons',
      [Genre.ANIME]: 'animation',
    };

    while (hasNextPage) {
      let basePath = '';
      if (genreUrl) {
        basePath = genreUrl.startsWith('/') ? genreUrl.slice(1) : genreUrl;
      } else if (genre && genrePaths[genre]) {
        basePath = `${genrePaths[genre]}/`;
      }
      
      const pagePath = page > 1 ? `page/${page}/` : '';
      const path = `${basePath}${pagePath}`;
      
      const searchParams = new URLSearchParams();
      if (filter) {
        searchParams.set('filter', filter);
      }

      const response = await this.scraper.get(path, { searchParams });
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
    throw new Error('This method is not applicable for the Movies parser. Use get() or getAll() instead.');
  }
}
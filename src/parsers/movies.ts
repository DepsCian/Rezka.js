import { Page } from '@/core/page';
import type { Scraper } from '@/core/scraper';
import { Genre } from '@/types';
import type { Movie, Paginated, MoviesParams } from '@/types';
import { parseMovies } from './utils';

export class Movies extends Page<Movie[]> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async get({
    page = 1,
    pageSize = 36,
    genre,
    genreUrl,
    filter,
  }: { page?: number; pageSize?: number } & MoviesParams): Promise<Paginated<Movie>> {
    const genrePaths: { [key in Genre]?: string } = {
      [Genre.FILMS]: 'films',
      [Genre.SERIES]: 'series',
      [Genre.CARTOONS]: 'cartoons',
      [Genre.ANIME]: 'animation',
    };

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
      'This method is not applicable for the Movies parser. Use get() or getAll() instead.'
    );
  }
}

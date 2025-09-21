import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import { Career } from '../types';
import type { PersonDetails, Movie } from '../types';

type PersonInput = string | { personId: number; movieId: number };

export class Person extends Page<PersonDetails> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  private async getUrlFromIds(personId: number, movieId: number): Promise<string> {
    const response = await this.scraper.client.post('ajax/person_info/', {
      form: {
        id: personId,
        pid: movieId
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
      responseType: 'json'
    });

    const body = response.body as { success: boolean, message: string, person?: { link: string } };

    if (!body.success || !body.person?.link) {
      throw new Error(body.message || 'Failed to fetch person URL from AJAX');
    }

    return body.person.link;
  }

  public async get(input: PersonInput): Promise<PersonDetails> {
    let url: string;

    if (typeof input === 'string') {
      url = input;
    } else {
      url = await this.getUrlFromIds(input.personId, input.movieId);
    }

    const pageResponse = await this.scraper.get(url);
    const $ = this.parse(pageResponse.body);

    const filmography: { [role: string]: Movie[] } = {};
    $('.b-person__career').each((_, careerEl) => {
      const $careerEl = $(careerEl);
      const role = $careerEl.find('h2').text();
      if (!role) return;

      const movies: Movie[] = [];
      $careerEl.find('.b-sidelist .b-content__inline_item').each((_, movieEl) => {
        const $movieEl = $(movieEl);
        movies.push({
          id: Number($movieEl.attr('data-id')),
          url: $movieEl.find('.b-content__inline_item-cover a').attr('href') || '',
          title: $movieEl.find('.b-content__inline_item-link a').text(),
          imageUrl: $movieEl.find('.b-content__inline_item-cover img').attr('src') || '',
          type: $movieEl.find('.cat').is('.series') ? 'series' : 'movie',
          details: $movieEl.find('.misc').text()
        });
      });

      filmography[role] = movies;
    });
    
    let personId: number;
    if (typeof input === 'string') {
      personId = Number(url.match(/-(\d+)-/)?.[1] || 0);
    } else {
      personId = input.personId;
    }

    return {
      id: personId,
      url: url,
      name: $('.b-post__title .t1').text(),
      originalName: $('.b-post__title .t2').text() || undefined,
      photo: $('.b-sidecover img').attr('src') || '',
      careers: $('.b-post__info tr:contains("Карьера") a').map((_, el) => {
        const text = $(el).text().toLowerCase();
        const careerKey = Object.keys(Career).find(key => (Career[key as keyof typeof Career] as string).toLowerCase() === text);
        return careerKey ? Career[careerKey as keyof typeof Career] : undefined;
      }).get().filter((c): c is Career => !!c),
      height: parseFloat($('.b-post__info tr:contains("Рост") td').eq(1).text()) || undefined,
      birthDate: $('.b-post__info time[itemprop="birthDate"]').attr('datetime') || undefined,
      birthPlace: $('.b-post__info tr:contains("Место рождения") td').eq(1).text().trim() || undefined,
      filmography
    };
  }

  public async extract(): Promise<PersonDetails> {
    throw new Error('This method is not applicable for the Person parser. Use get() instead.');
  }
}
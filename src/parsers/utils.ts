import type { CheerioAPI } from 'cheerio';
import type { Element } from 'domhandler';
import type { Movie, Stream, Subtitle, PersonCredit, Link, Translator } from '../types';

export function parseMovies($: CheerioAPI): Movie[] {
  const moviesOnPage: Movie[] = [];
  $('.b-content__inline_item').each((_, el) => {
    const $el = $(el);
    const id = Number($el.attr('data-id'));
    const url = $el.find('.b-content__inline_item-cover a').attr('href') || '';
    const title = $el.find('.b-content__inline_item-link a').text();
    const imageUrl = $el.find('.b-content__inline_item-cover img').attr('src') || '';
    const type = $el.find('.cat i.entity').text();
    const details = $el.find('.b-content__inline_item-link div').text();
    const additionalInfo = $el.find('.info').text() || undefined;

    moviesOnPage.push({
      id,
      url,
      title,
      imageUrl,
      type,
      details,
      additionalInfo,
    });
  });
  return moviesOnPage;
}

export function parseDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const months: { [key: string]: string } = {
    'января': '01', 'февраля': '02', 'марта': '03', 'апреля': '04', 'мая': '05', 'июня': '06',
    'июля': '07', 'августа': '08', 'сентября': '09', 'октября': '10', 'ноября': '11', 'декабря': '12'
  };
  const parts = dateStr.split(' ');
  if (parts.length < 3) return undefined;
  const day = parts[0];
  const month = parts[1];
  const year = parts[2];
  if (!day || !month || !year || !months[month]) {
    return undefined;
  }
  return `${year}-${months[month]}-${day.padStart(2, '0')}`;
}

export function parsePersons($: any, table: any, label: string): PersonCredit[] | undefined {
  const persons: PersonCredit[] = [];
  table.find(`tr:contains("${label}") .persons-list-holder .item`).each((_: any, el: any) => {
    const $el = $(el).find('.person-name-item');
    const id = Number($el.attr('data-id'));
    const name = $el.find('span[itemprop="name"]').text();
    if (id && name) {
      persons.push({ id, name });
    }
  });
  return persons.length > 0 ? persons : undefined;
}

export function parseLinks($: any, table: any, label: string): Link[] | undefined {
  const links: Link[] = [];
  table.find(`tr:contains("${label}") a`).each((_: any, el: any) => {
    const $el = $(el);
    const name = $el.text();
    const url = $el.attr('href');
    if (name && url) {
      links.push({ name, url });
    }
  });
  return links.length > 0 ? links : undefined;
}

export function parseTranslators($: any): Translator[] | undefined {
    const translators: Translator[] = [];
    const popularityMap = new Map<string, number>();

    const statsTitle = $('.b-rgstats__help').attr('title');
    if (statsTitle) {
        const $stats = $(statsTitle);
        $stats.find('.b-rgstats__list_item').each((_: number, item: Element) => {
            const $item = $(item);
            const name = $item.find('.title').text().trim();
            const popularityText = $item.find('.count').text().replace('%', '').replace(',', '.');
            const popularity = parseFloat(popularityText);
            if (name && !isNaN(popularity)) {
                popularityMap.set(name, popularity);
            }
        });
    }

    $('.b-translator__item').each((_: number, el: Element) => {
        const $el = $(el);
        const id = $el.data('translator_id');
        const name = $el.attr('title');
        if (id && name) {
            const popularity = popularityMap.get(name.trim());
            translators.push({
                id: Number(id),
                name: name.trim(),
                popularity
            });
        }
    });
    return translators.length > 0 ? translators : undefined;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseStreams(obfuscatedUrls: string): Stream[] {
  let trashString = obfuscatedUrls.replace("#h", "").split("//_//").join("");
  const trashList = ["@", "#", "!", "^", "$"];
  const trashCodesSet: string[] = [];

  for (let i = 2; i < 4; i++) {
      const product = (...a: any[][]) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
      const combinations = product(...Array(i).fill(trashList));
      
      for (const chars of combinations) {
          const trashCombo = Buffer.from(chars.join('')).toString('base64');
          trashCodesSet.push(trashCombo);
      }
  }

  for (const trashCode of trashCodesSet) {
    trashString = trashString.replace(new RegExp(escapeRegExp(trashCode), 'g'), '');
  }
  
  const streamsStr = Buffer.from(trashString, 'base64').toString('utf8');

  const streamRegex = /\[([^\]]+)\]([^,]+)/g;
  let match;
  const streams: Stream[] = [];

  while ((match = streamRegex.exec(streamsStr)) !== null) {
    if (match[1] && match[2]) {
      const quality = match[1];
      match[2].split(' or ').forEach(url => {
        if (url.includes('//')) {
          streams.push({ quality, url: url.trim() });
        }
      });
    }
  }
  return streams;
}

export function parseSubtitles(subtitlesStr: string): Subtitle[] {
  const subtitles: Subtitle[] = [];
  const subtitleRegex = /\[([^\]]+)\](https?:\/\/[^\s,]+)/g;
  let match;
  while ((match = subtitleRegex.exec(subtitlesStr)) !== null) {
    if (match[1] && match[2]) {
      subtitles.push({
        language: match[1],
        url: match[2]
      });
    }
  }
  return subtitles;
}
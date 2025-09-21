import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';
import type { Comment, Paginated, Like } from '../types';
import type { Element } from 'domhandler';
import { load } from 'cheerio';
import { parseDateTime } from './utils';

export class Comments extends Page<Paginated<Comment>> {
  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async get(news_id: number, page: number = 1): Promise<Paginated<Comment>> {
    const response = await this.scraper.client.post('ajax/get_comments/', {
      form: {
        news_id,
        cstart: page,
        type: 0,
        comment_id: 0,
        skin: 'hdrezka'
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = JSON.parse(response.body);
    const $ = load(data.comments);

    const parseComment = (el: Element): Comment => {
        const $el = $(el);
        const id = Number($el.data('id'));
        const authorName = $el.find('.name').first().text();
        const avatar = $el.find('.ava img').first().attr('src') || '';
        const text = $el.find('.text').first().text();
        const date = parseDateTime($el.find('.date').first().text());
        const likes = Number($el.find('.b-comment__likes_count i').first().text());
        const isSpoiler = $el.find('.text.spoiler').first().length > 0;
        
        const replies: Comment[] = [];
        $el.find('> ol > li').each((_, replyEl) => {
            replies.push(parseComment(replyEl));
        });

        return {
            id,
            author: {
                name: authorName,
                avatar
            },
            text,
            date: date || '',
            likes,
            isSpoiler,
            replies
        };
    };

    const comments: Comment[] = [];
    $('body > ol > li').each((_, el) => {
        comments.push(parseComment(el));
    });

    const $$ = load(data.navigation);
    const lastPageLink = $$('.b-navigation a').last();
    const totalPages = lastPageLink.length > 0 ? Number(lastPageLink.text()) : page;

    return {
      data: comments,
      meta: {
        currentPage: page,
        pageSize: comments.length,
        totalPages
      }
    };
  }

  public async extract(): Promise<Paginated<Comment>> {
    throw new Error('This method is not applicable. Use get() instead.');
  }

  public async like(comment_id: number): Promise<void> {
    await this.scraper.client.get(`engine/ajax/comments_like.php?id=${comment_id}`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
  }

  public async getLikes(comment_id: number): Promise<Like[]> {
    const response = await this.scraper.client.post('ajax/comments_likes/', {
      form: {
        comment_id
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const data = JSON.parse(response.body);
    if (!data.success) {
      return [];
    }

    const $ = load(data.message);
    const likes: Like[] = [];

    $('.b-comment__likescontent_inner li').each((_, el) => {
      const $el = $(el);
      const name = $el.find('b').text();
      const avatar = $el.find('.ava img').attr('src') || '';
      likes.push({
        author: {
          name,
          avatar
        }
      });
    });

    return likes;
  }
}
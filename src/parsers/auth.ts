import { Page } from '../core/page';
import type { Scraper } from '../core/scraper';

export interface LoginResult {
  success: boolean;
  message?: string;
}

export interface UserProfile {
  email: string | null;
  gender: string | null;
  avatar: string | null;
}

export class Auth extends Page<LoginResult | UserProfile> {
  private userId: string | null = null;

  constructor(scraper: Scraper) {
    super(scraper);
  }

  public async login(login_name: string, login_password: string): Promise<LoginResult> {
    const params = new URLSearchParams();
    params.append('login_name', login_name);
    params.append('login_password', login_password);
    params.append('login_not_save', '0');

    const response = await this.scraper.client.post('ajax/login/', {
      form: Object.fromEntries(params),
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    const setCookieHeader = response.headers['set-cookie'];
    if (setCookieHeader) {
      const userIdCookie = setCookieHeader.find(c => c.startsWith('dle_user_id=') && !c.includes('deleted'));
      if (userIdCookie) {
        const match = userIdCookie.match(/dle_user_id=([^;]+)/);
        if (match && match[1]) {
          this.userId = match[1];
        }
      }
    }

    return JSON.parse(response.body);
  }

  public async getProfile(): Promise<UserProfile> {
    if (!this.userId) {
      throw new Error('User is not logged in or user ID could not be retrieved.');
    }

    const response = await this.scraper.get(`user/${this.userId}/`);
    const $ = this.parse(response.body);

    return {
      email: ($('#email').val() as string) || null,
      gender: $('#gender option:selected').text() || null,
      avatar: $('#avatar-profile img').attr('src') || null
    };
  }

  public async extract(): Promise<LoginResult | UserProfile> {
    throw new Error('This method is not applicable for the Auth parser. Use login() or getProfile() instead.');
  }
}
import { describe, it, expect } from 'bun:test';
import { Scraper } from '../src/scraper';

describe('Authentication', () => {
  it('should login and retrieve user profile', async () => {
    const login = process.env.TEST_LOGIN;
    const password = process.env.TEST_PASSWORD;

    if (!login || !password) {
      throw new Error('TEST_LOGIN and TEST_PASSWORD environment variables are required for this test.');
    }

    const scraper = new Scraper();
    const loginResult = await scraper.auth.login(login, password);

    expect(loginResult.success).toBe(true);

    const profile = await scraper.auth.getProfile();

    console.log(profile)

    expect(profile.email).toBe(login);
  }, {
      timeout: 30000 // 30 seconds
  });
});
import { Scraper } from './src/scraper';
import type { Movie } from './src/parsers/movies';
import type { LoginResult, UserProfile } from './src/parsers/auth';

export { Scraper };
export type { Movie, LoginResult, UserProfile };

// Example usage:
//
// async function main() {
//   const scraper = new Scraper();
//
//   // Log in
//   const loginResult = await scraper.auth.login('your-email', 'your-password');
//   if (!loginResult.success) {
//     console.error('Login failed:', loginResult.message);
//     return;
//   }
//
//   console.log('Login successful!');
//
//   // Get user profile
//   const profile = await scraper.auth.getProfile();
//   console.log('User Profile:', profile);
//
//   // Get new movies
//   const movies = await scraper.movies.extract();
//   console.log('New Movies:', movies);
// }
//
// main();

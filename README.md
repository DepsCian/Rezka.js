# Rezka.js

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" /></a>
  <img src="https://img.shields.io/github/license/DepsCian/rezka.js?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/github/package-json/v/DepsCian/rezka.js?style=for-the-badge" alt="Version" />
</p>

An advanced, unofficial Node.js API-library for the HDRezka. This scraper and parser allows you to programmatically access movies, series, and user data with a clean, promise-based interface.

## Features

- **Modern Tech Stack**: Leverages `got` for robust HTTP requests, `cheerio` for efficient HTML parsing, and `tough-cookie` for session management.
- **Typed API**: Fully typed with TypeScript for a superior developer experience and code safety.
- **Comprehensive Parsing**: Access various content types including movies, series, persons, genres, and comments.
- **Authentication**: Built-in support for user login and authenticated requests.
- **Structured Data**: Returns clean, predictable JSON objects for all parsed content.
- **Extensible**: Designed with a modular architecture that is easy to extend.

## Installation

This library is designed to be used with [Bun](https://bun.sh/).

```bash
bun add rezka.js
```

## Usage

```typescript
import { Scraper, Genre } from 'rezka.js';

const scraper = new Scraper();
```

### Authentication

To perform user-specific actions, you must first authenticate.

```typescript
const loginResult = await scraper.auth.login('your-email', 'your-password');
if (loginResult.success) {
  const profile = await scraper.auth.getProfile();
  console.log('User Profile:', profile);
}
```

### Movie & Person Details

Retrieve comprehensive details using a URL (recommended) or an ID.

```typescript
// Get movie details
const movieDetails = await scraper.movie.get('https://rezka.ag/films/fiction/123-the-matrix.html');
console.log('Movie Title:', movieDetails.title);

// Get person details
const personDetails = await scraper.person.get('https://rezka.ag/actors/11-keanu-reeves/');
console.log('Person Name:', personDetails.name);
```

### Video Streams

Get direct stream URLs for a specific episode. This requires the `id` and `translatorId` from the `movieDetails` object.

```typescript
const streams = await scraper.stream.get(movieDetails.id, movieDetails.translators[0].id, 1, 1);
console.log('Video Streams:', streams);
```

### Movies & Series

Fetch lists of movies, series, cartoons, or anime.

```typescript
const series = await scraper.movies.get({ genre: Genre.SERIES, page: 1 });
console.log('Latest Series:', series.data);
```

### Search

Find content by a query string.

```typescript
const searchResults = await scraper.search.get({ query: 'The Matrix' });
console.log('Search Results:', searchResults.data);
```

### Continue Watching

Retrieve the "continue watching" list for an authenticated user.

```typescript
const continueWatching = await scraper.continue.extract();
console.log('Continue Watching:', continueWatching);
```

### Comments

Fetch comments for a specific movie.

```typescript
const comments = await scraper.comments.get(movieDetails.id, 1);
console.log('Comments:', comments.data);
```

## API Documentation

For a complete and detailed API reference, please see the [generated TypeDoc documentation](./docs/index.html).

## Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

## Disclaimer

> [!IMPORTANT]
> This library is an unofficial tool and is not affiliated with, endorsed, or sponsored by HDRezka. It is intended for educational and personal use only. The data scraped belongs to the respective content owners. Please respect the terms of service of the website and use this tool responsibly. The developers of this library are not responsible for any misuse.

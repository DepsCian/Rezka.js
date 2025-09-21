# Contributing to Rezka.js

We welcome contributions from the community! Whether it's a bug fix, a new feature, or an improvement to the documentation, your help is appreciated.

## Development Setup

To get started with development, you'll need to clone the repository and install the dependencies using Bun.

```bash
git clone https://github.com/DepsCian/rezka.js.git
cd rezka.js
bun install
```

### Available Scripts

This project includes several scripts to help with development:

- `bun run lint`: Run the ESLint linter to check for code quality and style issues.
- `bun run format`: Automatically format the entire codebase using Prettier.
- `bun run build`: Compile the TypeScript source code into JavaScript in the `dist` directory.
- `bun run docs`: Generate the TypeDoc documentation in the `docs` directory.

## How to Contribute

To contribute, please follow this process:

1.  **Fork the Repository**: Create your own fork of the project on GitHub.
2.  **Create a Branch**: Make a new branch for your changes. Use a descriptive name.
    ```bash
    git checkout -b feature/my-new-feature
    ```
3.  **Make Changes**: Implement your bug fix or new feature. Ensure your code follows the project's style and conventions.
4.  **Test Your Changes**: Make sure to add or update tests as appropriate.
5.  **Commit Your Work**: Write a clear, concise commit message.
    ```bash
    git commit -am 'feat: Add some amazing feature'
    ```
6.  **Push to Your Fork**: Push your changes to your forked repository.
    ```bash
    git push origin feature/my-new-feature
    ```
7.  **Submit a Pull Request**: Open a pull request from your fork to the main repository's `main` branch. Provide a clear description of your changes.

We will review your pull request as soon as possible. Thank you for your contribution!
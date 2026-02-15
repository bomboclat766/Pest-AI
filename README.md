# Termipest Assistant - GitHub Workspace Setup

This project is ready to be used in GitHub Codespaces or published to external hosts.

## Environment Variables

To use the AI features outside of Replit, you need to set up the following environment variables in your GitHub repository secrets or your local environment:

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Your Google Gemini API Key. Get it from [Google AI Studio](https://aistudio.google.com/). |

## Publishing to GitHub Pages (Frontend Only)

1.  Go to your GitHub repository **Settings > Secrets and variables > Actions**.
2.  Add a new secret `GOOGLE_API_KEY` with your API key.
3.  The included GitHub Action in `.github/workflows/publish.yml` will handle the build process.

## Local Development

1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Create a `.env` file with `GOOGLE_API_KEY`.
4.  Run development server: `npm run dev`.

# Connecting to GitHub Repository

This document provides instructions for connecting this Replit project to your GitHub repository at https://github.com/Killgreck/Agenda-ia.

## Option 1: GitHub Web Interface Upload (Simplest)

1. Go to https://github.com/Killgreck/Agenda-ia
2. Click on "Upload files"
3. Download the project files from Replit using the "Download as ZIP" option from the three-dot menu
4. Drag and drop all the files into the GitHub upload area
5. Add a commit message and click "Commit changes"

## Option 2: Push directly from Replit (Requires GitHub token)

### 1. Generate a GitHub Personal Access Token (Classic)

1. Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name like "Replit Agenda-IA Access"
4. Select at least the "repo" scope
5. Click "Generate token"
6. Copy the token immediately (you won't be able to see it again)

### 2. Configure Git in Replit

Run these commands in the Replit Shell, replacing `YOUR_GITHUB_USERNAME` and `YOUR_TOKEN`:

```bash
git config --global credential.helper store
echo "https://YOUR_GITHUB_USERNAME:YOUR_TOKEN@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
```

### 3. Push your code

```bash
git push origin main
```

## Maintaining Synchronization

After setting up the connection, you can keep both repositories in sync:

### To push changes from Replit to GitHub

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

### To pull changes from GitHub to Replit

```bash
git pull origin main
```

## Important Notes

- The `.replit` and `replit.nix` files are specific to Replit and should not be modified or deleted
- The GitHub repository is already configured as a remote in this Replit project
- If you encounter authentication issues, you may need to regenerate your GitHub token
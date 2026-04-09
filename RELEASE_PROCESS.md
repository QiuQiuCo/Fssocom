# Fssocom Release Process

## For Your Development Team (No Local Setup!)

### How to Release a New Version

**That's it - just 3 steps:**

#### Step 1: Update Version in `package.json`

Edit `package.json` and change the version:

```json
{
  "name": "fssocom-inventory",
  "version": "1.0.1",  // ← Change this
  ...
}
```

#### Step 2: Commit and Push

```bash
git add package.json
git commit -m "Release: v1.0.1"
git push origin main
```

#### Step 3: Create Git Tag

```bash
git tag v1.0.1
git push origin v1.0.1
```

**That's it!** GitHub Actions will:
- ✅ Download code from GitHub
- ✅ Build the app automatically (Windows Server in the cloud)
- ✅ Create installer and portable versions
- ✅ Publish to GitHub Releases automatically
- ✅ Generate `latest.yml` for auto-updates

---

## How Users Get Updates

### First Install
Users download `Fssocom Setup 1.0.1.exe` from GitHub Releases and install it.

### Automatic Updates
1. User opens Fssocom v1.0.1
2. App checks GitHub automatically
3. Developer releases v1.0.2 (you pushed a tag)
4. App detects new version and downloads it
5. Dialog appears: "Update Ready!"
6. User clicks "Restart Now"
7. App updates and restarts

---

## Version Numbering

Use semantic versioning:

- **Patch** (bug fixes): `1.0.0` → `1.0.1`
  ```bash
  git tag v1.0.1
  ```

- **Minor** (new features): `1.0.0` → `1.1.0`
  ```bash
  git tag v1.1.0
  ```

- **Major** (breaking changes): `1.0.0` → `2.0.0`
  ```bash
  git tag v2.0.0
  ```

---

## What Happens Behind the Scenes

GitHub Actions workflow (`.github/workflows/release.yml`):

```
1. Detects new tag (v1.0.1)
    ↓
2. Starts Windows Server in cloud
    ↓
3. git clone your repository
    ↓
4. npm install (downloads dependencies)
    ↓
5. npm run build (builds React app)
    ↓
6. npm run electron:build (creates installers)
    ↓
7. Publishes to GitHub Releases
    ↓
8. Users auto-update! ✨
```

---

## Troubleshooting

### Release not building?
- Check **Actions** tab on GitHub
- Click on the failed workflow
- See build logs
- Common issues: typo in version, missing dependencies

### latest.yml not generated?
- Make sure electron-builder is installed: `npm install electron-builder`
- Check that `package.json` has correct `appId` and version

### Can't create tag?
```bash
# First make sure you've pushed commits
git push origin main

# Then create and push tag
git tag v1.0.1
git push origin v1.0.1

# View all tags
git tag -l
```

### Delete wrong tag?
```bash
# Delete locally
git tag -d v1.0.0

# Delete on GitHub
git push origin --delete v1.0.0
```

---

## Security Notes

- GitHub Actions uses `GITHUB_TOKEN` automatically (no setup needed)
- Token is temporary and expires after job completes
- All builds happen on GitHub's secure servers
- No credentials stored on local desktops
- Audit trail in GitHub Actions logs

---

## Example Timeline

**Monday 10:00 AM**
- Developer fixes a bug in InventoryPage.jsx
- Pushes to main

**Monday 11:00 AM**
- QA tests and approves
- Developer bumps version: `1.0.1` → `1.0.2`
- Runs: `git tag v1.0.2 && git push origin v1.0.2`

**Monday 11:05 AM**
- GitHub Actions builds automatically
- Publishes to GitHub Releases

**Monday 11:10 AM**
- Users across all desktops see update notification
- Click "Update Now"
- All desktops get v1.0.2

**Zero manual work needed!** 🎉

---

## FAQ

**Q: Do I need to install Node.js on my computer?**
A: No! GitHub builds everything in the cloud.

**Q: Do I need the GH_TOKEN?**
A: No! GitHub Actions handles authentication automatically.

**Q: What if I make a mistake and push the wrong version?**
A: Delete the tag and push a new one:
```bash
git push origin --delete v1.0.1
git tag v1.0.1
git push origin v1.0.1
```

**Q: Can I schedule releases?**
A: Yes! You can modify `.github/workflows/release.yml` to trigger on schedule or manual trigger instead of tags.

**Q: What if I want to release from a different branch?**
A: Edit `.github/workflows/release.yml` and change the branch filter.

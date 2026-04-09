# Quick Release Guide (TL;DR)

## For Developers

### Release New Version (30 seconds)

```bash
# 1. Edit package.json - change version
# "version": "1.0.2"

# 2. Commit
git add package.json
git commit -m "Release: v1.0.2"
git push origin main

# 3. Create tag (this triggers the build!)
git tag v1.0.2
git push origin v1.0.2
```

Done! ✅ GitHub Actions builds and releases automatically.

---

## For Users / QA Testing

### Download Latest Version

1. Go to: https://github.com/YOUR_USERNAME/fssocom-inventory/releases
2. Download `Fssocom Setup X.X.X.exe`
3. Run the installer
4. First run checks for updates automatically

---

## For DevOps / IT

### How Auto-Update Works

- **Check interval**: Every app startup (customizable)
- **Download location**: GitHub Releases (configurable)
- **Installation**: Automatic restart required
- **Rollback**: Users can reinstall previous version from GitHub

---

## One-Time Setup (Organization)

Nothing! 🎉

No local setup, no tokens, no environment variables needed on any computer.

---

## If Something Goes Wrong

**Check GitHub Actions logs:**
1. Go to repository → Actions tab
2. Click the failed workflow
3. See what went wrong
4. Fix code and push again

---

## Common Commands

```bash
# List all tags
git tag -l

# Create tag
git tag v1.0.2

# Push tag
git push origin v1.0.2

# Delete tag (if mistake)
git push origin --delete v1.0.2
git tag -d v1.0.2

# View a specific tag
git show v1.0.2
```

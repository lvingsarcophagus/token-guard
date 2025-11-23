# PowerShell script to remove secrets from git history
# WARNING: This rewrites git history!

Write-Host "🚨 SECURITY: Removing secrets from git history" -ForegroundColor Red
Write-Host "⚠️  WARNING: This will rewrite git history!" -ForegroundColor Yellow
Write-Host ""

$rotated = Read-Host "Have you rotated ALL API keys? (yes/no)"

if ($rotated -ne "yes") {
    Write-Host "❌ Please rotate all API keys first!" -ForegroundColor Red
    Write-Host "See SECURITY_INCIDENT_RESPONSE.md for instructions"
    exit 1
}

Write-Host ""
Write-Host "📋 Files to remove from history:"
Write-Host "  - .env.local"
Write-Host "  - .env"
Write-Host "  - Any other secret files"
Write-Host ""

$continue = Read-Host "Continue? (yes/no)"

if ($continue -ne "yes") {
    Write-Host "Aborted."
    exit 0
}

Write-Host ""
Write-Host "🔄 Removing .env files from git history..." -ForegroundColor Cyan

# Remove .env.local from entire history
git filter-branch --force --index-filter `
  "git rm --cached --ignore-unmatch .env.local .env" `
  --prune-empty --tag-name-filter cat -- --all

Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Cyan
git reflog expire --expire=now --all
git gc --prune=now --aggressive

Write-Host ""
Write-Host "✅ Secrets removed from local git history" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Verify secrets are gone: git log --all -- .env.local"
Write-Host "2. Force push to remote: git push --force --all"
Write-Host "3. Notify collaborators to re-clone the repository"
Write-Host "4. Monitor for unauthorized access"
Write-Host ""
Write-Host "🚨 IMPORTANT: If repository was ever public, secrets are still compromised!" -ForegroundColor Red
Write-Host "   You MUST rotate all API keys regardless."

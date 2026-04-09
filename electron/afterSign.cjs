/**
 * afterSign hook — signs the packaged exe using the system signtool
 * from the electron-builder winCodeSign cache.
 * Falls back silently if cert or signtool is not found.
 */
const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')
const os = require('os')

module.exports = async function (context) {
  // Only run on Windows
  if (process.platform !== 'win32') return

  const pfxPath = path.resolve(__dirname, '../../fssocom-dev.pfx')
  const pfxPassword = 'FssoCert2024!'

  if (!fs.existsSync(pfxPath)) {
    console.log('[afterSign] PFX not found, skipping signing:', pfxPath)
    return
  }

  // Find signtool.exe in electron-builder's winCodeSign cache
  const cacheRoot = path.join(os.homedir(), 'AppData', 'Local', 'electron-builder', 'Cache', 'winCodeSign')
  let signtool = null
  if (fs.existsSync(cacheRoot)) {
    for (const dir of fs.readdirSync(cacheRoot)) {
      const candidate = path.join(cacheRoot, dir, 'windows-10', 'x64', 'signtool.exe')
      if (fs.existsSync(candidate)) {
        signtool = candidate
        break
      }
    }
  }

  if (!signtool) {
    // Try standard Windows SDK location
    const sdkPath = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64\\signtool.exe'
    if (fs.existsSync(sdkPath)) signtool = sdkPath
  }

  if (!signtool) {
    console.log('[afterSign] signtool.exe not found, skipping signing')
    return
  }

  const exePath = context.appOutDir
    ? path.join(context.appOutDir, `${context.packager.appInfo.productName}.exe`)
    : null

  if (!exePath || !fs.existsSync(exePath)) {
    console.log('[afterSign] Target exe not found, skipping signing:', exePath)
    return
  }

  console.log('[afterSign] Signing:', exePath)
  try {
    execSync(
      `"${signtool}" sign /fd SHA256 /f "${pfxPath}" /p "${pfxPassword}" /tr http://timestamp.digicert.com /td SHA256 "${exePath}"`,
      { stdio: 'inherit' }
    )
    console.log('[afterSign] Signed successfully')
  } catch (err) {
    console.warn('[afterSign] Signing failed (non-fatal):', err.message)
  }
}

# Building KrisPoint Windows Desktop Installer (.msi)

> This legacy guide is retained for reference. The supported self-contained
> Solo release and clean-install verification process is documented in
> [SOLO_INSTALLERS.md](SOLO_INSTALLERS.md). Do not use the old local server
> setup scripts for Solo.

This guide will help you build a professional Windows installer for KrisPoint with your custom logo.

---

## 📋 Prerequisites

Before building, make sure you have:
- ✅ Voice server tested and working
- ✅ Windows PC with Node.js installed
- ✅ All npm packages installed (`npm install` completed successfully)
- ✅ Tauri development tested (`npm run tauri dev` works)

---

## 🎨 Step 1: Generate App Icons from KrisPoint Logo

This will replace the default Tauri icon with your professional KrisPoint logo (the KP with heartbeat waveform).

**Run this command in your project folder:**
```bash
npm run tauri icon static/assets/branding/krispoint-logo-transparent.png
```

**What this does:**
- Converts your logo to all required formats (.ico, .icns, multiple PNG sizes)
- Places them in `src-tauri/icons/` folder
- Updates the app icon for:
  - Title bar (top-left corner of window)
  - Windows taskbar
  - Start Menu
  - Desktop shortcut
  - Installer file

**Expected output:**
```
Generating icons...
✓ Generated icon.ico (Windows)
✓ Generated icon.icns (macOS)
✓ Generated all PNG sizes (32x32 to 512x512)
✓ All icons saved to src-tauri/icons/
```

---

## 🔨 Step 2: Build the Windows Installer

Now build the production-ready .msi installer:

**Run this command:**
```bash
npm run tauri build -- --target x86_64-pc-windows-msvc
```

**Build time:** 5-15 minutes (first build is slower, subsequent builds are faster)

**What happens during build:**
1. **Optimizing frontend** - SvelteKit compiles and minifies your web app
2. **Building Rust backend** - Tauri compiles the native desktop wrapper
3. **Creating bundle** - Packages everything into installer
4. **Code signing** (optional) - Signs the .msi if you have a certificate

**Build output you'll see:**
```
> Building application...
   Compiling tauri v2.x.x
   Compiling krispoint v1.0.0
    Finished release [optimized] target(s) in 8m 23s
    Bundling KrisPoint_1.0.0_x64_en-US.msi
    
✓ Build complete!
```

---

## 📦 Step 3: Find Your Installer

After the build completes, your installer will be located at:

```
C:\KrisPoint-Server\KrisPoint-Desktop-1\src-tauri\target\release\bundle\msi\KrisPoint_1.0.0_x64_en-US.msi
```

**File details:**
- **Name:** `KrisPoint_1.0.0_x64_en-US.msi`
- **Size:** ~10-15 MB (compressed)
- **Type:** Windows Installer Package
- **Architecture:** 64-bit (x64)

---

## ✅ Step 4: Test the Installer

**Install on your computer:**
1. **Double-click** the `.msi` file
2. Windows may show a security warning (click "More info" → "Install anyway")
3. Follow the installation wizard
4. KrisPoint will be installed to: `C:\Program Files\KrisPoint\`

**Find the installed app:**
- **Start Menu:** Search for "KrisPoint"
- **Desktop shortcut:** Should appear automatically
- **Uninstall:** Via Windows Settings → Apps

---

## 🚀 Step 5: Distribute Your App

**Share the installer:**
- Copy the `.msi` file to a USB drive, cloud storage, or network share
- Users can install it on any Windows 10/11 64-bit computer
- No additional dependencies needed - everything is bundled!

**Requirements for users:**
- Windows 10 or Windows 11 (64-bit)
- ~50 MB free disk space
- Administrator rights to install (standard for Windows apps)

---

## 🔧 Troubleshooting

### Build Fails: "Cannot find Rust compiler"
**Solution:** Install Rust from https://rustup.rs

### Build Fails: "WebView2 not found"
**Solution:** Windows 10/11 include WebView2 by default. Update Windows if needed.

### Icons Don't Change
**Solution:** 
- Make sure you ran the `tauri icon` command BEFORE building
- Check that `src-tauri/icons/` contains your new icons
- Delete `src-tauri/target/` folder and rebuild

### Installer Size Too Large
**Solution:** This is normal. The installer includes:
- Your web app (HTML/CSS/JS)
- Tauri runtime (~8-10 MB)
- WebView2 bootstrapper (optional)

---

## 📊 Build Variants

**Debug build (for testing):**
```bash
npm run tauri dev
```
- Fast compilation
- Larger file size
- Includes debug symbols
- Not for distribution

**Release build (for distribution):**
```bash
npm run tauri build
```
- Full optimization
- Smaller file size
- No debug symbols
- Production-ready

---

## 🎯 Next Steps After Building

1. **Test the installed app** - Make sure everything works
2. **Test voice server connection** - Start voice server, connect from app
3. **Create user documentation** - Share the WINDOWS_USER_GUIDE.md with users
4. **Distribute** - Share the .msi file with radiologists/hospitals

---

## 💡 Advanced Options

**Build for multiple platforms:**
```bash
# Windows only (default)
npm run tauri build -- --target x86_64-pc-windows-msvc

# macOS (requires Mac computer)
npm run tauri build -- --target x86_64-apple-darwin

# Linux (requires Linux or WSL)
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

**Custom installer name:**
Edit `src-tauri/tauri.conf.json`:
```json
{
  "productName": "KrisPoint Pro",
  "version": "2.0.0"
}
```

**Code signing (for trusted installer):**
- Requires a code signing certificate ($100-300/year)
- Prevents Windows SmartScreen warnings
- See: https://tauri.app/v1/guides/distribution/sign-windows

---

## 📝 Build Checklist

Before building, verify:
- [x] Voice server works (`START_VOICE_SERVER.bat` runs successfully)
- [x] Desktop app works in dev mode (`npm run tauri dev`)
- [x] Icons generated (`npm run tauri icon ...`)
- [x] All features tested (login, reports, voice, PDF export)
- [x] No console errors
- [x] App title is correct ("KrisPoint - Radiology Reporting System")

After building:
- [ ] Install the .msi on a clean Windows PC
- [ ] Test all features in installed app
- [ ] Verify icon shows correctly
- [ ] Test voice server connection
- [ ] Create PDF report to verify export
- [ ] Check app appears in Start Menu
- [ ] Test uninstall process

---

**You're ready to build!** 🎉

Run the commands in order:
1. `npm run tauri icon static/assets/branding/krispoint-logo-transparent.png`
2. `npm run tauri build -- --target x86_64-pc-windows-msvc`
3. Find your installer in `src-tauri/target/release/bundle/msi/`

**Good luck with your build!** 🚀

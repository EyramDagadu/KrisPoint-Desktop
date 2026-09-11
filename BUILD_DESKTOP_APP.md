# Building KrisPoint Desktop Application

> This document covers developer builds. For the self-contained KrisPoint Solo
> Windows and Apple Silicon installers, including the optional MedASR payload,
> use [SOLO_INSTALLERS.md](SOLO_INSTALLERS.md). Installed Solo does not require
> Node.js, Python, or PostgreSQL.

This guide will help you build KrisPoint as a standalone Windows desktop application.

## Prerequisites (Install These First)

### 1. Install Rust
Rust is required to build Tauri desktop applications.

1. Download Rust installer: https://www.rust-lang.org/tools/install
2. Run `rustup-init.exe`
3. Follow the installer prompts (choose default options)
4. Restart your terminal/PowerShell after installation
5. Verify installation: `rustc --version`

### 2. Install Visual Studio Build Tools
Required for compiling native Windows components.

1. Download: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
2. Install "Build Tools for Visual Studio 2022"
3. In the installer, select: "Desktop development with C++"
4. Wait for installation to complete (this may take a while)

### 3. Install WebView2
Modern Windows should have this pre-installed, but if not:

1. Download: https://developer.microsoft.com/en-us/microsoft-edge/webview2/
2. Install the "Evergreen Bootstrapper"

### 4. Install Node.js (if not already installed)
1. Download: https://nodejs.org/ (LTS version recommended)
2. Install with default options
3. Verify: `node --version` and `npm --version`

## Building the Desktop App

### Step 1: Download Your Project
Download all your KrisPoint project files to your Windows PC.

### Step 2: Install Dependencies
Open PowerShell in your project folder and run:
```powershell
npm install
```

### Step 3: Build the Desktop Application
```powershell
npm run tauri build
```

**This will take 5-15 minutes the first time** as it downloads and compiles Rust dependencies.

*Note: This command automatically builds the website first, so you don't need to run `npm run build` separately.*

### Step 4: Find Your Application
After building, you'll find the installer in:
```
src-tauri/target/release/bundle/
```

Look for:
- **Windows Installer**: `msi/KrisPoint_1.0.0_x64_en-US.msi`
- **Portable EXE**: `nsis/KrisPoint_1.0.0_x64-setup.exe`

## Installing the Application

### Option 1: MSI Installer (Recommended)
1. Double-click the `.msi` file
2. Follow the installation wizard
3. KrisPoint will be installed to Program Files
4. A desktop shortcut will be created

### Option 2: Portable Installer
1. Run the NSIS `.exe` setup file
2. Choose installation location
3. Install and run

## Development Mode (For Testing)

If you want to test the desktop app during development:

```powershell
npm run tauri dev
```

This opens the app in development mode with hot-reload.

## Customizing the App Icon

The default Tauri icons are in `src-tauri/icons/`. To use the KrisPoint logo:

### Using Online Icon Generator (Easiest)
1. Go to: https://icon.kitchen/
2. Upload `static/assets/branding/krispoint-logo-transparent.png`
3. Choose "Tauri" as the platform
4. Download the icon pack
5. Extract and replace all files in `src-tauri/icons/`

### Manual Icon Creation
If you have image editing software:
- Create PNG icons: 32x32, 128x128, 256x256 pixels
- Create Windows ICO file with multiple sizes
- Create macOS ICNS file (if building for Mac)
- Place all in `src-tauri/icons/`

## Troubleshooting

### Build Fails: "rustc not found"
- Make sure you installed Rust (see Prerequisites)
- Restart your terminal/PowerShell
- Run: `rustup update`

### Build Fails: "MSVC tools not found"
- Install Visual Studio Build Tools (see Prerequisites)
- Make sure "Desktop development with C++" is selected

### App Won't Run: "WebView2 not found"
- Install WebView2 Runtime (see Prerequisites)
- Restart your computer

### Build Takes Forever
- First build: 5-15 minutes is normal
- Subsequent builds: Much faster (1-3 minutes)
- Make sure antivirus isn't scanning the target folder

## File Size

The built application will be approximately:
- **Installer**: ~10-15 MB
- **Installed app**: ~15-20 MB

## Distributing Your App

### For Personal Use
Just use the MSI or NSIS installer on your computers.

### For Distribution to Others
1. **Code Signing** (Optional but recommended):
   - Sign the executable with a code signing certificate
   - This prevents Windows security warnings
   - Certificates cost ~$100-300/year from certificate authorities

2. **Create an installer**:
   - The MSI and NSIS installers are ready to distribute
   - Consider creating a download link or USB installer

3. **Update mechanism**:
   - Tauri supports auto-updates with a backend server
   - For simple use, just distribute new versions manually

## Next Steps

After building successfully:
1. Test the desktop app thoroughly
2. Check that voice recognition connects properly
3. Verify PDF export works
4. Test database operations
5. Deploy to your clinic computers

## Getting Help

If you encounter issues:
1. Check the Tauri documentation: https://tauri.app/
2. Verify all prerequisites are installed correctly
3. Make sure you're using PowerShell as Administrator if needed
4. Check Windows Event Viewer for error logs

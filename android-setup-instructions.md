# Android Build Setup Instructions

## Step 1: Connect to GitHub from Lovable

1. In Lovable editor, click **GitHub** → **Connect to GitHub**
2. Authorize the Lovable GitHub App
3. Select your GitHub account/organization
4. Click **Create Repository** to push your project code

## Step 2: Generate Upload Keystore (ONE TIME ONLY)

Run this on your local machine to create the signing key:

```bash
keytool -genkey -v -keystore greentap.keystore -alias greentap -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANT**: Keep this keystore file safe! You'll need it for all future app updates.

## Step 3: Set GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** and add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `ANDROID_KEYSTORE_B64` | [base64 of keystore] | Run: `base64 -w 0 greentap.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | [password] | Password you set when creating keystore |
| `ANDROID_KEY_ALIAS` | `greentap` | Alias name from keystore creation |
| `ANDROID_KEY_PASSWORD` | [key password] | Key password (usually same as keystore password) |

## Step 4: Add Android Platform and Configure Signing

After connecting to GitHub, clone the repo locally and run:

```bash
npm install
npx cap add android
```

Then edit `android/app/build.gradle` and add this signing configuration:

```gradle
android {
    // ... existing configuration

    signingConfigs {
        release {
            if (project.hasProperty('GREENTAP_UPLOAD_STORE_FILE')) {
                storeFile file(GREENTAP_UPLOAD_STORE_FILE)
                storePassword GREENTAP_UPLOAD_STORE_PASSWORD
                keyAlias GREENTAP_UPLOAD_KEY_ALIAS
                keyPassword GREENTAP_UPLOAD_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

## Step 5: Update App Configuration

In `android/app/build.gradle`, update the `defaultConfig` section:

```gradle
defaultConfig {
    applicationId "com.yourcompany.greentap"  // Must match Play Console package name
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "1.0.0"
    testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
}
```

## Step 6: Commit and Push

```bash
git add .
git commit -m "Add Android build configuration"
git push origin main
```

## Step 7: Trigger Build and Download AAB

1. Go to your GitHub repository → **Actions** tab
2. Click **Run workflow** on the "Build Android Release" workflow
3. Wait for build to complete (usually 3-5 minutes)
4. Download the `app-release-bundle` artifact
5. Extract the `app-release.aab` file

## Step 8: Upload to Google Play Console

1. Create app in Play Console with package name `com.yourcompany.greentap`
2. Upload the signed AAB file
3. Complete app content requirements (screenshots, descriptions, etc.)
4. Submit for review

## Notes

- The workflow builds both a release AAB (for Play Store) and debug APK (for testing)
- For app updates, increment `versionCode` in build.gradle and push to trigger new build
- The keystore is decoded from base64 during the build process for security
- All builds are automatically signed with your upload key

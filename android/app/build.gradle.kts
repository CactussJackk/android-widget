plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// CI passes the run number so every published APK installs as an update of the previous one.
val buildNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()

android {
    namespace = "io.github.cactussjackk.openmonetis.widget"
    compileSdk = 35

    defaultConfig {
        applicationId = "io.github.cactussjackk.openmonetis.widget"
        minSdk = 26
        targetSdk = 35
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    signingConfigs {
        // Personal sideload key, kept in the repository so every CI build can update the
        // installed app. It identifies only this fork's widget app.
        create("widget") {
            storeFile = file("widget.jks")
            storePassword = "openmonetis-widget"
            keyAlias = "widget"
            keyPassword = "openmonetis-widget"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("widget")
        }
        debug {
            signingConfig = signingConfigs.getByName("widget")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    lint {
        checkReleaseBuilds = false
        abortOnError = false
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("com.google.android.gms:play-services-code-scanner:16.1.0")
}

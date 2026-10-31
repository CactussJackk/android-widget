package io.github.cactussjackk.openmonetis.widget

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.PorterDuff
import android.graphics.PorterDuffXfermode
import android.graphics.RectF
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * Card logos come from the OpenMonetis site (`/logos/<name>.png`). They are downloaded once,
 * rounded and shrunk for the widget, and kept in the app's private storage.
 */
object LogoCache {
    private val logoPath = Regex("^/logos/[A-Za-z0-9._-]+\\.png$")
    private const val SIZE_PX = 96
    private const val RADIUS_PX = 22f
    private const val TIMEOUT_MS = 10_000

    fun prefetch(context: Context, serverUrl: String, logos: Collection<String?>) {
        logos.filterNotNull().distinct().filter { logoPath.matches(it) }.forEach { logo ->
            val target = file(context, logo)
            if (!target.exists()) download(serverUrl + logo, target)
        }
    }

    fun load(context: Context, logo: String?): Bitmap? {
        if (logo == null || !logoPath.matches(logo)) return null
        val target = file(context, logo)
        return if (target.exists()) BitmapFactory.decodeFile(target.path) else null
    }

    private fun file(context: Context, logo: String): File {
        val directory = File(context.filesDir, "logos").apply { mkdirs() }
        return File(directory, logo.substringAfterLast('/'))
    }

    private fun download(url: String, target: File) {
        val http = try {
            URL(url).openConnection() as HttpURLConnection
        } catch (error: IOException) {
            return
        }
        try {
            http.connectTimeout = TIMEOUT_MS
            http.readTimeout = TIMEOUT_MS
            if (http.responseCode != HttpURLConnection.HTTP_OK) return
            val source = http.inputStream.use { BitmapFactory.decodeStream(it) } ?: return
            val rounded = round(source)
            val temporary = File(target.parentFile, "${target.name}.tmp")
            temporary.outputStream().use { rounded.compress(Bitmap.CompressFormat.PNG, 100, it) }
            temporary.renameTo(target)
        } catch (error: IOException) {
            // The widget falls back to a generic card icon.
        } finally {
            http.disconnect()
        }
    }

    private fun round(source: Bitmap): Bitmap {
        val output = Bitmap.createBitmap(SIZE_PX, SIZE_PX, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(output)
        val bounds = RectF(0f, 0f, SIZE_PX.toFloat(), SIZE_PX.toFloat())
        val paint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
        canvas.drawRoundRect(bounds, RADIUS_PX, RADIUS_PX, paint)
        paint.xfermode = PorterDuffXfermode(PorterDuff.Mode.SRC_IN)
        canvas.drawBitmap(source, null, bounds, paint)
        return output
    }
}

package io.github.cactussjackk.openmonetis.widget

import android.net.Uri

/** Server origin and read-only widget token. */
data class Connection(val serverUrl: String, val token: String)

/**
 * Parses the pairing payload shown by OpenMonetis in Ajustes → Integrações:
 * `openmonetis://widget/token?v=1&token=opm_…&url=https%3A%2F%2F…`.
 */
object ConnectionParser {
    private val tokenPattern = Regex("^opm_[A-Za-z0-9_-]{43}$")

    fun fromPayload(raw: String?): Connection? {
        val value = raw?.trim().orEmpty()
        if (value.isEmpty()) return null
        val uri = Uri.parse(value)
        if (uri.scheme != "openmonetis" || uri.host != "widget" || uri.path != "/token") return null
        if (uri.getQueryParameter("v") != "1") return null
        return fromFields(uri.getQueryParameter("url"), uri.getQueryParameter("token"))
    }

    fun fromFields(url: String?, token: String?): Connection? {
        val cleanToken = token?.trim().orEmpty()
        if (!tokenPattern.matches(cleanToken)) return null
        val origin = normalizeOrigin(url) ?: return null
        return Connection(origin, cleanToken)
    }

    /** Accepts only HTTPS origins; paths, queries and fragments are dropped. */
    fun normalizeOrigin(raw: String?): String? {
        val value = raw?.trim().orEmpty()
        if (value.isEmpty()) return null
        val uri = Uri.parse(value)
        val host = uri.host
        if (uri.scheme != "https" || host.isNullOrBlank()) return null
        return if (uri.port == -1) "https://$host" else "https://$host:${uri.port}"
    }
}

package io.github.cactussjackk.openmonetis.widget

import android.content.Context
import org.json.JSONException

/** Connection and last known summary, kept in the app's private storage. */
class WidgetSettings(context: Context) {
    private val prefs = context.applicationContext
        .getSharedPreferences("openmonetis_widget", Context.MODE_PRIVATE)

    val connection: Connection?
        get() {
            val url = prefs.getString(KEY_URL, null) ?: return null
            val token = prefs.getString(KEY_TOKEN, null) ?: return null
            return Connection(url, token)
        }

    val savedServerUrl: String?
        get() = prefs.getString(KEY_URL, null)

    val summary: Summary?
        get() = prefs.getString(KEY_SUMMARY, null)?.let {
            try {
                Summary.fromJson(it)
            } catch (error: JSONException) {
                null
            }
        }

    val lastSuccessAt: Long
        get() = prefs.getLong(KEY_SUCCESS_AT, 0L)

    val lastError: String?
        get() = prefs.getString(KEY_ERROR, null)

    val isUnauthorized: Boolean
        get() = prefs.getBoolean(KEY_UNAUTHORIZED, false)

    fun save(connection: Connection) {
        prefs.edit()
            .putString(KEY_URL, connection.serverUrl)
            .putString(KEY_TOKEN, connection.token)
            .remove(KEY_SUMMARY)
            .remove(KEY_SUCCESS_AT)
            .remove(KEY_ERROR)
            .remove(KEY_UNAUTHORIZED)
            .apply()
    }

    fun clear() {
        prefs.edit().clear().apply()
    }

    fun record(result: FetchResult, at: Long) {
        val editor = prefs.edit()
        when (result) {
            is FetchResult.Success -> editor
                .putString(KEY_SUMMARY, result.summary.toJson())
                .putLong(KEY_SUCCESS_AT, at)
                .remove(KEY_ERROR)
                .remove(KEY_UNAUTHORIZED)
            FetchResult.Unauthorized -> editor
                .putBoolean(KEY_UNAUTHORIZED, true)
                .putString(KEY_ERROR, "Token revogado ou expirado")
            is FetchResult.Failure -> editor.putString(KEY_ERROR, result.message)
        }
        editor.apply()
    }

    private companion object {
        const val KEY_URL = "server_url"
        const val KEY_TOKEN = "token"
        const val KEY_SUMMARY = "summary"
        const val KEY_SUCCESS_AT = "last_success_at"
        const val KEY_ERROR = "last_error"
        const val KEY_UNAUTHORIZED = "unauthorized"
    }
}

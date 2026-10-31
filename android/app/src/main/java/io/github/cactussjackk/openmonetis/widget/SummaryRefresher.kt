package io.github.cactussjackk.openmonetis.widget

import android.content.Context

/** Fetches the summary, stores the outcome and redraws every widget. Call off the main thread. */
object SummaryRefresher {
    fun refresh(context: Context): FetchResult? {
        val settings = WidgetSettings(context)
        val connection = settings.connection
        if (connection == null) {
            WidgetRenderer.updateAll(context)
            return null
        }
        val result = SummaryClient.fetch(connection, settings.showNextMonth)
        settings.record(result, System.currentTimeMillis())
        WidgetRenderer.updateAll(context)
        return result
    }
}

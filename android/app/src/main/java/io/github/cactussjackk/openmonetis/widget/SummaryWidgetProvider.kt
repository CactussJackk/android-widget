package io.github.cactussjackk.openmonetis.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent

class SummaryWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
        // Draw from the cache only. Enqueuing one-off work here can make WorkManager trigger
        // another widget update; the periodic job keeps the data fresh instead.
        manager.updateAppWidget(appWidgetIds, WidgetRenderer.build(context))
        if (WidgetSettings(context).connection != null) RefreshScheduler.schedulePeriodic(context)
    }

    override fun onEnabled(context: Context) {
        if (WidgetSettings(context).connection != null) {
            RefreshScheduler.schedulePeriodic(context)
            RefreshScheduler.refreshNow(context)
        }
    }

    override fun onDisabled(context: Context) {
        RefreshScheduler.cancel(context)
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_REFRESH) {
            if (WidgetSettings(context).connection == null) {
                WidgetRenderer.updateAll(context)
            } else {
                WidgetRenderer.updateAll(context, "Atualizando…")
                RefreshScheduler.refreshNow(context)
            }
            return
        }
        super.onReceive(context, intent)
    }

    companion object {
        const val ACTION_REFRESH = "io.github.cactussjackk.openmonetis.widget.REFRESH"
    }
}

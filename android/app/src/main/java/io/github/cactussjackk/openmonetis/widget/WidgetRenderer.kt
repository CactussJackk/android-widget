package io.github.cactussjackk.openmonetis.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews

object WidgetRenderer {
    fun updateAll(context: Context, status: String? = null) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(ComponentName(context, SummaryWidgetProvider::class.java))
        if (ids.isEmpty()) return
        manager.updateAppWidget(ids, build(context, status))
    }

    fun build(context: Context, statusOverride: String? = null): RemoteViews {
        val settings = WidgetSettings(context)
        val views = RemoteViews(context.packageName, R.layout.widget_summary)
        val connection = settings.connection
        val summary = settings.summary

        val title = summary?.let { "Gasto em ${Formatters.monthName(it.period)}" } ?: "Gasto no mês"
        views.setTextViewText(R.id.widget_title, title)
        views.setTextViewText(R.id.widget_expenses, summary?.let { Formatters.money(it.expenses) } ?: "R$ —")
        setAmount(context, views, R.id.widget_projected, summary?.projectedBalance)
        setAmount(context, views, R.id.widget_accounts, summary?.accountsBalance)
        views.setTextViewText(R.id.widget_status, statusOverride ?: status(settings, connection, summary))

        views.setOnClickPendingIntent(R.id.widget_root, openIntent(context, connection))
        views.setOnClickPendingIntent(R.id.widget_refresh, refreshIntent(context))
        return views
    }

    private fun status(settings: WidgetSettings, connection: Connection?, summary: Summary?): String {
        if (connection == null) return "Toque para conectar"
        if (settings.isUnauthorized) return "Token revogado — reconecte no app"
        val updated = settings.lastSuccessAt.takeIf { it > 0 }?.let { Formatters.updatedAt(it) }
        val error = settings.lastError
        return when {
            summary == null && error != null -> error
            summary == null -> "Aguardando a primeira atualização"
            error != null && updated != null -> "$error · dados de $updated"
            updated != null -> "Atualizado às $updated"
            else -> ""
        }
    }

    private fun setAmount(context: Context, views: RemoteViews, viewId: Int, value: Double?) {
        views.setTextViewText(viewId, value?.let { Formatters.money(it) } ?: "—")
        val color = if (value != null && value < 0) R.color.widget_negative else R.color.widget_text_primary
        views.setTextColor(viewId, context.getColor(color))
    }

    private fun openIntent(context: Context, connection: Connection?): PendingIntent {
        val target = if (connection == null) {
            Intent(context, SetupActivity::class.java)
        } else {
            Intent(Intent.ACTION_VIEW, Uri.parse(connection.serverUrl))
        }
        val intent = target.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return PendingIntent.getActivity(
            context,
            REQUEST_OPEN,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }

    private fun refreshIntent(context: Context): PendingIntent {
        val intent = Intent(context, SummaryWidgetProvider::class.java)
            .setAction(SummaryWidgetProvider.ACTION_REFRESH)
        return PendingIntent.getBroadcast(
            context,
            REQUEST_REFRESH,
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
    }

    private const val REQUEST_OPEN = 1
    private const val REQUEST_REFRESH = 2
}

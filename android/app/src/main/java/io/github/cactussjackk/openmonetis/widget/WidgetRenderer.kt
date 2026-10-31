package io.github.cactussjackk.openmonetis.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.SizeF
import android.view.View
import android.widget.RemoteViews

object WidgetRenderer {
    /** Widgets at least this tall (dp) use the large layout, with bigger numbers and logos. */
    private const val LARGE_MIN_HEIGHT_DP = 200f
    private const val MIN_WIDTH_DP = 180f

    private enum class Size(val layout: Int, val cardLayout: Int) {
        COMPACT(R.layout.widget_summary, R.layout.widget_card_item),
        LARGE(R.layout.widget_summary_large, R.layout.widget_card_item_large),
    }

    fun updateAll(context: Context, status: String? = null) {
        val manager = AppWidgetManager.getInstance(context)
        val ids = manager.getAppWidgetIds(ComponentName(context, SummaryWidgetProvider::class.java))
        ids.forEach { id -> update(context, manager, id, status) }
    }

    fun update(context: Context, manager: AppWidgetManager, appWidgetId: Int, status: String? = null) {
        manager.updateAppWidget(appWidgetId, build(context, manager.getAppWidgetOptions(appWidgetId), status))
    }

    private fun build(context: Context, options: Bundle?, statusOverride: String?): RemoteViews {
        val compact = fill(context, Size.COMPACT, statusOverride)
        val large = fill(context, Size.LARGE, statusOverride)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            // The launcher picks the layout for the widget's current size, also while resizing.
            return RemoteViews(
                mapOf(
                    SizeF(MIN_WIDTH_DP, 0f) to compact,
                    SizeF(MIN_WIDTH_DP, LARGE_MIN_HEIGHT_DP) to large,
                ),
            )
        }
        val height = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT) ?: 0
        return if (height >= LARGE_MIN_HEIGHT_DP) large else compact
    }

    private fun fill(context: Context, size: Size, statusOverride: String?): RemoteViews {
        val settings = WidgetSettings(context)
        val views = RemoteViews(context.packageName, size.layout)
        val connection = settings.connection
        val summary = settings.summary

        val title = summary?.let { "Gasto em ${Formatters.monthName(it.period)}" } ?: "Gasto no mês"
        views.setTextViewText(R.id.widget_title, title)
        views.setTextViewText(R.id.widget_expenses, summary?.let { Formatters.money(it.expenses) } ?: "R$ —")
        setAmount(context, views, R.id.widget_balance, summary?.balance)
        setAmount(context, views, R.id.widget_accounts, summary?.accountsBalance)
        views.setTextViewText(R.id.widget_status, statusOverride ?: status(settings, connection, summary))
        renderCards(context, views, size, connection, summary)

        views.setOnClickPendingIntent(R.id.widget_root, openIntent(context, connection, null))
        views.setOnClickPendingIntent(R.id.widget_refresh, refreshIntent(context))
        return views
    }

    private fun renderCards(
        context: Context,
        views: RemoteViews,
        size: Size,
        connection: Connection?,
        summary: Summary?,
    ) {
        views.removeAllViews(R.id.widget_cards)
        val cards = summary?.cards.orEmpty().take(MAX_CARDS)
        views.setViewVisibility(
            R.id.widget_cards_empty,
            if (summary != null && cards.isEmpty()) View.VISIBLE else View.GONE,
        )
        cards.forEachIndexed { index, card ->
            val item = RemoteViews(context.packageName, size.cardLayout)
            val logo = LogoCache.load(context, card.logo)
            if (logo != null) {
                item.setImageViewBitmap(R.id.card_logo, logo)
            } else {
                item.setImageViewResource(R.id.card_logo, R.drawable.ic_card)
            }
            item.setTextViewText(R.id.card_name, card.name)
            item.setTextViewText(
                R.id.card_amount,
                if (card.paid) "✓ ${Formatters.money(card.amount)}" else Formatters.money(card.amount),
            )
            item.setTextColor(
                R.id.card_amount,
                context.getColor(if (card.paid) R.color.widget_text_secondary else R.color.widget_text_primary),
            )
            item.setOnClickPendingIntent(
                R.id.card_root,
                openIntent(context, connection, "/cards/${card.cardId}", REQUEST_CARD + index),
            )
            views.addView(R.id.widget_cards, item)
        }
    }

    private fun status(settings: WidgetSettings, connection: Connection?, summary: Summary?): String {
        if (connection == null) return "Toque para conectar"
        if (settings.isUnauthorized) return "Token revogado"
        val updated = settings.lastSuccessAt.takeIf { it > 0 }?.let { Formatters.updatedAt(it) }
        val error = settings.lastError
        return when {
            summary == null && error != null -> error
            summary == null -> "Aguardando dados"
            error != null && updated != null -> "Sem conexão · $updated"
            updated != null -> updated
            else -> ""
        }
    }

    private fun setAmount(context: Context, views: RemoteViews, viewId: Int, value: Double?) {
        views.setTextViewText(viewId, value?.let { Formatters.money(it) } ?: "—")
        val color = if (value != null && value < 0) R.color.widget_negative else R.color.widget_text_primary
        views.setTextColor(viewId, context.getColor(color))
    }

    private fun openIntent(
        context: Context,
        connection: Connection?,
        path: String?,
        requestCode: Int = REQUEST_OPEN,
    ): PendingIntent {
        val target = if (connection == null) {
            Intent(context, SetupActivity::class.java)
        } else {
            Intent(Intent.ACTION_VIEW, Uri.parse(connection.serverUrl + path.orEmpty()))
        }
        val intent = target.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return PendingIntent.getActivity(
            context,
            requestCode,
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
    private const val REQUEST_CARD = 100
    private const val MAX_CARDS = 6
}

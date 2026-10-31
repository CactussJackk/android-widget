package io.github.cactussjackk.openmonetis.widget

import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

object Formatters {
    private val brazil: Locale = Locale.forLanguageTag("pt-BR")
    private val months = listOf(
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
    )

    fun money(value: Double): String = NumberFormat.getCurrencyInstance(brazil).format(value)

    /** "2026-10" → "outubro". */
    fun monthName(period: String): String {
        val month = period.substringAfter('-', "").toIntOrNull() ?: return ""
        return months.getOrElse(month - 1) { "" }
    }

    /** Time only for today; day and time otherwise. */
    fun updatedAt(millis: Long, now: Long = System.currentTimeMillis()): String {
        val then = Calendar.getInstance().apply { timeInMillis = millis }
        val today = Calendar.getInstance().apply { timeInMillis = now }
        val sameDay = then.get(Calendar.YEAR) == today.get(Calendar.YEAR) &&
            then.get(Calendar.DAY_OF_YEAR) == today.get(Calendar.DAY_OF_YEAR)
        val pattern = if (sameDay) "HH:mm" else "dd/MM HH:mm"
        return SimpleDateFormat(pattern, brazil).format(Date(millis))
    }
}

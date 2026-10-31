package io.github.cactussjackk.openmonetis.widget

import org.json.JSONObject

/** Mirrors `GET /api/widget/summary`. */
data class Summary(
    val period: String,
    val expenses: Double,
    val income: Double,
    val balance: Double,
    val projectedBalance: Double,
    val accountsBalance: Double,
    val generatedAt: String,
) {
    fun toJson(): String = JSONObject()
        .put("period", period)
        .put("expenses", expenses)
        .put("income", income)
        .put("balance", balance)
        .put("projectedBalance", projectedBalance)
        .put("accountsBalance", accountsBalance)
        .put("generatedAt", generatedAt)
        .toString()

    companion object {
        fun fromJson(raw: String): Summary {
            val json = JSONObject(raw)
            return Summary(
                period = json.getString("period"),
                expenses = json.getDouble("expenses"),
                income = json.getDouble("income"),
                balance = json.getDouble("balance"),
                projectedBalance = json.getDouble("projectedBalance"),
                accountsBalance = json.getDouble("accountsBalance"),
                generatedAt = json.getString("generatedAt"),
            )
        }
    }
}

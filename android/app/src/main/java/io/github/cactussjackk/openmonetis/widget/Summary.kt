package io.github.cactussjackk.openmonetis.widget

import org.json.JSONArray
import org.json.JSONObject

/** One card's invoice in the displayed month. */
data class CardInvoice(
    val cardId: String,
    val name: String,
    val logo: String?,
    val amount: Double,
    val remainingAmount: Double,
    val paid: Boolean,
)

/** Mirrors `GET /api/widget/summary`. */
data class Summary(
    val period: String,
    val expenses: Double,
    val income: Double,
    val balance: Double,
    val projectedBalance: Double,
    val accountsBalance: Double,
    val cards: List<CardInvoice>,
    val generatedAt: String,
) {
    fun toJson(): String {
        val cardsJson = JSONArray()
        cards.forEach { card ->
            cardsJson.put(
                JSONObject()
                    .put("cardId", card.cardId)
                    .put("name", card.name)
                    .put("logo", card.logo ?: JSONObject.NULL)
                    .put("amount", card.amount)
                    .put("remainingAmount", card.remainingAmount)
                    .put("paid", card.paid),
            )
        }
        return JSONObject()
            .put("period", period)
            .put("expenses", expenses)
            .put("income", income)
            .put("balance", balance)
            .put("projectedBalance", projectedBalance)
            .put("accountsBalance", accountsBalance)
            .put("cards", cardsJson)
            .put("generatedAt", generatedAt)
            .toString()
    }

    companion object {
        fun fromJson(raw: String): Summary {
            val json = JSONObject(raw)
            // Older servers and cached summaries have no `cards`.
            val cardsJson = json.optJSONArray("cards") ?: JSONArray()
            val cards = (0 until cardsJson.length()).map { index ->
                val card = cardsJson.getJSONObject(index)
                CardInvoice(
                    cardId = card.getString("cardId"),
                    name = card.getString("name"),
                    logo = if (card.isNull("logo")) null else card.getString("logo"),
                    amount = card.getDouble("amount"),
                    remainingAmount = card.optDouble("remainingAmount", card.getDouble("amount")),
                    paid = card.optBoolean("paid", false),
                )
            }
            return Summary(
                period = json.getString("period"),
                expenses = json.getDouble("expenses"),
                income = json.getDouble("income"),
                balance = json.getDouble("balance"),
                projectedBalance = json.getDouble("projectedBalance"),
                accountsBalance = json.getDouble("accountsBalance"),
                cards = cards,
                generatedAt = json.getString("generatedAt"),
            )
        }
    }
}

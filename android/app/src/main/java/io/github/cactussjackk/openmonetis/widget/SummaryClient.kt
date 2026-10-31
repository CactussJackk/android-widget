package io.github.cactussjackk.openmonetis.widget

import org.json.JSONException
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

sealed interface FetchResult {
    data class Success(val summary: Summary) : FetchResult
    data object Unauthorized : FetchResult
    data class Failure(val message: String) : FetchResult
}

object SummaryClient {
    private const val TIMEOUT_MS = 15_000

    fun fetch(connection: Connection): FetchResult {
        val http = try {
            URL("${connection.serverUrl}/api/widget/summary").openConnection() as HttpURLConnection
        } catch (error: IOException) {
            return FetchResult.Failure("Endereço do servidor inválido")
        }

        return try {
            http.connectTimeout = TIMEOUT_MS
            http.readTimeout = TIMEOUT_MS
            http.useCaches = false
            http.setRequestProperty("Authorization", "Bearer ${connection.token}")
            http.setRequestProperty("Accept", "application/json")
            when (val status = http.responseCode) {
                HttpURLConnection.HTTP_OK -> {
                    val body = http.inputStream.bufferedReader().use { it.readText() }
                    FetchResult.Success(Summary.fromJson(body))
                }
                HttpURLConnection.HTTP_UNAUTHORIZED, HttpURLConnection.HTTP_FORBIDDEN -> FetchResult.Unauthorized
                HttpURLConnection.HTTP_NOT_FOUND -> FetchResult.Failure("Servidor sem suporte a widgets")
                429 -> FetchResult.Failure("Muitas atualizações seguidas")
                else -> FetchResult.Failure("Servidor respondeu $status")
            }
        } catch (error: IOException) {
            FetchResult.Failure("Sem conexão com o servidor")
        } catch (error: JSONException) {
            FetchResult.Failure("Resposta inesperada do servidor")
        } finally {
            http.disconnect()
        }
    }
}

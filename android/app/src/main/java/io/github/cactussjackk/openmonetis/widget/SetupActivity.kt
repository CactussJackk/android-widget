package io.github.cactussjackk.openmonetis.widget

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Switch
import android.widget.TextView
import android.widget.Toast
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class SetupActivity : Activity() {
    private lateinit var settings: WidgetSettings
    private lateinit var status: TextView
    private lateinit var urlField: EditText
    private lateinit var tokenField: EditText
    private lateinit var refreshButton: Button
    private lateinit var openButton: Button
    private lateinit var disconnectButton: Button
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()
    private var refreshing = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_setup)
        settings = WidgetSettings(this)
        status = findViewById(R.id.setup_status)
        urlField = findViewById(R.id.setup_url)
        tokenField = findViewById(R.id.setup_token)
        refreshButton = findViewById(R.id.setup_refresh)
        openButton = findViewById(R.id.setup_open)
        disconnectButton = findViewById(R.id.setup_disconnect)
        val nextMonthSwitch = findViewById<Switch>(R.id.setup_next_month)
        nextMonthSwitch.isChecked = settings.showNextMonth
        nextMonthSwitch.setOnCheckedChangeListener { _, checked ->
            settings.showNextMonth = checked
            WidgetRenderer.updateAll(this)
            refresh()
        }

        findViewById<Button>(R.id.setup_scan).setOnClickListener { scan() }
        findViewById<Button>(R.id.setup_save).setOnClickListener {
            connect(
                ConnectionParser.fromFields(urlField.text.toString(), tokenField.text.toString()),
                "Confira o endereço (https://…) e o token (opm_…).",
            )
        }
        refreshButton.setOnClickListener { refresh() }
        openButton.setOnClickListener { openServer() }
        disconnectButton.setOnClickListener { disconnect() }

        urlField.setText(settings.savedServerUrl.orEmpty())
        render()
        handleLink(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleLink(intent)
    }

    override fun onDestroy() {
        executor.shutdown()
        super.onDestroy()
    }

    private fun handleLink(intent: Intent?) {
        if (intent?.action != Intent.ACTION_VIEW) return
        connect(ConnectionParser.fromPayload(intent.dataString), "Link de conexão inválido.")
    }

    private fun scan() {
        val options = GmsBarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
            .build()
        GmsBarcodeScanning.getClient(this, options)
            .startScan()
            .addOnSuccessListener { barcode ->
                connect(
                    ConnectionParser.fromPayload(barcode.rawValue),
                    "Este QR Code não é de um widget do OpenMonetis.",
                )
            }
            .addOnFailureListener {
                toast("Não foi possível abrir o leitor. Preencha manualmente.")
            }
    }

    private fun connect(connection: Connection?, invalidMessage: String) {
        if (connection == null) {
            toast(invalidMessage)
            return
        }
        settings.save(connection)
        urlField.setText(connection.serverUrl)
        tokenField.text.clear()
        RefreshScheduler.schedulePeriodic(this)
        refresh()
    }

    private fun refresh() {
        if (refreshing || settings.connection == null) return
        refreshing = true
        status.text = "Atualizando…"
        WidgetRenderer.updateAll(this, "Atualizando…")
        executor.execute {
            val result = SummaryRefresher.refresh(applicationContext)
            runOnUiThread {
                refreshing = false
                if (isFinishing || isDestroyed) return@runOnUiThread
                render()
                when (result) {
                    is FetchResult.Success -> toast("Conectado. Adicione o widget na tela inicial.")
                    FetchResult.Unauthorized -> toast("Token recusado. Gere um novo no OpenMonetis.")
                    is FetchResult.Failure -> toast(result.message)
                    null -> Unit
                }
            }
        }
    }

    private fun openServer() {
        val url = settings.connection?.serverUrl ?: return
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
    }

    private fun disconnect() {
        settings.clear()
        RefreshScheduler.cancel(this)
        WidgetRenderer.updateAll(this)
        urlField.text.clear()
        tokenField.text.clear()
        render()
        toast("Widget desconectado")
    }

    private fun render() {
        val connection = settings.connection
        val connected = connection != null
        refreshButton.isEnabled = connected
        openButton.isEnabled = connected
        disconnectButton.isEnabled = connected
        status.text = when {
            connection == null -> "Nenhum servidor conectado."
            settings.isUnauthorized -> "Conectado a ${connection.serverUrl}, mas o token foi recusado. Gere um novo e conecte de novo."
            settings.summary != null -> {
                val summary = settings.summary!!
                val updated = Formatters.updatedAt(settings.lastSuccessAt)
                "Conectado a ${connection.serverUrl}.\n" +
                    "Gasto em ${Formatters.monthName(summary.period)}: ${Formatters.money(summary.expenses)} " +
                    "(atualizado às $updated)." +
                    (settings.lastError?.let { "\nÚltima tentativa: $it." } ?: "")
            }
            settings.lastError != null -> "Conectado a ${connection.serverUrl}.\n${settings.lastError}."
            else -> "Conectado a ${connection.serverUrl}."
        }
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}

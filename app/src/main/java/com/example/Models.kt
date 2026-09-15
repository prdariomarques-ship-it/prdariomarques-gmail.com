package com.example

enum class AssetClass(val displayName: String) {
    RENDA_FIXA("Renda Fixa"),
    RENDA_VARIAVEL("Renda Variável"),
    INTERNACIONAL("Internacional"),
    MULTIMERCADO("Multimercado"),
    CAIXA("Caixa")
}

enum class AlertSeverity {
    NORMAL, WARNING, CRITICAL
}

data class MandateLimit(
    val assetClass: AssetClass,
    val minPercent: Double,
    val targetPercent: Double,
    val maxPercent: Double
)

data class Asset(
    val id: String,
    val ticker: String,
    val name: String,
    val assetClass: AssetClass,
    val quantity: Int,
    val currentPrice: Double,
    val totalValue: Double,
    val allocationPercent: Double
)

data class Portfolio(
    val id: String,
    val name: String,
    val clientName: String,
    val code: String,
    val totalAum: Double,
    val mandateLimits: List<MandateLimit>,
    val assets: List<Asset>,
    val status: AlertSeverity
)

data class ComplianceAlert(
    val id: String,
    val portfolioId: String,
    val portfolioName: String,
    val assetClass: AssetClass,
    val severity: AlertSeverity,
    val message: String,
    val deviationPP: Double
)

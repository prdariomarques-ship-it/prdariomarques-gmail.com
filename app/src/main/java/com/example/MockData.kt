package com.example

object MockData {
    val portfolios = listOf(
        Portfolio(
            id = "port-001",
            name = "Fundo Exclusivo Alpha",
            clientName = "Família Silva",
            code = "ALPH4",
            totalAum = 15000000.0,
            status = AlertSeverity.CRITICAL,
            mandateLimits = listOf(
                MandateLimit(AssetClass.RENDA_VARIAVEL, 10.0, 25.0, 35.0),
                MandateLimit(AssetClass.RENDA_FIXA, 40.0, 50.0, 65.0)
            ),
            assets = listOf(
                Asset("1", "PETR4", "Petrobras", AssetClass.RENDA_VARIAVEL, 10000, 35.0, 350000.0, 2.3),
                Asset("2", "VALE3", "Vale", AssetClass.RENDA_VARIAVEL, 5000, 70.0, 350000.0, 2.3)
            )
        ),
        Portfolio(
            id = "port-002",
            name = "Carteira Administrada Beta",
            clientName = "João Costa",
            code = "BETA2",
            totalAum = 5000000.0,
            status = AlertSeverity.WARNING,
            mandateLimits = listOf(
                MandateLimit(AssetClass.RENDA_FIXA, 60.0, 70.0, 80.0),
                MandateLimit(AssetClass.MULTIMERCADO, 0.0, 10.0, 15.0)
            ),
            assets = listOf(
                Asset("3", "NTN-B 2035", "Tesouro IPCA+", AssetClass.RENDA_FIXA, 1000, 4000.0, 4000000.0, 80.0)
            )
        )
    )

    val alerts = listOf(
        ComplianceAlert(
            id = "alert-1",
            portfolioId = "port-001",
            portfolioName = "Fundo Exclusivo Alpha",
            assetClass = AssetClass.RENDA_VARIAVEL,
            severity = AlertSeverity.CRITICAL,
            message = "Exposição em Renda Variável excedeu o teto do mandato (35%).",
            deviationPP = 5.2
        ),
        ComplianceAlert(
            id = "alert-2",
            portfolioId = "port-002",
            portfolioName = "Carteira Administrada Beta",
            assetClass = AssetClass.MULTIMERCADO,
            severity = AlertSeverity.WARNING,
            message = "Exposição em Multimercado próxima ao teto (15%).",
            deviationPP = 1.0
        )
    )
}

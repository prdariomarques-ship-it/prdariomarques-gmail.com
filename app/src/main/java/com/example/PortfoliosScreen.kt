package com.example

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun PortfoliosScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Carteiras Monitoradas",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(
            contentPadding = PaddingValues(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(MockData.portfolios) { portfolio ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = if (portfolio.status == AlertSeverity.CRITICAL) 
                            MaterialTheme.colorScheme.errorContainer 
                        else MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(portfolio.name, style = MaterialTheme.typography.titleMedium)
                        Text("Cliente: ${portfolio.clientName}", style = MaterialTheme.typography.bodyMedium)
                        Text("AUM: R$ ${String.format("%.2f", portfolio.totalAum)}", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        }
    }
}

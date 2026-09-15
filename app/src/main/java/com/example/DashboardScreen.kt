package com.example

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun DashboardScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Compliance Dashboard",
            style = MaterialTheme.typography.headlineMedium,
            color = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(16.dp))
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Críticos", style = MaterialTheme.typography.titleMedium)
                    Text("1", style = MaterialTheme.typography.displaySmall, color = MaterialTheme.colorScheme.error)
                }
            }
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Avisos", style = MaterialTheme.typography.titleMedium)
                    Text("1", style = MaterialTheme.typography.displaySmall)
                }
            }
        }
        Spacer(modifier = Modifier.height(16.dp))
        Text("Health Score Global", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = { 0.83f },
            modifier = Modifier.fillMaxWidth().height(16.dp)
        )
        Text("83% Conformidade", style = MaterialTheme.typography.bodyMedium)
    }
}

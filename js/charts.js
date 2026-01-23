// Gig-Fin - Charts and Trends

const Charts = {
    businessChart: null,
    personalChart: null,
    dashboardChart: null,
    
    // Configurable income threshold
    thresholdIncome: 5000,

    init() {
        this.businessChart = null;
        this.personalChart = null;
        this.dashboardChart = null;
    },

    getMonthlyData(category) {
        const entries = DataStore[category];
        const monthlyData = {};

        // Initialize all months
        for (let i = 0; i < 12; i++) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            monthlyData[key] = {
                month: monthName,
                income: 0,
                expense: 0
            };
        }

        // Aggregate data by month
        entries.forEach(entry => {
            const date = new Date(entry.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyData[key]) {
                monthlyData[key][entry.type] += parseFloat(entry.amount);
            }
        });

        // Convert to array and reverse to show oldest first
        return Object.values(monthlyData).reverse();
    },

    updateAll() {
        this.updateDashboardChart();
        this.updateBusinessChart();
        this.updatePersonalChart();
        this.updateInsights();
    },

    updateDashboardChart() {
        const ctx = document.getElementById('dashboard-chart');
        if (!ctx) return;

        const monthlyData = this.getMonthlyData('business');

        // Destroy existing chart
        if (this.dashboardChart) {
            this.dashboardChart.destroy();
        }

        // Create new line chart
        this.dashboardChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.map(d => d.income),
                        borderColor: 'rgba(16, 185, 129, 1)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Expense',
                        data: monthlyData.map(d => d.expense),
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });

        // Update income status
        this.updateIncomeStatus();
    },

    updateIncomeStatus() {
        const statusContainer = document.getElementById('income-status');
        if (!statusContainer) return;

        const businessTotals = DataStore.calculateTotals('business');
        const currentIncome = businessTotals.income;

        if (currentIncome < this.thresholdIncome) {
            statusContainer.innerHTML = `<div class="income-warning">Warning: Income is below threshold. Consider increasing your gig earnings.</div>`;
            statusContainer.className = 'income-status warning';
        } else {
            statusContainer.innerHTML = `<div class="income-positive">Great! Your income is above the threshold. Keep up the good work!</div>`;
            statusContainer.className = 'income-status positive';
        }
    },

    updateBusinessChart() {
        const ctx = document.getElementById('business-chart');
        if (!ctx) return;

        const monthlyData = this.getMonthlyData('business');

        // Destroy existing chart
        if (this.businessChart) {
            this.businessChart.destroy();
        }

        // Create new chart
        this.businessChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.map(d => d.income),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Expense',
                        data: monthlyData.map(d => d.expense),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },

    updatePersonalChart() {
        const ctx = document.getElementById('personal-chart');
        if (!ctx) return;

        const monthlyData = this.getMonthlyData('personal');

        // Destroy existing chart
        if (this.personalChart) {
            this.personalChart.destroy();
        }

        // Create new chart
        this.personalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.map(d => d.month),
                datasets: [
                    {
                        label: 'Income',
                        data: monthlyData.map(d => d.income),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)',
                        borderColor: 'rgba(16, 185, 129, 1)',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Expense',
                        data: monthlyData.map(d => d.expense),
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgba(239, 68, 68, 1)',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    },

    updateInsights() {
        const container = document.getElementById('trends-insights');
        if (!container) return;

        const businessData = this.getMonthlyData('business');
        const personalData = this.getMonthlyData('personal');

        // Calculate insights
        const insights = [];

        // Business insights
        const businessTotals = DataStore.calculateTotals('business');
        const businessIncome = businessTotals.income;
        const businessExpense = businessTotals.expense;
        const businessSavingsRate = businessIncome > 0 ? ((businessIncome - businessExpense) / businessIncome * 100) : 0;

        insights.push({
            title: 'Business Net Profit',
            value: Utils.formatCurrency(businessTotals.net),
            color: businessTotals.net >= 0 ? '#10b981' : '#ef4444'
        });

        insights.push({
            title: 'Business Savings Rate',
            value: businessIncome > 0 ? `${businessSavingsRate.toFixed(1)}%` : 'N/A',
            color: businessSavingsRate >= 0 ? '#10b981' : '#ef4444'
        });

        // Personal insights
        const personalTotals = DataStore.calculateTotals('personal');
        const personalIncome = personalTotals.income;
        const personalExpense = personalTotals.expense;
        const personalSavingsRate = personalIncome > 0 ? ((personalIncome - personalExpense) / personalIncome * 100) : 0;

        insights.push({
            title: 'Personal Net Balance',
            value: Utils.formatCurrency(personalTotals.net),
            color: personalTotals.net >= 0 ? '#10b981' : '#ef4444'
        });

        insights.push({
            title: 'Personal Savings Rate',
            value: personalIncome > 0 ? `${personalSavingsRate.toFixed(1)}%` : 'N/A',
            color: personalSavingsRate >= 0 ? '#10b981' : '#ef4444'
        });

        // Volatility analysis
        if (businessData.length > 1) {
            const incomeVolatility = this.calculateVolatility(businessData.map(d => d.income));
            insights.push({
                title: 'Business Income Volatility',
                value: incomeVolatility === 'Low' ? 'Stable' : incomeVolatility === 'Medium' ? 'Moderate' : 'Variable',
                color: incomeVolatility === 'Low' ? '#10b981' : incomeVolatility === 'Medium' ? '#f59e0b' : '#ef4444'
            });
        }

        if (personalData.length > 1) {
            const expenseVolatility = this.calculateVolatility(personalData.map(d => d.expense));
            insights.push({
                title: 'Personal Expense Volatility',
                value: expenseVolatility === 'Low' ? 'Stable' : expenseVolatility === 'Medium' ? 'Moderate' : 'Variable',
                color: expenseVolatility === 'Low' ? '#10b981' : expenseVolatility === 'Medium' ? '#f59e0b' : '#ef4444'
            });
        }

        // Render insights
        container.innerHTML = insights.map(insight => `
            <div class="insight-item" style="border-left-color: ${insight.color}">
                <h4>${insight.title}</h4>
                <p style="color: ${insight.color}">${insight.value}</p>
            </div>
        `).join('');
    },

    calculateVolatility(values) {
        if (values.length < 2) return 'Low';

        const nonZeroValues = values.filter(v => v > 0);
        if (nonZeroValues.length < 2) return 'Low';

        const mean = nonZeroValues.reduce((a, b) => a + b, 0) / nonZeroValues.length;
        const variance = nonZeroValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / nonZeroValues.length;
        const stdDev = Math.sqrt(variance);
        const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

        if (cv < 30) return 'Low';
        if (cv < 60) return 'Medium';
        return 'High';
    }
};

// Initialize charts
document.addEventListener('DOMContentLoaded', () => {
    Charts.init();
});


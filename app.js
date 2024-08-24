document.addEventListener('DOMContentLoaded', function() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker registrato con successo:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        });
    }

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            displayExpenses();
        } else {
            // Gestisci la visualizzazione del form di login o simile qui
        }
    });
});

function displayExpenses() {
    const expenseList = document.getElementById('expenseList');
    
    db.collection("expenses").orderBy("date", "desc").onSnapshot((querySnapshot) => {
        expenseList.innerHTML = '';

        let expenses = [];
        let totalJackMesso = 0;
        let totalSteMesso = 0;
        let totalJackDovuto = 0;
        let totalSteDovuto = 0;

        querySnapshot.forEach((doc) => {
            const expense = doc.data();
            expenses.push(expense);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>€${parseFloat(expense.totalAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.jackAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.steAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.jackShare).toFixed(2)}</td>
                <td>€${parseFloat(expense.steShare).toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="confirmDeleteExpense('${doc.id}')">Elimina</button></td>
            `;
            expenseList.appendChild(row);

            totalJackMesso += parseFloat(expense.jackAmount);
            totalSteMesso += parseFloat(expense.steAmount);
            totalJackDovuto += parseFloat(expense.jackShare);
            totalSteDovuto += parseFloat(expense.steShare);
        });

        $('#expenseTable').DataTable();

        const jackBalance = totalJackMesso - totalJackDovuto;
        let balanceText = '';

        if (jackBalance > 0) {
            balanceText = `Ste deve dare a Jack: €${jackBalance.toFixed(2)}`;
        } else if (jackBalance < 0) {
            balanceText = `Jack deve dare a Ste: €${Math.abs(jackBalance).toFixed(2)}`;
        } else {
            balanceText = `Jack e Ste sono pari.`;
        }

        document.getElementById('totalBalance').textContent = balanceText;

        generateChart(expenses);
    });
}

function generateChart(expenses) {
    const ctx = document.getElementById('expenseChart').getContext('2d');
    const labels = expenses.map(expense => formatDate(expense.date));
    const dataJack = expenses.map(expense => parseFloat(expense.jackAmount));
    const dataSte = expenses.map(expense => parseFloat(expense.steAmount));

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Spese di Jack',
                data: dataJack,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            },
            {
                label: 'Spese di Ste',
                data: dataSte,
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
                borderColor: 'rgba(153, 102, 255, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function confirmDeleteExpense(id) {
    if (confirm("Sei sicuro di voler eliminare questa spesa?")) {
        deleteExpense(id);
    }
}

function deleteExpense(id) {
    db.collection("expenses").doc(id).delete()
        .then(() => {
            displayExpenses();
        })
        .catch((error) => {
            console.error("Errore nell'eliminare la spesa: ", error);
        });
}

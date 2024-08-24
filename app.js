document.addEventListener('DOMContentLoaded', function() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/gestione-spese-2/service-worker.js')
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
            const path = window.location.pathname;
            if (path.includes("index.html")) {
                displayHomeContent();
            } else if (path.includes("expenses.html")) {
                displayExpenses();
            }
        } else {
            // Gestisci la visualizzazione del form di login o simile qui
        }
    });
});

function displayHomeContent() {
    const recentExpensesList = document.getElementById('recentExpenses');
    const totalBalanceDiv = document.getElementById('totalBalance');
    
    db.collection("expenses").orderBy("date", "desc").limit(5).get().then((querySnapshot) => {
        let totalJackMesso = 0;
        let totalSteMesso = 0;
        let totalJackDovuto = 0;
        let totalSteDovuto = 0;

        recentExpensesList.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const expense = doc.data();
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = `${formatDate(expense.date)} - ${expense.description}: €${parseFloat(expense.totalAmount).toFixed(2)}`;
            recentExpensesList.appendChild(listItem);

            totalJackMesso += parseFloat(expense.jackAmount);
            totalSteMesso += parseFloat(expense.steAmount);
            totalJackDovuto += parseFloat(expense.jackShare);
            totalSteDovuto += parseFloat(expense.steShare);
        });

        const jackBalance = totalJackMesso - totalJackDovuto;
        let balanceText = '';

        if (jackBalance > 0) {
            balanceText = `Ste deve dare a Jack: €${jackBalance.toFixed(2)}`;
        } else if (jackBalance < 0) {
            balanceText = `Jack deve dare a Ste: €${Math.abs(jackBalance).toFixed(2)}`;
        } else {
            balanceText = `Jack e Ste sono pari.`;
        }

        totalBalanceDiv.textContent = balanceText;

        generateSummaryChart(totalJackMesso, totalSteMesso);
    });
}

function generateSummaryChart(totalJackMesso, totalSteMesso) {
    const ctx = document.getElementById('expenseSummaryChart').getContext('2d');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Jack', 'Ste'],
            datasets: [{
                data: [totalJackMesso, totalSteMesso],
                backgroundColor: ['#007bff', '#ffc107']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

function displayExpenses() {
    const expenseList = document.getElementById('expenseList');
    
    db.collection("expenses").orderBy("date", "desc").onSnapshot((querySnapshot) => {
        expenseList.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const expense = doc.data();
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
        });
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

function formatDate(dateString) {
    const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', options);
}

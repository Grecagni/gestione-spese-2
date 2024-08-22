function formatDate(dateString) {
    const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', options);
}

document.addEventListener('DOMContentLoaded', function() {
    // Imposta la data odierna come default nel formato yyyy-mm-dd
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');

    // Imposta il valore di default solo se l'input esiste
    if (dateInput) {
        dateInput.value = today;
    }

    displayExpenses();
});

function displayExpenses() {
    const expenseList = document.getElementById('expenseList');
    
    // Usa onSnapshot per aggiornare in tempo reale
    db.collection("expenses").orderBy("date", "desc").onSnapshot((querySnapshot) => {
        // Svuota l'elenco prima di aggiungere nuove spese
        expenseList.innerHTML = '';

        let totalJackBalance = 0;
        let totalSteBalance = 0;

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
                <td><button class="delete-btn" onclick="confirmDeleteExpense('${doc.id}')">Elimina</button></td>
            `;
            expenseList.appendChild(row);

            // Accumula i saldi totali
            totalJackBalance += parseFloat(expense.jackBalance);
            totalSteBalance += parseFloat(expense.steBalance);
        });

        const totalBalance = totalSteBalance - totalJackBalance;
        let balanceText = '';

        if (totalBalance > 0) {
            balanceText = `Jack deve dare a Ste: €${totalBalance.toFixed(2)}`;
        } else if (totalBalance < 0) {
            balanceText = `Ste deve dare a Jack: €${Math.abs(totalBalance).toFixed(2)}`;
        } else {
            balanceText = `Jack e Ste sono pari.`;
        }

        document.getElementById('totalBalance').textContent = balanceText;
    });
}

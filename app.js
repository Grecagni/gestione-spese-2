document.addEventListener('DOMContentLoaded', function() {
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            const formContainer = document.getElementById('expenseFormContainer');
            if (formContainer) {
                if (formContainer.style.display === 'none' || formContainer.style.display === '') {
                    formContainer.style.display = 'block';
                } else {
                    formContainer.style.display = 'none';
                }
            }
        });
    }

    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('date');

    if (dateInput) {
        dateInput.value = today;
    }

    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("content").style.display = "block";
            addExpenseBtn.style.display = 'block';
            displayExpenses();
        } else {
            document.getElementById("auth-container").innerHTML = `
                <div style="text-align:center;">
                    <h2>Accedi per continuare</h2>
                    <input type="email" id="email" placeholder="Email" class="form-control mb-2">
                    <input type="password" id="password" placeholder="Password" class="form-control mb-2">
                    <button onclick="login()" class="btn btn-primary">Login</button>
                </div>
            `;
            document.getElementById("content").style.display = "none";
            addExpenseBtn.style.display = 'none';
        }
    });

    document.getElementById('splitType').addEventListener('change', function() {
        const splitType = this.value;
        const splitDetails = document.getElementById('splitDetails');
        
        if (splitType === 'equally') {
            splitDetails.style.display = 'none';
        } else {
            splitDetails.style.display = 'block';
        }
    });

    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const description = document.getElementById('description').value;
            const date = document.getElementById('date').value;
            const totalAmount = parseFloat(document.getElementById('totalAmount').value).toFixed(2);
            
            const jackAmount = parseFloat(document.getElementById('jackAmount').value).toFixed(2);
            const steAmount = parseFloat(document.getElementById('steAmount').value).toFixed(2);

            if ((parseFloat(jackAmount) + parseFloat(steAmount)).toFixed(2) != totalAmount) {
                alert("La somma di chi ha messo cosa deve essere uguale all'importo totale della spesa.");
                return;
            }

            const splitType = document.getElementById('splitType').value;
            let jackShare = 0;
            let steShare = 0;

            if (splitType === 'equally') {
                jackShare = (totalAmount / 2).toFixed(2);
                steShare = (totalAmount / 2).toFixed(2);
            } else if (splitType === 'exact') {
                jackShare = parseFloat(document.getElementById('jackSplit').value).toFixed(2);
                steShare = parseFloat(document.getElementById('steSplit').value).toFixed(2);

                if ((parseFloat(jackShare) + parseFloat(steShare)).toFixed(2) != totalAmount) {
                    alert("La somma della divisione spesa deve essere uguale all'importo totale della spesa.");
                    return;
                }
            }

            const jackBalance = (jackShare - jackAmount).toFixed(2);
            const steBalance = (steShare - steAmount).toFixed(2);

            const expense = {
                description,
                date,
                totalAmount: totalAmount,
                jackAmount: jackAmount,
                steAmount: steAmount,
                jackShare: jackShare,
                steShare: steShare,
                jackBalance: jackBalance,
                steBalance: steBalance,
                userId: firebase.auth().currentUser.uid
            };

            db.collection("expenses").add(expense)
                .then(() => {
                    displayExpenses();
                    document.getElementById('expenseFormContainer').style.display = 'none';
                })
                .catch((error) => {
                    console.error("Errore nell'aggiungere la spesa: ", error);
                });

            document.getElementById('description').value = '';
            document.getElementById('date').value = '';
            document.getElementById('totalAmount').value = '';
            document.getElementById('jackAmount').value = '';
            document.getElementById('steAmount').value = '';
            document.getElementById('jackSplit').value = '';
            document.getElementById('steSplit').value = '';
        });
    }
});

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("content").style.display = "block";
            document.getElementById('addExpenseBtn').style.display = 'block';
        })
        .catch((error) => {
            console.error("Errore nel login: ", error);
            alert("Login fallito. Controlla le tue credenziali.");
        });
}

function formatDate(dateString) {
    const options = { year: '2-digit', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', options);
}

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

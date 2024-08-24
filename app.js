document.addEventListener('DOMContentLoaded', function() {
    console.log(firebase.apps.length ? "Firebase è stato inizializzato" : "Firebase NON è stato inizializzato");

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

    // Gestione autenticazione
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("Utente autenticato:", user);
            if (document.getElementById('login-container')) {
                document.getElementById('login-container').style.display = 'none';
            }
            if (document.getElementById('content-container')) {
                document.getElementById('content-container').style.display = 'block';
            }
            if (document.getElementById('navbar')) {
                document.getElementById('navbar').style.display = 'block';
            }
            const path = window.location.pathname;
            if (path.includes("index.html")) {
                displayHomeContent();
            } else if (path.includes("expenses.html")) {
                displayExpenses();
            }
        } else {
            console.log("Nessun utente autenticato.");
            if (document.getElementById('login-container')) {
                document.getElementById('login-container').style.display = 'block';
            }
            if (document.getElementById('content-container')) {
                document.getElementById('content-container').style.display = 'none';
            }
            if (document.getElementById('navbar')) {
                document.getElementById('navbar').style.display = 'none';
            }
        }
    });

    // Gestione login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            firebase.auth().signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    console.log("Login avvenuto con successo:", userCredential.user);
                })
                .catch((error) => {
                    console.error("Errore durante il login:", error);
                    alert("Credenziali non valide. Riprova.");
                });
        });
    }

    // Gestione aggiunta spesa
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const description = document.getElementById('description').value;
            const date = document.getElementById('date').value;
            const totalAmount = parseFloat(document.getElementById('totalAmount').value);
            const jackAmount = parseFloat(document.getElementById('jackAmount').value);
            const steAmount = parseFloat(document.getElementById('steAmount').value);

            let jackShare, steShare;

            const splitType = document.getElementById('splitType').value;

            if (splitType === 'equally') {
                // Divisione equa: dividiamo il totale a metà per ciascuno
                jackShare = totalAmount / 2;
                steShare = totalAmount / 2;
            } else {
                // Logica per divisione esatta
                jackShare = parseFloat(document.getElementById('jackShare').value);
                steShare = parseFloat(document.getElementById('steShare').value);
            }

            console.log("Dati raccolti dal form:", { description, date, totalAmount, jackAmount, steAmount, jackShare, steShare });

            db.collection("expenses").add({
                description,
                date,
                totalAmount,
                jackAmount,
                steAmount,
                jackShare,
                steShare
            })
            .then(function() {
                console.log("Spesa aggiunta con successo!");
                window.location.href = '/gestione-spese-2/expenses.html';
            })
            .catch(function(error) {
                console.error("Errore durante l'aggiunta della spesa:", error);
            });
        });
    }
});

function displayHomeContent() {
    const recentExpensesList = document.getElementById('recentExpenses');
    const totalBalanceDiv = document.getElementById('totalBalance');
    
    db.collection("expenses").orderBy("date", "desc").limit(5).get().then((querySnapshot) => {
        let totalJackMesso = 0; // Quanto Jack ha messo
        let totalSteMesso = 0; // Quanto Ste ha messo
        let totalJackDovuto = 0; // Quanto Jack doveva mettere
        let totalSteDovuto = 0; // Quanto Ste doveva mettere

        if (recentExpensesList) {
            recentExpensesList.innerHTML = '';
        }

        querySnapshot.forEach((doc) => {
            const expense = doc.data();
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item';
            listItem.textContent = `${formatDate(expense.date)} - ${expense.description}: €${parseFloat(expense.totalAmount).toFixed(2)}`;
            if (recentExpensesList) {
                recentExpensesList.appendChild(listItem);
            }

            totalJackMesso += parseFloat(expense.jackAmount);
            totalSteMesso += parseFloat(expense.steAmount);
            totalJackDovuto += parseFloat(expense.jackShare);
            totalSteDovuto += parseFloat(expense.steShare);
        });

        // Calcolo del saldo per Jack e Ste
        const saldoJack = totalJackMesso - totalJackDovuto;
        let balanceText = '';

        if (saldoJack > 0) {
            balanceText = `Ste deve dare a Jack: €${saldoJack.toFixed(2)}`;
        } else if (saldoJack < 0) {
            balanceText = `Jack deve dare a Ste: €${Math.abs(saldoJack).toFixed(2)}`;
        } else {
            balanceText = `Jack e Ste sono pari.`;
        }

        if (totalBalanceDiv) {
            totalBalanceDiv.textContent = balanceText;
        }
    });
}

function displayExpenses() {
    const expenseList = document.getElementById('expenseList');
    
    db.collection("expenses").orderBy("date", "desc").onSnapshot((querySnapshot) => {
        console.log("Documenti recuperati:", querySnapshot.docs.length);

        if (expenseList) {
            expenseList.innerHTML = '';
        }

        querySnapshot.forEach((doc) => {
            const expense = doc.data();
            console.log(expense);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>€${parseFloat(expense.totalAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.jackAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.steAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.jackShare).toFixed(2)}</td>
                <td>€${parseFloat(expense.steShare).toFixed(2)}</td>
                <td><button class="btn btn-danger" onclick="confirmDeleteExpense('${doc.id}')">X</button></td>
            `;
            if (expenseList) {
                expenseList.appendChild(row);
            }
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
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', options);
}

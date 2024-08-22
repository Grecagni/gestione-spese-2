// Firebase Authentication
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Utente loggato, visualizza il contenuto del sito
        document.getElementById("auth-container").style.display = "none";
        document.getElementById("content").style.display = "block";
        displayExpenses();
    } else {
        // Nessun utente loggato, mostra il form di login
        document.getElementById("auth-container").innerHTML = `
            <div style="text-align:center;">
                <h2>Accedi per continuare</h2>
                <input type="email" id="email" placeholder="Email">
                <input type="password" id="password" placeholder="Password">
                <button onclick="login()">Login</button>
                <button onclick="signup()">Registrati</button>
            </div>
        `;
        document.getElementById("content").style.display = "none";
    }
});

function login() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    firebase.auth().signInWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(error.message);
        });
}

function signup() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .catch((error) => {
            alert(error.message);
        });
}

document.getElementById('splitType').addEventListener('change', function() {
    const splitType = this.value;
    const splitDetails = document.getElementById('splitDetails');
    
    if (splitType === 'equally') {
        splitDetails.style.display = 'none';
    } else {
        splitDetails.style.display = 'block';
    }
});

document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    const totalAmount = parseFloat(document.getElementById('totalAmount').value).toFixed(2);
    
    const jackAmount = parseFloat(document.getElementById('jackAmount').value).toFixed(2);
    const steAmount = parseFloat(document.getElementById('steAmount').value).toFixed(2);

    // Controllo 1: La somma di chi ha messo cosa deve essere uguale al totale
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

        // Controllo 2: La somma della divisione deve essere uguale al totale
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

    // Aggiungi la spesa a Firestore
    db.collection("expenses").add(expense)
        .then(() => {
            displayExpenses();
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

function displayExpenses() {
    const expenseList = document.getElementById('expenseList');
    
    // Usa onSnapshot per aggiornare in tempo reale
    db.collection("expenses").onSnapshot((querySnapshot) => {
        // Svuota l'elenco prima di aggiungere nuove spese
        expenseList.innerHTML = '';

        let totalJackBalance = 0;
        let totalSteBalance = 0;

        querySnapshot.forEach((doc) => {
            const expense = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.date}</td>
                <td>${expense.description}</td>
                <td>€${parseFloat(expense.totalAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.jackAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.steAmount).toFixed(2)}</td>
                <td>€${parseFloat(expense.jackShare).toFixed(2)}</td>
                <td>€${parseFloat(expense.steShare).toFixed(2)}</td>
                <td>€${parseFloat(expense.jackBalance).toFixed(2)}</td>
                <td>€${parseFloat(expense.steBalance).toFixed(2)}</td>
                <td><button class="delete-btn" onclick="deleteExpense('${doc.id}')">Elimina</button></td>
            `;
            expenseList.appendChild(row);

            totalJackBalance += parseFloat(expense.jackBalance);
            totalSteBalance += parseFloat(expense.steBalance);
        });

        document.getElementById('totalBalance').textContent = `Totale Saldo: Jack: €${totalJackBalance.toFixed(2)}, Ste: €${totalSteBalance.toFixed(2)}`;
    });
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

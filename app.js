// Inizializza Firebase
var firebaseConfig = {
    apiKey: "AIzaSyA6usjd2E5ytJz8Mx9SqjQXGXPgnOAeqYw",
    authDomain: "gestione-spese-2-5db43.firebaseapp.com",
    projectId: "gestione-spese-2-5db43",
    storageBucket: "gestione-spese-2-5db43.appspot.com",
    messagingSenderId: "583349146945",
    appId: "1:583349146945:web:af0989d9c1889b1ef77dc0"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Funzione per caricare le spese nel file expenses.html
function loadExpenses() {
    const expenseList = document.getElementById('expenseList');
    db.collection("expenses").orderBy("date", "desc").onSnapshot((querySnapshot) => {
        expenseList.innerHTML = ""; // Pulisce la lista prima di caricare nuovi dati
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(data.date).toLocaleDateString()}</td>
                <td>${data.description}</td>
                <td>€${parseFloat(data.totalAmount).toFixed(2)}</td>
                <td>€${parseFloat(data.jackAmount).toFixed(2)}</td>
                <td>€${parseFloat(data.steAmount).toFixed(2)}</td>
                <td>€${parseFloat(data.jackShare).toFixed(2)}</td>
                <td>€${parseFloat(data.steShare).toFixed(2)}</td>
                <td><button class="btn-delete" onclick="deleteExpense('${doc.id}')">X</button></td>
            `;
            expenseList.appendChild(row);
        });
    });
}

// Funzione per eliminare una spesa
function deleteExpense(id) {
    db.collection("expenses").doc(id).delete().then(() => {
        console.log("Documento eliminato con successo!");
    }).catch((error) => {
        console.error("Errore durante l'eliminazione del documento: ", error);
    });
}

// Funzione per aggiungere una nuova spesa nel file add-expense.html
document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;
    const totalAmount = parseFloat(document.getElementById('totalAmount').value);
    const jackAmount = parseFloat(document.getElementById('jackAmount').value);
    const steAmount = parseFloat(document.getElementById('steAmount').value);
    const splitType = document.getElementById('splitType').value;
    const jackShare = splitType === 'exact' ? parseFloat(document.getElementById('jackShare').value) : totalAmount / 2;
    const steShare = splitType === 'exact' ? parseFloat(document.getElementById('steShare').value) : totalAmount / 2;

    // Controllo che gli importi siano coerenti
    if ((jackAmount + steAmount) !== totalAmount) {
        alert('La somma degli importi messi da Jack e Ste non corrisponde al totale della spesa.');
        return;
    }

    if (splitType === 'exact' && (jackShare + steShare) !== totalAmount) {
        alert('La somma degli importi dovuti da Jack e Ste non corrisponde al totale della spesa.');
        return;
    }

    db.collection("expenses").add({
        description: description,
        date: date,
        totalAmount: totalAmount,
        jackAmount: jackAmount,
        steAmount: steAmount,
        jackShare: jackShare,
        steShare: steShare
    }).then(() => {
        console.log("Spesa aggiunta con successo!");
        window.location.href = "/gestione-spese-2/expenses.html"; // Reindirizza alla pagina delle spese
    }).catch((error) => {
        console.error("Errore durante l'aggiunta della spesa: ", error);
    });
});

// Carica le spese all'avvio
if (document.getElementById('expenseList')) {
    loadExpenses();
}

// Calcola la situazione finanziaria tra Jack e Ste nella home
function calculateBalance() {
    const balanceElement = document.getElementById('totalBalance');
    db.collection("expenses").get().then((querySnapshot) => {
        let jackTotal = 0;
        let steTotal = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            jackTotal += (data.jackAmount - data.jackShare);
            steTotal += (data.steAmount - data.steShare);
        });

        const finalBalance = jackTotal - steTotal;
        if (finalBalance > 0) {
            balanceElement.textContent = `Ste deve €${Math.abs(finalBalance).toFixed(2)} a Jack`;
        } else if (finalBalance < 0) {
            balanceElement.textContent = `Jack deve €${Math.abs(finalBalance).toFixed(2)} a Ste`;
        } else {
            balanceElement.textContent = "Jack e Ste sono pari";
        }
    }).catch((error) => {
        console.error("Errore nel calcolo del saldo: ", error);
    });
}

// Carica il saldo totale nella home all'avvio
if (document.getElementById('totalBalance')) {
    calculateBalance();
}

// Gestisce la visualizzazione dinamica dei campi nella pagina di aggiunta spese
document.addEventListener('DOMContentLoaded', function() {
    const splitTypeElement = document.getElementById('splitType');
    const splitDetails = document.getElementById('splitDetails');
    
    splitTypeElement.addEventListener('change', function() {
        if (this.value === 'exact') {
            splitDetails.style.display = 'block';
        } else {
            splitDetails.style.display = 'none';
        }
    });

    // Imposta la data odierna come valore predefinito
    const dateElement = document.getElementById('date');
    if (dateElement) {
        dateElement.value = new Date().toISOString().split('T')[0];
    }
});

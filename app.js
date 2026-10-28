// Structure de données de départ incluant le nombre (quantité) et la capacité (Watts)
const appareilsTypes = [
    { nom: "Ampoule LED", watt: 9 },
    { nom: "Marmite Élec/Rice Cooker", watt: 650 },
    { nom: "TV LED 65\"", watt: 65 },
    { nom: "Réfrigérateur", watt: 140 },
    { nom: "Fer à repasser", watt: 1000 },
    { nom: "Ventilateur", watt: 50 }
];

let applicationState = JSON.parse(localStorage.getItem('jirama_fiches_data')) || {
    utilisateurs: [
        {
            id: "moi",
            nom: "Moi (Propriétaire)",
            personnes: 1,
            estMoi: true,
            appareils: [
                { nom: "Ampoules LED", quantite: 3, watt: 9, heures: 6, jours: 30 },
                { nom: "Télévision Smart", quantite: 1, watt: 70, heures: 4, jours: 30 }
            ]
        },
        {
            id: "locat1",
            nom: "Locataire Foyer 1",
            personnes: 2,
            estMoi: false,
            appareils: [
                { nom: "Marmite électrique (Rice Cooker)", quantite: 1, watt: 600, heures: 1, jours: 30 },
                { nom: "Ampoules simples", quantite: 2, watt: 15, heures: 5, jours: 30 }
            ]
        }
    ]
};

function enregistrerDonnees() {
    localStorage.setItem('jirama_fiches_data', JSON.stringify(applicationState));
}

function genererInterface() {
    const zone = document.getElementById('zoneFiches');
    if (!zone) return;
    zone.innerHTML = '';

    applicationState.utilisateurs.forEach((user, uIdx) => {
        let boutonSupprimer = user.estMoi ? '' : `<button class="btn btn-danger" onclick="supprimerUtilisateur(${uIdx})">Supprimer Locataire</button>`;

        let htmlFiche = `
            <div class="fiche-utilisateur ${user.estMoi ? 'moi' : ''}">
                <div class="entete-fiche">
                    <div>
                        <input type="text" value="${user.nom}" style="font-weight:bold; font-size:1.1rem; border:none; background:transparent;" onchange="modifierNomUtilisateur(${uIdx}, this.value)">
                    </div>
                    <div class="form-group" style="flex-direction:row; align-items:center; gap:8px;">
                        <label style="margin:0;">Nombre de personnes (Eau) :</label>
                        <input type="number" class="mini-input" value="${user.personnes}" min="0" onchange="modifierPersonnesUtilisateur(${uIdx}, this.value)">
                        ${boutonSupprimer}
                    </div>
                </div>

                <table class="table-appareils">
                    <thead>
                        <tr>
                            <th>Nom de l'appareil</th>
                            <th>Nbr (Qté)</th>
                            <th>Capacité (Watts)</th>
                            <th>Heures / jour</th>
                            <th>Jours / mois</th>
                            <th>Total kWh</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        user.appareils.forEach((app, aIdx) => {
            // Prise en compte de la quantité dans le calcul de la consommation brute
            let qte = app.quantite || 1;
            let kwh = (qte * app.watt * app.heures * app.jours) / 1000;
            
            htmlFiche += `
                <tr>
                    <td><input type="text" value="${app.nom}" onchange="modifierAppareil(${uIdx}, ${aIdx}, 'nom', this.value)"></td>
                    <td><input type="number" class="mini-input" value="${qte}" min="1" onchange="modifierAppareil(${uIdx}, ${aIdx}, 'quantite', this.value)"></td>
                    <td><input type="number" class="med-input" value="${app.watt}" onchange="modifierAppareil(${uIdx}, ${aIdx}, 'watt', this.value)"> W</td>
                    <td><input type="number" class="mini-input" value="${app.heures}" onchange="modifierAppareil(${uIdx}, ${aIdx}, 'heures', this.value)"> h</td>
                    <td><input type="number" class="mini-input" value="${app.jours}" onchange="modifierAppareil(${uIdx}, ${aIdx}, 'jours', this.value)"> j</td>
                    <td><strong>${kwh.toFixed(2)} kWh</strong></td>
                    <td><button class="btn btn-danger" style="padding:4px 8px;" onclick="supprimerAppareil(${uIdx}, ${aIdx})">X</button></td>
                </tr>
            `;
        });

        htmlFiche += `
                    </tbody>
                </table>
                <button class="btn" style="background-color:var(--success); font-size:0.85rem;" onclick="ajouterAppareilAUtilisateur(${uIdx})">+ Ajouter un appareil</button>
                
                <div class="sous-total-fiche" style="margin-top:15px;">
                    <span id="calculElec-${uIdx}">Élec : 0.00 Ar</span>
                    <span id="calculEau-${uIdx}">Eau : 0.00 Ar</span>
                    <span class="total-final-foyer" id="calculTotal-${uIdx}">Total à payer : 0.00 Ar</span>
                </div>
            </div>
        `;
        zone.innerHTML += htmlFiche;
    });

    calculerTout();
}

function modifierNomUtilisateur(uIdx, valeur) { applicationState.utilisateurs[uIdx].nom = valeur; enregistrerDonnees(); calculerTout(); }
function modifierPersonnesUtilisateur(uIdx, valeur) { applicationState.utilisateurs[uIdx].personnes = parseInt(valeur) || 0; enregistrerDonnees(); calculerTout(); }
function ajouterNouvelUtilisateur() { applicationState.utilisateurs.push({ nom: "Nouveau Locataire", personnes: 1, estMoi: false, appareils: [] }); enregistrerDonnees(); genererInterface(); }
function supprimerUtilisateur(uIdx) { applicationState.utilisateurs.splice(uIdx, 1); enregistrerDonnees(); genererInterface(); }

function ajouterAppareilAUtilisateur(uIdx) {
    // Demander le type d'appareil à la bibliothèque
    const typeChoisi = prompt(
        "Choisir un type d'appareil :\n" +
        appareilsTypes.map((a, i) => `${i+1}. ${a.nom} (${a.watt}W)`).join('\n') +
        "\n\nOu entrer manuellement :",
        "Nom de l'appareil"
    );
    
    if (typeChoisi !== null) {
        // Vérifier si c'est un choix de la bibliothèque
        const index = parseInt(typeChoisi.split('.')[0]) - 1;
        if (!isNaN(index) && index >= 0 && index < appareilsTypes.length) {
            const type = appareilsTypes[index];
            applicationState.utilisateurs[uIdx].appareils.push({
                nom: type.nom,
                quantite: 1,
                watt: type.watt,
                heures: 3,
                jours: 30
            });
        } else {
            // Appareil saisi manuellement
            const parts = typeChoisi.split(',');
            applicationState.utilisateurs[uIdx].appareils.push({
                nom: typeChoisi.trim(),
                quantite: parseInt(parts[1]) || 1,
                watt: parseFloat(parts[0]) || 60,
                heures: 3,
                jours: 30
            });
        }
        enregistrerDonnees();
        genererInterface();
    }
}
function supprimerAppareil(uIdx, aIdx) { applicationState.utilisateurs[uIdx].appareils.splice(aIdx, 1); enregistrerDonnees(); genererInterface(); }

function modifierAppareil(uIdx, aIdx, champ, valeur) {
    let appareil = applicationState.utilisateurs[uIdx].appareils[aIdx];
    if (champ === 'nom') {
        appareil.nom = valeur;
    } else {
        appareil[champ] = parseFloat(valeur) || 0;
    }
    enregistrerDonnees();
    calculerTout(); 
}

function calculerTout() {
    const inputElec = document.getElementById('factureElec');
    const inputEau = document.getElementById('factureEau');
    
    const mtElecGlobal = inputElec ? parseFloat(inputElec.value) || 0 : 0;
    const mtEauGlobal = inputEau ? parseFloat(inputEau.value) || 0 : 0;

    // 💧 ÉTAPE 1 : Nombre global de personnes pour diviser l'eau
    let totalPersonnesMaison = applicationState.utilisateurs.reduce((sum, u) => sum + u.personnes, 0);

    // ⚡ ÉTAPE 2 : Calcul des kWh totaux avec prise en compte du coefficient quantité
    let totalKwhMaison = 0;
    let kwhParUtilisateur = applicationState.utilisateurs.map(user => {
        let totalKwhUser = user.appareils.reduce((sum, app) => {
            let qte = app.quantite || 1;
            return sum + ((qte * app.watt * app.heures * app.jours) / 1000);
        }, 0);
        totalKwhMaison += totalKwhUser;
        return totalKwhUser;
    });

    let verifSommeElec = 0;
    let verifSommeEau = 0;

    // 📊 ÉTAPE 3 : Distribution proportionnelle par fiche
    applicationState.utilisateurs.forEach((user, uIdx) => {
        // Formule de l'eau au prorata des personnes
        let saPartEau = totalPersonnesMaison > 0 ? (user.personnes / totalPersonnesMaison) * mtEauGlobal : 0;
        verifSommeEau += saPartEau;

        // Formule électricité au prorata des kWh
        let sesKwhBruts = kwhParUtilisateur[uIdx];
        let saPartElec = totalKwhMaison > 0 ? (sesKwhBruts / totalKwhMaison) * mtElecGlobal : 0;
        verifSommeElec += saPartElec;

        let sonTotalFoyer = saPartElec + saPartEau;

        const elElec = document.getElementById(`calculElec-${uIdx}`);
        const elEau = document.getElementById(`calculEau-${uIdx}`);
        const elTotal = document.getElementById(`calculTotal-${uIdx}`);

        if (elElec) elElec.innerHTML = `⚡ Élec (${sesKwhBruts.toFixed(1)} kWh) : ${saPartElec.toLocaleString('fr-FR', {maximumFractionDigits:2})} Ar`;
        if (elEau) elEau.innerHTML = `💧 Eau (${user.personnes} pers.) : ${saPartEau.toLocaleString('fr-FR', {maximumFractionDigits:2})} Ar`;
        if (elTotal) elTotal.innerHTML = `Total à payer : ${sonTotalFoyer.toLocaleString('fr-FR', {maximumFractionDigits:2})} Ar`;
    });

    let totalFactureCalculee = verifSommeElec + verifSommeEau;
    const elVerif = document.getElementById('verifTotaux');
    if (elVerif) {
        elVerif.innerHTML = `
            <p>Somme des parts Électricité : <strong>${verifSommeElec.toLocaleString('fr-FR', {maximumFractionDigits:2})} Ar</strong> (sur ${mtElecGlobal.toLocaleString('fr-FR')} Ar JIRAMA)</p>
            <p>Somme des parts Eau : <strong>${verifSommeEau.toLocaleString('fr-FR', {maximumFractionDigits:2})} Ar</strong> (sur ${mtEauGlobal.toLocaleString('fr-FR')} Ar JIRAMA)</p>
            <h3 style="margin:0; color:var(--success);">Montant Total Collecté : ${totalFactureCalculee.toLocaleString('fr-FR', {maximumFractionDigits:2})} Ar / ${(mtElecGlobal + mtEauGlobal).toLocaleString('fr-FR')} Ar</h3>
        `;
    }
}

// Liaison Service Worker PWA pour l'installation
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
}

genererInterface();

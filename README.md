# Oracle Demo Patterns

Ce repository démontre un mécanisme d'oracle blockchain simple utilisant des smart contracts Solidity et un script TypeScript off-chain pour les mises à jour automatiques. Il permet de maintenir des données à jour sur la blockchain avec un système de mise à jour périodique. La configuration utilise Hardhat pour le développement local et les tests.

> **⚠️ Ceci est un exemple pédagogique — pas prêt pour la production. Auditez toujours le code avant toute utilisation réelle.**

---

## Comment fonctionne l'Oracle

1. **Smart Contract Oracle** : Stocke les données et les timestamps, avec contrôle d'accès.
2. **Script Updater** : Se connecte périodiquement pour mettre à jour les données.
3. **Système d'événements** : Émet des événements pour tracer les mises à jour.
4. **Interface publique** : Permet de consulter les données actuelles.

---

## Prérequis

- Node.js (v18+ recommandé)
- npm ou yarn
- Connaissances de base en Solidity, TypeScript et développement Ethereum

---

## Installation

Clonez le repository :

```bash
git clone <your-repo-url>
cd Oracles-demo-patterns
```

Installez les dépendances :

```bash
npm install
```

Cela inclut Hardhat, Ethers.js, Axios, TypeScript et les bibliothèques de test.

Compilez les contrats Solidity :

```bash
npx hardhat compile
```

---

## Structure du Projet

```
contracts/           # Fichiers Solidity
  └─ Oracle.sol            # Contrat Oracle principal
scripts/            # Scripts TypeScript
  ├─ deploy.ts            # Déploie le contrat Oracle
  ├─ Updater.ts           # Script de mise à jour automatique
  ├─ simpleTest.ts        # Test simple de l'oracle
  ├─ testOracle.ts        # Tests complets de l'oracle
  └─ liveOracle.ts        # Test en direct de l'oracle
test/               # Tests TypeScript unitaires
  ├─ Oracle.test.ts       # Tests d'interaction avec le contrat
  └─ OracleIntegration.test.ts
ignition/           # Modules de déploiement Ignition
  └─ modules/
      └─ DeployOracle.ts  # Module de déploiement Ignition
hardhat.config.ts   # Configuration Hardhat
```

---

## Explication du Code

### Oracle.sol (Contrat Principal)

Ce contrat gère le stockage des données et les mises à jour avec contrôle d'accès. Seul l'oracleUpdater peut modifier les données.

```solidity
contract Oracle {
    uint256 private data;
    uint256 private lastUpdated;
    address public oracleUpdater;
    
    event DataUpdated(uint256 indexed value, uint256 timestamp);
    
    constructor() {
        oracleUpdater = msg.sender;
    }
    
    modifier onlyOracle() {
        require(msg.sender == oracleUpdater, "Not authorized");
        _;
    }
    
    function updateData(uint256 value) external onlyOracle {
        data = value;
        lastUpdated = block.timestamp;
        emit DataUpdated(value, block.timestamp);
    }
    
    function getData() external view returns (uint256 value, uint256 timestamp) {
        return (data, lastUpdated);
    }
}
```

- **updateData** : Met à jour les données et le timestamp, émet `DataUpdated`.
- **getData** : Retourne les données actuelles et le timestamp de la dernière mise à jour.
- **onlyOracle** : Modificateur qui restreint l'accès à l'oracleUpdater.

### Script Updater (Updater.ts)

Le script de mise à jour se connecte périodiquement à l'oracle et met à jour les données avec de nouvelles valeurs.

```typescript
async function updateOracle(): Promise<void> {
  try {
    console.log('Updating oracle...');
    
    // Pour les tests, utilise une valeur aléatoire
    const value: number = Math.floor(Math.random() * 1000);
    
    const tx: ethers.ContractTransactionResponse = await contract.updateData(value);
    await tx.wait();
    console.log(`Data updated with value: ${value}`);
  } catch (error: unknown) {
    console.error('Error during update:', error);
  }
}

// Mise à jour immédiate puis toutes les 5 minutes
updateOracle();
setInterval(updateOracle, 5 * 60 * 1000);
```

- Se connecte au réseau localhost
- Met à jour l'oracle toutes les 5 minutes
- Utilise des valeurs aléatoires pour les tests
- Gère les erreurs avec try/catch

> **Note** : Pour la production, remplacez la valeur aléatoire par un appel API réel.

---

## Utilisation Étape par Étape

### 1. Démarrer le Nœud Hardhat Local

```bash
npm run node
```

Cela démarre un serveur JSON-RPC à http://127.0.0.1:8545 avec des comptes de test prédéfinis.

> **Conseil** : Redémarrez le nœud si vous rencontrez des problèmes de nonce ou d'état (Ctrl+C puis relancez).

### 2. Déployer le Contrat Oracle

Dans un nouveau terminal :

```bash
npm run deploy:local
```

Cela déploie le contrat Oracle sur le réseau localhost.
Copiez l'adresse déployée depuis la console.
Mettez à jour cette adresse dans `scripts/Updater.ts`.

- **Déployeur** : Compte Hardhat #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`)
- **Oracle Updater** : Même compte que le déployeur

### 3. Lancer le Script de Mise à Jour

Le script de mise à jour écoute et met à jour automatiquement l'oracle :

```bash
npm run updater
```

Il utilise la clé privée du compte #0 comme oracleUpdater (autorisé dans le contrat).

### 4. Tester l'Oracle

#### Test Simple
```bash
npx hardhat run scripts/simpleTest.ts --network localhost
```

#### Tests Complets
```bash
npm run test:oracle
```

#### Tests Unitaires
```bash
npm run test
```

### 5. Vérifier les Mises à Jour

Le script de mise à jour affiche :
- Timestamp de chaque mise à jour
- Valeur mise à jour
- Erreurs éventuelles

**Sortie attendue :**
```
Updating oracle...
Updater started. Updating every 5 minutes...
Data updated with value: 847
```

> **Si des erreurs surviennent** (problèmes de connexion, nonce, etc.) :
> - Vérifiez que la clé de l'oracleUpdater correspond à celle autorisée.
> - Redémarrez le nœud et redéployez si l'état est corrompu.

---

## Configuration Avancée

### Modifier l'Intervalle de Mise à Jour

Dans `scripts/Updater.ts`, ligne 46 :
```typescript
setInterval(updateOracle, 5 * 60 * 1000); // 5 minutes
```

### Utiliser une API Réelle

Dans `scripts/Updater.ts`, remplacez les lignes 25-28 :
```typescript
// Remplacez par votre API réelle
const response = await axios.get('https://your-api.com/data');
const value: number = response.data.value;
```

### Déployer sur un Autre Réseau

1. Modifiez `hardhat.config.ts` pour ajouter votre réseau
2. Utilisez `npm run deploy` au lieu de `npm run deploy:local`

---

## Sécurité et Limitations

- **Démo simplifiée** : Ajoutez multisig, pause, audits, limites de taux pour la production.
- **Updater centralisé** : Pour la production, considérez Chainlink, zk-proofs, etc.
- **N'utilisez jamais de vrais fonds ou du code non audité !**

---

## Dépannage

- **Erreurs de Nonce** : Redémarrez le nœud Hardhat et redéployez.
- **Erreurs de Connexion** : Vérifiez que le nœud local est accessible sur `http://127.0.0.1:8545`.
- **Erreurs de Déploiement** : Nettoyez le cache avec `npm run clean`.
- **"Not authorized"** : Vérifiez la clé de l'oracleUpdater.

---

## Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm run node` | Démarre un nœud Hardhat local |
| `npm run deploy:local` | Déploie Oracle sur localhost |
| `npm run updater` | Lance le script de mise à jour automatique |
| `npm run test:oracle` | Tests complets de l'oracle |
| `npm run test` | Tests unitaires |
| `npm run compile` | Compile les contrats |
| `npm run clean` | Nettoie les artefacts de build |

---

## Surveillance

### Vérifier le Statut de l'Oracle
```bash
npx hardhat run scripts/simpleTest.ts --network localhost
```

### Suivre les Mises à Jour
Les logs du script de mise à jour affichent :
- Timestamp de chaque mise à jour
- Valeur mise à jour
- Erreurs éventuelles

---

## Prochaines Étapes

1. **Personnaliser l'API** : Remplacez l'API factice par votre vraie source de données
2. **Ajouter des Métriques** : Intégrez des outils de surveillance
3. **Déployer en Production** : Configurez pour un réseau public
4. **Ajouter des Tests** : Étendez la couverture de tests

---

## Remerciements

Inspiré par les concepts d'oracles blockchain — les contributions sont les bienvenues ! Si ce projet vous aide, merci de mettre une étoile au repo ⭐.
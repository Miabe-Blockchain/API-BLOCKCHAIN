// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Ce contrat permet de stocker et de vérifier les informations d'un diplôme.
contract DiplomaVerifier {

    // Structure de données pour un diplôme
    struct Diploma {
        string diplomaName;
        string diplomaType;
        string issuerInstitution;
        uint256 emissionDate;
        string mention;
        string diplomaNumber;
        string studentName;
        uint256 studentBirthdate;
        string studentPhone;
        address issuer;          // L'adresse blockchain de l'émetteur
        uint256 timestamp;       // Quand le diplôme a été enregistré
        bool exists;
    }

    // "Mapping" est l'équivalent d'une table de hachage en Solidity.
    // On associe un hash (représenté ici par un string) à un objet Diploma.
    mapping(string => Diploma) public diplomas;

    // Un "event" est un signal que le contrat émet.
    // Les applications peuvent écouter ces événements pour réagir aux changements.
    event DiplomaStored(
        string indexed hash,
        address indexed issuer,
        string diplomaName,
        string studentName,
        uint256 timestamp
    );

    /**
     * @dev Enregistre les détails d'un nouveau diplôme sur la blockchain.
     * Cette fonction est publique et peut être appelée par n'importe quel compte autorisé (votre serveur).
     * L'adresse de l'appelant (msg.sender) est automatiquement enregistrée comme l'émetteur.
     */
    function storeDiploma(
        string memory _hash,
        string memory _diplomaName,
        string memory _diplomaType,
        string memory _issuerInstitution,
        uint256 _emissionDate,
        string memory _mention,
        string memory _diplomaNumber,
        string memory _studentName,
        uint256 _studentBirthdate,
        string memory _studentPhone
    ) public {
        // On s'assure que ce hash de diplôme n'a pas déjà été enregistré.
        require(!diplomas[_hash].exists, "Un diplome avec ce hash existe deja");

        // On enregistre le nouveau diplôme dans le mapping.
        diplomas[_hash] = Diploma(
            _diplomaName,
            _diplomaType,
            _issuerInstitution,
            _emissionDate,
            _mention,
            _diplomaNumber,
            _studentName,
            _studentBirthdate,
            _studentPhone,
            msg.sender, // L'émetteur est celui qui envoie la transaction (votre serveur)
            block.timestamp,
            true
        );

        // On émet l'événement pour notifier les applications.
        emit DiplomaStored(_hash, msg.sender, _diplomaName, _studentName, block.timestamp);
    }

    /**
     * @dev Récupère les détails d'un diplôme à partir de son hash.
     * C'est une fonction "view", elle ne coûte pas de gaz car elle ne modifie pas l'état de la blockchain.
     */
    function getDiplomaDetails(string memory _hash)
        public
        view
        returns (
            string memory diplomaName,
            string memory diplomaType,
            string memory issuerInstitution,
            uint256 emissionDate,
            string memory mention,
            string memory diplomaNumber,
            string memory studentName,
            uint256 studentBirthdate,
            string memory studentPhone,
            address issuer,
            uint256 timestamp,
            bool exists
        )
    {
        Diploma storage d = diplomas[_hash];
        return (
            d.diplomaName,
            d.diplomaType,
            d.issuerInstitution,
            d.emissionDate,
            d.mention,
            d.diplomaNumber,
            d.studentName,
            d.studentBirthdate,
            d.studentPhone,
            d.issuer,
            d.timestamp,
            d.exists
        );
    }
} 
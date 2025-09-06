- Déplacer le mail de bienvenue vers le register ou pas (si le resend email verification ne le fait pas à nouveau, inutile de changer qqch)
- Improve: Utilise un JWT token pour la vérification d'email afin de savoir quel utilisateur essaie de vérifier son email et ainsi pouvoir lui dire si son compte est déjà vérifié ou pas
- Si un token de vérification commennce par https:// extraire, le paramètre token uniquement

- Implémenter le service d'envoi de mail et l'intégrer au service de reset 
de mot de passe
- Implémenter les fonctionnalités d'envoi de mail en masse
- Implémenter le register des apprenants en fonction des cours sélectionnés
(paiement en pending pour le moment)
- Get users avec des filtres avancés
- faire un CRUD sur les formations

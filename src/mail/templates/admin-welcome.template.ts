import { baseEmailTemplate } from './base.template';

export interface AdminWelcomeEmailProps {
  name: string;
  email: string;
  tempPassword: string;
  verificationUrl: string;
}

export const adminWelcomeEmailTemplate = ({ 
  name, 
  email, 
  tempPassword, 
  verificationUrl 
}: AdminWelcomeEmailProps): string => {
  const content = `
    <p>Bonjour ${name},</p>
    <p>Votre compte administrateur a été créé avec succès sur Register Manager !</p>
    <div class="info">
      <p><strong>Informations de connexion :</strong></p>
      <p>Email : <strong>${email}</strong></p>
      <p>Mot de passe temporaire : <strong>${tempPassword}</strong></p>
    </div>
    <div class="warning">
      <p><strong>Important :</strong> Pour des raisons de sécurité, vous devez :</p>
      <ul>
        <li>Vérifier votre adresse email en cliquant sur le bouton ci-dessous</li>
        <li>Changer votre mot de passe lors de votre première connexion</li>
      </ul>
    </div>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Vérifier mon adresse email</a>
    </div>
    <p>Une fois votre email vérifié, vous pourrez vous connecter à l'interface d'administration.</p>
    <p>Cordialement,</p>
    <p>L'équipe Register Manager</p>
  `;

  return baseEmailTemplate({
    title: 'Bienvenue - Votre compte administrateur a été créé',
    headerTitle: 'Compte Administrateur Créé',
    content
  });
};
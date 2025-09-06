import { baseEmailTemplate } from './base.template';

export interface PasswordResetTokenEmailProps {
  email: string;
  resetUrl: string;
}

export const passwordResetTokenEmailTemplate = ({ 
  email, 
  resetUrl 
}: PasswordResetTokenEmailProps): string => {
  const content = `
    <p>Bonjour,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe pour le compte associé à l'adresse email : <strong>${email}</strong></p>
    <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
    </div>
    <div class="warning">
      <p><strong>Important :</strong></p>
      <ul>
        <li>Ce lien expirera dans 1 heure pour des raisons de sécurité</li>
        <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
        <li>Votre mot de passe actuel reste valide tant que vous n'en créez pas un nouveau</li>
      </ul>
    </div>
    <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
    <div class="highlight">
      <p>${resetUrl}</p>
    </div>
    <p>Cordialement,</p>
    <p>L'équipe Register Manager</p>
  `;

  return baseEmailTemplate({
    title: 'Réinitialisation de votre mot de passe',
    headerTitle: 'Réinitialisation de mot de passe',
    content
  });
};
import { baseEmailTemplate } from './base.template';

export interface PasswordResetEmailProps {
  name: string;
  email: string;
  newPassword: string;
}

export const passwordResetEmailTemplate = ({ 
  name, 
  email, 
  newPassword 
}: PasswordResetEmailProps): string => {
  const content = `
    <p>Bonjour ${name},</p>
    <p>Votre mot de passe a été réinitialisé avec succès pour le compte : <strong>${email}</strong></p>
    <div class="info">
      <p><strong>Votre nouveau mot de passe :</strong></p>
      <p style="font-family: monospace; font-size: 16px; background-color: #f8f9fa; padding: 10px; border-radius: 4px;">${newPassword}</p>
    </div>
    <div class="warning">
      <p><strong>Pour votre sécurité :</strong></p>
      <ul>
        <li>Connectez-vous dès que possible avec ce nouveau mot de passe</li>
        <li>Changez-le immédiatement après votre connexion</li>
        <li>Ne partagez jamais vos identifiants avec qui que ce soit</li>
      </ul>
    </div>
    <p>Si vous n'avez pas demandé cette réinitialisation, contactez-nous immédiatement.</p>
    <p>Cordialement,</p>
    <p>L'équipe Register Manager</p>
  `;

  return baseEmailTemplate({
    title: 'Votre nouveau mot de passe',
    headerTitle: 'Mot de passe réinitialisé',
    content
  });
};
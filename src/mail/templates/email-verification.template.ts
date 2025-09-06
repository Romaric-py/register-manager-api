import { baseEmailTemplate } from './base.template';

export interface EmailVerificationProps {
  name: string;
  verificationUrl: string;
}

export const emailVerificationTemplate = ({ name, verificationUrl }: EmailVerificationProps): string => {
  const content = `
    <p>Bonjour ${name},</p>
    <p>Merci d'avoir créé un compte sur Register Manager. Pour finaliser votre inscription, nous avons besoin de vérifier votre adresse email.</p>
    <p>Veuillez cliquer sur le bouton ci-dessous pour confirmer votre adresse email :</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Vérifier mon adresse email</a>
    </div>
    <div class="warning">
      <p><strong>Important :</strong> Ce lien expirera dans 24 heures.</p>
      <p>Si vous n'avez pas créé de compte sur notre plateforme, vous pouvez ignorer cet email.</p>
    </div>
    <p>Si le bouton ne fonctionne pas, vous pouvez copier et coller le lien suivant dans votre navigateur :</p>
    <div class="highlight">
      <p>${verificationUrl}</p>
    </div>
    <p>Cordialement,</p>
    <p>L'équipe Register Manager</p>
  `;

  return baseEmailTemplate({
    title: 'Vérification de votre adresse email',
    headerTitle: 'Vérification de votre adresse email',
    content
  });
};
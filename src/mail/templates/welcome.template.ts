import { baseEmailTemplate } from './base.template';

export interface WelcomeEmailProps {
  name: string;
  email: string;
}

export const welcomeEmailTemplate = ({ name, email }: WelcomeEmailProps): string => {
  const content = `
    <p>Bonjour ${name},</p>
    <p>Nous sommes ravis de vous compter parmi nos utilisateurs !</p>
    <div class="highlight">
      <p>Votre compte a été créé avec l'adresse email : <strong>${email}</strong></p>
    </div>
    <p>Vous pouvez dès maintenant vous connecter à votre espace personnel et découvrir toutes nos formations disponibles.</p>
    <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
    <p>Cordialement,</p>
    <p>L'équipe Register Manager</p>
  `;

  return baseEmailTemplate({
    title: 'Bienvenue sur notre plateforme',
    headerTitle: 'Bienvenue sur Register Manager !',
    content
  });
};
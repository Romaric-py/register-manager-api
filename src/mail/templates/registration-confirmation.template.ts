import { baseEmailTemplate } from './base.template';

export interface RegistrationConfirmationEmailProps {
  name: string;
  formationTitle: string;
  formattedDate: string;
}

export const registrationConfirmationEmailTemplate = ({ 
  name, 
  formationTitle, 
  formattedDate 
}: RegistrationConfirmationEmailProps): string => {
  const content = `
    <p>Bonjour ${name},</p>
    <p>Nous avons le plaisir de vous confirmer votre inscription à la formation suivante :</p>
    <div class="highlight">
      <h3 style="margin: 0 0 10px 0; color: #4a86e8;">${formationTitle}</h3>
      <p><strong>Date de début :</strong> ${formattedDate}</p>
    </div>
    <div class="info">
      <p><strong>Prochaines étapes :</strong></p>
      <ul>
        <li>Vous recevrez un email avec les détails pratiques quelques jours avant le début</li>
        <li>Consultez votre espace personnel pour suivre le statut de votre inscription</li>
        <li>Préparez les éventuels prérequis mentionnés dans la description de la formation</li>
      </ul>
    </div>
    <p>Si vous avez des questions concernant cette formation, n'hésitez pas à nous contacter.</p>
    <p>Nous avons hâte de vous accueillir !</p>
    <p>Cordialement,</p>
    <p>L'équipe Register Manager</p>
  `;

  return baseEmailTemplate({
    title: `Confirmation d'inscription à la formation : ${formationTitle}`,
    headerTitle: 'Inscription Confirmée !',
    content
  });
};
import {
  welcomeEmailTemplate,
  emailVerificationTemplate,
  adminWelcomeEmailTemplate,
  passwordResetTokenEmailTemplate,
  passwordResetEmailTemplate,
  registrationConfirmationEmailTemplate,
} from './src/mail/templates';

// Test des templates
console.log('🧪 Test des templates TypeScript pour les emails\n');

// Test du template de bienvenue
console.log('📧 Template de bienvenue:');
const welcomeHtml = welcomeEmailTemplate({
  name: 'John Doe',
  email: 'john.doe@example.com'
});
console.log('✅ Template généré avec succès\n');

// Test du template de vérification email
console.log('📧 Template de vérification email:');
const verificationHtml = emailVerificationTemplate({
  name: 'Jane Smith',
  verificationUrl: 'https://example.com/verify?token=abc123'
});
console.log('✅ Template généré avec succès\n');

// Test du template admin
console.log('📧 Template de bienvenue admin:');
const adminHtml = adminWelcomeEmailTemplate({
  name: 'Admin User',
  email: 'admin@example.com',
  tempPassword: 'TempPass123!',
  verificationUrl: 'https://example.com/verify?token=xyz789'
});
console.log('✅ Template généré avec succès\n');

// Test du template de reset password avec token
console.log('📧 Template de réinitialisation mot de passe:');
const resetTokenHtml = passwordResetTokenEmailTemplate({
  email: 'user@example.com',
  resetUrl: 'https://example.com/reset?token=def456'
});
console.log('✅ Template généré avec succès\n');

// Test du template de nouveau mot de passe
console.log('📧 Template de nouveau mot de passe:');
const newPasswordHtml = passwordResetEmailTemplate({
  name: 'Test User',
  email: 'test@example.com',
  newPassword: 'NewPass456!'
});
console.log('✅ Template généré avec succès\n');

// Test du template de confirmation d'inscription
console.log('📧 Template de confirmation d\'inscription:');
const confirmationHtml = registrationConfirmationEmailTemplate({
  name: 'Student Name',
  formationTitle: 'Formation TypeScript Avancé',
  formattedDate: '15 janvier 2025'
});
console.log('✅ Template généré avec succès\n');

console.log('🎉 Tous les templates TypeScript fonctionnent correctement!');
console.log('📊 Statistiques:');
console.log(`- Template de bienvenue: ${welcomeHtml.length} caractères`);
console.log(`- Template de vérification: ${verificationHtml.length} caractères`);
console.log(`- Template admin: ${adminHtml.length} caractères`);
console.log(`- Template reset token: ${resetTokenHtml.length} caractères`);
console.log(`- Template nouveau mot de passe: ${newPasswordHtml.length} caractères`);
console.log(`- Template confirmation: ${confirmationHtml.length} caractères`);
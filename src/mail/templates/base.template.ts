export interface BaseTemplateProps {
  title: string;
  headerTitle: string;
  content: string;
}

export const baseEmailTemplate = ({ title, headerTitle, content }: BaseTemplateProps): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #4a86e8;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
        }
        .content {
            padding: 20px;
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 20px 0;
            background-color: #4a86e8;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeeba;
            color: #856404;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .info {
            background-color: #d1ecf1;
            border: 1px solid #bee5eb;
            color: #0c5460;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
        .highlight {
            background-color: #f8f9fa;
            padding: 10px;
            border-left: 4px solid #4a86e8;
            margin: 15px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${headerTitle}</h1>
    </div>
    <div class="content">
        ${content}
    </div>
    <div class="footer">
        <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
        <p>&copy; 2025 DataScholarHub Register App. Tous droits réservés.</p>
    </div>
</body>
</html>
  `.trim();
};
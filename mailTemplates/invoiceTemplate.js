exports.invoiceTemplate = (prop) => {
	return `<!DOCTYPE html>
	<html>
<head>
  <title>PDF Template</title>
  <style>
    body {
      font-family: Arial, sans-serif;
    }
  </style>
</head>
<body>
  <h1>Invoice for {${ prop.userName }}</h1>
  <p>Email: {${ prop.email }}</p>
  <p>Subscription Valid Till: {${ prop.subscriptionValidTill }}</p>
  <p>Invoice Generation Date: {${ prop.invoiceGenerationDate }}</p>
  <p>This is a sample PDF template.</p>
</body>
</html>`;
};

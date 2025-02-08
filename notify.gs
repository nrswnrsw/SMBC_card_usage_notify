function getCreditCardUsage() {
  var labelName = "credit_card_usage"; // Gmail label name
  var label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    Logger.log("label not found: " + labelName);
    return;
  }

  var today = new Date();
  var targetMonth = today.getMonth(); // Default is this month

  // Calculate last month's total on the 1st of every month
  if (today.getDate() === 1) {
    targetMonth -= 1;
    if (targetMonth < 0) { // If it is January, target December of the previous year
      targetMonth = 11;
    }
  }

  // Get only emails from specified month
  var messages = label.getThreads()
    .filter(thread => thread.getLastMessageDate().getMonth() === targetMonth)
    .flatMap(thread => thread.getMessages());

  var totalAmount = 0;

  messages.forEach(message => {
    var body = message.getBody(); // Get HTML email body
    var amount = extractAmountFromHtml(body);
    totalAmount += amount;
  });

  var targetLabel = (today.getDate() === 1) ? "先月" : "今月";
  Logger.log(targetLabel + "の合計利用額: " + totalAmount + "円");

  if (totalAmount > 0) {
    sendToDiscord(targetLabel, totalAmount);
  }
}

/**
 * Extract usage amount from HTML
 */
function extractAmountFromHtml(html) {
  try {
    var cleanedHtml = HtmlService.createHtmlOutput(html).getContent();
    var amountPattern = /<td[^>]*font-size:36px;[^>]*color:#00846D[^>]*>([\d,]+)円<\/td>/;
    var match = cleanedHtml.match(amountPattern);

    if (match) {
      return parseInt(match[1].replace(/,/g, ""), 10);
    }
    return 0;
  } catch (e) {
    Logger.log("HTML parsing error: " + e);
    return 0;
  }
}

/**
 * Send to Discord
 */
function sendToDiscord(targetLabel, amount) {
  var webhookUrl = "DISCORD_WEBHOOK_URL"; // Discord Webhook URL を設定

  var payload = {
    content: "## " + targetLabel + "のクレジットカード利用額: " + amount + " 円"
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(webhookUrl, options);
}

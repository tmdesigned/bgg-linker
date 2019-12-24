// send the product title as a chrome message
var title = document.getElementById("productTitle").textContent.trim();
chrome.runtime.sendMessage(title);

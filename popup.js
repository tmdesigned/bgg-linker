// Inject the payload.js script into the current tab after the popout has loaded
window.addEventListener("load", function(evt) {
  chrome.extension.getBackgroundPage().chrome.tabs.executeScript(null, {
    file: "payload.js"
  });
});

// Listen to messages from the payload.js script and write to popout.html
chrome.runtime.onMessage.addListener(function(message) {
  output("<div class='notice'>Searching for \"" + message + '"</div>');
  updateSearch(message);
  search(message);
});

//Form listener for manual searches
document.getElementById("searchForm").addEventListener("submit", function(e) {
  e.preventDefault(); //to prevent form submission
  var query = document.getElementById("query").value;
  if (!query) {
    return;
  }
  search(query);
});

//prep & trigger search and output results
function search(query) {
  searchBGG(encodeURIComponent(query), function(response) {
    var list = buildList(response);
    if (!list) {
      list = "<div class='notice'>No results for \"" + query + '"</div>';
    }
    output(list);
  });
}

function output(content) {
  document.getElementById("content").innerHTML = content;
}

function updateSearch(content) {
  document.getElementById("query").value = content;
}

//send request to BGG
function searchBGG(query, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      callback(xhr.responseXML);
    }
  };
  var url = "https://www.boardgamegeek.com/xmlapi/search?search=" + query;
  xhr.open("GET", url, true);
  xhr.send();
}

//format resultt
function buildList(responseXML) {
  var txt = "<ul>";
  var x = responseXML.getElementsByTagName("boardgame");
  if (x.length < 1) {
    return null;
  }
  for (var i = 0; i < x.length; i++) {
    txt +=
      "<li><a href='https://www.boardgamegeek.com/boardgame/" +
      x[i].getAttribute("objectid") +
      "' target='_blank'><strong>" +
      x[i].textContent;
    "</strong> <i>(" + "2000" + ")</i></li>";
  }
  txt += "</ul>";
  return txt;
}

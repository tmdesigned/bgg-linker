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
      list =
        "<div class='notice'>No results for \"" +
        query +
        '. Try adjusting the query above."</div>';
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

//format result
function buildList(responseXML) {
  var txt = "<ul>";
  var x = responseXML.getElementsByTagName("boardgame");
  if (x.length < 1) {
    return null;
  }
  var length = x.length > 9 ? 9 : x.length;
  for (let i = 0; i < length; i++) {
    let oid = x[i].getAttribute("objectid");
    setTimeout(function() {
      fetchDetails(oid, addDetails);
    }, 500 * i);
    txt +=
      "<li><div class='list-item' id='item-" +
      oid +
      "'><div class='list-item__thumbnail'></div><div class='list-item__details'><a href='https://www.boardgamegeek.com/boardgame/" +
      oid +
      "' target='_blank' class='list-item__link'>" +
      x[i].textContent +
      "</a><br /><span class='list-item__rank'></strong></div></div></li>";
  }
  txt += "</ul>";
  return txt;
}

function addDetails(oid, xml) {
  var rank = getRank(xml);
  var thumbnail = getThumbnail(xml);
  addRank(oid, rank);
  addThumbnail(oid, thumbnail);
}

function getRank(xml) {
  var raw = xml.getElementsByTagName("average");
  if (raw.length < 1) {
    return "";
  }
  var rawUsers = xml.getElementsByTagName("usersrated");
  var votes = rawUsers.length > 0 ? rawUsers[0].textContent : "";
  var rank = Math.round(Number(raw[0].textContent) * 10) / 10;
  return `${rank}/10 (${votes} votes)`;
}

function addRank(oid, rank) {
  document.querySelector("#item-" + oid + " .list-item__rank").innerHTML = rank;
}

function getThumbnail(xml) {
  var raw = xml.getElementsByTagName("thumbnail");
  if (raw.length < 1) {
    return "";
  }
  return raw[0].textContent;
}

function addThumbnail(oid, thumbnail) {
  document.querySelector("#item-" + oid + " .list-item__thumbnail").innerHTML =
    "<img src='" + thumbnail + "' alt=''/>";
}

function fetchDetails(oid, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      callback(oid, xhr.responseXML);
    }
  };
  var url =
    "https://www.boardgamegeek.com/xmlapi/boardgame/" + oid + "?stats=1";
  xhr.open("GET", url, true);
  xhr.send();
}

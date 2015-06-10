// Initialize scripts on the page
$(document).ready(function () {
  ErrorReporting.init(); // Enable global error handling
  TabHistory.init();  // Implement persistent tabs
  GithubLogin.init(); // Enable github login
  AnchorLinks.init(); // Anchor Links
});

// Error reporting module
ErrorReporting = {
  // Initialize global error handling
  init : function() {
    // Report all uncaught errors to honeybadger
    window.onerror = function(errorMsg, url, lineNumber, column, errorObj) {
      if (errorMsg && url && lineNumber) {
        ErrorReporting.report(errorMsg, { "url" : url, "lineNumber" : lineNumber, "column" : column, "errorObj" : errorObj });
      }
      return false;
    }
  },
  // ErrorReporting.report(ex, { 'foo' : 'bar' })
  report : function(ex, context) {
    if (typeof(Honeybadger) != "undefined") {
      Honeybadger.notify(ex, { "context" : context });
    } else if (typeof(console) != "undefined") { // not production
      alert("error: " + ex);
      console.error(ex, context);
    }
  }
}

// Implements persistent tab history for bootstrap tabs
// Source: https://gist.github.com/josheinstein/5586469
// And: http://redotheweb.com/2012/05/17/enable-back-button-handling-with-twitter-bootstrap-tabs-plugin.html
TabHistory = {
  // Hooks up events needed for persistent tab history
  init : function() {
     // Store original title for use when switching tabs
     TabHistory.originalDocumentTitle = document.title;

     // When a tab is clicked, push that to the history
     $("a[data-toggle='tab']").on('click', function() {
       $(this).data("history", true);
     });

     // When tab is selected, append the hashtag to url and change page title
     $("a[data-toggle='tab']").on("shown.bs.tab", function (e) {
         var hash = $(e.target).attr("href");
         if (hash.substr(0,1) == "#" && $(this).data("history")) {
             // push hash state onto the history stack
             var hashSuffix = "#!" + hash.substr(1);
             history.pushState(null, null, hashSuffix);
             // reset temporary height styles for section content
             $('.section-content').removeAttr('style');
             // set title based on tab selected
             TabHistory.setPageTitle(e.target)
         }
     });

     // onready go to the tab requested in the page hash
     TabHistory.gotoHashTab();

     // when a link within a tab is clicked, still go to the tab requested
     $('.tab-pane a').click(function (event) {
         if (event.target.hash) {
             TabHistory.gotoHashTab(event.target.hash, true);
         }
     });

     // Handles when back button is pressed
     // Don't add back button presses to history (creates double history in back stack)
     window.addEventListener("popstate", function(e) {
       TabHistory.gotoHashTab(location.hash, false);
     });
  },
  // Based on the push history and the custom hash, activate a particular tab for the week
  gotoHashTab : function (customHash, pushHistory) {
      if (pushHistory == undefined) { pushHistory = true; }
      var defaultTabHash = $('.nav-tabs li:first-child a').attr("href"); // first tab
      if (defaultTabHash) { defaultTabHash = defaultTabHash.replace(/^#/, '#!'); }
      var hash = customHash || location.hash || defaultTabHash;
      if (hash) {
        var hashPieces = hash.split('?'),
            activeTab = $('[href="#' + hashPieces[0].substr(2) + '"]');
        if (activeTab.length > 0) { TabHistory.setPageTitle(activeTab); }
        activeTab && activeTab.data("history", pushHistory) && activeTab.tab('show');
      }
  },
  // Set page title based on tab given
  setPageTitle : function(tab) {
    document.title = $(tab).text() + ": " + TabHistory.originalDocumentTitle;
  }
};

// Setup github session authentication, retrieving user info and passing to server
GithubLogin = {
  init : function() {
    // Initialize with oauth.io
    OAuth.initialize('S3W__EOBzJWmlRhEs6amqbg2xic');
    // Login with Github!
    $("a.github-auth").on("click", function() {
      // show loader gif, hide button
      GithubLogin.setLoadingState(true);
      // Begin authentication process
      OAuth.popup('github', function(error, result) {
        if (error) { // handle error, hide loader gif, show button
          GithubLogin.flashError();
        } else { // no error, success
          $('div.session-error-alert').hide();
          // get user data and send to session endpoint
          GithubLogin.fetchUserFromResult(result);
        }
      });
    });
  },
  // fetch user from oauth and post to portal
  fetchUserFromResult : function(result) {
    result.get("user").done(function(data) {
      // send data to server to authorize
      GithubLogin.authenticateWithPortal(data);
    });
  },
  // send data to server to authorize
  authenticateWithPortal : function(user) {
    try {
      $.ajax({
        url: $("#login").data("url"), crossDomain: true,
        type: "POST", dataType: "json",
        data: { 'user' : user }
      }).done(function(data, textStatus) {
        // success redirect to root
        window.location = "/"
      }).fail(function(req, textStatus, errorThrown) {
        // show error
        GithubLogin.flashError();
      });
    } catch(e) {
      GithubLogin.flashError();
      // notify if javascript error occurs
      ErrorReporting.report(e);
    }
  },
  // Sets UI for loading or not loading by changing visibility
  setLoadingState : function(loading) {
    if (loading) {
      $("a.github-auth").hide();
      $("#login .loader").show();
    } else { // not loading
      $("a.github-auth").show();
      $("#login .loader").hide();
    }
  },
  // Display flash message error
  flashError : function(message) {
    GithubLogin.setLoadingState(false);
    var alertEl = $('div#session-error-alert');
    var supportEmail = alertEl.find("span").data("support-email");
    if (!message) { message = "The authentication process has failed unexpectedly! Please try logging in again or \
      <a class='alert-link' href='mailto:" + supportEmail + "'>let us know about this error</a>." }
    alertEl.show().find("span").html(message);
  }
};

// Manage anchors being clickable for h4 headings
AnchorLinks = {
  init : function() {
    $(document).on('click', ".section-content h4", function(e) {
      var anchor = $(this).find("a");
      if (anchor.length == 0) { return; } // stop if on tabs with tab history
      if (location.hash.match(/\!/) != null) { return; }
      if (anchor.attr("href") != null) { SmoothScroll.toTarget(anchor.attr("href")); }
    });
  }
}

// Smooth scrolling
// SmoothScroll.toTarget("some-hash");
SmoothScroll = {
  toTarget : function(target) {
    var scrollOffset = 8;
    var sidebarEl = $(".markdown-toc");
    $target = $(target);
    var currentOffset = $(window).scrollTop();
    var targetOffset = $target.offset().top - scrollOffset;
    if (Math.abs(currentOffset - targetOffset) < 10) { return false; }
    sidebarEl.css("visibility", "hidden"); // hide to avoid glitchy animation
    $('html, body').stop().animate({
        'scrollTop': targetOffset
    }, 900, 'swing', function () {
        window.location.hash = target;
        sidebarEl.css("visibility", "visible"); // show toc again
    });
  }
}
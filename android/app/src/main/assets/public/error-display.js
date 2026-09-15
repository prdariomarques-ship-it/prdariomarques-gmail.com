window.onerror = function(message, source, lineno, colno, error) {
  document.body.innerHTML += '<div style="color:red; background:white; position:fixed; top:0; left:0; z-index:9999; padding:20px; width:100%; font-family:monospace;"><h3>Global Error</h3>' + message + '<br>' + source + ':' + lineno + '<br><pre>' + (error ? error.stack : '') + '</pre></div>';
};
window.addEventListener('unhandledrejection', function(event) {
  document.body.innerHTML += '<div style="color:red; background:white; position:fixed; top:0; left:0; z-index:9999; padding:20px; width:100%; font-family:monospace;"><h3>Unhandled Promise Rejection</h3>' + event.reason + '</div>';
});
console.log('Error display script loaded');

/* Invite / recovery из письма Netlify → сразу в /admin/ (до defer-скриптов). */
(function () {
  var path = location.pathname || '';
  if (/\/admin(\/|$|\/index\.html)/i.test(path)) return;
  var suffix = (location.search || '') + (location.hash || '');
  if (!/(invite_token|confirmation_token|recovery_token)=/i.test(suffix)) return;
  location.replace('/admin/' + suffix);
})();

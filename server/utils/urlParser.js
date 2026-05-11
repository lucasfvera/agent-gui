const { PORT } = require('../config');

function parseUrl(req) {
  const rawUrl = req.url;
  const baseUrl = `http://localhost:${PORT}`;

  let urlObj;
  try {
    urlObj = new URL(rawUrl, baseUrl);
  } catch (e) {
    const safeUrl = rawUrl.split('?')[0];
    return {
      pathname: safeUrl,
      searchParams: new URLSearchParams()
    };
  }

  return {
    pathname: urlObj.pathname,
    searchParams: urlObj.searchParams
  };
}

function parseApiPath(pathname) {
  const cleanPath = pathname.split('?')[0];
  const segments = decodeURIComponent(cleanPath).split('/').filter(Boolean);
  return segments;
}

module.exports = { parseUrl, parseApiPath };
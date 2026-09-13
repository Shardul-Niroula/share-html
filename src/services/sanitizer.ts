import { SecurityReport } from '../types/types';

/**
 * Validates and inspects HTML/JS content for unsafe constructs.
 * In a strict preview environment, we identify suspicious patterns
 * like external script injection or cookie stealing attempts.
 */
export function validateCodeSecurity(html: string, js: string): SecurityReport {
  const warnings: string[] = [];
  let hasExternalScripts = false;
  let hasDangerousTags = false;

  // Check for external scripts with non-whitelisted remote sources
  const externalScriptRegex = /<script\b[^>]*\bsrc=["']?(https?:\/\/[^"'>]+)["']?[^>]*>/gi;
  let match;
  while ((match = externalScriptRegex.exec(html)) !== null) {
    hasExternalScripts = true;
    const src = match[1];
    // We allow standard CDNs like cdnjs, unpkg, cdn.jsdelivr.net, esm.sh
    const isAllowedCdn = /^(https:\/\/cdnjs\.cloudflare\.com|https:\/\/cdn\.jsdelivr\.net|https:\/\/unpkg\.com|https:\/\/esm\.sh)/.test(src);
    if (!isAllowedCdn) {
      warnings.push(`External script source detected: "${src}". Sandboxed environment will isolate execution.`);
    }
  }

  // Check for dangerous access attempts
  if (js.includes('document.cookie') || js.includes('window.localStorage') || js.includes('window.sessionStorage')) {
    warnings.push('Script references sensitive storage objects. Sandboxing isolates iframe origin from parent application.');
  }

  if (/<iframe/i.test(html)) {
    warnings.push('Nested iframe detected inside snippet.');
  }

  if (/<object|<embed|<applet/i.test(html)) {
    hasDangerousTags = true;
    warnings.push('Plugin-based tag (<object>, <embed>, <applet>) detected and blocked by browser sandbox.');
  }

  return {
    isSafe: warnings.length === 0,
    warnings,
    sanitizedHtml: html,
    hasExternalScripts,
    hasDangerousTags,
  };
}

/**
 * Bundles HTML, CSS, and JS into a complete self-contained executable document
 * with an injected console listener to capture iframe errors and logs.
 * Intelligently handles both full HTML documents (with <!DOCTYPE>, <html>, <head>, <body>)
 * and partial HTML snippets without invalid nesting.
 */
export function buildSandboxedDocument(html: string, css: string, js: string): string {
  const consoleScript = `<script>
    (function() {
      function sendToParent(type, args) {
        try {
          var stringified = Array.prototype.slice.call(args).map(function(arg) {
            if (typeof arg === 'object') {
              try { return JSON.stringify(arg, null, 2); } catch (e) { return String(arg); }
            }
            return String(arg);
          }).join(' ');
          window.parent.postMessage({ type: 'CONSOLE_MESSAGE', payload: { type: type, text: stringified, timestamp: new Date().toLocaleTimeString() } }, '*');
        } catch (e) {}
      }

      var origLog = console.log;
      var origWarn = console.warn;
      var origError = console.error;
      var origInfo = console.info;

      console.log = function() { sendToParent('log', arguments); origLog && origLog.apply(console, arguments); };
      console.warn = function() { sendToParent('warn', arguments); origWarn && origWarn.apply(console, arguments); };
      console.error = function() { sendToParent('error', arguments); origError && origError.apply(console, arguments); };
      console.info = function() { sendToParent('info', arguments); origInfo && origInfo.apply(console, arguments); };

      window.addEventListener('error', function(event) {
        sendToParent('error', [event.message + (event.lineno ? ' at line ' + event.lineno : '')]);
      });
    })();
  </script>`;

  const userStyleTag = css && css.trim() ? `<style>\n${css}\n</style>` : '';
  const userScriptTag = js && js.trim() ? `<script>\ntry {\n${js}\n} catch (err) {\n  console.error(err);\n}\n</script>` : '';

  const trimmedHtml = (html || '').trim();
  const isFullDocument = /^<!DOCTYPE/i.test(trimmedHtml) || /<html\b/i.test(trimmedHtml) || /<head\b/i.test(trimmedHtml) || /<body\b/i.test(trimmedHtml);

  if (isFullDocument) {
    let result = trimmedHtml;

    // Ensure <!DOCTYPE html> at the start
    if (!/^<!DOCTYPE/i.test(result)) {
      result = `<!DOCTYPE html>\n` + result;
    }

    // Ensure responsive meta viewport tag exists if not present
    if (!/<meta[^>]*name=["']?viewport["']?/i.test(result) && !/<meta[^>]*content=["'][^"']*width=device-width/i.test(result)) {
      if (/<head\b[^>]*>/i.test(result)) {
        result = result.replace(/<head\b[^>]*>/i, `$&<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
      }
    }

    // Inject console interception and custom CSS into <head>
    const headInjection = `${consoleScript}\n${userStyleTag}`;
    if (/<\/head>/i.test(result)) {
      result = result.replace(/<\/head>/i, `${headInjection}\n</head>`);
    } else if (/<head\b[^>]*>/i.test(result)) {
      result = result.replace(/<head\b[^>]*>/i, `$&\n${headInjection}`);
    } else if (/<body\b[^>]*>/i.test(result)) {
      result = result.replace(/<body\b[^>]*>/i, `<head><meta name="viewport" content="width=device-width, initial-scale=1.0">${headInjection}</head>\n$&`);
    } else {
      result = `${headInjection}\n${result}`;
    }

    // Inject user JS script before </body>
    if (userScriptTag) {
      if (/<\/body>/i.test(result)) {
        result = result.replace(/<\/body>/i, `${userScriptTag}\n</body>`);
      } else {
        result = `${result}\n${userScriptTag}`;
      }
    }

    return result;
  }

  // Fragment snippet case - wrap in a standard clean HTML5 document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      font-family: system-ui, -apple-system, sans-serif;
    }
    ${css}
  </style>
  ${consoleScript}
</head>
<body>
  ${trimmedHtml}
  ${userScriptTag}
</body>
</html>`;
}

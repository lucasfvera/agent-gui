function log(method, path, inputs, status, extra = '') {
  const timestamp = new Date().toISOString();
  const inputStr = typeof inputs === 'object' 
    ? JSON.stringify(inputs).replace(/"/g, '')
    : String(inputs);
  console.log(`[${timestamp}] ${method} ${path} | Inputs: ${inputStr} | Status: ${status}${extra}`);
}

function logStart(method, path, inputs) {
  log(method, path, inputs, 'start');
}

function logEnd(method, path, inputs, status, extra = '') {
  log(method, path, inputs, status, extra);
}

module.exports = { log, logStart, logEnd };
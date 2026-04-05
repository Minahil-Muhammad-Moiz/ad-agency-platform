const { v4: uuidv4 } = require('uuid');

function generateRequestId() {
    return uuidv4();
}

function logRequest(requestId, endpoint, data) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${requestId}] ${endpoint}`, JSON.stringify(data));
}

module.exports = {
    generateRequestId,
    logRequest,
    requestLogger: (req, res, next) => {
        req.requestId = generateRequestId();
        logRequest(req.requestId, req.method + ' ' + req.path, req.body);
        next();
    }
};
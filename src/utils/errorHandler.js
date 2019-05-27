export function handleUnknownError(err, req, res) {
    console.error(err.message, ` | from: ${req.originalUrl} | `, err.stack);
    res.status(500).json(getErrorResponse(500, 'Internal Error'));
}

export function getErrorResponse(code, message) {
    return {
        hasError: true,
        code,
        message,
    };
}

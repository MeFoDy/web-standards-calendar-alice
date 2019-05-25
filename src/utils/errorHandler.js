export function handleUnknownError(err, req, res, next) {
    console.error(err.message, ` | from: ${req.originalUrl}`);
    res.status(500).json(getErrorResponse(500, 'Internal Error'));
}

export function getErrorResponse(code, message) {
    return {
        hasError: true,
        code,
        message,
    };
}
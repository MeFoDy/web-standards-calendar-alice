export function joinUrlParts(basePath, requestPath) {
    return basePath + (requestPath.startsWith('/') ? '' : '/') + requestPath;
}

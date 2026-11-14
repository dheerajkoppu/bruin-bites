export function requireLogin(request, response, next) {
    if(!request.session.userId) {
        return response.status(401).json({ error: "You must be logged in" });
    }
    next();
}
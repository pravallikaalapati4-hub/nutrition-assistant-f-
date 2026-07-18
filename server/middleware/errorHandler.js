// Central error handler — every asyncHandler-wrapped controller and any
// thrown ApiError ends up here instead of leaking a stack trace to the client.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(statusCode).json({
    message: err.message || 'Something went wrong on the server',
  });
}

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };

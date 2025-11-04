
export function middleware (req, res, next) {
  console.info('test middleware running');

  next();
}
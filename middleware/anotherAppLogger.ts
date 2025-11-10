export default function middleware (req, res, next) {
  console.log('2', req.url);

  next();
} 
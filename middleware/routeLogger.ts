export default function middleware (req, res, next) {
  console.log('logging on the route');

  next();
} 
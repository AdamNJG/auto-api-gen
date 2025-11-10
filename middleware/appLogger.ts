export default function middleware (req, res, next) {
  console.log(req.url);

  next();
} 